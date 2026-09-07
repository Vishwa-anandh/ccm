import React, { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import {
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Clock,
  BellOff,
  RefreshCw,
  Eye,
  CheckCheck,
  Zap,
  BarChart3,
  ShieldAlert,
  PiggyBank,
  PackagePlus,
  PackageMinus,
  Users,
  Mail,
  Plus,
  Trash2,
  Bell,
  X,
  Info,
  EyeOff,
  SlidersHorizontal,
  Save,
  CalendarClock,
  ThumbsDown,
} from "lucide-react";
import api from "../api/index";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  critical: {
    text: "text-red-700 dark:text-red-400",
    border: "border-red-300 dark:border-red-700",
    dot: "bg-red-500",
    label: "Critical",
  },
  high: {
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-300 dark:border-orange-700",
    dot: "bg-orange-500",
    label: "High",
  },
  medium: {
    text: "text-yellow-700 dark:text-yellow-400",
    border: "border-yellow-300 dark:border-yellow-700",
    dot: "bg-yellow-500",
    label: "Medium",
  },
  low: {
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-300 dark:border-blue-700",
    dot: "bg-blue-400",
    label: "Low",
  },
};

const TYPE_CONFIG = {
  spike:             { icon: TrendingUp,   color: "text-red-500",     label: "Cost Spike" },
  unusual_spend:     { icon: BarChart3,    color: "text-orange-500",  label: "Unusual Spend" },
  abnormal_usage:    { icon: ShieldAlert,  color: "text-purple-500",  label: "Abnormal Usage" },
  budget_breach:     { icon: PiggyBank,    color: "text-yellow-600",  label: "Budget Breach" },
  forecast:          { icon: CalendarClock,color: "text-indigo-500",  label: "Forecast Alert" },
  resource_creation: { icon: PackagePlus,  color: "text-emerald-600", label: "New Resource" },
  resource_deletion: { icon: PackageMinus, color: "text-red-500",     label: "Resource Removed" },
};

const ALERT_TYPE_LABELS = {
  cost_threshold:    "Cost & Budget Alerts",
  resource_creation: "Resource / Service Creation Alerts",
};

const SeverityBadge = ({ severity }) => {
  const cfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.medium;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};
SeverityBadge.propTypes = { severity: PropTypes.string.isRequired };

const AlertIcon = ({ type }) => {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.spike;
  const TypeIcon = cfg.icon;
  return <TypeIcon className={`w-4 h-4 ${cfg.color}`} />;
};
AlertIcon.propTypes = { type: PropTypes.string.isRequired };

const DetailRow = ({ label, value }) => {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 dark:border-gray-800/60 last:border-0">
      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 shrink-0">{label}</span>
      <span className="text-xs font-medium text-gray-800 dark:text-gray-200 text-right break-words">{value}</span>
    </div>
  );
};
DetailRow.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.node };

