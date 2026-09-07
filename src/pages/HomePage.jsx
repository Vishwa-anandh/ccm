import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Legend,
  LabelList,
} from "recharts";
import {
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  Upload,
  Check,
  Cloud,
  X,
  Zap,
  BarChart2,
  Layers,
  ShieldCheck,
  Sparkles,
  Activity,
  BellRing,
  PiggyBank,
  DollarSign,
  Target,
  Calendar,
  Server,
  Plus,
  Info,
  ChevronRight,
  CalendarDays,
  Cpu,
  HardDrive,
  Database,
  AlertCircle,
  CheckCircle2,
  Bot,
  ArrowUpRight,
  ArrowDownRight,
  FileBarChart,
} from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useMspRates } from "../hooks/useMspRates";
import { formatCurrency } from "../utils/formatters";
import PropTypes from "prop-types";

/* ─────────────────────────────────────────────────────────
   UTILITY HOOKS
───────────────────────────────────────────────────────── */
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) {
      setValue(0);
      return;
    }
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      setValue(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
      else setValue(target);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

/* ─────────────────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────────────────── */
function Sk({ w = "w-full", h = "h-4", className = "" }) {
  return <div className={`skeleton rounded-lg ${w} ${h} ${className}`} />;
}
Sk.propTypes = {
  w: PropTypes.string,
  h: PropTypes.string,
  className: PropTypes.string,
};

/* ─────────────────────────────────────────────────────────
   CUSTOM CHART TOOLTIP
───────────────────────────────────────────────────────── */
function SpendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const spendEntry = payload.find((p) => p.dataKey === "spend");

  const PROVIDER_META = {
    azure: { label: "Azure", color: "#3B82F6" },
    aws: { label: "AWS", color: "#F97316" },
    btp: { label: "SAP BTP", color: "#10B981" },
    gcp: { label: "GCP", color: "#3b82f6" },
  };

  // Show per-provider actuals; fall back to total spend line
  const providerEntries = payload.filter(
    (p) => ["azure", "aws", "btp", "gcp"].includes(p.dataKey) && p.value != null,
  );
  const showTotal = providerEntries.length === 0 && spendEntry?.value != null;
  // Exclude all forecast/projection keys from tooltip — they're visible as dashed lines
  const entries = showTotal ? [spendEntry] : providerEntries;

  if (!entries.length) return null;
  return (
    <div className="bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-xl shadow-card px-3.5 py-2.5 text-xs min-w-[160px]">
      <div className="text-[#94A3B8] font-medium mb-1.5">{label}</div>
      {entries.map((p, i) => {
        const meta = PROVIDER_META[p.dataKey];
        const color = meta?.color ?? p.color;
        const name = meta?.label ?? p.name;
        return (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: color }}
              />
              <span className="text-[#475569] dark:text-[#94A3B8]">{name}</span>
            </div>
            <span className="font-bold text-[#0F172A] dark:text-white">
              {formatCurrency(p.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
SpendTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
};

/* ─────────────────────────────────────────────────────────
   WIZARD SUB-COMPONENTS
───────────────────────────────────────────────────────── */
function WizardStepDot({ active, done, label }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
          done
            ? "bg-emerald-500 border-emerald-500 text-white"
            : active
              ? "bg-[#2563EB] border-[#2563EB] text-white"
              : "bg-white dark:bg-[#0B1023] border-[#E2E8F0] dark:border-[#1a2744] text-[#94A3B8]"
        }`}
      >
        {done ? <Check size={13} /> : active ? "●" : "○"}
      </div>
      <span
        className={`text-[10px] font-semibold whitespace-nowrap ${
          active ? "text-[#2563EB]" : "text-[#94A3B8]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
WizardStepDot.propTypes = {
  active: PropTypes.bool,
  done: PropTypes.bool,
  label: PropTypes.string,
};

function UploadPanel({ label, fileKey, files, setFiles }) {
  const ref = useRef(null);
  const file = files[fileKey];
  return (
    <div>
      <label className="block text-xs font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5">
        {label}
      </label>
      <div
        onClick={() => ref.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 cursor-pointer transition-all ${
          file
            ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
            : "border-[#E2E8F0] dark:border-[#1a2744] hover:border-[#2563EB] hover:bg-[#EFF6FF] dark:hover:bg-[#2563EB]/5"
        }`}
      >
        {file ? (
          <>
            <Check size={18} className="text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-full px-2">
              {file.name}
            </span>
            <button
              className="absolute top-1.5 right-1.5 text-[#94A3B8] hover:text-red-500 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setFiles((f) => ({ ...f, [fileKey]: null }));
              }}
            >
              <X size={12} />
            </button>
          </>
        ) : (
          <>
            <Upload size={18} className="text-[#94A3B8]" />
            <span className="text-xs text-[#94A3B8]">
              Click to upload{" "}
              <span className="text-[#2563EB] font-semibold">PDF or CSV</span>
            </span>
          </>
        )}
        <input
          ref={ref}
          type="file"
          accept=".pdf,.csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files[0])
              setFiles((f) => ({ ...f, [fileKey]: e.target.files[0] }));
          }}
        />
      </div>
    </div>
  );
}
UploadPanel.propTypes = {
  label: PropTypes.string,
  fileKey: PropTypes.string,
  files: PropTypes.object,
  setFiles: PropTypes.func,
};

/* ─────────────────────────────────────────────────────────
   GET STARTED WIZARD  (named export — used by RecommendationsPage)
───────────────────────────────────────────────────────── */
export function GetStartedWizard({
  onClose,
  onConnected,
  allowConnectAzure = true,
  allowConnectAws = true,
  allowConnectBtp = true,
  allowConnectGcp = true,
}) {
  const [step, setStep] = useState(0);
  const [cloudType, setCloudType] = useState(null);
  const [azureForm, setAzureForm] = useState({
    name: "",
    subscriptionId: "",
    tenantId: "",
    clientId: "",
    clientSecret: "",
  });
  const [awsForm, setAwsForm] = useState({
    name: "",
    accessKeyId: "",
    secretAccessKey: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // UUID validation (Azure)
  const uuidRe =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  const handleConnect = async () => {
    setError("");
    // Client-side validation
    if (cloudType === "azure") {
      if (!uuidRe.test(azureForm.tenantId)) {
        setError("Invalid Tenant ID format. Must be a valid UUID.");
        return;
      }
      if (!uuidRe.test(azureForm.clientId)) {
        setError("Invalid Client ID format. Must be a valid UUID.");
        return;
      }
      if (!uuidRe.test(azureForm.subscriptionId)) {
        setError("Invalid Subscription ID format. Must be a valid UUID.");
        return;
      }
    } else {
      if (!/^(AKIA|ASIA)[A-Z0-9]{16}$/.test(awsForm.accessKeyId)) {
        setError(
          "Invalid Access Key ID. Should start with AKIA or ASIA and be 20 chars.",
        );
        return;
      }
      if (awsForm.secretAccessKey.length < 40) {
        setError(
          "Invalid Secret Access Key. Should be at least 40 characters.",
        );
        return;
      }
    }
    setSaving(true);
    try {
      if (cloudType === "azure") {
        await api.post("/azure/accounts", azureForm);
      } else {
        await api.post("/aws/accounts", {
          name: awsForm.name,
          accessKey: awsForm.accessKeyId,
          secretKey: awsForm.secretAccessKey,
        });
      }
      setStep(2);
      onConnected?.();
    } catch (e) {
      setError(
        e?.response?.data?.error ||
          e?.response?.data?.message ||
          "Connection failed. Please check your credentials.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* shared input class — matches AccountManager exactly */
  const inputCls =
    "w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400";
  const labelCls =
    "block text-xs font-semibold text-gray-500 tracking-wide mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
        style={{ maxHeight: "calc(100vh - 2rem)" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {step === 2
                ? "Account Connected"
                : step === 1
                  ? cloudType === "azure"
                    ? "Connect Azure Subscription"
                    : "Connect AWS Account"
                  : "Connect Cloud Account"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {step === 2
                ? "Your account is ready."
                : step === 1
                  ? "Enter your credentials below."
                  : "Choose a provider to get started."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-8 py-6 overflow-y-auto flex-1 min-h-0">
          {/* Step 0 — Choose provider */}
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Select a cloud provider to start monitoring costs.
              </p>
              {[
                {
                  id: "azure",
                  label: "Microsoft Azure",
                  desc: "Service Principal — Tenant ID + Client Secret",
                  icon: "☁️",
                  allowed: allowConnectAzure,
                },
                {
                  id: "aws",
                  label: "Amazon Web Services",
                  desc: "IAM Access Keys",
                  icon: "🟠",
                  allowed: allowConnectAws,
                },
                {
                  id: "btp",
                  label: "SAP BTP",
                  desc: "OAuth2 Client Credentials",
                  icon: "🟢",
                  allowed: allowConnectBtp,
                },
                {
                  id: "gcp",
                  label: "Google Cloud Platform",
                  desc: "Service Account JSON Key",
                  icon: "🔵",
                  allowed: allowConnectGcp,
                },
              ]
                .filter((o) => o.allowed)
                .map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      if (opt.id === "btp") {
                        onClose();
                        navigate("/btp/accounts");
                        return;
                      }
                      if (opt.id === "gcp") {
                        onClose();
                        navigate("/gcp/accounts");
                        return;
                      }
                      setCloudType(opt.id);
                      setStep(1);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all group text-left"
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">
                        {opt.label}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {opt.desc}
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className="ml-auto text-gray-300 group-hover:text-brand-500 transition-colors"
                    />
                  </button>
                ))}
            </div>
          )}

          {/* Step 1 — Credentials form */}
          {step === 1 && (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setStep(0);
                  setError("");
                }}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-2"
              >
                <ArrowLeft size={13} /> Back
              </button>

              {cloudType === "azure" ? (
                <>
                  <div>
                    <label className={labelCls}>Display Name</label>
                    <input
                      required
                      type="text"
                      className={inputCls}
                      placeholder="e.g. Production Environment"
                      value={azureForm.name}
                      onChange={(e) =>
                        setAzureForm((f) => ({ ...f, name: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Subscription ID</label>
                    <input
                      required
                      type="text"
                      className={inputCls}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      value={azureForm.subscriptionId}
                      onChange={(e) =>
                        setAzureForm((f) => ({
                          ...f,
                          subscriptionId: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Directory (Tenant) ID</label>
                    <input
                      required
                      type="text"
                      className={inputCls}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      value={azureForm.tenantId}
                      onChange={(e) =>
                        setAzureForm((f) => ({
                          ...f,
                          tenantId: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Client (App) ID</label>
                    <input
                      required
                      type="text"
                      className={inputCls}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      value={azureForm.clientId}
                      onChange={(e) =>
                        setAzureForm((f) => ({
                          ...f,
                          clientId: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Client Secret</label>
                    <input
                      required
                      type="password"
                      className={inputCls}
                      placeholder="••••••••••••"
                      value={azureForm.clientSecret}
                      onChange={(e) =>
                        setAzureForm((f) => ({
                          ...f,
                          clientSecret: e.target.value,
                        }))
                      }
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className={labelCls}>Account Name</label>
                    <input
                      required
                      type="text"
                      className={inputCls}
                      placeholder="e.g. Production AWS"
                      value={awsForm.name}
                      onChange={(e) =>
                        setAwsForm((f) => ({ ...f, name: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Access Key ID</label>
                    <input
                      required
                      type="password"
                      className={`${inputCls} font-mono`}
                      placeholder="AKIA..."
                      value={awsForm.accessKeyId}
                      onChange={(e) =>
                        setAwsForm((f) => ({
                          ...f,
                          accessKeyId: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Secret Access Key</label>
                    <input
                      required
                      type="password"
                      className={`${inputCls} font-mono`}
                      placeholder="Secret..."
                      value={awsForm.secretAccessKey}
                      onChange={(e) =>
                        setAwsForm((f) => ({
                          ...f,
                          secretAccessKey: e.target.value,
                        }))
                      }
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg px-3 py-2.5">
                  <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="pt-1">
                <button
                  onClick={handleConnect}
                  disabled={saving}
                  className="w-full bg-gray-900 dark:bg-brand-600 hover:bg-black dark:hover:bg-brand-700 text-white font-semibold py-3 rounded-lg shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Connecting…
                    </>
                  ) : (
                    "Save & Connect"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Success */}
          {step === 2 && (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center mx-auto">
                <Check size={28} className="text-emerald-500" />
              </div>
              <div>
                <div className="font-bold text-gray-900 dark:text-white text-lg">
                  Successfully Connected!
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Your {cloudType === "azure" ? "Azure" : "AWS"} account is
                  connected. Cost data will sync shortly.
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate(cloudType === "azure" ? "/azure" : "/aws");
                  }}
                  className="flex-1 bg-gray-900 dark:bg-brand-600 hover:bg-black dark:hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg transition-all text-sm flex items-center justify-center gap-1.5"
                >
                  View Dashboard <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
GetStartedWizard.propTypes = {
  onClose: PropTypes.func.isRequired,
  onConnected: PropTypes.func,
  allowConnectAzure: PropTypes.bool,
  allowConnectAws: PropTypes.bool,
  allowConnectBtp: PropTypes.bool,
  allowConnectGcp: PropTypes.bool,
};

/* ─────────────────────────────────────────────────────────
   IMPACT BADGE
───────────────────────────────────────────────────────── */
function ImpactBadge({ level }) {
  const map = {
    high: "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400",
    medium:
      "bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    low: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
  };
  const label = {
    high: "High Impact",
    medium: "Medium Impact",
    low: "Low Impact",
  };
  const cls = map[level?.toLowerCase()] || map.low;
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}
    >
      {label[level?.toLowerCase()] || "Low Impact"}
    </span>
  );
}
ImpactBadge.propTypes = { level: PropTypes.string };

/* ─────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────── */
function EmptyState({ icon: Icon, title, desc, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#F5F7FB] dark:bg-[#10182B] flex items-center justify-center">
        <Icon size={22} className="text-[#94A3B8]" />
      </div>
      <div>
        <div className="text-sm font-bold text-[#0F172A] dark:text-white">
          {title}
        </div>
        <div className="text-xs text-[#94A3B8] mt-0.5 max-w-xs">{desc}</div>
      </div>
      {action && (
        <button onClick={action} className="btn-primary text-xs mt-1">
          <Plus size={12} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
EmptyState.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  desc: PropTypes.string.isRequired,
  action: PropTypes.func,
  actionLabel: PropTypes.string,
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
const TREND_RANGES = ["7D", "30D", "3M", "6M", "1Y"];
export default function HomePage() {
  const { user, invoiceOnly, cloudAccess, features } = useAuth();
  const { rates: MSP_RATES } = useMspRates();
  const navigate = useNavigate();

  /* ── permission flags ── */
  const isPrivileged = user?.role === "admin" || user?.role === "owner";
  const canViewAzure = user?.canViewAzure ?? false;
  const canViewAws = user?.canViewAws ?? false;
  const canViewBtp = user?.canViewBtp ?? false;
  const canViewGcp = user?.canViewGcp ?? isPrivileged;
  const azureReadOnly = user?.azureReadOnly ?? true;
  const awsReadOnly = user?.awsReadOnly ?? true;
  const btpReadOnly = user?.btpReadOnly ?? true;
  const gcpReadOnly = isPrivileged ? false : (user?.gcpReadOnly ?? true);
  const canWriteAzure = canViewAzure && !azureReadOnly;
  const canWriteAws = canViewAws && !awsReadOnly;
  const canWriteBtp = canViewBtp && !btpReadOnly;
  const canWriteGcp = canViewGcp && !gcpReadOnly;

  // Cloud access: prefer new cloudAccess[] from subscription, fall back to legacy string
  const resolvedCloudAccess =
    Array.isArray(cloudAccess) && cloudAccess.length > 0
      ? cloudAccess
      : (() => {
          const pref = user?.cloudPreference ?? null;
          if (!pref) return ["azure", "aws", "btp", "gcp"];
          if (pref === "all" || pref === "both") return ["azure", "aws", "btp", "gcp"];
          return pref
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        })();

  const orgHasAzure = resolvedCloudAccess.includes("azure");
  const orgHasAws = resolvedCloudAccess.includes("aws");
  const orgHasBtp = resolvedCloudAccess.includes("btp");
  const orgHasGcp = resolvedCloudAccess.includes("gcp");

  // Hybrid = invoice_only true but cloud providers are also configured
  const isHybridOrg = invoiceOnly && cloudAccess.length > 0;
  // Pure invoice-only orgs cannot connect live clouds; hybrid orgs can
  const canConnectCloud = !invoiceOnly || isHybridOrg;
  const allowConnectAzure =
    canConnectCloud &&
    orgHasAzure &&
    canViewAzure &&
    (canWriteAzure || isPrivileged);
  const allowConnectAws =
    canConnectCloud && orgHasAws && canViewAws && (canWriteAws || isPrivileged);
  const allowConnectBtp =
    canConnectCloud && orgHasBtp && canViewBtp && (canWriteBtp || isPrivileged);
  const allowConnectGcp =
    canConnectCloud &&
    (orgHasGcp || isPrivileged) &&
    canViewGcp &&
    (canWriteGcp || isPrivileged);
  const canConnectAny = allowConnectAzure || allowConnectAws || allowConnectBtp || allowConnectGcp;

  /* ── state ── */
  const [summary, setSummary] = useState(null);
  const [recs, setRecs] = useState([]);
  const [recsSummary, setRecsSummary] = useState(null);
  const [monthlyHistory, setMonthlyHistory] = useState([]);
  const [snapshotForecast, setSnapshotForecast] = useState(null);
  const [forecastByProvider, setForecastByProvider] = useState({
    azure: null,
    aws: null,
    btp: null,
    gcp: null,
  });
  const [alertsData, setAlertsData] = useState({ alerts: [], summary: {} });
  const [budgets, setBudgets] = useState([]);
  const [azureAccounts, setAzureAccounts] = useState([]);
  const [awsAccounts, setAwsAccounts] = useState([]);
  const [mspSavings, setMspSavings] = useState(null); // { totalSavings, breakdown, totalCost }
  const [invoiceStats, setInvoiceStats] = useState(null); // { total, count, byProvider }
  const [invoiceMonthly, setInvoiceMonthly] = useState([]); // [{ year, month, total }]
  const [recentInvoices, setRecentInvoices] = useState([]); // last 5 invoices
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [trendRange, setTrendRange] = useState("6M");
  const [dashTab, setDashTab] = useState("cloud"); // "cloud" | "invoice"
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastSync, setLastSync] = useState(null);

  /* ── fetch all data ── */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api.get("/summary/dashboard").catch(() => null),
      api.get("/recommendations").catch(() => null),
      api.get("/smart-alerts?pageSize=10").catch(() => null),
      api.get("/budgets").catch(() => null),
      api.get("/insights/msp-savings").catch(() => null),
      api.get("/invoices?pageSize=500").catch(() => null),
    ]).then(([dash, r, al, bud, msp, inv]) => {
      if (cancelled) return;

      const d = dash?.data || null;

      // Reshape dashboard response to match existing summary shape
      setSummary({
        azure: {
          totalCost: d?.totals?.azure ?? 0,
          accounts: d?.accounts?.azure ?? [],
        },
        aws: {
          totalCost: d?.totals?.aws ?? 0,
          accounts: d?.accounts?.aws ?? [],
        },
        btp: {
          totalCost: d?.totals?.btp ?? 0,
          accounts: d?.accounts?.btp ?? [],
        },
        gcp: {
          totalCost: d?.totals?.gcp ?? (() => { try { const c = JSON.parse(localStorage.getItem('ccm_gcp_summary')); return c?.total ?? 0; } catch { return 0; } })(),
          accounts: d?.accounts?.gcp ?? [],
        },
        forecast: d?.totals?.forecast ?? null,
      });

      setAzureAccounts(d?.accounts?.azure ?? []);
      setAwsAccounts(d?.accounts?.aws ?? []);
      setSnapshotForecast(d?.totals?.forecast ?? null);
      setForecastByProvider(
        d?.totals?.forecastByProvider ?? { azure: null, aws: null, btp: null },
      );

      // Convert dashboard monthly array → {year, month, totalCost, azure, aws, btp}
      const allMonthly = (d?.monthly ?? []).map((m) => {
        const [y, mo] = m.key.split("-").map(Number);
        return {
          year: y,
          month: mo,
          totalCost: m.total,
          azure: m.azure ?? 0,
          aws: m.aws ?? 0,
          btp: m.btp ?? 0,
          gcp: m.gcp ?? 0,
        };
      });
      setMonthlyHistory(allMonthly);

      const recsRaw = r?.data?.data ?? r?.data ?? [];
      setRecs(Array.isArray(recsRaw) ? recsRaw : []);
      setRecsSummary(r?.data?.summary || null);

      setAlertsData({
        alerts: Array.isArray(al?.data?.alerts) ? al.data.alerts : [],
        summary: al?.data?.summary || {},
      });

      const budsRaw = bud?.data ?? [];
      setBudgets(Array.isArray(budsRaw) ? budsRaw : []);

      // MSP savings
      if (msp?.data) setMspSavings(msp.data);

      // Invoice stats for summary card + monthly trend
      const invRaw = inv?.data?.data ?? inv?.data ?? [];
      if (Array.isArray(invRaw) && invRaw.length > 0) {
        const byProvider = {};
        const totalByProvider = {};
        invRaw.forEach((i) => {
          const p = (i.provider || "unknown").toLowerCase();
          byProvider[p] = (byProvider[p] ?? 0) + 1;
          totalByProvider[p] =
            (totalByProvider[p] ?? 0) + Number(i.total_cost || 0);
        });
        const totalInvoiced = invRaw.reduce(
          (s, i) => s + Number(i.total_cost || 0),
          0,
        );
        setInvoiceStats({
          total: totalInvoiced,
          count: invRaw.length,
          byProvider,
          totalByProvider,
        });

        // Build monthly invoice trend (with per-provider breakdown)
        const monthMap = {};
        invRaw.forEach((inv) => {
          const d = new Date(inv.invoice_date || inv.created_at || Date.now());
          const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
          const p = (inv.provider || "unknown").toLowerCase();
          const cost = Number(inv.total_cost || 0);
          if (!monthMap[key])
            monthMap[key] = { total: 0, aws: 0, azure: 0, btp: 0 };
          monthMap[key].total += cost;
          monthMap[key][p] = (monthMap[key][p] ?? 0) + cost;
        });
        const monthly = Object.entries(monthMap)
          .map(([k, v]) => {
            const [year, month] = k.split("-").map(Number);
            return { year, month, ...v };
          })
          .sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));
        setInvoiceMonthly(monthly);

        // Recent invoices (last 5, sorted by date desc)
        const sorted = [...invRaw].sort(
          (a, b) =>
            new Date(b.invoice_date || b.created_at || 0) -
            new Date(a.invoice_date || a.created_at || 0),
        );
        setRecentInvoices(sorted.slice(0, 5));
      }

      setLastSync(new Date());
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  /* ── derived values ── */
  const azureTotal = summary?.azure?.totalCost ?? 0;
  const awsTotal = summary?.aws?.totalCost ?? 0;
  const btpSpend = summary?.btp?.totalCost ?? 0;
  const gcpSpend = summary?.gcp?.totalCost ?? 0;
  const totalSpend = azureTotal + awsTotal + btpSpend + gcpSpend;
  const totalSavings =
    recsSummary?.totalEstimatedSavings ??
    recs.reduce(
      (s, r) => s + Number(r.estimated_savings || r.savingsAmount || 0),
      0,
    );
  const recsCount = recsSummary?.totalRecommendations ?? recs.length;
  const activeAlerts = alertsData.alerts.filter((a) => a.status !== "resolved");
  const criticalCount =
    alertsData.summary?.bySeverity?.critical ??
    activeAlerts.filter((a) => a.severity === "critical").length;
  const warningCount =
    alertsData.summary?.bySeverity?.high ??
    activeAlerts.filter((a) => a.severity === "high").length;

  const totalBudget = budgets.reduce(
    (s, b) => s + Number(b.target_amount || 0),
    0,
  );

  const azureCount = azureAccounts.length;
  const awsCount = awsAccounts.length;
  const btpCount = (summary?.btp?.accounts ?? []).length;
  const gcpCount = (summary?.gcp?.accounts ?? []).length;
  const totalAccounts = azureCount + awsCount + btpCount + gcpCount;
  const providers = [
    azureCount > 0 && "Azure",
    awsCount > 0 && "AWS",
    btpCount > 0 && "SAP BTP",
    gcpCount > 0 && "GCP",
  ].filter(Boolean);
  const hasAnyCloud = totalAccounts > 0;
  // True when subscription has cloud providers configured (even if not yet connected)
  const hasCloudAccess = hasAnyCloud || cloudAccess.length > 0;

  // For invoice-only orgs, budget utilization is based on invoice totals instead of live cloud spend
  const effectiveSpend =
    invoiceOnly && !hasAnyCloud ? (invoiceStats?.total ?? 0) : totalSpend;
  const budgetUtilPct =
    totalBudget > 0
      ? Math.min(Math.round((effectiveSpend / totalBudget) * 100), 100)
      : null;

  // MSP savings from invoice totals by provider (BTP 2%, AWS 3.5%, Azure 7%)
  const invoiceMspSavings = useMemo(() => {
    // For hybrid orgs the backend returns invoiceSavings in the msp-savings response
    if (mspSavings?.invoiceSavings) {
      const s = mspSavings.invoiceSavings;
      if (!s.totalSavings) return null;
      const breakdown = (s.breakdown ?? [])
        .map((b) => ({
          provider: b.provider,
          amount: b.totalCost ?? 0,
          rate: b.savingsRate ?? MSP_RATES[b.provider] ?? 0,
          savings: b.savingsAmount ?? b.savings ?? 0,
        }))
        .filter((b) => b.savings > 0);
      return { total: s.totalSavings, breakdown };
    }
    // Fallback: compute from invoice totals on the frontend
    const tb = invoiceStats?.totalByProvider ?? {};
    if (!Object.keys(tb).length) return null;
    const breakdown = Object.entries(tb)
      .map(([provider, amount]) => {
        const rate = MSP_RATES[provider] ?? 0;
        return { provider, amount, rate, savings: amount * rate };
      })
      .filter((b) => b.savings > 0);
    const totalSavingsAmt = breakdown.reduce((s, b) => s + b.savings, 0);
    return totalSavingsAmt > 0 ? { total: totalSavingsAmt, breakdown } : null;
  }, [invoiceStats, mspSavings]);

  /* ── spend trend: aggregate monthly history by range ── */
  const trendData = useMemo(() => {
    if (!monthlyHistory.length) return [];

    const now = new Date();
    const nowYM = now.getFullYear() * 12 + now.getMonth() + 1; // current month in linear months

    let monthsBack = 6;
    if (trendRange === "7D") monthsBack = 1;
    else if (trendRange === "30D") monthsBack = 2;
    else if (trendRange === "3M") monthsBack = 3;
    else if (trendRange === "6M") monthsBack = 6;
    else if (trendRange === "1Y") monthsBack = 12;

    const cutoffYM = nowYM - monthsBack + 1;

    const filtered = monthlyHistory.filter((row) => {
      const rowYM = row.year * 12 + row.month;
      return rowYM >= cutoffYM && rowYM <= nowYM;
    });

    if (!filtered.length) return [];

    // Sort ascending by year+month
    filtered.sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));

    // Format label
    const showYear = monthsBack > 3;
    const result = filtered.map((row) => {
      const d = new Date(row.year, row.month - 1, 1);
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        ...(showYear ? { year: "2-digit" } : {}),
      });
      return {
        label,
        spend: row.totalCost,
        azure: row.azure > 0 ? row.azure : null,
        aws: row.aws > 0 ? row.aws : null,
        btp: row.btp > 0 ? row.btp : null,
        gcp: row.gcp > 0 ? row.gcp : null,
        forecast: null,
      };
    });

    // Append forecast: overlap at last real point + projected end point
    if (result.length >= 1) {
      const lastPoint = result[result.length - 1];
      const last = lastPoint.spend ?? 0;
      const prev =
        result.length >= 2 ? (result[result.length - 2].spend ?? 0) : last;
      const delta = Math.max(0, last - prev);
      const fVal = snapshotForecast ?? Math.max(last, last + delta * 1.2);
      if (fVal > 0) {
        // Anchor overlap on last real point (filtered from tooltip display)
        result[result.length - 1] = {
          ...lastPoint,
          forecast: last,
          forecastAzure: lastPoint.azure,
          forecastAws: lastPoint.aws,
          forecastBtp: lastPoint.btp,
          forecastGcp: lastPoint.gcp,
        };
        const nextDate = new Date(
          filtered[filtered.length - 1].year,
          filtered[filtered.length - 1].month,
          1,
        );
        const fLabel = nextDate.toLocaleDateString("en-US", {
          month: "short",
          ...(showYear ? { year: "2-digit" } : {}),
        });
        result.push({
          label: fLabel,
          spend: null,
          azure: null,
          aws: null,
          btp: null,
          gcp: null,
          forecastAzure: forecastByProvider.azure,
          forecastAws: forecastByProvider.aws,
          forecastBtp: forecastByProvider.btp,
          forecastGcp: forecastByProvider.gcp,
          forecast: fVal,
        });
      }
    }

    return result;
  }, [monthlyHistory, trendRange, snapshotForecast, forecastByProvider]);

  /* ── forecast EOM ── */
  const forecastEOM = useMemo(() => {
    if (snapshotForecast) return snapshotForecast;
    const f = [...trendData].reverse().find((d) => d.forecast !== null);
    return f?.forecast ?? null;
  }, [trendData, snapshotForecast]);

  /* ── previous period comparison (from monthly history) ── */
  const prevMonthSpend = useMemo(() => {
    const now = new Date();
    const pm = now.getMonth() === 0 ? 12 : now.getMonth(); // prev month (1-based)
    const py = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return monthlyHistory
      .filter((r) => r.year === py && r.month === pm)
      .reduce((s, r) => s + r.totalCost, 0);
  }, [monthlyHistory]);

  const spendChangePct =
    prevMonthSpend > 0
      ? (((totalSpend - prevMonthSpend) / prevMonthSpend) * 100).toFixed(1)
      : null;

  /* date range label */
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dateLabel = `${monthStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  /* ── MSP savings breakdown per provider (our rate × MTD spend) ── */
  const mspProviderActions = useMemo(() => {
    return [
      {
        key: "azure",
        label: "Microsoft Azure",
        icon: Server,
        color: "#0078D4",
        spend: azureTotal,
        rate: MSP_RATES.azure,
      },
      {
        key: "aws",
        label: "Amazon AWS",
        icon: Database,
        color: "#FF9900",
        spend: awsTotal,
        rate: MSP_RATES.aws,
      },
      {
        key: "btp",
        label: "SAP BTP",
        icon: Cpu,
        color: "#00B373",
        spend: btpSpend,
        rate: MSP_RATES.btp,
      },
      {
        key: "gcp",
        label: "Google Cloud",
        icon: HardDrive,
        color: "#3b82f6",
        spend: gcpSpend,
        rate: MSP_RATES.gcp,
      },
    ]
      .filter((r) => r.spend > 0)
      .map((r) => ({ ...r, savings: r.spend * r.rate }));
  }, [azureTotal, awsTotal, btpSpend, gcpSpend]);

  /* ── AI insights synthesized from data ── */
  const aiInsights = useMemo(() => {
    const insights = [];
    if (spendChangePct !== null && Math.abs(Number(spendChangePct)) > 5) {
      insights.push({
        headline: `Cloud spend ${Number(spendChangePct) > 0 ? "increased" : "decreased"} by ${Math.abs(Number(spendChangePct))}% vs last month`,
        reasons: [
          awsTotal > azureTotal && awsCount > 0
            ? "AWS accounts driving majority of spend"
            : null,
          azureTotal > awsTotal && azureCount > 0
            ? "Azure subscriptions showing cost increase"
            : null,
          recs.length > 0
            ? `${recs.length} optimization opportunities detected`
            : null,
        ]
          .filter(Boolean)
          .slice(0, 2),
      });
    }
    if (budgetUtilPct !== null && budgetUtilPct > 70) {
      insights.push({
        headline: `Budget utilization at ${budgetUtilPct}% — approaching limit`,
        reasons: [
          "Monitor spend closely to avoid overrun",
          totalBudget > 0
            ? `${formatCurrency(totalBudget - totalSpend)} remaining budget`
            : null,
        ]
          .filter(Boolean)
          .slice(0, 2),
      });
    }
    if (criticalCount > 0) {
      insights.push({
        headline: `${criticalCount} critical alert${criticalCount > 1 ? "s" : ""} require attention`,
        reasons: [
          "Immediate action recommended",
          "Check alerts panel for details",
        ],
      });
    }
    if (!insights.length && totalSavings > 0) {
      insights.push({
        headline: `${formatCurrency(totalSavings)} in potential savings identified`,
        reasons: [
          `${recsCount} recommendations across your cloud accounts`,
          "Review top actions to optimize spend",
        ],
      });
    }
    return insights.slice(0, 1);
  }, [
    spendChangePct,
    budgetUtilPct,
    criticalCount,
    totalSavings,
    recsCount,
    awsTotal,
    azureTotal,
    awsCount,
    azureCount,
    recs.length,
    totalBudget,
    totalSpend,
    prevMonthSpend,
  ]);

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-[#060816]">
      {showWizard && (
        <GetStartedWizard
          onClose={() => setShowWizard(false)}
          onConnected={() => {
            setShowWizard(false);
            setRefreshKey((k) => k + 1);
          }}
          allowConnectAzure={allowConnectAzure}
          allowConnectAws={allowConnectAws}
          allowConnectBtp={allowConnectBtp}
          allowConnectGcp={allowConnectGcp}
        />
      )}

      <div className="w-full px-4 sm:px-6 xl:px-8 2xl:px-10 py-4 space-y-4">
        {/* ╔══ HEADER ══════════════════════════════════════════╗ */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-[#475569] dark:text-[#94A3B8] mb-1">
              Welcome back,{" "}
              {user?.firstName || user?.name?.split(" ")[0] || "there"} 👋
            </p>
            <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white tracking-tight leading-none">
              Cloud Cost Overview
            </h1>
            <p className="text-sm text-[#94A3B8] mt-1.5">
              Track, analyze and optimize your cloud spend in real-time.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap justify-end">
            {/* Cloud / Invoice tab switcher — shown when hybrid */}
            {!loading &&
              hasCloudAccess &&
              invoiceStats &&
              invoiceStats.count > 0 && (
                <div className="flex items-center gap-0.5 p-1 bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-xl shadow-sm">
                  <button
                    onClick={() => setDashTab("cloud")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      dashTab === "cloud"
                        ? "border border-[#2563EB] text-[#2563EB] dark:text-blue-400 dark:border-blue-500 shadow-sm"
                        : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#10182B]"
                    }`}
                  >
                    <Cloud size={12} />
                    Cloud
                  </button>
                  <button
                    onClick={() => setDashTab("invoice")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      dashTab === "invoice"
                        ? "border border-[#2563EB] text-[#2563EB] dark:text-blue-400 dark:border-blue-500 shadow-sm"
                        : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#10182B]"
                    }`}
                  >
                    <Upload size={12} />
                    Invoices
                  </button>
                </div>
              )}
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-xl text-sm text-[#475569] dark:text-[#94A3B8] font-semibold hover:bg-[#F8FAFC] dark:hover:bg-[#10182B] transition-all shadow-sm disabled:opacity-60"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            {canConnectAny && (
              <button
                onClick={() => setShowWizard(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-brand-400 dark:border-brand-600 text-brand-600 dark:text-brand-400 text-sm font-bold hover:border-brand-500 transition-all duration-200 active:scale-95"
              >
                <Plus size={14} />
                {[allowConnectAzure, allowConnectAws, allowConnectBtp, allowConnectGcp].filter(
                  Boolean,
                ).length > 1
                  ? "Connect Cloud"
                  : allowConnectAzure
                    ? "Connect Azure"
                    : allowConnectAws
                      ? "Connect AWS"
                      : allowConnectGcp
                        ? "Connect GCP"
                        : "Connect SAP BTP"}
              </button>
            )}
          </div>
        </div>

        {/* ╔══ SCOPE INDICATOR ═════════════════════════════════╗ */}
        {!loading && hasAnyCloud && (
          <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-medium text-[#475569] dark:text-[#94A3B8]">
              Showing:{" "}
              <span className="font-bold text-[#0F172A] dark:text-white">
                {totalAccounts} Account{totalAccounts !== 1 ? "s" : ""}
              </span>
              {" · "}
              <span className="font-bold text-[#0F172A] dark:text-white">
                {providers.length} Provider{providers.length !== 1 ? "s" : ""}
              </span>
              {providers.length > 0 && (
                <span className="text-[#94A3B8]">
                  {" "}
                  ({providers.join(", ")})
                </span>
              )}
            </span>
          </div>
        )}

        {/* ╔══ NO CLOUD EMPTY STATE ════════════════════════════╗ */}
        {!loading &&
          !hasAnyCloud &&
          (dashTab === "cloud" || !invoiceStats || invoiceStats.count === 0) &&
          (!invoiceOnly || hasCloudAccess) && (
            <div className="bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-2xl shadow-card p-10 flex flex-col items-center text-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-[#2563EB] flex items-center justify-center shadow-brand">
                <Cloud size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">
                  Start monitoring your cloud costs
                </h2>
                <p className="text-sm text-[#94A3B8] mt-2 max-w-md">
                  Connect your first AWS or Azure account to get real-time spend
                  visibility, budget alerts, and AI-powered savings
                  recommendations.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
                {[
                  {
                    icon: BarChart2,
                    label: "Cost Analytics",
                    desc: "Real-time spend tracking",
                  },
                  {
                    icon: Target,
                    label: "Budget Controls",
                    desc: "Set thresholds & alerts",
                  },
                  {
                    icon: Sparkles,
                    label: "AI Insights",
                    desc: "Optimization recommendations",
                  },
                  {
                    icon: BellRing,
                    label: "Smart Alerts",
                    desc: "Anomaly detection",
                  },
                  {
                    icon: Layers,
                    label: "Multi-Cloud",
                    desc: "Azure & AWS unified",
                  },
                  {
                    icon: ShieldCheck,
                    label: "Governance",
                    desc: "Policy & compliance",
                  },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F5F7FB] dark:bg-[#10182B] text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] dark:bg-[#2563EB]/10 flex items-center justify-center flex-shrink-0">
                      <f.icon size={13} className="text-[#2563EB]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0F172A] dark:text-white">
                        {f.label}
                      </div>
                      <div className="text-[10px] text-[#94A3B8] mt-0.5">
                        {f.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                {canConnectAny ? (
                  <button
                    onClick={() => setShowWizard(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-brand-400 dark:border-brand-600 text-brand-600 dark:text-brand-400 text-sm font-bold hover:border-brand-500 transition-all duration-200 active:scale-95"
                  >
                    <Zap size={14} />
                    {[
                      allowConnectAzure,
                      allowConnectAws,
                      allowConnectBtp,
                      allowConnectGcp,
                    ].filter(Boolean).length > 1
                      ? "Connect Cloud Account"
                      : allowConnectAzure
                        ? "Connect Azure"
                        : allowConnectAws
                          ? "Connect AWS"
                          : allowConnectGcp
                            ? "Connect GCP"
                            : "Connect SAP BTP"}
                  </button>
                ) : (
                  <div className="text-xs text-[#94A3B8] bg-[#F5F7FB] dark:bg-[#10182B] px-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#1a2744]">
                    Contact your administrator to connect cloud accounts
                  </div>
                )}
              </div>
            </div>
          )}

        {/* ╔══ NO INVOICE EMPTY STATE ══════════════════════════╗ */}
        {!loading &&
          dashTab === "invoice" &&
          hasCloudAccess &&
          (!invoiceStats || invoiceStats.count === 0) && (
            <div className="bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-2xl shadow-card p-10 flex flex-col items-center text-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-[#7C3AED] flex items-center justify-center shadow-brand">
                <Upload size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">
                  No invoices uploaded yet
                </h2>
                <p className="text-sm text-[#94A3B8] mt-2 max-w-md">
                  Upload AWS, Azure, or SAP BTP invoices to track costs, analyse
                  spend trends, and unlock MSP savings insights.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
                {[
                  {
                    icon: DollarSign,
                    label: "Spend Tracking",
                    desc: "Invoice cost trends over time",
                  },
                  {
                    icon: Sparkles,
                    label: "MSP Savings",
                    desc: "2–7% discount insights",
                  },
                  {
                    icon: Layers,
                    label: "Provider Split",
                    desc: "AWS · Azure · SAP BTP",
                  },
                  {
                    icon: BarChart2,
                    label: "Monthly Trends",
                    desc: "Historical comparisons",
                  },
                  {
                    icon: FileBarChart,
                    label: "PDF & CSV",
                    desc: "Automated parsing",
                  },
                  {
                    icon: Target,
                    label: "Budget View",
                    desc: "Spend vs budget",
                  },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F5F7FB] dark:bg-[#10182B] text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] dark:bg-[#7C3AED]/10 flex items-center justify-center flex-shrink-0">
                      <f.icon size={13} className="text-[#7C3AED]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0F172A] dark:text-white">
                        {f.label}
                      </div>
                      <div className="text-[10px] text-[#94A3B8] mt-0.5">
                        {f.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/invoices")}
                className="btn-primary"
              >
                <Upload size={14} />
                Upload your first invoice
              </button>
            </div>
          )}

        {/* ╔══ KPI CARDS (cloud tab) ══════════════════════════╗ */}
        {(loading || hasAnyCloud) && dashTab !== "invoice" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
            {/* 1 — Total Spend MTD */}
            <KpiCard loading={loading}>
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 flex items-center justify-center">
                  <DollarSign size={18} className="text-[#2563EB]" />
                </div>
                <span className="text-[10px] font-boldtracking-wider text-[#94A3B8]">
                  Total Spend (Month-to-Date)
                </span>
              </div>
              <AnimatedAmount value={totalSpend} loading={loading} />
              {/* Provider breakdown */}
              {!loading && (azureTotal > 0 || awsTotal > 0 || btpSpend > 0 || gcpSpend > 0) && (
                <div className="flex flex-wrap gap-3 mt-1.5 mb-0.5">
                  {azureTotal > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#0078D4] inline-block" />
                      <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                        Azure{" "}
                        <span className="font-semibold text-[#1E293B] dark:text-white">
                          {formatCurrency(azureTotal)}
                        </span>
                      </span>
                    </div>
                  )}
                  {awsTotal > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#FF9900] inline-block" />
                      <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                        AWS{" "}
                        <span className="font-semibold text-[#1E293B] dark:text-white">
                          {formatCurrency(awsTotal)}
                        </span>
                      </span>
                    </div>
                  )}
                  {btpSpend > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#0070F2] inline-block" />
                      <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                        SAP BTP{" "}
                        <span className="font-semibold text-[#1E293B] dark:text-white">
                          {formatCurrency(btpSpend)}
                        </span>
                      </span>
                    </div>
                  )}
                  {gcpSpend > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#3b82f6] inline-block" />
                      <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                        GCP{" "}
                        <span className="font-semibold text-[#1E293B] dark:text-white">
                          {formatCurrency(gcpSpend)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )}
              {spendChangePct !== null && (
                <div
                  className={`flex items-center gap-1 mt-1 text-xs font-semibold ${Number(spendChangePct) > 0 ? "text-red-500" : "text-emerald-500"}`}
                >
                  {Number(spendChangePct) > 0 ? (
                    <ArrowUpRight size={13} />
                  ) : (
                    <ArrowDownRight size={13} />
                  )}
                  {Math.abs(Number(spendChangePct))}%
                  <span className="text-[#94A3B8] font-normal">
                    vs prev month
                  </span>
                </div>
              )}
              {spendChangePct === null && !loading && (
                <div className="text-xs text-[#94A3B8] mt-1">
                  Month-to-date spend
                </div>
              )}
            </KpiCard>

            {/* 2 — Budget Utilization */}
            <KpiCard loading={loading}>
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 flex items-center justify-center">
                  <Target size={18} className="text-[#7C3AED]" />
                </div>
                <span className="text-[10px] font-boldtracking-wider text-[#94A3B8]">
                  Budget Utilization
                </span>
              </div>
              {loading ? (
                <Sk h="h-9" w="w-24" className="mb-2" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-[#0F172A] dark:text-white tracking-tight">
                    {budgetUtilPct !== null ? `${budgetUtilPct}%` : "—"}
                  </div>
                  {budgetUtilPct !== null ? (
                    <>
                      <div className="mt-3 h-2 bg-[#E2E8F0] dark:bg-[#1a2744] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            budgetUtilPct > 90
                              ? "bg-red-500"
                              : budgetUtilPct > 75
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                          }`}
                          style={{ width: `${budgetUtilPct}%` }}
                        />
                      </div>
                      <div className="text-xs text-[#94A3B8] mt-1.5">
                        {formatCurrency(totalSpend)} of{" "}
                        {formatCurrency(totalBudget)} used
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-[#94A3B8] mt-1">
                      No budgets configured —{" "}
                      <button
                        onClick={() => navigate("/budgets")}
                        className="text-[#2563EB] hover:underline font-semibold"
                      >
                        Create one
                      </button>
                    </div>
                  )}
                </>
              )}
            </KpiCard>

            {/* 3 — MSP + Optimization Savings */}
            <KpiCard loading={loading}>
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 flex items-center justify-center">
                  <PiggyBank
                    size={16}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 tracking-wide">
                    MSP
                  </span>
                  <span className="text-[10px] font-bold tracking-wider text-[#94A3B8]">
                    Savings
                  </span>
                </div>
              </div>
              <AnimatedAmount
                value={mspSavings?.totalSavings ?? 0}
                loading={loading}
              />
              <div className="mt-1 space-y-0.5">
                {mspSavings && mspSavings.totalSavings > 0 ? (
                  <>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      Maitsys CSP pricing advantage
                    </div>
                    <div className="text-[10px] text-[#94A3B8]">
                      {(mspSavings.breakdown ?? [])
                        .map(
                          (b) =>
                            `${b.provider === "btp" ? "BTP" : b.provider.toUpperCase()} ${((b.savingsRate ?? 0) * 100).toFixed(1)}%`,
                        )
                        .join(" · ")}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-[#94A3B8]">
                    {loading ? "Calculating…" : "No cloud spend data yet"}
                  </div>
                )}
                {recsCount > 0 && (
                  <button
                    onClick={() => navigate("/recommendations")}
                    className="text-[10px] font-semibold text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-0.5 mt-1 transition-colors"
                  >
                    {recsCount} recommendations <ChevronRight size={10} />
                  </button>
                )}
              </div>
            </KpiCard>

            {/* 4 — Active Alerts */}
            <KpiCard loading={loading}>
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 flex items-center justify-center">
                  <BellRing
                    size={18}
                    className={
                      criticalCount > 0 ? "text-red-500" : "text-amber-500"
                    }
                  />
                </div>
                <span className="text-[10px] font-boldtracking-wider text-[#94A3B8]">
                  Active Alerts
                </span>
              </div>
              {loading ? (
                <Sk h="h-9" w="w-16" className="mb-2" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-[#0F172A] dark:text-white tracking-tight">
                    {activeAlerts.length}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {criticalCount > 0 && (
                      <span className="text-xs font-semibold text-red-500">
                        {criticalCount} critical
                      </span>
                    )}
                    {warningCount > 0 && (
                      <span className="text-xs font-semibold text-amber-500">
                        {warningCount} warning
                      </span>
                    )}
                    {activeAlerts.length === 0 && (
                      <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} /> All clear
                      </span>
                    )}
                  </div>
                  {activeAlerts.length > 0 && (
                    <button
                      onClick={() => navigate("/smart-alerts")}
                      className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-0.5 mt-1 transition-colors"
                    >
                      View alerts <ChevronRight size={12} />
                    </button>
                  )}
                </>
              )}
            </KpiCard>
          </div>
        )}

        {/* ╔══ INVOICE-ONLY DASHBOARD ══════════════════════════╗ */}
        {!loading && invoiceOnly && !invoiceStats && (
          <div className="bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-2xl shadow-card p-10 flex flex-col items-center text-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-200 dark:border-violet-900/40">
              <FileBarChart size={26} className="text-violet-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">
                Upload your first invoice
              </h2>
              <p className="text-sm text-[#94A3B8] mt-2 max-w-sm">
                Upload AWS, Azure, or SAP BTP invoices to track costs, analyse
                trends, and unlock MSP savings insights.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
              {[
                {
                  icon: BarChart2,
                  label: "Cost Tracking",
                  desc: "Monthly spend trends",
                },
                {
                  icon: FileBarChart,
                  label: "Invoice History",
                  desc: "PDF & CSV support",
                },
                {
                  icon: PiggyBank,
                  label: "MSP Savings",
                  desc: "Discount insights",
                },
                {
                  icon: Activity,
                  label: "Trend Analysis",
                  desc: "Month-over-month view",
                },
                {
                  icon: DollarSign,
                  label: "Multi-Provider",
                  desc: "AWS, Azure, SAP BTP",
                },
                {
                  icon: Target,
                  label: "Budget Tracking",
                  desc: "Spend vs budget",
                },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F5F7FB] dark:bg-[#10182B] text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
                    <f.icon size={13} className="text-violet-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0F172A] dark:text-white">
                      {f.label}
                    </div>
                    <div className="text-[10px] text-[#94A3B8] mt-0.5">
                      {f.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/invoices")}
              className="btn-primary"
            >
              <Upload size={14} />
              Upload First Invoice
            </button>
            <p className="text-xs text-[#94A3B8]">
              Want to connect live cloud APIs?{" "}
              <button
                onClick={() => navigate("/subscription")}
                className="text-violet-500 hover:underline font-semibold"
              >
                Update cloud access
              </button>
            </p>
          </div>
        )}

        {/* ╔══ INVOICE KPI CARDS (invoice tab) ═════════════════╗ */}
        {(loading || invoiceStats) &&
          (dashTab === "invoice" || (invoiceOnly && !hasCloudAccess)) && (
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4 gap-4 ${!loading && !invoiceStats ? "hidden" : ""}`}
            >
              {/* 1 — Total Invoiced */}
              <KpiCard loading={loading}>
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <DollarSign size={18} className="text-violet-600" />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider text-[#94A3B8]">
                    Total Invoiced
                  </span>
                </div>
                <AnimatedAmount
                  value={invoiceStats?.total ?? 0}
                  loading={loading}
                />
                <div className="text-xs text-[#94A3B8] mt-1">
                  {invoiceStats
                    ? `${invoiceStats.count} invoice${invoiceStats.count !== 1 ? "s" : ""} total`
                    : "Upload invoices to track costs"}
                </div>
              </KpiCard>

              {/* 2 — This Month */}
              <KpiCard loading={loading}>
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Calendar size={18} className="text-blue-600" />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider text-[#94A3B8]">
                    This Month
                  </span>
                </div>
                {loading ? (
                  <Sk h="h-9" w="w-32" className="mb-1" />
                ) : (
                  (() => {
                    const now = new Date();
                    const thisMonth = invoiceMonthly.find(
                      (m) =>
                        m.year === now.getFullYear() &&
                        m.month === now.getMonth() + 1,
                    );
                    return (
                      <>
                        <div className="text-2xl font-bold text-[#0F172A] dark:text-white tracking-tight">
                          {thisMonth ? formatCurrency(thisMonth.total) : "—"}
                        </div>
                        <div className="text-xs text-[#94A3B8] mt-1">
                          {thisMonth
                            ? `Invoiced in ${now.toLocaleDateString("en-US", { month: "long" })}`
                            : "No invoices this month"}
                        </div>
                      </>
                    );
                  })()
                )}
              </KpiCard>

              {/* 3 — MSP Invoice Savings */}
              <KpiCard loading={loading}>
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <PiggyBank
                      size={16}
                      className="text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 tracking-wide">
                      MSP
                    </span>
                    <span className="text-[10px] font-bold tracking-wider text-[#94A3B8]">
                      Savings
                    </span>
                  </div>
                </div>
                <AnimatedAmount
                  value={invoiceMspSavings?.total ?? 0}
                  loading={loading}
                />
                <div className="mt-1.5 space-y-0.5">
                  {invoiceMspSavings ? (
                    invoiceMspSavings.breakdown.map((b) => (
                      <div
                        key={b.provider}
                        className="flex items-center justify-between text-[10px]"
                      >
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          {b.provider === "btp"
                            ? "SAP BTP"
                            : b.provider.charAt(0).toUpperCase() +
                              b.provider.slice(1)}{" "}
                          <span className="text-[#94A3B8] font-normal">
                            ({(b.rate * 100).toFixed(1)}%)
                          </span>
                        </span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">
                          {formatCurrency(b.savings)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-[#94A3B8]">
                      Upload invoices to see MSP savings
                    </div>
                  )}
                </div>
              </KpiCard>

              {/* 4 — Budget Utilization */}
              <KpiCard loading={loading}>
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Target size={18} className="text-[#7C3AED]" />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider text-[#94A3B8]">
                    Budget
                  </span>
                </div>
                {loading ? (
                  <Sk h="h-9" w="w-24" className="mb-2" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-[#0F172A] dark:text-white tracking-tight">
                      {budgetUtilPct !== null ? `${budgetUtilPct}%` : "—"}
                    </div>
                    {budgetUtilPct !== null ? (
                      <>
                        <div className="mt-3 h-2 bg-[#E2E8F0] dark:bg-[#1a2744] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${budgetUtilPct > 90 ? "bg-red-500" : budgetUtilPct > 75 ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${budgetUtilPct}%` }}
                          />
                        </div>
                        <div className="text-xs text-[#94A3B8] mt-1.5">
                          {formatCurrency(invoiceStats?.total ?? 0)} of{" "}
                          {formatCurrency(totalBudget)} used
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-[#94A3B8] mt-1">
                        No budgets —{" "}
                        <button
                          onClick={() => navigate("/budgets")}
                          className="text-[#2563EB] hover:underline font-semibold"
                        >
                          Create one
                        </button>
                      </div>
                    )}
                  </>
                )}
              </KpiCard>
            </div>
          )}

        {/* ╔══ INVOICE TREND CHART (invoice-only) ══════════════╗ */}
        {!loading &&
          ((invoiceOnly && !hasCloudAccess) ||
            (hasCloudAccess && dashTab === "invoice")) &&
          invoiceMonthly.length >= 2 && (
            <div className="bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-2xl shadow-card p-5">
              <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                    Invoice Spend Trend
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Monthly totals from uploaded invoices
                  </p>
                </div>
                <button
                  onClick={() => navigate("/invoices")}
                  className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-1 transition-colors"
                >
                  View all invoices <ArrowRight size={12} />
                </button>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={invoiceMonthly.map((m) => {
                    const d = new Date(m.year, m.month - 1, 1);
                    return {
                      label: d.toLocaleDateString("en-US", {
                        month: "short",
                        year: "2-digit",
                      }),
                      spend: m.total,
                    };
                  })}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#7C3AED"
                        stopOpacity={0.15}
                      />
                      <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="#E2E8F0"
                    strokeOpacity={0.5}
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                    }
                    width={48}
                  />
                  <Tooltip content={<SpendTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="spend"
                    name="Invoiced"
                    stroke="#7C3AED"
                    strokeWidth={2.5}
                    fill="url(#invGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

        {/* ╔══ CSP SAVINGS CHART (invoice-only) ════════════════╗ */}
        {!loading &&
          ((invoiceOnly && !hasCloudAccess) ||
            (hasCloudAccess && dashTab === "invoice")) &&
          invoiceMspSavings &&
          invoiceMonthly.length >= 1 &&
          (() => {
            const tb = invoiceStats?.totalByProvider ?? {};
            const totalInv = invoiceStats?.total ?? 1;
            const weightedRate = Object.entries(MSP_RATES).reduce(
              (r, [p, pRate]) => {
                return r + ((tb[p] ?? 0) / totalInv) * pRate;
              },
              0,
            );

            // Per-provider per-month data for stacked bars
            const PROVIDER_COLORS = {
              aws: "#F97316",
              azure: "#3B82F6",
              btp: "#10B981",
              gcp: "#6366f1",
            };
            const PROVIDER_LABELS = {
              aws: "AWS",
              azure: "Azure",
              btp: "SAP BTP",
              gcp: "Google Cloud",
            };
            const activeProviders = Object.keys(MSP_RATES).filter(
              (p) => (tb[p] ?? 0) > 0,
            );

            const chartData = invoiceMonthly.map((m) => {
              const d = new Date(m.year, m.month - 1, 1);
              const row = {
                label: d.toLocaleDateString("en-US", {
                  month: "short",
                  year: "2-digit",
                }),
                invoiceTotal: parseFloat((m.total ?? 0).toFixed(2)),
              };
              // Per-provider spend
              activeProviders.forEach((p) => {
                row[`spend_${p}`] = parseFloat((m[p] ?? 0).toFixed(2));
              });
              // Per-provider savings
              activeProviders.forEach((p) => {
                row[`sav_${p}`] = parseFloat(
                  ((m[p] ?? 0) * (MSP_RATES[p] ?? 0)).toFixed(2),
                );
              });
              row.cspSavings = parseFloat(
                activeProviders
                  .reduce((s, p) => s + (m[p] ?? 0) * (MSP_RATES[p] ?? 0), 0)
                  .toFixed(2),
              );
              return row;
            });

            const totalSaved = invoiceMspSavings.total;
            const totalInvoiced = invoiceStats?.total ?? 0;
            const savingsPct =
              totalInvoiced > 0
                ? ((totalSaved / totalInvoiced) * 100).toFixed(2)
                : "0";

            // Custom label on top of each bar stack showing total savings for that month
            const SavingsLabel = ({ x, y, width, value }) => {
              if (!value || value <= 0) return null;
              return (
                <text
                  x={x + width / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight="700"
                  fill="#10b981"
                >
                  -{formatCurrency(value)}
                </text>
              );
            };

            const CspTooltip = ({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const total = payload.find((p) => p.dataKey === "invoiceTotal");
              const sav = payload.find((p) => p.dataKey === "cspSavings");
              const providerRows = activeProviders
                .map((p) => ({
                  p,
                  color: PROVIDER_COLORS[p],
                  label: PROVIDER_LABELS[p],
                  spend:
                    payload.find((d) => d.dataKey === `spend_${p}`)?.value ?? 0,
                  savings:
                    payload.find((d) => d.dataKey === `sav_${p}`)?.value ?? 0,
                  rate: MSP_RATES[p],
                }))
                .filter((r) => r.spend > 0);
              return (
                <div className="bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-xl shadow-xl px-4 py-3 text-xs min-w-[200px]">
                  <p className="text-[#94A3B8] font-bold mb-2">{label}</p>
                  {providerRows.map((r) => (
                    <div
                      key={r.p}
                      className="flex items-center justify-between gap-4 mb-1.5"
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-sm"
                          style={{ background: r.color }}
                        />
                        <span className="text-[#475569] dark:text-[#94A3B8]">
                          {r.label}{" "}
                          <span className="text-[#94A3B8]">
                            ({(r.rate * 100).toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#0F172A] dark:text-white">
                          {formatCurrency(r.spend)}
                        </span>
                        <span className="ml-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                          -{formatCurrency(r.savings)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {sav && (
                    <div className="mt-2 pt-2 border-t border-[#E2E8F0] dark:border-[#1a2744] flex items-center justify-between">
                      <span className="font-bold text-[#0F172A] dark:text-white">
                        Total savings
                      </span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        -{formatCurrency(sav.value)}
                      </span>
                    </div>
                  )}
                </div>
              );
            };

            return (
              <div className="bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-2xl shadow-card overflow-hidden">
                {/* ── Gradient header ── */}
                <div className="px-6 py-3 border-b border-[#E2E8F0] dark:border-[#1a2744]">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-emerald-500" />
                      <h2 className="text-sm font-bold text-[#0F172A] dark:text-white tracking-wide">
                        Maitsys CSP Savings vs Invoice Total
                      </h2>
                      <span className="text-xs text-[#94A3B8] hidden sm:inline">
                        — bars = spend · line = CSP savings
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="px-3 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-[#1a2744]">
                        <p className="text-[10px] text-[#94A3B8] font-semibold">
                          Total Invoiced
                        </p>
                        <p className="text-sm font-black text-[#0F172A] dark:text-white tabular-nums">
                          {formatCurrency(totalInvoiced)}
                        </p>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-[#1a2744]">
                        <p className="text-[10px] text-emerald-500 font-semibold">
                          CSP Savings
                        </p>
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                          -{formatCurrency(totalSaved)}
                        </p>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-[#1a2744]">
                        <p className="text-[10px] text-[#94A3B8] font-semibold">
                          Avg Rate
                        </p>
                        <p className="text-sm font-black text-[#0F172A] dark:text-white tabular-nums">
                          {savingsPct}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Per-provider breakdown strip ── */}
                <div className="flex flex-wrap gap-0 divide-x divide-[#E2E8F0] dark:divide-[#1a2744] border-b border-[#E2E8F0] dark:border-[#1a2744]">
                  {invoiceMspSavings.breakdown.map((b) => (
                    <div
                      key={b.provider}
                      className="flex-1 min-w-[120px] px-4 py-2"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            background:
                              PROVIDER_COLORS[b.provider] ?? "#94A3B8",
                          }}
                        />
                        <p className="text-[10px] font-bold text-[#94A3B8]  tracking-wider">
                          {b.provider === "btp"
                            ? "SAP BTP"
                            : b.provider.toUpperCase()}{" "}
                          <span className="normal-case font-normal">
                            ({(b.rate * 100).toFixed(1)}%)
                          </span>
                        </p>
                      </div>
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                        -{formatCurrency(b.savings)}
                      </p>
                      <p className="text-[10px] text-[#94A3B8]">
                        from {formatCurrency(b.amount)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* ── Stacked bar + savings line chart ── */}
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-4 text-xs flex-wrap">
                    {activeProviders.map((p) => (
                      <div key={p} className="flex items-center gap-1.5">
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ background: PROVIDER_COLORS[p] }}
                        />
                        <span className="text-[#475569] dark:text-[#94A3B8] font-medium">
                          {PROVIDER_LABELS[p]}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-[#E2E8F0] dark:border-[#1a2744]">
                      <svg width="18" height="10">
                        <line
                          x1="0"
                          y1="5"
                          x2="18"
                          y2="5"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeDasharray="5 3"
                        />
                      </svg>
                      <span className="text-[#475569] dark:text-[#94A3B8] font-medium">
                        CSP Savings
                      </span>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 24, right: 48, left: 0, bottom: 0 }}
                      stackOffset="none"
                    >
                      <defs>
                        {activeProviders.map((p) => (
                          <linearGradient
                            key={p}
                            id={`grad_${p}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={PROVIDER_COLORS[p]}
                              stopOpacity={0.9}
                            />
                            <stop
                              offset="100%"
                              stopColor={PROVIDER_COLORS[p]}
                              stopOpacity={0.55}
                            />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid
                        stroke="#E2E8F0"
                        strokeOpacity={0.4}
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#94A3B8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        tick={{ fontSize: 11, fill: "#94A3B8" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) =>
                          `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                        }
                        width={52}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 11, fill: "#10b981" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) =>
                          `-$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`
                        }
                        width={48}
                      />
                      <Tooltip
                        content={<CspTooltip />}
                        cursor={{ fill: "rgba(99,102,241,0.06)" }}
                      />
                      {/* Stacked bars per provider */}
                      {activeProviders.map((p, i) => (
                        <Bar
                          key={p}
                          yAxisId="left"
                          dataKey={`spend_${p}`}
                          name={PROVIDER_LABELS[p]}
                          stackId="inv"
                          fill={`url(#grad_${p})`}
                          maxBarSize={56}
                          radius={
                            i === activeProviders.length - 1
                              ? [4, 4, 0, 0]
                              : [0, 0, 0, 0]
                          }
                        >
                          {/* savings label only on top bar */}
                          {i === activeProviders.length - 1 && (
                            <LabelList
                              dataKey="cspSavings"
                              content={<SavingsLabel />}
                            />
                          )}
                        </Bar>
                      ))}
                      {/* CSP savings line */}
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="cspSavings"
                        name="CSP Savings"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        strokeDasharray="6 3"
                        dot={{
                          r: 5,
                          fill: "#10b981",
                          strokeWidth: 2,
                          stroke: "#fff",
                        }}
                        activeDot={{
                          r: 7,
                          fill: "#10b981",
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()}

        {/* ╔══ RECENT INVOICES (invoice-only) ══════════════════╗ */}
        {!loading &&
          ((invoiceOnly && !hasCloudAccess) ||
            (hasCloudAccess && dashTab === "invoice")) &&
          recentInvoices.length > 0 && (
            <div className="bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-2xl shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 flex items-center justify-center">
                    <FileBarChart size={14} className="text-violet-500" />
                  </div>
                  <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                    Recent Invoices
                  </h2>
                </div>
                <button
                  onClick={() => navigate("/invoices")}
                  className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-0.5 transition-colors"
                >
                  View all <ChevronRight size={12} />
                </button>
              </div>
              <div className="space-y-2">
                {recentInvoices.map((inv, i) => {
                  const provider = (inv.provider || "unknown").toLowerCase();
                  const providerLabel =
                    provider === "btp"
                      ? "SAP BTP"
                      : provider.charAt(0).toUpperCase() + provider.slice(1);
                  const providerColor =
                    provider === "aws"
                      ? "text-orange-600 border-orange-200 dark:border-orange-900/40"
                      : provider === "azure"
                        ? "text-blue-600 border-blue-200 dark:border-blue-900/40"
                        : "text-emerald-600 border-emerald-200 dark:border-emerald-900/40";
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#10182B] border border-[#E2E8F0] dark:border-[#1a2744]"
                    >
                      <div
                        className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${providerColor}`}
                      >
                        {providerLabel}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[#0F172A] dark:text-white truncate">
                          {inv.billing_period || inv.invoice_date
                            ? new Date(
                                inv.billing_period || inv.invoice_date,
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                              })
                            : "Invoice"}
                        </div>
                        {inv.meta?.billingProfile && (
                          <div className="text-[10px] text-[#94A3B8] truncate">
                            {inv.meta.billingProfile}
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-bold text-[#0F172A] dark:text-white shrink-0">
                        {formatCurrency(Number(inv.total_cost || 0))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => navigate("/invoices")}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-[#E2E8F0] dark:border-[#1a2744] text-xs font-semibold text-[#94A3B8] hover:border-violet-300 hover:text-violet-500 dark:hover:border-violet-700 transition-colors"
              >
                <Upload size={12} />
                Upload more invoices
              </button>
            </div>
          )}

        {/* ╔══ SPEND TREND (cloud tab) ════════════════════════╗ */}
        {(loading || hasAnyCloud) && dashTab !== "invoice" && (
          <div className="bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-2xl shadow-card p-5">
            <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                  Spend Trend
                </h2>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-[#94A3B8] flex-wrap">
                  {trendData.some((d) => d.azure != null) && (
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-5 h-0.5 bg-[#3B82F6] rounded" />
                      Azure
                    </span>
                  )}
                  {trendData.some((d) => d.aws != null) && (
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-5 h-0.5 bg-[#F97316] rounded" />
                      AWS
                    </span>
                  )}
                  {trendData.some((d) => d.btp != null) && (
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-5 h-0.5 bg-[#10B981] rounded" />
                      SAP BTP
                    </span>
                  )}
                  {trendData.some((d) => d.gcp != null) && (
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-5 h-0.5 bg-[#4285F4] rounded" />
                      GCP
                    </span>
                  )}
                  {!trendData.some(
                    (d) => d.azure != null || d.aws != null || d.btp != null || d.gcp != null,
                  ) && (
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-5 h-0.5 bg-[#2563EB] rounded" />
                      Total Spend
                    </span>
                  )}
                  {trendData.some(
                    (d) =>
                      d.forecast != null ||
                      d.forecastAzure != null ||
                      d.forecastAws != null ||
                      d.forecastBtp != null ||
                      d.forecastGcp != null,
                  ) && (
                    <span className="flex items-center gap-1.5 border-l border-[#E2E8F0] dark:border-[#1a2744] pl-3 ml-1">
                      <svg width="18" height="8">
                        <line
                          x1="0"
                          y1="4"
                          x2="18"
                          y2="4"
                          stroke="#94A3B8"
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                        />
                      </svg>
                      Forecast
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {TREND_RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setTrendRange(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      trendRange === r
                        ? "bg-[#2563EB] text-white shadow-sm"
                        : "text-[#94A3B8] hover:text-[#475569] dark:hover:text-[#CBD5E1] hover:bg-[#F5F7FB] dark:hover:bg-[#10182B]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-6">
              {/* Chart */}
              <div className="flex-1 min-w-0">
                {loading ? (
                  <Sk h="h-52" />
                ) : trendData.length >= 2 ? (
                  <ResponsiveContainer width="100%" height={210}>
                    <ComposedChart
                      data={trendData}
                      margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="areaGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#2563EB"
                            stopOpacity={0.08}
                          />
                          <stop
                            offset="100%"
                            stopColor="#2563EB"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient id="azureGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.22} />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="awsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F97316" stopOpacity={0.22} />
                          <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="btpGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.22} />
                          <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gcpGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4285F4" stopOpacity={0.22} />
                          <stop offset="100%" stopColor="#4285F4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="#E2E8F0"
                        strokeOpacity={0.5}
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#94A3B8" }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#94A3B8" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) =>
                          `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                        }
                        width={48}
                      />
                      <Tooltip content={<SpendTooltip />} />
                      {/* Per-provider areas — gradient fill in each provider's own color, only render when provider has data in range */}
                      {trendData.some((d) => d.azure != null) && (
                        <Area
                          type="monotone"
                          dataKey="azure"
                          name="Azure"
                          stroke="#3B82F6"
                          strokeWidth={2.5}
                          fill="url(#azureGrad)"
                          dot={false}
                          connectNulls={true}
                        />
                      )}
                      {trendData.some((d) => d.aws != null) && (
                        <Area
                          type="monotone"
                          dataKey="aws"
                          name="AWS"
                          stroke="#F97316"
                          strokeWidth={2.5}
                          fill="url(#awsGrad)"
                          dot={false}
                          connectNulls={true}
                        />
                      )}
                      {trendData.some((d) => d.btp != null) && (
                        <Area
                          type="monotone"
                          dataKey="btp"
                          name="SAP BTP"
                          stroke="#10B981"
                          strokeWidth={2.5}
                          fill="url(#btpGrad)"
                          dot={false}
                          connectNulls={true}
                        />
                      )}
                      {trendData.some((d) => d.gcp != null) && (
                        <Area
                          type="monotone"
                          dataKey="gcp"
                          name="GCP"
                          stroke="#4285F4"
                          strokeWidth={2.5}
                          fill="url(#gcpGrad)"
                          dot={false}
                          connectNulls={true}
                        />
                      )}
                      {/* Fallback total area when no per-provider breakdown */}
                      {!trendData.some(
                        (d) =>
                          d.azure != null || d.aws != null || d.btp != null || d.gcp != null,
                      ) && (
                        <Area
                          type="monotone"
                          dataKey="spend"
                          name="Total Spend"
                          stroke="#2563EB"
                          strokeWidth={2.5}
                          fill="url(#areaGrad)"
                          dot={false}
                          connectNulls={false}
                        />
                      )}
                      {/* Per-provider dashed forecast lines */}
                      {trendData.some((d) => d.forecastAzure != null) && (
                        <Line
                          type="monotone"
                          dataKey="forecastAzure"
                          name="Azure Forecast"
                          stroke="#3B82F6"
                          strokeWidth={1.5}
                          strokeDasharray="5 4"
                          dot={false}
                          connectNulls={true}
                          strokeOpacity={0.7}
                        />
                      )}
                      {trendData.some((d) => d.forecastAws != null) && (
                        <Line
                          type="monotone"
                          dataKey="forecastAws"
                          name="AWS Forecast"
                          stroke="#F97316"
                          strokeWidth={1.5}
                          strokeDasharray="5 4"
                          dot={false}
                          connectNulls={true}
                          strokeOpacity={0.7}
                        />
                      )}
                      {trendData.some((d) => d.forecastBtp != null) && (
                        <Line
                          type="monotone"
                          dataKey="forecastBtp"
                          name="BTP Forecast"
                          stroke="#10B981"
                          strokeWidth={1.5}
                          strokeDasharray="5 4"
                          dot={false}
                          connectNulls={true}
                          strokeOpacity={0.7}
                        />
                      )}
                      {trendData.some((d) => d.forecastGcp != null) && (
                        <Line
                          type="monotone"
                          dataKey="forecastGcp"
                          name="GCP Forecast"
                          stroke="#3b82f6"
                          strokeWidth={1.5}
                          strokeDasharray="5 4"
                          dot={false}
                          connectNulls={true}
                          strokeOpacity={0.7}
                        />
                      )}
                      {/* Fallback grey total forecast when no per-provider breakdown */}
                      {!trendData.some(
                        (d) =>
                          d.forecastAzure != null ||
                          d.forecastAws != null ||
                          d.forecastBtp != null ||
                          d.forecastGcp != null,
                      ) && (
                        <Line
                          type="monotone"
                          dataKey="forecast"
                          name="Forecast"
                          stroke="#94A3B8"
                          strokeWidth={2}
                          strokeDasharray="5 4"
                          dot={false}
                          connectNulls={true}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-52 flex flex-col items-center justify-center gap-2">
                    <BarChart2
                      size={28}
                      className="text-[#E2E8F0] dark:text-[#1a2744]"
                    />
                    <p className="text-xs text-[#94A3B8]">
                      No spend data for this period
                    </p>
                    <p className="text-[10px] text-[#94A3B8]">
                      Monthly cost history will appear once cloud accounts sync
                    </p>
                  </div>
                )}
              </div>

              {/* Forecast panel */}
              <div className="w-56 flex-shrink-0 hidden xl:flex flex-col gap-3">
                <div className="text-xs font-semibold text-[#94A3B8] flex items-center gap-1">
                  End-of-Month Forecast
                  <Info
                    size={12}
                    className="text-[#E2E8F0] dark:text-[#1a2744]"
                  />
                </div>
                {loading ? (
                  <Sk h="h-10" w="w-32" />
                ) : forecastEOM !== null ? (
                  <>
                    {/* Total */}
                    <div>
                      <div className="text-2xl font-bold text-[#0F172A] dark:text-white tracking-tight">
                        {formatCurrency(forecastEOM)}
                      </div>
                      {budgetUtilPct !== null && (
                        <div
                          className={`text-xs font-semibold mt-0.5 ${forecastEOM > totalBudget ? "text-red-500" : "text-emerald-500"}`}
                        >
                          {((forecastEOM / (totalBudget || 1)) * 100).toFixed(
                            1,
                          )}
                          % vs budget
                        </div>
                      )}
                    </div>
                    {/* Per-provider breakdown */}
                    {(forecastByProvider.azure != null ||
                      forecastByProvider.aws != null ||
                      forecastByProvider.btp != null) && (
                      <div className="space-y-1.5">
                        {[
                          {
                            key: "azure",
                            label: "Azure",
                            color: "#3B82F6",
                            val: forecastByProvider.azure,
                          },
                          {
                            key: "aws",
                            label: "AWS",
                            color: "#F97316",
                            val: forecastByProvider.aws,
                          },
                          {
                            key: "btp",
                            label: "SAP BTP",
                            color: "#10B981",
                            val: forecastByProvider.btp,
                          },
                        ]
                          .filter((p) => p.val != null && p.val > 0)
                          .map((p) => (
                            <div
                              key={p.key}
                              className="flex items-center justify-between gap-2 bg-[#F8FAFC] dark:bg-[#10182B] rounded-lg px-2.5 py-1.5"
                            >
                              <div className="flex items-center gap-1.5">
                                <svg width="14" height="8">
                                  <line
                                    x1="0"
                                    y1="4"
                                    x2="14"
                                    y2="4"
                                    stroke={p.color}
                                    strokeWidth="1.5"
                                    strokeDasharray="4 2"
                                  />
                                </svg>
                                <span className="text-[11px] font-semibold text-[#475569] dark:text-[#94A3B8]">
                                  {p.label}
                                </span>
                              </div>
                              <span className="text-[11px] font-bold text-[#0F172A] dark:text-white tabular-nums">
                                {formatCurrency(p.val)}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                    {/* Budget status */}
                    <div className="p-2.5 rounded-xl flex items-start gap-2">
                      <CheckCircle2
                        size={13}
                        className={
                          forecastEOM <= (totalBudget || Infinity)
                            ? "text-[#2563EB] mt-0.5 flex-shrink-0"
                            : "text-red-500 mt-0.5 flex-shrink-0"
                        }
                      />
                      <p
                        className={`text-[11px] font-medium leading-snug ${forecastEOM <= (totalBudget || Infinity) ? "text-[#2563EB] dark:text-[#3B82F6]" : "text-red-600 dark:text-red-400"}`}
                      >
                        {forecastEOM <= (totalBudget || Infinity)
                          ? "On track to stay within budget."
                          : "Forecast exceeds budget. Review spend now."}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-[#94A3B8]">
                    Not enough data for forecast
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ╔══ AI INSIGHTS  +  TOP ACTIONS (cloud tab) ════════╗ */}
        {(loading || hasAnyCloud) && dashTab !== "invoice" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* AI Insights */}
            <div
              className="bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-2xl shadow-card flex flex-col overflow-hidden"
              style={{ height: "260px" }}
            >
              {/* fixed header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 flex items-center justify-center">
                    <Bot size={14} className="text-[#2563EB]" />
                  </div>
                  <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                    AI Insights
                  </h2>
                </div>
                <Sparkles size={16} className="text-[#94A3B8]" />
              </div>

              {/* scrollable body */}
              <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3 min-h-0">
                {loading ? (
                  <div className="space-y-3">
                    <Sk h="h-5" w="w-3/4" />
                    <Sk h="h-16" />
                  </div>
                ) : aiInsights.length > 0 ? (
                  <>
                    {aiInsights.map((ins, i) => (
                      <div
                        key={i}
                        className="bg-[#F8FAFC] dark:bg-[#10182B] rounded-xl p-4"
                      >
                        <p className="text-sm font-bold text-[#0F172A] dark:text-white leading-snug mb-3">
                          {ins.headline}
                        </p>
                        {ins.reasons.length > 0 && (
                          <>
                            <p className="text-xs text-[#94A3B8] mb-2 font-medium">
                              Main reasons detected:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {ins.reasons.map((r, j) => (
                                <div
                                  key={j}
                                  className="flex items-start gap-2 bg-white dark:bg-[#0B1023] rounded-lg p-2.5 border border-[#E2E8F0] dark:border-[#1a2744]"
                                >
                                  <AlertCircle
                                    size={12}
                                    className="text-amber-500 flex-shrink-0 mt-0.5"
                                  />
                                  <span className="text-xs text-[#475569] dark:text-[#94A3B8] leading-snug">
                                    {r}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  <EmptyState
                    icon={Bot}
                    title="No insights yet"
                    desc="Connect cloud accounts to generate AI-powered cost insights and spend anomaly detection."
                  />
                )}
              </div>

              {/* fixed footer link */}
              {!loading && aiInsights.length > 0 && (
                <div className="px-5 pb-4 flex-shrink-0 border-t border-[#E2E8F0] dark:border-[#1a2744] pt-3">
                  <button
                    onClick={() => navigate("/recommendations")}
                    className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
                  >
                    View all insights <ChevronRight size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Top Actions */}
            <div
              className="bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-2xl shadow-card flex flex-col overflow-hidden"
              style={{ height: "260px" }}
            >
              {/* header — pinned */}
              <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 flex items-center justify-center">
                    <PiggyBank
                      size={14}
                      className="text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                  <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                    MSP Savings
                  </h2>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Maitsys CSP
                </span>
              </div>

              {/* per-provider MSP savings rows */}
              <div className="flex-1 overflow-y-auto px-5 pb-3 min-h-0">
                {loading ? (
                  <div className="space-y-2 pt-1">
                    {[...Array(3)].map((_, i) => (
                      <Sk key={i} h="h-12" />
                    ))}
                  </div>
                ) : mspProviderActions.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <EmptyState
                      icon={PiggyBank}
                      title="No spend data yet"
                      desc="Connect cloud accounts to calculate your Maitsys CSP savings."
                      action={() => setShowWizard(true)}
                      actionLabel="Connect Cloud"
                    />
                  </div>
                ) : (
                  <>
                    {mspProviderActions.map((p) => (
                      <div
                        key={p.key}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-[#10182B] transition-colors"
                      >
                        <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                          <p.icon size={16} style={{ color: p.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[#0F172A] dark:text-white truncate">
                            {p.label}
                          </div>
                          <div className="text-[10px] text-[#94A3B8] mt-0.5">
                            {(p.rate * 100).toFixed(1)}% discount ·{" "}
                            {formatCurrency(p.spend)} spend
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs text-[#94A3B8]">
                            Monthly Savings
                          </div>
                          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(p.savings)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Total row */}
                    <div className="mx-3 mt-2 pt-2 border-t border-[#E2E8F0] dark:border-[#1a2744] flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F172A] dark:text-white">
                        Total CSP Savings
                      </span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(
                          mspProviderActions.reduce((s, p) => s + p.savings, 0),
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ╔══ INVOICE SUMMARY CARD (cloud tab) ╗ */}
        {!loading && invoiceStats && hasCloudAccess && dashTab === "cloud" && (
          <div className="bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-2xl shadow-card px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 flex items-center justify-center">
                <FileBarChart size={18} className="text-[#2563EB]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#94A3B8] tracking-wider">
                  Invoice Summary
                </p>
                <p className="text-sm font-bold text-[#0F172A] dark:text-white mt-0.5">
                  {invoiceStats.count} invoice
                  {invoiceStats.count !== 1 ? "s" : ""} ·{" "}
                  <span className="text-[#2563EB]">
                    {formatCurrency(invoiceStats.total)}
                  </span>{" "}
                  total
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {Object.entries(invoiceStats.byProvider).map(
                ([provider, count]) => (
                  <span
                    key={provider}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full border tracking-wide capitalize
                    bg-[#F5F7FB] dark:bg-[#10182B] text-[#475569] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#1a2744]"
                  >
                    {provider === "btp"
                      ? "SAP BTP"
                      : provider.charAt(0).toUpperCase() + provider.slice(1)}
                    : {count}
                  </span>
                ),
              )}
              <button
                onClick={() => navigate("/invoices")}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors bg-[#EFF6FF] dark:bg-[#1e3a8f]/20 px-3 py-1.5 rounded-lg"
              >
                View Invoices <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}

        {/* ╔══ RECENT ALERTS (cloud tab) ══════════════════════╗ */}
        {(loading || hasAnyCloud) && dashTab !== "invoice" && (
          <div className="bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    criticalCount > 0
                      ? "bg-red-50 dark:bg-red-950/20"
                      : "bg-[#F5F7FB] dark:bg-[#10182B]"
                  }`}
                >
                  <AlertTriangle
                    size={14}
                    className={
                      criticalCount > 0 ? "text-red-500" : "text-[#94A3B8]"
                    }
                  />
                </div>
                <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                  Recent Alerts
                </h2>
                {activeAlerts.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-300 dark:border-red-700 text-red-500 dark:text-red-400">
                    {activeAlerts.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate("/smart-alerts")}
                className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-0.5 transition-colors"
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => (
                  <Sk key={i} h="h-16" />
                ))}
              </div>
            ) : activeAlerts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeAlerts.slice(0, 6).map((a, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#1a2744]"
                  >
                    <AlertCircle
                      size={14}
                      className={`flex-shrink-0 mt-0.5 ${
                        a.alert_type === "resource_creation"
                          ? "text-emerald-500"
                          : a.severity === "critical"
                            ? "text-red-500"
                            : a.severity === "high"
                              ? "text-amber-500"
                              : "text-[#94A3B8]"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        {a.alert_type === "resource_creation" && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400  tracking-wide">
                            New Resource
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-[#0F172A] dark:text-white leading-snug line-clamp-2">
                        {a.title || a.message || a.alert_type}
                      </div>
                      <div className="text-[10px] text-[#94A3B8] mt-1">
                        {a.detected_at
                          ? new Date(a.detected_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                          : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 py-4 px-4 bg-[#F0FDF4] dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                <CheckCircle2
                  size={18}
                  className="text-emerald-500 flex-shrink-0"
                />
                <div>
                  <div className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    All clear — no active alerts
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Your cloud infrastructure is running within normal
                    parameters.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ╔══ FOOTER SUMMARY ═════════════════════════════════╗ */}
        <div className="flex items-center justify-between text-xs text-[#94A3B8] pt-1 flex-wrap gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-semibold text-[#475569] dark:text-[#94A3B8]">
                {providers.length} Provider{providers.length !== 1 ? "s" : ""}
              </span>
            </span>
            <span className="font-semibold text-[#475569] dark:text-[#94A3B8]">
              {totalAccounts} Account{totalAccounts !== 1 ? "s" : ""}
            </span>
            {budgets.length > 0 && (
              <span className="font-semibold text-[#475569] dark:text-[#94A3B8]">
                {budgets.length} Budget{budgets.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw size={11} />
            {lastSync
              ? `Last synced ${lastSync.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
              : "Not synced yet"}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ACTION ROW (shared by Top Actions card)
───────────────────────────────────────────────────────── */
function ActionRow({ action, navigate, formatCurrency }) {
  return (
    <button
      onClick={() => navigate("/recommendations")}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-[#10182B] transition-colors group text-left"
    >
      <div className="w-9 h-9 rounded-xl bg-[#F5F7FB] dark:bg-[#10182B] flex items-center justify-center flex-shrink-0 group-hover:bg-[#EFF6FF] dark:group-hover:bg-[#2563EB]/10 transition-colors">
        <action.icon
          size={16}
          className="text-[#475569] dark:text-[#94A3B8] group-hover:text-[#2563EB] transition-colors"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[#0F172A] dark:text-white truncate">
          {action.title}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <ImpactBadge level={action.impact} />
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-xs text-[#94A3B8]">Est. Savings</div>
        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
          {action.savings > 0 ? `${formatCurrency(action.savings)}/mo` : "—"}
        </div>
      </div>
      <ChevronRight
        size={14}
        className="text-[#E2E8F0] dark:text-[#1a2744] group-hover:text-[#2563EB] transition-colors flex-shrink-0"
      />
    </button>
  );
}
ActionRow.propTypes = {
  action: PropTypes.object.isRequired,
  navigate: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired,
};

/* ─────────────────────────────────────────────────────────
   KPI CARD WRAPPER
───────────────────────────────────────────────────────── */
function KpiCard({ children, loading }) {
  return (
    <div className="bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-2xl shadow-card px-4 py-3 hover:shadow-card-lg transition-shadow duration-200">
      {loading ? (
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <Sk w="w-10" h="h-10" className="rounded-xl" />
            <Sk w="w-28" h="h-3" />
          </div>
          <Sk h="h-9" w="w-32" />
          <Sk h="h-3" w="w-24" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
KpiCard.propTypes = { children: PropTypes.node, loading: PropTypes.bool };

/* ─────────────────────────────────────────────────────────
   ANIMATED AMOUNT
───────────────────────────────────────────────────────── */
function AnimatedAmount({ value, loading }) {
  const animated = useCountUp(value, 900);
  if (loading) return <Sk h="h-9" w="w-32" className="mb-1" />;
  return (
    <div className="text-2xl font-bold text-[#0F172A] dark:text-white tracking-tight">
      {formatCurrency(animated)}
    </div>
  );
}
AnimatedAmount.propTypes = { value: PropTypes.number, loading: PropTypes.bool };
