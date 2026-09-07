/**
 * InvoiceDemoPage — PUBLIC route (/invoice-demo)
 * No authentication required. Parses PDF / CSV entirely in the browser.
 * Uses the same visual result design as InvoicesPage (InvoiceDetail).
 */
import React, { useState, useRef, useCallback } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Upload,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  BarChart2,
  Calendar,
  Receipt,
  Tag,
  CreditCard,
  Layers,
  CloudUpload,
  RefreshCw,
  Sparkles,
  CheckCircle,
  X,
  Info,
  ArrowLeft,
  Zap,
  Shield,
  Building2,
  Server,
  Globe,
  Users,
  Activity,
  Database,
  ChevronDown,
  ChevronUp,
  MapPin,
} from "lucide-react";
import PropTypes from "prop-types";

/* ── Constants ─────────────────────────────────────────────── */

const AZURE_COLORS = [
  "#0078D4",
  "#2196F3",
  "#42A5F5",
  "#64B5F6",
  "#00B4D8",
  "#0096C7",
  "#5E60CE",
  "#48CAE4",
];
const AWS_COLORS = [
  "#FF9900",
  "#FF6B00",
  "#FFB347",
  "#FFA500",
  "#E07B00",
  "#FFCC80",
  "#D4820A",
  "#FFD580",
];
const BTP_COLORS = [
  "#0070F2",
  "#0057A8",
  "#00B4D8",
  "#F0AB00",
  "#1BA04B",
  "#5E60CE",
  "#3A86FF",
  "#06D6A0",
];
const AZURE_CSP_RATE = 0.07; // 7 % Maitsys CSP discount
const AWS_CSP_RATE = 0.035; // 3.5 %
const BTP_CSP_RATE = 0.02; // 2 %
const GCP_CSP_RATE = 0.035; // 3.5 %

/* ── Brand icons ───────────────────────────────────────────── */

const AzureIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path d="M5.9 21h7.8l5.7-14.2h-7.3L5.9 21Z" fill="#0078D4" />
    <path d="M5.9 21L.1 6.8h6.7l3.1 7.4L5.9 21Z" fill="#0078D4" />
    <path d="M12.3 20.6 19.5 3.5h-6.9L9.9 10l2.4 10.6Z" fill="#5EA0EF" />
  </svg>
);
AzureIcon.propTypes = { className: PropTypes.string };

const AwsIcon = ({ className }) => (
  <svg viewBox="0 0 60 36" className={className} fill="none">
    <text
      x="5"
      y="28"
      fontFamily="Arial Black,Arial"
      fontWeight="900"
      fontSize="26"
      fill="#FF9900"
    >
      AWS
    </text>
  </svg>
);
AwsIcon.propTypes = { className: PropTypes.string };

const BtpIcon = ({ className }) => (
  <svg viewBox="0 0 60 36" className={className} fill="none">
    <text
      x="2"
      y="28"
      fontFamily="Arial Black,Arial"
      fontWeight="900"
      fontSize="22"
      fill="#0070F2"
    >
      BTP
    </text>
    <text
      x="2"
      y="36"
      fontFamily="Arial,sans-serif"
      fontWeight="700"
      fontSize="7"
      fill="#0057A8"
      letterSpacing="0.5"
    >
      SAP
    </text>
  </svg>
);
BtpIcon.propTypes = { className: PropTypes.string };

/* ── Helpers ───────────────────────────────────────────────── */

const fmtDate = (s) => {
  if (!s) return "—";
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) {
    const d = new Date(`${m[3]}-${m[1]}-${m[2]}`);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return s;
};

const formatCurrency = (v, currency = "USD") => {
  if (v == null || isNaN(Number(v))) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
  }).format(Number(v));
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/* ── Sample / demo data ───────────────────────────────────────
 * Lets a visitor see a fully parsed result without uploading a
 * real invoice. Shape mirrors what parsePDFInBrowser()/parseBTPXlsx()
 * return, so it flows through ParsedResult unmodified.
 */
const SAMPLE_INVOICE_RESULT = {
  provider: "azure",
  currency: "USD",
  month: 8,
  year: 2026,
  invoiceNumber: "INV-AZR-2026-08-004821",
  billingProfile: "Contoso Corp — EA Enrollment 70142",
  poNumber: "PO-88213",
  contractNumber: "MCA-2026-0091",
  billingPeriodStart: "08/01/2026",
  billingPeriodEnd: "08/31/2026",
  invoiceDate: "09/01/2026",
  dueDate: "09/15/2026",
  charges: 12434.0,
  taxAmount: 994.72,
  taxRate: 8,
  totalCost: 13428.72,
  totalSavings: 1174.8,
  services: [
    { name: "Virtual Machines", cost: 4820.35, savings: 482.03 },
    { name: "Azure SQL Database", cost: 2150.75, savings: 215.08 },
    { name: "Azure Kubernetes Service", cost: 1560.2, savings: 156.02 },
    { name: "Storage Accounts", cost: 1240.1, savings: 124.01 },
    { name: "App Service", cost: 980.4, savings: 98.04 },
    { name: "Cognitive Services", cost: 675.25, savings: 67.53 },
    { name: "Virtual Network", cost: 430.6, savings: 0 },
    { name: "Azure Backup", cost: 320.9, savings: 32.09 },
    { name: "Azure Monitor", cost: 210.15, savings: 0 },
    { name: "Key Vault", cost: 45.3, savings: 0 },
  ],
  sections: [
    { name: "Compute", total: 7949.93, tax: 588.98 },
    { name: "Databases", total: 2322.86, tax: 172.11 },
    { name: "Storage", total: 1685.87, tax: 124.87 },
    { name: "Networking & Other", total: 1470.24, tax: 108.94 },
  ],
};