const fmtMoney = (n) =>
  n === null || n === undefined ? null : `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AlertDetailModal = ({ alert, onClose, onResolve, onIgnore }) => {
  if (!alert) return null;
  const cfg = TYPE_CONFIG[alert.alert_type] ?? TYPE_CONFIG.spike;
  const TypeIcon = cfg.icon;
  const rootCause = alert.root_cause && typeof alert.root_cause === "object" ? alert.root_cause : null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
              <TypeIcon className={`w-4.5 h-4.5 ${cfg.color}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{cfg.label}</p>
              <p className="text-[11px] text-gray-400">Alert #{alert.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge severity={alert.severity} />
            {alert.provider && alert.provider !== "all" && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                {alert.provider === "btp" ? "SAP BTP" : alert.provider.toUpperCase()}
              </span>
            )}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 capitalize">
              {alert.status}
            </span>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{alert.message}</p>

          <div>
            <DetailRow label="Account" value={alert.account_id} />
            <DetailRow
              label="Detected at"
              value={alert.detected_at ? new Date(alert.detected_at).toLocaleString("en-US", {
                weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
              }) : null}
            />
            <DetailRow label="Detection method" value={alert.detection_method} />
            <DetailRow label="Expected cost" value={fmtMoney(alert.expected_cost)} />
            <DetailRow label="Actual cost" value={fmtMoney(alert.actual_cost)} />
            <DetailRow
              label="Delta"
              value={
                alert.delta !== null && alert.delta !== undefined
                  ? `${fmtMoney(alert.delta)}${alert.delta_percent !== null && alert.delta_percent !== undefined ? ` (${alert.delta_percent > 0 ? "+" : ""}${alert.delta_percent.toFixed(1)}%)` : ""}`
                  : null
              }
            />
            <DetailRow label="Projected end-of-month" value={fmtMoney(alert.projected_eom)} />
            {rootCause?.service && <DetailRow label="Service" value={rootCause.service} />}
            {rootCause?.delta !== undefined && <DetailRow label="Service delta" value={fmtMoney(rootCause.delta)} />}
            {rootCause?.zScore !== undefined && <DetailRow label="Z-score" value={Number(rootCause.zScore).toFixed(2)} />}
            {alert.ignored && <DetailRow label="Ignored at" value={alert.ignored_at ? new Date(alert.ignored_at).toLocaleString() : "Yes"} />}
          </div>
        </div>

        {alert.status !== "resolved" && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
            {!alert.ignored && (
              <button
                onClick={() => { onIgnore(alert.id); onClose(); }}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 transition"
              >
                <EyeOff className="w-3.5 h-3.5" /> Ignore
              </button>
            )}
            <button
              onClick={() => { onResolve(alert.id); onClose(); }}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Resolve
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
AlertDetailModal.propTypes = {
  alert: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onResolve: PropTypes.func.isRequired,
  onIgnore: PropTypes.func.isRequired,
};

const KpiCard = ({ label, value, colorClass, icon: Icon }) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3 shadow-sm">
    <Icon className={`w-5 h-5 shrink-0 ${colorClass}`} />
    <div>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  </div>
);
KpiCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  colorClass: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
};

// ─── How Alerts Work — shown only in empty state ───────────────────────────────
const HowItWorks = () => (
  <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left border-t border-gray-100 dark:border-gray-800 pt-6">
    {[
      {
        icon: TrendingUp,
        color: "text-red-500",
        title: "Billing Spike Detection",
        desc: "Automatically learns your normal spending patterns and alerts you the moment costs deviate unexpectedly.",
      },
      {
        icon: BarChart3,
        color: "text-orange-500",
        title: "Root Cause Analysis",
        desc: "Pinpoints which service is driving the spike so you know exactly where to look — not just that something is wrong.",
      },
      {
        icon: PiggyBank,
        color: "text-yellow-600",
        title: "Budget Overage Forecast",
        desc: "Projects your month-end spend early enough to take action before you exceed your budget.",
      },
    ].map((item) => (
      <div key={item.title} className="flex items-start gap-3">
        <item.icon className={`w-4 h-4 mt-0.5 shrink-0 ${item.color}`} />
        <div>
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{item.title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{item.desc}</p>
        </div>
      </div>
    ))}
  </div>
);

// ─── Live Stats Bar ────────────────────────────────────────────────────────────
const StatsBar = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/smart-alerts/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const fmt = (iso) => {
    if (!iso) return "No alerts yet";
    return new Date(iso).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400">
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-indigo-400" />
        <span>Last alert: <span className="font-semibold text-gray-700 dark:text-gray-300">{fmt(stats?.lastDetectedAt)}</span></span>
      </div>
      <div className="flex items-center gap-1.5">
        <ThumbsDown className="w-3.5 h-3.5 text-amber-400" />
        <span>Ignored this month: <span className="font-semibold text-gray-700 dark:text-gray-300">{stats?.ignoredThisMonth ?? "—"}</span></span>
      </div>
      <div className="flex items-center gap-1.5">
        <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
        <span>Threshold adjustments: <span className="font-semibold text-gray-700 dark:text-gray-300">{stats?.feedbackAdjustments ?? "—"}</span></span>
      </div>
      <div className="flex items-center gap-1.5 ml-auto">
        <CalendarClock className="w-3.5 h-3.5 text-gray-400" />
        <span>Detection runs daily at <span className="font-semibold text-gray-700 dark:text-gray-300">02:30 AM</span></span>
      </div>
    </div>
  );
};

