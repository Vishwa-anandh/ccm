import ReactDOM from "react-dom";
import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  ReferenceLine,
} from "recharts";
import {
  DollarSign,
  Activity,
  Calendar,
  PieChart as PieIcon,
  AlertTriangle,
  MapPin,
  List,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  Target,
  Layers,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { AccountContext } from "../context/AccountContext";
import api from "../../api";
import { useMspRates } from "../../hooks/useMspRates";
import { formatCurrency, formatDateShort } from "../../utils/formatters";
import InstancesCard from "../components/InstancesCard";
import BudgetsCard from "../components/BudgetsCard";
import ServiceCategoryCard from "../../components/ServiceCategoryCard";
import DayComparisonCard from "../../components/DayComparisonCard";
import DailyHistoryCharts from "../../components/DailyHistoryCharts";
import DailyCostHistoryTabs from "../../components/DailyCostHistoryTabs";
import KpiTooltip from "../../components/KpiTooltip";

const API_BASE = "/aws";

// Maps known AWS usage type suffixes → human-readable labels
const USAGE_TYPE_LABELS = {
  // EC2
  "BoxUsage": "EC2 Instance Hours",
  "SpotUsage": "EC2 Spot Instance Hours",
  "DedicatedUsage": "EC2 Dedicated Host Hours",
  "HeavyUsage": "EC2 Reserved Instance Hours",
  "InstanceUsage": "EC2 Instance Usage",
  // Data Transfer
  "DataTransfer-Out-Bytes": "Data Transfer Out",
  "DataTransfer-In-Bytes": "Data Transfer In",
  "DataTransfer-Regional-Bytes": "Data Transfer (Regional)",
  "DataTransfer-Internet-Out-Bytes": "Data Transfer to Internet",
  // S3
  "TimedStorage-ByteHrs": "S3 Standard Storage",
  "EarlyDelete-ByteHrs": "S3 Early Deletion (Glacier)",
  "GlacierStorage-ByteHrs": "S3 Glacier Storage",
  "StandardIAStorage-ByteHrs": "S3 Standard-IA Storage",
  "IntelligentTieringStorage-ByteHrs": "S3 Intelligent-Tiering Storage",
  "Standard-Retrieval-Bytes": "S3 Standard Retrieval",
  "Retrieval-SIA": "S3 Standard-IA Retrieval",
  "Requests-Tier1": "S3 PUT/COPY/POST Requests",
  "Requests-Tier2": "S3 GET/SELECT Requests",
  "Requests-GDA-Tier1": "S3 Glacier PUT Requests",
  "Requests-GDA-Tier2": "S3 Glacier GET Requests",
  // RDS
  "InstanceUsage:db": "RDS Instance Hours",
  "RDS:StorageUsage": "RDS Storage",
  "RDS:MultiAZ-Storage": "RDS Multi-AZ Storage",
  "RDS:BackupUsage": "RDS Backup Storage",
  "RDS:GP2-Storage": "RDS GP2 Storage",
  "RDS:Aurora:StorageUsage": "Aurora Storage",
  // VPC / Networking
  "PublicIPv4:InUseAddress": "Public IPv4 Address (In Use)",
  "PublicIPv4:IdleAddress": "Public IPv4 Address (Idle)",
  "VpcEndpoint-Hours": "VPC Endpoint Hours",
  "NatGateway-Hours": "NAT Gateway Hours",
  "NatGateway-Bytes": "NAT Gateway Data Processing",
  "TransitGateway-Hours": "Transit Gateway Hours",
  "TransitGateway-Bytes": "Transit Gateway Data",
  "VPN-Connection-Hours": "VPN Connection Hours",
  // Lambda
  "Lambda-GB-Second": "Lambda Compute (GB-seconds)",
  "Lambda-Edge-GB-Second": "Lambda@Edge Compute",
  "Request": "Lambda Requests",
  "Lambda-Edge-Request": "Lambda@Edge Requests",
  // CloudWatch
  "GMD-Metrics": "CloudWatch Custom Metrics",
  "CW:Alarms": "CloudWatch Alarms",
  "CW:Logs": "CloudWatch Logs Storage",
  "CW:LogDelivery": "CloudWatch Log Delivery",
  // WorkSpaces
  "AW-HW-9-AutoStop-User": "WorkSpace (AutoStop, Standard)",
  "AW-SW19-401": "WorkSpace Software Bundle",
  "WorkSpaces:WorkSpace-Monthly": "WorkSpace Monthly",
  // CloudFront
  "HTTPS-Bytes": "CloudFront HTTPS Data Transfer",
  "HTTP-Requests-Tier1": "CloudFront HTTP Requests",
  "CloudFront-Invalidations": "CloudFront Invalidations",
  // DynamoDB
  "WriteRequestUnits": "DynamoDB Write Request Units",
  "ReadRequestUnits": "DynamoDB Read Request Units",
  "TimedStorage-ByteHrs-DDB": "DynamoDB Storage",
  // ECS / Fargate
  "Fargate-vCPU-Hours:perCPU": "Fargate vCPU Hours",
  "Fargate-GB-Hours:perGB": "Fargate Memory (GB-hours)",
  // SNS / SQS
  "DeliveryAttempts-HTTP": "SNS HTTP Deliveries",
  "Requests-Tier1-SQS": "SQS Requests",
  // Secrets Manager
  "AmazonSecretsManager-Secrets": "Secrets Manager Secrets",
  // EKS
  "EKS-Cluster-Hours": "EKS Cluster Hours",
  // ElastiCache
  "NodeUsage:cache": "ElastiCache Node Hours",
};

// Strip region prefix (e.g. "USE1-", "USE2-", "APS1-", "EUW1-") then map to label
function formatUsageType(raw) {
  if (!raw || raw === "Unknown") return "Other Usage";
  // Strip region prefix like USE2-, USE1-, APS1-, SAE1-, EUW1-, EUN1-, etc.
  const stripped = raw.replace(/^[A-Z]{2,4}\d?-/, "");
  // Exact match after stripping
  if (USAGE_TYPE_LABELS[stripped]) return USAGE_TYPE_LABELS[stripped];
  // Partial prefix match (e.g. "BoxUsage:r5.xlarge" → "EC2 Instance Hours (r5.xlarge)")
  for (const [key, label] of Object.entries(USAGE_TYPE_LABELS)) {
    if (stripped.startsWith(key)) {
      const suffix = stripped.slice(key.length).replace(/^[:-]/, "");
      return suffix ? `${label} (${suffix})` : label;
    }
  }
  // Fallback: replace hyphens/colons with spaces and title-case
  return stripped
    .replace(/[-:]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
const AWS_ACTION_LABELS = {
  PurchaseSavingsPlans: "Purchase Savings Plans",
  RightSize: "Right-size Instance",
  Stop: "Stop Unused Resource",
  Upgrade: "Upgrade Resource",
  Migrate: "Migrate Resource",
  PurchaseReservedInstances: "Purchase Reserved Instances",
  Delete: "Delete Unused Resource",
  Scale: "Scale Resource",
  MigrateToGraviton: "Migrate to Graviton",
  SwitchToAmd: "Switch to AMD",
};
const MONTH_LABELS = [
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
const AWS_COLORS = [
  "#FF9900",
  "#FF6B00",
  "#FFB347",
  "#FFA500",
  "#E07B00",
  "#FFCC80",
  "#FFE0B2",
];
const REGION_COLORS = [
  "#FF9900",
  "#F97316",
  "#EF4444",
  "#10B981",
  "#3B82F6",
  "#A855F7",
  "#06B6D4",
];

/* â"€â"€â"€ reusable pieces â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */

const KpiCard = ({
  title,
  value,
  icon,
  sub,
  subColor,
  accent = "gray",
  targetId,
  onClick,
}) => {
  const accents = {
    aws: "text-orange-600 dark:text-orange-400",
    gray: "text-gray-500 dark:text-gray-400",
    green: "text-emerald-600 dark:text-emerald-400",
    blue: "text-blue-600 dark:text-blue-400",
  };
  const hoverBorders = {
    aws: "hover:border-orange-300 dark:hover:border-orange-700",
    gray: "hover:border-gray-300 dark:hover:border-gray-600",
    green: "hover:border-emerald-300 dark:hover:border-emerald-700",
    blue: "hover:border-blue-300 dark:hover:border-blue-700",
  };
  const hoverGlows = {
    aws: "from-orange-500/8",
    gray: "from-gray-500/6",
    green: "from-emerald-500/8",
    blue: "from-blue-500/8",
  };
  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  const isClickable = !!(targetId || onClick);
  return (
    <div
      onClick={handleClick}
      className={`bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 transition-all duration-200 hover:-translate-y-1 relative overflow-hidden group ${hoverBorders[accent]} ${isClickable ? "cursor-pointer" : ""}`}
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
      }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1 pr-2">
            <p className="section-title mb-1">{title}</p>
            <p
              className="text-lg line-clamp-2 font-bold text-gray-900 dark:text-white tracking-tight tabular-nums break-all leading-tight"
              title={String(value)}
            >
              {value}
            </p>
          </div>
          <div className={`p-2 rounded-xl shrink-0 ${accents[accent]}`}>
            {icon}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p
            className={`text-xs font-semibold leading-snug ${subColor ?? "text-gray-400"}`}
          >
            {sub}
          </p>
          {isClickable && (
            <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600 group-hover:text-gray-400 transition-colors">
              View →
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const SVC_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#ec4899",
];

const isS3Service = (name) =>
  name && (name.toLowerCase().includes("s3") || name.toLowerCase().includes("simple storage"));

const ServiceBreakdownRow = ({
  svc,
  i,
  details,
  totalCost,
  s3Buckets,
  formatCurrency,
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const svcDetails = details.filter((d) => d.service === svc.name);
  const pct = totalCost > 0 ? (svc.value / totalCost) * 100 : 0;
  const color = SVC_COLORS[i % SVC_COLORS.length];
  const showBuckets = isS3Service(svc.name) && s3Buckets.length > 0;
  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors text-left"
      >
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex-1 truncate">
          {svc.name}
        </span>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5">
            <div className="w-24 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
          <span className="text-[10px] text-gray-400 w-10 text-right">
            {pct.toFixed(1)}%
          </span>
          <span className="text-xs font-bold text-gray-900 dark:text-white w-20 text-right">
            {formatCurrency(svc.value)}
          </span>
          {(svcDetails.length > 0 || showBuckets) && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 w-16 text-center">
              {showBuckets ? `${s3Buckets.length} bucket${s3Buckets.length !== 1 ? "s" : ""}` : `${svcDetails.length} ${svcDetails.length === 1 ? "type" : "types"}`}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {expanded && (
        <div className="bg-gray-50/70 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800/60 divide-y divide-gray-100 dark:divide-gray-800/60">
          {/* S3: show actual bucket names first */}
          {showBuckets && (
            <div className="pl-10 pr-5 py-2.5">
              <p className="text-[10px] font-bold text-blue-500 tracking-wider mb-2">
                YOUR S3 BUCKETS ({s3Buckets.length})
              </p>
              <div className="space-y-1">
                {s3Buckets.map((b, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 font-mono">
                      {b.name}
                    </span>
                    {b.creationDate && (
                      <span className="text-[10px] text-gray-400 ml-auto">
                        Created {new Date(b.creationDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Billing usage type breakdown */}
          {svcDetails.length > 0 && (
            <>
              {showBuckets && (
                <div className="pl-10 pr-5 py-1.5">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                    BILLING CATEGORIES
                  </p>
                </div>
              )}
              {svcDetails.map((d, j) => (
                <div key={j} className="flex items-center gap-3 pl-10 pr-5 py-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 block truncate">
                      {formatUsageType(d.usageType)}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono block truncate">
                      {d.usageType}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 shrink-0">
                    {formatCurrency(d.cost)}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};
ServiceBreakdownRow.propTypes = {
  svc: PropTypes.shape({ name: PropTypes.string, value: PropTypes.number })
    .isRequired,
  i: PropTypes.number.isRequired,
  details: PropTypes.array.isRequired,
  totalCost: PropTypes.number.isRequired,
  s3Buckets: PropTypes.array.isRequired,
  formatCurrency: PropTypes.func.isRequired,
};

const ServiceBreakdownCard = ({
  services,
  details,
  totalCost,
  s3Buckets,
  formatCurrency,
}) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
    <div className="flex items-start justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
      <div>
        <p className="text-xs font-bold text-gray-500 tracking-wider">
          Service Breakdown
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          <span className="font-semibold text-indigo-500">
            {services.length} service types
          </span>
          {" · "}
          <span className="font-semibold text-gray-600 dark:text-gray-400">
            {details.length} usage line items
          </span>
        </p>
      </div>
    </div>
    <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800/60">
      {services.map((svc, i) => (
        <ServiceBreakdownRow
          key={svc.name}
          svc={svc}
          i={i}
          details={details}
          totalCost={totalCost}
          s3Buckets={s3Buckets}
          formatCurrency={formatCurrency}
        />
      ))}
    </div>
  </div>
);
ServiceBreakdownCard.propTypes = {
  services: PropTypes.array.isRequired,
  details: PropTypes.array.isRequired,
  totalCost: PropTypes.number.isRequired,
  s3Buckets: PropTypes.array.isRequired,
  formatCurrency: PropTypes.func.isRequired,
};

const RESOURCE_ICONS = {
  server: "🖥️",
  database: "🗄️",
  zap: "⚡",
  layers: "📦",
  shield: "🛡️",
};

const RESOURCE_COLORS = [
  "#f59e0b",
  "#6366f1",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#f97316",
  "#14b8a6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#a855f7",
  "#f43f5e",
  "#0ea5e9",
  "#22c55e",
];

const ResourceDetailModal = ({ accountId, resourceType, onClose }) => {
  const [items, setItems] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    setLoading(true);
    api.get(`/aws/resource-list?type=${encodeURIComponent(resourceType.toLowerCase())}`, {
      headers: { "x-account-id": accountId },
    })
      .then(r => { setItems(r.data.items ?? []); })
      .catch(() => setError("Failed to load resource details"))
      .finally(() => setLoading(false));
  }, [accountId, resourceType]);

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[75vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{resourceType}</h3>
            {items !== null && (
              <p className="text-[11px] text-gray-400 mt-0.5">{items.length} resource{items.length !== 1 ? "s" : ""} found</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-3">
          {loading && (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Scanning AWS APIs…</span>
            </div>
          )}
          {error && <p className="text-sm text-red-500 py-6 text-center">{error}</p>}
          {!loading && !error && items?.length === 0 && (
            <p className="text-sm text-gray-400 py-6 text-center">No resources found or insufficient IAM permissions.</p>
          )}
          {!loading && !error && items?.length > 0 && (
            <div className="space-y-1">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <span className="w-5 h-5 rounded-md bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">{i + 1}</span>
                  </span>
                  <span className="text-[11px] font-mono text-gray-700 dark:text-gray-300 flex-1 truncate">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
ResourceDetailModal.propTypes = {
  accountId: PropTypes.string.isRequired,
  resourceType: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

const ResourceBreakdownCard = ({ resources, accountId }) => {
  const [selected, setSelected] = React.useState(null);
  if (!resources || resources.total === 0) return null;
  const { total, byType } = resources;
  const sorted = [...byType].sort((a, b) => b.count - a.count);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      {selected && (
        <ResourceDetailModal
          accountId={accountId}
          resourceType={selected}
          onClose={() => setSelected(null)}
        />
      )}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
        <div>
          <p className="text-xs font-bold text-gray-500 tracking-wider">
            Resource Inventory
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            <span className="font-semibold text-amber-500">
              {total.toLocaleString()} total resources
            </span>
            {" · "}
            <span className="text-gray-500">
              {sorted.length} resource types · click any tile to see details
            </span>
          </p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-semibold border border-amber-100 dark:border-amber-800/40">
          AWS APIs
        </span>
      </div>
      <div className="max-h-[420px] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0 divide-x divide-y divide-gray-50 dark:divide-gray-800/60">
        {sorted.map((t, i) => {
          const pct = total > 0 ? (t.count / total) * 100 : 0;
          const color = RESOURCE_COLORS[i % RESOURCE_COLORS.length];
          return (
            <button
              key={t.type}
              onClick={() => setSelected(t.type)}
              className="px-4 py-3.5 flex flex-col gap-1.5 text-left hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-colors group"
              title={`Click to see ${t.type} details`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm leading-none">
                  {RESOURCE_ICONS[t.icon] ?? "📦"}
                </span>
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 truncate leading-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {t.type}
                </span>
              </div>
              <p
                className="text-lg font-bold tabular-nums leading-tight"
                style={{ color }}
              >
                {t.count.toLocaleString()}
              </p>
              <div className="w-full h-1 rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max(pct, 1)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-400">{pct.toFixed(1)}%</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
ResourceBreakdownCard.propTypes = {
  resources: PropTypes.shape({
    total: PropTypes.number,
    byType: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        count: PropTypes.number,
        icon: PropTypes.string,
      }),
    ),
  }),
  accountId: PropTypes.string,
};

const Card = ({ title, icon, children, className = "", id }) => (
  <div
    className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden ${className}`}
    id={id}
    style={{
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
    }}
  >
    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
      <div className="p-2 rounded-xl text-orange-600 dark:text-orange-400 shrink-0">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
        {title}
      </h3>
    </div>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-lg">
      <p className="text-xs font-bold text-gray-500 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
          {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

/* â"€â"€â"€ helpers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */

function fmtResourceType(type) {
  if (!type) return "Unknown";
  return type
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\bEc2\b/gi, "EC2")
    .replace(/\bEbs\b/gi, "EBS")
    .replace(/\bRds\b/gi, "RDS")
    .replace(/\bDb\b/gi, "DB");
}
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function shortId(id) {
  if (!id) return "";
  const parts = id.split("/");
  const last = parts[parts.length - 1] || id;
  return UUID_RE.test(last) ? "Account-wide" : last;
}

function awsSvcSavings(name, recs) {
  const n = name.toLowerCase();
  return recs
    .filter((r) => {
      const t = (r.resource_type || "").toLowerCase();
      if (
        (t.includes("ec2") || t.includes("ec2instance")) &&
        (n.includes("ec2") || n.includes("elastic compute"))
      )
        return true;
      if (
        (t.includes("rds") || t.includes("rdsdb")) &&
        (n.includes("rds") ||
          n.includes("relational database") ||
          n.includes("aurora"))
      )
        return true;
      if (t.includes("lambda") && n.includes("lambda")) return true;
      if (
        (t.includes("ebs") || t.includes("ebsvolume")) &&
        (n.includes("ebs") ||
          n.includes("elastic block") ||
          n.includes("block store"))
      )
        return true;
      if (
        (t.includes("savings") || t.includes("savingsplan")) &&
        (n.includes("savings") ||
          n.includes("reserved") ||
          n.includes("compute"))
      )
        return true;
      return false;
    })
    .reduce((s, r) => s + Number(r.estimated_savings || 0), 0);
}

function getLast12Months() {
  const now = new Date();
  const result = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return result;
}

function pct(a, b) {
  if (!b || b === 0) return null;
  return ((a - b) / b) * 100;
}

function getPrevMonth(year, month) {
  const d = new Date(year, month - 2, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/* â"€â"€â"€ InsightItem â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
const InsightItem = ({ title, desc, colorCls, bgCls, children }) => (
  <div className={`rounded-2xl p-4 flex flex-col gap-2.5 ${bgCls}`}>
    <div className="flex items-start gap-2">
      {children}
      <p className={`text-sm font-bold leading-tight ${colorCls}`}>{title}</p>
    </div>
    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
      {desc}
    </p>
  </div>
);
InsightItem.propTypes = {
  title: PropTypes.string.isRequired,
  desc: PropTypes.string.isRequired,
  colorCls: PropTypes.string.isRequired,
  bgCls: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

/* â"€â"€â"€ InsightsPanel â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
const InsightsPanel = ({
  totalCost,
  forecast,
  services,
  yearlyData,
  nowYear,
  nowMonth,
  budgets,
}) => {
  const prev = getPrevMonth(nowYear, nowMonth);
  const prevMonth = yearlyData.find(
    (m) => m.year === prev.year && m.month === prev.month,
  );
  const momChange = prevMonth?.totalCost
    ? pct(totalCost, prevMonth.totalCost)
    : null;

  const topService = services?.[0];
  const topSvcPct =
    topService && totalCost > 0
      ? ((topService.value / totalCost) * 100).toFixed(1)
      : null;
  const forecastPctNum =
    forecast && totalCost > 0 ? (totalCost / forecast) * 100 : null;
  const mainBudget = budgets?.find((b) => b.limit > 0);
  const budgetPctNum = mainBudget
    ? (mainBudget.actual / mainBudget.limit) * 100
    : null;
  const budgetOver = mainBudget ? mainBudget.actual > mainBudget.limit : false;
  const forecastHigh = forecastPctNum !== null && forecastPctNum > 85;

  return (
    <Card title="Cost Insights" icon={<Lightbulb className="w-4 h-4" />}>
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* MoM change */}
        {momChange !== null ? (
          <InsightItem
            title={`${momChange > 0 ? "+" : ""}${momChange.toFixed(1)}% vs last month`}
            desc={`Spend ${momChange > 0 ? "up" : "down"} from ${formatCurrency(prevMonth.totalCost)} to ${formatCurrency(totalCost)}`}
            colorCls={
              momChange > 0
                ? "text-red-600 dark:text-red-400"
                : "text-emerald-600 dark:text-emerald-400"
            }
            bgCls={
              momChange > 0
                ? "bg-red-50 dark:bg-red-950/30"
                : "bg-emerald-50 dark:bg-emerald-950/30"
            }
          >
            {momChange > 0 ? (
              <ArrowUpRight className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            )}
          </InsightItem>
        ) : (
          <InsightItem
            title="MoM trend unavailable"
            desc="Fetch 12-month history to compare month-over-month spend"
            colorCls="text-gray-500 dark:text-gray-400"
            bgCls="bg-gray-50 dark:bg-gray-800/50"
          >
            <Calendar className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          </InsightItem>
        )}

        {/* Top service */}
        <InsightItem
          title={topService ? topService.name : "No service data"}
          desc={
            topService
              ? `${formatCurrency(topService.value)} Â· ${topSvcPct}% of total spend`
              : "No service breakdown available yet"
          }
          colorCls="text-orange-600 dark:text-orange-400"
          bgCls="bg-orange-50 dark:bg-orange-950/30"
        >
          <Zap className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
        </InsightItem>

        {/* Forecast */}
        <InsightItem
          title={
            forecast ? `Forecast: ${formatCurrency(forecast)}` : "Forecast N/A"
          }
          desc={
            forecastPctNum !== null
              ? `${forecastPctNum.toFixed(0)}% of projected spend used — ${forecastHigh ? "approaching limit" : "on track"}`
              : "Insufficient spend history for AWS to generate a forecast"
          }
          colorCls={
            forecastHigh
              ? "text-amber-600 dark:text-amber-400"
              : "text-blue-600 dark:text-blue-400"
          }
          bgCls={
            forecastHigh
              ? "bg-amber-50 dark:bg-amber-950/30"
              : "bg-blue-50 dark:bg-blue-950/30"
          }
        >
          <TrendingUp
            className={`w-4 h-4 shrink-0 mt-0.5 ${forecastHigh ? "text-amber-500" : "text-blue-500"}`}
          />
        </InsightItem>

        {/* Budget */}
        {mainBudget ? (
          <InsightItem
            title={
              budgetOver
                ? `Over by ${formatCurrency(mainBudget.actual - mainBudget.limit)}`
                : `${formatCurrency(mainBudget.limit - mainBudget.actual)} remaining`
            }
            desc={`${mainBudget.budgetName} Â· ${budgetPctNum.toFixed(0)}% of ${formatCurrency(mainBudget.limit)} used`}
            colorCls={
              budgetOver
                ? "text-red-600 dark:text-red-400"
                : "text-emerald-600 dark:text-emerald-400"
            }
            bgCls={
              budgetOver
                ? "bg-red-50 dark:bg-red-950/30"
                : "bg-emerald-50 dark:bg-emerald-950/30"
            }
          >
            <Target
              className={`w-4 h-4 shrink-0 mt-0.5 ${budgetOver ? "text-red-500" : "text-emerald-500"}`}
            />
          </InsightItem>
        ) : (
          <InsightItem
            title="No budgets configured"
            desc="Set up AWS budgets to track spend against your targets"
            colorCls="text-gray-500 dark:text-gray-400"
            bgCls="bg-gray-50 dark:bg-gray-800/50"
          >
            <Target className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          </InsightItem>
        )}
      </div>
    </Card>
  );
};
InsightsPanel.propTypes = {
  totalCost: PropTypes.number.isRequired,
  forecast: PropTypes.number,
  services: PropTypes.array.isRequired,
  yearlyData: PropTypes.array.isRequired,
  nowYear: PropTypes.number.isRequired,
  nowMonth: PropTypes.number.isRequired,
  budgets: PropTypes.array.isRequired,
};

/* â"€â"€â"€ TopMovers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
function getMoverStatus(change) {
  if (change === null) return "new";
  return change > 0 ? "up" : "down";
}

const TopMovers = ({ services, yearlyData, nowYear, nowMonth, totalCost }) => {
  const prev = getPrevMonth(nowYear, nowMonth);
  const prevMonth = yearlyData.find(
    (m) => m.year === prev.year && m.month === prev.month,
  );

  const movers = useMemo(
    () =>
      services
        .slice(0, 8)
        .map((svc) => {
          const prevSvc = prevMonth?.topServices?.find(
            (s) => s.name === svc.name,
          );
          const change = prevSvc?.cost ? pct(svc.value, prevSvc.cost) : null;
          return {
            name: svc.name,
            current: svc.value,
            change,
            pctOfTotal: totalCost > 0 ? (svc.value / totalCost) * 100 : 0,
          };
        })
        .sort((a, b) => (b.change ?? 0) - (a.change ?? 0)),
    [services, prevMonth, totalCost],
  );

  if (!services.length) return null;

  return (
    <Card title="Cost Movers" icon={<TrendingUp className="w-4 h-4" />}>
      {!prevMonth && (
        <div className="px-5 pt-0 pb-3">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 rounded-xl">
            Fetch 12-month history to unlock month-over-month change for each
            service.
          </p>
        </div>
      )}
      <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {movers.map((m, i) => {
          const status = getMoverStatus(m.change);
          const badgeCls =
            status === "up"
              ? "text-red-600 dark:text-red-400"
              : "text-emerald-600 dark:text-emerald-400";
          return (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-3 rounded-xl border border-gray-100 dark:border-gray-800"
            >
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                {status === "up" ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : status === "down" ? (
                  <TrendingDown className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Zap className="w-4 h-4 text-orange-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-bold text-gray-900 dark:text-white truncate"
                  title={m.name}
                >
                  {m.name}
                </p>
                <p className="text-[11px] text-gray-500 font-medium">
                  {formatCurrency(m.current)} Â· {m.pctOfTotal.toFixed(1)}% of
                  total
                </p>
              </div>
              {m.change !== null && (
                <span className={`shrink-0 text-xs font-bold ${badgeCls}`}>
                  {status === "up" ? "+" : ""}
                  {m.change.toFixed(1)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
TopMovers.propTypes = {
  services: PropTypes.array.isRequired,
  yearlyData: PropTypes.array.isRequired,
  nowYear: PropTypes.number.isRequired,
  nowMonth: PropTypes.number.isRequired,
  totalCost: PropTypes.number.isRequired,
};

/* â"€â"€â"€ Main component â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */

const DetailedDashboard = () => {
  const { rates: mspRates } = useMspRates();
  const { accountId } = useParams();
  const navigate = useNavigate();
  const { accounts, accountsLoading, getAccount } = useContext(AccountContext);
  const account = getAccount(accountId);

  // Live snapshot state
  const [costData, setCostData] = useState([]);
  const [serviceData, setServiceData] = useState([]);
  const [detailsData, setDetailsData] = useState([]);
  const [regionData, setRegionData] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [instances, setInstances] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [resourcesData, setResourcesData] = useState(null);
  const [s3Buckets, setS3Buckets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState(null);
  const [savingsRecs, setSavingsRecs] = useState([]);

  // Yearly history state
  const [yearlyData, setYearlyData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null); // null = current month
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillProgress, setBackfillProgress] = useState(null); // {stage, month, saved, total}
  const [monthDropOpen, setMonthDropOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("executive");
  const [execSummaryOpen, setExecSummaryOpen] = useState(true);
  const monthDropRef = useRef(null);
  const aiRef = useRef(null);

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const last12 = useMemo(() => getLast12Months(), []);
  const isCurrentMonth =
    !selectedMonth ||
    (selectedMonth.year === nowYear && selectedMonth.month === nowMonth);

  const fetchAllData = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`${API_BASE}/aggregate`, {
        headers: { "x-account-id": account.id },
      });
      const d = res.data;

      if (d.seeding) {
        setSeeding(true);
        setLoading(false);
        return;
      }

      setSeeding(false);
      if (!d.costs) throw new Error("AWS Key Invalid/Missing");
      setCostData(d.costs ?? []);
      setServiceData(d.services ?? []);
      setDetailsData(d.details ?? []);
      setRegionData(d.regions ?? []);
      setForecast(d.forecast?.forecastAmount ?? null);
      setInstances(d.instances ?? []);
      setBudgets(d.budgets ?? []);
      setResourcesData(d.resources ?? null);
      setS3Buckets(d.s3Buckets ?? []);
    } catch (err) {
      setSeeding(false);
      setError(
        err.response?.data?.error || err.message || "Failed to fetch data",
      );
    } finally {
      setLoading(false);
    }
  }, [account]);

  const fetchYearlyData = useCallback(async () => {
    if (!account) return;
    try {
      const res = await api.get(`${API_BASE}/yearly?accountId=${account.id}`);
      setYearlyData(res.data ?? []);
    } catch {
      // yearly data is non-critical — fail silently
    }
  }, [account]);

  useEffect(() => {
    if (account) {
      setTimeout(() => {
        fetchAllData();
        fetchYearlyData();
      }, 0);
    }
  }, [account, accountId, fetchAllData, fetchYearlyData]);

  // Poll every 5 s while the backend is seeding a brand-new account snapshot
  useEffect(() => {
    if (!seeding || !account) return;
    const timer = setInterval(() => {
      fetchAllData();
    }, 5000);
    return () => clearInterval(timer);
  }, [seeding, account, fetchAllData]);

  // Fetch Maitsys CSP savings recommendations
  useEffect(() => {
    if (!accountId) return;
    api
      .get(`/recommendations?account_id=${accountId}&provider=aws`)
      .then((r) => setSavingsRecs(r.data?.data ?? []))
      .catch(() => {});
  }, [accountId]);

  // Close account menu when clicking outside
  useEffect(() => {
    if (!accountMenuOpen) return;
    const close = () => setAccountMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [accountMenuOpen]);

  // Close month/AI dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (monthDropRef.current && !monthDropRef.current.contains(e.target))
        setMonthDropOpen(false);
      if (aiRef.current && !aiRef.current.contains(e.target)) setAiOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const triggerBackfill = useCallback(() => {
    if (backfillLoading || !account) return;
    setBackfillLoading(true);
    setBackfillProgress({ stage: "fetching", message: "Connecting to AWS…" });

    const token = localStorage.getItem("token");
    const url = `${API_BASE}/backfill?accountId=${account.id}`;

    const es = new EventSource(`${url}&token=${encodeURIComponent(token ?? "")}`);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setBackfillProgress(data);
        if (data.stage === "done" || data.stage === "error") {
          es.close();
          setBackfillLoading(false);
          if (data.stage === "done") fetchYearlyData();
        }
      } catch {}
    };

    es.onerror = () => {
      es.close();
      setBackfillLoading(false);
      setBackfillProgress({ stage: "error", message: "Connection lost" });
    };
  }, [account, backfillLoading, fetchYearlyData]);

  /* â"€â"€ display data: switches between live and history â"€â"€ */
  const displayData = useMemo(() => {
    if (isCurrentMonth) {
      const totalCost = costData.reduce((a, c) => a + (c.Cost || 0), 0);
      return {
        totalCost,
        costs: costData,
        services: serviceData,
        regions: regionData,
        forecast,
        topService: serviceData[0] ?? null,
        topRegion: regionData[0] ?? null,
        isPast: false,
      };
    }
    const hist = yearlyData.find(
      (m) => m.year === selectedMonth.year && m.month === selectedMonth.month,
    );
    if (!hist) return null;
    const costs = (hist.dailyCosts ?? []).map((d) => ({
      date: d.date,
      Cost: d.cost,
    }));
    const services = (hist.topServices ?? []).map((s) => ({
      name: s.name,
      value: s.cost,
    }));
    const regions = hist.topRegions ?? [];
    const details = hist.details ?? [];
    return {
      totalCost: hist.totalCost,
      costs,
      services,
      regions,
      details,
      forecast: null,
      topService: services[0] ?? null,
      topRegion: regions[0] ?? null,
      isPast: true,
    };
  }, [
    selectedMonth,
    isCurrentMonth,
    costData,
    serviceData,
    regionData,
    forecast,
    yearlyData,
  ]);

  // Today's spend — null (not 0) when today's row hasn't synced yet, so the UI can
  // show "Syncing…" instead of a misleading $0.00 (AWS Cost Explorer can lag by up
  // to ~24-48h before the current day's row appears).
  const todayCost = useMemo(() => {
    if (!isCurrentMonth) return null;
    const todayStr = new Date().toISOString().slice(0, 10);
    const row = (displayData?.costs ?? []).find((c) => c.date === todayStr);
    return row ? Number(row.Cost ?? row.cost ?? 0) : null;
  }, [displayData, isCurrentMonth]);

  /* â"€â"€ yearly chart data â"€â"€ */
  const yearlyChartData = useMemo(() => {
    return last12.map((m, i) => {
      const found = yearlyData.find(
        (h) => h.year === m.year && h.month === m.month,
      );
      const prev =
        i > 0
          ? yearlyData.find(
              (h) =>
                h.year === last12[i - 1].year &&
                h.month === last12[i - 1].month,
            )
          : null;
      const cost = found?.totalCost ?? 0;
      const change = pct(cost, prev?.totalCost ?? 0);
      const isSel = selectedMonth
        ? selectedMonth.year === m.year && selectedMonth.month === m.month
        : m.year === nowYear && m.month === nowMonth;
      return {
        label: MONTH_LABELS[m.month - 1],
        year: m.year,
        month: m.month,
        cost,
        change,
        isSel,
      };
    });
  }, [yearlyData, selectedMonth, last12, nowYear, nowMonth]);

  const yearlyTotal = yearlyChartData.reduce((s, m) => s + m.cost, 0);
  const yearlyAvg = yearlyTotal / 12;
  const yearlyPeak = yearlyChartData.reduce(
    (best, m) => (m.cost > best.cost ? m : best),
    yearlyChartData[0] ?? { label: "-", cost: 0 },
  );

  /* â"€â"€ daily average for reference line â"€â"€ */
  const dailyAvg = useMemo(() => {
    const costs = displayData?.costs ?? [];
    if (!costs.length) return 0;
    return costs.reduce((s, c) => s + (c.Cost || 0), 0) / costs.length;
  }, [displayData?.costs]);

  /* â"€â"€ stacked monthly service chart â"€â"€ */
  const stackedKeys = useMemo(() => {
    const totals = {};
    yearlyData.forEach((mo) =>
      (mo.topServices ?? []).forEach((s) => {
        totals[s.name] = (totals[s.name] ?? 0) + s.cost;
      }),
    );
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([n]) => n);
  }, [yearlyData]);

  const stackedData = useMemo(
    () =>
      last12.map((m) => {
        const hist = yearlyData.find(
          (h) => h.year === m.year && h.month === m.month,
        );
        const row = { label: MONTH_LABELS[m.month - 1], Other: 0 };
        if (hist) {
          let topSum = 0;
          stackedKeys.forEach((name) => {
            const svc = hist.topServices?.find((s) => s.name === name);
            row[name] = svc?.cost ?? 0;
            topSum += row[name];
          });
          row.Other = Math.max(0, (hist.totalCost ?? 0) - topSum);
        }
        return row;
      }),
    [yearlyData, last12, stackedKeys],
  );

  /* -- proportional savings per detail row -- */
  const _detailSavingsGroups = useMemo(() => {
    const activeDetails = displayData?.isPast
      ? (displayData?.details ?? [])
      : detailsData;
    if (!savingsRecs.length || !activeDetails.length) return {};
    const groups = {};
    activeDetails.forEach((item) => {
      const svc = item.service || "";
      if (!(svc in groups)) {
        groups[svc] = {
          savings: awsSvcSavings(svc, savingsRecs),
          totalCost: 0,
        };
      }
      groups[svc].totalCost += Number(item.cost || 0);
    });
    return groups;
  }, [displayData, detailsData, savingsRecs]);

  /* â"€â"€ AI insights (must be before early returns — Rules of Hooks) â"€â"€ */
  const mspCspSavingsComputed = (displayData?.totalCost ?? 0) * (mspRates.aws ?? 0.035);
  const aiInsights = useMemo(() => {
    const insights = [];
    const total = displayData?.totalCost ?? 0;
    const svcs = displayData?.services ?? [];
    const prev = getPrevMonth(nowYear, nowMonth);
    const prevData = yearlyData.find(
      (m) => m.year === prev.year && m.month === prev.month,
    );
    const prevTotal = prevData?.totalCost ?? 0;
    const momPct =
      prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null;
    if (momPct !== null) {
      const dir = momPct > 0 ? "increased" : "decreased";
      insights.push({
        type: momPct > 15 ? "warning" : momPct < -5 ? "success" : "info",
        title: `Spend ${dir} ${Math.abs(momPct).toFixed(1)}% vs last month`,
        detail: `This month: ${formatCurrency(total)} vs ${formatCurrency(prevTotal)} last month. ${momPct > 15 ? "Review top services to identify cost drivers." : momPct < -5 ? "Good cost discipline — savings achieved." : "Spend is relatively stable."}`,
      });
    }
    if (svcs.length > 0) {
      const top = svcs[0];
      const topPct = total > 0 ? ((top.value / total) * 100).toFixed(1) : 0;
      const prevTopSvc = prevData?.topServices?.find(
        (s) => s.name === top.name,
      );
      const svcMom =
        prevTopSvc?.cost > 0
          ? (((top.value - prevTopSvc.cost) / prevTopSvc.cost) * 100).toFixed(1)
          : null;
      insights.push({
        type: Number(topPct) > 50 ? "warning" : "info",
        title: `${top.name} is your top cost driver`,
        detail: `${formatCurrency(top.value)} (${topPct}% of total).${svcMom !== null ? ` ${Number(svcMom) > 0 ? "Up" : "Down"} ${Math.abs(Number(svcMom))}% MoM.` : ""} ${Number(topPct) > 50 ? "Consider Reserved Instances or Savings Plans." : ""}`,
      });
    }
    if (prevData && svcs.length > 1) {
      const growers = svcs
        .map((s) => {
          const p2 = prevData.topServices?.find((p) => p.name === s.name);
          return {
            name: s.name,
            val: s.value,
            change: p2?.cost > 0 ? ((s.value - p2.cost) / p2.cost) * 100 : null,
          };
        })
        .filter((s) => s.change !== null && s.change > 10)
        .sort((a, b) => b.change - a.change);
      if (growers.length > 0) {
        const g = growers[0];
        insights.push({
          type: "warning",
          title: `${g.name} grew ${g.change.toFixed(1)}% MoM`,
          detail: `Now ${formatCurrency(g.val)}. Fastest-growing service — investigate recent usage or instance launches.`,
        });
      }
    }
    if (prevData && svcs.length > 1) {
      const reducers = (prevData.topServices ?? [])
        .map((p) => {
          const curr = svcs.find((s) => s.name === p.name);
          const saved = p.cost - (curr?.value ?? 0);
          return {
            name: p.name,
            saved,
            pct: p.cost > 0 ? (saved / p.cost) * 100 : 0,
          };
        })
        .filter((r) => r.saved > 0)
        .sort((a, b) => b.saved - a.saved);
      if (reducers.length > 0) {
        const r = reducers[0];
        insights.push({
          type: "success",
          title: `${r.name} cost reduced by ${r.pct.toFixed(1)}%`,
          detail: `Saved ${formatCurrency(r.saved)} vs last month. ${r.pct > 20 ? "Significant - likely right-sizing or Reserved Instance coverage." : "Good optimization signal."}`,
        });
      }
    }
    const activeForecast = displayData?.forecast;
    if (activeForecast && activeForecast > total * 1.5) {
      insights.push({
        type: "warning",
        title: `Forecast ${formatCurrency(activeForecast)} is ${((activeForecast / (total || 1) - 1) * 100).toFixed(0)}% above Month-to-Date`,
        detail: `AWS projects significant spend for the rest of this month. End-of-month cost: ${formatCurrency(activeForecast)}.`,
      });
    }
    if (mspCspSavingsComputed > 0) {
      insights.push({
        type: "success",
        title: `Maitsys CSP saves you ${formatCurrency(mspCspSavingsComputed)} this month`,
        detail: `3.5% discount on ${formatCurrency(total)} AWS spend. Annualised: ~${formatCurrency(mspCspSavingsComputed * 12)}.`,
      });
    }
    return insights.slice(0, 6);
  }, [displayData, yearlyData, nowYear, nowMonth, mspCspSavingsComputed]);

  /* ── Executive tab derived data (useMemo — no IIFE in render) ── */
  const execTotal = displayData?.totalCost ?? 0;
  const execForecast = displayData?.forecast ?? 0;
  const execPrevData = useMemo(() => {
    const p = getPrevMonth(nowYear, nowMonth);
    return yearlyData.find((m) => m.year === p.year && m.month === p.month);
  }, [yearlyData, nowYear, nowMonth]);
  const execPrevTotal = execPrevData?.totalCost ?? 0;
  const execMomPct =
    execPrevTotal > 0
      ? ((execTotal - execPrevTotal) / execPrevTotal) * 100
      : null;
  const execOptSavings = useMemo(
    () =>
      savingsRecs.reduce(
        (s, r) => s + Number(r.estimatedMonthlySavings ?? r.savings ?? 0),
        0,
      ),
    [savingsRecs],
  );
  const execTotalSavings = mspCspSavingsComputed + execOptSavings;
  const execSavingsPct =
    execTotal > 0
      ? (execTotalSavings / (execTotal + execTotalSavings)) * 100
      : 0;
  const execServices = displayData?.services ?? [];
  const execTopSvc = execServices[0];
  const execAttentionItems = useMemo(() => {
    const items = [];
    if (execMomPct !== null && execMomPct > 15)
      items.push({
        dot: "red",
        label: "Cost spike: +" + execMomPct.toFixed(1) + "% vs last month",
        color: "text-red-600",
      });
    if (execForecast > execTotal * 1.4)
      items.push({
        dot: "red",
        label:
          "Forecast " +
          formatCurrency(execForecast) +
          " - high end-of-month risk",
        color: "text-red-600",
      });
    if (execOptSavings > 0)
      items.push({
        dot: "green",
        label:
          formatCurrency(execOptSavings) + "/mo optimization savings available",
        color: "text-emerald-600",
      });
    if (mspCspSavingsComputed > 0)
      items.push({
        dot: "green",
        label:
          "Maitsys CSP saves " +
          formatCurrency(mspCspSavingsComputed) +
          "/mo (3.5% off)",
        color: "text-emerald-600",
      });
    if (execTopSvc && execTotal > 0 && execTopSvc.value / execTotal > 0.5)
      items.push({
        dot: "yellow",
        label:
          execTopSvc.name +
          " is " +
          ((execTopSvc.value / execTotal) * 100).toFixed(0) +
          "% of spend - concentration risk",
        color: "text-amber-600",
      });
    if (items.length === 0)
      items.push({
        dot: "green",
        label: "All metrics within normal range",
        color: "text-emerald-600",
      });
    return items;
  }, [
    execMomPct,
    execForecast,
    execTotal,
    execOptSavings,
    mspCspSavingsComputed,
    execTopSvc,
  ]);

  /* loading / not-found states */
  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-[3px] border-gray-200 dark:border-gray-800" />
            <div className="absolute inset-0 rounded-full border-t-[3px] border-orange-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-orange-500">AWS</span>
            </div>
          </div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
            Loading account data!
          </p>
        </div>
      </div>
    );

  if (seeding)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-[3px] border-gray-200 dark:border-gray-800" />
            <div className="absolute inset-0 rounded-full border-t-[3px] border-orange-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-orange-500">AWS</span>
            </div>
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
            Syncing account data!
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This is a new account. We're pulling data from AWS across all
            regions — this takes about 20—30 seconds and only happens once.
          </p>
          <p className="text-[11px] text-orange-500 font-semibold mt-3 animate-pulse">
            Checking every 5 seconds!
          </p>
        </div>
      </div>
    );

  if (!account)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          {accountsLoading ? (
            <RefreshCw className="w-6 h-6 text-orange-500 animate-spin mx-auto" />
          ) : (
            <>
              <p className="text-lg font-bold text-red-500">Account not found.</p>
              <Link to="/aws" className="btn-secondary mt-4 mx-auto inline-flex">
                <ArrowLeft className="w-4 h-4" /> Back to AWS
              </Link>
            </>
          )}
        </div>
      </div>
    );

  const maxSvcCost = displayData?.services?.[0]?.value || 1;
  const mspCspSavings = mspCspSavingsComputed;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 bg-mesh-light dark:bg-mesh-dark transition-colors duration-300 pb-20">
      {/* â"€â"€ Sticky header â"€â"€ */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 xl:px-8 2xl:px-10 py-3 flex flex-wrap justify-between items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link
              to="/aws"
              className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-orange-600 hover:border-orange-200 dark:hover:border-orange-800 transition-all active:scale-95 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold  tracking-wider rounded-lg shrink-0">
                  AWS
                </span>
                <h1
                  className="text-base font-bold text-gray-900 dark:text-white truncate"
                  title={account.name}
                >
                  {account.name}
                </h1>
              </div>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">
                Detailed insights & resource analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Account Switcher */}
            {accounts.length > 1 && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAccountMenuOpen((v) => !v);
                  }}
                  className="btn-secondary text-xs py-2"
                >
                  Switch Account <ChevronDown className="w-3 h-3" />
                </button>
                {accountMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => {
                          setAccountMenuOpen(false);
                          navigate(`/aws/${acc.id}`);
                        }}
                        className={`w-full text-left px-4 py-3 text-xs font-semibold transition-colors ${
                          acc.id === accountId
                            ? "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        {acc.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* â"€â"€ Month dropdown â"€â"€ */}
            <div className="relative" ref={monthDropRef}>
              <button
                onClick={() => {
                  setMonthDropOpen((v) => !v);
                  setAiOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-orange-300 hover:text-orange-600 transition-all shadow-sm"
              >
                <Calendar className="w-3.5 h-3.5" />
                {isCurrentMonth
                  ? `${MONTH_LABELS[nowMonth - 1]} Month-to-Date`
                  : `${MONTH_LABELS[(selectedMonth?.month ?? nowMonth) - 1]} '${String(selectedMonth?.year ?? nowYear).slice(2)}`}
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${monthDropOpen ? "rotate-180" : ""}`}
                />
              </button>
              {monthDropOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden py-1 max-h-72 overflow-y-auto">
                  {last12.map((m) => {
                    const hasData = yearlyData.some(
                      (h) => h.year === m.year && h.month === m.month,
                    );
                    const isCur = m.year === nowYear && m.month === nowMonth;
                    const isSel = selectedMonth
                      ? selectedMonth.year === m.year &&
                        selectedMonth.month === m.month
                      : isCur;
                    return (
                      <button
                        key={`${m.year}-${m.month}`}
                        disabled={!hasData && !isCur}
                        onClick={() => {
                          setSelectedMonth(isCur ? null : m);
                          setMonthDropOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors ${
                          isSel
                            ? "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400"
                            : hasData || isCur
                              ? "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                              : "text-gray-300 dark:text-gray-700 cursor-default"
                        }`}
                      >
                        <span>
                          {MONTH_LABELS[m.month - 1]}
                          {m.year !== nowYear && (
                            <span className="ml-1 opacity-60">
                              '{String(m.year).slice(2)}
                            </span>
                          )}
                        </span>
                        {isCur && (
                          <span className="text-[9px] font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-md">
                            Month-to-Date
                          </span>
                        )}
                        {isSel && !isCur && (
                          <CheckCircle2 className="w-3 h-3 text-orange-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* â"€â"€ AI Insights dropdown â"€â"€ */}
            <div className="relative" ref={aiRef}>
              <button
                onClick={() => {
                  setAiOpen((v) => !v);
                  setMonthDropOpen(false);
                }}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                  aiOpen
                    ? "bg-violet-500 border-violet-500 text-white shadow-violet-200 dark:shadow-violet-900"
                    : "border-violet-300 dark:border-violet-600 bg-white dark:bg-gray-900 text-violet-600 dark:text-violet-400 shadow-[0_0_0_3px_rgba(139,92,246,0.15)] animate-pulse hover:animate-none hover:shadow-[0_0_0_4px_rgba(139,92,246,0.3)]"
                }`}
              >
                <Sparkles
                  className={`w-3.5 h-3.5 ${!aiOpen ? "text-violet-500" : ""}`}
                />
                AI Insights
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${aiOpen ? "rotate-180" : ""}`}
                />
              </button>
              {aiOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-[min(420px,calc(100vw-1rem))] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {/* header */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-violet-50 dark:bg-violet-950/30">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-500" />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        AI Cost Insights
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400">
                        AWS
                      </span>
                    </div>
                    <button
                      onClick={() => setAiOpen(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {/* insights list */}
                  <div className="p-3 space-y-2 max-h-[440px] overflow-y-auto">
                    {aiInsights.length === 0 ? (
                      <div className="text-center py-8">
                        <Sparkles className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                        <p className="text-sm text-gray-400 font-medium">
                          Not enough data for insights yet.
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Fetch 12-month history to unlock AI analysis.
                        </p>
                      </div>
                    ) : (
                      aiInsights.map((ins, i) => {
                        const cfg =
                          {
                            warning: {
                              bg: "border-gray-100 dark:border-gray-800",
                              icon: (
                                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              ),
                              title: "text-amber-800 dark:text-amber-300",
                            },
                            success: {
                              bg: "border-gray-100 dark:border-gray-800",
                              icon: (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              ),
                              title: "text-emerald-800 dark:text-emerald-300",
                            },
                            info: {
                              bg: "border-gray-100 dark:border-gray-800",
                              icon: (
                                <Lightbulb className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                              ),
                              title: "text-blue-800 dark:text-blue-300",
                            },
                          }[ins.type] ?? {};
                        return (
                          <div
                            key={i}
                            className={`rounded-xl border p-3.5 ${cfg.bg}`}
                          >
                            <div className="flex items-start gap-2.5">
                              {cfg.icon}
                              <div>
                                <p
                                  className={`text-xs font-bold leading-snug mb-1 ${cfg.title}`}
                                >
                                  {ins.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                  {ins.detail}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-[10px] text-gray-400 font-medium">
                      Based on current Month-to-Date data and 12-month history •
                      Auto-generated
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => fetchAllData()} className="btn-secondary">
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
        {/* ── Tab bar row ── */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 sm:px-6 lg:px-8">
          <div className="w-full px-4 sm:px-6 xl:px-8 2xl:px-10 flex gap-0">
            {[
              {
                id: "executive",
                label: "Executive",
                icon: Target,
                desc: "CEO / Leadership",
              },
              {
                id: "operations",
                label: "Operations",
                icon: Layers,
                desc: "Manager / Dept. Head",
              },
              {
                id: "technical",
                label: "Technical",
                icon: Activity,
                desc: "Engineer / In-depth",
              },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all duration-150 ${active ? "border-orange-500 text-orange-600 dark:text-orange-400" : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300"}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                  <span className="hidden md:inline text-[10px] font-normal opacity-60">
                    {t.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="w-full px-4 sm:px-6 xl:px-8 2xl:px-10 py-8 space-y-8">
        {/* â"€â"€ Error banner â"€â"€ */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-xl text-red-600 dark:text-red-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-300">
                Sync Error
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* â"€â"€ Past-month banner â"€â"€ */}
        {displayData?.isPast && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl px-5 py-3 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Viewing{" "}
              <span className="font-bold">
                {MONTH_LABELS[selectedMonth.month - 1]} {selectedMonth.year}
              </span>{" "}
              — historical data
            </p>
            <button
              onClick={() => setSelectedMonth(null)}
              className="ml-auto text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors"
            >
              Back to current
            </button>
          </div>
        )}

        {/* â"€â"€ KPI row â"€â"€ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 animate-in">
          <KpiCard
            title={displayData?.isPast ? "Month Spend" : "Month-to-Date Spend"}
            value={formatCurrency(displayData?.totalCost ?? 0)}
            icon={<DollarSign className="w-4 h-4" />}
            sub={(() => {
              const todayLine = displayData?.isPast
                ? null
                : `Today: ${todayCost != null ? formatCurrency(todayCost) : "Syncing…"}`;
              const p = getPrevMonth(nowYear, nowMonth);
              const prev = yearlyData.find(
                (m) => m.year === p.year && m.month === p.month,
              );
              const prevTotal = prev?.totalCost ?? 0;
              const total = displayData?.totalCost ?? 0;
              const vsLastMonth =
                prevTotal > 0
                  ? (() => {
                      const pct = ((total - prevTotal) / prevTotal) * 100;
                      return `${pct > 0 ? "▲" : "▼"} ${Math.abs(pct).toFixed(1)}% vs last month`;
                    })()
                  : "Total unblended cost";
              return todayLine ? `${todayLine} · ${vsLastMonth}` : vsLastMonth;
            })()}
            subColor={(() => {
              const p = getPrevMonth(nowYear, nowMonth);
              const prev = yearlyData.find(
                (m) => m.year === p.year && m.month === p.month,
              );
              const prevTotal = prev?.totalCost ?? 0;
              const total = displayData?.totalCost ?? 0;
              if (prevTotal > 0) {
                const pct = ((total - prevTotal) / prevTotal) * 100;
                return pct > 0 ? "text-red-500" : "text-emerald-500";
              }
              return undefined;
            })()}
            accent="aws"
            onClick={() => {
              const id =
                activeTab === "operations"
                  ? "ops-monthly-spend"
                  : activeTab === "executive"
                    ? "exec-annual-trend"
                    : "aws-daily-trend";
              document
                .getElementById(id)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
          <KpiCard
            title="EOM Forecast"
            value={
              displayData?.forecast ? formatCurrency(displayData.forecast) : "—"
            }
            icon={<TrendingUp className="w-4 h-4" />}
            sub={
              displayData?.isPast
                ? "Not available for past months"
                : "End-of-month projection"
            }
            accent="gray"
            onClick={() => {
              const id =
                activeTab === "operations"
                  ? "ops-monthly-spend"
                  : activeTab === "executive"
                    ? "exec-annual-trend"
                    : "aws-annual-trend";
              document
                .getElementById(id)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
          <KpiCard
            title="Top Service"
            value={displayData?.topService?.name ?? "N/A"}
            icon={<PieIcon className="w-4 h-4" />}
            sub={
              displayData?.topService
                ? formatCurrency(displayData.topService.value)
                : "No usage data"
            }
            accent="blue"
            onClick={() => {
              const id =
                activeTab === "operations"
                  ? "ops-top-services"
                  : activeTab === "executive"
                    ? "exec-top-services"
                    : "aws-top-services";
              document
                .getElementById(id)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
          <KpiCard
            title="Top Region"
            value={displayData?.topRegion?.region ?? "N/A"}
            icon={<MapPin className="w-4 h-4" />}
            sub={
              displayData?.topRegion
                ? formatCurrency(displayData.topRegion.cost)
                : "No usage data"
            }
            accent="green"
            onClick={() => {
              const id =
                activeTab === "operations" ? "ops-region" : "aws-region";
              document
                .getElementById(id)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
          <KpiCard
            title="Maitsys CSP Savings"
            value={mspCspSavings > 0 ? formatCurrency(mspCspSavings) : "—"}
            icon={<TrendingDown className="w-4 h-4" />}
            sub={
              mspCspSavings > 0
                ? `${((mspRates.aws ?? 0.035) * 100).toFixed(1)}% MSP pricing advantage on AWS spend`
                : "No spend data"
            }
            accent="green"
            onClick={() => {
              const id =
                activeTab === "executive"
                  ? "exec-csp-savings"
                  : "aws-csp-savings";
              document
                .getElementById(id)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        </div>

        {/* ── Backfill progress banner ── */}
        {(backfillLoading || backfillProgress?.stage === "error") && (
          <div className={`border rounded-2xl px-5 py-4 ${
            backfillProgress?.stage === "error"
              ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
              : "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800"
          }`}>
            <div className="flex items-center gap-3 mb-2">
              {backfillProgress?.stage === "error" ? (
                <span className="text-red-500 text-base">✕</span>
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-orange-300 border-t-orange-600 animate-spin shrink-0" />
              )}
              <p className={`text-sm font-bold ${
                backfillProgress?.stage === "error"
                  ? "text-red-700 dark:text-red-300"
                  : "text-orange-800 dark:text-orange-300"
              }`}>
                {backfillProgress?.stage === "fetching" && "Fetching cost data from AWS…"}
                {backfillProgress?.stage === "saving" && `Saving ${backfillProgress.month}… (${backfillProgress.saved}/${backfillProgress.total})`}
                {backfillProgress?.stage === "done" && `Done — ${backfillProgress.saved} months saved`}
                {backfillProgress?.stage === "error" && `Error: ${backfillProgress.message}`}
                {!backfillProgress && "Connecting…"}
              </p>
            </div>
            {backfillProgress?.stage === "saving" && backfillProgress.total > 0 && (
              <div className="w-full bg-orange-100 dark:bg-orange-900/40 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 bg-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((backfillProgress.saved / backfillProgress.total) * 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* â"€â"€ Executive Tab â"€â"€ */}
        {/* ── Technical Tab ── */}
        {activeTab === "technical" && (
          <div className="space-y-8">
            {/* Day-over-day cost attribution — "yesterday $X, today $Y, what changed?" */}
            {account && (
              <DailyCostHistoryTabs
                provider="aws"
                accountId={account.id}
                currency="USD"
              />
            )}

            {/* Monthly Spend by Service */}
            <Card
              id="aws-daily-trend"
              title="Monthly Spend by Service"
              icon={<Layers className="w-4 h-4" />}
            >
              {yearlyData.length === 0 ? (
                <div className="p-6 flex flex-col items-center justify-center gap-4 min-h-[220px] text-center">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      No history available
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Fetch 12-month data to unlock this chart
                    </p>
                  </div>
                  {!backfillLoading ? (
                    <button
                      onClick={triggerBackfill}
                      className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-md shadow-rose-500/20"
                    >
                      Fetch 12-Month History
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 font-semibold">
                      <div className="w-4 h-4 rounded-full border-2 border-orange-300 border-t-orange-600 animate-spin" />
                      Fetching…
                    </div>
                  )}
                </div>
              ) : stackedKeys.length === 0 ? (
                <div className="p-6 flex items-center justify-center min-h-[220px] text-sm text-gray-400 font-semibold">
                  No service breakdown available
                </div>
              ) : (
                <div className="p-6">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stackedData}
                        margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="rgba(148,163,184,0.15)"
                        />
                        <XAxis
                          dataKey="label"
                          stroke="#94a3b8"
                          fontSize={10}
                          fontWeight="600"
                          axisLine={false}
                          tickLine={false}
                          dy={8}
                        />
                        <YAxis
                          width={44}
                          stroke="#94a3b8"
                          fontSize={10}
                          fontWeight="600"
                          tickFormatter={(v) =>
                            `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                          }
                          axisLine={false}
                          tickLine={false}
                          dx={-4}
                        />
                        <Tooltip
                          formatter={(v, n) => [formatCurrency(v), n]}
                          contentStyle={{
                            backgroundColor: "var(--tooltip-bg,#fff)",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        />
                        {stackedKeys.map((name, i) => (
                          <Bar
                            key={name}
                            dataKey={name}
                            stackId="s"
                            fill={AWS_COLORS[i % AWS_COLORS.length]}
                            radius={
                              i === stackedKeys.length - 1
                                ? [4, 4, 0, 0]
                                : [0, 0, 0, 0]
                            }
                            animationDuration={600}
                          />
                        ))}
                        {stackedData.some((d) => d.Other > 0) && (
                          <Bar
                            dataKey="Other"
                            stackId="s"
                            fill="#D1D5DB"
                            radius={[4, 4, 0, 0]}
                            animationDuration={600}
                          />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5">
                    {stackedKeys.map((name, i) => (
                      <div
                        key={name}
                        className="flex items-center gap-1.5 min-w-0"
                        title={name}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{
                            backgroundColor: AWS_COLORS[i % AWS_COLORS.length],
                          }}
                        />
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 truncate">
                          {name.slice(0, 18)}
                        </span>
                      </div>
                    ))}
                    {stackedData.some((d) => d.Other > 0) && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-gray-300 dark:bg-gray-600" />
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                          Other
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Annual Cost Trend */}
            <Card
              title={`Annual Cost Trend — ${nowYear}`}
              icon={<TrendingUp className="w-4 h-4" />}
              id="aws-annual-trend"
            >
              {yearlyData.length === 0 ? (
                <div className="p-6 flex flex-col items-center justify-center gap-3 min-h-[220px] text-center">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                  </div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    No annual data yet
                  </p>
                  <p className="text-xs text-gray-400">
                    Click &quot;Fetch 12-Month History&quot; to load
                  </p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                    {[
                      {
                        label: "Yearly Total",
                        val: formatCurrency(yearlyTotal),
                      },
                      { label: "Avg / Month", val: formatCurrency(yearlyAvg) },
                      {
                        label: `Peak — ${yearlyPeak.label}`,
                        val: formatCurrency(yearlyPeak.cost),
                      },
                    ].map(({ label, val }) => (
                      <div
                        key={label}
                        className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800"
                      >
                        <p className="section-title mb-1">{label}</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">
                          {val}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={yearlyChartData}
                        margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                        onClick={(e) => {
                          if (e?.activePayload?.[0]) {
                            const m = e.activePayload[0].payload;
                            if (!(m.year === nowYear && m.month === nowMonth))
                              setSelectedMonth({
                                year: m.year,
                                month: m.month,
                              });
                            else setSelectedMonth(null);
                          }
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="rgba(148,163,184,0.12)"
                        />
                        <XAxis
                          dataKey="label"
                          stroke="#94a3b8"
                          fontSize={10}
                          fontWeight="600"
                          axisLine={false}
                          tickLine={false}
                          dy={8}
                        />
                        <YAxis
                          width={44}
                          stroke="#94a3b8"
                          fontSize={10}
                          fontWeight="600"
                          tickFormatter={(v) =>
                            `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                          }
                          axisLine={false}
                          tickLine={false}
                          dx={-4}
                        />
                        <Tooltip
                          formatter={(v) => [formatCurrency(v), "Cost"]}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                          cursor={{ fill: "rgba(148,163,184,0.08)" }}
                        />
                        <Bar
                          dataKey="cost"
                          radius={[4, 4, 0, 0]}
                          animationDuration={600}
                          cursor="pointer"
                        >
                          {yearlyChartData.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={entry.isSel ? "#FF9900" : "#FFB347"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </Card>

            {/* Daily Cost Trend + Cost by Service pie */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card
                title="Daily Cost Trend"
                icon={<Calendar className="w-4 h-4" />}
              >
                <div className="p-6">
                  {!displayData?.costs?.length ? (
                    <div className="h-64 flex items-center justify-center text-sm text-gray-400 font-semibold">
                      No cost data available
                    </div>
                  ) : (
                    <>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart
                            data={displayData.costs}
                            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="rgba(148,163,184,0.15)"
                            />
                            <XAxis
                              dataKey="date"
                              tickFormatter={formatDateShort}
                              stroke="#94a3b8"
                              fontSize={10}
                              fontWeight="600"
                              axisLine={false}
                              tickLine={false}
                              dy={8}
                            />
                            <YAxis
                              stroke="#94a3b8"
                              fontSize={10}
                              fontWeight="600"
                              tickFormatter={(v) => `$${v}`}
                              axisLine={false}
                              tickLine={false}
                              dx={-4}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                              dataKey="Cost"
                              fill="#FF9900"
                              radius={[3, 3, 0, 0]}
                              maxBarSize={24}
                              animationDuration={600}
                            />
                            <Line
                              type="monotone"
                              dataKey="Cost"
                              stroke="#E07B00"
                              strokeWidth={2}
                              dot={false}
                              activeDot={{ r: 4 }}
                              name="Trend"
                            />
                            {dailyAvg > 0 && (
                              <ReferenceLine
                                y={dailyAvg}
                                stroke="#94a3b8"
                                strokeDasharray="4 3"
                                strokeWidth={1.5}
                                label={{
                                  value: `Avg ${formatCurrency(dailyAvg)}`,
                                  position: "insideTopRight",
                                  fontSize: 10,
                                  fill: "#94a3b8",
                                  fontWeight: 600,
                                }}
                              />
                            )}
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex items-center gap-4 mt-3 pl-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-sm bg-[#FF9900]" />
                          <span className="text-[11px] text-gray-500 font-semibold">
                            Daily Cost
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-0.5 bg-[#E07B00]" />
                          <span className="text-[11px] text-gray-500 font-semibold">
                            Trend
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-0 border-t border-dashed border-gray-400" />
                          <span className="text-[11px] text-gray-500 font-semibold">
                            Daily Avg
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>
              <Card
                title="Cost by Service"
                icon={<PieIcon className="w-4 h-4" />}
              >
                {!displayData?.services?.length ? (
                  <div className="h-64 flex items-center justify-center text-sm text-gray-400 font-semibold">
                    No service data available
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-5">
                    <div className="h-56 w-48 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={displayData.services}
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                            stroke="none"
                          >
                            {displayData.services.map((_, i) => (
                              <Cell
                                key={i}
                                fill={AWS_COLORS[i % AWS_COLORS.length]}
                                cornerRadius={3}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(v, n) => [formatCurrency(v), n]}
                            contentStyle={{
                              backgroundColor: "var(--tooltip-bg,#fff)",
                              borderRadius: "12px",
                              border: "1px solid #e2e8f0",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 min-w-0 overflow-y-auto max-h-56 space-y-2 pr-1 py-1">
                      {displayData.services.map((svc, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                AWS_COLORS[i % AWS_COLORS.length],
                            }}
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate font-semibold">
                            {svc.name}
                          </span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums shrink-0">
                            {formatCurrency(svc.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Top Services ranked bars */}
            {displayData?.services?.length > 0 && (
              <Card
                title="Top Services by Spend"
                icon={<Zap className="w-4 h-4" />}
                id="aws-top-services"
              >
                <div className="p-6 space-y-3">
                  {displayData.services.slice(0, 6).map((svc, i) => {
                    const p = Math.round((svc.value / maxSvcCost) * 100);
                    const totalSvcCost = displayData.services.reduce(
                      (s, x) => s + (x.value || 0),
                      0,
                    );
                    const savings =
                      totalSvcCost > 0
                        ? (svc.value / totalSvcCost) * mspCspSavings
                        : 0;
                    return (
                      <div key={i} className="flex items-center gap-3 group">
                        <span className="text-xs font-bold text-gray-400 w-4 shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                              {svc.name}
                            </span>
                            <div className="flex items-center gap-2 ml-2 shrink-0">
                              <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">
                                {formatCurrency(svc.value)}
                              </span>
                              {savings > 0 && (
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                  -{formatCurrency(savings)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${p}%`,
                                backgroundColor:
                                  AWS_COLORS[i % AWS_COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {mspCspSavings > 0 && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                      Green amounts = {formatCurrency(mspCspSavings)} total CSP
                      savings split proportionally by service spend
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400  tracking-wide">
                      Total
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                      {formatCurrency(
                        displayData.services
                          .slice(0, 6)
                          .reduce((s, x) => s + (x.value || 0), 0),
                      )}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Cost by Region */}
            {displayData?.regions?.length > 0 && (
              <Card
                title="Cost by Region"
                id="aws-region"
                icon={<MapPin className="w-4 h-4" />}
              >
                <div className="p-4 flex items-center gap-4">
                  <div className="w-44 h-44 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={displayData.regions}
                          cx="50%"
                          cy="50%"
                          innerRadius={46}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="cost"
                          nameKey="region"
                          stroke="none"
                        >
                          {displayData.regions.map((_, i) => (
                            <Cell
                              key={i}
                              fill={REGION_COLORS[i % REGION_COLORS.length]}
                              cornerRadius={3}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v, n) => [formatCurrency(v), n]}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 min-w-0 space-y-2 max-h-44 overflow-y-auto pr-1">
                    {displayData.regions.map((r, i) => {
                      const total = displayData.regions.reduce(
                        (s, x) => s + (x.cost || 0),
                        0,
                      );
                      const pct =
                        total > 0 ? Math.round((r.cost / total) * 100) : 0;
                      return (
                        <div key={i} className="flex items-center gap-2 group">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                REGION_COLORS[i % REGION_COLORS.length],
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 truncate">
                                {r.region}
                              </span>
                              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                <span className="text-[10px] font-bold text-gray-400">
                                  {pct}%
                                </span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">
                                  {formatCurrency(r.cost)}
                                </span>
                              </div>
                            </div>
                            <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor:
                                    REGION_COLORS[i % REGION_COLORS.length],
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}

            {/* Maitsys CSP Savings — full list */}
            {savingsRecs.length > 0 && (
              <Card
                id="aws-csp-savings"
                title="Maitsys CSP Savings Opportunities"
                icon={<TrendingDown className="w-4 h-4" />}
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl shrink-0">
                      <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                        Maitsys CSP saves you {formatCurrency(mspCspSavings)} /
                        month
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        {((mspRates.aws ?? 0.035) * 100).toFixed(1)}% MSP pricing advantage on{" "}
                        {formatCurrency(displayData?.totalCost ?? 0)} AWS spend
                      </p>
                    </div>
                    <span className="shrink-0 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl">
                      3.5% off
                    </span>
                  </div>
                  <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                    {savingsRecs.slice(0, 20).map((r, i) => {
                      const savings = Number(r.estimated_savings ?? 0);
                      const currentCost = Number(r.current_monthly_cost ?? 0);
                      const afterCost = Math.max(0, currentCost - savings);
                      return (
                        <div
                          key={i}
                          className="flex items-start gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/40 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                                {fmtResourceType(r.resource_type)}
                              </span>
                              {r.action && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                                  {AWS_ACTION_LABELS[r.action] || r.action}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-relaxed line-clamp-2">
                              {r.description || r.action || "Optimise resource"}
                            </p>
                            {currentCost > 0 && (
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-[11px] text-gray-500">
                                  Current:{" "}
                                  <span className="font-bold text-gray-700 dark:text-gray-300">
                                    {formatCurrency(currentCost)}/mo
                                  </span>
                                </span>
                                <span className="text-[10px] text-gray-300 dark:text-gray-600">
                                  →
                                </span>
                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                                  After:{" "}
                                  <span className="font-bold">
                                    {formatCurrency(afterCost)}/mo
                                  </span>
                                </span>
                              </div>
                            )}
                            {(r.resource_name || r.resource_id) && (
                              <p className="text-[10px] text-gray-400 font-mono mt-1 truncate">
                                {shortId(r.resource_name || r.resource_id)}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 text-right ml-2">
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              -{formatCurrency(savings)}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              per month
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}

            {/* Top Movers */}
            {displayData?.services?.length > 0 && (
              <TopMovers
                services={displayData.services}
                yearlyData={yearlyData}
                nowYear={nowYear}
                nowMonth={nowMonth}
                totalCost={displayData.totalCost ?? 0}
              />
            )}

            {/* Detailed Cost Breakdown table */}
            {displayData?.details?.length > 0 && (
              <div
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col"
                style={{
                  maxHeight: "420px",
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                }}
              >
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 shrink-0">
                  <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded-xl text-orange-600 dark:text-orange-400">
                    <List className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Detailed Cost Breakdown
                  </h3>
                </div>
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white dark:bg-gray-900">
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="section-title px-6 py-3 text-left">
                          Service
                        </th>
                        <th className="section-title px-6 py-3 text-right">
                          Cost
                        </th>
                        <th className="section-title px-6 py-3 text-right text-emerald-600 dark:text-emerald-400">
                          CSP Savings (3.5%)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                      {displayData.details.map((row, i) => {
                        const cost = Number(row.Cost ?? row.cost ?? 0);
                        const savings = cost * (mspRates.aws ?? 0.035);
                        return (
                          <tr
                            key={i}
                            className="hover:bg-orange-50/30 dark:hover:bg-orange-950/10 transition-colors"
                          >
                            <td
                              className="px-6 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-xs"
                              title={
                                row.ServiceName ?? row.service ?? "Unknown"
                              }
                            >
                              {row.ServiceName ?? row.service ?? "Unknown"}
                            </td>
                            <td className="px-6 py-3 text-right text-xs font-bold text-gray-900 dark:text-white tabular-nums">
                              {formatCurrency(cost)}
                            </td>
                            <td className="px-6 py-3 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              {savings > 0
                                ? `-${formatCurrency(savings)}`
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Instances + Budgets — current month only */}
            {!displayData?.isPast && (
              <div className="flex flex-col gap-6">
                <InstancesCard instances={instances} loading={loading} />
                <BudgetsCard budgets={budgets} loading={loading} />
              </div>
            )}
          </div>
        )}

        {/* ── Operations Tab ── */}
        {activeTab === "operations" && (
          <div className="space-y-8">
            {/* Monthly Spend by Service */}
            <Card
              title="Monthly Spend by Service"
              icon={<Layers className="w-4 h-4" />}
              id="ops-monthly-spend"
            >
              {yearlyData.length === 0 ? (
                <div className="p-6 flex flex-col items-center justify-center gap-4 min-h-[220px] text-center">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      No history available
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Fetch 12-month data to unlock this chart
                    </p>
                  </div>
                  {!backfillLoading ? (
                    <button
                      onClick={triggerBackfill}
                      className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-md shadow-rose-500/20"
                    >
                      Fetch 12-Month History
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 font-semibold">
                      <div className="w-4 h-4 rounded-full border-2 border-orange-300 border-t-orange-600 animate-spin" />
                      Fetching…
                    </div>
                  )}
                </div>
              ) : stackedKeys.length === 0 ? (
                <div className="p-6 flex items-center justify-center min-h-[220px] text-sm text-gray-400 font-semibold">
                  No service breakdown available
                </div>
              ) : (
                <div className="p-6">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stackedData}
                        margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="rgba(148,163,184,0.15)"
                        />
                        <XAxis
                          dataKey="label"
                          stroke="#94a3b8"
                          fontSize={10}
                          fontWeight="600"
                          axisLine={false}
                          tickLine={false}
                          dy={8}
                        />
                        <YAxis
                          width={44}
                          stroke="#94a3b8"
                          fontSize={10}
                          fontWeight="600"
                          tickFormatter={(v) =>
                            `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                          }
                          axisLine={false}
                          tickLine={false}
                          dx={-4}
                        />
                        <Tooltip
                          formatter={(v, n) => [formatCurrency(v), n]}
                          contentStyle={{
                            backgroundColor: "var(--tooltip-bg,#fff)",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        />
                        {stackedKeys.map((name, i) => (
                          <Bar
                            key={name}
                            dataKey={name}
                            stackId="s"
                            fill={AWS_COLORS[i % AWS_COLORS.length]}
                            radius={
                              i === stackedKeys.length - 1
                                ? [4, 4, 0, 0]
                                : [0, 0, 0, 0]
                            }
                            animationDuration={600}
                          />
                        ))}
                        {stackedData.some((d) => d.Other > 0) && (
                          <Bar
                            dataKey="Other"
                            stackId="s"
                            fill="#D1D5DB"
                            radius={[4, 4, 0, 0]}
                            animationDuration={600}
                          />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5">
                    {stackedKeys.map((name, i) => (
                      <div
                        key={name}
                        className="flex items-center gap-1.5 min-w-0"
                        title={name}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{
                            backgroundColor: AWS_COLORS[i % AWS_COLORS.length],
                          }}
                        />
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 truncate">
                          {name.slice(0, 18)}
                        </span>
                      </div>
                    ))}
                    {stackedData.some((d) => d.Other > 0) && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-gray-300 dark:bg-gray-600" />
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                          Other
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Daily Cost History — reused from Technical tab */}
            {account && (
              <DailyCostHistoryTabs
                provider="aws"
                accountId={account.id}
                currency="USD"
              />
            )}

            {/* Top Services ranked bars */}
            {displayData?.services?.length > 0 && (
              <Card
                title="Top Services by Spend"
                icon={<Zap className="w-4 h-4" />}
                id="ops-top-services"
              >
                <div className="p-6 space-y-3">
                  {displayData.services.slice(0, 6).map((svc, i) => {
                    const p = Math.round((svc.value / maxSvcCost) * 100);
                    const totalSvcCost = displayData.services.reduce(
                      (s, x) => s + (x.value || 0),
                      0,
                    );
                    const savings =
                      totalSvcCost > 0
                        ? (svc.value / totalSvcCost) * mspCspSavings
                        : 0;
                    return (
                      <div key={i} className="flex items-center gap-3 group">
                        <span className="text-xs font-bold text-gray-400 w-4 shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                              {svc.name}
                            </span>
                            <div className="flex items-center gap-2 ml-2 shrink-0">
                              <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">
                                {formatCurrency(svc.value)}
                              </span>
                              {savings > 0 && (
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                  -{formatCurrency(savings)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${p}%`,
                                backgroundColor:
                                  AWS_COLORS[i % AWS_COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {mspCspSavings > 0 && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                      Green amounts = {formatCurrency(mspCspSavings)} total CSP
                      savings split proportionally by service spend
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400  tracking-wide">
                      Total
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                      {formatCurrency(
                        displayData.services
                          .slice(0, 6)
                          .reduce((s, x) => s + (x.value || 0), 0),
                      )}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Cost by Region */}
            {displayData?.regions?.length > 0 && (
              <Card
                title="Cost by Region"
                id="ops-region"
                icon={<MapPin className="w-4 h-4" />}
              >
                <div className="p-4 flex items-center gap-4">
                  <div className="w-44 h-44 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={displayData.regions}
                          cx="50%"
                          cy="50%"
                          innerRadius={46}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="cost"
                          nameKey="region"
                          stroke="none"
                        >
                          {displayData.regions.map((_, i) => (
                            <Cell
                              key={i}
                              fill={REGION_COLORS[i % REGION_COLORS.length]}
                              cornerRadius={3}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v, n) => [formatCurrency(v), n]}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 min-w-0 space-y-2 max-h-44 overflow-y-auto pr-1">
                    {displayData.regions.map((r, i) => {
                      const total = displayData.regions.reduce(
                        (s, x) => s + (x.cost || 0),
                        0,
                      );
                      const pct =
                        total > 0 ? Math.round((r.cost / total) * 100) : 0;
                      return (
                        <div key={i} className="flex items-center gap-2 group">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                REGION_COLORS[i % REGION_COLORS.length],
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 truncate">
                                {r.region}
                              </span>
                              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                <span className="text-[10px] font-bold text-gray-400">
                                  {pct}%
                                </span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">
                                  {formatCurrency(r.cost)}
                                </span>
                              </div>
                            </div>
                            <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor:
                                    REGION_COLORS[i % REGION_COLORS.length],
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}

            {/* Service Breakdown — current month */}
            {!displayData?.isPast && detailsData.length > 0 && (
              <div
                id="aws-service-breakdown"
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                style={{
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                  maxHeight: "400px",
                }}
              >
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 shrink-0">
                  <div className="p-2 rounded-xl text-orange-600 dark:text-orange-400 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Service Breakdown
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-full ml-auto">
                    {detailsData.length} line items
                  </span>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: "340px" }}>
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white dark:bg-gray-900">
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="section-title px-6 py-3 text-left">#</th>
                        <th className="section-title px-6 py-3 text-left">
                          Service
                        </th>
                        <th className="section-title px-6 py-3 text-right">
                          Cost
                        </th>
                        <th className="section-title px-6 py-3 text-right text-emerald-600 dark:text-emerald-400">
                          CSP Savings (3.5%)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                      {detailsData.map((row, i) => {
                        const cost = Number(row.Cost ?? row.cost ?? 0);
                        const savings = cost * (mspRates.aws ?? 0.035);
                        return (
                          <tr
                            key={i}
                            className="hover:bg-orange-50/30 dark:hover:bg-orange-950/10 transition-colors"
                          >
                            <td className="px-6 py-3 text-xs text-gray-400 font-bold">
                              {i + 1}
                            </td>
                            <td
                              className="px-6 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-xs"
                              title={
                                row.ServiceName ?? row.service ?? "Unknown"
                              }
                            >
                              {row.ServiceName ?? row.service ?? "Unknown"}
                            </td>
                            <td className="px-6 py-3 text-right text-xs font-bold text-gray-900 dark:text-white tabular-nums">
                              {formatCurrency(cost)}
                            </td>
                            <td className="px-6 py-3 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              {savings > 0
                                ? `-${formatCurrency(savings)}`
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* EC2 Instances — current month only */}
            {!displayData?.isPast && (
              <InstancesCard instances={instances} loading={loading} />
            )}

            {/* Top Movers */}
            {displayData?.services?.length > 0 && (
              <TopMovers
                services={displayData.services}
                yearlyData={yearlyData}
                nowYear={nowYear}
                nowMonth={nowMonth}
                totalCost={displayData.totalCost ?? 0}
              />
            )}

            {/* Budgets — current month only */}
            {!displayData?.isPast && (
              <BudgetsCard budgets={budgets} loading={loading} />
            )}
          </div>
        )}

        {/* ── Executive Tab ── */}
        {activeTab === "executive" &&
          (() => {
            const execTotal = displayData?.totalCost ?? 0;
            const execForecast = displayData?.forecast ?? 0;
            const execPrev = (() => {
              const p = getPrevMonth(nowYear, nowMonth);
              return yearlyData.find(
                (m) => m.year === p.year && m.month === p.month,
              );
            })();
            const execPrevTotal = execPrev?.totalCost ?? 0;
            const execMomPct =
              execPrevTotal > 0
                ? ((execTotal - execPrevTotal) / execPrevTotal) * 100
                : null;
            const execOptSavings = savingsRecs.reduce(
              (s, r) => s + Number(r.estimatedMonthlySavings ?? r.savings ?? 0),
              0,
            );
            const execTotalSavings = mspCspSavingsComputed + execOptSavings;
            const execSavingsPct =
              execTotal > 0
                ? (execTotalSavings / (execTotal + execTotalSavings)) * 100
                : 0;
            const execServices = displayData?.services ?? [];
            const execTopSvc = execServices[0];

            /* attention items */
            const attentionItems = [];
            if (execMomPct !== null && execMomPct > 15)
              attentionItems.push({
                icon: "🔴",
                label: `Cost spike: +${execMomPct.toFixed(1)}% vs last month`,
                color: "text-red-600",
              });
            if (execForecast > execTotal * 1.4)
              attentionItems.push({
                icon: "🔴",
                label: `Forecast ${formatCurrency(execForecast)} — high end-of-month risk`,
                color: "text-red-600",
              });
            if (execOptSavings > 0)
              attentionItems.push({
                icon: "🟢",
                label: `${formatCurrency(execOptSavings)}/mo optimization savings available`,
                color: "text-emerald-600",
              });
            if (mspCspSavingsComputed > 0)
              attentionItems.push({
                icon: "🟢",
                label: `Maitsys CSP saves ${formatCurrency(mspCspSavingsComputed)}/mo (3.5% off)`,
                color: "text-emerald-600",
              });
            if (
              execTopSvc &&
              execTotal > 0 &&
              execTopSvc.value / execTotal > 0.5
            )
              attentionItems.push({
                icon: "🟡",
                label: `${execTopSvc.name} is ${((execTopSvc.value / execTotal) * 100).toFixed(0)}% of spend — concentration risk`,
                color: "text-amber-600",
              });
            if (attentionItems.length === 0)
              attentionItems.push({
                icon: "🟢",
                label: "All metrics within normal range",
                color: "text-emerald-600",
              });

            return (
              <div className="space-y-5">
                {/* Row 1 — 5 Executive KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    {
                      label: "Active Service Types",
                      value: (
                        displayData?.services ?? []
                      ).length.toLocaleString(),
                      sub: `${(detailsData ?? []).length} usage line items across services`,
                      accent: "#6366f1",
                      subColor: "text-gray-400",
                      tooltip:
                        "Number of distinct AWS billing service categories (EC2, S3, RDS…) with spend this month. Not individual resource count.",
                    },
                    {
                      label: "Total Resources",
                      value: resourcesData?.total
                        ? resourcesData.total.toLocaleString()
                        : "—",
                      sub: resourcesData?.byType?.length
                        ? `across ${resourcesData.byType.length} resource types`
                        : "EC2 · S3 · RDS · Lambda · ECS",
                      accent: "#f59e0b",
                      subColor: "text-gray-400",
                      tooltip:
                        "Actual resource instances counted via AWS APIs (EC2 instances, S3 buckets, RDS instances, Lambda functions, ECS services). This matches AWS Resource Explorer count.",
                    },
                    {
                      label: "Amount Payable",
                      value: formatCurrency(
                        execForecast > 0 ? execForecast : execTotal,
                      ),
                      sub:
                        execForecast > 0
                          ? "EOM Forecast"
                          : "Current Month-to-Date",
                      accent: "#6366f1",
                      subColor: "text-gray-400",
                    },
                    {
                      label: "Total Savings",
                      value: formatCurrency(execTotalSavings),
                      sub: `CSP + Optimization`,
                      accent: "#10b981",
                      subColor: "text-emerald-500",
                    },
                    {
                      label: "Savings %",
                      value: `${execSavingsPct.toFixed(1)}%`,
                      sub: "of gross spend",
                      accent: "#10b981",
                      subColor: "text-emerald-500",
                    },
                  ].map(({ label, value, sub, accent, subColor, tooltip }) => (
                    <div
                      key={label}
                      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex flex-col gap-1 shadow-sm"
                    >
                      <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 tracking-wider leading-tight flex items-center gap-1">
                        {label}
                        {tooltip && <KpiTooltip content={tooltip} />}
                      </p>
                      <p
                        className="text-xl font-bold tabular-nums leading-tight"
                        style={{ color: accent }}
                      >
                        {value}
                      </p>
                      <p className={`text-[10px] font-medium leading-tight ${subColor}`}>
                        {sub}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Service Types × Usage Line Items breakdown */}
                {(displayData?.services ?? []).length > 0 && (
                  <ServiceBreakdownCard
                    services={displayData?.services ?? []}
                    details={detailsData ?? []}
                    totalCost={displayData?.totalCost ?? 0}
                    s3Buckets={s3Buckets}
                    formatCurrency={formatCurrency}
                  />
                )}

                {/* Resource Inventory breakdown */}
                <ResourceBreakdownCard resources={resourcesData} accountId={account?.id} />

                {/* Row 2 — Financial Insights */}
                <div
                  id="exec-annual-trend"
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5"
                >
                  <p className="text-xs font-bold text-gray-500  tracking-wider mb-4">
                    Financial Snapshot
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      {
                        label: "Last Month",
                        value: formatCurrency(execPrevTotal),
                        note:
                          execPrevTotal > 0
                            ? MONTH_LABELS[
                                getPrevMonth(nowYear, nowMonth).month - 1
                              ]
                            : "—",
                      },
                      {
                        label: "Current Month",
                        value: formatCurrency(execTotal),
                        note: "Month-to-Date",
                      },
                      {
                        label: "Full Year Total",
                        value:
                          yearlyTotal > 0 ? formatCurrency(yearlyTotal) : "—",
                        note: `${nowYear}`,
                      },
                      {
                        label: "Projected Annual",
                        value:
                          yearlyAvg > 0 ? formatCurrency(yearlyAvg * 12) : "—",
                        note: "Avg × 12",
                      },
                      {
                        label: "YTD Savings",
                        value: formatCurrency(execTotalSavings * nowMonth),
                        note: "Est. cumulative",
                      },
                    ].map(({ label, value, note }) => (
                      <div
                        key={label}
                        className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 text-center"
                      >
                        <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 tracking-wider mb-1">
                          {label}
                        </p>
                        <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">
                          {value}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {note}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Trend chart below financials */}
                  {yearlyChartData.length > 0 && (
                    <div className="mt-5 h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={yearlyChartData}
                          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                          onClick={(e) => {
                            if (e?.activePayload?.[0]) {
                              const m = e.activePayload[0].payload;
                              if (!(m.year === nowYear && m.month === nowMonth))
                                setSelectedMonth({
                                  year: m.year,
                                  month: m.month,
                                });
                              else setSelectedMonth(null);
                            }
                          }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="rgba(148,163,184,0.12)"
                          />
                          <XAxis
                            dataKey="label"
                            stroke="#94a3b8"
                            fontSize={10}
                            fontWeight="600"
                            axisLine={false}
                            tickLine={false}
                            dy={8}
                          />
                          <YAxis
                            width={44}
                            stroke="#94a3b8"
                            fontSize={10}
                            fontWeight="600"
                            tickFormatter={(v) =>
                              `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                            }
                            axisLine={false}
                            tickLine={false}
                            dx={-4}
                          />
                          <Tooltip
                            formatter={(v) => [formatCurrency(v), "Cost"]}
                            contentStyle={{
                              borderRadius: "12px",
                              border: "1px solid #e2e8f0",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                            cursor={{ fill: "rgba(148,163,184,0.08)" }}
                          />
                          <Bar
                            dataKey="cost"
                            radius={[4, 4, 0, 0]}
                            animationDuration={600}
                            cursor="pointer"
                          >
                            {yearlyChartData.map((entry, i) => (
                              <Cell
                                key={i}
                                fill={entry.isSel ? "#FF9900" : "#FFB347"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Row 3 — AI Executive Summary */}
                {aiInsights.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      onClick={() => setExecSummaryOpen((v) => !v)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">✨</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                          AI Executive Summary
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full">
                          {aiInsights.length} insights
                        </span>
                      </div>
                      <span className="text-gray-400 text-xs">
                        {execSummaryOpen ? "▲" : "▼"}
                      </span>
                    </button>
                    {execSummaryOpen && (
                      <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {aiInsights.map((ins, i) => (
                          <div
                            key={i}
                            className={`flex gap-2.5 p-3 rounded-xl border text-sm ${ins.type === "warning" ? "border-amber-100 dark:border-amber-900/30" : ins.type === "success" ? "border-emerald-100 dark:border-emerald-900/30" : "border-blue-100 dark:border-blue-900/30"}`}
                          >
                            <span className="mt-0.5 shrink-0">
                              {ins.type === "warning"
                                ? "⚠️"
                                : ins.type === "success"
                                  ? "✅"
                                  : "ℹ️"}
                            </span>
                            <div>
                              <p
                                className={`text-xs font-bold mb-0.5 ${ins.type === "warning" ? "text-amber-700 dark:text-amber-300" : ins.type === "success" ? "text-emerald-700 dark:text-emerald-300" : "text-blue-700 dark:text-blue-300"}`}
                              >
                                {ins.title}
                              </p>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                {ins.detail}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Service Category Summary */}
                {detailsData.length > 0 && (
                  <ServiceCategoryCard
                    services={detailsData.map((r) => ({
                      name: r.ServiceName ?? r.service,
                      cost: r.Cost ?? r.cost ?? 0,
                    }))}
                    provider="aws"
                    currency="USD"
                  />
                )}

                {/* Row 4 — Top 5 Cost Drivers + CSP Savings side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Top 5 Cost Drivers */}
                  <div
                    id="exec-top-services"
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5"
                  >
                    <p className="text-xs font-bold text-gray-500  tracking-wider mb-4">
                      Top 5 Cost Drivers
                    </p>
                    {execServices.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">
                        No service data available
                      </p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 tracking-wider border-b border-gray-100 dark:border-gray-800">
                            <th className="text-left pb-2">#</th>
                            <th className="text-left pb-2">Service</th>
                            <th className="text-right pb-2">Monthly Cost</th>
                            <th className="text-right pb-2">% of Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {execServices.slice(0, 5).map((svc, i) => {
                            const pct =
                              execTotal > 0
                                ? ((svc.value / execTotal) * 100).toFixed(1)
                                : "0.0";
                            return (
                              <tr
                                key={i}
                                className="border-b border-gray-50 dark:border-gray-800/50 last:border-0"
                              >
                                <td className="py-2.5 pr-2 text-xs text-gray-400 font-bold">
                                  {i + 1}
                                </td>
                                <td className="py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                                  {svc.name}
                                </td>
                                <td className="py-2.5 text-right text-xs font-bold text-gray-900 dark:text-white tabular-nums">
                                  {formatCurrency(svc.value)}
                                </td>
                                <td className="py-2.5 text-right">
                                  <span
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                                    style={{
                                      backgroundColor: `${AWS_COLORS[i % AWS_COLORS.length]}22`,
                                      color: AWS_COLORS[i % AWS_COLORS.length],
                                    }}
                                  >
                                    {pct}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Attention Center */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                    <p className="text-xs font-bold text-gray-500  tracking-wider mb-4">
                      Attention Center
                    </p>
                    <div className="space-y-2.5">
                      {attentionItems.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 dark:border-gray-800"
                        >
                          <span className="text-base leading-none mt-0.5 shrink-0">
                            {item.icon}
                          </span>
                          <p
                            className={`text-xs font-semibold leading-relaxed ${item.color}`}
                          >
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>
                    {/* CSP savings footer */}
                    {mspCspSavingsComputed > 0 && (
                      <div
                        id="exec-csp-savings"
                        className="mt-4 flex items-center gap-3 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800"
                      >
                        <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            Maitsys CSP —{" "}
                            {formatCurrency(mspCspSavingsComputed)}/mo saved
                          </p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            {((mspRates.aws ?? 0.035) * 100).toFixed(1)}% pricing advantage on AWS spend
                          </p>
                        </div>
                        <span className="shrink-0 px-2 py-1 border border-emerald-400 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg">
                          3.5% off
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
      </main>
    </div>
  );
};

export default DetailedDashboard;
