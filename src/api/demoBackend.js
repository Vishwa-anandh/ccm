/**
 * demoBackend — an in-browser stand-in for the CCM backend.
 *
 * No backend is running locally (VITE_API_URL points at
 * http://localhost:8080/api, which nothing is listening on), so every
 * request would otherwise fail. This installs a custom axios adapter that
 * intercepts requests before they hit the network and resolves them with
 * realistic canned data instead — enough to log in and see a populated
 * dashboard without any server.
 *
 * To go back to a real backend: set DEMO_MODE to false (or point
 * VITE_API_URL at a live server and delete this file / its usage in
 * ../api/index.js).
 */

import { calcLine, round2, CALC_ORDERS } from "../utils/pricingCalc";

export const DEMO_MODE = true;

/* ── Demo user ─────────────────────────────────────────────── */

export const DEMO_USER = {
  id: "demo-user-1",
  email: "demo@maitsys.com",
  fullName: "Demo Admin",
  orgName: "Maitsys Demo Org",
  currentOrgId: "org-demo-1",
  role: "admin",
  planType: "Enterprise",
  cloudPreference: "multi",
  invoiceOnly: false,
  cloudAccess: ["azure", "aws", "btp", "gcp"],
  canViewAzure: true,
  canViewAws: true,
  canViewBtp: true,
  canViewGcp: true,
  features: {
    budgets: true,
    smartAlerts: true,
    syncLogs: true,
    recommendations: true,
    cloudManagement: true,
    invoices: true,
    customerInvoicing: true,
    invoiceBuilder: true,
  },
  accountLimits: { azure: 10, aws: 10, btp: 10 },
};

/* ── Demo dataset ──────────────────────────────────────────── */

const MONTHLY = [
  { key: "2026-04", total: 12980, azure: 6200, aws: 4080, btp: 1800, gcp: 900 },
  { key: "2026-05", total: 13500, azure: 6400, aws: 4300, btp: 1850, gcp: 950 },
  { key: "2026-06", total: 14000, azure: 6600, aws: 4500, btp: 1900, gcp: 1000 },
  { key: "2026-07", total: 14850, azure: 7100, aws: 4700, btp: 2000, gcp: 1050 },
  { key: "2026-08", total: 15500, azure: 7400, aws: 4900, btp: 2100, gcp: 1100 },
  { key: "2026-09", total: 16000, azure: 7600, aws: 5100, btp: 2150, gcp: 1150 },
];
const CURRENT = MONTHLY[MONTHLY.length - 1];

const DASHBOARD_SUMMARY = {
  totals: {
    azure: CURRENT.azure,
    aws: CURRENT.aws,
    btp: CURRENT.btp,
    gcp: CURRENT.gcp,
    forecast: 21500,
    forecastByProvider: { azure: 10200, aws: 6800, btp: 2900 },
  },
  accounts: {
    azure: [
      { id: "az-1", name: "Contoso Production", subscriptionId: "a1b2c3d4-1111-4a2b-9c3d-000000000001" },
      { id: "az-2", name: "Contoso Dev/Test", subscriptionId: "a1b2c3d4-2222-4a2b-9c3d-000000000002" },
    ],
    aws: [
      { id: "aws-1", name: "Production (111122223333)" },
      { id: "aws-2", name: "Staging (444455556666)" },
    ],
    btp: [{ id: "btp-1", name: "BTP Global Account" }],
    gcp: [{ id: "gcp-1", name: "core-services" }],
  },
  monthly: MONTHLY,
};

