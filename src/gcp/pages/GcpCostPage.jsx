import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
} from "recharts";
import {
  RefreshCw,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Server,
  MapPin,
  Layers,
  AlertTriangle,
  CheckCircle2,
  BarChart2,
  Sparkles,
  X,
  Target,
  Activity,
  Zap,
  Lightbulb,
  AlertCircle,
  ChevronDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";
import PropTypes from "prop-types";
import { getGcpCosts } from "../../api/gcpApi";
import { GcpAccountContext } from "../context/GcpAccountContext";
import { formatCurrency } from "../../utils/formatters";
import { useMspRates } from "../../hooks/useMspRates";

const GCP_PRIMARY = "#3b82f6";
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

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function pct(a, b) {
  if (!b || b === 0) return null;
  return ((a - b) / b) * 100;
}

/* ─── reusable UI ──────────────────────────────────────────────────────────── */
function GcpBadge() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M17.6 11.8c0-.1 0-.2-.1-.3l-2.1-3.6c-.1-.2-.3-.3-.5-.3H9.1c-.2 0-.4.1-.5.3L6.5 11.5c-.1.1-.1.2-.1.3s0 .2.1.3l2.1 3.6c.1.2.3.3.5.3h5.8c.2 0 .4-.1.5-.3l2.1-3.6c.1-.1.1-.2.1-.3z"
        fill={GCP_PRIMARY}
      />
      <circle cx="12" cy="12" r="2.2" fill="white" />
      <circle cx="12" cy="12" r="1" fill={GCP_PRIMARY} />
    </svg>
  );
}

function Sk({ w = "w-full", h = "h-4" }) {
  return <div className={`skeleton rounded-lg ${w} ${h}`} />;
}
Sk.propTypes = { w: PropTypes.string, h: PropTypes.string };

function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-lg">
      <p className="text-xs font-bold text-gray-500 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
          {p.name && (
            <span className="text-gray-400 font-normal mr-1">{p.name}:</span>
          )}
          {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}
CurrencyTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
};

const KpiCard = ({
  title,
  value,
  icon,
  sub,
  subColor,
  accent = "gray",
  onClick,
}) => {
  const accents = {
    gcp: "text-blue-600 dark:text-blue-400",
    gray: "text-gray-500 dark:text-gray-400",
    green: "text-emerald-600 dark:text-emerald-400",
    blue: "text-blue-600 dark:text-blue-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
  };
  const hoverBorders = {
    gcp: "hover:border-blue-300 dark:hover:border-blue-700",
    gray: "hover:border-gray-300 dark:hover:border-gray-600",
    green: "hover:border-emerald-300 dark:hover:border-emerald-700",
    blue: "hover:border-blue-300 dark:hover:border-blue-700",
    indigo: "hover:border-indigo-300 dark:hover:border-indigo-700",
  };
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 transition-all duration-200 hover:-translate-y-1 relative overflow-hidden group ${hoverBorders[accent]} ${onClick ? "cursor-pointer" : ""}`}
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
      }}
    >
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
      <p
        className={`text-xs font-semibold leading-snug ${subColor ?? "text-gray-400"}`}
      >
        {sub}
      </p>
    </div>
  );
};
KpiCard.propTypes = {
  title: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  icon: PropTypes.node,
  sub: PropTypes.string,
  subColor: PropTypes.string,
  accent: PropTypes.string,
  onClick: PropTypes.func,
};

const Card = ({ title, icon, children, className = "", id, action }) => (
  <div
    className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden ${className}`}
    id={id}
    style={{
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
    }}
  >
    <div className="px-3 py-3 sm:px-5 sm:py-4 lg:px-6 lg:py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
          {icon}
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>
      {action}
    </div>
    {children}
  </div>
);
Card.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
  id: PropTypes.string,
  action: PropTypes.node,
};

function EmptyData({ title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
      <BarChart2 className="w-8 h-8 text-gray-200 dark:text-gray-700" />
      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        {title}
      </p>
      {sub && <p className="text-xs text-gray-400 max-w-xs">{sub}</p>}
    </div>
  );
}
EmptyData.propTypes = { title: PropTypes.string, sub: PropTypes.string };

