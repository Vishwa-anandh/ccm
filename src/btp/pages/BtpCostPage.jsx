import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Server,
  Globe,
  Activity,
  Sparkles,
  ChevronDown,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  BarChart2,
  Layers,
  Target,
  Shield,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  Calendar,
  Database,
  Cpu,
  DollarSign,
  TrendingDown,
  MapPin,
  FolderTree,
  Building2,
  Network,
  Settings2,
} from "lucide-react";
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
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BtpAccountContext } from "../context/BtpAccountContext";
import {
  getBtpCosts,
  getBtpYearly,
  triggerBtpBackfill,
  getSmConfig,
  getSmInstances,
  refreshSmInstancesStream,
} from "../../api/btpApi";
import BtpServiceManagerModal from "../components/BtpServiceManagerModal";
import { formatCurrency } from "../../utils/formatters";
import ServiceCategoryCard from "../../components/ServiceCategoryCard";
import { useMspRates } from "../../hooks/useMspRates";

const SAP_COLORS = [
  "#0070F2",
  "#5C96EB",
  "#F0AB00",
  "#107E3E",
  "#E9730C",
  "#6A6D70",
  "#BB0000",
  "#354A5E",
  "#1870C5",
  "#8B5CF6",
];

const BTP_REGION_NAMES = {
  us10: "US East (VA)",
  us20: "US West (WA)",
  us21: "US East (VA)",
  us30: "US Central (IA)",
  eu10: "Europe (Frankfurt)",
  eu11: "Europe (Frankfurt EU Access)",
  eu20: "Europe (Netherlands)",
  eu30: "Europe (Frankfurt)",
  ap10: "Australia (Sydney)",
  ap11: "Asia Pacific (Seoul)",
  ap12: "Asia Pacific (Seoul)",
  ap20: "Asia Pacific (Sydney)",
  ap21: "Asia Pacific (Singapore)",
  jp10: "Japan (Tokyo)",
  jp20: "Japan (Tokyo)",
  ca10: "Canada (Montreal)",
  br10: "Brazil (São Paulo)",
  in30: "India (Mumbai)",
  il30: "Israel (Tel Aviv)",
  ae1: "UAE (Dubai)",
  ch20: "Switzerland (Zurich)",
  sa30: "KSA (Riyadh)",
};

const getBtpRegionLabel = (code) => {
  if (!code) return "Unknown";
  const lower = code.toLowerCase();
  return BTP_REGION_NAMES[lower] ?? code;
};