const RECOMMENDATIONS = [
  { id: "rec-1", title: 'Resize underutilized VM "web-app-03"', description: "CPU utilization has averaged 6% over the last 30 days.", provider: "azure", category: "Compute", estimated_savings: 412.5, priority: "high" },
  { id: "rec-2", title: "Purchase Reserved Instances for RDS", description: "Switch 4 on-demand db.r5.large instances to 1-yr reserved.", provider: "aws", category: "Database", estimated_savings: 860.0, priority: "high" },
  { id: "rec-3", title: "Delete 12 unattached managed disks", description: "Disks have had zero attachments for 60+ days.", provider: "azure", category: "Storage", estimated_savings: 96.3, priority: "medium" },
  { id: "rec-4", title: "Rightsize BTP HANA service plan", description: "Allocated memory exceeds peak usage by 3x.", provider: "btp", category: "Database", estimated_savings: 210.0, priority: "medium" },
  { id: "rec-5", title: "Enable S3 Intelligent-Tiering", description: "18 buckets store infrequently accessed objects in Standard tier.", provider: "aws", category: "Storage", estimated_savings: 145.75, priority: "low" },
];
const RECS_SUMMARY = {
  totalRecommendations: RECOMMENDATIONS.length,
  totalEstimatedSavings: RECOMMENDATIONS.reduce((s, r) => s + r.estimated_savings, 0),
};

const ALERTS = [
  { id: "al-1", title: "Azure spend spiked 32% week-over-week", severity: "critical", status: "open", provider: "azure", created_at: "2026-09-05T08:00:00Z" },
  { id: "al-2", title: 'AWS budget "Production" at 92% utilization', severity: "high", status: "open", provider: "aws", created_at: "2026-09-04T14:20:00Z" },
  { id: "al-3", title: "New anomaly: unusual GCP egress traffic", severity: "high", status: "open", provider: "gcp", created_at: "2026-09-03T22:10:00Z" },
  { id: "al-4", title: "BTP monthly cost forecast exceeds budget", severity: "medium", status: "resolved", provider: "btp", created_at: "2026-08-29T10:00:00Z" },
];
const ALERTS_SUMMARY = { bySeverity: { critical: 1, high: 2, medium: 1, low: 0 } };

const BUDGETS = [
  { id: "bud-1", name: "Azure Monthly", provider: "azure", target_amount: 8000, period: "monthly" },
  { id: "bud-2", name: "AWS Monthly", provider: "aws", target_amount: 5500, period: "monthly" },
  { id: "bud-3", name: "Overall Cloud Spend", provider: "all", target_amount: 17000, period: "monthly" },
];

const MSP_SAVINGS = {
  totalSavings: 753.5,
  breakdown: [
    { provider: "azure", savingsRate: 0.07 },
    { provider: "aws", savingsRate: 0.035 },
    { provider: "btp", savingsRate: 0.02 },
  ],
};

const INVOICES = ["07", "08", "09"].flatMap((mm) => {
  const m = MONTHLY.find((x) => x.key === `2026-${mm}`);
  return [
    { id: `inv-azure-${mm}`, provider: "azure", total_cost: m.azure, invoice_date: `2026-${mm}-01`, billing_period: `2026-${mm}-01`, meta: { billingProfile: "Contoso Corp — EA Enrollment 70142" } },
    { id: `inv-aws-${mm}`, provider: "aws", total_cost: m.aws, invoice_date: `2026-${mm}-01`, billing_period: `2026-${mm}-01`, meta: { billingProfile: "AWS Organization o-abc123" } },
    { id: `inv-btp-${mm}`, provider: "btp", total_cost: m.btp, invoice_date: `2026-${mm}-01`, billing_period: `2026-${mm}-01`, meta: { billingProfile: "BTP Global Account" } },
  ];
});

/* ── Billing (Customer Invoicing module) ──────────────────────
 * Per the "Maitsys CCM Invoicing Requirement Document": Finance turns a
 * customer's already-ingested vendor invoices (above) into an editable,
 * Maitsys-branded Customer Invoice with a per-line discount + Maitsys
 * adjustment + tax, then approves and publishes it into that same
 * customer's CCM account. All of it is in-memory here (resets on reload),
 * mirroring how the rest of this file mocks a real backend.
 *
 * Status model: the source doc's enum is
 * Draft / Approved / Published / Sent / Paid / Overdue. Only
 * Published-and-later is ever visible to the customer, and the customer
 * only ever sees Sent / Paid / Overdue (doc §5, step 9) — so here
 * "publish" transitions a Draft-approved invoice straight to "Sent"
 * (Published is the action, Sent is the resulting visible status) rather
 * than modeling Published as its own resting state.
 */