// ─── Settings Panel ────────────────────────────────────────────────────────────
const SETTINGS_FIELDS = [
  {
    key: "hw_threshold_k",
    label: "Sensitivity (σ multiplier)",
    desc: "How many standard deviations above forecast before an alert fires. Lower = more sensitive. Default: 2.5",
    min: 1.0, max: 5.0, step: 0.1,
  },
  {
    key: "min_dollar_delta",
    label: "Minimum dollar threshold ($)",
    desc: "Ignore spikes smaller than this amount — filters noise on low-spend accounts. Default: $20",
    min: 0, max: 500, step: 1,
  },
  {
    key: "cooldown_hours",
    label: "Alert cooldown (hours)",
    desc: "Minimum gap between repeated alerts for the same account and type. Default: 24h",
    min: 1, max: 168, step: 1,
  },
  {
    key: "forecast_overage_pct",
    label: "Forecast overage threshold (%)",
    desc: "Fire a forecast alert when projected month-end spend exceeds budget by this percentage. Default: 10%",
    min: 1, max: 100, step: 1,
  },
  {
    key: "min_history_days",
    label: "Minimum history required (days)",
    desc: "Accounts with fewer days of cost data use a simpler fallback method. Default: 14 days",
    min: 7, max: 60, step: 1,
  },
];