/* ─── AI Insights ──────────────────────────────────────────────────────────── */
function buildAiInsights({ totalCost, services, forecastData, currency }) {
  const insights = [];
  const top = services?.[0];
  if (top && totalCost > 0) {
    const topPct = ((top.cost / totalCost) * 100).toFixed(1);
    insights.push({
      type: Number(topPct) > 50 ? "warning" : "info",
      title: `${top.name} is your top cost driver`,
      detail: `${formatCurrency(top.cost, currency)} (${topPct}% of total GCP spend this month). ${Number(topPct) > 50 ? "High concentration — consider Reserved commitments or Committed Use Discounts." : "Normal distribution."}`,
    });
  }
  if (forecastData?.length) {
    const eom = forecastData[0]?.projected_cost;
    if (eom && totalCost > 0) {
      const ratio = eom / totalCost;
      if (ratio > 1.5) {
        insights.push({
          type: "warning",
          title: `Forecast ${formatCurrency(eom, currency)} is ${((ratio - 1) * 100).toFixed(0)}% above MTD`,
          detail: `End-of-month projected spend is significantly higher than current. Review recent resource launches or scaling events.`,
        });
      } else {
        insights.push({
          type: "info",
          title: `End-of-month forecast: ${formatCurrency(eom, currency)}`,
          detail: `Current MTD is ${formatCurrency(totalCost, currency)} (${((totalCost / eom) * 100).toFixed(0)}% of forecast). Spend is on track.`,
        });
      }
    }
  }
  if (services?.length > 1) {
    const top3Sum = services.slice(0, 3).reduce((s, sv) => s + sv.cost, 0);
    const top3Pct =
      totalCost > 0 ? ((top3Sum / totalCost) * 100).toFixed(0) : 0;
    insights.push({
      type: Number(top3Pct) > 80 ? "warning" : "info",
      title: `Top 3 services account for ${top3Pct}% of spend`,
      detail: `${services
        .slice(0, 3)
        .map((s) => s.name)
        .join(
          ", ",
        )} drive most of your GCP cost. ${Number(top3Pct) > 80 ? "Diversify or optimise these to reduce concentration risk." : "Cost distribution is healthy."}`,
    });
  }
  const mspSavings = totalCost * (mspRates.gcp ?? 0.02);
  if (mspSavings > 0) {
    insights.push({
      type: "success",
      title: `Maitsys CSP saves you ${formatCurrency(mspSavings, currency)} this month`,
      detail: `3.5% discount on ${formatCurrency(totalCost, currency)} GCP spend. Annualised: ~${formatCurrency(mspSavings * 12, currency)}.`,
    });
  }
  if (totalCost === 0) {
    insights.push({
      type: "info",
      title: "No spend data yet",
      detail: "Sync the account to pull cost data from GCP Cloud Billing.",
    });
  }
  return insights.slice(0, 5);
}

/* ─── Main component ───────────────────────────────────────────────────────── */
const TABS = [
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
];