let nextCustomerInvoiceSeq = 12; // seeded ones below use 0007–0011
// Monotonic id counters — safer than `array.length + 1` if two writes ever
// land close together (the adapter's artificial network delay widens that
// window enough for it to matter in practice).
let nextCustomerId = 4;
let nextRuleId = 6;
let nextCustomerInvoiceId = 6;
let nextPaymentId = 2;

const CUSTOMERS = [
  {
    id: "cust-1",
    orgId: "org-demo-1", // matches DEMO_USER.currentOrgId — this is "you" when previewing the customer side
    name: "Contoso Corp",
    billingAddress: "500 Boulevard Ave, Suite 300\nAustin, TX 78701, USA",
    logo: "maitsys-default",
    primaryContactEmail: "billing@contoso-demo.com",
    active: true,
  },
  {
    id: "cust-2",
    orgId: null,
    name: "Acton Tamil School",
    billingAddress: "12 Meadowbrook Rd\nActon, MA 01720, USA",
    logo: "maitsys-default",
    primaryContactEmail: "accounts@actontamilschool.example",
    active: true,
  },
  {
    id: "cust-3",
    orgId: null,
    name: "Meridian Health Group",
    billingAddress: "88 Harborview Plaza, Floor 4\nSeattle, WA 98101, USA",
    logo: "maitsys-default",
    primaryContactEmail: "ap@meridianhealth.example",
    active: true,
  },
];

const PRICING_RULES = [
  { id: "rule-1", customerId: "cust-1", vendor: "azure", serviceCategory: null, vendorDiscountPct: 7, maitsysAdjustmentPct: 5, taxPct: 8, calculationOrder: CALC_ORDERS.DISCOUNT_THEN_ADJUSTMENT, effectiveFrom: "2026-01-01", effectiveTo: null, createdBy: "Demo Admin", approvedBy: "Demo Admin" },
  { id: "rule-2", customerId: "cust-1", vendor: "aws", serviceCategory: null, vendorDiscountPct: 3.5, maitsysAdjustmentPct: 5, taxPct: 8, calculationOrder: CALC_ORDERS.DISCOUNT_THEN_ADJUSTMENT, effectiveFrom: "2026-01-01", effectiveTo: null, createdBy: "Demo Admin", approvedBy: "Demo Admin" },
  { id: "rule-3", customerId: "cust-1", vendor: "btp", serviceCategory: null, vendorDiscountPct: 2, maitsysAdjustmentPct: 5, taxPct: 8, calculationOrder: CALC_ORDERS.DISCOUNT_THEN_ADJUSTMENT, effectiveFrom: "2026-01-01", effectiveTo: null, createdBy: "Demo Admin", approvedBy: "Demo Admin" },
  // Explicit zero discount — the doc calls this out as a business rule: zero is
  // an explicit, verified value, never a blank/unset field.
  { id: "rule-4", customerId: "cust-2", vendor: "azure", serviceCategory: null, vendorDiscountPct: 0, maitsysAdjustmentPct: 6, taxPct: 0, calculationOrder: CALC_ORDERS.DISCOUNT_THEN_ADJUSTMENT, effectiveFrom: "2026-01-01", effectiveTo: null, createdBy: "Demo Admin", approvedBy: "Demo Admin" },
  { id: "rule-5", customerId: "cust-3", vendor: "aws", serviceCategory: null, vendorDiscountPct: 5, maitsysAdjustmentPct: 4, taxPct: 10, calculationOrder: CALC_ORDERS.DISCOUNT_THEN_ADJUSTMENT, effectiveFrom: "2026-01-01", effectiveTo: null, createdBy: "Demo Admin", approvedBy: "Demo Admin" },
];