const SettingsPanel = () => {
  const [cfg, setCfg] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/smart-alerts/config")
      .then((r) => {
        setCfg(r.data);
        setForm({
          hw_threshold_k:      r.data.hw_threshold_k      ?? 2.5,
          min_dollar_delta:    r.data.min_dollar_delta     ?? 20,
          cooldown_hours:      r.data.cooldown_hours       ?? 24,
          forecast_overage_pct:r.data.forecast_overage_pct ?? 10,
          min_history_days:    r.data.min_history_days     ?? 14,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.put("/smart-alerts/config", form);
      setCfg(r.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="flex items-start gap-3 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
        <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
          These settings tune how sensitive anomaly detection is for your organisation.
          Changes take effect on the next daily detection run at <strong>02:30 AM</strong>.
          Ignoring an alert automatically widens the sensitivity for that account.
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-semibold px-4 py-2.5 rounded-xl">
          <CheckCircle className="w-4 h-4 shrink-0" /> Settings saved successfully.
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl divide-y divide-gray-100 dark:divide-gray-800 shadow-sm">
        {SETTINGS_FIELDS.map((field) => (
          <div key={field.key} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{field.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{field.desc}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <input
                type="range"
                min={field.min}
                max={field.max}
                step={field.step}
                value={form[field.key] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [field.key]: parseFloat(e.target.value) }))}
                className="w-32 accent-indigo-500"
              />
              <span className="text-sm font-bold text-gray-900 dark:text-white w-12 text-right tabular-nums">
                {form[field.key]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Feedback summary */}
      {cfg?.account_feedback && Object.keys(cfg.account_feedback).length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wider text-gray-400 mb-3">Threshold Widening by Account</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Each time you ignore an alert, the detection band widens for that account (+0.3σ per ignore, max +1.2σ).
          </p>
          <div className="space-y-2">
            {Object.entries(cfg.account_feedback).map(([accountId, count]) => (
              <div key={accountId} className="flex items-center justify-between text-xs">
                <span className="font-mono text-gray-600 dark:text-gray-400 truncate max-w-xs">{accountId}</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 ml-4 shrink-0">
                  +{Math.min(count * 0.3, 1.2).toFixed(1)}σ ({count} ignore{count !== 1 ? "s" : ""})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 border border-indigo-400 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:border-indigo-500 text-sm font-bold rounded-xl transition disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </div>
  );
};

// ─── Recipients Panel ──────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RecipientsPanel = () => {
  const [configs, setConfigs]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [tags, setTags]         = useState({});
  const [inputVal, setInputVal] = useState({});
  const [errors, setErrors]     = useState({});
  const [success, setSuccess]   = useState(null);

  const ALERT_TYPES = ["cost_threshold", "resource_creation"];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/smart-alerts/recipients");
      setConfigs(res.data ?? []);
      const t = {};
      (res.data ?? []).forEach((c) => { t[c.alert_type] = c.recipients ?? []; });
      setTags(t);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getConfig = (type) => configs.find((c) => c.alert_type === type);
  const getTags   = (type) => tags[type] ?? getConfig(type)?.recipients ?? [];
  const getInput  = (type) => inputVal[type] ?? "";

  const commitInput = (alertType) => {
    const val = getInput(alertType).trim();
    if (!val) return;
    const parts   = val.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean);
    const invalid = parts.filter((e) => !EMAIL_RE.test(e));
    if (invalid.length > 0) {
      setErrors((p) => ({ ...p, [alertType]: `Invalid email: ${invalid.join(", ")}` }));
      return;
    }
    setErrors((p) => ({ ...p, [alertType]: null }));
    setTags((p) => ({ ...p, [alertType]: [...new Set([...(p[alertType] ?? []), ...parts])] }));
    setInputVal((p) => ({ ...p, [alertType]: "" }));
  };

  const removeTag = (alertType, email) => {
    setTags((p) => ({ ...p, [alertType]: (p[alertType] ?? []).filter((e) => e !== email) }));
  };

  const handleKeyDown = (e, alertType) => {
    if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      e.preventDefault();
      commitInput(alertType);
    } else if (e.key === "Backspace" && getInput(alertType) === "") {
      setTags((p) => { const cur = p[alertType] ?? []; return { ...p, [alertType]: cur.slice(0, -1) }; });
    }
  };

  const save = async (alertType) => {
    const pendingVal = getInput(alertType).trim();
    let emails = [...getTags(alertType)];
    if (pendingVal) {
      const parts   = pendingVal.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean);
      const invalid = parts.filter((e) => !EMAIL_RE.test(e));
      if (invalid.length > 0) {
        setErrors((p) => ({ ...p, [alertType]: `Invalid email: ${invalid.join(", ")}` }));
        return;
      }
      emails = [...new Set([...emails, ...parts])];
      setTags((p) => ({ ...p, [alertType]: emails }));
      setInputVal((p) => ({ ...p, [alertType]: "" }));
    }
    setErrors((p) => ({ ...p, [alertType]: null }));
    if (emails.length === 0) {
      setErrors((p) => ({ ...p, [alertType]: "Add at least one recipient email before saving." }));
      return;
    }
    setSaving(alertType);
    try {
      const res = await api.put("/smart-alerts/recipients", { alert_type: alertType, recipients: emails });
      setConfigs((prev) => {
        const idx = prev.findIndex((c) => c.alert_type === alertType);
        if (idx >= 0) { const n = [...prev]; n[idx] = res.data; return n; }
        return [...prev, res.data];
      });
      setSuccess(`Saved recipients for "${ALERT_TYPE_LABELS[alertType] ?? alertType}"`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setErrors((p) => ({ ...p, [alertType]: e.response?.data?.error ?? "Save failed." }));
    } finally { setSaving(null); }
  };

  const resetConfig = async (alertType) => {
    setDeleting(alertType);
    try {
      await api.delete(`/smart-alerts/recipients/${alertType}`);
      setConfigs((prev) => prev.filter((c) => c.alert_type !== alertType));
      setTags((p) => { const n = { ...p }; delete n[alertType]; return n; });
      setInputVal((p) => { const n = { ...p }; delete n[alertType]; return n; });
      setSuccess("Reverted to all org members.");
      setTimeout(() => setSuccess(null), 3000);
    } catch { /* silent */ }
    finally { setDeleting(null); }
  };

  if (loading)
    return <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
        <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
          By default, all organisation members receive alert emails. Configure custom recipients below.
          Type an email and press{" "}
          <kbd className="px-1 py-0.5 bg-indigo-100 dark:bg-indigo-800 rounded text-[10px] font-mono">Enter</kbd> to add.
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-semibold px-4 py-2.5 rounded-xl">
          <CheckCircle className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      {ALERT_TYPES.map((alertType) => {
        const existing  = getConfig(alertType);
        const chipList  = getTags(alertType);
        const inputText = getInput(alertType);
        const err       = errors[alertType];
        const isSaving  = saving === alertType;
        const isDel     = deleting === alertType;

        return (
          <div key={alertType} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg border ${alertType === "resource_creation" ? "border-emerald-200 dark:border-emerald-800" : "border-indigo-200 dark:border-indigo-800"}`}>
                  {alertType === "resource_creation"
                    ? <PackagePlus className="w-4 h-4 text-emerald-600" />
                    : <Bell className="w-4 h-4 text-indigo-600" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{ALERT_TYPE_LABELS[alertType]}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {existing ? `${existing.recipients?.length ?? 0} custom recipient(s)` : "Using default: all org members"}
                  </p>
                </div>
              </div>
              {existing && (
                <button
                  onClick={() => resetConfig(alertType)}
                  disabled={isDel}
                  className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-transparent text-red-500 hover:border-red-300 dark:hover:border-red-700 transition disabled:opacity-50"
                >
                  {isDel ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Custom Recipients
              </label>
              <div
                className={`flex flex-wrap gap-1.5 min-h-[44px] px-2.5 py-2 rounded-xl border cursor-text focus-within:ring-2 ${
                  err ? "border-red-300 dark:border-red-700 focus-within:ring-red-300" : "border-gray-200 dark:border-gray-700 focus-within:ring-indigo-400"
                }`}
                onClick={(e) => e.currentTarget.querySelector("input")?.focus()}
              >
                {chipList.map((email) => (
                  <span key={email} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300">
                    {email}
                    <button type="button" onClick={() => removeTag(alertType, email)} className="ml-0.5 text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 transition" aria-label={`Remove ${email}`}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="email"
                  value={inputText}
                  onChange={(e) => setInputVal((p) => ({ ...p, [alertType]: e.target.value }))}
                  onKeyDown={(e) => handleKeyDown(e, alertType)}
                  onBlur={() => commitInput(alertType)}
                  placeholder={chipList.length === 0 ? "user@example.com — press Enter to add" : "Add another…"}
                  className="flex-1 min-w-[180px] bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                />
              </div>
              {err && <p className="text-xs text-red-500 font-medium">{err}</p>}
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-gray-400">{chipList.length} address(es)</p>
                <button
                  onClick={() => save(alertType)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 border border-indigo-400 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:border-indigo-500 text-xs font-bold rounded-xl transition disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  {isSaving ? "Saving…" : "Save Recipients"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Backend-facing query params for each Status filter option — "high" widens to
// high+critical via a comma-separated severity list the controller expands with `in`.
const STATUS_FILTER_PARAMS = {
  all:      {},
  unread:   { status: "unread" },
  critical: { severity: "critical" },
  high:     { severity: "high,critical" },
};

const PAGE_SIZE = 20;

// Builds a "1 … 4 5 [6] 7 8 … 12" style page list — always shows first/last page,
// a window of 2 around the current page, and collapses the rest into an ellipsis.
function getPageNumbers(current, total) {
  const delta = 2;
  const pages = [];
  const start = Math.max(2, current - delta);
  const end = Math.min(total - 1, current + delta);

  pages.push(1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  if (total > 1) pages.push(total);

  return pages;
}

// Mobile (< 768px, Tailwind's `md` breakpoint) gets infinite scroll; desktop/laptop
// gets clickable numbered pagination — matches the two most common table-pagination
// UX patterns for their respective screen sizes.
const MOBILE_QUERY = "(max-width: 767px)";
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches,
  );
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function SmartAlertsDashboard() {
  const [alerts, setAlerts]     = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [summary, setSummary]   = useState({ unread: 0, totalActive: 0, newResources: 0, bySeverity: {} });
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]     = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [actioning, setActioning]   = useState(null);
  const [activeTab, setActiveTab]   = useState("alerts");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const isMobile = useIsMobile();

  const fetchAlerts = useCallback(
    async (pg = 1, flt = filter, typeFlt = typeFilter, { silent = false, append = false } = {}) => {
      if (pg === 1 && !silent) setLoading(true);
      if (silent) setRefreshing(true);
      try {
        const params = {
          page: pg,
          pageSize: PAGE_SIZE,
          ...STATUS_FILTER_PARAMS[flt],
          ...(typeFlt !== "all" ? { type: typeFlt } : {}),
        };
        const res = await api.get("/smart-alerts", { params });
        const newAlerts = res.data.alerts ?? [];
        setAlerts((prev) => (append ? [...prev, ...newAlerts] : newAlerts));
        setTotal(res.data.meta?.total ?? 0);
        setSummary(res.data.summary ?? { unread: 0, totalActive: 0, newResources: 0, bySeverity: {} });
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter, typeFilter],
  );

  // Refetch from page 1 whenever a filter changes, or when switching between the
  // mobile (infinite-scroll) and desktop (numbered-page) layouts, since the two
  // modes accumulate `alerts` differently (append vs. replace).
  useEffect(() => {
    setPage(1);
    fetchAlerts(1, filter, typeFilter, { append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, typeFilter, isMobile]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const observerRef = useRef(null);

  // Infinite scroll — mobile only
  useEffect(() => {
    if (!isMobile || loading || refreshing || page >= totalPages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchAlerts(nextPage, filter, typeFilter, { append: true });
        }
      },
      { threshold: 1.0 },
    );

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, loading, refreshing, page, totalPages]);

  // Numbered pagination — desktop/laptop only
  const goToPage = (pg) => {
    if (pg < 1 || pg > totalPages || pg === page) return;
    setPage(pg);
    fetchAlerts(pg, filter, typeFilter, { append: false });
  };

  const markAsRead = async (id) => {
    setActioning(id);
    try {
      await api.patch(`/smart-alerts/${id}/read`);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: "read" } : a)));
      setSummary((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    } catch (err) { console.error(err); }
    finally { setActioning(null); }
  };

  const resolveAlert = async (id) => {
    setActioning(id);
    try {
      await api.patch(`/smart-alerts/${id}/resolve`);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: "resolved" } : a)));
      if (alerts.find((a) => a.id === id)?.status === "unread")
        setSummary((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    } catch (err) { console.error(err); }
    finally { setActioning(null); }
  };

  const ignoreAlert = async (id) => {
    setActioning(id);
    try {
      await api.patch(`/smart-alerts/${id}/ignore`);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ignored: true } : a)));
      if (alerts.find((a) => a.id === id)?.status === "unread")
        setSummary((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    } catch (err) { console.error(err); }
    finally { setActioning(null); }
  };

  const viewAlert = (alert) => {
    setSelectedAlert(alert);
    if (alert.status === "unread") markAsRead(alert.id);
  };

  const markAllRead = async () => {
    try {
      await api.patch("/smart-alerts/mark-all-read");
      setAlerts((prev) => prev.map((a) => (a.status === "unread" ? { ...a, status: "read" } : a)));
      setSummary((prev) => ({ ...prev, unread: 0 }));
    } catch (err) { console.error(err); }
  };

  // Server already applies the Status/Type filters and pagination — this just hides
  // an item instantly after Resolve/Ignore without waiting for the next refetch.
  const filteredAlerts = alerts.filter((alert) => alert.status !== "resolved" && !alert.ignored);

  // Server-computed, org-wide totals — never derived from `alerts`, since that array
  // only holds the current page/filter's rows once pagination is in play.
  const criticalCount = summary.bySeverity?.critical ?? 0;
  const totalActive   = summary.totalActive ?? 0;
  const resourceCount = summary.newResources ?? 0;

  if (loading)
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading smart alerts…</p>
      </div>
    );

  const TABS = [
    { key: "alerts",     label: "Alerts",     icon: Bell },
    { key: "recipients", label: "Recipients",  icon: Users },
    { key: "settings",   label: "Settings",    icon: SlidersHorizontal },
  ];

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Smart Alerts &amp; Anomalies</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Automated detection of billing spikes, unusual spend, budget breaches, and new resource creation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "alerts" && summary.unread > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:border-indigo-400 transition"
            >
              <CheckCheck className="w-4 h-4" /> Mark All Read
            </button>
          )}
          {activeTab === "alerts" && (
            <button
              onClick={() => { setPage(1); fetchAlerts(1, filter, typeFilter, { silent: true }); }}
              disabled={refreshing}
              className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === tab.key
                ? "border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-transparent"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "recipients" ? (
        <RecipientsPanel />
      ) : activeTab === "settings" ? (
        <SettingsPanel />
      ) : (
        <>
          {/* ── Live Stats Bar ── */}
          <StatsBar />

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Total Active"  value={totalActive}       colorClass="text-indigo-500" icon={AlertTriangle} />
            <KpiCard label="Unread"        value={summary.unread}    colorClass="text-amber-500"  icon={BellOff} />
            <KpiCard label="Critical"      value={criticalCount}     colorClass="text-red-500"    icon={Zap} />
            <KpiCard label="New Resources" value={resourceCount}     colorClass="text-emerald-500" icon={PackagePlus} />
          </div>

          {/* ── Filters ── */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider mr-1">Status -</span>
              {[
                { key: "all",      label: "All" },
                { key: "unread",   label: "Unread" },
                { key: "critical", label: "Critical" },
                { key: "high",     label: "High+" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                    filter === f.key
                      ? "border border-indigo-400 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400"
                      : "border border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 self-center" />

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider mr-1">Type -</span>
              {[
                { key: "all",               label: "All" },
                { key: "spike",             label: "Spike" },
                { key: "unusual_spend",     label: "Unusual" },
                { key: "forecast",          label: "Forecast" },
                { key: "budget_breach",     label: "Budget" },
                { key: "resource_creation", label: "New Resource" },
                { key: "resource_deletion", label: "Removed" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setTypeFilter(f.key)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                    typeFilter === f.key
                      ? "border border-violet-400 dark:border-violet-600 text-violet-600 dark:text-violet-400"
                      : "border border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Alert Table ── */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            {total > 0 && (
              <div className="px-5 pt-3 flex items-center gap-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                {isMobile ? (
                  <span>
                    Loaded {alerts.length} of {total} alert{total === 1 ? "" : "s"}
                  </span>
                ) : (
                  <>
                    <span>
                      Page {page} of {totalPages}
                    </span>
                    <span className="text-gray-300 dark:text-gray-700">·</span>
                    <span>
                      {total} alert{total === 1 ? "" : "s"} total
                    </span>
                  </>
                )}
              </div>
            )}
            {filteredAlerts.length === 0 ? (
              <div className="p-10 flex flex-col items-center gap-3 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">All Clear!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                  No active anomalies or alerts match the current filters.
                </p>
                <HowItWorks />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left px-5 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider w-6"></th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">Type</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">Severity</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">Provider</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">Message</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">Detected</th>
                      <th className="text-right px-5 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.map((alert) => {
                      const isUnread    = alert.status === "unread";
                      const isActioning = actioning === alert.id;
                      return (
                        <tr
                          key={alert.id}
                          onClick={() => viewAlert(alert)}
                          className="border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                        >
                          <td className="px-5 py-3.5">
                            {isUnread && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <AlertIcon type={alert.alert_type} />
                              <span className={`font-semibold text-xs ${isUnread ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                                {TYPE_CONFIG[alert.alert_type]?.label ?? "Usage Anomaly"}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <SeverityBadge severity={alert.severity} />
                          </td>
                          <td className="px-5 py-3.5">
                            {alert.provider && alert.provider !== "all" ? (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                alert.provider === "aws"
                                  ? "border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400"
                                  : alert.provider === "azure"
                                    ? "border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400"
                                    : alert.provider === "btp"
                                      ? "border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400"
                                      : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                              }`}>
                                {alert.provider === "btp" ? "SAP BTP" : alert.provider.toUpperCase()}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300 dark:text-gray-700">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 max-w-xs">
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                              {alert.message}
                            </p>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock className="w-3 h-3 shrink-0" />
                              {alert.detected_at
                                ? new Date(alert.detected_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                                : "N/A"}
                            </div>
                          </td>
                          <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => viewAlert(alert)}
                                disabled={isActioning}
                                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-transparent text-indigo-600 dark:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 transition disabled:opacity-50"
                              >
                                <Eye className="w-3.5 h-3.5" /> {isUnread ? "Read" : "View"}
                              </button>
                              <button
                                onClick={() => resolveAlert(alert.id)}
                                disabled={isActioning}
                                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-transparent text-emerald-600 dark:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700 transition disabled:opacity-50"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Resolve
                              </button>
                              <button
                                onClick={() => ignoreAlert(alert.id)}
                                disabled={isActioning}
                                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-transparent text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-600 transition disabled:opacity-50"
                                title="Ignore and widen threshold for this account"
                              >
                                <EyeOff className="w-3.5 h-3.5" /> Ignore
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile — infinite scroll sentinel */}
            {isMobile && page < totalPages && (
              <div ref={observerRef} className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Desktop/laptop — clickable numbered pagination */}
            {!isMobile && totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Prev
                </button>
                {getPageNumbers(page, totalPages).map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-xs text-gray-400">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`text-xs font-semibold w-8 h-8 rounded-lg transition-all ${
                        p === page
                          ? "bg-indigo-500 text-white"
                          : "border border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <AlertDetailModal
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onResolve={resolveAlert}
        onIgnore={ignoreAlert}
      />
    </div>
  );
}