/* ── Sub-components ────────────────────────────────────────── */

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 ${className}`}
    style={{
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
    }}
  >
    {children}
  </div>
);
Card.propTypes = { children: PropTypes.node, className: PropTypes.string };

const DeltaBadge = ({ pct }) => {
  if (pct === null) return <span className="badge badge-gray">First</span>;
  if (Math.abs(pct) < 0.5)
    return (
      <span className="badge badge-gray flex items-center gap-1">
        <Minus className="w-3 h-3" />
        Flat
      </span>
    );
  const up = pct > 0;
  return (
    <span
      className={`badge flex items-center gap-1 ${up ? "badge-red" : "badge-green"}`}
    >
      {up ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {up ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
};
DeltaBadge.propTypes = { pct: PropTypes.number };

const MetaChip = ({ icon: Icon, label, value, accent = "gray" }) => {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800",
    green:
      "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800",
    orange:
      "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-800",
    gray: "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-700",
  }[accent];
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${colors}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
      <span className="text-[10px] tracking-wide opacity-60 shrink-0">
        {label}
      </span>
      <span className="font-bold truncate">{value || "—"}</span>
    </div>
  );
};
MetaChip.propTypes = {
  icon: PropTypes.elementType,
  label: PropTypes.string,
  value: PropTypes.string,
  accent: PropTypes.string,
};

const KpiTile = ({ label, value, sub, accent = "gray", large = false }) => {
  const accents = {
    blue: "from-blue-500/10 to-transparent border-blue-100 dark:border-blue-900",
    green:
      "from-emerald-500/10 to-transparent border-emerald-100 dark:border-emerald-900",
    red: "from-red-500/10 to-transparent border-red-100 dark:border-red-900",
    gray: "from-gray-500/5 to-transparent border-gray-100 dark:border-gray-800",
    orange:
      "from-orange-500/10 to-transparent border-orange-100 dark:border-orange-900",
  }[accent];
  const len = String(value).length;
  const fontSize = large
    ? len > 13
      ? "text-sm"
      : len > 10
        ? "text-base"
        : "text-xl"
    : len > 13
      ? "text-xs"
      : "text-sm";
  return (
    <div className={`rounded-xl border p-3 min-w-0 ${accents}`}>
      <p className="text-[10px] font-bold tracking-wider text-gray-400 mb-1 truncate">
        {label}
      </p>
      <p
        className={`font-bold text-gray-900 dark:text-white tabular-nums leading-tight break-all ${fontSize}`}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-gray-400 mt-0.5 font-medium truncate">
          {sub}
        </p>
      )}
    </div>
  );
};
KpiTile.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sub: PropTypes.string,
  accent: PropTypes.string,
  large: PropTypes.bool,
};

const CustomTooltip = ({ active, payload, total }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-lg">
      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
        {payload[0].name}
      </p>
      <p
        className="text-sm font-bold"
        style={{ color: payload[0].payload.fill }}
      >
        {formatCurrency(payload[0].value)}
      </p>
      <p className="text-[10px] text-gray-400">
        {((payload[0].value / total) * 100).toFixed(1)}% of total
      </p>
    </div>
  );
};
CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  total: PropTypes.number,
};

/* ── CSV parser (frontend port of backend invoiceParser.ts) ── */

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ""));
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ""));
  return result;
}

function findCol(headers, candidates) {
  for (const c of candidates) {
    const idx = headers.findIndex(
      (h) => h === c || h.endsWith("/" + c) || h.endsWith("_" + c),
    );
    if (idx >= 0) return idx;
  }
  return -1;
}

function toCost(s) {
  return parseFloat((s || "").replace(/[^0-9.-]/g, "")) || 0;
}

function extractDateFromStr(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  if (!isNaN(d.getTime()))
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  const m = raw.match(/(\d{4})[/-](\d{1,2})/);
  if (m) return { month: parseInt(m[2]), year: parseInt(m[1]) };
  return null;
}

function buildServices(map) {
  return Object.entries(map)
    .map(([name, cost]) => ({
      name: name || "Other",
      cost: Math.round(cost * 100) / 100,
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 20);
}

function applyAzureSavings(services) {
  return services.map((svc) => ({
    ...svc,
    savings: Math.round(svc.cost * AZURE_CSP_RATE * 100) / 100,
  }));
}
function applyAwsSavings(services) {
  return services.map((svc) => ({
    ...svc,
    savings: Math.round(svc.cost * AWS_CSP_RATE * 100) / 100,
  }));
}
function applyBtpSavings(services) {
  return services.map((svc) => ({
    ...svc,
    savings: Math.round(svc.cost * BTP_CSP_RATE * 100) / 100,
  }));
}

function parseCSV(content, hintProvider) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2)
    throw new Error("CSV file is empty or contains no data rows");
  const headers = parseCSVLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/["\s]/g, ""),
  );

  const isAws = headers.some(
    (h) =>
      h.startsWith("lineitem/") ||
      h === "productcode" ||
      h === "productname" ||
      h === "unblendedcost" ||
      h === "blendedcost" ||
      h === "amortizedcost",
  );
  const isAzure = headers.some(
    (h) =>
      h === "servicename" ||
      h === "servicefamily" ||
      h === "consumedservice" ||
      h === "costinbillingcurrency" ||
      h === "extendedcost" ||
      h === "pre-taxcost" ||
      h === "metercategory" ||
      h === "billingcurrencycode" ||
      (headers.includes("usagedate") &&
        headers.includes("costusd") &&
        headers.includes("currency")) ||
      (headers.includes("resourcetype") && headers.includes("costusd")) ||
      (headers.includes("subscriptionname") &&
        headers.includes("subscriptionid") &&
        headers.includes("costusd")),
  );
  const isBtp =
    headers.includes("globalaccountname") ||
    headers.includes("globalaccount") ||
    (headers.includes("service") &&
      headers.includes("plan") &&
      headers.includes("consumption")) ||
    (headers.includes("servicename") &&
      headers.includes("planname") &&
      (headers.includes("chargedquantity") || headers.includes("cost"))) ||
    headers.includes("btpservice") ||
    headers.includes("sapservice");

  if (hintProvider === "azure" && isAws && !isAzure)
    throw new Error(
      "Wrong document: you selected Azure but this file appears to be an AWS export.",
    );
  if (hintProvider === "aws" && isAzure && !isAws)
    throw new Error(
      "Wrong document: you selected AWS but this file appears to be an Azure export.",
    );
  if (hintProvider === "btp" && (isAws || isAzure) && !isBtp)
    throw new Error(
      "Wrong document: you selected SAP BTP but this file appears to be an AWS/Azure export.",
    );

  let provider = hintProvider;
  if (!provider) {
    if (isBtp) provider = "btp";
    else if (isAws) provider = "aws";
    else if (isAzure) provider = "azure";
    else
      throw new Error(
        "Could not auto-detect cloud provider from CSV headers. Please select provider manually.",
      );
  }

  if (provider === "aws") {
    const costCol = findCol(headers, [
      "unblendedcost",
      "blendedcost",
      "amortizedcost",
      "costusd",
      "cost",
    ]);
    const serviceCol = findCol(headers, [
      "productcode",
      "productname",
      "product",
      "servicecode",
    ]);
    const dateCol = findCol(headers, [
      "usagestartdate",
      "billingperiodstartdate",
      "invoicedate",
      "usagedate",
      "date",
    ]);
    if (costCol === -1) throw new Error("Cannot find cost column in AWS CSV");
    const serviceCosts = {};
    let total = 0,
      month = 0,
      year = 0;
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      const cost = toCost(row[costCol]);
      if (cost <= 0) continue;
      total += cost;
      const raw = serviceCol >= 0 ? row[serviceCol] || "Other" : "Other";
      const svc = raw.replace(/^Amazon\s+|^AWS\s+/i, "").trim() || "Other";
      serviceCosts[svc] = (serviceCosts[svc] || 0) + cost;
      if (month === 0 && dateCol >= 0) {
        const parsed = extractDateFromStr(row[dateCol]);
        if (parsed) {
          month = parsed.month;
          year = parsed.year;
        }
      }
    }
    if (month === 0) {
      const n = new Date();
      month = n.getMonth() + 1;
      year = n.getFullYear();
    }
    const totalCost = Math.round(total * 100) / 100;
    return {
      provider: "aws",
      month,
      year,
      totalCost,
      currency: "USD",
      services: applyAwsSavings(buildServices(serviceCosts)),
      totalSavings: Math.round(totalCost * AWS_CSP_RATE * 100) / 100,
    };
  }

  // SAP BTP CSV
  if (provider === "btp") {
    const costCol = findCol(headers, [
      "cost",
      "charges",
      "totalcost",
      "amount",
      "chargedquantity",
      "paygcost",
    ]);
    const serviceCol = findCol(headers, [
      "servicename",
      "service",
      "btpservice",
      "sapservice",
      "technicalservicename",
    ]);
    const planCol = findCol(headers, [
      "planname",
      "plan",
      "serviceplan",
      "btpplan",
    ]);
    const dateCol = findCol(headers, [
      "reportdate",
      "date",
      "month",
      "billingperiod",
      "usagedate",
    ]);
    const currencyCol = findCol(headers, ["currency", "billingcurrency"]);
    const subaccountCol = findCol(headers, [
      "subaccountname",
      "subaccount",
      "directoryname",
      "directory",
    ]);
    if (costCol === -1)
      throw new Error("Cannot find cost column in SAP BTP CSV");
    const serviceCosts = {};
    let total = 0,
      month = 0,
      year = 0,
      currency = "USD";
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      const cost = toCost(row[costCol]);
      if (cost <= 0) continue;
      total += cost;
      const svcRaw = serviceCol >= 0 ? row[serviceCol] || "Other" : "Other";
      const planRaw = planCol >= 0 ? row[planCol] || "" : "";
      const subRaw = subaccountCol >= 0 ? row[subaccountCol] || "" : "";
      // Build label: "ServiceName / Plan" or just "ServiceName"
      const label = planRaw
        ? `${svcRaw.trim()} / ${planRaw.trim()}`
        : subRaw
          ? `${svcRaw.trim()} (${subRaw.trim()})`
          : svcRaw.trim() || "Other";
      serviceCosts[label] = (serviceCosts[label] || 0) + cost;
      if (currencyCol >= 0 && currency === "USD" && row[currencyCol])
        currency = row[currencyCol].trim() || "USD";
      if (month === 0 && dateCol >= 0) {
        const parsed = extractDateFromStr(row[dateCol]);
        if (parsed) {
          month = parsed.month;
          year = parsed.year;
        }
      }
    }
    if (month === 0) {
      const n = new Date();
      month = n.getMonth() + 1;
      year = n.getFullYear();
    }
    const totalCost = Math.round(total * 100) / 100;
    const services = applyBtpSavings(buildServices(serviceCosts));
    return {
      provider: "btp",
      month,
      year,
      totalCost,
      currency,
      services,
      totalSavings: Math.round(totalCost * BTP_CSP_RATE * 100) / 100,
    };
  }

  // Azure CSV
  const costCol = findCol(headers, [
    "costinbillingcurrency",
    "extendedcost",
    "pre-taxcost",
    "costusd",
    "cost",
    "amount",
    "paygcost",
  ]);
  const serviceCol = findCol(headers, [
    "servicename",
    "consumedservice",
    "metercategory",
    "product",
    "servicefamily",
    "resourcetype",
  ]);
  const dateCol = findCol(headers, [
    "usagedate",
    "date",
    "usagedatetime",
    "billingperiodstartdate",
  ]);
  const currencyCol = findCol(headers, [
    "billingcurrencycode",
    "billingcurrency",
    "currency",
  ]);
  if (costCol === -1) throw new Error("Cannot find cost column in Azure CSV");
  const serviceCosts = {};
  let total = 0,
    month = 0,
    year = 0,
    currency = "USD";
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const cost = toCost(row[costCol]);
    if (cost <= 0) continue;
    total += cost;
    const svc = (serviceCol >= 0 ? row[serviceCol] : "Other") || "Other";
    serviceCosts[svc.trim()] = (serviceCosts[svc.trim()] || 0) + cost;
    if (currencyCol >= 0 && currency === "USD" && row[currencyCol])
      currency = row[currencyCol].trim() || "USD";
    if (month === 0 && dateCol >= 0) {
      const parsed = extractDateFromStr(row[dateCol]);
      if (parsed) {
        month = parsed.month;
        year = parsed.year;
      }
    }
  }
  if (month === 0) {
    const n = new Date();
    month = n.getMonth() + 1;
    year = n.getFullYear();
  }
  const totalCost = Math.round(total * 100) / 100;
  const services = applyAzureSavings(buildServices(serviceCosts));
  const totalSavings = Math.round(totalCost * AZURE_CSP_RATE * 100) / 100;
  return {
    provider: "azure",
    month,
    year,
    totalCost,
    currency,
    services,
    totalSavings,
  };
}

/* ── PDF parser (browser, uses pdfjs-dist) ─────────────────── */

const AWS_SERVICE_PREFIXES = [
  "Amazon Elastic Compute Cloud",
  "Amazon EC2",
  "EC2-Other",
  "Amazon Simple Storage Service",
  "Amazon S3",
  "Amazon Elastic File System",
  "Amazon EFS",
  "Amazon FSx",
  "AWS Backup",
  "AWS Lambda",
  "Amazon Simple Queue Service",
  "Amazon SQS",
  "Amazon Simple Notification Service",
  "Amazon SNS",
  "Amazon Simple Email Service",
  "Amazon SES",
  "Amazon EventBridge",
  "Amazon Relational Database Service",
  "Amazon RDS",
  "Amazon DynamoDB",
  "Amazon ElastiCache",
  "Amazon Redshift",
  "Amazon OpenSearch Service",
  "Amazon CloudFront",
  "Amazon Route 53",
  "Amazon Virtual Private Cloud",
  "Amazon VPC",
  "Amazon Elastic Load Balancing",
  "AWS Direct Connect",
  "AWS Data Transfer",
  "Amazon Elastic Kubernetes Service",
  "Amazon EKS",
  "Amazon Elastic Container Service",
  "Amazon ECS",
  "Amazon Elastic Container Registry",
  "Amazon ECR",
  "Amazon Kinesis",
  "Amazon Athena",
  "AWS Glue",
  "Amazon SageMaker",
  "Amazon Textract",
  "Amazon Rekognition",
  "Amazon Comprehend",
  "Amazon Translate",
  "Amazon Transcribe",
  "Amazon Polly",
  "Amazon Elastic MapReduce",
  "AWS CodePipeline",
  "AWS CodeBuild",
  "CodeBuild",
  "AWS CodeDeploy",
  "AWS Amplify",
  "Amazon CloudWatch",
  "AmazonCloudWatch",
  "AWS CloudTrail",
  "AWS Config",
  "AWS Systems Manager",
  "AWS Budgets",
  "AWS Key Management Service",
  "AWS KMS",
  "AWS Secrets Manager",
  "AWS Certificate Manager",
  "AWS WAF",
  "AWS Shield",
  "Amazon GuardDuty",
  "Amazon Inspector",
  "Amazon Macie",
  "Amazon Cognito",
  "Amazon API Gateway",
  "AWS Step Functions",
  "Amazon WorkSpaces",
  "AWS Support",
];
const AWS_SHORT = {
  "Amazon Elastic Compute Cloud": "EC2",
  "Amazon EC2": "EC2",
  "Amazon Simple Storage Service": "S3",
  "Amazon S3": "S3",
  "Amazon Relational Database Service": "RDS",
  "Amazon Simple Queue Service": "SQS",
  "Amazon SQS": "SQS",
  "Amazon Simple Notification Service": "SNS",
  "Amazon SNS": "SNS",
  "Amazon Simple Email Service": "SES",
  "Amazon SES": "SES",
  "Amazon Virtual Private Cloud": "VPC",
  "Amazon VPC": "VPC",
  "Amazon Elastic Kubernetes Service": "EKS",
  "Amazon EKS": "EKS",
  "Amazon Elastic Container Service": "ECS",
  "Amazon ECS": "ECS",
  "Amazon Elastic Container Registry": "ECR",
  "Amazon ECR": "ECR",
  "Amazon Elastic File System": "EFS",
  "Amazon EFS": "EFS",
  "Amazon Elastic Load Balancing": "ELB",
  "Amazon Elastic MapReduce": "EMR",
  "Amazon OpenSearch Service": "OpenSearch",
  "Amazon API Gateway": "API Gateway",
  "Amazon CloudWatch": "CloudWatch",
  AmazonCloudWatch: "CloudWatch",
  "AWS Key Management Service": "KMS",
  "AWS KMS": "KMS",
  "AWS Lambda": "Lambda",
  "AWS Step Functions": "Step Functions",
  "AWS Glue": "Glue",
  "AWS CloudTrail": "CloudTrail",
  "AWS Config": "Config",
  "AWS Budgets": "Budgets",
  "AWS Backup": "Backup",
  "AWS WAF": "WAF",
  "AWS Shield": "Shield",
  "AWS Secrets Manager": "Secrets Manager",
  "AWS Systems Manager": "Systems Manager",
  "AWS Certificate Manager": "ACM",
  "AWS CodePipeline": "CodePipeline",
  "AWS CodeBuild": "CodeBuild",
  "AWS Amplify": "Amplify",
  "AWS Support": "Support",
  "AWS Data Transfer": "Data Transfer",
  "AWS Direct Connect": "Direct Connect",
  "Amazon DynamoDB": "DynamoDB",
  "Amazon ElastiCache": "ElastiCache",
  "Amazon CloudFront": "CloudFront",
  "Amazon Route 53": "Route 53",
  "Amazon Redshift": "Redshift",
  "Amazon Kinesis": "Kinesis",
  "Amazon Athena": "Athena",
  "Amazon SageMaker": "SageMaker",
  "Amazon Cognito": "Cognito",
  "Amazon WorkSpaces": "WorkSpaces",
  "Amazon GuardDuty": "GuardDuty",
  "Amazon Inspector": "Inspector",
  "Amazon EventBridge": "EventBridge",
  "Amazon FSx": "FSx",
};

function toShortName(svc) {
  return AWS_SHORT[svc] ?? svc.replace(/^Amazon\s+/, "").replace(/^AWS\s+/, "");
}

function normalizeDate(raw) {
  return raw
    .trim()
    .replace(/\s+,\s*/g, ", ")
    .replace(/\s{2,}/g, " ");
}

function parseFlexDate(raw) {
  if (!raw) return null;
  const cleaned = normalizeDate(raw);
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d;
  const m1 = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m1)
    return new Date(
      `${m1[3]}-${m1[1].padStart(2, "0")}-${m1[2].padStart(2, "0")}`,
    );
  return null;
}

function extractAWSMetadata(text) {
  const find = (pats) => {
    for (const p of pats) {
      const m = text.match(p);
      if (m) return m[1].trim();
    }
    return undefined;
  };
  const findNum = (pats) => {
    let best = 0;
    for (const p of pats) {
      const m = text.match(p);
      if (m) {
        const v = parseFloat(m[1].replace(/,/g, ""));
        if (v > best) best = v;
      }
    }
    return best;
  };
  const invoiceNumber = find([
    /invoice\s*(?:number|no\.?|#)[:\s]+([A-Z0-9\-]+)/i,
    /invoice\s+id[:\s]+([A-Z0-9\-]+)/i,
  ]);
  const accountId = find([
    /account\s*(?:number|no\.?|id)[:\s]+([\d\-]+)/i,
    /aws\s+account\s*(?:id|number)?[:\s]+([\d\-]+)/i,
  ]);
  const billingProfile = find([
    /bill\s+to\s+address[:\s]*\n([^\n]+)/i,
    /bill\s+to[:\s]*\n([^\n]+)/i,
    /sold\s+to[:\s]*\n([^\n]+)/i,
  ])
    ?.replace(/\s+/g, " ")
    .trim();
  const invoiceDateRaw = find([
    /invoice\s+date[:\s]+(\w+\s+\d{1,2}\s*,\s*\d{4})/i,
    /invoice\s+date[:\s]+(\w+\s+\d{1,2}\s+,\s*\d{4})/i,
    /invoice\s+date[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /date\s+of\s+issue[:\s]+(\w+\s+\d{1,2}\s*,?\s*\d{4})/i,
  ]);
  const invoiceDateObj = invoiceDateRaw ? parseFlexDate(invoiceDateRaw) : null;
  const invoiceDate = invoiceDateObj
    ? `${String(invoiceDateObj.getMonth() + 1).padStart(2, "0")}/${String(invoiceDateObj.getDate()).padStart(2, "0")}/${invoiceDateObj.getFullYear()}`
    : undefined;
  let billingPeriodStart,
    billingPeriodEnd,
    month = 0,
    year = 0;
  const bpCompact = text.match(
    /billing\s+period\s+(\w+\s+\d{1,2})\s*[-–]\s*(\w+\s+\d{1,2})\s*,?\s*(20\d{2})/i,
  );
  const bpFull = text.match(
    /billing\s*period[:\s]+(\w+\s+\d{1,2}\s*,?\s*20\d{2})\s*[-–to]+\s*(\w+\s+\d{1,2}\s*,?\s*20\d{2})/i,
  );
  const bpSlash = text.match(
    /billing\s*period[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})\s*[-–]\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
  );
  const bpService = text.match(
    /service\s*period[:\s]+(\w+\s+\d{1,2}\s*,?\s*20\d{2})\s*[-–to]+\s*(\w+\s+\d{1,2}\s*,?\s*20\d{2})/i,
  );
  if (bpCompact) {
    billingPeriodStart = `${bpCompact[1]}, ${bpCompact[3]}`;
    billingPeriodEnd = `${bpCompact[2]}, ${bpCompact[3]}`;
  } else if (bpFull) {
    billingPeriodStart = bpFull[1];
    billingPeriodEnd = bpFull[2];
  } else if (bpSlash) {
    billingPeriodStart = bpSlash[1];
    billingPeriodEnd = bpSlash[2];
  } else if (bpService) {
    billingPeriodStart = bpService[1];
    billingPeriodEnd = bpService[2];
  }
  const fromBP = billingPeriodStart ? parseFlexDate(billingPeriodStart) : null;
  const resolved = fromBP || invoiceDateObj;
  if (resolved) {
    month = resolved.getMonth() + 1;
    year = resolved.getFullYear();
  }
  if (month === 0) {
    const fm = text.match(
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/i,
    );
    if (fm) {
      const d = new Date(`${fm[1]} 1, ${fm[2]}`);
      if (!isNaN(d.getTime())) {
        month = d.getMonth() + 1;
        year = parseInt(fm[2]);
      }
    }
  }
  const totalCost = findNum([
    /total\s+amount\s+due[^\n]*?(?:usd\s*)?\$?([\d,]+\.\d{2})/i,
    /total\s+for\s+this\s+invoice\s+(?:usd\s*)?\$?([\d,]+\.\d{2})/i,
    /aws\s+service\s+charges\s+(?:usd\s*)?\$?([\d,]+\.\d{2})/i,
    /amount\s+due[:\s]*(?:usd\s*)?\$?([\d,]+\.\d{2})/i,
    /invoice\s+total[:\s]*(?:usd\s*)?\$?([\d,]+\.\d{2})/i,
    /total\s+charges[:\s]*(?:usd\s*)?\$?([\d,]+\.\d{2})/i,
    /grand\s+total[:\s]*(?:usd\s*)?\$?([\d,]+\.\d{2})/i,
  ]);
  const taxAmount = findNum([
    /^Tax\s+(?:USD\s*)?([\d,]+\.\d{2})\s*$/im,
    /(?:estimated\s+)?tax(?:es)?[:\s]+(?:usd\s*)?\$?([\d,]+\.\d{2})/i,
  ]);
  const currency = text.match(/\b(USD|EUR|GBP|AUD|CAD)\b/)?.[1] ?? "USD";
  return {
    invoiceNumber,
    accountId,
    billingProfile,
    invoiceDate,
    billingPeriodStart,
    billingPeriodEnd,
    totalCost,
    taxAmount,
    currency,
    month,
    year,
  };
}

function extractAWSServicesFromPDF(text) {
  const costs = {};
  for (const svc of AWS_SERVICE_PREFIXES) {
    const escaped = svc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(
      `\\b${escaped}[^\\n]*?(?:USD\\s*)([\\d,]+\\.\\d{2})(?:\\s|$)`,
      "gi",
    );
    let m;
    while ((m = re.exec(text)) !== null) {
      const cost = parseFloat(m[1].replace(/,/g, ""));
      if (cost > 0) {
        const name = toShortName(svc);
        costs[name] = Math.max(costs[name] || 0, cost);
      }
    }
  }
  const genericRe = /^(\w[\w\s-]{2,40}?)\s+USD\s+([\d,]+\.\d{2})\s*$/gm;
  let gm;
  while ((gm = genericRe.exec(text)) !== null) {
    const name = gm[1].trim();
    const cost = parseFloat(gm[2].replace(/,/g, ""));
    if (
      cost > 0 &&
      !costs[name] &&
      !/total|subtotal|amount|due|credit|discount|charges|tax|service|summary|invoice/i.test(
        name,
      )
    )
      costs[name] = cost;
  }
  return buildServices(costs);
}

const AZURE_SERVICE_NAMES_LIST = [
  "Compute",
  "Storage",
  "Networking",
  "Databases",
  "Analytics",
  "Security",
  "Developer Tools",
  "Management and Governance",
  "Containers",
  "Internet of Things",
  "AI \\+ Machine Learning",
  "Integration",
  "Data",
  "Azure Arc",
  "Email",
  "Azure Communication Services",
];

function extractAzureMetadata(text) {
  const str = (pattern) => {
    const m = text.match(pattern);
    return m ? m[1].trim() : undefined;
  };
  const num = (pattern) => {
    const m = text.match(pattern);
    return m ? parseFloat(m[1].replace(/,/g, "")) : 0;
  };
  const invoiceNumber = str(/Invoice Number\s+([A-Z]\d+)/i);
  const billingProfile = str(/Billing Profile\s+(.+?)(?:\n|PO Number)/is);
  const poNumber = str(/PO Number\s+(\S+)/i);
  const invoiceDate = str(/Invoice Date In UTC\s+(\d{2}\/\d{2}\/\d{4})/i);
  const dueDate = str(/Due on\s+(\d{2}\/\d{2}\/\d{4})/i);
  const periodMatch = text.match(
    /billing period\s+(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})/i,
  );
  const billingPeriodStart = periodMatch ? periodMatch[1] : undefined;
  const billingPeriodEnd = periodMatch ? periodMatch[2] : undefined;
  const charges = num(/^Charges\s+([\d,]+\.\d{2})/im);
  const taxMatch = text.match(/Sales Tax\s*\(([0-9.]+)%\)\s+([\d,]+\.\d{2})/i);
  const taxRate = taxMatch ? parseFloat(taxMatch[1]) : 0;
  const taxAmount = taxMatch ? parseFloat(taxMatch[2].replace(/,/g, "")) : 0;
  let totalCost = 0;
  const totalMatch =
    text.match(/Total\s+\(including\s+Tax\)\s+(?:USD\s+)?([\d,]+\.\d{2})/i) ||
    text.match(/USD\s+([\d,]+\.\d{2})/i);
  if (totalMatch) totalCost = parseFloat(totalMatch[1].replace(/,/g, ""));
  const sections = [];
  const sectionPattern =
    /^(.+?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})$/gm;
  let sm;
  while ((sm = sectionPattern.exec(text)) !== null) {
    const name = sm[1].trim();
    const isServiceName = AZURE_SERVICE_NAMES_LIST.some((s) =>
      new RegExp("^" + s + "$", "i").test(name),
    );
    if (
      !isServiceName &&
      name.length > 3 &&
      name.length < 60 &&
      !name.match(/^\d/)
    )
      sections.push({
        name,
        charges: parseFloat(sm[2].replace(/,/g, "")),
        tax: parseFloat(sm[3].replace(/,/g, "")),
        total: parseFloat(sm[4].replace(/,/g, "")),
      });
  }
  const currMatch = text.match(/USD|EUR|GBP|AUD|CAD/);
  const currency = currMatch ? currMatch[0] : "USD";
  return {
    invoiceNumber,
    billingProfile,
    poNumber,
    invoiceDate,
    dueDate,
    billingPeriodStart,
    billingPeriodEnd,
    charges,
    taxRate,
    taxAmount,
    totalCost,
    sections,
    currency,
  };
}

function extractAzureServices(text) {
  const costs = {};
  for (const svcPattern of AZURE_SERVICE_NAMES_LIST) {
    const re = new RegExp(
      `\\b(${svcPattern})\\s+(\\d[\\d,]*\\.\\d{2})(?:\\s+(?:[\\d.]+%|---))?`,
      "gi",
    );
    let m;
    while ((m = re.exec(text)) !== null) {
      const name = m[1].replace(/\\+/, "+").trim();
      const cost = parseFloat(m[2].replace(/,/g, ""));
      if (cost > 0) costs[name] = (costs[name] || 0) + cost;
    }
  }
  const reservationPattern =
    /\d{2}\/\d{2}\/\d{4}-\d{2}\/\d{2}\/\d{4}\s+[\d.]+\s+\d+\s+([\d,]+\.\d{2})\s+[\d,]+\.\d{2}/g;
  let rm,
    reservationTotal = 0;
  while ((rm = reservationPattern.exec(text)) !== null)
    reservationTotal += parseFloat(rm[1].replace(/,/g, ""));
  if (reservationTotal > 0)
    costs["Reserved Instances"] =
      (costs["Reserved Instances"] || 0) + reservationTotal;
  return buildServices(costs);
}

// ── SAP BTP PDF helpers ──────────────────────────────────────
const BTP_SERVICE_NAMES = [
  "SAP HANA Cloud",
  "SAP Build Work Zone",
  "SAP Integration Suite",
  "SAP Build Process Automation",
  "SAP Analytics Cloud",
  "SAP BTP, Cloud Foundry Runtime",
  "Application Runtime",
  "SAP Business Application Studio",
  "SAP Datasphere",
  "SAP Event Mesh",
  "SAP API Management",
  "SAP Graph",
  "SAP Connectivity Service",
  "SAP Destination Service",
  "SAP Authorization and Trust Management",
  "SAP Cloud Identity Services",
  "SAP Alert Notification Service",
  "SAP Application Logging Service",
  "SAP Job Scheduling Service",
  "SAP Object Store Service",
  "SAP Credential Store",
  "SAP Document Management Service",
  "SAP Workflow Management",
  "SAP AI Core",
  "SAP AI Launchpad",
  "Kyma Runtime",
  "SAP BTP, Kyma Runtime",
  "SAP Extension Suite",
  "SAP IoT",
  "SAP Mobile Services",
  "SAP Web Analytics",
];

function extractBTPMetadata(text) {
  const str = (pattern) => {
    const m = text.match(pattern);
    return m ? m[1].trim() : undefined;
  };
  const num = (pattern) => {
    const m = text.match(pattern);
    return m ? parseFloat(m[1].replace(/,/g, "")) : 0;
  };

  const invoiceNumber = str(
    /Invoice\s+(?:Number|No\.?|ID)[:\s]+([A-Z0-9\-/]+)/i,
  );
  const globalAccount = str(
    /Global\s+Account[:\s]+(.+?)(?:\n|Subaccount|Contract)/is,
  )
    ?.replace(/\s+/g, " ")
    .trim();
  const contractNumber = str(/Contract\s+(?:Number|No\.?)[:\s]+([A-Z0-9\-]+)/i);
  const invoiceDate = str(
    /Invoice\s+Date[:\s]+(\d{2}\/\d{2}\/\d{4}|\d{1,2}\s+\w+\s+\d{4})/i,
  );
  const dueDate = str(
    /Due\s+(?:Date|on)[:\s]+(\d{2}\/\d{2}\/\d{4}|\d{1,2}\s+\w+\s+\d{4})/i,
  );

  const periodMatch = text.match(
    /(?:Billing|Service)\s+Period[:\s]+(\d{2}\/\d{2}\/\d{4}|\w+\s+\d{1,2}\s*,?\s*\d{4})\s*[-–to]+\s*(\d{2}\/\d{2}\/\d{4}|\w+\s+\d{1,2}\s*,?\s*\d{4})/i,
  );
  const billingPeriodStart = periodMatch ? periodMatch[1] : undefined;
  const billingPeriodEnd = periodMatch ? periodMatch[2] : undefined;

  const totalCost =
    num(
      /(?:Total\s+Amount\s+Due|Invoice\s+Total|Grand\s+Total|Total\s+Charges)[:\s]*(?:USD\s*)?([\d,]+\.\d{2})/i,
    ) || num(/(?:USD|EUR)\s+([\d,]+\.\d{2})/i);
  const taxAmount = num(/(?:VAT|Tax)[:\s]+(?:USD\s*)?([\d,]+\.\d{2})/i);
  const currency = text.match(/\b(USD|EUR|GBP|AUD|CAD)\b/)?.[1] ?? "USD";

  return {
    invoiceNumber,
    billingProfile: globalAccount,
    contractNumber,
    invoiceDate,
    dueDate,
    billingPeriodStart,
    billingPeriodEnd,
    totalCost,
    taxAmount,
    currency,
  };
}

function extractBTPServices(text) {
  const costs = {};
  for (const svc of BTP_SERVICE_NAMES) {
    const escaped = svc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`${escaped}[^\\n]*?([\\d,]+\\.\\d{2})`, "gi");
    let m;
    while ((m = re.exec(text)) !== null) {
      const cost = parseFloat(m[1].replace(/,/g, ""));
      if (cost > 0) costs[svc] = Math.max(costs[svc] || 0, cost);
    }
  }
  // Generic SAP line: "ServiceName   qty   USD  amount"
  const genericRe =
    /^(SAP\s[\w\s,+./-]{4,60?})\s+(?:\S+\s+){0,3}([\d,]+\.\d{2})\s*$/gm;
  let gm;
  while ((gm = genericRe.exec(text)) !== null) {
    const name = gm[1].trim();
    const cost = parseFloat(gm[2].replace(/,/g, ""));
    if (cost > 0 && !costs[name]) costs[name] = cost;
  }
  return buildServices(costs);
}

function extractBillingPeriod(start, invoiceDate) {
  const tryDate = (s) => {
    if (!s) return null;
    const m1 = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (m1) return { month: parseInt(m1[1]), year: parseInt(m1[3]) };
    const m2 = s.match(/(\d{4})-(\d{2})/);
    if (m2) return { month: parseInt(m2[2]), year: parseInt(m2[1]) };
    return null;
  };
  return (
    tryDate(start) ||
    tryDate(invoiceDate) ||
    (() => {
      const n = new Date();
      return { month: n.getMonth() + 1, year: n.getFullYear() };
    })()
  );
}

/* ── BTP XLSX parser — exact port of backend parseBtpXLSX ─────── */

// Normalise a cell header to lowercase, no spaces/punctuation
const normH = (h) =>
  String(h ?? "")
    .toLowerCase()
    .replace(/[\s_\-()/]/g, "");

// Find first row index whose first cell is "Start Date" or "Service Name"
function btpHeaderRowIdx(raw) {
  for (let i = 0; i < Math.min(raw.length, 15); i++) {
    const first = String(raw[i]?.[0] ?? "")
      .toLowerCase()
      .trim();
    if (
      first === "start date" ||
      first === "startdate" ||
      first === "service name"
    )
      return i;
  }
  return 0;
}

// Read a named BTP sheet → { headers[], rows[][] } or null
function btpSheet(wb, XLSX, name) {
  if (!wb.SheetNames.includes(name)) return null;
  const raw = XLSX.utils.sheet_to_json(wb.Sheets[name], {
    header: 1,
    defval: "",
  });
  const hi = btpHeaderRowIdx(raw);
  const headers = raw[hi].map(normH);
  return { headers, rows: raw.slice(hi + 1) };
}

function btpCell(row, idx) {
  return String(row[idx] ?? "").trim();
}
function btpDateCell(row, idx) {
  if (idx < 0) return "";
  const v = row[idx];
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v ?? "").slice(0, 10);
}
function btpCostCell(row, idx) {
  if (idx < 0) return 0;
  const v = row[idx];
  return typeof v === "number"
    ? v
    : parseFloat(String(v ?? "").replace(/[^0-9.-]/g, "")) || 0;
}
function btpFindCol(headers, candidates) {
  for (const c of candidates) {
    const idx = headers.findIndex(
      (h) => h === c || h.endsWith("/" + c) || h.endsWith("_" + c),
    );
    if (idx >= 0) return idx;
  }
  return -1;
}
function btpExtractDate(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  if (!isNaN(d.getTime()))
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  const m = raw.match(/(\d{4})[/-](\d{1,2})/);
  if (m) return { month: parseInt(m[2]), year: parseInt(m[1]) };
  return null;
}

async function parseBTPXlsx(buffer) {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(new Uint8Array(buffer), {
    type: "array",
    cellDates: true,
  });

  // ── 1. Global Account Info (key-value layout) ──────────────────
  const accountInfo = {};
  if (wb.SheetNames.includes("Global Account Info")) {
    const raw = XLSX.utils.sheet_to_json(wb.Sheets["Global Account Info"], {
      header: 1,
      defval: "",
    });
    for (const row of raw) {
      const a = String(row[0] ?? "").trim();
      const b = String(row[1] ?? "").trim();
      const c = String(row[2] ?? "").trim();
      if (
        a.startsWith("Global Account:") &&
        !a.toLowerCase().includes("info")
      ) {
        const m = a.match(/Global Account:\s*([^(]+)/);
        if (m) accountInfo.globalAccountName = m[1].trim();
      }
      const k = a.toLowerCase().replace(/\s+/g, "");
      if (k === "accounttype") accountInfo.accountType = b;
      if (k === "accountid") accountInfo.accountId = b;
      if (k === "numberofdirectories")
        accountInfo.numDirectories = parseInt(c || b) || 0;
      if (k === "numberofsubaccounts")
        accountInfo.numSubaccounts = parseInt(c || b) || 0;
      if (k === "numberofregions")
        accountInfo.numRegions = parseInt(c || b) || 0;
      if (k === "contractstart") accountInfo.contractStart = b;
      if (k === "plannedcontractend") accountInfo.plannedContractEnd = b;
    }
  }

  // ── 2. Global Account Costs ────────────────────────────────────
  const gacSheet = btpSheet(wb, XLSX, "Global Account Costs");
  const globalCostAgg = new Map();
  let currency = "EUR";
  let billingStart = "";
  let billingEnd = "";

  if (gacSheet) {
    const h = gacSheet.headers;
    const svcIdx = btpFindCol(h, ["servicename"]);
    const planIdx = btpFindCol(h, ["serviceplanname", "planname"]);
    const metIdx = btpFindCol(h, ["metricname", "metric"]);
    const costIdx = btpFindCol(h, ["cost"]);
    const curIdx = btpFindCol(h, ["currency", "currencycode"]);
    const usageIdx = btpFindCol(h, ["chargedusage", "usage"]);
    const sdIdx = btpFindCol(h, ["startdate"]);
    const edIdx = btpFindCol(h, ["enddate"]);

    for (const row of gacSheet.rows) {
      if (row.every((c) => c === "" || c == null)) continue;
      const cost = btpCostCell(row, costIdx);
      if (cost <= 0) continue;
      const svc = btpCell(row, svcIdx) || "Unknown Service";
      const plan = btpCell(row, planIdx) || "";
      const met = btpCell(row, metIdx) || "";
      const cur = curIdx >= 0 ? btpCell(row, curIdx) : "";
      const usg =
        usageIdx >= 0
          ? typeof row[usageIdx] === "number"
            ? row[usageIdx]
            : parseFloat(btpCell(row, usageIdx)) || 0
          : 0;
      if (cur) currency = cur;
      if (!billingStart && sdIdx >= 0) billingStart = btpDateCell(row, sdIdx);
      if (edIdx >= 0) billingEnd = btpDateCell(row, edIdx);
      const existing = globalCostAgg.get(svc);
      if (existing) {
        existing.cost += cost;
        existing.usage += usg;
      } else
        globalCostAgg.set(svc, {
          planName: plan,
          metric: met,
          cost,
          usage: usg,
          currency: cur || currency,
        });
    }
  }

  // ── 3. Subaccount Costs by Service ────────────────────────────
  const subSheet = btpSheet(wb, XLSX, "Subaccount Costs by Service");
  const serviceCosts = {};
  let total = 0,
    month = 0,
    year = 0;

  const subAgg = new Map();
  if (subSheet) {
    const h = subSheet.headers;
    const svcIdx = btpFindCol(h, ["servicename"]);
    const costIdx = btpFindCol(h, ["cost"]);
    const curIdx = btpFindCol(h, ["currency"]);
    const sdIdx = btpFindCol(h, ["startdate"]);
    const subNameIdx = btpFindCol(h, ["subaccountname", "subaccount"]);

    for (const row of subSheet.rows) {
      if (row.every((c) => c === "" || c == null)) continue;
      const cost = btpCostCell(row, costIdx);
      if (cost <= 0) continue;
      const svc = btpCell(row, svcIdx) || "Unknown Service";
      const sub =
        subNameIdx >= 0
          ? btpCell(row, subNameIdx) || "Unknown Subaccount"
          : "Unknown Subaccount";
      const cur = curIdx >= 0 ? btpCell(row, curIdx) : "";
      if (cur) currency = cur;
      if (!billingStart && sdIdx >= 0) billingStart = btpDateCell(row, sdIdx);
      total += cost;
      serviceCosts[svc] = (serviceCosts[svc] || 0) + cost;
      const exSub = subAgg.get(sub);
      if (exSub) {
        exSub.totalCost += cost;
        exSub.services.set(svc, (exSub.services.get(svc) || 0) + cost);
      } else {
        subAgg.set(sub, { totalCost: cost, services: new Map([[svc, cost]]) });
      }
      if (!month && sdIdx >= 0) {
        const d = row[sdIdx];
        if (d instanceof Date) {
          month = d.getMonth() + 1;
          year = d.getFullYear();
        } else {
          const p = btpExtractDate(btpCell(row, sdIdx));
          if (p) {
            month = p.month;
            year = p.year;
          }
        }
      }
    }
  }

  // ── 4. Actual Usage (supplementary — no cost) ─────────────────
  // (sheet read for completeness but not required for the result)

  // ── 5. Fallback: use Global Account Costs if subaccount sheet empty ──
  if (total === 0 && globalCostAgg.size > 0) {
    for (const [svc, v] of globalCostAgg) {
      serviceCosts[svc] = (serviceCosts[svc] || 0) + v.cost;
      total += v.cost;
    }
  }

  if (total === 0)
    throw new Error(
      "SAP BTP XLSX: no cost data found. Expected sheets: 'Global Account Costs' or 'Subaccount Costs by Service'. Please export from SAP BTP Cost Management.",
    );
  if (month === 0) {
    if (billingStart) {
      const p = btpExtractDate(billingStart);
      if (p) {
        month = p.month;
        year = p.year;
      }
    }
    if (month === 0) {
      const n = new Date();
      month = n.getMonth() + 1;
      year = n.getFullYear();
    }
  }

  const totalCost = Math.round(total * 100) / 100;

  const globalAccountCosts = Array.from(globalCostAgg.entries())
    .map(([name, v]) => ({
      name,
      planName: v.planName,
      metric: v.metric,
      cost: Math.round(v.cost * 100) / 100,
      usage: v.usage,
      currency: v.currency,
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 25);

  const subaccountCosts = Array.from(subAgg.entries())
    .map(([name, v]) => ({
      name,
      totalCost: Math.round(v.totalCost * 100) / 100,
      services: Array.from(v.services.entries())
        .map(([s, c]) => ({ name: s, cost: Math.round(c * 100) / 100 }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 8),
    }))
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 15);

  return {
    provider: "btp",
    month,
    year,
    totalCost,
    currency,
    services: applyBtpSavings(buildServices(serviceCosts)),
    totalSavings: Math.round(totalCost * BTP_CSP_RATE * 100) / 100,
    billingProfile: accountInfo.globalAccountName,
    billingPeriodStart: billingStart || undefined,
    billingPeriodEnd: billingEnd || undefined,
    rawSummary: {
      availableSheets: wb.SheetNames,
      accountInfo,
      globalAccountCosts,
      subaccountCosts,
    },
  };
}

async function parsePDFInBrowser(buffer, hintProvider) {
  // Dynamically import pdfjs-dist (avoids worker issues in Vite)
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const typedArray = new Uint8Array(buffer);
  const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
  let text = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    text += content.items.map((i) => i.str).join(" ") + "\n";
  }

  const looksAws = /amazon web services|aws\.amazon\.com|aws, inc\./i.test(
    text,
  );
  const looksAzure =
    /microsoft azure|azure\.microsoft\.com|microsoft corporation/i.test(text);
  const looksBtp =
    /sap\s+business\s+technology\s+platform|sap\s+btp|cloud\s+platform\s+enterprise\s+agreement|sap\s+se\b|global\s+account/i.test(
      text,
    );

  if (hintProvider === "azure" && looksAws && !looksAzure)
    throw new Error(
      "Wrong document: you selected Azure but this PDF is an AWS invoice.",
    );
  if (hintProvider === "aws" && looksAzure && !looksAws)
    throw new Error(
      "Wrong document: you selected AWS but this PDF is a Microsoft Azure invoice.",
    );
  if (hintProvider === "btp" && (looksAws || looksAzure) && !looksBtp)
    throw new Error(
      "Wrong document: you selected SAP BTP but this PDF appears to be an AWS/Azure invoice.",
    );

  let provider = hintProvider;
  if (!provider) {
    if (looksBtp) provider = "btp";
    else if (looksAws) provider = "aws";
    else if (looksAzure) provider = "azure";
    else throw new Error(
      "This PDF does not appear to be a cloud invoice. Expected an Amazon Web Services, Microsoft Azure, or SAP BTP invoice. Please upload the correct file."
    );
  }

  if (provider === "btp") {
    const meta = extractBTPMetadata(text);
    const services = applyBtpSavings(extractBTPServices(text));
    const { month, year } = extractBillingPeriod(
      meta.billingPeriodStart,
      meta.invoiceDate,
    );
    return {
      provider: "btp",
      month,
      year,
      totalCost: meta.totalCost,
      currency: meta.currency,
      services,
      totalSavings: Math.round(meta.totalCost * BTP_CSP_RATE * 100) / 100,
      invoiceNumber: meta.invoiceNumber,
      billingProfile: meta.billingProfile,
      contractNumber: meta.contractNumber,
      invoiceDate: meta.invoiceDate,
      dueDate: meta.dueDate,
      billingPeriodStart: meta.billingPeriodStart,
      billingPeriodEnd: meta.billingPeriodEnd,
      taxAmount: meta.taxAmount,
    };
  }

  if (provider === "azure") {
    const meta = extractAzureMetadata(text);
    const services = applyAzureSavings(extractAzureServices(text));
    const totalSavings =
      Math.round(meta.totalCost * AZURE_CSP_RATE * 100) / 100;
    const { month, year } = extractBillingPeriod(
      meta.billingPeriodStart,
      meta.invoiceDate,
    );
    return {
      provider: "azure",
      month,
      year,
      totalCost: meta.totalCost,
      currency: meta.currency,
      services,
      totalSavings,
      invoiceNumber: meta.invoiceNumber,
      billingProfile: meta.billingProfile?.replace(/\s+/g, " ").trim(),
      poNumber: meta.poNumber,
      invoiceDate: meta.invoiceDate,
      dueDate: meta.dueDate,
      billingPeriodStart: meta.billingPeriodStart,
      billingPeriodEnd: meta.billingPeriodEnd,
      taxAmount: meta.taxAmount,
      taxRate: meta.taxRate,
      charges: meta.charges,
      sections: meta.sections,
    };
  }

  const meta = extractAWSMetadata(text);
  const services = extractAWSServicesFromPDF(text);
  let { month, year } = meta;
  if (month === 0) {
    const n = new Date();
    month = n.getMonth() + 1;
    year = n.getFullYear();
  }
  const resolvedProvider = provider === "gcp" ? "gcp" : "aws";
  const resolvedCSPRate =
    resolvedProvider === "gcp" ? GCP_CSP_RATE : AWS_CSP_RATE;
  return {
    provider: resolvedProvider,
    month,
    year,
    totalCost: meta.totalCost,
    currency: meta.currency,
    services: applyAwsSavings(services),
    totalSavings: Math.round(meta.totalCost * resolvedCSPRate * 100) / 100,
    invoiceNumber: meta.invoiceNumber,
    billingProfile: meta.billingProfile,
    invoiceDate: meta.invoiceDate,
    billingPeriodStart: meta.billingPeriodStart,
    billingPeriodEnd: meta.billingPeriodEnd,
    taxAmount: meta.taxAmount,
  };
}

/* ── ParsedResult — same design as InvoiceDetail ───────────── */

/* ── BTP-specific enhanced detail ─────────────────────────── */

const BtpDetail = ({ result }) => {
  const [expandedSub, setExpandedSub] = useState(null);
  const raw = result.rawSummary ?? {};
  const accountInfo = raw.accountInfo ?? {};
  const globalAccountCosts = raw.globalAccountCosts ?? [];
  const subaccountCosts = raw.subaccountCosts ?? [];
  const currency = result.currency ?? "EUR";
  const total = result.totalCost;

  const fmt = (v) => formatCurrency(v, currency);
  const pct = (v) => (total > 0 ? ((v / total) * 100).toFixed(1) : "0");

  if (!globalAccountCosts.length && !subaccountCosts.length) return null;

  return (
    <div className="space-y-4">
      {/* ── Account overview strip ── */}
      {(accountInfo.globalAccountName ||
        accountInfo.numSubaccounts ||
        accountInfo.numRegions ||
        accountInfo.contractStart) && (
        <Card className="overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#0070F2]/10 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-[#0070F2]" />
            </div>
            <h3 className="text-xs font-bold text-gray-900 dark:text-white tracking-wide">
              Global Account Overview
            </h3>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {accountInfo.globalAccountName && (
              <div>
                <p className="text-[10px] font-bold tracking-wider text-gray-400 mb-0.5">
                  Account
                </p>
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {accountInfo.globalAccountName}
                </p>
              </div>
            )}
            {accountInfo.numSubaccounts > 0 && (
              <div>
                <p className="text-[10px] font-bold tracking-wider text-gray-400 mb-0.5">
                  Sub-Accounts
                </p>
                <p className="text-lg font-bold text-[#0070F2]">
                  {accountInfo.numSubaccounts}
                </p>
              </div>
            )}
            {accountInfo.numRegions > 0 && (
              <div>
                <p className="text-[10px] font-bold tracking-wider text-gray-400 mb-0.5">
                  Regions
                </p>
                <p className="text-lg font-bold text-[#0070F2]">
                  {accountInfo.numRegions}
                </p>
              </div>
            )}
            {accountInfo.contractStart && (
              <div>
                <p className="text-[10px] font-bold tracking-wider text-gray-400 mb-0.5">
                  Contract Start
                </p>
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {accountInfo.contractStart}
                </p>
              </div>
            )}
            {accountInfo.plannedContractEnd && (
              <div>
                <p className="text-[10px] font-bold tracking-wider text-gray-400 mb-0.5">
                  Contract End
                </p>
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {accountInfo.plannedContractEnd}
                </p>
              </div>
            )}
            {accountInfo.accountId && (
              <div>
                <p className="text-[10px] font-bold tracking-wider text-gray-400 mb-0.5">
                  Account ID
                </p>
                <p className="text-xs font-mono text-gray-600 dark:text-gray-300 truncate">
                  {accountInfo.accountId}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── Global Account Costs by service ── */}
      {globalAccountCosts.length > 0 && (
        <Card>
          <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#0070F2]" />
              <h3 className="text-xs font-bold text-gray-900 dark:text-white tracking-wide">
                Service Cost Breakdown
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#0070F2]/10 text-[#0070F2]">
                {globalAccountCosts.length}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">
              Global Account level
            </span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {globalAccountCosts.map((svc, i) => {
              const barPct = total > 0 ? (svc.cost / total) * 100 : 0;
              return (
                <div key={i} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                        {svc.name}
                      </p>
                      {svc.planName && (
                        <p className="text-[10px] text-gray-400 truncate">
                          {svc.planName}
                          {svc.metric ? ` · ${svc.metric}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className="text-[10px] text-gray-400">
                        {pct(svc.cost)}%
                      </span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums w-20 text-right">
                        {fmt(svc.cost)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${barPct}%`,
                        backgroundColor: BTP_COLORS[i % BTP_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Subaccount breakdown ── */}
      {subaccountCosts.length > 0 && (
        <Card>
          <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#0070F2]" />
              <h3 className="text-xs font-bold text-gray-900 dark:text-white tracking-wide">
                Subaccount Breakdown
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#0070F2]/10 text-[#0070F2]">
                {subaccountCosts.length}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">
              click row to expand services
            </span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {subaccountCosts.map((sub, i) => {
              const isOpen = expandedSub === i;
              const barPct = total > 0 ? (sub.totalCost / total) * 100 : 0;
              return (
                <div key={i}>
                  <button
                    onClick={() => setExpandedSub(isOpen ? null : i)}
                    className="w-full px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 text-center text-[10px] font-bold text-gray-400 shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                          {sub.name}
                        </p>
                        {sub.services.length > 0 && (
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {sub.services.length} service
                            {sub.services.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-[10px] text-gray-400">
                          {pct(sub.totalCost)}%
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums w-20 text-right">
                          {fmt(sub.totalCost)}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden ml-7">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${barPct}%`,
                          backgroundColor: BTP_COLORS[i % BTP_COLORS.length],
                        }}
                      />
                    </div>
                  </button>
                  {isOpen && sub.services.length > 0 && (
                    <div className="ml-7 mr-5 mb-3 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                      {sub.services.map((svc, j) => (
                        <div
                          key={j}
                          className={`flex items-center justify-between px-4 py-2 ${j % 2 === 0 ? "bg-gray-50/60 dark:bg-gray-800/30" : ""}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  BTP_COLORS[j % BTP_COLORS.length],
                              }}
                            />
                            <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                              {svc.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-[10px] text-gray-400">
                              {sub.totalCost > 0
                                ? ((svc.cost / sub.totalCost) * 100).toFixed(1)
                                : "0"}
                              %
                            </span>
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 tabular-nums w-18 text-right">
                              {fmt(svc.cost)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Subaccount bar chart ── */}
      {subaccountCosts.length > 1 && (
        <Card className="p-4">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wide mb-3">
            Cost by Subaccount
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={subaccountCosts.slice(0, 10)}
                layout="vertical"
                margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  fontSize={9}
                  fontWeight="600"
                  tickFormatter={(v) =>
                    `${currency === "EUR" ? "€" : "$"}${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(0)}`
                  }
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={9}
                  fontWeight="600"
                  width={100}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v.length > 16 ? v.slice(0, 16) + "…" : v
                  }
                />
                <Tooltip
                  formatter={(v) => [fmt(v), "Cost"]}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    fontSize: "11px",
                    fontWeight: "600",
                  }}
                />
                <Bar
                  dataKey="totalCost"
                  radius={[0, 4, 4, 0]}
                  animationDuration={700}
                >
                  {subaccountCosts.slice(0, 10).map((_, i) => (
                    <Cell key={i} fill={BTP_COLORS[i % BTP_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
};

BtpDetail.propTypes = {
  result: PropTypes.object.isRequired,
};

const ParsedResult = ({ result, fileName, onReset }) => {
  const GCP_COLORS = [
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#f97316",
    "#ec4899",
  ];
  const COLORS =
    result.provider === "aws"
      ? AWS_COLORS
      : result.provider === "btp"
        ? BTP_COLORS
        : result.provider === "gcp"
          ? GCP_COLORS
          : AZURE_COLORS;
  const total = result.totalCost;
  const services = result.services ?? [];
  const sections = result.sections ?? [];
  const tax = result.taxAmount ?? 0;
  const charges = result.charges ?? 0;
  const maxSvc = services[0]?.cost || 1;
  const top8 = services.slice(0, 8);

  return (
    <div className="space-y-5">
      {/* ── Invoice header ── */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {result.provider === "azure" ? (
                <span className="badge bg-blue-500 text-white border-blue-600">
                  AZURE
                </span>
              ) : result.provider === "btp" ? (
                <span className="badge bg-[#0070F2] text-white border-[#0057A8]">
                  SAP BTP
                </span>
              ) : result.provider === "gcp" ? (
                <span className="badge bg-blue-500 text-white border-blue-600">
                  GCP
                </span>
              ) : (
                <span className="badge bg-orange-500 text-white border-orange-600">
                  AWS
                </span>
              )}
              {result.invoiceNumber && (
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 font-mono">
                  #{result.invoiceNumber}
                </span>
              )}
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Demo Preview — Not Saved
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium truncate">
              {fileName}
            </p>
          </div>
          <button
            onClick={onReset}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            title="Upload another"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {result.billingProfile && (
              <MetaChip
                icon={Tag}
                label="Profile"
                value={result.billingProfile}
                accent={result.provider === "aws" ? "orange" : "blue"}
              />
            )}
            {result.poNumber && (
              <MetaChip
                icon={Receipt}
                label="PO"
                value={result.poNumber}
                accent="gray"
              />
            )}
            {result.contractNumber && (
              <MetaChip
                icon={Receipt}
                label="Contract"
                value={result.contractNumber}
                accent="blue"
              />
            )}
            {(result.billingPeriodStart || result.billingPeriodEnd) && (
              <MetaChip
                icon={Calendar}
                label="Period"
                value={`${fmtDate(result.billingPeriodStart)} – ${fmtDate(result.billingPeriodEnd)}`}
                accent="green"
              />
            )}
            {result.invoiceDate && (
              <MetaChip
                icon={FileText}
                label="Invoice Date"
                value={fmtDate(result.invoiceDate)}
                accent="gray"
              />
            )}
            {result.dueDate && (
              <MetaChip
                icon={CreditCard}
                label="Due"
                value={fmtDate(result.dueDate)}
                accent="orange"
              />
            )}
            <MetaChip
              icon={Calendar}
              label="Billing Month"
              value={`${MONTH_NAMES[result.month - 1]} ${result.year}`}
              accent="blue"
            />
          </div>

          <div className="grid gap-2 mt-3 grid-cols-2 sm:grid-cols-4">
            <KpiTile
              label="Total Amount"
              value={formatCurrency(total, result.currency)}
              sub={result.currency}
              accent="blue"
              large
            />
            <KpiTile
              label="Pre-tax Charges"
              value={
                charges > 0
                  ? formatCurrency(charges, result.currency)
                  : formatCurrency(total - tax, result.currency)
              }
              accent="gray"
            />
            <KpiTile
              label={`Sales Tax${result.taxRate ? ` (${result.taxRate}%)` : ""}`}
              value={tax > 0 ? formatCurrency(tax, result.currency) : "—"}
              accent={tax > 0 ? "red" : "gray"}
            />
            {result.totalSavings > 0 && (
              <div className="rounded-xl border border-emerald-100 dark:border-emerald-900 p-4">
                <div className="flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <p className="text-[10px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                    CSP Savings
                  </p>
                </div>
                <p
                  className={`font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-tight break-all ${String(formatCurrency(result.totalSavings)).length > 13 ? "text-sm" : String(formatCurrency(result.totalSavings)).length > 10 ? "text-base" : "text-lg"}`}
                >
                  {formatCurrency(result.totalSavings, result.currency)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                  Maitsys CSP (
                  {result.provider === "azure"
                    ? "7%"
                    : result.provider === "aws" || result.provider === "gcp"
                      ? "3.5%"
                      : "2%"}
                  )
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── BTP enhanced detail ── */}
      {result.provider === "btp" && <BtpDetail result={result} />}

      {/* ── Section summary ── */}
      {sections.length > 0 && (
        <Card>
          <div className="px-5 pt-4 pb-2 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
            <Layers className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold text-gray-900 dark:text-white tracking-wide">
              Section Breakdown
            </h3>
          </div>
          <div className="px-5 py-3 space-y-2">
            {sections.map((sec, i) => {
              const pct = total > 0 ? (sec.total / total) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                      {sec.name}
                    </span>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="text-[10px] text-gray-400 font-medium">
                        Tax: {formatCurrency(sec.tax, result.currency)}
                      </span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">
                        {formatCurrency(sec.total, result.currency)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: AZURE_COLORS[i % AZURE_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Charts ── */}
      {services.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wide mb-3">
                Cost Distribution
              </p>
              <div className="h-56 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={top8.map((s, i) => ({
                        ...s,
                        fill: COLORS[i % COLORS.length],
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="cost"
                      nameKey="name"
                      stroke="none"
                    >
                      {top8.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                          cornerRadius={4}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip total={total} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] text-gray-400 font-semibold">
                    {services.length} services
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrency(total, result.currency)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {top8.map((s, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[80px]">
                      {s.name}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wide mb-3">
                Service Spend
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={top8}
                    layout="vertical"
                    margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      type="number"
                      stroke="#94a3b8"
                      fontSize={9}
                      fontWeight="600"
                      tickFormatter={(v) =>
                        `$${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`
                      }
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={9}
                      fontWeight="600"
                      width={90}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) =>
                        v.length > 14 ? v.slice(0, 14) + "…" : v
                      }
                    />
                    <Tooltip
                      formatter={(v) => [
                        formatCurrency(v, result.currency),
                        "Cost",
                      ]}
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        fontSize: "11px",
                        fontWeight: "600",
                      }}
                    />
                    <Bar
                      dataKey="cost"
                      radius={[0, 4, 4, 0]}
                      animationDuration={700}
                    >
                      {top8.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wide">
                All Services — Cost Ranking
              </p>
              {result.totalSavings > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-3 h-3" />
                  Maitsys CSP Savings
                </div>
              )}
            </div>
            <div className="space-y-3">
              {services.map((svc, i) => {
                const pct = Math.round((svc.cost / maxSvc) * 100);
                const share = ((svc.cost / total) * 100).toFixed(1);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-5 text-center text-[10px] font-bold text-gray-400 shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                          {svc.name}
                        </span>
                        <div className="flex items-center gap-2 ml-2 shrink-0">
                          <span className="text-[10px] text-gray-400">
                            {share}%
                          </span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">
                            {formatCurrency(svc.cost, result.currency)}
                          </span>
                          {svc.savings > 0 && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              -{formatCurrency(svc.savings, result.currency)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: COLORS[i % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-8 text-center">
          <Info className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-400">
            Service breakdown not extracted
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Re-upload the PDF — service parsing requires text-based PDFs.
          </p>
        </Card>
      )}

      {/* ── CTA ── */}
      <div className="relative overflow-hidden bg-gray-900 rounded-2xl p-6 border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-20 -mt-20 pointer-events-none blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 rounded-full -ml-16 -mb-16 pointer-events-none blur-2xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1">
            <p className="text-xs font-bold text-orange-400 tracking-wider  mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Maitsys Cloud Cost Monitor
            </p>
            <h3 className="text-lg font-bold text-white mb-1.5">
              Save & track all your invoices in one place
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed max-w-md">
              Sign up to store parsed invoices, track month-over-month trends,
              set budget alerts, and get AI-powered cost savings recommendations
              across Azure & AWS.
            </p>
          </div>
          <div className="shrink-0 flex flex-col gap-2">
            <a
              href="https://www.maitsys.com/contact-us"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#D92D20] hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg shadow-red-600/25 active:scale-95 text-sm"
            >
              <Zap className="w-4 h-4" />
              Get Started Free
            </a>
            <a
              href="/login"
              className="text-xs text-gray-400 text-center hover:text-red-300 transition"
            >
              Already have an account? Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

ParsedResult.propTypes = {
  result: PropTypes.object.isRequired,
  fileName: PropTypes.string.isRequired,
  onReset: PropTypes.func.isRequired,
};

/* ── Upload zone (public, no auth) ────────────────────────── */

const DemoUploadZone = ({ onParsed }) => {
  const [dragging, setDragging] = useState(false);
  const [provider, setProvider] = useState("azure");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      const ext = file.name.split(".").pop().toLowerCase();
      const allowedExts = provider === "btp" ? ["xlsx"] : ["pdf"];
      if (!allowedExts.includes(ext)) {
        setError(
          provider === "btp"
            ? "SAP BTP invoices must be an XLSX file."
            : `${provider === "aws" ? "AWS" : provider === "gcp" ? "GCP" : "Azure"} invoices must be a PDF file.`,
        );
        return;
      }
      setParsing(true);
      setError("");
      try {
        let result;
        if (provider === "btp") {
          const buffer = await file.arrayBuffer();
          result = await parseBTPXlsx(buffer);
        } else {
          const buffer = await file.arrayBuffer();
          result = await parsePDFInBrowser(buffer, provider);
        }
        if (!result.totalCost || result.totalCost <= 0) {
          setError("Could not extract cost data from this file. Please ensure it is a valid cloud invoice.");
          return;
        }
        if (!result.services || result.services.length === 0) {
          setError("No service line items found in this file. Please ensure it is a valid cloud invoice.");
          return;
        }
        if (!result.month || !result.year) {
          setError("Could not determine billing period from this file. Please ensure it is a valid cloud invoice.");
          return;
        }
        onParsed(result, file.name);
      } catch (err) {
        setError(err.message || "Parsing failed. Check the file format.");
      } finally {
        setParsing(false);
      }
    },
    [provider, onParsed],
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile],
  );

  return (
    <div className="w-full max-w-lg mx-auto space-y-5">
      {/* Privacy notice */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800">
        <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 leading-relaxed">
          We don&apos;t store your invoice data unless you register.{" "}
          <span className="font-normal opacity-80">
            Everything is parsed directly in your browser — your file never
            leaves your device.
          </span>
        </p>
      </div>

      {/* Provider toggle */}
      <div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 tracking-wide">
          Cloud Provider
        </p>
        <div className="flex gap-2">
          {[
            {
              id: "azure",
              label: "Azure",
              icon: <AzureIcon className="w-5 h-5" />,
              activeClass:
                "border-blue-400 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",
            },
            {
              id: "aws",
              label: "AWS",
              icon: <AwsIcon className="w-7 h-4" />,
              activeClass:
                "border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300",
            },
            {
              id: "btp",
              label: "SAP BTP",
              icon: <BtpIcon className="w-10 h-5" />,
              activeClass:
                "border-[#0070F2] bg-blue-50 dark:bg-blue-950/30 text-[#0057A8] dark:text-blue-300",
            },
            {
              id: "gcp",
              label: "GCP",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                  <path
                    d="M17.6 11.8c0-.1 0-.2-.1-.3l-2.1-3.6c-.1-.2-.3-.3-.5-.3H9.1c-.2 0-.4.1-.5.3L6.5 11.5c-.1.1-.1.2-.1.3s0 .2.1.3l2.1 3.6c.1.2.3.3.5.3h5.8c.2 0 .4-.1.5-.3l2.1-3.6c.1-.1.1-.2.1-.3z"
                    fill="#3b82f6"
                  />
                  <circle cx="12" cy="12" r="2.2" fill="white" />
                  <circle cx="12" cy="12" r="1" fill="#3b82f6" />
                </svg>
              ),
              activeClass:
                "border-blue-400 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",
            },
          ].map(({ id, label, icon, activeClass }) => (
            <button
              key={id}
              onClick={() => setProvider(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all ${
                provider === id
                  ? activeClass
                  : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-14 cursor-pointer transition-all duration-200 ${
          dragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-800/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={provider === "btp" ? ".xlsx" : ".pdf"}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {parsing ? (
          <>
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Parsing invoice…
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Extracting services & costs
            </p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mb-4 shadow-sm">
              <CloudUpload className="w-7 h-7 text-blue-500" />
            </div>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
              Drop your invoice here
            </p>
            <p className="text-xs text-gray-400 mt-1.5">
              or{" "}
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                browse to upload
              </span>
            </p>
            <div className="flex items-center gap-3 mt-4">
              {provider === "btp" ? (
                <span className="flex items-center gap-1 text-[11px] text-[#0070F2] font-semibold px-2.5 py-1 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <FileText className="w-3 h-3" />
                  XLSX only
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <FileText className="w-3 h-3" />
                  PDF only
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-3 px-8 text-center">
              Parsed entirely in your browser · we don&apos;t store your invoice
              data unless you register
            </p>
          </>
        )}
      </div>

      {/* Sample data shortcut */}
      {!parsing && (
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            or
          </span>
          <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
        </div>
      )}
      {!parsing && (
        <button
          type="button"
          onClick={() =>
            onParsed(SAMPLE_INVOICE_RESULT, "sample-azure-invoice.pdf")
          }
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-blue-200 dark:border-blue-800 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          View a sample invoice instead
        </button>
      )}
    </div>
  );
};

DemoUploadZone.propTypes = { onParsed: PropTypes.func.isRequired };

/* ── Main page ─────────────────────────────────────────────── */

const InvoiceDemoPage = () => {
  const [result, setResult] = useState(null);
  const [fileName, setFileName] = useState("");

  const handleParsed = (res, name) => {
    setResult(res);
    setFileName(name);
  };

  const handleReset = () => {
    setResult(null);
    setFileName("");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 pb-20">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm">
              <Receipt className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
              CCM Invoice Parser
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
              DEMO
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/login"
              className="text-xs font-bold text-gray-500 hover:text-[#D92D20] dark:text-gray-400 dark:hover:text-red-400 transition px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              Sign in
            </a>
            <a
              href="https://www.maitsys.com/contact-us"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold bg-[#D92D20] hover:bg-red-700 text-white px-4 py-1.5 rounded-lg transition shadow-sm shadow-red-600/20"
            >
              Contact Us
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {!result ? (
          <>
            {/* ── Hero ── */}
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 text-xs font-bold text-blue-600 dark:text-blue-400">
                <Zap className="w-3 h-3" />
                Instant Browser Parsing — No Login Required
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent leading-tight">
                Parse Your Cloud Invoice
                <br className="hidden sm:block" /> in Seconds
              </h1>
              <p className="text-base text-gray-500 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
                Upload an Azure, AWS, or SAP BTP invoice (PDF or CSV) and get an
                instant visual breakdown of your cloud spend — services, costs,
                taxes, and Maitsys CSP savings.
              </p>
            </div>

            {/* ── Feature pills ── */}
            <div className="flex flex-wrap justify-center gap-3">
              {[
                {
                  icon: Shield,
                  text: "We don't store your data unless you register",
                },
                { icon: TrendingUp, text: "Service cost ranking" },
                { icon: Sparkles, text: "Maitsys CSP savings preview" },
                { icon: BarChart2, text: "Visual charts & breakdown" },
              ].map(({ icon: Icon, text }, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm"
                >
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                  {text}
                </span>
              ))}
            </div>

            {/* ── Upload zone card ── */}
            <Card className="p-8">
              <DemoUploadZone onParsed={handleParsed} />
            </Card>

            {/* ── Supported formats ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  provider: "azure",
                  icon: <AzureIcon className="w-5 h-5" />,
                  title: "Microsoft Azure",
                  desc: "PDF invoices from the Azure portal billing section (Billing → Invoices → Download PDF).",
                  color: "blue",
                },
                {
                  provider: "aws",
                  icon: <AwsIcon className="w-8 h-4" />,
                  title: "Amazon Web Services",
                  desc: "PDF invoices from the AWS Billing console (Billing → Invoices → Download PDF).",
                  color: "orange",
                },
                {
                  provider: "btp",
                  icon: <BtpIcon className="w-12 h-6" />,
                  title: "SAP Business Technology Platform",
                  desc: "XLSX cost reports exported from the SAP BTP Cost Management service (Global Account → Cost Management → Export).",
                  color: "sap",
                },
              ].map(({ icon, title, desc, color }) => (
                <Card
                  key={title}
                  className={`p-5 border-l-4 ${color === "blue" ? "border-l-blue-500" : color === "sap" ? "border-l-[#0070F2]" : "border-l-orange-500"}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {icon}
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {title}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {desc}
                  </p>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* ── Back button ── */}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Upload another invoice
            </button>

            {/* ── Result banner ── */}
            <div className="flex items-center gap-3 px-5 py-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 rounded-2xl">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  Invoice parsed successfully
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {fileName} · {MONTH_NAMES[result.month - 1]} {result.year} ·{" "}
                  {result.provider === "aws"
                    ? "Amazon Web Services"
                    : result.provider === "btp"
                      ? "SAP Business Technology Platform"
                      : "Microsoft Azure"}
                </p>
              </div>
            </div>

            {/* ── Parsed result ── */}
            <ParsedResult
              result={result}
              fileName={fileName}
              onReset={handleReset}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default InvoiceDemoPage;