// Canned per-provider service breakdown used to split a vendor invoice's lump
// total_cost into plausible line items (today's vendor mock only carries one
// total per invoice, not per-service quantity/unit-price detail).
const SERVICE_SPLIT_TEMPLATES = {
  azure: [
    { name: "Virtual Machines", share: 0.55 },
    { name: "Storage Accounts", share: 0.25 },
    { name: "Azure SQL Database", share: 0.2 },
  ],
  aws: [
    { name: "EC2 — Compute", share: 0.5 },
    { name: "S3 — Storage", share: 0.3 },
    { name: "RDS — Database", share: 0.2 },
  ],
  btp: [
    { name: "HANA Cloud Service", share: 0.6 },
    { name: "BTP Application Runtime", share: 0.4 },
  ],
  gcp: [
    { name: "Compute Engine", share: 0.6 },
    { name: "Cloud Storage", share: 0.4 },
  ],
};

/** Splits one ingested vendor invoice into 2–3 priced Customer Invoice lines. */
function linesFromVendorInvoice(vendorInvoice, rule) {
  const templates = SERVICE_SPLIT_TEMPLATES[vendorInvoice.provider] ?? [
    { name: `${vendorInvoice.provider.toUpperCase()} Services`, share: 1 },
  ];
  return templates.map((t, i) => {
    const vendorLineTotal = round2(vendorInvoice.total_cost * t.share);
    const calc = calcLine({
      quantity: 1,
      vendorUnitPrice: vendorLineTotal,
      vendorLineTotal,
      discountPct: rule?.vendorDiscountPct ?? 0,
      adjustmentPct: rule?.maitsysAdjustmentPct ?? 0,
      order: rule?.calculationOrder,
    });
    return {
      lineNumber: i + 1,
      description: t.name,
      subscriptionId: `${vendorInvoice.provider}-${vendorInvoice.id.slice(-6)}`,
      extra: {},
      ...calc,
    };
  });
}

function buildInvoiceTotals(lines, taxPct) {
  const subtotal = round2(lines.reduce((s, l) => s + l.finalLineAmount, 0));
  const tax = round2(subtotal * (Number(taxPct ?? 0) / 100));
  return { subtotal, tax, totalDue: round2(subtotal + tax) };
}

function makeInvoiceNumber() {
  const n = String(nextCustomerInvoiceSeq++).padStart(4, "0");
  return `INV-2026-${n}`;
}

// ── Seeded customer invoices, covering every status the doc's enum needs ──

const cust1JulLines = [
  ...linesFromVendorInvoice(INVOICES.find((i) => i.id === "inv-azure-07"), PRICING_RULES[0]),
  ...linesFromVendorInvoice(INVOICES.find((i) => i.id === "inv-aws-07"), PRICING_RULES[1]),
  ...linesFromVendorInvoice(INVOICES.find((i) => i.id === "inv-btp-07"), PRICING_RULES[2]),
].map((l, i) => ({ ...l, lineNumber: i + 1 }));
const cust1JulTotals = buildInvoiceTotals(cust1JulLines, 8);

const cust1AugLines = [
  ...linesFromVendorInvoice(INVOICES.find((i) => i.id === "inv-azure-08"), PRICING_RULES[0]),
  ...linesFromVendorInvoice(INVOICES.find((i) => i.id === "inv-aws-08"), PRICING_RULES[1]),
  ...linesFromVendorInvoice(INVOICES.find((i) => i.id === "inv-btp-08"), PRICING_RULES[2]),
].map((l, i) => ({ ...l, lineNumber: i + 1 }));
const cust1AugTotals = buildInvoiceTotals(cust1AugLines, 8);

const cust1SepLines = [
  ...linesFromVendorInvoice(INVOICES.find((i) => i.id === "inv-azure-09"), PRICING_RULES[0]),
  ...linesFromVendorInvoice(INVOICES.find((i) => i.id === "inv-aws-09"), PRICING_RULES[1]),
  ...linesFromVendorInvoice(INVOICES.find((i) => i.id === "inv-btp-09"), PRICING_RULES[2]),
].map((l, i) => ({ ...l, lineNumber: i + 1 }));
const cust1SepTotals = buildInvoiceTotals(cust1SepLines, 8);

