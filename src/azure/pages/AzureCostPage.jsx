import React, { useState, useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import MarqueeTitle from "../../components/MarqueeTitle";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  AlertCircle,
  Box,
  Database,
  Lightbulb,
  Bell,
  FileText,
  Search,
  X,
  Filter,
  RefreshCw,
  Download,
  ChevronDown,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Layers,
  Zap,
  Sparkles,
  CheckCircle2,
  CalendarClock,
} from "lucide-react";

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

function getLast12Months() {
  const now = new Date();
  const result = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return result;
}
import api from "../../api";
import { useMspRates } from "../../hooks/useMspRates";
import {
  formatCurrency,
  formatDateShort,
  formatMonthYear,
} from "../../utils/formatters";
import { exportToCSV } from "../../utils/exportUtils";
import ServiceCategoryCard from "../../components/ServiceCategoryCard";
import DayComparisonCard from "../../components/DayComparisonCard";
import DailyHistoryCharts from "../../components/DailyHistoryCharts";
import DailyCostHistoryTabs from "../../components/DailyCostHistoryTabs";
import KpiTooltip from "../../components/KpiTooltip";

const AZURE_COLORS = [
  "#0078D4",
  "#2196F3",
  "#42A5F5",
  "#64B5F6",
  "#90CAF9",
  "#BBDEFB",
];
const CHART_COLORS = {
  stroke: "#0078D4",
  fill: "#0078D4",
  green: "#10b981",
};

/* ── Azure Service Breakdown (like AWS ServiceBreakdownCard) ── */
const AZ_SVC_COLORS = [
  "#0078D4",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#f97316",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
  "#6366f1",
  "#84cc16",
  "#a855f7",
  "#f43f5e",
  "#0ea5e9",
  "#22c55e",
];