const GcpCostPage = () => {
  const { rates: mspRates } = useMspRates();
  const { accountId } = useParams();
  const navigate = useNavigate();
  const { getAccount } = useContext(GcpAccountContext);
  const account = getAccount(accountId);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("executive");
  const [aiOpen, setAiOpen] = useState(false);
  const aiRef = useRef(null);

  const loadData = useCallback(
    async (forceRefresh = false) => {
      try {
        if (forceRefresh) setSyncing(true);
        else setLoading(true);
        setError("");
        const res = await getGcpCosts(accountId, forceRefresh);
        setData(res.data);
      } catch (err) {
        setError(err?.response?.data?.error ?? "Failed to load GCP cost data");
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    },
    [accountId],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handler = (e) => {
      if (aiRef.current && !aiRef.current.contains(e.target)) setAiOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const totalCost = data?.totalCost ?? 0;
  const currency = data?.currency ?? "USD";
  const dailyCosts = data?.dailyCosts ?? [];
  const services = data?.services ?? [];
  const projects = data?.projects ?? [];
  const locations = data?.locations ?? [];
  const forecastData = data?.forecastData ?? [];
  const resourceTypes = data?.resourceTypes ?? [];

  const topServices = useMemo(() => services.slice(0, 8), [services]);
  const pieData = useMemo(
    () =>
      topServices
        .slice(0, 6)
        .map((s, i) => ({
          name: s.name,
          value: s.cost,
          color: GCP_COLORS[i % GCP_COLORS.length],
        })),
    [topServices],
  );
  const eomForecast = useMemo(
    () => forecastData[0]?.projected_cost ?? null,
    [forecastData],
  );
  const mspSavings = totalCost * (mspRates.gcp ?? 0.02);
  const dailyAvg = useMemo(
    () => (dailyCosts.length ? totalCost / dailyCosts.length : 0),
    [dailyCosts, totalCost],
  );

  const aiInsights = useMemo(
    () => buildAiInsights({ totalCost, services, forecastData, currency }),
    [totalCost, services, forecastData, currency],
  );

  /* executive attention items */
  const attentionItems = useMemo(() => {
    const items = [];
    if (eomForecast && eomForecast > totalCost * 1.4)
      items.push({
        dot: "red",
        label: `Forecast ${formatCurrency(eomForecast, currency)} — high end-of-month risk`,
        color: "text-red-600",
      });
    if (mspSavings > 0)
      items.push({
        dot: "green",
        label: `Maitsys CSP saves ${formatCurrency(mspSavings, currency)}/mo (3.5% off)`,
        color: "text-emerald-600",
      });
    if (services[0] && totalCost > 0 && services[0].cost / totalCost > 0.5)
      items.push({
        dot: "yellow",
        label: `${services[0].name} is ${((services[0].cost / totalCost) * 100).toFixed(0)}% of spend — concentration risk`,
        color: "text-amber-600",
      });
    if (items.length === 0)
      items.push({
        dot: "green",
        label: "All metrics within normal range",
        color: "text-emerald-600",
      });
    return items;
  }, [eomForecast, totalCost, mspSavings, services, currency]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-[3px] border-gray-200 dark:border-gray-800" />
            <div className="absolute inset-0 rounded-full border-t-[3px] border-blue-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <GcpBadge />
            </div>
          </div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
            Loading GCP data…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 pb-20">
      {/* ── Sticky header ── */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 xl:px-8 2xl:px-10 py-3 flex flex-wrap justify-between items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              onClick={() => navigate("/gcp")}
              className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-blue-600 hover:border-blue-200 dark:hover:border-blue-800 transition-all active:scale-95 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold tracking-wider rounded-lg shrink-0">
                  GCP
                </span>
                <h1
                  className="text-base font-bold text-gray-900 dark:text-white truncate"
                  title={account?.name}
                >
                  {account?.name ?? "GCP Project"}
                </h1>
              </div>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">
                Detailed insights & resource analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* AI Insights */}
            <div className="relative" ref={aiRef}>
              <button
                onClick={() => setAiOpen((v) => !v)}
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
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-violet-50 dark:bg-violet-950/30">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-500" />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        AI Cost Insights
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400">
                        GCP
                      </span>
                    </div>
                    <button
                      onClick={() => setAiOpen(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3 space-y-2 max-h-[440px] overflow-y-auto">
                    {aiInsights.map((ins, i) => {
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
                    })}
                  </div>
                  <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-[10px] text-gray-400 font-medium">
                      Based on current month-to-date data · Auto-generated
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sync */}
            <button
              onClick={() => loadData(true)}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">
                {syncing ? "Syncing…" : "Sync"}
              </span>
            </button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 sm:px-6 lg:px-8">
          <div className="w-full px-4 sm:px-6 xl:px-8 2xl:px-10 flex gap-0">
            {TABS.map((t) => {
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

      <main className="w-full px-4 sm:px-6 xl:px-8 2xl:px-10 py-3 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-xl text-red-600 dark:text-red-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-300">
                Sync error
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* ── KPI row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 space-y-2"
              >
                <Sk h="h-4" w="w-1/2" />
                <Sk h="h-6" />
              </div>
            ))
          ) : (
            <>
              <KpiCard
                title="Month-to-date spend"
                value={formatCurrency(totalCost, currency)}
                icon={<DollarSign className="w-4 h-4" />}
                sub="Total GCP cost this month"
                accent="gcp"
              />
              <KpiCard
                title="EOM forecast"
                value={
                  eomForecast != null
                    ? formatCurrency(eomForecast, currency)
                    : "—"
                }
                icon={<TrendingUp className="w-4 h-4" />}
                sub="End-of-month projection"
                accent="gray"
              />
              <KpiCard
                title="Daily average"
                value={formatCurrency(dailyAvg, currency)}
                icon={<Calendar className="w-4 h-4" />}
                sub="Avg per day (MTD)"
                accent="blue"
              />
              <KpiCard
                title="Top service"
                value={services[0]?.name ?? "N/A"}
                icon={<Layers className="w-4 h-4" />}
                sub={
                  services[0]
                    ? formatCurrency(services[0].cost, currency)
                    : "No data"
                }
                accent="indigo"
              />
              <KpiCard
                title="Maitsys CSP savings"
                value={
                  mspSavings > 0 ? formatCurrency(mspSavings, currency) : "—"
                }
                icon={<TrendingDown className="w-4 h-4" />}
                sub={`${((mspRates.gcp ?? 0.02) * 100).toFixed(1)}% MSP pricing advantage`}
                accent="green"
              />
            </>
          )}
        </div>

        {/* ════════ EXECUTIVE TAB ════════ */}
        {activeTab === "executive" && (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Executive summary */}
            <Card
              title="Executive summary"
              icon={<Target className="w-4 h-4" />}
            >
              <div className="p-3 sm:p-5 lg:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* KPIs */}
                <div className="space-y-4">
                  <p className="section-title">Cost at a glance</p>
                  {[
                    {
                      label: "MTD spend",
                      val: formatCurrency(totalCost, currency),
                    },
                    {
                      label: "EOM forecast",
                      val: eomForecast
                        ? formatCurrency(eomForecast, currency)
                        : "—",
                    },
                    {
                      label: "CSP savings",
                      val:
                        mspSavings > 0
                          ? formatCurrency(mspSavings, currency)
                          : "—",
                      color: "text-emerald-600",
                    },
                  ].map(({ label, val, color }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800"
                    >
                      <span className="text-xs text-gray-500 font-semibold">
                        {label}
                      </span>
                      <span
                        className={`text-sm font-bold ${color ?? "text-gray-900 dark:text-white"}`}
                      >
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Attention items */}
                <div className="space-y-3">
                  <p className="section-title">Attention items</p>
                  {attentionItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.dot === "red" ? "bg-red-500" : item.dot === "yellow" ? "bg-amber-400" : "bg-emerald-500"}`}
                      />
                      <span
                        className={`text-xs font-semibold leading-relaxed ${item.color}`}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Top services */}
                <div className="space-y-3">
                  <p className="section-title">Top services</p>
                  {services.slice(0, 4).length > 0 ? (
                    services.slice(0, 4).map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              background: GCP_COLORS[i % GCP_COLORS.length],
                            }}
                          />
                          <span className="text-xs text-gray-700 dark:text-gray-300 truncate font-medium">
                            {s.name}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white ml-2 shrink-0">
                          {formatCurrency(s.cost, currency)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400">
                      No data — sync to populate
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Top services pie */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5 lg:gap-6">
              <Card
                title="Service cost distribution"
                icon={<Zap className="w-4 h-4" />}
              >
                {pieData.length > 0 ? (
                  <div className="p-3 sm:p-5 lg:p-6">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={72}
                          dataKey="value"
                          paddingAngle={3}
                        >
                          {pieData.map((d, i) => (
                            <Cell key={i} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v) => formatCurrency(v, currency)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                      {pieData.map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ background: d.color }}
                          />
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {d.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyData
                    title="No service data"
                    sub="Sync the account to see distribution."
                  />
                )}
              </Card>

              {/* CSP Savings */}
              <Card
                title="Maitsys CSP savings"
                icon={<TrendingDown className="w-4 h-4" />}
                id="exec-csp-savings"
              >
                <div className="p-3 sm:p-5 lg:p-6 space-y-3 sm:space-y-5">
                  {[
                    { label: "CSP discount rate", val: `${((mspRates.gcp ?? 0.02) * 100).toFixed(1)}%` },
                    {
                      label: "Monthly savings",
                      val:
                        mspSavings > 0
                          ? formatCurrency(mspSavings, currency)
                          : "—",
                      color: "text-emerald-600",
                    },
                    {
                      label: "Annual projection",
                      val:
                        mspSavings > 0
                          ? formatCurrency(mspSavings * 12, currency)
                          : "—",
                      color: "text-emerald-600",
                    },
                    {
                      label: "Based on MTD spend",
                      val: formatCurrency(totalCost, currency),
                    },
                  ].map(({ label, val, color }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800"
                    >
                      <span className="text-xs text-gray-500 font-semibold">
                        {label}
                      </span>
                      <span
                        className={`text-sm font-bold ${color ?? "text-gray-900 dark:text-white"}`}
                      >
                        {val}
                      </span>
                    </div>
                  ))}
                  <div className="mt-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                      Maitsys CSP pricing gives you 3.5% off list price on all
                      GCP services every month.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ════════ OPERATIONS TAB ════════ */}
        {activeTab === "operations" && (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Service breakdown bar chart */}
            <Card
              title="Service cost breakdown"
              icon={<BarChart2 className="w-4 h-4" />}
            >
              {services.length > 0 ? (
                <div className="p-3 sm:p-5 lg:p-6">
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(260, services.slice(0, 10).length * 38)}
                  >
                    <BarChart
                      data={services
                        .slice(0, 10)
                        .map((s) => ({
                          name:
                            s.name?.length > 24
                              ? s.name.slice(0, 24) + "…"
                              : s.name,
                          cost: s.cost,
                        }))}
                      layout="vertical"
                      margin={{ top: 4, right: 70, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(148,163,184,0.15)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{
                          fontSize: 10,
                          fill: "#94a3b8",
                          fontWeight: 600,
                        }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) =>
                          `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                        }
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={150}
                        tick={{
                          fontSize: 11,
                          fill: "#475569",
                          fontWeight: 600,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CurrencyTooltip />} />
                      <Bar dataKey="cost" name="cost" radius={[0, 6, 6, 0]}>
                        {services.slice(0, 10).map((_, i) => (
                          <Cell
                            key={i}
                            fill={GCP_COLORS[i % GCP_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyData
                  title="No service data"
                  sub="Sync to load service breakdown."
                />
              )}
            </Card>

            {/* Services full table */}
            {services.length > 0 && (
              <Card
                title={`All services (${services.length})`}
                icon={<Layers className="w-4 h-4" />}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                          #
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                          Service
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-right text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                          MTD cost
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-right text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                          Share
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 hidden md:table-cell"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {services.map((s, i) => (
                        <tr
                          key={i}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-3 py-2 sm:px-6 sm:py-3 text-xs text-gray-400">
                            {i + 1}
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{
                                  background: GCP_COLORS[i % GCP_COLORS.length],
                                }}
                              />
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {s.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-3 text-right text-sm font-bold text-gray-900 dark:text-white">
                            {formatCurrency(s.cost, currency)}
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-3 text-right text-xs text-gray-400 font-semibold">
                            {(s.percent ?? 0).toFixed(1)}%
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-3 hidden md:table-cell">
                            <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(s.percent ?? 0, 100)}%`,
                                  background: GCP_COLORS[i % GCP_COLORS.length],
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <Card
                title={`Projects (${projects.length})`}
                icon={<Server className="w-4 h-4" />}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                          Project
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-right text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                          MTD cost
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-right text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                          Share
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {projects.slice(0, 15).map((p, i) => (
                        <tr
                          key={i}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-3 py-2 sm:px-6 sm:py-3 text-sm font-semibold text-gray-900 dark:text-white">
                            {p.name}
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-3 text-right text-sm font-bold text-gray-900 dark:text-white">
                            {formatCurrency(p.cost, currency)}
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-3 text-right text-xs text-gray-400 font-semibold">
                            {totalCost > 0
                              ? `${((p.cost / totalCost) * 100).toFixed(1)}%`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ════════ TECHNICAL TAB ════════ */}
        {activeTab === "technical" && (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Daily cost trend */}
            <Card
              title="Daily cost trend"
              icon={<Activity className="w-4 h-4" />}
              id="gcp-daily-trend"
            >
              {dailyCosts.length > 0 ? (
                <div className="p-3 sm:p-5 lg:p-6">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart
                      data={dailyCosts}
                      margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="gcpDailyGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={GCP_PRIMARY}
                            stopOpacity={0.18}
                          />
                          <stop
                            offset="95%"
                            stopColor={GCP_PRIMARY}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(148,163,184,0.15)"
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        fontSize={10}
                        fontWeight="600"
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => v?.slice(5)}
                        interval="preserveStartEnd"
                        dy={8}
                      />
                      <YAxis
                        width={44}
                        stroke="#94a3b8"
                        fontSize={10}
                        fontWeight="600"
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) =>
                          `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                        }
                        dx={-4}
                      />
                      <Tooltip content={<CurrencyTooltip />} />
                      {dailyAvg > 0 && (
                        <ReferenceLine
                          y={dailyAvg}
                          stroke="#94a3b8"
                          strokeDasharray="4 4"
                          label={{
                            value: "avg",
                            fill: "#94a3b8",
                            fontSize: 10,
                          }}
                        />
                      )}
                      <Area
                        type="monotone"
                        dataKey="cost"
                        name="Cost"
                        stroke={GCP_PRIMARY}
                        strokeWidth={2.5}
                        fill="url(#gcpDailyGrad)"
                        dot={false}
                        activeDot={{ r: 4, fill: GCP_PRIMARY }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyData
                  title="No daily data"
                  sub="Sync the account to populate daily cost trends."
                />
              )}
            </Card>

            {/* Locations */}
            {locations.length > 0 && (
              <Card
                title={`Regions & zones (${locations.length})`}
                icon={<MapPin className="w-4 h-4" />}
                id="gcp-region"
              >
                <div className="p-3 sm:p-5 lg:p-6 space-y-3">
                  {locations.slice(0, 12).map((l, i) => {
                    const pctVal =
                      totalCost > 0 ? (l.cost / totalCost) * 100 : 0;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-blue-400" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                              {l.name}
                            </span>
                            <span className="text-xs font-bold text-gray-900 dark:text-white ml-2 shrink-0">
                              {formatCurrency(l.cost, currency)}
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-400"
                              style={{ width: `${Math.min(pctVal, 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 w-9 text-right shrink-0">
                          {pctVal.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Resource types */}
            {resourceTypes.length > 0 && (
              <Card
                title={`Resource types (${resourceTypes.length})`}
                icon={<Layers className="w-4 h-4" />}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                          Resource type
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-right text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                          MTD cost
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-right text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                          Share
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {resourceTypes.slice(0, 15).map((r, i) => (
                        <tr
                          key={i}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-3 py-2 sm:px-6 sm:py-3 text-sm font-semibold text-gray-900 dark:text-white">
                            {r.name}
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-3 text-right text-sm font-bold text-gray-900 dark:text-white">
                            {formatCurrency(r.cost, currency)}
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-3 text-right text-xs text-gray-400 font-semibold">
                            {totalCost > 0
                              ? `${((r.cost / totalCost) * 100).toFixed(1)}%`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* 3-month forecast */}
            {forecastData.length > 0 && (
              <Card
                title="3-month cost forecast"
                icon={<TrendingUp className="w-4 h-4" />}
                action={
                  eomForecast != null && (
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-900/40">
                      EOM: {formatCurrency(eomForecast, currency)}
                    </span>
                  )
                }
              >
                <div className="p-3 sm:p-5 lg:p-6">
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                    {forecastData.map((f, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 text-center"
                      >
                        <p className="section-title mb-1">{f.month}</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">
                          {formatCurrency(f.projected_cost, currency)}
                        </p>
                        {i > 0 && forecastData[i - 1]?.projected_cost > 0 && (
                          <p
                            className={`text-[10px] mt-0.5 font-semibold ${f.projected_cost > forecastData[i - 1].projected_cost ? "text-red-500" : "text-emerald-500"}`}
                          >
                            {f.projected_cost >
                            forecastData[i - 1].projected_cost
                              ? "▲"
                              : "▼"}{" "}
                            {Math.abs(
                              ((f.projected_cost -
                                forecastData[i - 1].projected_cost) /
                                forecastData[i - 1].projected_cost) *
                                100,
                            ).toFixed(1)}
                            %
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={forecastData}
                      margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(148,163,184,0.15)"
                      />
                      <XAxis
                        dataKey="month"
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
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) =>
                          `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                        }
                        dx={-4}
                      />
                      <Tooltip content={<CurrencyTooltip />} />
                      <Bar
                        dataKey="projected_cost"
                        name="Projected"
                        fill={GCP_PRIMARY}
                        radius={[4, 4, 0, 0]}
                        animationDuration={600}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* Status footer */}
            {data && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  Snapshot:{" "}
                  {data.snapshotTime
                    ? new Date(data.snapshotTime).toLocaleString()
                    : "Just now"}
                  {" · "}
                  {services.length} services · {currency}
                </span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default GcpCostPage;