// Demonstrates the manual-build columns/custom-fields feature in seed data,
// so the first Draft a viewer opens already shows what "Build Invoice" adds.
const COL_NOTES = "col-notes-demo";
const cust2Lines = [
  { lineNumber: 1, description: "Azure App Service — Compute", subscriptionId: "sub-acton-001", extra: { [COL_NOTES]: "Monthly hosting" }, ...calcLine({ quantity: 1, vendorUnitPrice: 640, discountPct: 0, adjustmentPct: 6, order: PRICING_RULES[3].calculationOrder }) },
];
const cust2Totals = buildInvoiceTotals(cust2Lines, 0);

const cust3Lines = [
  { lineNumber: 1, description: "AWS EC2 — Reserved Instances", subscriptionId: "acct-444455556677", extra: {}, ...calcLine({ quantity: 1, vendorUnitPrice: 3200, discountPct: 5, adjustmentPct: 4, order: PRICING_RULES[4].calculationOrder }) },
];
const cust3Totals = buildInvoiceTotals(cust3Lines, 10);

const CUSTOMER_INVOICES = [
  {
    id: "cinv-1", invoiceNumber: "INV-2026-0007", customerId: "cust-1", currency: "USD",
    invoiceDate: "2026-08-01", dueDate: "2026-08-15",
    billingPeriodStart: "2026-07-01", billingPeriodEnd: "2026-07-31",
    sourceVendorInvoiceIds: ["inv-azure-07", "inv-aws-07", "inv-btp-07"],
    status: "Paid",
    customFields: [], columns: [],
    lines: cust1JulLines, ...cust1JulTotals,
    approvedBy: "Demo Admin", approvedDate: "2026-07-28",
    publishedDate: "2026-08-01",
    paidDate: "2026-08-10", paymentReference: "PAY-DEMO-000123", paymentMethod: "card",
  },
  {
    id: "cinv-2", invoiceNumber: "INV-2026-0008", customerId: "cust-1", currency: "USD",
    invoiceDate: "2026-08-15", dueDate: "2026-08-29",
    billingPeriodStart: "2026-08-01", billingPeriodEnd: "2026-08-31",
    sourceVendorInvoiceIds: ["inv-azure-08", "inv-aws-08", "inv-btp-08"],
    status: "Overdue",
    customFields: [], columns: [],
    lines: cust1AugLines, ...cust1AugTotals,
    approvedBy: "Demo Admin", approvedDate: "2026-08-14",
    publishedDate: "2026-08-16",
    paidDate: null, paymentReference: null, paymentMethod: null,
  },
  {
    id: "cinv-3", invoiceNumber: "INV-2026-0009", customerId: "cust-1", currency: "USD",
    invoiceDate: "2026-09-05", dueDate: "2026-09-20",
    billingPeriodStart: "2026-09-01", billingPeriodEnd: "2026-09-30",
    sourceVendorInvoiceIds: ["inv-azure-09", "inv-aws-09", "inv-btp-09"],
    status: "Approved",
    customFields: [], columns: [],
    lines: cust1SepLines, ...cust1SepTotals,
    approvedBy: "Demo Admin", approvedDate: "2026-09-06",
    publishedDate: null, paidDate: null, paymentReference: null, paymentMethod: null,
  },
  {
    id: "cinv-4", invoiceNumber: "INV-2026-0010", customerId: "cust-2", currency: "USD",
    invoiceDate: "2026-09-07", dueDate: "2026-09-22",
    billingPeriodStart: "2026-09-01", billingPeriodEnd: "2026-09-30",
    sourceVendorInvoiceIds: [],
    status: "Draft",
    customFields: [{ id: "cf-demo-1", label: "PO Number", value: "PO-77410" }],
    columns: [{ id: COL_NOTES, label: "Notes" }],
    lines: cust2Lines, ...cust2Totals,
    approvedBy: null, approvedDate: null,
    publishedDate: null, paidDate: null, paymentReference: null, paymentMethod: null,
  },
  {
    id: "cinv-5", invoiceNumber: "INV-2026-0011", customerId: "cust-3", currency: "USD",
    invoiceDate: "2026-09-01", dueDate: "2026-09-30",
    billingPeriodStart: "2026-08-01", billingPeriodEnd: "2026-08-31",
    sourceVendorInvoiceIds: [],
    status: "Sent",
    customFields: [], columns: [],
    lines: cust3Lines, ...cust3Totals,
    approvedBy: "Demo Admin", approvedDate: "2026-08-30",
    publishedDate: "2026-09-01", paidDate: null, paymentReference: null, paymentMethod: null,
  },
];