const AzureServiceRow = ({ svc, i, topResources, totalCost }) => {
  const [expanded, setExpanded] = React.useState(false);
  const svcResources = (topResources || []).filter(
    (r) => (r.service || "").toLowerCase() === (svc.name || "").toLowerCase(),
  );
  const pct = totalCost > 0 ? (svc.cost / totalCost) * 100 : 0;
  const color = AZ_SVC_COLORS[i % AZ_SVC_COLORS.length];
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
            {formatCurrency(svc.cost)}
          </span>
          {svcResources.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 w-20 text-center">
              {svcResources.length}{" "}
              {svcResources.length === 1 ? "resource" : "resources"}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {expanded && svcResources.length > 0 && (
        <div className="bg-gray-50/70 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800/60 divide-y divide-gray-100 dark:divide-gray-800/60">
          {svcResources.map((r, j) => (
            <div key={j} className="flex items-center gap-3 pl-10 pr-5 py-2">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 flex-1 truncate font-mono">
                {r.name ?? r.id}
              </span>
              {r.resourceGroup && (
                <span className="text-[10px] text-gray-400 shrink-0">
                  {r.resourceGroup}
                </span>
              )}
              <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 shrink-0">
                {formatCurrency(r.cost)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
AzureServiceRow.propTypes = {
  svc: PropTypes.shape({ name: PropTypes.string, cost: PropTypes.number })
    .isRequired,
  i: PropTypes.number.isRequired,
  topResources: PropTypes.array.isRequired,
  totalCost: PropTypes.number.isRequired,
};

const AzureServiceBreakdownCard = ({ services, topResources, totalCost }) => {
  if (!services || services.length === 0) return null;
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="flex items-start justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
        <div>
          <p className="text-xs font-bold text-gray-500 tracking-wider">
            Service Breakdown
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            <span className="font-semibold text-blue-500">
              {services.length} services
            </span>
            {" · "}
            <span className="font-semibold text-gray-600 dark:text-gray-400">
              {topResources.length} tracked resources
            </span>
            {" · "}
            <span className="text-amber-500">
              Click a service to see its resources
            </span>
          </p>
        </div>
      </div>
      <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800/60">
        {services.map((svc, i) => (
          <AzureServiceRow
            key={svc.name}
            svc={svc}
            i={i}
            topResources={topResources}
            totalCost={totalCost}
          />
        ))}
      </div>
    </div>
  );
};
AzureServiceBreakdownCard.propTypes = {
  services: PropTypes.array.isRequired,
  topResources: PropTypes.array.isRequired,
  totalCost: PropTypes.number.isRequired,
};

/* ── Azure Resource Inventory ── */
const AZ_RESOURCE_COLORS = [
  "#0078D4",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#f97316",
  "#06b6d4",
  "#ec4899",
  "#3b82f6",
  "#14b8a6",
  "#84cc16",
  "#a855f7",
  "#f43f5e",
  "#0ea5e9",
  "#22c55e",
];

const AzureResourceBreakdownCard = ({ resources }) => {
  if (!resources || resources.total === 0) return null;
  const { total, active, byType, allResources } = resources;
  const unused = total - (active ?? 0);
  const sorted = [...(byType ?? [])].sort((a, b) => b.count - a.count);
  const [showAll, setShowAll] = React.useState(false);
  const displayResources = allResources
    ? [...allResources].sort((a, b) => b.cost - a.cost)
    : [];
  const visibleResources = showAll
    ? displayResources
    : displayResources.slice(0, 20);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
        <div>
          <p className="text-xs font-bold text-gray-500 tracking-wider">
            Resource Inventory
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            <span className="font-semibold text-blue-500">
              {total.toLocaleString()} total
            </span>
            {active != null && (
              <>
                {" · "}
                <span className="font-semibold text-emerald-500">
                  {active} with spend
                </span>
                {" · "}
                <span className="font-semibold text-amber-500">
                  {unused} unused ($0)
                </span>
              </>
            )}
            {" · "}
            <span className="text-gray-500">
              {sorted.length} resource types
            </span>
          </p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold border border-blue-100 dark:border-blue-800/40">
          Azure RM
        </span>
      </div>
      {/* By-type grid — compact single-row tiles: label on top, count + ring below.
          A ring scales to any digit count without the tile growing taller, unlike a
          full-width bar stacked under the number. */}
      <div className="max-h-[420px] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0 divide-x divide-y divide-gray-200 dark:divide-gray-700 border-b border-gray-100 dark:border-gray-800">
        {sorted.map((t, i) => {
          const pct = total > 0 ? (t.count / total) * 100 : 0;
          const color = AZ_RESOURCE_COLORS[i % AZ_RESOURCE_COLORS.length];
          const radius = 14;
          const circumference = 2 * Math.PI * radius;
          return (
            <div key={t.type} className="px-3 py-2.5 flex items-center gap-2.5">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 truncate leading-tight">
                  {t.type}
                </span>
                <p
                  className="text-base font-bold tabular-nums leading-tight truncate"
                  style={{ color }}
                  title={t.count.toLocaleString()}
                >
                  {t.count.toLocaleString()}
                </p>
              </div>
              <div className="relative w-8 h-8 shrink-0">
                <svg viewBox="0 0 32 32" className="w-8 h-8 -rotate-90">
                  <circle
                    cx="16"
                    cy="16"
                    r={radius}
                    fill="none"
                    strokeWidth="3"
                    className="stroke-gray-100 dark:stroke-gray-800"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - Math.max(pct, 2) / 100)}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-gray-500 dark:text-gray-400">
                  {pct >= 10 ? Math.round(pct) : pct.toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {/* Full resource list — used + unused with cost */}
      {displayResources.length > 0 && (
        <div>
          <div className="px-5 py-2.5 bg-gray-50/60 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-500 tracking-wider">
              All Resources (Used &amp; Unused)
            </p>
            <p className="text-[10px] text-gray-400">
              {displayResources.length} resources total
            </p>
          </div>
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800/60">
            {visibleResources.map((r, i) => (
              <div
                key={r.id || i}
                className="flex items-center gap-3 px-5 py-2.5"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.hasSpend ? "bg-emerald-500" : "bg-gray-300"}`}
                />
                <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 flex-1 truncate">
                  {r.name || r.id?.split("/").pop()}
                </span>
                <span className="text-[10px] text-gray-400 shrink-0 hidden sm:block">
                  {r.type}
                </span>
                <span className="text-[10px] text-gray-400 shrink-0 hidden md:block">
                  {r.resourceGroup}
                </span>
                <span
                  className={`text-[11px] font-bold shrink-0 w-16 text-right ${r.hasSpend ? "text-gray-900 dark:text-white" : "text-gray-400"}`}
                >
                  {r.hasSpend ? formatCurrency(r.cost) : "$0.00"}
                </span>
              </div>
            ))}
          </div>
          {displayResources.length > 20 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="w-full py-2.5 text-[11px] font-semibold text-blue-500 hover:text-blue-600 bg-gray-50/60 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 transition-colors"
            >
              {showAll
                ? "Show less"
                : `Show all ${displayResources.length} resources`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
AzureResourceBreakdownCard.propTypes = {
  resources: PropTypes.shape({
    total: PropTypes.number,
    active: PropTypes.number,
    byType: PropTypes.arrayOf(
      PropTypes.shape({ type: PropTypes.string, count: PropTypes.number }),
    ),
    allResources: PropTypes.array,
  }),
};

/* â"€â"€ Reusable section card â"€â"€ */
const Card = ({ children, className = "", id }) => (
  <div
    id={id}
    className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({
  icon,
  iconBg,
  iconColor = "text-blue-600 dark:text-blue-400",
  title,
  action,
}) => {
  const Icon = icon;
  return (
    <div className="flex items-center justify-between px-6 pt-6 pb-4">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        {title}
      </h3>
      {action}
    </div>
  );
};

/* â"€â"€ KPI card â"€â"€ */
const KpiCard = ({
  title,
  value,
  icon,
  sub,
  subColor,
  accent = "blue",
  onClick,
}) => {
  const Icon = icon;
  const colors = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      icon: "text-blue-600 dark:text-blue-400",
      dot: "bg-blue-500",
      hover: "hover:border-blue-300 dark:hover:border-blue-700",
    },
    green: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      icon: "text-emerald-600 dark:text-emerald-400",
      dot: "bg-emerald-500",
      hover: "hover:border-emerald-300 dark:hover:border-emerald-700",
    },
    brand: {
      bg: "bg-brand-50 dark:bg-brand-950/30",
      icon: "text-brand-600 dark:text-brand-400",
      dot: "bg-brand-500",
      hover: "hover:border-blue-300 dark:hover:border-blue-700",
    },
    gray: {
      bg: "bg-gray-100 dark:bg-gray-800",
      icon: "text-gray-600 dark:text-gray-400",
      dot: "bg-gray-400",
      hover: "hover:border-gray-300 dark:hover:border-gray-600",
    },
  }[accent];

  return (
    <div
      className={`stat-card group !p-4 cursor-pointer transition-all duration-200 ${colors.hover} hover:-translate-y-0.5 hover:shadow-md`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`p-2 rounded-xl group-hover:scale-110 transition-transform duration-300 shrink-0`}
        >
          <Icon className={`w-4 h-4 ${colors.icon}`} />
        </div>
        <MarqueeTitle text={title} className="section-title ml-2" />
      </div>
      <p className="text-xl font-bold text-gray-900 dark:text-white tracking-tight tabular-nums whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
        {value}
      </p>
      <p
        className={`mt-1.5 text-xs font-medium flex items-center gap-1.5 leading-snug ${subColor ?? "text-gray-400"}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
        {sub}
      </p>
      <span className="block mt-2 text-[10px] font-bold text-gray-300 dark:text-gray-600 group-hover:text-gray-400 transition-colors">
        View →
      </span>
    </div>
  );
};

/* â"€â"€ Tooltip styles â"€â"€ */
const tooltipStyle = (isDark) => ({
  contentStyle: {
    backgroundColor: isDark ? "#0f172a" : "#ffffff",
    border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    fontSize: "12px",
    fontWeight: 600,
  },
  itemStyle: { color: CHART_COLORS.stroke },
  cursor: {
    stroke: CHART_COLORS.stroke,
    strokeWidth: 1,
    strokeDasharray: "4 4",
  },
});

/* â"€â"€â"€ helpers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
function fmtResourceType(type) {
  if (!type) return "Unknown";
  return type
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\bVm\b/gi, "VM")
    .replace(/\bSql\b/gi, "SQL")
    .replace(/\bDb\b/gi, "DB")
    .replace(/\bEc2\b/gi, "EC2")
    .replace(/\bEbs\b/gi, "EBS")
    .replace(/\bRds\b/gi, "RDS");
}
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function shortId(id) {
  if (!id) return "";
  const parts = id.split("/");
  const last = parts[parts.length - 1] || id;
  return UUID_RE.test(last) ? "Subscription-wide" : last;
}
function extractAzureService(resourceType, description, action) {
  const rt = (resourceType || "").toLowerCase();
  if (rt && rt !== "subscriptions" && rt !== "unknown")
    return fmtResourceType(resourceType);
  const text = ((description || "") + " " + (action || "")).toLowerCase();
  if (text.includes("virtual machine") || text.includes(" vm "))
    return "Virtual Machines";
  if (
    text.includes("managed disk") ||
    (text.includes("disk") && !text.includes("storage"))
  )
    return "Managed Disks";
  if (text.includes("cosmos")) return "Cosmos DB";
  if (text.includes("redis") || text.includes("cache")) return "Redis Cache";
  if (text.includes("sql") || text.includes("database")) return "SQL Database";
  if (text.includes("app service") || text.includes("web app"))
    return "App Service";
  if (text.includes("kubernetes") || text.includes("aks")) return "Kubernetes";
  if (text.includes("storage")) return "Storage";
  if (text.includes("reserved instance") || text.includes("reservation"))
    return "Reserved Instances";
  return fmtResourceType(resourceType);
}

function azureSvcSavings(name, recs) {
  const n = (name || "").toLowerCase();
  return recs
    .filter((r) => {
      const t = (r.resource_type || "").toLowerCase();
      const desc = (
        (r.description || "") +
        " " +
        (r.action || "")
      ).toLowerCase();
      // Direct resource_type match
      if (
        (t.includes("virtualmachine") || t.includes("vm")) &&
        (n.includes("virtual machine") || n.includes("compute"))
      )
        return true;
      if (t.includes("storage") && n.includes("storage")) return true;
      if (
        (t.includes("sql") || t.includes("database")) &&
        (n.includes("sql") || n.includes("database"))
      )
        return true;
      if (t.includes("redis") && n.includes("redis")) return true;
      if (t.includes("cosmos") && n.includes("cosmos")) return true;
      if (
        t.includes("appservice") &&
        (n.includes("app service") || n.includes("web app"))
      )
        return true;
      // Subscription-level recommendations: match by description keywords
      if (t === "subscriptions" || t === "unknown" || t === "") {
        if (
          desc.includes("virtual machine") &&
          (n.includes("virtual machine") || n.includes("compute"))
        )
          return true;
        if (desc.includes("storage") && n.includes("storage")) return true;
        if (
          (desc.includes("sql") || desc.includes("database")) &&
          (n.includes("sql") || n.includes("database"))
        )
          return true;
        if (desc.includes("managed disk") && n.includes("storage")) return true;
      }
      return false;
    })
    .reduce((s, r) => s + Number(r.estimated_savings || 0), 0);
}
function azurePct(a, b) {
  return !b ? null : ((a - b) / b) * 100;
}
function azurePrevMonth(year, month) {
  const d = new Date(year, month - 2, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/* â"€â"€â"€ AzureInsightItem â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
const AzureInsightItem = ({ title, desc, colorCls, bgCls, children }) => (
  <div className="rounded-2xl p-4 flex flex-col gap-2.5 border border-gray-100 dark:border-gray-800">
    <div className="flex items-start gap-2">
      {children}
      <p className={`text-sm font-bold leading-tight ${colorCls}`}>{title}</p>
    </div>
    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
      {desc}
    </p>
  </div>
);
AzureInsightItem.propTypes = {
  title: PropTypes.string.isRequired,
  desc: PropTypes.string.isRequired,
  colorCls: PropTypes.string.isRequired,
  bgCls: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

/* â"€â"€â"€ AzureInsightsPanel â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
const AzureInsightsPanel = ({
  totalCost,
  forecastTotal,
  services,
  yearlyData,
  nowYear,
  nowMonth,
  budgets,
}) => {
  const prev = azurePrevMonth(nowYear, nowMonth);
  const prevMonth = yearlyData.find(
    (m) => m.year === prev.year && m.month === prev.month,
  );
  const momChange = prevMonth?.totalCost
    ? azurePct(totalCost, prevMonth.totalCost)
    : null;
  const topSvc = services?.[0];
  const topSvcName = topSvc ? topSvc.service || topSvc.name || "" : "";
  const topPct =
    topSvc && totalCost > 0
      ? ((topSvc.cost / totalCost) * 100).toFixed(1)
      : null;
  const fctPctNum =
    forecastTotal && totalCost > 0 ? (totalCost / forecastTotal) * 100 : null;
  const fctHigh = fctPctNum !== null && fctPctNum > 85;
  const mainBudget = budgets?.find((b) => b.amount > 0);
  const budgetPct = mainBudget ? (totalCost / mainBudget.amount) * 100 : null;
  const budgetOver = mainBudget ? totalCost > mainBudget.amount : false;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 pt-6 pb-4">
        <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          Cost Insights
        </h3>
      </div>
      <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {momChange !== null ? (
          <AzureInsightItem
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
          </AzureInsightItem>
        ) : (
          <AzureInsightItem
            title="MoM trend unavailable"
            desc="Fetch 12-month history to compare month-over-month"
            colorCls="text-gray-500 dark:text-gray-400"
            bgCls="bg-gray-50 dark:bg-gray-800/50"
          >
            <Calendar className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          </AzureInsightItem>
        )}
        <AzureInsightItem
          title={topSvc ? topSvcName : "No service data"}
          desc={
            topSvc
              ? `${formatCurrency(topSvc.cost)} Â· ${topPct}% of total spend`
              : "No service breakdown available yet"
          }
          colorCls="text-blue-600 dark:text-blue-400"
          bgCls="bg-blue-50 dark:bg-blue-950/30"
        >
          <Zap className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        </AzureInsightItem>
        <AzureInsightItem
          title={
            forecastTotal
              ? `Forecast: ${formatCurrency(forecastTotal)}`
              : "Forecast N/A"
          }
          desc={
            fctPctNum !== null
              ? `${fctPctNum.toFixed(0)}% of projected spend used — ${fctHigh ? "approaching limit" : "on track"}`
              : "Insufficient data for a forecast projection"
          }
          colorCls={
            fctHigh
              ? "text-amber-600 dark:text-amber-400"
              : "text-emerald-600 dark:text-emerald-400"
          }
          bgCls={
            fctHigh
              ? "bg-amber-50 dark:bg-amber-950/30"
              : "bg-emerald-50 dark:bg-emerald-950/30"
          }
        >
          <TrendingUp
            className={`w-4 h-4 shrink-0 mt-0.5 ${fctHigh ? "text-amber-500" : "text-emerald-500"}`}
          />
        </AzureInsightItem>
        {mainBudget ? (
          <AzureInsightItem
            title={
              budgetOver
                ? `Over by ${formatCurrency(totalCost - mainBudget.amount)}`
                : `${formatCurrency(mainBudget.amount - totalCost)} remaining`
            }
            desc={`${mainBudget.name || "Budget"} Â· ${budgetPct.toFixed(0)}% of ${formatCurrency(mainBudget.amount)} used`}
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
          </AzureInsightItem>
        ) : (
          <AzureInsightItem
            title="No budgets configured"
            desc="Set up Azure budgets to track spend vs your targets"
            colorCls="text-gray-500 dark:text-gray-400"
            bgCls="bg-gray-50 dark:bg-gray-800/50"
          >
            <Target className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          </AzureInsightItem>
        )}
      </div>
    </div>
  );
};
AzureInsightsPanel.propTypes = {
  totalCost: PropTypes.number.isRequired,
  forecastTotal: PropTypes.number,
  services: PropTypes.array.isRequired,
  yearlyData: PropTypes.array.isRequired,
  nowYear: PropTypes.number.isRequired,
  nowMonth: PropTypes.number.isRequired,
  budgets: PropTypes.array.isRequired,
};

/* â"€â"€â"€ AzureTopMovers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
function getAzureMoverStatus(change) {
  if (change === null) return "new";
  return change > 0 ? "up" : "down";
}

const AzureTopMovers = ({
  services,
  yearlyData,
  nowYear,
  nowMonth,
  totalCost,
}) => {
  const prev = azurePrevMonth(nowYear, nowMonth);
  const prevMonth = yearlyData.find(
    (m) => m.year === prev.year && m.month === prev.month,
  );

  const movers = useMemo(
    () =>
      services
        .slice(0, 8)
        .map((svc) => {
          const svcName = svc.service || svc.name || "";
          const prevSvc = prevMonth?.topServices?.find(
            (s) => s.name === svcName,
          );
          const change = prevSvc?.cost
            ? azurePct(svc.cost, prevSvc.cost)
            : null;
          return {
            name: svcName,
            current: svc.cost,
            change,
            pctOfTotal: totalCost > 0 ? (svc.cost / totalCost) * 100 : 0,
          };
        })
        .sort((a, b) => (b.change ?? 0) - (a.change ?? 0)),
    [services, prevMonth, totalCost],
  );

  if (!services.length) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 pt-6 pb-4">
        <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          Cost Movers
        </h3>
      </div>
      {!prevMonth && (
        <div className="px-5 pb-3">
          <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2 rounded-xl">
            Fetch 12-month history to see month-over-month changes per service.
          </p>
        </div>
      )}
      <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {movers.map((m, i) => {
          const status = getAzureMoverStatus(m.change);
          const badgeCls =
            status === "up"
              ? "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400"
              : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400";
          return (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
            >
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                {status === "up" ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : status === "down" ? (
                  <TrendingDown className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Zap className="w-4 h-4 text-blue-500" />
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
                <span
                  className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-lg ${badgeCls}`}
                >
                  {status === "up" ? "+" : ""}
                  {m.change.toFixed(1)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
AzureTopMovers.propTypes = {
  services: PropTypes.array.isRequired,
  yearlyData: PropTypes.array.isRequired,
  nowYear: PropTypes.number.isRequired,
  nowMonth: PropTypes.number.isRequired,
  totalCost: PropTypes.number.isRequired,
};

const AzureCostPage = ({ account, onBack, onSwitchAccount }) => {
  const { rates: mspRates } = useMspRates();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({});
  const [budgets, setBudgets] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [costMetric, setCostMetric] = useState("ActualCost");
  const [reservationRecs, setReservationRecs] = useState([]);
  const [reservationUtilization, setReservationUtilization] = useState([]);
  const [billingMetadata, setBillingMetadata] = useState(null);
  const [ccmRecs, setCcmRecs] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null);
  const [showAllResources, setShowAllResources] = useState(false);
  const [resourceSearch, setResourceSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  // Yearly history
  const [yearlyData, setYearlyData] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null); // null = current MTD
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillProgress, setBackfillProgress] = useState(null); // {stage, month, saved, total, message}
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

  const isDark = document.documentElement.classList.contains("dark");

  const fetchDashboardData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(
        `/azure/full?accountId=${account.id}&metric=${costMetric}&forceRefresh=${force}`,
      );
      const d = res.data;
      setData(d.costs || {});
      setForecast(d.costs?.forecastData || []);
      setBudgets(d.budgets || []);
      setRecommendations(d.recommendations || []);
      setAlerts(d.alerts || []);
      setInvoices(d.invoices || []);
      setReservationRecs(d.reservationRecommendations || []);
      setReservationUtilization(d.reservationUtilization || []);
      setBillingMetadata(d.billingMetadata || null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchYearlyData = async () => {
    try {
      const res = await api.get(`/azure/yearly?accountId=${account.id}`);
      setYearlyData(res.data ?? []);
    } catch {
      /* non-critical */
    }
  };

  const fetchAllAccounts = async () => {
    try {
      const res = await api.get("/azure/summary");
      setAllAccounts(res.data ?? []);
    } catch {
      /* non-critical */
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (account) {
      fetchDashboardData();
      fetchYearlyData();
      fetchAllAccounts();
    }
  }, [account?.id, costMetric]);

  // Fetch Maitsys CSP savings recommendations
  useEffect(() => {
    if (!account?.id) return;
    api
      .get(`/recommendations?account_id=${account.id}&provider=azure`)
      .then((r) => setCcmRecs(r.data?.data ?? []))
      .catch(() => {});
  }, [account?.id]);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const close = () => setAccountMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [accountMenuOpen]);

  const triggerBackfill = () => {
    if (backfillLoading || !account) return;
    setBackfillLoading(true);
    setBackfillProgress({ stage: "fetching", message: "Connecting…" });

    const token = localStorage.getItem("token");
    const url = `${import.meta.env.VITE_API_URL}/azure/backfill?accountId=${account.id}&token=${encodeURIComponent(token ?? "")}`;

    const es = new EventSource(url);

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
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      exportToCSV(
        ["Resource Name", "Resource ID", "Cost (USD)"],
        data.topResources?.map((r) => [r.name, r.id, r.cost.toFixed(2)]) || [],
        `azure_cost_${new Date().toISOString().split("T")[0]}.csv`,
      );
      setExporting(false);
    }, 800);
  };

  const filteredResources = (data.topResources || []).filter(
    (r) =>
      r.name?.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      r.service?.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      r.id?.toLowerCase().includes(resourceSearch.toLowerCase()),
  );

  // Historical month display values
  const histMonth = useMemo(() => {
    if (isCurrentMonth) return null;
    return (
      yearlyData.find(
        (m) => m.year === selectedMonth.year && m.month === selectedMonth.month,
      ) ?? null
    );
  }, [selectedMonth, isCurrentMonth, yearlyData]);

  const displayTotalCost = isCurrentMonth
    ? data.totalCost
    : (histMonth?.totalCost ?? 0);
  const displayDailyCosts = isCurrentMonth
    ? data.dailyCosts
    : (histMonth?.dailyCosts ?? []);

  // Today's spend — null (not 0) when today's row hasn't synced yet, so the UI can
  // show "Syncing…" instead of a misleading $0.00 (Azure usage data can lag by up
  // to ~24h before the current day's row appears in daily_costs).
  const todayCost = useMemo(() => {
    if (!isCurrentMonth) return null;
    const todayStr = new Date().toISOString().slice(0, 10);
    const row = (displayDailyCosts ?? []).find((d) => d.date === todayStr);
    return row ? Number(row.cost ?? row.amount ?? 0) : null;
  }, [displayDailyCosts, isCurrentMonth]);
  const displayServices = isCurrentMonth
    ? data.services || []
    : (histMonth?.topServices ?? []).map((s) => ({
        name: s.name,
        cost: s.cost,
      }));
  const displayResourceGroups = isCurrentMonth
    ? (data.resourceGroups ?? [])
    : (histMonth?.resourceGroups ?? []).map((r) => ({
        name: r.name,
        cost: r.cost,
      }));
  const displayLocations = isCurrentMonth
    ? (data.locations ?? [])
    : (histMonth?.locations ?? []).map((l) => ({ name: l.name, cost: l.cost }));

  // Bar widths in Top Services card — must use displayServices, not data.services
  const maxServiceCost = Math.max(
    ...(displayServices || []).map((s) => s.cost || 0),
    1,
  );

  // Yearly chart data
  const yearlyChartData = useMemo(
    () =>
      last12.map((m, i) => {
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
        const change = prev?.totalCost
          ? ((cost - prev.totalCost) / prev.totalCost) * 100
          : null;
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
      }),
    [yearlyData, selectedMonth, last12, nowYear, nowMonth],
  );

  const yearlyTotal = yearlyChartData.reduce((s, m) => s + m.cost, 0);
  const yearlyAvg = yearlyTotal / 12;
  const yearlyPeak = yearlyChartData.reduce(
    (b, m) => (m.cost > b.cost ? m : b),
    yearlyChartData[0] ?? { label: "—", cost: 0 },
  );

  /* â"€â"€ stacked monthly service chart â"€â"€ */
  const azureStackedKeys = useMemo(() => {
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

  const azureStackedData = useMemo(
    () =>
      last12.map((m) => {
        const hist = yearlyData.find(
          (h) => h.year === m.year && h.month === m.month,
        );
        const row = { label: MONTH_LABELS[m.month - 1], Other: 0 };
        if (hist) {
          let topSum = 0;
          azureStackedKeys.forEach((name) => {
            const svc = hist.topServices?.find((s) => s.name === name);
            row[name] = svc?.cost ?? 0;
            topSum += row[name];
          });
          row.Other = Math.max(0, (hist.totalCost ?? 0) - topSum);
        }
        return row;
      }),
    [yearlyData, last12, azureStackedKeys],
  );

  const _ccmTotalSavings = ccmRecs.reduce(
    (s, r) => s + Number(r.estimated_savings || 0),
    0,
  );
  const mspCspSavings = (data.totalCost ?? 0) * (mspRates.azure ?? 0.07);

  const _resourceSavingsGroups = useMemo(() => {
    if (!ccmRecs.length || !data.topResources?.length) return {};
    // Only attribute savings from recs that target a SPECIFIC resource (not subscription-wide).
    // Subscription-wide recs have a bare UUID as their resource identifier and can't be
    // meaningfully split across individual resources — they're shown in the Savings card above.
    const specificRecs = ccmRecs.filter((r) => {
      const id = r.resource_name || r.resource_id || "";
      const last = id.split("/").pop() || id;
      return last && !UUID_RE.test(last);
    });
    if (!specificRecs.length) return {};
    const groups = {};
    data.topResources.forEach((r) => {
      const svc = r.service || r.name || "";
      if (!(svc in groups)) {
        groups[svc] = {
          savings: azureSvcSavings(svc, specificRecs),
          totalCost: 0,
        };
      }
      groups[svc].totalCost += Number(r.cost || 0);
    });
    return groups;
  }, [data.topResources, ccmRecs]);

  // Click-outside for month/AI dropdowns (must be before early returns)
  React.useEffect(() => {
    const handler = (e) => {
      if (monthDropRef.current && !monthDropRef.current.contains(e.target))
        setMonthDropOpen(false);
      if (aiRef.current && !aiRef.current.contains(e.target)) setAiOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Azure AI insights (must be before early returns)
  const azureAiInsights = useMemo(() => {
    const insights = [];
    const total = data.totalCost ?? 0;
    const svcs = data.services ?? [];
    const prevYM =
      nowMonth === 1
        ? { year: nowYear - 1, month: 12 }
        : { year: nowYear, month: nowMonth - 1 };
    const prevData = yearlyData.find(
      (m) => m.year === prevYM.year && m.month === prevYM.month,
    );
    const prevTotal = prevData?.totalCost ?? 0;
    const momPct =
      prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null;
    if (momPct !== null) {
      const dir = momPct > 0 ? "increased" : "decreased";
      insights.push({
        type: momPct > 15 ? "warning" : momPct < -5 ? "success" : "info",
        title: `Azure spend ${dir} ${Math.abs(momPct).toFixed(1)}% vs last month`,
        detail: `This month: ${formatCurrency(total)} vs ${formatCurrency(prevTotal)} last month. ${momPct > 15 ? "Review service breakdown to identify cost drivers." : momPct < -5 ? "Good cost discipline." : "Relatively stable."}`,
      });
    }
    if (svcs.length > 0) {
      const top = svcs[0];
      const topPct = total > 0 ? ((top.cost / total) * 100).toFixed(1) : 0;
      insights.push({
        type: Number(topPct) > 50 ? "warning" : "info",
        title: `${top.name} is your top Azure cost driver`,
        detail: `${formatCurrency(top.cost)} (${topPct}% of total). ${Number(topPct) > 50 ? "High concentration — consider Azure Reservations." : "Cost distribution looks balanced."}`,
      });
    }
    if (prevData && svcs.length > 1) {
      const growers = svcs
        .map((s) => {
          const p = (prevData.topServices ?? []).find((x) => x.name === s.name);
          return {
            name: s.name,
            val: s.cost,
            change: p?.cost > 0 ? ((s.cost - p.cost) / p.cost) * 100 : null,
          };
        })
        .filter((s) => s.change !== null && s.change > 10)
        .sort((a, b) => b.change - a.change);
      if (growers.length > 0) {
        const g = growers[0];
        insights.push({
          type: "warning",
          title: `${g.name} grew ${g.change.toFixed(1)}% MoM`,
          detail: `Now ${formatCurrency(g.val)}. Fastest-growing Azure service — investigate recent deployments or scaling events.`,
        });
      }
    }
    if (prevData && svcs.length > 1) {
      const reducers = (prevData.topServices ?? [])
        .map((p) => {
          const curr = svcs.find((s) => s.name === p.name);
          const saved = p.cost - (curr?.cost ?? 0);
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
          title: `${r.name} cost reduced ${r.pct.toFixed(1)}%`,
          detail: `Saved ${formatCurrency(r.saved)} vs last month. Likely from right-sizing or Azure Reservation coverage.`,
        });
      }
    }
    if (mspCspSavings > 0) {
      insights.push({
        type: "success",
        title: `Maitsys CSP saves you ${formatCurrency(mspCspSavings)} this month`,
        detail: `7% discount on ${formatCurrency(total)} Azure spend. Annualised: ~${formatCurrency(mspCspSavings * 12)}.`,
      });
    }
    return insights.slice(0, 6);
  }, [data, yearlyData, nowYear, nowMonth, mspCspSavings]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-[3px] border-gray-100 dark:border-gray-800" />
          <div className="absolute inset-0 rounded-full border-t-[3px] border-blue-500 animate-spin" />
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-md w-full text-center bg-white dark:bg-gray-900 rounded-3xl p-10 shadow-card-lg border border-gray-100 dark:border-gray-800">
          <div className="w-14 h-14 bg-red-50 dark:bg-red-950/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Sync Failed
          </h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button onClick={onBack} className="btn-primary mx-auto">
            Return to Overview
          </button>
        </div>
      </div>
    );

  const invoiceList = Array.isArray(invoices) ? invoices : invoices?.data || [];
  // hasData: true if current-month snapshot has data OR a past month is selected with history
  const hasData =
    data.dailyCosts?.length > 0 ||
    data.services?.length > 0 ||
    data.topResources?.length > 0 ||
    (!isCurrentMonth && histMonth !== null);
  // True when the backend returned a snapshot but all cost arrays are empty (genuine $0 billing cycle)
  // Only applies for current month — past months always have data if histMonth exists
  const hasSnapshot = data.currency !== undefined || !isCurrentMonth;
  const isZeroCycle = hasSnapshot && !hasData && isCurrentMonth;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 pb-20">
      {/* â"€â"€ Sticky header â"€â"€ */}
      <div className="bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 xl:px-8 2xl:px-10 py-3 flex justify-between items-center gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onBack} className="btn-ghost p-2 shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="badge badge-blue shrink-0">AZURE</span>
                <h1
                  className="text-base font-bold text-gray-900 dark:text-white truncate"
                  title={account.name}
                >
                  {account.name}
                </h1>
              </div>
              {billingMetadata?.name && (
                <p className="text-[10px] text-gray-400 font-medium tracking-wide mt-0.5 flex items-center gap-1.5 min-w-0">
                  <Box className="w-3 h-3 shrink-0" />
                  <span className="text-blue-500 shrink-0">
                    {/* {billingMetadata.name} */}
                    Detailed insights & resource analysis
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Account Switcher */}
            {allAccounts.length > 1 && onSwitchAccount && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAccountMenuOpen((v) => !v);
                  }}
                  className="btn-secondary text-xs py-2"
                >
                  Switch <ChevronDown className="w-3 h-3" />
                </button>
                {accountMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    {allAccounts.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => {
                          setAccountMenuOpen(false);
                          onSwitchAccount(acc);
                        }}
                        className={`w-full text-left px-4 py-3 text-xs font-semibold transition-colors ${
                          acc.id === account.id
                            ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
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
            {/* Metric toggle — hidden for now */}

            {/* â"€â"€ Month dropdown â"€â"€ */}
            <div className="relative" ref={monthDropRef}>
              <button
                onClick={() => {
                  setMonthDropOpen((v) => !v);
                  setAiOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
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
                    const hd = yearlyData.some(
                      (h) =>
                        h.year === m.year &&
                        h.month === m.month &&
                        h.totalCost > 0,
                    );
                    const isCur = m.year === nowYear && m.month === nowMonth;
                    const isSel = selectedMonth
                      ? selectedMonth.year === m.year &&
                        selectedMonth.month === m.month
                      : isCur;
                    return (
                      <button
                        key={`${m.year}-${m.month}`}
                        disabled={!hd && !isCur}
                        onClick={() => {
                          setSelectedMonth(isCur ? null : m);
                          setMonthDropOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors ${
                          isSel
                            ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                            : hd || isCur
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
                          <span className="text-[9px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md">
                            Month-to-Date
                          </span>
                        )}
                        {isSel && !isCur && (
                          <CheckCircle2 className="w-3 h-3 text-blue-500" />
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
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm ${aiOpen ? "bg-violet-500 border-violet-500 text-white" : "border-violet-300 dark:border-violet-600 bg-white dark:bg-gray-900 text-violet-600 dark:text-violet-400 shadow-[0_0_0_3px_rgba(139,92,246,0.15)] animate-pulse hover:animate-none hover:shadow-[0_0_0_4px_rgba(139,92,246,0.3)]"}`}
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
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-violet-50 dark:bg-violet-950/30">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-500" />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        AI Cost Insights
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                        AZURE
                      </span>
                    </div>
                    <button
                      onClick={() => setAiOpen(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3 space-y-2 max-h-[440px] overflow-y-auto">
                    {azureAiInsights.length === 0 ? (
                      <div className="text-center py-8">
                        <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">
                          Not enough data yet. Fetch history to unlock AI
                          analysis.
                        </p>
                      </div>
                    ) : (
                      azureAiInsights.map((ins, i) => {
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

            <button
              onClick={() => fetchDashboardData(true)}
              className="btn-secondary py-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Sync</span>
            </button>
            {/* Export — hidden for now */}
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
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all duration-150 ${active ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300"}`}
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

      <main className="w-full px-4 sm:px-6 xl:px-8 2xl:px-10 py-6 space-y-6">
        {/* â"€â"€ Past-month banner â"€â"€ */}
        {!isCurrentMonth && (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-in">
          <KpiCard
            title={isCurrentMonth ? "Month-to-Date Total Spend" : "Month Spend"}
            value={formatCurrency(displayTotalCost)}
            icon={DollarSign}
            sub={(() => {
              const prevYM =
                nowMonth === 1
                  ? { year: nowYear - 1, month: 12 }
                  : { year: nowYear, month: nowMonth - 1 };
              const prev = yearlyData.find(
                (m) => m.year === prevYM.year && m.month === prevYM.month,
              );
              const prevTotal = prev?.totalCost ?? 0;
              const total = displayTotalCost ?? 0;
              if (prevTotal > 0) {
                const pct = ((total - prevTotal) / prevTotal) * 100;
                return `${pct > 0 ? "▲" : "▼"} ${Math.abs(pct).toFixed(1)}% vs last month`;
              }
              return `Metric: ${costMetric === "ActualCost" ? "Actual" : "Amortized"}`;
            })()}
            subColor={(() => {
              const prevYM =
                nowMonth === 1
                  ? { year: nowYear - 1, month: 12 }
                  : { year: nowYear, month: nowMonth - 1 };
              const prev = yearlyData.find(
                (m) => m.year === prevYM.year && m.month === prevYM.month,
              );
              const prevTotal = prev?.totalCost ?? 0;
              const total = displayTotalCost ?? 0;
              if (prevTotal > 0) {
                const pct = ((total - prevTotal) / prevTotal) * 100;
                return pct > 0 ? "text-red-500" : "text-emerald-500";
              }
              return undefined;
            })()}
            accent="blue"
            onClick={() => {
              const id =
                activeTab === "operations"
                  ? "ops-az-monthly-spend"
                  : activeTab === "executive"
                    ? "exec-az-annual-trend"
                    : "az-monthly-spend";
              document
                .getElementById(id)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
          <KpiCard
            title="Daily Avg Spend"
            value={
              isCurrentMonth
                ? formatCurrency((displayTotalCost ?? 0) / new Date().getDate())
                : "—"
            }
            icon={Activity}
            sub={
              isCurrentMonth
                ? "Avg cost/day, MTD"
                : "Not tracked for past months"
            }
            accent="gray"
            onClick={() => {
              const id =
                activeTab === "operations"
                  ? "ops-az-monthly-spend"
                  : activeTab === "executive"
                    ? "exec-az-annual-trend"
                    : "az-monthly-spend";
              document
                .getElementById(id)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
          <KpiCard
            title="Today's Spend"
            value={
              !isCurrentMonth
                ? "—"
                : todayCost != null
                  ? formatCurrency(todayCost)
                  : "Syncing…"
            }
            icon={CalendarClock}
            sub={
              isCurrentMonth
                ? "Actual cost recorded today"
                : "Not tracked for past months"
            }
            accent="blue"
            onClick={() => {
              const id =
                activeTab === "operations"
                  ? "ops-az-monthly-spend"
                  : activeTab === "executive"
                    ? "exec-az-annual-trend"
                    : "az-monthly-spend";
              document
                .getElementById(id)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
          <KpiCard
            title="Forecast"
            value={isCurrentMonth ? formatCurrency(data.forecast) : "—"}
            icon={TrendingUp}
            sub={
              isCurrentMonth
                ? "Statistical month-end projection"
                : "Past months have no forecast"
            }
            accent="green"
            onClick={() => {
              const id =
                activeTab === "operations"
                  ? "ops-az-monthly-spend"
                  : activeTab === "executive"
                    ? "exec-az-annual-trend"
                    : "az-annual-trend";
              document
                .getElementById(id)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
          <KpiCard
            title="Maitsys CSP Savings"
            value={mspCspSavings > 0 ? formatCurrency(mspCspSavings) : "—"}
            icon={TrendingDown}
            sub={
              mspCspSavings > 0
                ? `${((mspRates.azure ?? 0.07) * 100).toFixed(1)}% MSP pricing advantage`
                : "No spend data"
            }
            accent="green"
            onClick={() => {
              const id =
                activeTab === "executive"
                  ? "exec-az-csp-savings"
                  : "az-csp-savings";
              document
                .getElementById(id)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        </div>

        {/* ── Backfill progress banner ── */}
        {(backfillLoading || backfillProgress?.stage === "error") && (
          <div
            className={`border rounded-2xl px-5 py-4 ${
              backfillProgress?.stage === "error"
                ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              {backfillProgress?.stage === "error" ? (
                <span className="text-red-500 text-base">✕</span>
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin shrink-0" />
              )}
              <p
                className={`text-sm font-bold ${
                  backfillProgress?.stage === "error"
                    ? "text-red-700 dark:text-red-300"
                    : "text-blue-800 dark:text-blue-300"
                }`}
              >
                {backfillProgress?.stage === "fetching" &&
                  (backfillProgress.message ??
                    "Fetching cost data from Azure…")}
                {backfillProgress?.stage === "saving" &&
                  `Saving ${backfillProgress.month}… (${backfillProgress.saved}/${backfillProgress.total})`}
                {backfillProgress?.stage === "done" &&
                  (backfillProgress.total === 0
                    ? "All months already up to date"
                    : `Done — ${backfillProgress.saved} month(s) saved`)}
                {backfillProgress?.stage === "error" &&
                  `Error: ${backfillProgress.message}`}
                {!backfillProgress && "Connecting…"}
              </p>
            </div>
            {backfillProgress?.stage === "saving" &&
              backfillProgress.total > 0 && (
                <div className="w-full bg-blue-100 dark:bg-blue-900/40 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.round((backfillProgress.saved / backfillProgress.total) * 100)}%`,
                    }}
                  />
                </div>
              )}
            {backfillProgress?.stage === "fetching" && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Azure fetches one month at a time — this takes 3–4 minutes for
                missing months.
              </p>
            )}
          </div>
        )}

        {/* â"€â"€ Executive Tab â"€â"€ */}
        {/* ── Technical Tab ── */}
        {activeTab === "technical" && (
          <div className="space-y-6">
            {/* Day-over-day cost attribution — "yesterday $X, today $Y, what changed?" */}
            {account && (
              <>
                <DailyCostHistoryTabs
                  provider="azure"
                  accountId={account.id}
                  currency={data?.currency}
                  dailyTotals={displayDailyCosts}
                />
              </>
            )}

            {/* Monthly Spend by Service */}
            <div
              id="az-monthly-spend"
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden"
            >
              <div className="flex items-center gap-2.5 px-6 pt-6 pb-4">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Monthly Spend by Service
                </h3>
              </div>
              {yearlyData.length === 0 ? (
                <div className="px-6 pb-6 flex flex-col items-center justify-center gap-4 min-h-[220px] text-center">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-500" />
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
                      className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-md shadow-indigo-500/20"
                    >
                      Fetch 12-Month History
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      <div className="w-4 h-4 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin" />
                      Fetching…
                    </div>
                  )}
                </div>
              ) : azureStackedKeys.length === 0 ? (
                <div className="px-6 pb-6 flex items-center justify-center min-h-[220px] text-sm text-gray-400 font-semibold">
                  No service breakdown available
                </div>
              ) : (
                <div className="px-5 pb-5">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={azureStackedData}
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
                        <RechartsTooltip
                          formatter={(v, n) => [formatCurrency(v), n]}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        />
                        {azureStackedKeys.map((name, i) => (
                          <Bar
                            key={name}
                            dataKey={name}
                            stackId="s"
                            fill={AZURE_COLORS[i % AZURE_COLORS.length]}
                            radius={
                              i === azureStackedKeys.length - 1
                                ? [4, 4, 0, 0]
                                : [0, 0, 0, 0]
                            }
                            animationDuration={600}
                          />
                        ))}
                        {azureStackedData.some((d) => d.Other > 0) && (
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
                    {azureStackedKeys.map((name, i) => {
                      const short = name
                        .replace(/^Microsoft\./i, "")
                        .replace(/\s*\/.*$/, "")
                        .trim()
                        .slice(0, 18);
                      return (
                        <div
                          key={name}
                          className="flex items-center gap-1.5 min-w-0"
                          title={name}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{
                              backgroundColor:
                                AZURE_COLORS[i % AZURE_COLORS.length],
                            }}
                          />
                          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 truncate">
                            {short}
                          </span>
                        </div>
                      );
                    })}
                    {azureStackedData.some((d) => d.Other > 0) && (
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
            </div>

            {/* Annual Cost Trend */}
            <div
              id="az-annual-trend"
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden"
            >
              <div className="flex items-center gap-2.5 px-6 pt-6 pb-4">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Annual Cost Trend — {nowYear}
                </h3>
              </div>
              {yearlyData.length === 0 ? (
                <div className="px-6 pb-6 flex flex-col items-center justify-center gap-3 min-h-[220px] text-center">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    No annual data yet
                  </p>
                  <p className="text-xs text-gray-400">
                    Click &quot;Fetch 12-Month History&quot; to load data
                  </p>
                </div>
              ) : (
                <div className="px-6 pb-6">
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
                        <RechartsTooltip
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
                              fill={entry.isSel ? "#0078D4" : "#90CAF9"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div
                    className="flex mt-2 pb-1"
                    style={{ paddingLeft: 44, paddingRight: 4 }}
                  >
                    {yearlyChartData.map((m, i) => {
                      if (m.change === null || i === 0)
                        return (
                          <div
                            key={i}
                            className="flex-1 min-w-0 text-center py-1 rounded-lg bg-gray-50 dark:bg-gray-800 mx-px"
                          >
                            <p className="text-[10px] text-gray-300 dark:text-gray-600">
                              —
                            </p>
                          </div>
                        );
                      const up = m.change > 0;
                      return (
                        <div
                          key={i}
                          className={`flex-1 min-w-0 text-center py-1 rounded-lg mx-px ${up ? "bg-red-50 dark:bg-red-950/30" : "bg-emerald-50 dark:bg-emerald-950/30"}`}
                        >
                          <p
                            className={`text-[10px] font-bold flex items-center gap-0.5 justify-center ${up ? "text-red-500" : "text-emerald-500"}`}
                          >
                            {up ? (
                              <TrendingUp className="w-2.5 h-2.5" />
                            ) : (
                              <TrendingDown className="w-2.5 h-2.5" />
                            )}
                            {Math.abs(m.change).toFixed(0)}%
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {hasData ? (
              <>
                {/* Row 1: Temporal Spend + Service Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <Card className="lg:col-span-2">
                    <CardHeader
                      icon={Activity}
                      title="Temporal Spend Analysis"
                      iconBg="bg-blue-50 dark:bg-blue-950/30"
                      iconColor="text-blue-600 dark:text-blue-400"
                    />
                    <div className="px-6 pb-6 h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={displayDailyCosts}>
                          <defs>
                            <linearGradient
                              id="azureGrad"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor={CHART_COLORS.stroke}
                                stopOpacity={0.15}
                              />
                              <stop
                                offset="95%"
                                stopColor={CHART_COLORS.stroke}
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke={isDark ? "#1e293b" : "#f1f5f9"}
                          />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatDateShort}
                            dy={8}
                            tick={{ fontSize: 10, fill: "#94a3b8" }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `$${v}`}
                            dx={-8}
                            tick={{ fontSize: 10, fill: "#94a3b8" }}
                          />
                          <RechartsTooltip {...tooltipStyle(isDark)} />
                          <Area
                            type="monotone"
                            dataKey="cost"
                            stroke={CHART_COLORS.stroke}
                            strokeWidth={2}
                            fill="url(#azureGrad)"
                            animationDuration={1200}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <Card className="lg:col-span-1">
                    <CardHeader
                      icon={Database}
                      title="Service Distribution"
                      iconBg="bg-blue-50 dark:bg-blue-950/30"
                      iconColor="text-blue-600 dark:text-blue-400"
                    />
                    <div className="px-6 pb-6">
                      <div className="relative h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={displayServices}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="cost"
                              stroke="none"
                            >
                              {displayServices?.map((_, i) => (
                                <Cell
                                  key={i}
                                  fill={AZURE_COLORS[i % AZURE_COLORS.length]}
                                  cornerRadius={3}
                                />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              contentStyle={{
                                borderRadius: "10px",
                                fontSize: 11,
                                border: "1px solid #e2e8f0",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="section-title mb-0.5">Total</span>
                          <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                            {formatCurrency(displayTotalCost, "")}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2.5">
                        {displayServices?.slice(0, 5).map((s, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{
                                  backgroundColor:
                                    AZURE_COLORS[i % AZURE_COLORS.length],
                                }}
                              />
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                                {s.service || s.name}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-gray-900 dark:text-white shrink-0">
                              {formatCurrency(s.cost)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Cost Insights */}
                <AzureInsightsPanel
                  totalCost={displayTotalCost ?? 0}
                  forecastTotal={
                    isCurrentMonth ? (data.forecast ?? null) : null
                  }
                  services={displayServices}
                  yearlyData={yearlyData}
                  nowYear={isCurrentMonth ? nowYear : selectedMonth.year}
                  nowMonth={isCurrentMonth ? nowMonth : selectedMonth.month}
                  budgets={isCurrentMonth ? budgets : []}
                />

                {/* Top Services + Resource Groups + By Region */}
                <div
                  id="az-top-services"
                  className="grid grid-cols-1 lg:grid-cols-3 gap-5"
                >
                  <Card className="lg:col-span-1">
                    <CardHeader
                      icon={TrendingUp}
                      title="Top Services"
                      iconBg="bg-blue-50 dark:bg-blue-950/30"
                      iconColor="text-blue-600 dark:text-blue-400"
                    />
                    <div className="px-6 pb-6 space-y-3">
                      {(displayServices || []).slice(0, 6).map((s, i) => {
                        const svcName = s.service || s.name || "";
                        const savings = azureSvcSavings(svcName, ccmRecs);
                        return (
                          <div key={i}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                                {svcName}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-bold text-gray-900 dark:text-white">
                                  {formatCurrency(s.cost)}
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
                                  width: `${(s.cost / maxServiceCost) * 100}%`,
                                  backgroundColor:
                                    AZURE_COLORS[i % AZURE_COLORS.length],
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      {!displayServices?.length && (
                        <p className="text-xs text-gray-400 text-center py-4">
                          No service data
                        </p>
                      )}
                      {ccmRecs.length > 0 && displayServices?.length > 0 && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                          Green amounts show Maitsys CSP savings potential per
                          service
                        </p>
                      )}
                    </div>
                  </Card>
                  <Card>
                    <CardHeader
                      icon={Box}
                      title="By Resource Group"
                      iconBg="bg-purple-50 dark:bg-purple-950/30"
                      iconColor="text-purple-600 dark:text-purple-400"
                    />
                    <div className="px-6 pb-6 divide-y divide-gray-50 dark:divide-gray-800">
                      {displayResourceGroups.slice(0, 6).map((rg, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center py-2.5"
                        >
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate max-w-[160px]">
                            {rg.name}
                          </span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {formatCurrency(rg.cost)}
                          </span>
                        </div>
                      ))}
                      {!displayResourceGroups.length && (
                        <p className="text-xs text-gray-400 text-center py-4">
                          No data
                        </p>
                      )}
                    </div>
                  </Card>
                  <Card>
                    <CardHeader
                      icon={Activity}
                      title="By Region"
                      iconBg="bg-indigo-50 dark:bg-indigo-950/30"
                      iconColor="text-indigo-600 dark:text-indigo-400"
                    />
                    <div className="px-6 pb-6 divide-y divide-gray-50 dark:divide-gray-800">
                      {displayLocations.slice(0, 6).map((loc, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center py-2.5"
                        >
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate max-w-[160px]">
                            {loc.name}
                          </span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {formatCurrency(loc.cost)}
                          </span>
                        </div>
                      ))}
                      {!displayLocations.length && (
                        <p className="text-xs text-gray-400 text-center py-4">
                          No data
                        </p>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Maitsys CSP Savings */}
                {ccmRecs.length > 0 && (
                  <Card id="az-csp-savings">
                    <CardHeader
                      icon={TrendingDown}
                      title="Maitsys CSP Savings Opportunities"
                      iconBg="bg-emerald-50 dark:bg-emerald-950/30"
                      iconColor="text-emerald-600 dark:text-emerald-400"
                    />
                    <div className="px-6 pb-6">
                      <div className="flex items-center gap-3 mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl shrink-0">
                          <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                            Maitsys CSP pricing saves you{" "}
                            {formatCurrency(mspCspSavings)} / month
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            {((mspRates.azure ?? 0.07) * 100).toFixed(1)}% MSP
                            pricing advantage applied to your total Azure spend
                            of {formatCurrency(data.totalCost ?? 0)}
                          </p>
                        </div>
                        <span className="shrink-0 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl">
                          7% off
                        </span>
                      </div>
                      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                        {ccmRecs.slice(0, 20).map((r, i) => {
                          const savings = Number(r.estimated_savings ?? 0);
                          const currentCost = Number(
                            r.current_monthly_cost ?? 0,
                          );
                          const afterCost = Math.max(0, currentCost - savings);
                          const serviceName = extractAzureService(
                            r.resource_type,
                            r.description,
                            r.action,
                          );
                          const resourceLabel = shortId(
                            r.resource_name || r.resource_id,
                          );
                          const isSubWide =
                            resourceLabel === "Subscription-wide";
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
                                    {serviceName}
                                  </span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                                    Azure Advisor
                                  </span>
                                  {isSubWide && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                      Subscription-wide
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-relaxed line-clamp-2">
                                  {r.description ||
                                    r.action ||
                                    "Optimise resource"}
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
                                {!isSubWide && (
                                  <p className="text-[10px] text-gray-400 font-mono mt-1 truncate">
                                    {resourceLabel}
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

                {/* Cost Movers */}
                {displayServices.length > 0 && (
                  <AzureTopMovers
                    services={displayServices}
                    yearlyData={yearlyData}
                    nowYear={isCurrentMonth ? nowYear : selectedMonth.year}
                    nowMonth={isCurrentMonth ? nowMonth : selectedMonth.month}
                    totalCost={displayTotalCost ?? 0}
                  />
                )}

                {/* Resource Allocation table */}
                <Card>
                  <CardHeader
                    icon={Database}
                    title="Resource Allocation"
                    iconBg="bg-gray-100 dark:bg-gray-800"
                    iconColor="text-gray-600 dark:text-gray-400"
                    action={
                      <button
                        onClick={() => setShowAllResources(true)}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View All
                      </button>
                    }
                  />
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-gray-50 dark:border-gray-800">
                          <th className="section-title px-6 py-3">#</th>
                          <th className="section-title px-6 py-3">Resource</th>
                          <th className="section-title px-6 py-3 text-right">
                            Month-to-Date Spend
                          </th>
                          <th className="section-title px-6 py-3 text-right text-emerald-600 dark:text-emerald-400">
                            CSP Savings (7%)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                        {!isCurrentMonth ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-6 py-8 text-center text-xs text-gray-400"
                            >
                              Individual resource breakdown is not stored for
                              past months.
                              <br />
                              <span className="text-gray-300">
                                Switch to current month to view live resource
                                data.
                              </span>
                            </td>
                          </tr>
                        ) : (
                          (data.topResources || []).slice(0, 8).map((r, i) => {
                            const resSavings =
                              Number(r.cost) * (mspRates.azure ?? 0.07);
                            return (
                              <tr
                                key={i}
                                className="group hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors"
                              >
                                <td className="px-6 py-3 text-xs font-bold text-gray-300 dark:text-gray-600">
                                  {String(i + 1).padStart(2, "0")}
                                </td>
                                <td className="px-6 py-3">
                                  <p
                                    className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate max-w-xs group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                                    title={r.name}
                                  >
                                    {r.name}
                                  </p>
                                  {r.service && (
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                      {r.service}
                                    </p>
                                  )}
                                </td>
                                <td className="px-6 py-3 text-right font-bold text-gray-900 dark:text-white tabular-nums">
                                  {formatCurrency(r.cost)}
                                </td>
                                <td className="px-6 py-3 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                  {resSavings > 0
                                    ? `-${formatCurrency(resSavings)}`
                                    : "—"}
                                </td>
                              </tr>
                            );
                          })
                        )}
                        {isCurrentMonth && !data.topResources?.length && (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-6 py-8 text-center text-xs text-gray-400"
                            >
                              No resource data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Forecast chart */}
                {isCurrentMonth && forecast.length > 0 && (
                  <Card>
                    <CardHeader
                      icon={TrendingUp}
                      title="Cost Forecast"
                      iconBg="bg-emerald-50 dark:bg-emerald-950/30"
                      iconColor="text-emerald-600 dark:text-emerald-400"
                    />
                    <div className="px-6 pb-6 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={forecast}>
                          <defs>
                            <linearGradient
                              id="forecastGrad"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor={CHART_COLORS.green}
                                stopOpacity={0.12}
                              />
                              <stop
                                offset="95%"
                                stopColor={CHART_COLORS.green}
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke={isDark ? "#1e293b" : "#f1f5f9"}
                          />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatDateShort}
                            dy={8}
                            tick={{ fontSize: 10, fill: "#94a3b8" }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `$${v}`}
                            dx={-8}
                            tick={{ fontSize: 10, fill: "#94a3b8" }}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              borderRadius: "10px",
                              fontSize: 11,
                            }}
                            cursor={{
                              stroke: CHART_COLORS.green,
                              strokeWidth: 1,
                              strokeDasharray: "4 4",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="cost"
                            name="Projected"
                            stroke={CHART_COLORS.green}
                            strokeWidth={2}
                            fill="url(#forecastGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}

                {/* Reservation Utilization */}
                {reservationUtilization.length > 0 && (
                  <Card>
                    <CardHeader
                      icon={Activity}
                      title="Reservation Utilization (Daily)"
                      iconBg="bg-emerald-50 dark:bg-emerald-950/30"
                      iconColor="text-emerald-600 dark:text-emerald-400"
                    />
                    <div className="px-6 pb-6 h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={reservationUtilization}>
                          <defs>
                            <linearGradient
                              id="utilGrad"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor={CHART_COLORS.green}
                                stopOpacity={0.12}
                              />
                              <stop
                                offset="95%"
                                stopColor={CHART_COLORS.green}
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke={isDark ? "#1e293b" : "#f1f5f9"}
                          />
                          <XAxis
                            dataKey="usageDate"
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(d) =>
                              new Date(d).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })
                            }
                            dy={8}
                            tick={{ fontSize: 10, fill: "#94a3b8" }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `${v}%`}
                            dx={-8}
                            tick={{ fontSize: 10, fill: "#94a3b8" }}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              borderRadius: "10px",
                              fontSize: 11,
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="utilizationPercentage"
                            name="Utilization (%)"
                            stroke={CHART_COLORS.green}
                            strokeWidth={2}
                            fill="url(#utilGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}

                {/* Budgets */}
                {budgets.length > 0 && (
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                      <CheckCircle className="w-4 h-4 text-blue-500" /> Budget
                      Limits
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {budgets.map((b, i) => {
                        const pct = Math.min(
                          (b.currentSpend?.amount / b.amount) * 100,
                          100,
                        );
                        const over = b.currentSpend?.amount > b.amount;
                        const warn = pct >= 80;
                        return (
                          <Card key={i} className="p-5">
                            <div className="flex justify-between items-start mb-3">
                              <div
                                className={`p-2 rounded-xl ${over ? "bg-red-50 dark:bg-red-950/30" : warn ? "bg-orange-50 dark:bg-orange-950/30" : "bg-blue-50 dark:bg-blue-950/30"}`}
                              >
                                <CheckCircle
                                  className={`w-4 h-4 ${over ? "text-red-500" : warn ? "text-orange-500" : "text-blue-500"}`}
                                />
                              </div>
                              <span
                                className={`badge ${over ? "badge-red" : warn ? "badge-orange" : "badge-blue"}`}
                              >
                                {pct.toFixed(0)}%
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 truncate">
                              {b.name}
                            </h4>
                            <div className="flex justify-between text-xs text-gray-500 mb-2">
                              <span>
                                Spent:{" "}
                                <strong className="text-gray-900 dark:text-white">
                                  {formatCurrency(b.currentSpend?.amount)}
                                </strong>
                              </span>
                              <span>
                                Cap:{" "}
                                <strong className="text-gray-900 dark:text-white">
                                  {formatCurrency(b.amount)}
                                </strong>
                              </span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${over ? "bg-red-500" : warn ? "bg-orange-500" : "bg-blue-500"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recommendations + Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <Card>
                    <CardHeader
                      icon={Lightbulb}
                      title="Advisor Recommendations"
                      iconBg="bg-amber-50 dark:bg-amber-950/30"
                      iconColor="text-amber-600 dark:text-amber-400"
                    />
                    <div className="px-6 pb-6">
                      {recommendations.length > 0 ? (
                        <div className="space-y-3">
                          {recommendations.slice(0, 5).map((rec, i) => {
                            const savings =
                              rec.extendedProperties?.savingsAmount ||
                              rec.extendedProperties?.annualSavingsAmount;
                            const term =
                              rec.extendedProperties?.term === "P1Y"
                                ? "1 Year"
                                : rec.extendedProperties?.term === "P3Y"
                                  ? "3 Years"
                                  : rec.extendedProperties?.term;
                            return (
                              <div
                                key={i}
                                onClick={() => setSelectedRec(rec)}
                                className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50 cursor-pointer hover:border-amber-200 dark:hover:border-amber-800 transition-colors group"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-7 h-7 flex items-center justify-center shrink-0 mt-0.5">
                                    <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-amber-600 transition-colors">
                                      {rec.shortDescription?.problem ||
                                        "Cost Saving Opportunity"}
                                    </p>
                                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                                      {rec.shortDescription?.solution ||
                                        rec.extendedProperties
                                          ?.recommendationMessage ||
                                        ""}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {savings && (
                                        <span className="badge badge-green">
                                          Save {formatCurrency(savings)}/yr
                                        </span>
                                      )}
                                      {term && (
                                        <span className="badge badge-blue">
                                          {term} Reserved
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3 py-8 text-center">
                          <div className="w-10 h-10 flex items-center justify-center">
                            <Lightbulb className="w-5 h-5 text-amber-400" />
                          </div>
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            No recommendations
                          </p>
                          <p className="text-xs text-gray-400">
                            Azure Advisor found no active suggestions
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card>
                    <CardHeader
                      icon={Bell}
                      title="Budget Alerts"
                      iconBg="bg-red-50 dark:bg-red-950/30"
                      iconColor="text-red-600 dark:text-red-400"
                    />
                    <div className="px-6 pb-6">
                      {alerts.length > 0 ? (
                        <div className="space-y-3">
                          {alerts.slice(0, 5).map((alert, i) => (
                            <div
                              key={i}
                              className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40"
                            >
                              <div className="flex items-start gap-3">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                    {alert.name || "Budget Alert"}
                                  </p>
                                  <p className="text-[11px] text-gray-500 mt-0.5">
                                    {alert.description ||
                                      "Spending threshold reached"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3 py-8 text-center">
                          <div className="w-10 h-10 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          </div>
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            No active alerts
                          </p>
                          <p className="text-xs text-gray-400">
                            All spend thresholds are within limits
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Invoices */}
                {invoiceList.length > 0 && (
                  <Card>
                    <CardHeader
                      icon={FileText}
                      title="Recent Invoices"
                      iconBg="bg-gray-100 dark:bg-gray-800"
                      iconColor="text-gray-600 dark:text-gray-400"
                    />
                    <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {invoiceList.slice(0, 6).map((inv, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800"
                        >
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                            {inv.billingPeriod ||
                              formatMonthYear(inv.invoiceDate)}
                          </p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white mt-1 tabular-nums">
                            {formatCurrency(inv.totalAmount?.amount)}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-[10px] text-gray-400">
                              {inv.name}
                            </p>
                            {inv.downloadUrl && (
                              <a
                                href={inv.downloadUrl}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" /> Download
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            ) : isZeroCycle ? (
              <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  No Billable Activity
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Azure reported no billed costs for this subscription this
                  billing cycle.
                </p>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-gray-400">
                No technical data available yet.
              </div>
            )}
          </div>
        )}

        {/* ── Operations Tab ── */}
        {activeTab === "operations" && (
          <div className="space-y-6">
            {/* Monthly Spend by Service */}
            <div
              id="ops-az-monthly-spend"
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden"
            >
              <div className="flex items-center gap-2.5 px-6 pt-6 pb-4">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Monthly Spend by Service
                </h3>
              </div>
              {yearlyData.length === 0 ? (
                <div className="px-6 pb-6 flex flex-col items-center justify-center gap-4 min-h-[220px] text-center">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-500" />
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
                      className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-md shadow-indigo-500/20"
                    >
                      Fetch 12-Month History
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      <div className="w-4 h-4 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin" />
                      Fetching…
                    </div>
                  )}
                </div>
              ) : azureStackedKeys.length === 0 ? (
                <div className="px-6 pb-6 flex items-center justify-center min-h-[220px] text-sm text-gray-400 font-semibold">
                  No service breakdown available
                </div>
              ) : (
                <div className="px-5 pb-5">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={azureStackedData}
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
                        <RechartsTooltip
                          formatter={(v, n) => [formatCurrency(v), n]}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        />
                        {azureStackedKeys.map((name, i) => (
                          <Bar
                            key={name}
                            dataKey={name}
                            stackId="s"
                            fill={AZURE_COLORS[i % AZURE_COLORS.length]}
                            radius={
                              i === azureStackedKeys.length - 1
                                ? [4, 4, 0, 0]
                                : [0, 0, 0, 0]
                            }
                            animationDuration={600}
                          />
                        ))}
                        {azureStackedData.some((d) => d.Other > 0) && (
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
                    {azureStackedKeys.map((name, i) => {
                      const short = name
                        .replace(/^Microsoft\./i, "")
                        .replace(/\s*\/.*$/, "")
                        .trim()
                        .slice(0, 18);
                      return (
                        <div
                          key={name}
                          className="flex items-center gap-1.5 min-w-0"
                          title={name}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{
                              backgroundColor:
                                AZURE_COLORS[i % AZURE_COLORS.length],
                            }}
                          />
                          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 truncate">
                            {short}
                          </span>
                        </div>
                      );
                    })}
                    {azureStackedData.some((d) => d.Other > 0) && (
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
            </div>

            {/* Daily Cost History — reused from Technical tab */}
            {account && (
              <DailyCostHistoryTabs
                provider="azure"
                accountId={account.id}
                currency={data?.currency}
                dailyTotals={displayDailyCosts}
              />
            )}

            {/* Cost Insights */}
            {hasData && (
              <AzureInsightsPanel
                totalCost={displayTotalCost ?? 0}
                forecastTotal={isCurrentMonth ? (data.forecast ?? null) : null}
                services={displayServices}
                yearlyData={yearlyData}
                nowYear={isCurrentMonth ? nowYear : selectedMonth.year}
                nowMonth={isCurrentMonth ? nowMonth : selectedMonth.month}
                budgets={isCurrentMonth ? budgets : []}
              />
            )}

            {/* Top Services + Resource Groups + By Region */}
            {hasData && (
              <div
                id="ops-az-top-services"
                className="grid grid-cols-1 lg:grid-cols-3 gap-5"
              >
                <Card className="lg:col-span-1">
                  <CardHeader
                    icon={TrendingUp}
                    title="Top Services"
                    iconBg="bg-blue-50 dark:bg-blue-950/30"
                    iconColor="text-blue-600 dark:text-blue-400"
                  />
                  <div className="px-6 pb-6 space-y-3">
                    {(displayServices || []).slice(0, 6).map((s, i) => {
                      const svcName = s.service || s.name || "";
                      const savings = azureSvcSavings(svcName, ccmRecs);
                      return (
                        <div key={i}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                              {svcName}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-bold text-gray-900 dark:text-white">
                                {formatCurrency(s.cost)}
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
                                width: `${(s.cost / maxServiceCost) * 100}%`,
                                backgroundColor:
                                  AZURE_COLORS[i % AZURE_COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {!displayServices?.length && (
                      <p className="text-xs text-gray-400 text-center py-4">
                        No service data
                      </p>
                    )}
                  </div>
                </Card>
                <Card>
                  <CardHeader
                    icon={Box}
                    title="By Resource Group"
                    iconBg="bg-purple-50 dark:bg-purple-950/30"
                    iconColor="text-purple-600 dark:text-purple-400"
                  />
                  <div className="px-6 pb-6 divide-y divide-gray-50 dark:divide-gray-800">
                    {displayResourceGroups.slice(0, 6).map((rg, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center py-2.5"
                      >
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate max-w-[160px]">
                          {rg.name}
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {formatCurrency(rg.cost)}
                        </span>
                      </div>
                    ))}
                    {!displayResourceGroups.length && (
                      <p className="text-xs text-gray-400 text-center py-4">
                        No data
                      </p>
                    )}
                  </div>
                </Card>
                <Card>
                  <CardHeader
                    icon={Activity}
                    title="By Region"
                    iconBg="bg-indigo-50 dark:bg-indigo-950/30"
                    iconColor="text-indigo-600 dark:text-indigo-400"
                  />
                  <div className="px-6 pb-6 divide-y divide-gray-50 dark:divide-gray-800">
                    {displayLocations.slice(0, 6).map((loc, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center py-2.5"
                      >
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate max-w-[160px]">
                          {loc.name}
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {formatCurrency(loc.cost)}
                        </span>
                      </div>
                    ))}
                    {!displayLocations.length && (
                      <p className="text-xs text-gray-400 text-center py-4">
                        No data
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* Cost Movers */}
            {hasData && displayServices.length > 0 && (
              <AzureTopMovers
                services={displayServices}
                yearlyData={yearlyData}
                nowYear={isCurrentMonth ? nowYear : selectedMonth.year}
                nowMonth={isCurrentMonth ? nowMonth : selectedMonth.month}
                totalCost={displayTotalCost ?? 0}
              />
            )}

            {/* Budgets */}
            {hasData && budgets.length > 0 && (
              <div id="ops-az-budgets">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <CheckCircle className="w-4 h-4 text-blue-500" /> Budget
                  Limits
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {budgets.map((b, i) => {
                    const pct = Math.min(
                      (b.currentSpend?.amount / b.amount) * 100,
                      100,
                    );
                    const over = b.currentSpend?.amount > b.amount;
                    const warn = pct >= 80;
                    return (
                      <Card key={i} className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div
                            className={`p-2 rounded-xl ${over ? "bg-red-50 dark:bg-red-950/30" : warn ? "bg-orange-50 dark:bg-orange-950/30" : "bg-blue-50 dark:bg-blue-950/30"}`}
                          >
                            <CheckCircle
                              className={`w-4 h-4 ${over ? "text-red-500" : warn ? "text-orange-500" : "text-blue-500"}`}
                            />
                          </div>
                          <span
                            className={`badge ${over ? "badge-red" : warn ? "badge-orange" : "badge-blue"}`}
                          >
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 truncate">
                          {b.name}
                        </h4>
                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                          <span>
                            Spent:{" "}
                            <strong className="text-gray-900 dark:text-white">
                              {formatCurrency(b.currentSpend?.amount)}
                            </strong>
                          </span>
                          <span>
                            Cap:{" "}
                            <strong className="text-gray-900 dark:text-white">
                              {formatCurrency(b.amount)}
                            </strong>
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${over ? "bg-red-500" : warn ? "bg-orange-500" : "bg-blue-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {!hasData && (
              <div className="py-12 text-center text-sm text-gray-400">
                No data available yet.
              </div>
            )}
          </div>
        )}

        {/* ── Executive Tab ── */}
        {activeTab === "executive" &&
          (() => {
            const execTotal = data.totalCost ?? 0;
            const execForecast = isCurrentMonth ? (data.forecast ?? 0) : 0;
            const prevYM =
              nowMonth === 1
                ? { year: nowYear - 1, month: 12 }
                : { year: nowYear, month: nowMonth - 1 };
            const execPrev = yearlyData.find(
              (m) => m.year === prevYM.year && m.month === prevYM.month,
            );
            const execPrevTotal = execPrev?.totalCost ?? 0;
            const execMomPct =
              execPrevTotal > 0
                ? ((execTotal - execPrevTotal) / execPrevTotal) * 100
                : null;
            const execTotalSavings = mspCspSavings;
            const execSavingsPct =
              execTotal > 0
                ? (execTotalSavings / (execTotal + execTotalSavings)) * 100
                : 0;
            const execServices = data.services ?? [];
            const execTopSvc = execServices[0];

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
            if (mspCspSavings > 0)
              attentionItems.push({
                icon: "🟢",
                label: `Maitsys CSP saves ${formatCurrency(mspCspSavings)}/mo (7% off)`,
                color: "text-emerald-600",
              });
            if (
              execTopSvc &&
              execTotal > 0 &&
              execTopSvc.cost / execTotal > 0.5
            )
              attentionItems.push({
                icon: "🟡",
                label: `${execTopSvc.name} is ${((execTopSvc.cost / execTotal) * 100).toFixed(0)}% of spend — concentration risk`,
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
                      label: "Enabled Services",
                      value: (displayServices?.length ?? 0).toLocaleString(),
                      sub: `${data.topResources?.length ?? 0} cost-tracked resources`,
                      accent: "#0078D4",
                      subColor: "text-gray-400",
                      tooltip:
                        "Azure services with billing charges this month (from Cost Management API).",
                    },
                    {
                      label: "Total Resources",
                      value: data.resources?.total
                        ? data.resources.total.toLocaleString()
                        : (data.topResources?.length ?? 0).toLocaleString(),
                      sub: data.resources?.total
                        ? `${data.resources.active ?? 0} active · ${data.resources.total - (data.resources.active ?? 0)} unused`
                        : "Cost-tracked resources only",
                      accent: "#f59e0b",
                      subColor: "text-gray-400",
                      tooltip:
                        "All resources in your subscription via Azure Resource Manager. Green = has spend this month. Gray = $0 (unused/deallocated).",
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
                      sub: "Maitsys CSP (7%)",
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
                      <p
                        className={`text-[10px] font-medium leading-tight ${subColor}`}
                      >
                        {sub}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Service Breakdown — expandable resources per service */}
                <AzureServiceBreakdownCard
                  services={displayServices ?? []}
                  topResources={data.topResources ?? []}
                  totalCost={data.totalCost ?? 0}
                />

                {/* Resource Inventory — Azure RM resource counts by type */}
                <AzureResourceBreakdownCard resources={data.resources} />

                {/* Row 2 — Financial Snapshot */}
                <div
                  id="exec-az-annual-trend"
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
                            ? MONTH_LABELS[prevYM.month - 1]
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
                        value: formatCurrency(mspCspSavings * nowMonth),
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
                          <RechartsTooltip
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
                                fill={entry.isSel ? "#0078D4" : "#90CAF9"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Row 3 — AI Executive Summary */}
                {azureAiInsights.length > 0 && (
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
                          {azureAiInsights.length} insights
                        </span>
                      </div>
                      <span className="text-gray-400 text-xs">
                        {execSummaryOpen ? "▲" : "▼"}
                      </span>
                    </button>
                    {execSummaryOpen && (
                      <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {azureAiInsights.map((ins, i) => (
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

                {/* Top Resources */}
                {data.topResources?.length > 0 && (
                  <div
                    id="az-top-resources"
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
                  >
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                          Top Resources by Cost
                        </p>
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full">
                          {data.topResources.length} resources
                        </span>
                      </div>
                    </div>
                    <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                          <tr className="text-[10px] font-semibold text-gray-500 dark:text-gray-500 dark:text-gray-400 tracking-wider border-b border-gray-100 dark:border-gray-800">
                            <th className="text-left px-5 py-3">#</th>
                            <th className="text-left px-5 py-3">Resource</th>
                            <th className="text-left px-5 py-3">Service</th>
                            <th className="text-right px-5 py-3">Cost</th>
                            <th className="text-right px-5 py-3">
                              CSP Savings (7%)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.topResources.map((r, i) => (
                            <tr
                              key={i}
                              className="border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 transition-colors"
                            >
                              <td className="px-5 py-3 text-xs text-gray-400 font-bold">
                                {i + 1}
                              </td>
                              <td className="px-5 py-3">
                                <p
                                  className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[200px]"
                                  title={r.name}
                                >
                                  {r.name}
                                </p>
                                {r.id && (
                                  <p
                                    className="text-[10px] text-gray-400 truncate max-w-[200px]"
                                    title={r.id}
                                  >
                                    {r.id}
                                  </p>
                                )}
                              </td>
                              <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">
                                {r.service ?? "—"}
                              </td>
                              <td className="px-5 py-3 text-right text-xs font-bold text-gray-900 dark:text-white tabular-nums">
                                {formatCurrency(r.cost)}
                              </td>
                              <td className="px-5 py-3 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                {r.cost > 0
                                  ? `-${formatCurrency(r.cost * (mspRates.azure ?? 0.07))}`
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Service Category Summary */}
                {data.services?.length > 0 && (
                  <ServiceCategoryCard
                    services={data.services}
                    provider="azure"
                    currency={data.currency ?? "USD"}
                  />
                )}

                {/* Row 4 — Top 5 Cost Drivers + Attention Center */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div
                    id="exec-az-top-services"
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
                                ? ((svc.cost / execTotal) * 100).toFixed(1)
                                : "0.0";
                            return (
                              <tr
                                key={i}
                                className="border-b border-gray-50 dark:border-gray-800/50 last:border-0"
                              >
                                <td className="py-2.5 pr-2 text-xs text-gray-400 font-bold">
                                  {i + 1}
                                </td>
                                <td
                                  className="py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[120px]"
                                  title={svc.name}
                                >
                                  {svc.name}
                                </td>
                                <td className="py-2.5 text-right text-xs font-bold text-gray-900 dark:text-white tabular-nums">
                                  {formatCurrency(svc.cost)}
                                </td>
                                <td className="py-2.5 text-right">
                                  <span
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                                    style={{
                                      backgroundColor: `${AZURE_COLORS[i % AZURE_COLORS.length]}22`,
                                      color:
                                        AZURE_COLORS[i % AZURE_COLORS.length],
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
                    {mspCspSavings > 0 && (
                      <div
                        id="exec-az-csp-savings"
                        className="mt-4 flex items-center gap-3 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800"
                      >
                        <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            Maitsys CSP — {formatCurrency(mspCspSavings)}/mo
                            saved
                          </p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            {((mspRates.azure ?? 0.07) * 100).toFixed(1)}%
                            pricing advantage on Azure spend
                          </p>
                        </div>
                        <span className="shrink-0 px-2 py-1 border border-emerald-400 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg">
                          7% off
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {!hasData && !isZeroCycle && isCurrentMonth && (
                  <div className="py-12 text-center text-sm text-gray-400">
                    No data available yet — sync from Azure to load cost data.
                  </div>
                )}
              </div>
            );
          })()}

        {/* â"€â"€ Empty state placeholders (all tabs, no data) â"€â"€ */}
        {!hasData && !isZeroCycle && !isCurrentMonth && (
          <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
            <Box className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              No History for {MONTH_LABELS[selectedMonth?.month - 1]}{" "}
              {selectedMonth?.year}
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Historical data for this month has not been stored yet.
            </p>
            <button
              onClick={() => setSelectedMonth(null)}
              className="btn-secondary mt-5 mx-auto"
            >
              Back to Current Month
            </button>
          </div>
        )}
      </main>

      {/* â"€â"€ Recommendation detail modal â"€â"€ */}
      {selectedRec && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedRec(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-card-lg border border-gray-100 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-start gap-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
                <Lightbulb className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {selectedRec.shortDescription?.problem || "Recommendation"}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedRec.impact} Impact Â· {selectedRec.category}
                </p>
              </div>
              <button
                onClick={() => setSelectedRec(null)}
                className="btn-ghost p-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="section-title mb-2">Solution</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {selectedRec.shortDescription?.solution}
                </p>
              </div>
              {selectedRec.extendedProperties && (
                <div>
                  <p className="section-title mb-3">Key Properties</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedRec.extendedProperties).map(
                      ([k, v]) => (
                        <div
                          key={k}
                          className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800"
                        >
                          <p className="section-title mb-0.5">
                            {k.replace(/([A-Z])/g, " $1").trim()}
                          </p>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white break-all">
                            {v}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                onClick={() => setSelectedRec(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â"€â"€ All resources modal â"€â"€ */}
      {showAllResources && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowAllResources(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-card-lg border border-gray-100 dark:border-gray-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                <Box className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Resource Inventory
                </h2>
                <p className="text-xs text-gray-400">
                  {filteredResources.length} resources found
                </p>
              </div>
              <button
                onClick={() => setShowAllResources(false)}
                className="btn-ghost p-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, service, or IDâ€¦"
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm border border-gray-100 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="section-title px-6 py-3">Resource</th>
                    <th className="section-title px-6 py-3">Service</th>
                    <th className="section-title px-6 py-3 text-right">
                      Month-to-Date Spend
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {filteredResources.map((r, i) => (
                    <tr
                      key={i}
                      className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p
                          className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-xs"
                          title={r.name}
                        >
                          {r.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate max-w-xs">
                          {r.id}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge badge-gray">{r.service}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-sm text-gray-900 dark:text-white tabular-nums">
                        {formatCurrency(r.cost)}
                      </td>
                    </tr>
                  ))}
                  {!filteredResources.length && (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-6 py-12 text-center text-sm text-gray-400"
                      >
                        <Search className="w-8 h-8 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
                        No resources match your search
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                onClick={() => setShowAllResources(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AzureCostPage;