// ─── Shared primitives ────────────────────────────────────────────────────────
const Section = ({
  title,
  subtitle,
  icon: Icon,
  children,
  className = "",
  action,
}) => (
  <div
    className={`rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-5 ${className}`}
  >
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5 text-[#0070F2]" />}
          <h3 className="text-xs font-bold text-[#94A3B8] tracking-wider">
            {title}
          </h3>
        </div>
        {subtitle && (
          <p className="text-[11px] text-[#CBD5E1] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
    {children}
  </div>
);
Section.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  action: PropTypes.node,
};

const Skeleton = ({ className }) => (
  <div
    className={`rounded-xl bg-[#F1F5F9] dark:bg-[#1a2744] animate-pulse ${className}`}
  />
);
Skeleton.propTypes = { className: PropTypes.string };

const Delta = ({ pct }) => {
  if (pct === null || pct === undefined)
    return <span className="text-[#CBD5E1] text-[10px]">—</span>;
  const flat = Math.abs(pct) < 0.5;
  if (flat)
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-[#94A3B8]">
        <Minus className="w-2.5 h-2.5" /> Flat
      </span>
    );
  const up = pct > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${up ? "text-red-500" : "text-emerald-500"}`}
    >
      {up ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : (
        <ArrowDownRight className="w-3 h-3" />
      )}
      {Math.abs(pct).toFixed(1)}% MoM
    </span>
  );
};
Delta.propTypes = { pct: PropTypes.number };

const TABS = [
  {
    id: "executive",
    label: "Executive",
    icon: Target,
    desc: "CEO / Leadership — spend health & financials",
  },
  {
    id: "operations",
    label: "Operations",
    icon: BarChart2,
    desc: "Manager — allocation, subaccounts & trends",
  },
  {
    id: "hierarchy",
    label: "Hierarchy",
    icon: FolderTree,
    desc: "Directory / Subaccount drill-down",
  },
  {
    id: "technical",
    label: "Technical",
    icon: Layers,
    desc: "Engineer — granular data, services & API metrics",
  },
];

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const CurrencyTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-xl shadow-xl p-3 text-xs">
      <p className="font-bold text-[#475569] dark:text-[#94A3B8] mb-1">
        {label}
      </p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {formatCurrency(p.value, currency)}
        </p>
      ))}
    </div>
  );
};
CurrencyTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
  currency: PropTypes.string,
};

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
const Breadcrumb = ({ crumbs, onNavigate }) => (
  <div className="flex items-center gap-1.5 text-xs flex-wrap">
    {crumbs.map((c, i) => (
      <React.Fragment key={i}>
        {i > 0 && <ChevronRight className="w-3 h-3 text-[#CBD5E1]" />}
        {i < crumbs.length - 1 ? (
          <button
            onClick={() => onNavigate(i)}
            className="text-[#0070F2] hover:underline font-semibold"
          >
            {c}
          </button>
        ) : (
          <span className="text-[#0F172A] dark:text-white font-bold">{c}</span>
        )}
      </React.Fragment>
    ))}
  </div>
);
Breadcrumb.propTypes = {
  crumbs: PropTypes.arrayOf(PropTypes.string).isRequired,
  onNavigate: PropTypes.func.isRequired,
};

// ─── SM Instances Panel ───────────────────────────────────────────────────────
const SmInstancesPanel = ({
  smConfig, smInstances, smLoading, smRefreshing, smError, smSyncMsg,
  onConfigure, onRefresh,
}) => {
  const [smSearch, setSmSearch] = useState("");
  const filteredInst = smSearch.trim()
    ? smInstances.filter((i) =>
        [i.name, i.serviceOfferingName, i.servicePlanName, i.platformType, i.status]
          .some((v) => v?.toLowerCase().includes(smSearch.toLowerCase()))
      )
    : smInstances;

  return (
    <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden flex flex-col" style={{ maxHeight: "520px" }}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9] dark:border-[#1a2744]">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-[#0070F2]" />
          <span className="text-xs font-bold text-[#94A3B8] tracking-wider">
            Service Manager Instances
            {smInstances.length > 0 && (
              <span className="ml-1 text-[#0070F2]">
                {smSearch.trim() && filteredInst.length !== smInstances.length
                  ? `${filteredInst.length} / ${smInstances.length}`
                  : smInstances.length}
              </span>
            )}
          </span>
          {smConfig?.syncStatus === "syncing" && (
            <span className="text-[10px] text-amber-500 animate-pulse">Syncing…</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {smConfig?.lastSyncedAt && (
            <span className="text-[10px] text-[#94A3B8] hidden sm:block">
              Synced {new Date(smConfig.lastSyncedAt).toLocaleDateString()}
            </span>
          )}
          <button
            type="button"
            onClick={onConfigure}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-[#475569] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#1a2744] hover:border-[#0070F2] hover:text-[#0070F2] rounded-lg transition-colors"
          >
            <Settings2 className="w-3 h-3" />
            {smConfig ? "Update" : "Configure"}
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={smRefreshing || smLoading}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-[#0070F2] border border-[#0070F2] hover:border-[#0057c2] hover:text-[#0057c2] disabled:opacity-50 rounded-lg transition-colors"
          >
            {smRefreshing
              ? <><RefreshCw className="w-3 h-3 animate-spin" /> Syncing…</>
              : <><RefreshCw className="w-3 h-3" /> Refresh</>}
          </button>
        </div>
      </div>

      {/* Progress / error */}
      {smSyncMsg && (
        <div className={`flex-shrink-0 flex items-center gap-2 mx-5 mt-3 p-2.5 rounded-xl border text-xs ${smRefreshing ? "border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400" : "border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"}`}>
          {smRefreshing
            ? <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" />
            : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
          {smSyncMsg}
        </div>
      )}
      {smError && (
        <div className="flex-shrink-0 flex items-center gap-2 mx-5 mt-3 p-2.5 rounded-xl border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {smError}
        </div>
      )}

      {/* Search bar */}
      {smInstances.length > 0 && (
        <div className="flex-shrink-0 px-5 py-2.5 border-b border-[#F1F5F9] dark:border-[#1a2744]">
          <input
            type="text"
            value={smSearch}
            onChange={(e) => setSmSearch(e.target.value)}
            placeholder="Search by name, offering, plan, platform…"
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#1a2744] bg-[#F8FAFC] dark:bg-[#121A2F] text-[#0F172A] dark:text-white placeholder-[#CBD5E1] dark:placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30"
          />
        </div>
      )}

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
        {smLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 rounded-full border-2 border-[#0070F2] border-t-transparent animate-spin" />
          </div>
        ) : !smConfig ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center px-6">
            <Settings2 className="w-7 h-7 text-[#CBD5E1]" />
            <div>
              <p className="text-xs font-bold text-[#475569] dark:text-[#94A3B8]">Service Manager not configured</p>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">Click Configure to add SM credentials for this subaccount.</p>
            </div>
            <button
              type="button"
              onClick={onConfigure}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0070F2] border border-[#0070F2] rounded-xl hover:border-[#0057c2] hover:text-[#0057c2] transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" /> Configure Service Manager
            </button>
          </div>
        ) : filteredInst.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center px-6">
            <Database className="w-7 h-7 text-[#CBD5E1]" />
            <p className="text-xs font-bold text-[#475569] dark:text-[#94A3B8]">
              {smSearch.trim() ? "No instances match your search." : "No service instances found"}
            </p>
            <p className="text-[11px] text-[#94A3B8]">
              {!smSearch.trim() && (smConfig.lastSyncedAt ? "No instances in last sync." : "Click Refresh to discover instances.")}
            </p>
          </div>
        ) : (
          <table className="w-full text-xs min-w-[560px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-[#F1F5F9] dark:border-[#1a2744] bg-[#F8FAFC] dark:bg-[#0d1526]">
                <th className="text-left font-bold text-[#94A3B8] px-5 py-2.5">Instance Name</th>
                <th className="text-left font-bold text-[#94A3B8] px-3 py-2.5">Service Offering</th>
                <th className="text-left font-bold text-[#94A3B8] px-3 py-2.5">Service Plan</th>
                <th className="text-left font-bold text-[#94A3B8] px-3 py-2.5">Platform</th>
                <th className="text-left font-bold text-[#94A3B8] px-3 py-2.5">Status</th>
                <th className="text-left font-bold text-[#94A3B8] px-3 py-2.5">Created</th>
                <th className="text-left font-bold text-[#94A3B8] px-5 py-2.5">Last Synced</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#1a2744]">
              {filteredInst.map((inst) => {
                const statusKey = (inst.status ?? "").toLowerCase();
                const isOk   = statusKey.includes("succeeded") || statusKey === "true";
                const isFail = statusKey.includes("failed")    || statusKey === "false";
                return (
                  <tr key={inst.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#121A2F] transition-colors">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg border border-[#0070F2]/20 flex items-center justify-center shrink-0">
                          <Database className="w-3 h-3 text-[#0070F2]" />
                        </div>
                        <span className="font-semibold text-[#475569] dark:text-[#CBD5E1] truncate max-w-[160px]" title={inst.name}>
                          {inst.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[#94A3B8] truncate max-w-[140px]">{inst.serviceOfferingName ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      {inst.servicePlanName ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-[#CBD5E1] dark:border-[#475569] text-[#94A3B8] font-mono whitespace-nowrap">
                          {inst.servicePlanName}
                        </span>
                      ) : <span className="text-[#CBD5E1]">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {inst.platformType ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {inst.platformType}
                        </span>
                      ) : <span className="text-[#CBD5E1]">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {inst.status != null ? (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${isOk ? "border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400" : isFail ? "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400" : "border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOk ? "bg-emerald-500" : isFail ? "bg-red-500" : "bg-amber-500"}`} />
                          {isOk ? "Active" : isFail ? "Failed" : String(inst.status)}
                        </span>
                      ) : <span className="text-[#CBD5E1]">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-[#94A3B8] whitespace-nowrap">
                      {inst.createdAtSm ? new Date(inst.createdAtSm).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-2.5 text-[#94A3B8] whitespace-nowrap">
                      {inst.lastSyncedAt ? new Date(inst.lastSyncedAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer count */}
      {filteredInst.length > 0 && (
        <div className="flex-shrink-0 px-5 py-2 border-t border-[#F1F5F9] dark:border-[#1a2744] flex items-center justify-between">
          <span className="text-[10px] text-[#94A3B8]">
            Showing {filteredInst.length} of {smInstances.length} instance(s)
          </span>
          {smSearch.trim() && (
            <button
              type="button"
              onClick={() => setSmSearch("")}
              className="text-[10px] text-[#0070F2] hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      )}
    </div>
  );
};
SmInstancesPanel.propTypes = {
  smConfig: PropTypes.object,
  smInstances: PropTypes.array.isRequired,
  smLoading: PropTypes.bool.isRequired,
  smRefreshing: PropTypes.bool.isRequired,
  smError: PropTypes.string,
  smSyncMsg: PropTypes.string,
  onConfigure: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};

// ─── Cost bar row ─────────────────────────────────────────────────────────────
const CostBarRow = ({
  name,
  cost,
  totalCost,
  currency,
  color,
  onClick,
  badge,
}) => {
  const pct = totalCost > 0 ? (cost / totalCost) * 100 : 0;
  return (
    <div
      className={`group flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all ${onClick ? "cursor-pointer hover:bg-[#F8FAFC] dark:hover:bg-[#121A2F]" : ""}`}
      onClick={onClick}
    >
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-[#475569] dark:text-[#CBD5E1] truncate">
              {name}
            </span>
            {badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-[#CBD5E1] dark:border-[#475569] text-[#94A3B8]">
                {badge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-[#0F172A] dark:text-white">
              {formatCurrency(cost, currency)}
            </span>
            <span className="text-[10px] text-[#94A3B8] w-10 text-right">
              {pct.toFixed(1)}%
            </span>
            {onClick && (
              <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1] group-hover:text-[#0070F2] transition-colors" />
            )}
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-[#F1F5F9] dark:bg-[#1a2744] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
};
CostBarRow.propTypes = {
  name: PropTypes.string.isRequired,
  cost: PropTypes.number.isRequired,
  totalCost: PropTypes.number.isRequired,
  currency: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  badge: PropTypes.string,
};

// ─── Main component ───────────────────────────────────────────────────────────
const BtpCostPage = () => {
  const { rates: mspRates } = useMspRates();
  const { accountId } = useParams();
  const navigate = useNavigate();
  const { getAccount } = useContext(BtpAccountContext);
  const account = getAccount(accountId);

  const [costs, setCosts] = useState(null);
  const [yearly, setYearly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("executive");

  // Drill-down state
  const [drillDir, setDrillDir] = useState(null); // selected CIS directory
  const [drillSub, setDrillSub] = useState(null); // selected CIS subaccount

  // Service Manager state (per drillSub)
  const [smConfig, setSmConfig]           = useState(null);
  const [smInstances, setSmInstances]     = useState([]);
  const [smLoading, setSmLoading]         = useState(false);
  const [smRefreshing, setSmRefreshing]   = useState(false);
  const [smError, setSmError]             = useState("");
  const [smSyncMsg, setSmSyncMsg]         = useState("");
  const [showSmModal, setShowSmModal]     = useState(false);

  const aiRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (aiRef.current && !aiRef.current.contains(e.target)) setAiOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadData = useCallback(
    async (force = false) => {
      setLoading(true);
      try {
        const [costsRes, yearlyRes] = await Promise.all([
          getBtpCosts(accountId, force),
          getBtpYearly(accountId).catch(() => ({ data: [] })),
        ]);
        setCosts(costsRes.data);
        setYearly(Array.isArray(yearlyRes.data) ? yearlyRes.data : []);
      } catch (err) {
        console.error("BTP cost page load error:", err);
      } finally {
        setLoading(false);
      }
    },
    [accountId],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load SM config + instances whenever user drills into a subaccount
  useEffect(() => {
    if (!drillSub?.guid) {
      setSmConfig(null);
      setSmInstances([]);
      setSmError("");
      return;
    }
    let cancelled = false;
    setSmLoading(true);
    setSmConfig(null);
    setSmInstances([]);
    setSmError("");
    Promise.all([
      getSmConfig(accountId, drillSub.guid),
      getSmInstances(accountId, drillSub.guid),
    ])
      .then(([cfgRes, instRes]) => {
        if (cancelled) return;
        setSmConfig(cfgRes.data ?? null);
        setSmInstances(instRes.data ?? []);
      })
      .catch(() => { if (!cancelled) setSmError("Failed to load Service Manager data."); })
      .finally(() => { if (!cancelled) setSmLoading(false); });
    return () => { cancelled = true; };
  }, [drillSub?.guid, accountId]);

  const handleSmRefresh = () => {
    if (!smConfig) { setShowSmModal(true); return; }
    setSmRefreshing(true);
    setSmSyncMsg("Starting sync…");
    setSmError("");

    refreshSmInstancesStream(accountId, drillSub.guid, async (evt) => {
      switch (evt.step) {
        case "token":
        case "instances":
        case "plans":
        case "storing":
          setSmSyncMsg(evt.message);
          break;
        case "token_done":
        case "instances_done":
        case "plans_done":
        case "plans_warn":
          setSmSyncMsg(evt.message);
          break;
        case "done":
          setSmSyncMsg(`✓ ${evt.message}`);
          setSmRefreshing(false);
          // Reload stored data
          try {
            const [instRes, cfgRes] = await Promise.all([
              getSmInstances(accountId, drillSub.guid),
              getSmConfig(accountId, drillSub.guid),
            ]);
            setSmInstances(instRes.data ?? []);
            setSmConfig(cfgRes.data ?? null);
          } catch { /* non-fatal */ }
          break;
        case "error":
          setSmError(evt.message);
          setSmSyncMsg("");
          setSmRefreshing(false);
          break;
        default:
          break;
      }
    });
  };

  const handleSmSaved = async () => {
    if (!drillSub?.guid) return;
    const [cfgRes, instRes] = await Promise.all([
      getSmConfig(accountId, drillSub.guid),
      getSmInstances(accountId, drillSub.guid),
    ]);
    setSmConfig(cfgRes.data ?? null);
    setSmInstances(instRes.data ?? []);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await triggerBtpBackfill(accountId);
      await loadData(true);
    } finally {
      setSyncing(false);
    }
  };

  // ── Derived values ──
  const currency = costs?.currency ?? "EUR";
  const totalCost = costs?.totalCost ?? 0;
  const dailyCosts = costs?.dailyCosts ?? [];
  const services = costs?.services ?? [];
  const topServices = useMemo(() => costs?.topServices ?? [], [costs]);
  const environments = costs?.environments ?? [];
  const forecastData = costs?.forecastData ?? [];
  const subaccounts = costs?.subaccounts ?? [];
  const directories = costs?.directories ?? [];
  const subaccountHierarchy = costs?.subaccountHierarchy ?? [];
  const globalAccount = costs?.globalAccount ?? null;
  const cisSucceeded = costs?.cisSucceeded ?? false;
  const servicesBySubaccount = costs?.servicesBySubaccount ?? [];
  const mspSavings = totalCost * (mspRates.btp ?? 0.02);

  const now = new Date();
  const prevYM =
    now.getMonth() === 0
      ? { year: now.getFullYear() - 1, month: 12 }
      : { year: now.getFullYear(), month: now.getMonth() };
  const prevData = yearly.find(
    (m) => m.year === prevYM.year && m.month === prevYM.month,
  );
  const prevTotal = prevData?.totalCost ?? 0;
  const momPct =
    prevTotal > 0 ? ((totalCost - prevTotal) / prevTotal) * 100 : null;

  const projected = forecastData[0]?.projected_cost ?? totalCost;
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const dayOfMonth = now.getDate();
  const burnRate = dayOfMonth > 0 ? totalCost / dayOfMonth : 0;
  const annualisedRR = burnRate * daysInMonth * 12;

  const monthlyBars = yearly.slice(-12).map((r) => ({
    name: `${String(r.month).padStart(2, "0")}/${String(r.year).slice(2)}`,
    cost: r.totalCost ?? 0,
  }));

  const pieSvcData = topServices.slice(0, 6).map((s, i) => ({
    name: s.name,
    value: s.cost,
    color: SAP_COLORS[i % SAP_COLORS.length],
  }));

  const pieSubData = subaccounts.slice(0, 6).map((s, i) => ({
    name: s.name,
    value: s.cost,
    color: SAP_COLORS[i % SAP_COLORS.length],
  }));

  const healthScore = useMemo(() => {
    let score = 80;
    if (momPct !== null) {
      if (momPct > 30) score -= 20;
      else if (momPct > 15) score -= 10;
      else if (momPct < -5) score += 10;
    }
    if (projected > totalCost * 1.4) score -= 15;
    const topShare =
      topServices[0] && totalCost > 0 ? topServices[0].cost / totalCost : 0;
    if (topShare > 0.6) score -= 10;
    return Math.min(100, Math.max(0, score));
  }, [momPct, projected, totalCost, topServices]);

  const healthLabel =
    healthScore >= 80
      ? "Healthy"
      : healthScore >= 60
        ? "Monitor"
        : "Action Needed";
  const healthColor =
    healthScore >= 80
      ? "text-emerald-600 dark:text-emerald-400"
      : healthScore >= 60
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";
  const healthBg =
    healthScore >= 80
      ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30"
      : healthScore >= 60
        ? "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30"
        : "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30";

  // ── Hierarchy helpers ──
  // Match COST_API subaccount name → CIS subaccount metadata
  const subaccountCostMap = useMemo(() => {
    const map = new Map();
    for (const s of subaccounts) map.set(s.name?.toLowerCase?.(), s.cost ?? 0);
    return map;
  }, [subaccounts]);

  const getCisCost = (displayName) =>
    subaccountCostMap.get(displayName?.toLowerCase?.()) ?? 0;

  // Build directory → subaccounts with costs
  const directoriesWithCosts = useMemo(
    () =>
      directories.map((dir) => {
        const subs = (dir.subaccounts ?? []).map((sub) => {
          const cisMeta =
            subaccountHierarchy.find((h) => h.guid === sub.guid) ?? sub;
          return { ...sub, ...cisMeta, cost: getCisCost(sub.displayName) };
        });
        const dirCost = subs.reduce((s, x) => s + x.cost, 0);
        return { ...dir, subaccounts: subs, cost: dirCost };
      }),
    [directories, subaccountHierarchy, subaccountCostMap],
  );

  // Orphan subaccounts (not in any directory)
  const orphanSubs = useMemo(() => {
    const dirSubGuids = new Set(
      directoriesWithCosts.flatMap((d) => d.subaccounts.map((s) => s.guid)),
    );
    return subaccountHierarchy
      .filter((h) => !dirSubGuids.has(h.guid))
      .map((h) => ({ ...h, cost: getCisCost(h.displayName) }));
  }, [directoriesWithCosts, subaccountHierarchy, subaccountCostMap]);

  // Region breakdown from CIS subaccount hierarchy
  const regionBreakdown = useMemo(() => {
    const map = new Map();
    for (const sub of subaccountHierarchy) {
      const region =
        sub.region ??
        sub.technicalName?.split("-").slice(0, 2).join("-") ??
        "Unknown";
      const cost = getCisCost(sub.displayName);
      map.set(region, (map.get(region) ?? 0) + cost);
    }
    return Array.from(map.entries())
      .map(([region, cost]) => ({ region, cost }))
      .sort((a, b) => b.cost - a.cost);
  }, [subaccountHierarchy, subaccountCostMap]);

  // AI insights
  const btpAiInsights = useMemo(() => {
    const insights = [];
    if (momPct !== null) {
      const dir = momPct > 0 ? "increased" : "decreased";
      insights.push({
        type: momPct > 15 ? "warning" : momPct < -5 ? "success" : "info",
        title: `BTP spend ${dir} ${Math.abs(momPct).toFixed(1)}% vs last month`,
        detail: `This month: ${formatCurrency(totalCost, currency)} vs ${formatCurrency(prevTotal, currency)} last month.`,
      });
    }
    if (topServices.length > 0) {
      const top = topServices[0];
      const pct = totalCost > 0 ? ((top.cost / totalCost) * 100).toFixed(1) : 0;
      insights.push({
        type: Number(pct) > 50 ? "warning" : "info",
        title: `${top.name} is your top BTP service`,
        detail: `${formatCurrency(top.cost, currency)} (${pct}% of total). ${Number(pct) > 50 ? "High concentration — review usage plan." : "Cost distribution looks healthy."}`,
      });
    }
    if (directoriesWithCosts.length > 0) {
      const topDir = [...directoriesWithCosts].sort(
        (a, b) => b.cost - a.cost,
      )[0];
      if (topDir.cost > 0) {
        const pct =
          totalCost > 0 ? ((topDir.cost / totalCost) * 100).toFixed(1) : 0;
        insights.push({
          type: "info",
          title: `Directory "${topDir.displayName}" drives ${pct}% of spend`,
          detail: `${formatCurrency(topDir.cost, currency)} across ${topDir.subaccounts.length} subaccounts.`,
        });
      }
    }
    if (projected > totalCost * 1.3)
      insights.push({
        type: "warning",
        title: `EOM projection ${((projected / (totalCost || 1) - 1) * 100).toFixed(0)}% above Month-to-Date`,
        detail: "BTP usage is projected to accelerate.",
      });
    if (mspSavings > 0)
      insights.push({
        type: "success",
        title: `Maitsys CSP saves ${formatCurrency(mspSavings, currency)} this month`,
        detail: `2% discount on ${formatCurrency(totalCost, currency)} BTP spend.`,
      });
    return insights.slice(0, 5);
  }, [
    totalCost,
    topServices,
    directoriesWithCosts,
    projected,
    currency,
    mspSavings,
    momPct,
    prevTotal,
  ]);

  // ── Breadcrumb navigation helper ──
  const drillCrumbs = useMemo(() => {
    if (activeTab !== "hierarchy") return [];
    const c = [globalAccount?.displayName ?? "Global Account"];
    if (drillDir) c.push(drillDir.displayName);
    if (drillSub) c.push(drillSub.displayName);
    return c;
  }, [activeTab, drillDir, drillSub, globalAccount]);

  const handleBreadcrumb = (idx) => {
    if (idx === 0) {
      setDrillDir(null);
      setDrillSub(null);
    }
    if (idx === 1) setDrillSub(null);
  };

  // Per-subaccount services from COST_API saServiceRows (matched by subaccountId or name)
  const drillSubServices = useMemo(() => {
    if (!drillSub) return [];
    // Try match by subaccountId (guid) first, then by display name
    const byId = servicesBySubaccount.find(
      (s) => s.subaccountId === drillSub.guid,
    );
    const byName = servicesBySubaccount.find(
      (s) =>
        s.subaccountName?.toLowerCase() === drillSub.displayName?.toLowerCase(),
    );
    return (byId ?? byName)?.services ?? [];
  }, [drillSub, servicesBySubaccount]);

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/btp")}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#1a2744] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] dark:text-white">
              {account?.name ?? accountId}
            </h1>
            <p className="text-xs text-[#94A3B8]">
              SAP BTP · {account?.region ?? "UAS Reporting"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* AI Insights */}
          <div className="relative" ref={aiRef}>
            <button
              onClick={() => setAiOpen((v) => !v)}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${aiOpen ? "bg-violet-500 border-violet-500 text-white" : "border-violet-300 dark:border-violet-600 bg-white dark:bg-[#0B1023] text-violet-600 dark:text-violet-400 shadow-[0_0_0_3px_rgba(139,92,246,0.15)] animate-pulse hover:animate-none"}`}
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
              <div className="absolute right-0 top-full mt-1.5 w-[min(400px,calc(100vw-1rem))] bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E2E8F0] dark:border-[#1a2744]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    <span className="text-sm font-bold text-[#0F172A] dark:text-white">
                      AI Cost Insights
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400">
                      SAP BTP
                    </span>
                  </div>
                  <button
                    onClick={() => setAiOpen(false)}
                    className="text-[#94A3B8] hover:text-[#475569] dark:hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
                  {btpAiInsights.length === 0 ? (
                    <div className="text-center py-8">
                      <Sparkles className="w-8 h-8 text-[#E2E8F0] dark:text-[#1a2744] mx-auto mb-2" />
                      <p className="text-sm text-[#94A3B8]">
                        Not enough data yet.
                      </p>
                    </div>
                  ) : (
                    btpAiInsights.map((ins, i) => {
                      const cfg =
                        {
                          warning: {
                            bg: "border-amber-100 dark:border-amber-900/40",
                            icon: (
                              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            ),
                            title: "text-amber-800 dark:text-amber-300",
                          },
                          success: {
                            bg: "border-emerald-100 dark:border-emerald-900/40",
                            icon: (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            ),
                            title: "text-emerald-800 dark:text-emerald-300",
                          },
                          info: {
                            bg: "border-blue-100 dark:border-blue-900/40",
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
                              <p className="text-xs text-[#94A3B8] leading-relaxed">
                                {ins.detail}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="px-5 py-3 border-t border-[#E2E8F0] dark:border-[#1a2744] bg-[#F8FAFC] dark:bg-[#10182B]">
                  <p className="text-[10px] text-[#94A3B8] font-medium">
                    Based on Month-to-Date data and monthly history ·
                    Auto-generated
                  </p>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleSync}
            disabled={syncing || loading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#475569] dark:text-[#94A3B8] bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-xl hover:bg-[#F1F5F9] dark:hover:bg-[#1a2744] transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync"}
          </button>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Month-to-Date Spend",
            value: loading ? null : formatCurrency(totalCost, currency),
            sub: <Delta pct={momPct} />,
            icon: DollarSign,
            color: "blue",
          },
          {
            label: "Services Active",
            value: loading ? null : String(services.length),
            sub: (
              <span className="text-[10px] text-[#94A3B8]">
                {topServices[0]?.name?.slice(0, 24) ?? "—"} is top
              </span>
            ),
            icon: Server,
            color: "indigo",
          },
          {
            label: cisSucceeded ? "Directories" : "Environments",
            value: loading
              ? null
              : String(
                  cisSucceeded
                    ? directoriesWithCosts.length
                    : environments.length,
                ),
            sub: (
              <span className="text-[10px] text-[#94A3B8]">
                {cisSucceeded
                  ? `${subaccountHierarchy.length} subaccounts`
                  : `${environments[0]?.type ?? "—"} leads`}
              </span>
            ),
            icon: cisSucceeded ? FolderTree : Globe,
            color: "amber",
          },
          {
            label: "Projected (EOM)",
            value: loading ? null : formatCurrency(projected, currency),
            sub:
              projected > totalCost * 1.2 ? (
                <span className="text-[10px] font-bold text-amber-500">
                  +{((projected / (totalCost || 1) - 1) * 100).toFixed(0)}%
                  above Month-to-Date
                </span>
              ) : (
                <span className="text-[10px] text-[#94A3B8]">On track</span>
              ),
            icon: TrendingUp,
            color: "emerald",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-5 hover:-translate-y-1 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#94A3B8] tracking-wider">
                {k.label}
              </span>
              <div className="w-8 h-8 flex items-center justify-center">
                <k.icon className={`w-4 h-4 text-${k.color}-500`} />
              </div>
            </div>
            {k.value === null ? (
              <Skeleton className="h-7 w-28 mb-1" />
            ) : (
              <p className="text-xl font-bold text-[#0F172A] dark:text-white mb-1">
                {k.value}
              </p>
            )}
            <div className="h-4">{!loading && k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Audience Tabs ── */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#F1F5F9] dark:bg-[#121A2F] w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTab(t.id);
              if (t.id !== "hierarchy") {
                setDrillDir(null);
                setDrillSub(null);
              }
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? "bg-white dark:bg-[#0B1023] text-[#0F172A] dark:text-white shadow-sm" : "text-[#94A3B8] hover:text-[#475569] dark:hover:text-[#CBD5E1]"}`}
            title={t.desc}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          EXECUTIVE TAB
      ══════════════════════════════════════════════════ */}
      {activeTab === "executive" && (
        <div className="space-y-5">
          {/* Spend Health Banner */}
          <div className={`rounded-2xl border p-5 ${healthBg}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="6"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke={
                        healthScore >= 80
                          ? "#10B981"
                          : healthScore >= 60
                            ? "#F59E0B"
                            : "#EF4444"
                      }
                      strokeWidth="6"
                      strokeDasharray={`${(healthScore / 100) * 163.4} 163.4`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-[#0F172A] dark:text-white">
                    {healthScore}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8] font-semibold mb-0.5">
                    Spend Health Score
                  </p>
                  <p className={`text-lg font-black ${healthColor}`}>
                    {healthLabel}
                  </p>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Based on MoM trend, concentration risk & forecast
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: "This Month",
                    value: formatCurrency(totalCost, currency),
                    note:
                      momPct !== null
                        ? `${momPct > 0 ? "+" : ""}${momPct.toFixed(1)}% vs last month`
                        : "First month",
                  },
                  {
                    label: "Last Month",
                    value: formatCurrency(prevTotal, currency),
                    note: "Actual spend",
                  },
                  {
                    label: "EOM Forecast",
                    value: formatCurrency(projected, currency),
                    note: `Day ${dayOfMonth} of ${daysInMonth}`,
                  },
                  {
                    label: "MSP Savings",
                    value: formatCurrency(mspSavings, currency),
                    note: `${((mspRates.btp ?? 0.02) * 100).toFixed(1)}% CSP discount`,
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="bg-white/60 dark:bg-white/5 rounded-xl px-3 py-2.5"
                  >
                    <p className="text-[10px] text-[#94A3B8] font-semibold mb-0.5">
                      {m.label}
                    </p>
                    <p className="text-sm font-black text-[#0F172A] dark:text-white">
                      {m.value}
                    </p>
                    <p className="text-[10px] text-[#94A3B8]">{m.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Executive KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-[#94A3B8] tracking-wider">
                  Annualised Run Rate
                </span>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <p className="text-2xl font-black text-[#0F172A] dark:text-white">
                    {formatCurrency(annualisedRR, currency)}
                  </p>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Based on {formatCurrency(burnRate, currency)}/day burn rate
                  </p>
                </>
              )}
            </div>
            <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-[#94A3B8] tracking-wider">
                  Annual MSP Savings
                </span>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(mspSavings * 12, currency)}
                  </p>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    {((mspRates.btp ?? 0.02) * 100).toFixed(1)}% CSP discount · {formatCurrency(mspSavings, currency)}{" "}
                    this month
                  </p>
                </>
              )}
            </div>
            <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-[#94A3B8] tracking-wider">
                  Top Service Concentration
                </span>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : topServices.length === 0 ? (
                <p className="text-sm text-[#94A3B8]">No service data yet</p>
              ) : (
                <>
                  <p className="text-2xl font-black text-[#0F172A] dark:text-white">
                    {totalCost > 0
                      ? `${((topServices[0].cost / totalCost) * 100).toFixed(0)}%`
                      : "—"}
                  </p>
                  <p className="text-xs text-[#94A3B8] mt-1 truncate">
                    {topServices[0].name} ·{" "}
                    {formatCurrency(topServices[0].cost, currency)}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Top services pie + subaccount pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Section
              title="Service Cost Distribution"
              subtitle="Top services this month"
              icon={Server}
            >
              {loading ? (
                <Skeleton className="h-52 w-full" />
              ) : pieSvcData.length === 0 ? (
                <p className="text-sm text-[#94A3B8] text-center py-10">
                  No service data — sync to populate
                </p>
              ) : (
                <div className="flex gap-4 items-center">
                  <ResponsiveContainer width="45%" height={160}>
                    <PieChart>
                      <Pie
                        data={pieSvcData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieSvcData.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<CurrencyTooltip currency={currency} />}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5">
                    {pieSvcData.map((s, i) => {
                      const pct =
                        totalCost > 0
                          ? ((s.value / totalCost) * 100).toFixed(1)
                          : 0;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="text-[11px] text-[#475569] dark:text-[#CBD5E1] flex-1 truncate">
                            {s.name}
                          </span>
                          <span className="text-[11px] font-bold text-[#0F172A] dark:text-white">
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Section>

            <Section
              title="Subaccount Distribution"
              subtitle="Cost share by subaccount"
              icon={Layers}
            >
              {loading ? (
                <Skeleton className="h-52 w-full" />
              ) : pieSubData.length === 0 ? (
                <p className="text-sm text-[#94A3B8] text-center py-10">
                  No subaccount data
                </p>
              ) : (
                <div className="flex gap-4 items-center">
                  <ResponsiveContainer width="45%" height={160}>
                    <PieChart>
                      <Pie
                        data={pieSubData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieSubData.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<CurrencyTooltip currency={currency} />}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5">
                    {pieSubData.map((s, i) => {
                      const pct =
                        totalCost > 0
                          ? ((s.value / totalCost) * 100).toFixed(1)
                          : 0;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="text-[11px] text-[#475569] dark:text-[#CBD5E1] flex-1 truncate">
                            {s.name}
                          </span>
                          <span className="text-[11px] font-bold text-[#0F172A] dark:text-white">
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Section>
          </div>

          {topServices.length > 0 && (
            <ServiceCategoryCard
              services={topServices}
              provider="btp"
              currency={currency}
            />
          )}

          <Section
            title="12-Month Spend Timeline"
            subtitle="Year-over-year BTP cost trajectory"
            icon={TrendingUp}
          >
            {loading ? (
              <Skeleton className="h-52 w-full" />
            ) : monthlyBars.length === 0 ? (
              <p className="text-sm text-[#94A3B8] text-center py-10">
                No history yet — sync to populate
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={monthlyBars}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E2E8F0"
                    className="dark:stroke-[#1a2744]"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v.toFixed(0)}`}
                  />
                  <Tooltip content={<CurrencyTooltip currency={currency} />} />
                  <Bar
                    dataKey="cost"
                    name="Monthly Cost"
                    fill="#0070F2"
                    radius={[4, 4, 0, 0]}
                  >
                    {monthlyBars.map((_, i) => (
                      <Cell
                        key={i}
                        fill={
                          i === monthlyBars.length - 1 ? "#0070F2" : "#CBD5E1"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Section>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          OPERATIONS TAB
      ══════════════════════════════════════════════════ */}
      {activeTab === "operations" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-5">
            <h3 className="text-xs font-bold text-[#94A3B8] tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#0070F2]" />{" "}
              Month-Over-Month Comparison
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: "Current Month-to-Date",
                  value: formatCurrency(totalCost, currency),
                  text: "text-blue-700 dark:text-blue-300",
                  sub: `Day ${dayOfMonth}/${daysInMonth}`,
                },
                {
                  label: "Last Month Final",
                  value: formatCurrency(prevTotal, currency),
                  text: "text-slate-700 dark:text-slate-300",
                  sub: "Actual",
                },
                {
                  label: "MoM Change",
                  value:
                    momPct !== null
                      ? `${momPct > 0 ? "+" : ""}${momPct.toFixed(1)}%`
                      : "—",
                  text:
                    momPct === null
                      ? "text-slate-500"
                      : momPct > 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-emerald-600 dark:text-emerald-400",
                  sub:
                    momPct !== null
                      ? formatCurrency(
                          Math.abs(totalCost - prevTotal),
                          currency,
                        ) + " diff"
                      : "Insufficient data",
                },
                {
                  label: "Daily Burn Rate",
                  value: formatCurrency(burnRate, currency),
                  text: "text-amber-700 dark:text-amber-300",
                  sub: "per day avg",
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl border border-[#E2E8F0] dark:border-[#1a2744] p-3.5"
                >
                  <p className="text-[10px] font-bold text-[#94A3B8] mb-1">
                    {m.label}
                  </p>
                  <p className={`text-xl font-black ${m.text}`}>
                    {loading ? "—" : m.value}
                  </p>
                  <p className="text-[10px] text-[#94A3B8] mt-0.5">{m.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <Section
            title="Monthly Cost Trend"
            subtitle="BTP spend over the last 3 months"
            icon={TrendingUp}
          >
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : dailyCosts.length === 0 ? (
              <p className="text-sm text-[#94A3B8] text-center py-10">
                No trend data — sync to populate
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart
                  data={dailyCosts}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="btpAreaGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#0070F2"
                        stopOpacity={0.25}
                      />
                      <stop offset="95%" stopColor="#0070F2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E2E8F0"
                    className="dark:stroke-[#1a2744]"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(d) => d?.slice(0, 7)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v.toFixed(0)}`}
                  />
                  <Tooltip content={<CurrencyTooltip currency={currency} />} />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    name="Monthly Cost"
                    stroke="#0070F2"
                    strokeWidth={2.5}
                    fill="url(#btpAreaGrad)"
                    dot={{ fill: "#0070F2", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Section
              title="Service Cost Allocation"
              subtitle="Where your BTP budget is going"
              icon={Server}
            >
              {loading ? (
                <Skeleton className="h-56 w-full" />
              ) : services.length === 0 ? (
                <p className="text-sm text-[#94A3B8] text-center py-10">
                  No service data — sync to populate
                </p>
              ) : (
                <div className="space-y-2.5">
                  {services.slice(0, 8).map((s, i) => {
                    const pct = totalCost > 0 ? (s.cost / totalCost) * 100 : 0;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-[#475569] dark:text-[#CBD5E1] truncate max-w-[55%]">
                            {s.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[#94A3B8]">
                              {pct.toFixed(1)}%
                            </span>
                            <span className="font-bold text-[#0F172A] dark:text-white">
                              {formatCurrency(s.cost, currency)}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-[#F1F5F9] dark:bg-[#1a2744] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor:
                                SAP_COLORS[i % SAP_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {services.length > 8 && (
                    <p className="text-xs text-[#94A3B8] text-center pt-1">
                      +{services.length - 8} more — see Technical tab
                    </p>
                  )}
                </div>
              )}
            </Section>

            <Section
              title="Environment Breakdown"
              subtitle="Cost share by service environment"
              icon={Globe}
            >
              {loading ? (
                <Skeleton className="h-56 w-full" />
              ) : environments.length === 0 ? (
                <p className="text-sm text-[#94A3B8] text-center py-10">
                  No environment data — click Sync
                </p>
              ) : (
                <div className="flex gap-4">
                  <ResponsiveContainer width="42%" height={150}>
                    <PieChart>
                      <Pie
                        data={environments.map((e, i) => ({
                          name: e.type,
                          value: e.cost,
                          color: SAP_COLORS[i],
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={62}
                        paddingAngle={environments.length > 1 ? 3 : 0}
                        dataKey="value"
                      >
                        {environments.map((_, i) => (
                          <Cell
                            key={i}
                            fill={SAP_COLORS[i % SAP_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, n) => [formatCurrency(v, currency), n]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2.5 pt-1 min-w-0">
                    {environments.map((e, i) => {
                      const envTotal = environments.reduce(
                        (s, x) => s + x.cost,
                        0,
                      );
                      const pct = envTotal > 0 ? (e.cost / envTotal) * 100 : 0;
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between text-xs mb-1 gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor:
                                    SAP_COLORS[i % SAP_COLORS.length],
                                }}
                              />
                              <span className="font-semibold text-[#475569] dark:text-[#CBD5E1] truncate">
                                {e.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-[#E2E8F0] dark:border-[#1a2744] text-[#475569] dark:text-[#94A3B8]">
                                {pct.toFixed(1)}%
                              </span>
                              <span className="font-bold text-[#0F172A] dark:text-white">
                                {formatCurrency(e.cost, currency)}
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#F1F5F9] dark:bg-[#1a2744] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor:
                                  SAP_COLORS[i % SAP_COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Section>
          </div>

          {!loading && subaccounts.length > 0 && (
            <Section
              title="Subaccount Cost Summary"
              subtitle="Cost attribution by subaccount"
              icon={Layers}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] dark:border-[#1a2744]">
                      <th className="text-left text-xs font-bold text-[#94A3B8] pb-2 pr-4">
                        Subaccount
                      </th>
                      <th className="text-right text-xs font-bold text-[#94A3B8] pb-2 pr-4">
                        Cost
                      </th>
                      <th className="text-right text-xs font-bold text-[#94A3B8] pb-2">
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#1a2744]">
                    {subaccounts.map((s, i) => {
                      const pct =
                        totalCost > 0 ? (s.cost / totalCost) * 100 : 0;
                      return (
                        <tr
                          key={i}
                          className="hover:bg-[#F8FAFC] dark:hover:bg-[#121A2F]"
                        >
                          <td
                            className="py-2.5 pr-4 font-medium text-[#475569] dark:text-[#CBD5E1] max-w-xs truncate"
                            title={s.name}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{
                                  backgroundColor:
                                    SAP_COLORS[i % SAP_COLORS.length],
                                }}
                              />
                              {s.name}
                            </div>
                          </td>
                          <td className="py-2.5 pr-4 text-right font-bold text-[#0F172A] dark:text-white">
                            {formatCurrency(s.cost, currency)}
                          </td>
                          <td className="py-2.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-[#F1F5F9] dark:bg-[#1a2744] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#0070F2]"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-[#94A3B8] w-10 text-right">
                                {pct.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          HIERARCHY TAB
      ══════════════════════════════════════════════════ */}
      {activeTab === "hierarchy" && (
        <div className="space-y-4">
          {/* ── Level indicator strip ── */}
          <div className="flex items-center gap-0 text-[10px] font-bold overflow-x-auto">
            {[
              { label: "Global Account", icon: Building2, active: !drillDir },
              {
                label: "Directory",
                icon: FolderTree,
                active: !!drillDir && !drillSub,
              },
              { label: "Subaccount", icon: Cpu, active: !!drillSub },
              { label: "Services / Instances", icon: Server, active: false },
            ].map((lvl, i) => (
              <React.Fragment key={lvl.label}>
                {i > 0 && (
                  <ChevronRight
                    className={`w-3 h-3 shrink-0 ${i <= (drillSub ? 3 : drillDir ? 2 : 1) ? "text-[#0070F2]" : "text-[#CBD5E1] dark:text-[#475569]"}`}
                  />
                )}
                <span
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg ${lvl.active ? "text-[#0070F2] font-black" : i < (drillSub ? 3 : drillDir ? 2 : 1) ? "text-[#475569] dark:text-[#94A3B8]" : "text-[#CBD5E1] dark:text-[#475569]"}`}
                >
                  <lvl.icon className="w-3 h-3" />
                  {lvl.label}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* ── Breadcrumb ── */}
          {drillCrumbs.length > 1 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023]">
              <FolderTree className="w-3.5 h-3.5 text-[#0070F2] shrink-0" />
              <Breadcrumb crumbs={drillCrumbs} onNavigate={handleBreadcrumb} />
            </div>
          )}

          {/* CIS not configured notice */}
          {!cisSucceeded && !loading && (
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-amber-200 dark:border-amber-800">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-0.5">
                  CIS_Central not configured
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Add CIS_Central credentials to enable directory and subaccount
                  hierarchy. COST_API data is still shown below.
                </p>
              </div>
            </div>
          )}

          {/* ══════════════════ LEVEL 0 — Global Account ══════════════════ */}
          {!drillDir && (
            <>
              {/* Global Account card */}
              <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 p-5 border-b border-[#F1F5F9] dark:border-[#1a2744]">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#0070F2]/30 bg-[#0070F2]/5 text-[#0070F2] shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-[#94A3B8] font-semibold  tracking-wider">
                      Global Account
                    </p>
                    <h2 className="text-base font-bold text-[#0F172A] dark:text-white truncate">
                      {globalAccount?.displayName || account?.name || accountId}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
                    {globalAccount?.commercialModel ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#0070F2]/40 text-[#0070F2]">
                        {globalAccount.commercialModel}
                      </span>
                    ) : null}
                    {globalAccount?.licenseType ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400">
                        {globalAccount.licenseType}
                      </span>
                    ) : null}
                    {globalAccount?.contractStatus ? (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${globalAccount.contractStatus === "ACTIVE" ? "border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400" : "border-[#CBD5E1] dark:border-[#475569] text-[#94A3B8]"}`}
                      >
                        {globalAccount.contractStatus}
                      </span>
                    ) : null}
                  </div>
                </div>
                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-[#F1F5F9] dark:divide-[#1a2744]">
                  {[
                    {
                      label: "Total MTD Cost",
                      value: formatCurrency(totalCost, currency),
                      accent: true,
                    },
                    {
                      label: "Directories",
                      value:
                        directoriesWithCosts.length > 0
                          ? String(directoriesWithCosts.length)
                          : cisSucceeded
                            ? "0"
                            : "—",
                    },
                    {
                      label: "Subaccounts",
                      value:
                        subaccountHierarchy.length > 0
                          ? String(subaccountHierarchy.length)
                          : String(subaccounts.length),
                    },
                    { label: "Services", value: String(services.length) },
                    {
                      label: "Currency",
                      value: globalAccount?.currency || currency,
                    },
                  ].map((m) => (
                    <div key={m.label} className="px-4 py-3">
                      <p className="text-[10px] text-[#94A3B8] mb-0.5">
                        {m.label}
                      </p>
                      <p
                        className={`text-sm font-black ${m.accent ? "text-[#0070F2]" : "text-[#0F172A] dark:text-white"}`}
                      >
                        {m.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Directories */}
              {loading ? (
                <Skeleton className="h-40 w-full rounded-2xl" />
              ) : (
                <>
                  {directoriesWithCosts.length > 0 && (
                    <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9] dark:border-[#1a2744]">
                        <div className="flex items-center gap-2">
                          <FolderTree className="w-3.5 h-3.5 text-[#0070F2]" />
                          <span className="text-xs font-bold text-[#94A3B8] tracking-wider">
                            Directories ({directoriesWithCosts.length})
                          </span>
                        </div>
                        <span className="text-[10px] text-[#94A3B8]">
                          Click to drill in →
                        </span>
                      </div>
                      <div className="divide-y divide-[#F1F5F9] dark:divide-[#1a2744]">
                        {directoriesWithCosts.map((dir, i) => {
                          const pct =
                            totalCost > 0 ? (dir.cost / totalCost) * 100 : 0;
                          return (
                            <button
                              key={dir.guid ?? i}
                              onClick={() => {
                                setDrillDir(dir);
                                setDrillSub(null);
                              }}
                              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] dark:hover:bg-[#121A2F] transition-colors text-left group"
                            >
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                                style={{
                                  backgroundColor: `${SAP_COLORS[i % SAP_COLORS.length]}18`,
                                }}
                              >
                                <FolderTree
                                  className="w-3.5 h-3.5"
                                  style={{
                                    color: SAP_COLORS[i % SAP_COLORS.length],
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-[#0F172A] dark:text-white truncate">
                                    {dir.displayName || dir.guid}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-[#E2E8F0] dark:border-[#1a2744] text-[#94A3B8] shrink-0">
                                    {dir.subaccounts.length} subaccts
                                  </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-[#F1F5F9] dark:bg-[#1a2744] overflow-hidden w-full max-w-xs">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${pct}%`,
                                      backgroundColor:
                                        SAP_COLORS[i % SAP_COLORS.length],
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-black text-[#0F172A] dark:text-white">
                                  {formatCurrency(dir.cost, currency)}
                                </p>
                                <p className="text-[10px] text-[#94A3B8]">
                                  {pct.toFixed(1)}% of total
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#0070F2] transition-colors shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Direct subaccounts (no directory) */}
                  {orphanSubs.length > 0 && (
                    <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
                      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F1F5F9] dark:border-[#1a2744]">
                        <Network className="w-3.5 h-3.5 text-[#94A3B8]" />
                        <span className="text-xs font-bold text-[#94A3B8] tracking-wider">
                          Direct Sub-Accounts - No Directory (
                          {orphanSubs.length})
                        </span>
                      </div>
                      <div className="divide-y divide-[#F1F5F9] dark:divide-[#1a2744]">
                        {orphanSubs.map((sub, i) => {
                          const pct =
                            totalCost > 0 ? (sub.cost / totalCost) * 100 : 0;
                          const cisMeta =
                            subaccountHierarchy.find(
                              (h) => h.guid === sub.guid,
                            ) ?? sub;
                          return (
                            <button
                              key={sub.guid ?? i}
                              onClick={() => {
                                setDrillDir({
                                  displayName: "Direct (No Directory)",
                                  subaccounts: orphanSubs,
                                  cost: orphanSubs.reduce(
                                    (s, x) => s + x.cost,
                                    0,
                                  ),
                                  guid: "__orphan__",
                                });
                                setDrillSub({ ...sub, ...cisMeta });
                              }}
                              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F8FAFC] dark:hover:bg-[#121A2F] transition-colors text-left group"
                            >
                              <div
                                className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                                style={{
                                  backgroundColor:
                                    SAP_COLORS[i % SAP_COLORS.length],
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold text-[#475569] dark:text-[#CBD5E1] truncate block">
                                  {sub.displayName || sub.guid}
                                </span>
                                <span className="text-[10px] text-[#94A3B8]">
                                  {cisMeta.region ? getBtpRegionLabel(cisMeta.region) : "—"}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-[#0F172A] dark:text-white">
                                {formatCurrency(sub.cost, currency)}
                              </span>
                              <span className="text-[10px] text-[#94A3B8] w-10 text-right">
                                {pct.toFixed(1)}%
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1] group-hover:text-[#0070F2] shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* COST_API fallback when no CIS */}
                  {!cisSucceeded && subaccounts.length > 0 && (
                    <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
                      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F1F5F9] dark:border-[#1a2744]">
                        <Layers className="w-3.5 h-3.5 text-[#94A3B8]" />
                        <span className="text-xs font-bold text-[#94A3B8] tracking-wider">
                          Sub-Accounts — Cost_Api ({subaccounts.length})
                        </span>
                      </div>
                      <div className="divide-y divide-[#F1F5F9] dark:divide-[#1a2744]">
                        {subaccounts.map((s, i) => {
                          const pct =
                            totalCost > 0 ? (s.cost / totalCost) * 100 : 0;
                          return (
                            <div
                              key={i}
                              className="flex items-center gap-3 px-5 py-3"
                            >
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{
                                  backgroundColor:
                                    SAP_COLORS[i % SAP_COLORS.length],
                                }}
                              />
                              <span className="text-xs text-[#475569] dark:text-[#CBD5E1] flex-1 truncate">
                                {s.name}
                              </span>
                              <span className="text-xs font-bold text-[#0F172A] dark:text-white">
                                {formatCurrency(s.cost, currency)}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <div className="w-16 h-1.5 rounded-full bg-[#F1F5F9] dark:bg-[#1a2744] overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${pct}%`,
                                      backgroundColor:
                                        SAP_COLORS[i % SAP_COLORS.length],
                                    }}
                                  />
                                </div>
                                <span className="text-[10px] text-[#94A3B8] w-9 text-right">
                                  {pct.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Region breakdown */}
                  {regionBreakdown.length > 0 && (
                    <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
                      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F1F5F9] dark:border-[#1a2744]">
                        <MapPin className="w-3.5 h-3.5 text-[#0070F2]" />
                        <span className="text-xs font-bold text-[#94A3B8] tracking-wider">
                          Region Breakdown
                        </span>
                        <span className="ml-auto text-[10px] text-[#94A3B8]">
                          {regionBreakdown.length} region
                          {regionBreakdown.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex flex-col lg:flex-row">
                        {/* Left: region list with scroll */}
                        <div
                          className="flex-1 min-w-0 divide-y divide-[#F1F5F9] dark:divide-[#1a2744] overflow-y-auto"
                          style={{ maxHeight: 260 }}
                        >
                          {regionBreakdown.map((r, i) => {
                            const regionTotal = regionBreakdown.reduce(
                              (s, x) => s + x.cost,
                              0,
                            );
                            const pct =
                              regionTotal > 0
                                ? (r.cost / regionTotal) * 100
                                : 0;
                            const label = getBtpRegionLabel(r.region);
                            return (
                              <div
                                key={r.region}
                                className="flex items-center gap-3 px-5 py-3"
                              >
                                <div
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{
                                    backgroundColor:
                                      SAP_COLORS[i % SAP_COLORS.length],
                                  }}
                                />
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-xs font-semibold text-[#475569] dark:text-[#CBD5E1] truncate leading-tight">
                                    {label}
                                  </span>
                                  <span className="text-[10px] text-[#94A3B8] font-mono leading-tight">
                                    {r.region}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="hidden sm:flex items-center gap-1.5">
                                    <div className="w-20 h-1.5 rounded-full bg-[#F1F5F9] dark:bg-[#1a2744] overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                          width: `${pct}%`,
                                          backgroundColor:
                                            SAP_COLORS[i % SAP_COLORS.length],
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold text-[#0F172A] dark:text-white w-20 text-right">
                                    {formatCurrency(r.cost, currency)}
                                  </span>
                                  <span className="text-[10px] text-[#94A3B8] w-9 text-right">
                                    {pct.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Right: pie chart with legend */}
                        <div className="lg:w-64 flex flex-col items-center justify-center p-5 border-t lg:border-t-0 lg:border-l border-[#F1F5F9] dark:border-[#1a2744] shrink-0">
                          <ResponsiveContainer width="100%" height={170}>
                            <PieChart>
                              <Pie
                                data={regionBreakdown.map((r, i) => ({
                                  name: getBtpRegionLabel(r.region),
                                  code: r.region,
                                  value: r.cost,
                                  color: SAP_COLORS[i % SAP_COLORS.length],
                                }))}
                                cx="50%"
                                cy="50%"
                                innerRadius={42}
                                outerRadius={68}
                                paddingAngle={
                                  regionBreakdown.length > 1 ? 3 : 0
                                }
                                dataKey="value"
                              >
                                {regionBreakdown.map((_, i) => (
                                  <Cell
                                    key={i}
                                    fill={SAP_COLORS[i % SAP_COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (!active || !payload?.length) return null;
                                  const d = payload[0];
                                  return (
                                    <div className="bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-xl shadow-xl p-3 text-xs">
                                      <p className="font-bold text-[#0F172A] dark:text-white mb-0.5">
                                        {d.name}
                                      </p>
                                      <p className="text-[10px] text-[#94A3B8] font-mono mb-1">
                                        {d.payload.code}
                                      </p>
                                      <p
                                        style={{ color: d.payload.color }}
                                        className="font-semibold"
                                      >
                                        {formatCurrency(d.value, currency)}
                                      </p>
                                    </div>
                                  );
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          {/* Compact legend */}
                          <div
                            className="w-full space-y-1 mt-1 overflow-y-auto"
                            style={{ maxHeight: 80 }}
                          >
                            {regionBreakdown.map((r, i) => (
                              <div
                                key={r.region}
                                className="flex items-center gap-1.5"
                              >
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{
                                    backgroundColor:
                                      SAP_COLORS[i % SAP_COLORS.length],
                                  }}
                                />
                                <span className="text-[10px] text-[#475569] dark:text-[#94A3B8] truncate flex-1">
                                  {getBtpRegionLabel(r.region)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ══════════════════ LEVEL 1 — Directory ══════════════════ */}
          {drillDir && !drillSub && (
            <>
              {/* Directory header card */}
              <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
                <div className="flex items-center gap-3 p-5 border-b border-[#F1F5F9] dark:border-[#1a2744]">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#0070F2]/30 bg-[#0070F2]/5 text-[#0070F2] shrink-0">
                    <FolderTree className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-[#94A3B8] font-semibold  tracking-wider">
                      Directory
                    </p>
                    <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                      {drillDir.displayName}
                    </h2>
                  </div>
                  <p className="text-xl font-black text-[#0070F2] shrink-0">
                    {formatCurrency(drillDir.cost, currency)}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-[#F1F5F9] dark:divide-[#1a2744]">
                  {[
                    {
                      label: "Directory MTD Cost",
                      value: formatCurrency(drillDir.cost, currency),
                      accent: true,
                    },
                    {
                      label: "% of Global Account",
                      value:
                        totalCost > 0
                          ? `${((drillDir.cost / totalCost) * 100).toFixed(1)}%`
                          : "—",
                    },
                    {
                      label: "Subaccounts",
                      value: String(drillDir.subaccounts?.length ?? 0),
                    },
                    {
                      label: "Active Services",
                      value: String(
                        new Set(
                          (drillDir.subaccounts ?? []).flatMap((sub) => {
                            const sa = servicesBySubaccount.find(
                              (s) =>
                                s.subaccountId === sub.guid ||
                                s.subaccountName?.toLowerCase() ===
                                  sub.displayName?.toLowerCase(),
                            );
                            return (sa?.services ?? []).map((sv) => sv.name);
                          }),
                        ).size,
                      ),
                    },
                  ].map((m) => (
                    <div key={m.label} className="px-4 py-3">
                      <p className="text-[10px] text-[#94A3B8] mb-0.5">
                        {m.label}
                      </p>
                      <p
                        className={`text-sm font-black ${m.accent ? "text-[#0070F2]" : "text-[#0F172A] dark:text-white"}`}
                      >
                        {m.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subaccounts table */}
              <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9] dark:border-[#1a2744]">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-[#0070F2]" />
                    <span className="text-xs font-bold text-[#94A3B8] tracking-wider">
                      Sub-Accounts ({drillDir.subaccounts?.length ?? 0})
                    </span>
                  </div>
                  <span className="text-[10px] text-[#94A3B8]">
                    Click to see services →
                  </span>
                </div>
                {(drillDir.subaccounts ?? []).length === 0 ? (
                  <p className="text-sm text-[#94A3B8] text-center py-10">
                    No subaccounts in this directory
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[480px]">
                      <thead>
                        <tr className="border-b border-[#F1F5F9] dark:border-[#1a2744] bg-[#F8FAFC] dark:bg-[#0d1526]">
                          <th className="text-left font-bold text-[#94A3B8] px-5 py-2.5">
                            Subaccount
                          </th>
                          <th className="text-left font-bold text-[#94A3B8] px-3 py-2.5">
                            Region
                          </th>
                          <th className="text-left font-bold text-[#94A3B8] px-3 py-2.5">
                            State
                          </th>
                          <th className="text-left font-bold text-[#94A3B8] px-3 py-2.5">
                            Env Type
                          </th>
                          <th className="text-right font-bold text-[#94A3B8] px-3 py-2.5">
                            Services
                          </th>
                          <th className="text-right font-bold text-[#94A3B8] px-5 py-2.5">
                            MTD Cost
                          </th>
                          <th className="w-4 py-2.5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#1a2744]">
                        {(drillDir.subaccounts ?? []).map((sub, i) => {
                          const cisMeta =
                            subaccountHierarchy.find(
                              (h) => h.guid === sub.guid,
                            ) ?? sub;
                          const subCost =
                            sub.cost ?? getCisCost(sub.displayName);
                          const subSvcs = servicesBySubaccount.find(
                            (s) =>
                              s.subaccountId === sub.guid ||
                              s.subaccountName?.toLowerCase() ===
                                sub.displayName?.toLowerCase(),
                          );
                          const svcCount = subSvcs?.services?.length ?? 0;
                          const pct =
                            drillDir.cost > 0
                              ? (subCost / drillDir.cost) * 100
                              : 0;
                          return (
                            <tr
                              key={sub.guid ?? i}
                              className="hover:bg-[#F8FAFC] dark:hover:bg-[#121A2F] cursor-pointer group transition-colors"
                              onClick={() =>
                                setDrillSub({
                                  ...sub,
                                  ...cisMeta,
                                  cost: subCost,
                                })
                              }
                            >
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{
                                      backgroundColor:
                                        SAP_COLORS[i % SAP_COLORS.length],
                                    }}
                                  />
                                  <div>
                                    <p
                                      className="font-semibold text-[#475569] dark:text-[#CBD5E1] truncate max-w-[180px]"
                                      title={sub.displayName}
                                    >
                                      {sub.displayName || sub.guid}
                                    </p>
                                    {cisMeta.subdomain && (
                                      <p className="text-[10px] text-[#94A3B8] font-mono truncate max-w-[180px]">
                                        {cisMeta.subdomain}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-[#94A3B8]">
                                {cisMeta.region ? getBtpRegionLabel(cisMeta.region) : "—"}
                              </td>
                              <td className="px-3 py-3">
                                {cisMeta.state ? (
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${cisMeta.state === "OK" || cisMeta.state === "ACTIVE" ? "border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400" : "border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400"}`}
                                  >
                                    {cisMeta.state}
                                  </span>
                                ) : (
                                  <span className="text-[#CBD5E1]">—</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-[#94A3B8]">
                                {cisMeta.environmentType ||
                                  cisMeta.licenseType ||
                                  "—"}
                              </td>
                              <td className="px-3 py-3 text-right">
                                {svcCount > 0 ? (
                                  <span className="font-bold text-[#475569] dark:text-[#CBD5E1]">
                                    {svcCount}
                                  </span>
                                ) : (
                                  <span className="text-[#CBD5E1]">—</span>
                                )}
                              </td>
                              <td className="px-5 py-3 text-right">
                                <p className="font-black text-[#0F172A] dark:text-white">
                                  {formatCurrency(subCost, currency)}
                                </p>
                                <div className="flex items-center justify-end gap-1 mt-1">
                                  <div className="w-14 h-1 rounded-full bg-[#F1F5F9] dark:bg-[#1a2744] overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${pct}%`,
                                        backgroundColor:
                                          SAP_COLORS[i % SAP_COLORS.length],
                                      }}
                                    />
                                  </div>
                                  <span className="text-[9px] text-[#94A3B8]">
                                    {pct.toFixed(0)}%
                                  </span>
                                </div>
                              </td>
                              <td className="pr-4 py-3">
                                <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1] group-hover:text-[#0070F2]" />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-[#E2E8F0] dark:border-[#1a2744] bg-[#F8FAFC] dark:bg-[#0d1526]">
                          <td
                            colSpan={5}
                            className="px-5 py-2.5 text-xs font-bold text-[#94A3B8]"
                          >
                            Directory Total
                          </td>
                          <td className="px-5 py-2.5 text-right font-black text-[#0070F2]">
                            {formatCurrency(drillDir.cost, currency)}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Region breakdown in directory */}
              {(() => {
                const rMap = new Map();
                for (const sub of drillDir.subaccounts ?? []) {
                  const meta =
                    subaccountHierarchy.find((h) => h.guid === sub.guid) ?? sub;
                  const r = meta.region || "Unknown";
                  rMap.set(
                    r,
                    (rMap.get(r) ?? 0) +
                      (sub.cost ?? getCisCost(sub.displayName)),
                  );
                }
                const rows = Array.from(rMap.entries())
                  .map(([region, cost]) => ({ region, cost }))
                  .sort((a, b) => b.cost - a.cost);
                if (rows.length <= 1) return null;
                return (
                  <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F1F5F9] dark:border-[#1a2744]">
                      <MapPin className="w-3.5 h-3.5 text-[#0070F2]" />
                      <span className="text-xs font-bold text-[#94A3B8] tracking-wider">
                        REGIONS IN THIS DIRECTORY
                      </span>
                    </div>
                    <div className="divide-y divide-[#F1F5F9] dark:divide-[#1a2744]">
                      {rows.map((r, i) => {
                        const pct =
                          drillDir.cost > 0
                            ? (r.cost / drillDir.cost) * 100
                            : 0;
                        return (
                          <div
                            key={r.region}
                            className="flex items-center gap-3 px-5 py-3"
                          >
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  SAP_COLORS[i % SAP_COLORS.length],
                              }}
                            />
                            <div className="flex items-center gap-1 min-w-0 flex-1">
                              <MapPin className="w-3 h-3 text-[#94A3B8] shrink-0" />
                              <span className="text-xs text-[#475569] dark:text-[#CBD5E1] truncate">
                                {r.region}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-[#0F172A] dark:text-white">
                              {formatCurrency(r.cost, currency)}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="w-16 h-1.5 rounded-full bg-[#F1F5F9] dark:bg-[#1a2744] overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor:
                                      SAP_COLORS[i % SAP_COLORS.length],
                                  }}
                                />
                              </div>
                              <span className="text-[10px] text-[#94A3B8] w-9 text-right">
                                {pct.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </>
          )}

          {/* ══════════════════ LEVEL 2 — Subaccount ══════════════════ */}
          {drillSub && (
            <>
              {/* Subaccount header */}
              <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
                <div className="flex items-start gap-3 p-5 border-b border-[#F1F5F9] dark:border-[#1a2744]">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#0070F2]/30 bg-[#0070F2]/5 text-[#0070F2] shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-[#94A3B8] font-semibold  tracking-wider">
                      Subaccount
                    </p>
                    <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                      {drillSub.displayName || drillSub.guid}
                    </h2>
                    {drillSub.description && (
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        {drillSub.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <p className="text-xl font-black text-[#0070F2]">
                      {formatCurrency(drillSub.cost ?? 0, currency)}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {drillSub.state && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${drillSub.state === "OK" || drillSub.state === "ACTIVE" ? "border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400" : "border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400"}`}
                        >
                          {drillSub.state}
                        </span>
                      )}
                      {drillSub.licenseType && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#0070F2]/40 text-[#0070F2]">
                          {drillSub.licenseType}
                        </span>
                      )}
                      {drillSub.environmentType && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
                          {drillSub.environmentType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Metadata grid — always show all fields, "—" for empty */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-[#F1F5F9] dark:divide-[#1a2744]">
                  {[
                    {
                      label: "MTD Cost",
                      value: formatCurrency(drillSub.cost ?? 0, currency),
                      accent: true,
                    },
                    { label: "Region", value: drillSub.region ? getBtpRegionLabel(drillSub.region) : "—" },
                    { label: "Directory", value: drillDir?.displayName || "—" },
                    { label: "State", value: drillSub.state || "—" },
                    {
                      label: "Subdomain",
                      value: drillSub.subdomain || "—",
                      mono: true,
                    },
                    {
                      label: "Technical Name",
                      value: drillSub.technicalName || "—",
                      mono: true,
                    },
                    {
                      label: "License Type",
                      value: drillSub.licenseType || "—",
                    },
                    {
                      label: "Environment",
                      value: drillSub.environmentType || "—",
                    },
                  ].map((m) => (
                    <div key={m.label} className="px-4 py-3">
                      <p className="text-[10px] text-[#94A3B8] mb-0.5">
                        {m.label}
                      </p>
                      <p
                        className={`text-xs font-bold truncate ${m.accent ? "text-[#0070F2]" : "text-[#0F172A] dark:text-white"} ${m.mono ? "font-mono" : ""}`}
                        title={m.value}
                      >
                        {m.value}
                      </p>
                    </div>
                  ))}
                </div>
                {/* GUID row */}
                <div className="px-5 py-2.5 border-t border-[#F1F5F9] dark:border-[#1a2744] flex items-center gap-2">
                  <span className="text-[10px] text-[#94A3B8]">GUID:</span>
                  <span className="text-[10px] font-mono text-[#475569] dark:text-[#CBD5E1]">
                    {drillSub.guid || "—"}
                  </span>
                </div>
              </div>

              {/* Services / Instances — LEVEL 3 */}
              <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9] dark:border-[#1a2744]">
                  <div className="flex items-center gap-2">
                    <Server className="w-3.5 h-3.5 text-[#0070F2]" />
                    <span className="text-xs font-bold text-[#94A3B8] tracking-wider">
                      {drillSubServices.length > 0
                        ? `Services / Instanes (${drillSubServices.length})`
                        : "Services / Instanes"}
                    </span>
                  </div>
                  {drillSubServices.length > 0 && (
                    <span className="text-xs font-black text-[#0070F2]">
                      Total:{" "}
                      {formatCurrency(
                        drillSubServices.reduce((s, x) => s + x.cost, 0),
                        currency,
                      )}
                    </span>
                  )}
                </div>

                {drillSubServices.length === 0 ? (
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-transparent border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2.5">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        No per-subaccount service data in snapshot. Sync to
                        reload — or showing global services as reference.
                      </span>
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#F1F5F9] dark:border-[#1a2744]">
                          <th className="text-left font-bold text-[#94A3B8] pb-2">
                            Service
                          </th>
                          <th className="text-right font-bold text-[#94A3B8] pb-2">
                            Cost
                          </th>
                          <th className="text-right font-bold text-[#94A3B8] pb-2 w-12">
                            Share
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#1a2744]">
                        {services.slice(0, 10).map((s, i) => {
                          const pct =
                            totalCost > 0 ? (s.cost / totalCost) * 100 : 0;
                          return (
                            <tr
                              key={i}
                              className="hover:bg-[#F8FAFC] dark:hover:bg-[#121A2F]"
                            >
                              <td className="py-2">
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{
                                      backgroundColor:
                                        SAP_COLORS[i % SAP_COLORS.length],
                                    }}
                                  />
                                  <span className="text-[#475569] dark:text-[#CBD5E1] truncate max-w-[200px]">
                                    {s.name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 text-right font-bold text-[#0F172A] dark:text-white">
                                {formatCurrency(s.cost, currency)}
                              </td>
                              <td className="py-2 text-right text-[10px] text-[#94A3B8]">
                                {pct.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[520px]">
                      <thead>
                        <tr className="border-b border-[#F1F5F9] dark:border-[#1a2744] bg-[#F8FAFC] dark:bg-[#0d1526]">
                          <th className="text-left font-bold text-[#94A3B8] px-5 py-2.5">
                            Service / Instance
                          </th>
                          <th className="text-left font-bold text-[#94A3B8] px-3 py-2.5">
                            Plan
                          </th>
                          <th className="text-right font-bold text-[#94A3B8] px-3 py-2.5">
                            Usage
                          </th>
                          <th className="text-right font-bold text-[#94A3B8] px-3 py-2.5">
                            MTD Cost
                          </th>
                          <th className="text-right font-bold text-[#94A3B8] px-5 py-2.5">
                            Share
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#1a2744]">
                        {drillSubServices.map((s, i) => {
                          const subTotal = drillSubServices.reduce(
                            (sum, x) => sum + x.cost,
                            0,
                          );
                          const pct =
                            subTotal > 0 ? (s.cost / subTotal) * 100 : 0;
                          return (
                            <tr
                              key={i}
                              className="hover:bg-[#F8FAFC] dark:hover:bg-[#121A2F]"
                            >
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{
                                      backgroundColor:
                                        SAP_COLORS[i % SAP_COLORS.length],
                                    }}
                                  />
                                  <span
                                    className="font-semibold text-[#475569] dark:text-[#CBD5E1] truncate max-w-[200px]"
                                    title={s.name}
                                  >
                                    {s.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                {s.planName ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded border border-[#CBD5E1] dark:border-[#475569] text-[#94A3B8] font-mono">
                                    {s.planName}
                                  </span>
                                ) : (
                                  <span className="text-[#CBD5E1]">—</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-right font-mono text-[#94A3B8]">
                                {s.usage > 0
                                  ? `${s.usage % 1 === 0 ? s.usage.toLocaleString() : s.usage.toFixed(3)}${s.unit ? ` ${s.unit}` : ""}`
                                  : "—"}
                              </td>
                              <td className="px-3 py-3 text-right font-black text-[#0F172A] dark:text-white">
                                {formatCurrency(s.cost, currency)}
                              </td>
                              <td className="px-5 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-1.5 rounded-full bg-[#F1F5F9] dark:bg-[#1a2744] overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${pct}%`,
                                        backgroundColor:
                                          SAP_COLORS[i % SAP_COLORS.length],
                                      }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-[#94A3B8] w-8 text-right">
                                    {pct.toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-[#E2E8F0] dark:border-[#1a2744] bg-[#F8FAFC] dark:bg-[#0d1526]">
                          <td
                            colSpan={3}
                            className="px-5 py-2.5 text-xs font-bold text-[#94A3B8]"
                          >
                            Subaccount Total
                          </td>
                          <td className="px-3 py-2.5 text-right font-black text-[#0070F2]">
                            {formatCurrency(
                              drillSubServices.reduce((s, x) => s + x.cost, 0),
                              currency,
                            )}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Service Manager Instances ──────────────────── */}
              <SmInstancesPanel
                smConfig={smConfig}
                smInstances={smInstances}
                smLoading={smLoading}
                smRefreshing={smRefreshing}
                smError={smError}
                smSyncMsg={smSyncMsg}
                onConfigure={() => setShowSmModal(true)}
                onRefresh={handleSmRefresh}
              />

              {/* SM config modal */}
              {showSmModal && drillSub && (
                <BtpServiceManagerModal
                  btpAccountId={accountId}
                  subaccount={{ id: drillSub.guid, displayName: drillSub.displayName ?? drillSub.name, subdomain: drillSub.subdomain ?? null }}
                  onClose={() => setShowSmModal(false)}
                  onSaved={handleSmSaved}
                />
              )}

              {/* Other subaccounts in same directory */}
              {drillDir &&
                (
                  drillDir.subaccounts?.filter(
                    (s) => s.guid !== drillSub.guid,
                  ) ?? []
                ).length > 0 && (
                  <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F1F5F9] dark:border-[#1a2744]">
                      <Layers className="w-3.5 h-3.5 text-[#94A3B8]" />
                      <span className="text-xs font-bold text-[#94A3B8] tracking-wider">
                        Other Sub-Accounts In "{drillDir.displayName}"
                      </span>
                    </div>
                    <div className="divide-y divide-[#F1F5F9] dark:divide-[#1a2744]">
                      {(
                        drillDir.subaccounts?.filter(
                          (s) => s.guid !== drillSub.guid,
                        ) ?? []
                      ).map((sub, i) => {
                        const cisMeta =
                          subaccountHierarchy.find(
                            (h) => h.guid === sub.guid,
                          ) ?? sub;
                        const subCost = sub.cost ?? getCisCost(sub.displayName);
                        const pct =
                          drillDir.cost > 0
                            ? (subCost / drillDir.cost) * 100
                            : 0;
                        return (
                          <button
                            key={sub.guid ?? i}
                            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F8FAFC] dark:hover:bg-[#121A2F] transition-colors text-left group"
                            onClick={() =>
                              setDrillSub({ ...sub, ...cisMeta, cost: subCost })
                            }
                          >
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  SAP_COLORS[(i + 1) % SAP_COLORS.length],
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#475569] dark:text-[#CBD5E1] truncate">
                                {sub.displayName || sub.guid}
                              </p>
                              <p className="text-[10px] text-[#94A3B8]">
                                {cisMeta.region ? getBtpRegionLabel(cisMeta.region) : "—"} · {cisMeta.state || "—"}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-[#0F172A] dark:text-white">
                              {formatCurrency(subCost, currency)}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="w-14 h-1 rounded-full bg-[#F1F5F9] dark:bg-[#1a2744] overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor:
                                      SAP_COLORS[(i + 1) % SAP_COLORS.length],
                                  }}
                                />
                              </div>
                              <span className="text-[10px] text-[#94A3B8] w-8 text-right">
                                {pct.toFixed(0)}%
                              </span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1] group-hover:text-[#0070F2] shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TECHNICAL TAB
      ══════════════════════════════════════════════════ */}
      {activeTab === "technical" && (
        <div className="space-y-5">
          <Section
            title="Monthly Cost Trend"
            subtitle="Month-by-month BTP cost accumulation"
            icon={Activity}
          >
            {loading ? (
              <Skeleton className="h-52 w-full" />
            ) : dailyCosts.length === 0 ? (
              <p className="text-sm text-[#94A3B8] text-center py-10">
                No cost data available — sync to populate
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={dailyCosts}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="btpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0070F2" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0070F2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E2E8F0"
                    className="dark:stroke-[#1a2744]"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(d) => d?.slice(0, 7)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v.toFixed(0)}`}
                  />
                  <Tooltip content={<CurrencyTooltip currency={currency} />} />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    name="Monthly Cost"
                    stroke="#0070F2"
                    strokeWidth={2.5}
                    fill="url(#btpGrad)"
                    dot={{ fill: "#0070F2", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Section
              title={`All Services (${services.length})`}
              subtitle="Complete service-level cost breakdown"
              icon={Server}
            >
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : services.length === 0 ? (
                <p className="text-sm text-[#94A3B8] text-center py-10">
                  No services data — sync to populate
                </p>
              ) : (
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-white dark:bg-[#0B1023]">
                      <tr className="border-b border-[#E2E8F0] dark:border-[#1a2744]">
                        <th className="text-left font-bold text-[#94A3B8] pb-2 w-6">
                          #
                        </th>
                        <th className="text-left font-bold text-[#94A3B8] pb-2 pl-2">
                          Service
                        </th>
                        <th className="text-right font-bold text-[#94A3B8] pb-2">
                          Cost
                        </th>
                        <th className="text-right font-bold text-[#94A3B8] pb-2 w-14">
                          Share
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#1a2744]">
                      {services.map((s, i) => {
                        const pct =
                          totalCost > 0 ? (s.cost / totalCost) * 100 : 0;
                        // Find subaccounts using this service from servicesBySubaccount
                        const saCount = servicesBySubaccount.filter((sa) =>
                          sa.services.some((sv) => sv.name === s.name),
                        ).length;
                        return (
                          <tr
                            key={i}
                            className="hover:bg-[#F8FAFC] dark:hover:bg-[#121A2F]"
                          >
                            <td className="py-2 text-[10px] text-[#CBD5E1] w-6">
                              {i + 1}
                            </td>
                            <td className="py-2 pl-2">
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{
                                    backgroundColor:
                                      SAP_COLORS[i % SAP_COLORS.length],
                                  }}
                                />
                                <div>
                                  <span
                                    className="text-[#475569] dark:text-[#CBD5E1] max-w-[180px] truncate block"
                                    title={s.name}
                                  >
                                    {s.name}
                                  </span>
                                  {saCount > 0 && (
                                    <span className="text-[9px] text-[#94A3B8]">
                                      {saCount} subaccount
                                      {saCount !== 1 ? "s" : ""}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-2 text-right font-semibold text-[#0F172A] dark:text-white">
                              {formatCurrency(s.cost, currency)}
                            </td>
                            <td className="py-2 text-right">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pct > 30 ? "border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400" : "text-[#94A3B8]"}`}
                              >
                                {totalCost > 0 ? `${pct.toFixed(1)}%` : "—"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            <div className="space-y-5">
              <Section
                title="Cost Forecast"
                subtitle="Projected spend next 3 months"
                icon={TrendingUp}
              >
                {loading ? (
                  <Skeleton className="h-36 w-full" />
                ) : forecastData.length === 0 ? (
                  <p className="text-sm text-[#94A3B8] text-center py-8">
                    Insufficient data for forecast
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {forecastData.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-xl border border-[#E2E8F0] dark:border-[#1a2744]"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <div>
                            <p className="text-sm font-semibold text-[#475569] dark:text-[#94A3B8]">
                              {f.month}
                            </p>
                            <p className="text-[10px] text-[#94A3B8]">
                              {i === 0
                                ? "Current month projection"
                                : i === 1
                                  ? "Next month estimate"
                                  : "2 months ahead"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#0F172A] dark:text-white">
                            {formatCurrency(f.projected_cost, currency)}
                          </p>
                          {i === 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400">
                              Current
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-[#F8FAFC] dark:bg-[#0B1023] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span className="text-xs font-bold text-[#94A3B8] tracking-wider">
                    Snapshot & API Metrics
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    {
                      label: "COST_API",
                      value: account?.targetUrl ? "Connected" : "—",
                    },
                    {
                      label: "CIS_Central",
                      value: cisSucceeded ? "Connected" : "Not configured",
                    },
                    {
                      label: "Subaccounts w/ Services",
                      value: String(servicesBySubaccount.length),
                    },
                    { label: "Currency", value: currency },
                    {
                      label: "Monthly Samples",
                      value: String(dailyCosts.length),
                    },
                    { label: "Services Count", value: String(services.length) },
                    {
                      label: "Environments",
                      value: String(environments.length),
                    },
                    { label: "Subaccounts", value: String(subaccounts.length) },
                    {
                      label: "Directories (CIS)",
                      value: String(directoriesWithCosts.length),
                    },
                    { label: "History Months", value: String(yearly.length) },
                    { label: "Snapshot TTL", value: "1 hour" },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="flex justify-between gap-2 py-0.5 border-b border-[#F1F5F9] dark:border-[#1a2744] last:border-0"
                    >
                      <span className="text-[#94A3B8]">{m.label}</span>
                      <span
                        className={`font-semibold truncate text-right ${m.value === "Connected" ? "text-emerald-600 dark:text-emerald-400" : m.value === "Not configured" ? "text-amber-500" : "text-[#0F172A] dark:text-white"}`}
                      >
                        {loading ? "—" : m.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Per-subaccount service breakdown table */}
          {!loading && servicesBySubaccount.length > 0 && (
            <Section
              title={`Cost by Subaccount × Service (${servicesBySubaccount.length} subaccounts)`}
              subtitle="COST_API service rows grouped per subaccount — plan names and usage included"
              icon={Layers}
            >
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {servicesBySubaccount.map((sa, si) => {
                  const saShare =
                    totalCost > 0 ? (sa.totalCost / totalCost) * 100 : 0;
                  return (
                    <div
                      key={sa.subaccountId}
                      className="rounded-xl border border-[#E2E8F0] dark:border-[#1a2744] overflow-hidden"
                    >
                      {/* Subaccount header */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#121A2F] border-b border-[#E2E8F0] dark:border-[#1a2744]">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                SAP_COLORS[si % SAP_COLORS.length],
                            }}
                          />
                          <span className="text-xs font-bold text-[#475569] dark:text-[#CBD5E1]">
                            {sa.subaccountName}
                          </span>
                          <span className="text-[10px] text-[#94A3B8] font-mono">
                            {sa.subaccountId?.slice(0, 8)}…
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 rounded-full bg-[#E2E8F0] dark:bg-[#1a2744] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${saShare}%`,
                                backgroundColor:
                                  SAP_COLORS[si % SAP_COLORS.length],
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-[#94A3B8]">
                            {saShare.toFixed(1)}%
                          </span>
                          <span className="text-xs font-black text-[#0070F2]">
                            {formatCurrency(sa.totalCost, currency)}
                          </span>
                        </div>
                      </div>
                      {/* Services in this subaccount */}
                      <table className="w-full text-xs">
                        <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#1a2744]">
                          {sa.services.slice(0, 6).map((svc, svi) => {
                            const svcPct =
                              sa.totalCost > 0
                                ? (svc.cost / sa.totalCost) * 100
                                : 0;
                            return (
                              <tr
                                key={svi}
                                className="hover:bg-[#F8FAFC] dark:hover:bg-[#10182B]"
                              >
                                <td className="py-1.5 px-4">
                                  <div className="flex items-center gap-1.5">
                                    <div
                                      className="w-1 h-1 rounded-full shrink-0"
                                      style={{
                                        backgroundColor:
                                          SAP_COLORS[svi % SAP_COLORS.length],
                                      }}
                                    />
                                    <span
                                      className="text-[#475569] dark:text-[#CBD5E1] truncate max-w-[180px]"
                                      title={svc.name}
                                    >
                                      {svc.name}
                                    </span>
                                    {svc.planName && (
                                      <span className="text-[9px] px-1 py-0.5 rounded border border-[#CBD5E1] dark:border-[#475569] text-[#94A3B8] font-mono shrink-0">
                                        {svc.planName}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-1.5 px-2 text-right text-[#94A3B8] font-mono text-[10px]">
                                  {svc.usage > 0
                                    ? `${svc.usage % 1 === 0 ? svc.usage.toLocaleString() : svc.usage.toFixed(2)}${svc.unit ? ` ${svc.unit}` : ""}`
                                    : "—"}
                                </td>
                                <td className="py-1.5 pr-4 text-right font-semibold text-[#0F172A] dark:text-white">
                                  {formatCurrency(svc.cost, currency)}
                                </td>
                                <td className="py-1.5 pr-4 text-right text-[10px] text-[#94A3B8] w-10">
                                  {svcPct.toFixed(0)}%
                                </td>
                              </tr>
                            );
                          })}
                          {sa.services.length > 6 && (
                            <tr>
                              <td
                                colSpan={4}
                                className="py-1.5 px-4 text-[10px] text-[#94A3B8] italic"
                              >
                                +{sa.services.length - 6} more services
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  );
};

export default BtpCostPage;