const PAYMENTS = [
  { id: "pay-1", invoiceId: "cinv-1", paymentDate: "2026-08-10", amountPaid: cust1JulTotals.totalDue, paymentMethod: "card", gatewayReference: "PAY-DEMO-000123", status: "Completed" },
];

/* ── Adapter ───────────────────────────────────────────────── */

const routeOf = (url) => (url || "").split("?")[0];

// A real backend always hands back an independent copy of its data — the
// caller can never see a later server-side mutation "for free". Cloning
// here matters: several of this file's arrays (CUSTOMER_INVOICES, etc.)
// are mutated in place by later requests (push/Object.assign), and without
// this clone a caller holding an earlier response would silently see those
// mutations reflected in state it already committed, corrupting things
// like `setInvoices((prev) => [...prev, invoice])` (prev would already
// contain `invoice` if it aliased the live array, duplicating it).
const ok = (data, config, status = 200) =>
  Promise.resolve({
    data: structuredClone(data),
    status,
    statusText: "OK",
    headers: {},
    config,
    request: {},
  });

const fail = (message, config, status = 400) => {
  const err = new Error(message);
  err.response = { status, data: { error: message }, config };
  err.config = config;
  return Promise.reject(err);
};

// Axios has already run transformRequest by the time our adapter sees the
// config, so a JSON body arrives as a string here — parse it back out.
const body = (config) => {
  if (!config.data) return {};
  if (typeof config.data === "string") {
    try {
      return JSON.parse(config.data);
    } catch {
      return {};
    }
  }
  return config.data;
};

// Matches a literal "/billing/customers/:id"-shaped path, returning the
// captured id, or null if it doesn't match. Every other route in this file
// is a static literal string — this is the one helper needed for the new
// path-param routes the Billing module adds.
const matchParam = (pattern, path) => {
  const re = new RegExp("^" + pattern.replace(/:[^/]+/g, "([^/]+)") + "$");
  const m = path.match(re);
  return m ? m[1] : null;
};

export async function demoAdapter(config) {
  // Small delay so loading skeletons are visibly exercised, like a real request.
  await new Promise((resolve) => setTimeout(resolve, 250));

  const method = (config.method || "get").toLowerCase();
  const path = routeOf(config.url);

  if (method === "post" && path === "/auth/login") {
    return ok({ token: "demo-token", refreshToken: "demo-refresh-token", user: DEMO_USER }, config);
  }
  if (method === "get" && path === "/auth/me") {
    return ok(DEMO_USER, config);
  }
  if (method === "post" && path === "/auth/logout") {
    return ok({}, config);
  }
  if (method === "get" && path === "/summary/dashboard") {
    return ok(DASHBOARD_SUMMARY, config);
  }
  if (method === "get" && path === "/recommendations") {
    return ok({ data: RECOMMENDATIONS, summary: RECS_SUMMARY }, config);
  }
  if (method === "get" && path === "/smart-alerts") {
    return ok({ alerts: ALERTS, summary: ALERTS_SUMMARY }, config);
  }
  if (method === "get" && path === "/budgets") {
    return ok(BUDGETS, config);
  }
  if (method === "get" && path === "/insights/msp-savings") {
    return ok(MSP_SAVINGS, config);
  }
  if (method === "get" && path === "/invoices") {
    return ok({ data: INVOICES }, config);
  }

  /* ── Billing (Customer Invoicing) ── */

  if (method === "get" && path === "/billing/customers") {
    return ok(CUSTOMERS, config);
  }
  if (method === "post" && path === "/billing/customers") {
    const b = body(config);
    const customer = {
      id: `cust-${nextCustomerId++}`,
      orgId: null,
      active: true,
      ...b,
    };
    CUSTOMERS.push(customer);
    return ok(customer, config);
  }
  {
    const id = matchParam("/billing/customers/:id", path);
    if (id && method === "patch") {
      const customer = CUSTOMERS.find((c) => c.id === id);
      if (!customer) return fail("Customer not found", config, 404);
      Object.assign(customer, body(config));
      return ok(customer, config);
    }
  }

  if (method === "get" && path === "/billing/pricing-rules") {
    return ok(PRICING_RULES, config);
  }
  if (method === "post" && path === "/billing/pricing-rules") {
    const b = body(config);
    const rule = {
      id: `rule-${nextRuleId++}`,
      calculationOrder: CALC_ORDERS.DISCOUNT_THEN_ADJUSTMENT,
      effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveTo: null,
      createdBy: DEMO_USER.fullName,
      approvedBy: DEMO_USER.fullName,
      ...b,
    };
    PRICING_RULES.push(rule);
    return ok(rule, config);
  }
  {
    const id = matchParam("/billing/pricing-rules/:id", path);
    if (id && method === "patch") {
      const rule = PRICING_RULES.find((r) => r.id === id);
      if (!rule) return fail("Pricing rule not found", config, 404);
      Object.assign(rule, body(config));
      return ok(rule, config);
    }
    if (id && method === "delete") {
      const idx = PRICING_RULES.findIndex((r) => r.id === id);
      if (idx === -1) return fail("Pricing rule not found", config, 404);
      PRICING_RULES.splice(idx, 1);
      return ok({}, config);
    }
  }

  if (method === "get" && path === "/billing/invoices") {
    return ok({ data: CUSTOMER_INVOICES }, config);
  }
  // Replaces the old vendor-invoice auto-pull "/generate" endpoint: Finance
  // now builds a Customer Invoice by hand (Invoice Builder's dynamic
  // rows/columns/custom-fields UI, reused inside Billing) rather than
  // picking a customer + period and having vendor data pulled in for them.
  if (method === "post" && path === "/billing/invoices/build") {
    const {
      customerId,
      invoiceDate,
      dueDate,
      billingPeriodStart,
      billingPeriodEnd,
      customFields,
      columns,
      rows,
      taxPct,
      template,
    } = body(config);
    const customer = CUSTOMERS.find((c) => c.id === customerId);
    if (!customer) return fail("Customer not found", config, 404);
    if (!Array.isArray(rows) || rows.length === 0) {
      return fail("At least one line item is required.", config, 422);
    }

    // Manually-built lines start with no discount/adjustment — there's no
    // vendor invoice to discount against here. Finance can still edit
    // these inline afterward on the Draft, same as an auto-pulled invoice.
    const lines = rows.map((r, i) => ({
      lineNumber: i + 1,
      description: r.description,
      subscriptionId: null,
      extra: r.extra ?? {},
      ...calcLine({
        quantity: r.quantity,
        vendorUnitPrice: r.unitPrice,
        discountPct: 0,
        adjustmentPct: 0,
      }),
    }));

    const totals = buildInvoiceTotals(lines, taxPct);
    const today = new Date().toISOString().slice(0, 10);

    const invoice = {
      id: `cinv-${nextCustomerInvoiceId++}`,
      invoiceNumber: makeInvoiceNumber(),
      customerId,
      currency: "USD",
      invoiceDate: invoiceDate || today,
      dueDate: dueDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      billingPeriodStart: billingPeriodStart || null,
      billingPeriodEnd: billingPeriodEnd || null,
      sourceVendorInvoiceIds: [], // manually built — not linked to any ingested vendor invoice
      status: "Draft",
      customFields: customFields ?? [],
      columns: columns ?? [],
      template: template === "modern" ? "modern" : "classic",
      lines,
      ...totals,
      approvedBy: null,
      approvedDate: null,
      publishedDate: null,
      paidDate: null,
      paymentReference: null,
      paymentMethod: null,
    };
    CUSTOMER_INVOICES.push(invoice);
    return ok(invoice, config);
  }
  {
    const id = matchParam("/billing/invoices/:id", path);
    if (id && method === "get") {
      const invoice = CUSTOMER_INVOICES.find((i) => i.id === id);
      if (!invoice) return fail("Invoice not found", config, 404);
      return ok(invoice, config);
    }
    if (id && method === "patch") {
      const invoice = CUSTOMER_INVOICES.find((i) => i.id === id);
      if (!invoice) return fail("Invoice not found", config, 404);
      if (invoice.status !== "Draft") {
        return fail("Only a Draft invoice can be edited.", config, 409);
      }
      const { lines, taxPct } = body(config);
      const recalculated = (lines ?? invoice.lines).map((l) => ({
        ...l,
        ...calcLine({
          quantity: l.quantity,
          vendorUnitPrice: l.vendorUnitPrice,
          discountPct: l.discountPctApplied,
          adjustmentPct: l.maitsysAdjustmentPctApplied,
        }),
      }));
      Object.assign(invoice, {
        lines: recalculated,
        ...buildInvoiceTotals(recalculated, taxPct ?? invoice.tax),
      });
      return ok(invoice, config);
    }
  }
  {
    const id = matchParam("/billing/invoices/:id/approve", path);
    if (id && method === "post") {
      const invoice = CUSTOMER_INVOICES.find((i) => i.id === id);
      if (!invoice) return fail("Invoice not found", config, 404);
      if (invoice.status !== "Draft") {
        return fail("Only a Draft invoice can be approved.", config, 409);
      }
      invoice.status = "Approved";
      invoice.approvedBy = DEMO_USER.fullName;
      invoice.approvedDate = new Date().toISOString().slice(0, 10);
      return ok(invoice, config);
    }
  }
  {
    const id = matchParam("/billing/invoices/:id/publish", path);
    if (id && method === "post") {
      const invoice = CUSTOMER_INVOICES.find((i) => i.id === id);
      if (!invoice) return fail("Invoice not found", config, 404);
      if (invoice.status !== "Approved") {
        return fail("Only an Approved invoice can be published.", config, 409);
      }
      invoice.status = "Sent";
      invoice.publishedDate = new Date().toISOString().slice(0, 10);
      return ok(invoice, config);
    }
  }
  {
    const id = matchParam("/billing/invoices/:id/pay", path);
    if (id && method === "post") {
      const invoice = CUSTOMER_INVOICES.find((i) => i.id === id);
      if (!invoice) return fail("Invoice not found", config, 404);
      if (invoice.status !== "Sent" && invoice.status !== "Overdue") {
        return fail("This invoice isn't awaiting payment.", config, 409);
      }
      invoice.status = "Paid";
      invoice.paidDate = new Date().toISOString().slice(0, 10);
      invoice.paymentReference = `PAY-DEMO-${String(100000 + nextPaymentId).slice(-6)}`;
      invoice.paymentMethod = "card";
      PAYMENTS.push({
        id: `pay-${nextPaymentId++}`,
        invoiceId: invoice.id,
        paymentDate: invoice.paidDate,
        amountPaid: invoice.totalDue,
        paymentMethod: "card",
        gatewayReference: invoice.paymentReference,
        status: "Completed",
      });
      return ok(invoice, config);
    }
  }

  // Anything else isn't specifically mocked yet — respond empty rather than
  // failing the request, so pages we haven't seeded degrade gracefully
  // instead of throwing network errors.
  return ok({}, config);
}
