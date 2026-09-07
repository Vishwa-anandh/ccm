import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import api from "../../api/adminApi";
import {
  Shield,
  Key,
  Lock,
  Unlock,
  Copy,
  Trash2,
  LogOut,
  CheckCircle,
  XCircle,
  Cloud,
  Bot,
  CreditCard,
  Building2,
  Users,
  RefreshCw,
  CalendarDays,
  CalendarClock,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  ChevronDown,
  DatabaseZap,
  History,
  Percent,
  ScanSearch,
} from "lucide-react";
import { useConfirm } from "../../components/ConfirmDialog";

// ─── Constants ─────────────────────────────────────────────────────────────────
const PLAN_OPTIONS = ["free", "basic", "premium", "enterprise"];
const CLOUD_OPTIONS = [
  "aws",
  "azure",
  "btp",
  "aws,azure",
  "aws,btp",
  "azure,btp",
  "all",
];

const CLOUD_PROVIDERS_SA = [
  {
    id: "aws",
    label: "AWS",
    color: "text-orange-700",
    dot: "bg-orange-500",
    ring: "border-orange-400",
    bg: "bg-orange-50 dark:bg-orange-900/20",
  },
  {
    id: "azure",
    label: "Azure",
    color: "text-blue-700",
    dot: "bg-blue-500",
    ring: "border-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    id: "btp",
    label: "SAP BTP",
    color: "text-emerald-700",
    dot: "bg-emerald-500",
    ring: "border-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  {
    id: "gcp",
    label: "GCP",
    color: "text-brand-700",
    dot: "bg-brand-500",
    ring: "border-brand-400",
    bg: "bg-brand-50 dark:bg-brand-900/20",
  },
];
const INVOICE_OPT_SA = {
  id: "invoice",
  label: "Invoice Only",
  color: "text-violet-700",
  dot: "bg-violet-500",
  ring: "border-violet-400",
  bg: "bg-violet-50 dark:bg-violet-900/20",
};

// ─── CloudMultiSelectSA ────────────────────────────────────────────────────────
function CloudMultiSelectSA({ org, onSave }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const btnRef = React.useRef(null);
  const dropRef = React.useRef(null);
  const [dropPos, setDropPos] = React.useState({ top: 0, left: 0 });

  // Parse current org state into selections
  const parseSelections = () => {
    const pref = org.cloud_preference ?? "";
    let providers = [];
    if (pref === "all" || pref === "both") providers = ["aws", "azure", "btp", "gcp"];
    else if (pref)
      providers = pref
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    const invoiceSel = org.invoice_only ?? false;
    return { providers, invoice: invoiceSel };
  };

  const [sel, setSel] = React.useState(parseSelections);

  React.useEffect(() => {
    setSel(parseSelections());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org.cloud_preference, org.invoice_only]);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      const inBtn = ref.current?.contains(e.target);
      const inDrop = dropRef.current?.contains(e.target);
      if (!inBtn && !inDrop) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
    }
    setOpen((v) => !v);
  };

  const toggleProvider = (id) => {
    setSel((prev) => ({
      ...prev,
      providers: prev.providers.includes(id)
        ? prev.providers.filter((p) => p !== id)
        : [...prev.providers, id],
    }));
  };

  const toggleInvoice = () =>
    setSel((prev) => ({ ...prev, invoice: !prev.invoice }));

  const handleApply = () => {
    const allProviderIds = CLOUD_PROVIDERS_SA.map((p) => p.id);
    const allSelected = allProviderIds.every((id) => sel.providers.includes(id));
    const cloudPref =
      allSelected
        ? "all"
        : sel.providers.length === 0
          ? null
          : sel.providers.join(",");
    onSave(org.id, cloudPref, sel.invoice, org);
    setOpen(false);
  };

  // Build display label
  const buildLabel = () => {
    const parts = sel.providers.map(
      (p) => CLOUD_PROVIDERS_SA.find((c) => c.id === p)?.label ?? p,
    );
    if (sel.invoice) parts.push("Invoice");
    if (parts.length === 0) return "Not Set";
    if (parts.length > 2) return `${parts.length} selected`;
    return parts.join(" + ");
  };

  const isDirty = () => {
    const orig = parseSelections();
    return JSON.stringify(orig) !== JSON.stringify(sel);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-white hover:bg-gray-50 transition-colors max-w-[140px] truncate"
      >
        <span className="truncate">{buildLabel()}</span>
        <ChevronDown className="w-3 h-3 shrink-0 opacity-50" />
      </button>

      {open && ReactDOM.createPortal(
        <div
          ref={dropRef}
          style={{ position: "absolute", top: dropPos.top, left: dropPos.left, zIndex: 9999 }}
          className="w-52 bg-white border border-gray-200 rounded-xl shadow-xl p-3 space-y-1.5"
        >
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-2">
            Cloud Providers
          </p>
          {CLOUD_PROVIDERS_SA.map((p) => {
            const checked = sel.providers.includes(p.id);
            return (
              <label
                key={p.id}
                className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer border transition-colors ${checked ? `${p.bg} ${p.ring} border` : "border-transparent hover:bg-gray-50"}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleProvider(p.id)}
                  className="sr-only"
                />
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center border ${checked ? "bg-current border-current" : "border-gray-300"}`}
                  style={checked ? {} : {}}
                >
                  {checked && (
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="none"
                      viewBox="0 0 12 12"
                    >
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                <span className={`text-xs font-semibold ${p.color}`}>
                  {p.label}
                </span>
              </label>
            );
          })}

          <div className="border-t border-gray-100 my-1.5 pt-1.5">
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-1.5">
              Invoice
            </p>
            {(() => {
              const p = INVOICE_OPT_SA;
              const checked = sel.invoice;
              return (
                <label
                  className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer border transition-colors ${checked ? `${p.bg} ${p.ring} border` : "border-transparent hover:bg-gray-50"}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={toggleInvoice}
                    className="sr-only"
                  />
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border ${checked ? "bg-current border-current" : "border-gray-300"}`}
                  >
                    {checked && (
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        viewBox="0 0 12 12"
                      >
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                  <span className={`text-xs font-semibold ${p.color}`}>
                    {p.label}
                  </span>
                </label>
              );
            })()}
          </div>

          <button
            onClick={handleApply}
            disabled={!isDirty()}
            className="w-full mt-1 py-1.5 text-xs font-bold rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

const EXTEND_MONTHS = [1, 3, 6, 12, 24];
const MAX_USER_OPTS = [5, 10, 25, 50, 100, 250, 0]; // 0 = unlimited

const PLAN_COLORS = {
  free: "bg-gray-100 text-gray-600 border-gray-200",
  basic: "bg-blue-50 text-blue-700 border-blue-200",
  premium: "bg-indigo-50 text-indigo-700 border-indigo-200",
  enterprise: "bg-brand-50 text-brand-700 border-brand-200",
};
const CLOUD_COLORS = {
  aws: "bg-orange-50 text-orange-700 border-orange-200",
  azure: "bg-blue-50 text-blue-700 border-blue-200",
  btp: "bg-emerald-50 text-emerald-700 border-emerald-200",
  both: "bg-brand-50 text-brand-700 border-brand-200",
  "aws,azure": "bg-purple-50 text-purple-700 border-purple-200",
  "aws,btp": "bg-amber-50 text-amber-700 border-amber-200",
  "azure,btp": "bg-cyan-50 text-cyan-700 border-cyan-200",
  all: "bg-indigo-50 text-indigo-700 border-indigo-200",
  null: "bg-gray-100 text-gray-400 border-gray-200 italic",
};
const CLOUD_LABELS = {
  aws: "AWS",
  azure: "Azure",
  btp: "SAP BTP",
  both: "AWS + Azure",
  "aws,azure": "AWS + Azure",
  "aws,btp": "AWS + BTP",
  "azure,btp": "Azure + BTP",
  all: "All",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

const daysLeft = (expiresAt) => {
  if (!expiresAt) return null;
  const diff = Math.ceil(
    (new Date(expiresAt) - Date.now()) / (1000 * 60 * 60 * 24),
  );
  return diff;
};

const ExpiryBadge = ({ expiresAt }) => {
  const days = daysLeft(expiresAt);
  if (days === null)
    return <span className="text-gray-400 text-xs">No expiry</span>;
  if (days < 0)
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
        <AlertTriangle className="w-3 h-3" />
        Expired
      </span>
    );
  if (days <= 7)
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
        <Clock className="w-3 h-3" />
        {days}d left
      </span>
    );
  if (days <= 30)
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
        <Clock className="w-3 h-3" />
        {days}d left
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
      <CheckCircle className="w-3 h-3" />
      {days}d left
    </span>
  );
};

// ─── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold text-white ${toast.type === "error" ? "bg-red-600" : "bg-gray-900"}`}
    >
      {toast.type === "error" ? (
        <XCircle className="w-4 h-4 shrink-0" />
      ) : (
        <CheckCircle className="w-4 h-4 shrink-0" />
      )}
      {toast.message}
    </div>
  );
};

// ─── Extend Modal ──────────────────────────────────────────────────────────────
const CLOUD_PROVIDERS = [
  { id: "azure", label: "Azure", color: "blue" },
  { id: "aws", label: "AWS", color: "orange" },
  { id: "btp", label: "SAP BTP", color: "emerald" },
  { id: "gcp", label: "GCP", color: "brand" },
];

const resolveCloudAccess = (org) => {
  if (Array.isArray(org.cloud_access) && org.cloud_access.length > 0)
    return org.cloud_access;
  const pref = org.cloud_preference ?? "all";
  if (pref === "all" || pref === "both") return ["azure", "aws", "btp", "gcp"];
  return pref
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const ExtendModal = ({ org, onClose, onSuccess, showToast }) => {
  const [form, setForm] = useState({
    extend_months: 3,
    expiry_date: "",
    plan_type: org.plan_type ?? "basic",
    max_users: org.max_users ?? 10,
    ai_enabled: org.ai_enabled ?? false,
    invoice_only: org.invoice_only ?? false,
    cloud_access: resolveCloudAccess(org),
    max_azure_accounts: org.max_azure_accounts ?? 3,
    max_aws_accounts: org.max_aws_accounts ?? 3,
    max_btp_accounts: org.max_btp_accounts ?? 3,
    max_gcp_accounts: org.max_gcp_accounts ?? 3,
    notes: "",
  });

  const toggleCloud = (provider) => {
    setForm((prev) => {
      const current = prev.cloud_access;
      const updated = current.includes(provider)
        ? current.filter((c) => c !== provider)
        : [...current, provider];
      return { ...prev, cloud_access: updated };
    });
  };
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Preview new expiry
  const currentExpiry = org.expires_at ? new Date(org.expires_at) : new Date();
  const base = currentExpiry > new Date() ? currentExpiry : new Date();
  const newExpiry = form.expiry_date
    ? new Date(form.expiry_date)
    : new Date(base.getTime() + form.extend_months * 30 * 24 * 60 * 60 * 1000);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { expiry_date, extend_months, ...rest } = form;
      await api.post(`/organizations/${org.id}/extend`, {
        ...rest,
        ...(expiry_date ? { expiry_date } : { extend_months: Number(extend_months) }),
        max_users: Number(form.max_users),
        max_azure_accounts: Number(form.max_azure_accounts),
        max_aws_accounts: Number(form.max_aws_accounts),
        max_btp_accounts: Number(form.max_btp_accounts),
        max_gcp_accounts: Number(form.max_gcp_accounts),
      });
      showToast(`Subscription extended for ${org.name}`);
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to extend subscription";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-brand-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Extend Subscription</h2>
              <p className="text-brand-200 text-sm mt-0.5">{org.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Current → New expiry preview */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-xl px-4 py-3">
              <p className="text-xs text-brand-200 font-semiboldtracking-wider">
                Current Expiry
              </p>
              <p className="text-white font-bold mt-0.5">
                {fmtDate(org.expires_at)}
              </p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-3 border border-white/30">
              <p className="text-xs text-brand-200 font-semiboldtracking-wider">
                New Expiry
              </p>
              <p className="text-white font-bold mt-0.5">
                {fmtDate(newExpiry)}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Duration */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 tracking-wider block">
              Extend Duration
              {form.expiry_date && (
                <span className="ml-2 text-[10px] font-normal text-amber-500">— quick-add disabled (exact date set)</span>
              )}
            </label>
            <div className="flex gap-2">
              {EXTEND_MONTHS.map((m) => (
                <button
                  key={m}
                  onClick={() => { set("extend_months", m); set("expiry_date", ""); }}
                  disabled={!!form.expiry_date}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border transition ${
                    !form.expiry_date && form.extend_months === m
                      ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:border-brand-400 hover:text-brand-600 disabled:opacity-40 disabled:cursor-not-allowed"
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>

            {/* Set exact expiry date */}
            <div>
              <label className="text-xs font-bold text-gray-500 tracking-wider block mb-1.5">
                Or Set Exact Expiry Date
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={form.expiry_date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => set("expiry_date", e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
                {form.expiry_date && (
                  <button
                    onClick={() => set("expiry_date", "")}
                    className="text-xs text-gray-400 hover:text-red-500 px-2 py-2 rounded-lg hover:bg-red-50 transition"
                    title="Clear date"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Plan + User Limit row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500tracking-wider block mb-1.5">
                Plan Type
              </label>
              <div className="relative">
                <select
                  value={form.plan_type}
                  onChange={(e) => set("plan_type", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 appearance-none bg-white"
                >
                  {PLAN_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500tracking-wider block mb-1.5">
                User Limit
              </label>
              <div className="relative">
                <select
                  value={form.max_users}
                  onChange={(e) => set("max_users", Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 appearance-none bg-white"
                >
                  {MAX_USER_OPTS.map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? "Unlimited" : `${n} users`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Cloud Access + Invoice — unified checkbox cards */}
          <div>
            <label className="text-xs font-bold text-gray-500 tracking-wider block mb-2">
              Cloud Access &amp; Invoice
              <span className="ml-1.5 text-[10px] font-normal text-gray-400">
                Select all that apply
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CLOUD_PROVIDERS_SA.map((p) => {
                const checked = form.cloud_access.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${checked ? `bg-white ${p.ring} border` : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCloud(p.id)}
                      className="sr-only"
                    />
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${checked ? "border-current bg-current" : "border-gray-300 bg-white"}`}
                    >
                      {checked && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          viewBox="0 0 12 12"
                        >
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.dot}`}
                    />
                    <span
                      className={`text-sm font-bold ${checked ? p.color : "text-gray-600"}`}
                    >
                      {p.label}
                    </span>
                  </label>
                );
              })}
              {/* Invoice Only */}
              {(() => {
                const p = INVOICE_OPT_SA;
                const checked = form.invoice_only;
                return (
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors col-span-3 ${checked ? `bg-white ${p.ring} border` : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => set("invoice_only", !form.invoice_only)}
                      className="sr-only"
                    />
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${checked ? "border-current bg-current" : "border-gray-300 bg-white"}`}
                    >
                      {checked && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          viewBox="0 0 12 12"
                        >
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.dot}`}
                    />
                    <div className="flex-1">
                      <span
                        className={`text-sm font-bold ${checked ? p.color : "text-gray-600"}`}
                      >
                        {p.label}
                      </span>
                      <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                        {checked
                          ? "Invoice upload enabled alongside cloud providers"
                          : "Enable invoice upload for this org"}
                      </p>
                    </div>
                  </label>
                );
              })()}
            </div>
            {form.cloud_access.length === 0 && !form.invoice_only && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Select at least one cloud provider or enable Invoice Only.
              </p>
            )}
          </div>

          {/* Account Limits — shown only for selected providers */}
          <div>
            <label className="text-xs font-bold text-gray-500 tracking-wider block mb-2">
              Max Cloud Accounts per Provider
              <span className="ml-1.5 text-[10px] font-normal text-gray-400">
                0 = unlimited
              </span>
            </label>
            {form.cloud_access.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">
                Select a cloud provider above to set account limits.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {CLOUD_PROVIDERS.filter((p) => form.cloud_access.includes(p.id)).map(({ id, label, color }) => (
                  <div key={id} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`w-2 h-2 rounded-full bg-${color}-500`} />
                      <label className="text-[11px] font-bold text-gray-600 block">
                        {label}
                      </label>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={form[`max_${id}_accounts`]}
                      onChange={(e) => set(`max_${id}_accounts`, Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-center bg-white"
                    />
                    <p className="text-[10px] text-gray-400 text-center mt-1">
                      {form[`max_${id}_accounts`] === 0 ? "Unlimited" : `Max ${form[`max_${id}_accounts`]}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Enabled toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${form.ai_enabled ? "bg-brand-100" : "bg-gray-200"}`}
              >
                <Bot
                  className={`w-4 h-4 ${form.ai_enabled ? "text-brand-600" : "text-gray-400"}`}
                />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">
                  AI Chatbot Access
                </p>
                <p className="text-xs text-gray-500">
                  {form.ai_enabled
                    ? "Enabled — client can use AI copilot"
                    : "Disabled — AI hidden from client"}
                </p>
              </div>
            </div>
            <button
              onClick={() => set("ai_enabled", !form.ai_enabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.ai_enabled ? "bg-brand-600" : "bg-gray-300"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.ai_enabled ? "translate-x-5" : ""}`}
              />
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-gray-500tracking-wider block mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="e.g. Extended per renewal agreement, invoice #1234"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex gap-3 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4" /> Extend Subscription
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [tokens, setTokens] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  // track which tabs have ever been loaded so we don't re-fetch on revisit (only on explicit refresh)
  const [fetched, setFetched] = useState({
    tokens: false,
    admins: false,
    orgs: false,
  });
  const [tab, setTab] = useState("tokens");
  // MSP Rates state
  const [mspRates, setMspRates] = useState([]);
  const [mspRatesEditing, setMspRatesEditing] = useState({});
  const [mspRatesSaving, setMspRatesSaving] = useState(false);
  const [fetched_msp, setFetchedMsp] = useState(false);

  // Data tools state
  const [backfillRunning, setBackfillRunning] = useState(false);
  const [backfillDone, setBackfillDone] = useState(false);
  const [currentMonthRunning, setCurrentMonthRunning] = useState(false);
  const [currentMonthDone, setCurrentMonthDone] = useState(false);
  const [resourceDetectionRunning, setResourceDetectionRunning] = useState(false);
  const [resourceDetectionDone, setResourceDetectionDone] = useState(false);
  const [accountBackfillRunning, setAccountBackfillRunning] = useState(new Set());
  const [accountCurrentMonthRunning, setAccountCurrentMonthRunning] = useState(new Set());
  const [historyStatus, setHistoryStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [toast, setToast] = useState(null);
  const [extendOrg, setExtendOrg] = useState(null);
  const saUsername = localStorage.getItem("sa_username");
  const confirm = useConfirm();

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Per-tab fetchers ────────────────────────────────────────────────────────
  const fetchTokens = useCallback(async () => {
    setLoadingTokens(true);
    try {
      const res = await api.get("/tokens");
      setTokens(res.data);
      setFetched((p) => ({ ...p, tokens: true }));
    } catch (err) {
      console.error("[Dashboard] /tokens failed:", err);
      showToast("Failed to load tokens", "error");
    } finally {
      setLoadingTokens(false);
    }
  }, [showToast]);

  const fetchAdmins = useCallback(async () => {
    setLoadingAdmins(true);
    try {
      const res = await api.get("/admins");
      setAdmins(res.data);
      setFetched((p) => ({ ...p, admins: true }));
    } catch (err) {
      console.error("[Dashboard] /admins failed:", err);
      showToast("Failed to load admins", "error");
    } finally {
      setLoadingAdmins(false);
    }
  }, [showToast]);

  const fetchOrgs = useCallback(async () => {
    setLoadingOrgs(true);
    try {
      const res = await api.get("/organizations");
      setOrgs(res.data);
      setFetched((p) => ({ ...p, orgs: true }));
    } catch (err) {
      console.error("[Dashboard] /organizations failed:", err);
      showToast("Failed to load subscriptions", "error");
    } finally {
      setLoadingOrgs(false);
    }
  }, [showToast]);

  const fetchMspRates = useCallback(async () => {
    try {
      const res = await api.get("/organizations/msp-rates");
      setMspRates(res.data);
      const editing = {};
      res.data.forEach((r) => { editing[r.provider] = (r.rate * 100).toFixed(2); });
      setMspRatesEditing(editing);
      setFetchedMsp(true);
    } catch {
      showToast("Failed to load MSP rates", "error");
    }
  }, [showToast]);

  const handleSaveMspRates = async () => {
    setMspRatesSaving(true);
    try {
      const rates = Object.entries(mspRatesEditing).map(([provider, val]) => ({
        provider,
        rate: parseFloat(val) / 100,
      }));
      const res = await api.put("/organizations/msp-rates", { rates });
      setMspRates(res.data);
      showToast("MSP rates updated successfully");
    } catch (err) {
      showToast(err.response?.data?.error ?? "Failed to save MSP rates", "error");
    } finally {
      setMspRatesSaving(false);
    }
  };

  // ── Refresh current tab ─────────────────────────────────────────────────────
  const refreshCurrentTab = useCallback(() => {
    if (tab === "tokens") fetchTokens();
    else if (tab === "admins") fetchAdmins();
    else if (tab === "orgs") fetchOrgs();
    else if (tab === "msp") fetchMspRates();
    // "data" tab has no fetch — nothing to do
  }, [tab, fetchTokens, fetchAdmins, fetchOrgs, fetchMspRates]);

  // ── Fetch on tab switch (lazy — only if not yet loaded) ─────────────────────
  useEffect(() => {
    if (tab === "tokens" && !fetched.tokens) fetchTokens();
    else if (tab === "admins" && !fetched.admins) fetchAdmins();
    else if (tab === "orgs" && !fetched.orgs) fetchOrgs();
    else if (tab === "msp" && !fetched_msp) fetchMspRates();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Compute stats across all loaded data ────────────────────────────────────
  // Fetch tokens + orgs + admins on first mount so all stat tiles populate immediately
  useEffect(() => {
    fetchTokens();
    fetchOrgs();
    fetchAdmins();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // keep a combined loading flag for initial page load
  const loading =
    loadingTokens && loadingOrgs && !fetched.tokens && !fetched.orgs;

  const handleGenerateToken = async () => {
    try {
      await api.post("/tokens/generate", { type: "REGISTRATION" });
      showToast("Token generated");
      fetchTokens();
    } catch {
      showToast("Failed to generate token", "error");
    }
  };

  const handleToggleLock = async (admin) => {
    const newStatus = admin.status === "locked" ? "active" : "locked";
    const ok = await confirm({
      title: newStatus === "locked" ? "Lock Account?" : "Unlock Account?",
      message:
        newStatus === "locked"
          ? `Lock ${admin.fullName}'s account and generate an unlock token?`
          : `Restore ${admin.fullName}'s access?`,
      confirmLabel: newStatus === "locked" ? "Lock" : "Unlock",
      variant: newStatus === "locked" ? "delete" : "default",
    });
    if (!ok) return;
    try {
      await api.post("/admins/toggle-lock", {
        userId: admin.userId,
        status: newStatus,
      });
      showToast(`Account ${newStatus === "locked" ? "locked" : "unlocked"}`);
      fetchAdmins();
      fetchTokens(); // unlock tokens may be created
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  const handleInlineUpdate = async (orgId, field, value, currentOrg) => {
    const payload = {
      plan_type: field === "plan_type" ? value : currentOrg.plan_type,
      ai_enabled: field === "ai_enabled" ? value : currentOrg.ai_enabled,
      cloud_preference:
        field === "cloud_preference" ? value : currentOrg.cloud_preference,
      invoice_only:
        field === "invoice_only" ? value : (currentOrg.invoice_only ?? false),
    };
    try {
      await api.patch(`/organizations/${orgId}/subscription`, payload);
      setOrgs((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, ...payload } : o)),
      );
      showToast("Updated Successfully");
    } catch {
      showToast("Failed to update", "error");
      fetchOrgs();
    }
  };

  const handleCloudInlineUpdate = async (
    orgId,
    cloudPref,
    invoiceOnly,
    currentOrg,
  ) => {
    // Derive cloud_access array from cloudPref so the subscription row is fully updated
    let cloud_access = [];
    if (cloudPref === "all" || cloudPref === "both")
      cloud_access = ["azure", "aws", "btp", "gcp"];
    else if (cloudPref)
      cloud_access = cloudPref
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const payload = {
      plan_type: currentOrg.plan_type,
      ai_enabled: currentOrg.ai_enabled,
      cloud_preference: cloudPref,
      cloud_access,
      invoice_only: invoiceOnly,
    };
    try {
      await api.patch(`/organizations/${orgId}/subscription`, payload);
      setOrgs((prev) =>
        prev.map((o) =>
          o.id === orgId
            ? {
                ...o,
                cloud_preference: cloudPref,
                cloud_access,
                invoice_only: invoiceOnly,
              }
            : o,
        ),
      );
      showToast("Updated Successfully");
    } catch {
      showToast("Failed to update", "error");
      fetchOrgs();
    }
  };

  const handleDeleteToken = async (id) => {
    const ok = await confirm({
      title: "Delete Token?",
      message: "This token will be permanently removed.",
      confirmLabel: "Delete",
      variant: "delete",
    });
    if (!ok) return;
    try {
      await api.delete(`/tokens/${id}`);
      showToast("Token deleted");
      fetchTokens();
    } catch {
      showToast("Failed to delete token", "error");
    }
  };

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Log out?",
      message: "You will be returned to the admin login screen.",
      confirmLabel: "Log out",
      cancelLabel: "Stay",
      variant: "logout",
    });
    if (!ok) return;
    localStorage.removeItem("sa_token");
    localStorage.removeItem("sa_username");
    window.location.href = "/admin/login";
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Copied!");
  };

  const fetchHistoryStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await api.get("/organizations/monthly-history-status");
      setHistoryStatus(res.data);
    } catch {
      showToast("Failed to fetch history status", "error");
    } finally {
      setLoadingStatus(false);
    }
  }, [showToast]);

  const handleTriggerBackfill = async () => {
    const ok = await confirm({
      title: "Run Monthly History Backfill?",
      message:
        "This will fetch and store the last 12 months of cost history for ALL accounts from the cloud provider APIs. It runs in the background and may take a few minutes.",
      confirmLabel: "Run Backfill",
      variant: "default",
    });
    if (!ok) return;
    setBackfillRunning(true);
    setBackfillDone(false);
    try {
      await api.post("/organizations/trigger-monthly-backfill");
      setBackfillDone(true);
      showToast("Backfill triggered — running in background");
    } catch {
      showToast("Failed to trigger backfill", "error");
    } finally {
      setBackfillRunning(false);
    }
  };

  const handleTriggerCurrentMonth = async () => {
    const ok = await confirm({
      title: "Refresh Current Month?",
      message:
        "This will refresh only the current month's cost data for ALL accounts. Much faster than the full backfill — usually completes in under a minute.",
      confirmLabel: "Refresh Current Month",
      variant: "default",
    });
    if (!ok) return;
    setCurrentMonthRunning(true);
    setCurrentMonthDone(false);
    try {
      await api.post("/organizations/trigger-current-month-backfill");
      setCurrentMonthDone(true);
      showToast("Current month refresh triggered — running in background");
    } catch {
      showToast("Failed to trigger current month refresh", "error");
    } finally {
      setCurrentMonthRunning(false);
    }
  };

  const handleTriggerResourceDetection = async () => {
    setResourceDetectionRunning(true);
    setResourceDetectionDone(false);
    try {
      await api.post("/organizations/trigger-resource-detection");
      setResourceDetectionDone(true);
      showToast("Cost refresh + resource detection started — check Smart Alerts in ~1 minute");
    } catch {
      showToast("Failed to trigger resource detection", "error");
    } finally {
      setResourceDetectionRunning(false);
    }
  };

  const handleAccountBackfill = async (accountId, platform, accountName) => {
    const ok = await confirm({
      title: `Backfill ${accountName}?`,
      message: `This will fetch and store the last 12 months of cost history for ${accountName} (${platform.toUpperCase()}) only. Runs in the background.`,
      confirmLabel: "Run Backfill",
      variant: "default",
    });
    if (!ok) return;
    setAccountBackfillRunning((prev) => new Set(prev).add(accountId));
    try {
      await api.post("/organizations/trigger-account-backfill", { accountId, platform });
      showToast(`Backfill triggered for ${accountName}`);
    } catch {
      showToast(`Failed to trigger backfill for ${accountName}`, "error");
    } finally {
      setAccountBackfillRunning((prev) => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
    }
  };

  const handleAccountCurrentMonth = async (accountId, platform, accountName) => {
    setAccountCurrentMonthRunning((prev) => new Set(prev).add(accountId));
    try {
      await api.post("/organizations/trigger-account-current-month", { accountId, platform });
      showToast(`Current month refresh triggered for ${accountName}`);
    } catch {
      showToast(`Failed to refresh current month for ${accountName}`, "error");
    } finally {
      setAccountCurrentMonthRunning((prev) => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
    }
  };

  const TAB_CONFIG = [
    {
      key: "tokens",
      label: "Invite Tokens",
      icon: Key,
      count: tokens.filter((t) => !t.is_used).length,
    },
    {
      key: "admins",
      label: "Company Admins",
      icon: Users,
      count: admins.length,
    },
    {
      key: "orgs",
      label: "Subscriptions",
      icon: Building2,
      count: orgs.length,
    },
    {
      key: "data",
      label: "Data Tools",
      icon: DatabaseZap,
      count: null,
    },
    {
      key: "msp",
      label: "MSP Rates",
      icon: Percent,
      count: null,
    },
  ];

  const expiredCount = orgs.filter(
    (o) => o.expires_at && daysLeft(o.expires_at) < 0,
  ).length;
  const expiringSoon = orgs.filter((o) => {
    const d = daysLeft(o.expires_at);
    return d !== null && d >= 0 && d <= 30;
  }).length;

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center gap-3">
        <RefreshCw className="w-5 h-5 text-brand-600 animate-spin" />
        <span className="text-gray-500 font-medium">Loading Dashboard…</span>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Toast toast={toast} />

      {extendOrg && (
        <ExtendModal
          org={extendOrg}
          onClose={() => setExtendOrg(null)}
          onSuccess={fetchOrgs}
          showToast={showToast}
        />
      )}

      {/* ── Nav ── */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-100 rounded-xl">
            <Shield className="text-brand-600 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              Super Admin Portal
            </h1>
            <p className="text-xs text-gray-400">CCM Platform Management</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden sm:block">
            Signed in as{" "}
            <span className="font-bold text-gray-800">{saUsername}</span>
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </nav>

      <main className="w-full px-4 sm:px-6 xl:px-8 2xl:px-10 py-6">
        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            {
              label: "Organisations",
              value: orgs.length,
              icon: Building2,
              color: "bg-brand-50 text-brand-600",
            },
            {
              label: "Company Admins",
              value: admins.length,
              icon: Users,
              color: "bg-blue-50 text-blue-600",
            },
            {
              label: "Active Tokens",
              value: tokens.filter((t) => !t.is_used).length,
              icon: Key,
              color: "bg-emerald-50 text-emerald-600",
            },
            {
              label: "Expired",
              value: expiredCount,
              icon: AlertTriangle,
              color:
                expiredCount > 0
                  ? "bg-red-50 text-red-600"
                  : "bg-gray-50 text-gray-400",
            },
            {
              label: "Expiring ≤ 30d",
              value: expiringSoon,
              icon: CalendarClock,
              color:
                expiringSoon > 0
                  ? "bg-orange-50 text-orange-600"
                  : "bg-gray-50 text-gray-400",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm"
            >
              <div className={`p-2.5 rounded-xl ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-xs text-gray-500 leading-tight">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {TAB_CONFIG.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                // Always re-fetch live data when switching tabs (data tab has no fetch)
                if (t.key === "tokens") fetchTokens();
                else if (t.key === "admins") fetchAdmins();
                else if (t.key === "orgs") fetchOrgs();
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl font-semibold text-sm transition border-b-2 -mb-px ${
                tab === t.key
                  ? "bg-white border-brand-600 text-brand-700 shadow-sm"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.count !== null && (
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══ TOKENS TAB ══════════════════════════════════════════════════ */}
        {tab === "tokens" && (
          <div className="space-y-5">
            {loadingTokens && (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading tokens…
              </div>
            )}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-gray-800">
                  Generate Invitation Token
                </h2>
                <p className="text-sm text-gray-500">
                  Share these codes with new company admins to allow
                  registration.
                </p>
              </div>
              <button
                onClick={handleGenerateToken}
                className="shrink-0 bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-brand-700 transition text-sm shadow-sm"
              >
                + New Registration Token
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {[
                        "Token",
                        "Type",
                        "Status",
                        "Target / Used By",
                        "Company",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3.5 text-xs font-bold text-gray-500tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tokens.map((token) => (
                      <tr
                        key={token.id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-5 py-4 max-w-[160px]">
                          <code
                            className="bg-gray-100 px-2 py-1 rounded-lg text-brand-700 font-bold text-xs truncate block"
                            title={token.token}
                          >
                            {token.token}
                          </code>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-bold ${token.type === "REGISTRATION" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"}`}
                          >
                            {token.type}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {token.is_used ? (
                            <span className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Used
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-gray-400 text-sm">
                              <XCircle className="w-3.5 h-3.5" />
                              Available
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {token.target_email || "—"}
                        </td>
                        <td className="px-5 py-4 font-semibold text-gray-800">
                          {token.company_name || "—"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-1">
                            <button
                              onClick={() => copyToClipboard(token.token)}
                              className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                              title="Copy"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteToken(token.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {tokens.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-10 text-center text-gray-400"
                        >
                          No tokens generated yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ ADMINS TAB ═══════════════════════════════════════════════════ */}
        {tab === "admins" && (
          <div className="space-y-4">
            {loadingAdmins && (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading admins…
              </div>
            )}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {[
                        "Company Admin",
                        "Organisation",
                        "Status",
                        "Control",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3.5 text-xs font-bold text-gray-500tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {admins.map((admin) => (
                      <tr
                        key={admin.userId}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-5 py-4">
                          <p className="font-bold text-gray-800">
                            {admin.fullName}
                          </p>
                          <p className="text-xs text-gray-500">{admin.email}</p>
                        </td>
                        <td className="px-5 py-4 text-gray-700 font-medium">
                          {admin.orgName}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${admin.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                          >
                            {admin.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => handleToggleLock(admin)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${admin.status === "locked" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"}`}
                          >
                            {admin.status === "locked" ? (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                Unlock
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                Lock
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {admins.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-10 text-center text-gray-400"
                        >
                          No company admins found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ DATA TOOLS TAB ═══════════════════════════════════════════════ */}
        {tab === "data" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-800">Data Management Tools</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Administrative tools for managing cost history and cloud data.
              </p>
            </div>

            {/* Monthly History Backfill Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 rounded-xl shrink-0">
                    <History className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-base">
                      Monthly Cost History Backfill
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      Fetches and stores the last 12 months of cost history for{" "}
                      <strong>all</strong> Azure and AWS accounts by querying
                      the cloud provider billing APIs directly. Use this to:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-gray-500 list-disc list-inside ml-1">
                      <li>
                        Recover missing month data (e.g. last month showing
                        $0.00)
                      </li>
                      <li>Populate history for newly added accounts</li>
                      <li>Re-sync data after server downtime</li>
                    </ul>
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        This runs in the background and may take several minutes
                        depending on the number of accounts. A cron job also
                        runs automatically at{" "}
                        <strong>02:00 on the 1st of every month</strong> to
                        capture finalized month-end data.
                      </span>
                    </div>

                    {(backfillDone || currentMonthDone) && (
                      <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        {currentMonthDone
                          ? "Current month refresh triggered — running in background."
                          : "12-month backfill triggered — running in background. Wait ~2 min then click Check Status."}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-5 flex-wrap">
                  <div className="flex-1 text-xs text-gray-400">
                    Auto-runs on 1st of each month at 02:00
                  </div>
                  <button
                    onClick={fetchHistoryStatus}
                    disabled={loadingStatus}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 text-sm font-bold rounded-xl transition border border-gray-200 whitespace-nowrap"
                  >
                    {loadingStatus ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Checking…</>
                    ) : (
                      <><RefreshCw className="w-4 h-4" /> Check Status</>
                    )}
                  </button>
                  <button
                    onClick={handleTriggerCurrentMonth}
                    disabled={currentMonthRunning || backfillRunning}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition shadow-sm whitespace-nowrap"
                    title="Refresh only the current month — fast"
                  >
                    {currentMonthRunning ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Refreshing…</>
                    ) : (
                      <><CalendarDays className="w-4 h-4" /> Current Month</>
                    )}
                  </button>
                  <button
                    onClick={handleTriggerBackfill}
                    disabled={backfillRunning || currentMonthRunning}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition shadow-sm whitespace-nowrap"
                    title="Fetch all 12 months — only fetches missing months"
                  >
                    {backfillRunning ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Running…</>
                    ) : (
                      <><DatabaseZap className="w-4 h-4" /> Backfill 1 Year</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* History Status Table */}
            {historyStatus && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800">
                      Monthly History Storage Status
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Rows stored in{" "}
                      <code className="bg-gray-100 px-1 rounded">
                        monthlyCostHistory
                      </code>{" "}
                      per account. If row count is 0 or missing, backfill failed
                      for that account — check server logs.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                    {historyStatus.length} entries
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {[
                          "Account",
                          "Platform",
                          "Rows Stored",
                          "Oldest Month",
                          "Newest Month",
                          "Health",
                          "Actions",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-5 py-3 text-xs font-bold text-gray-500"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {historyStatus.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-5 py-10 text-center text-gray-400"
                          >
                            No history rows found — backfill may have failed.
                            Check server logs.
                          </td>
                        </tr>
                      ) : (
                        historyStatus.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition">
                            <td className="px-5 py-3">
                              <p className="font-semibold text-gray-800">
                                {row.account_name}
                              </p>
                              <p className="text-xs text-gray-400 font-mono">
                                {row.account_id.slice(0, 12)}…
                              </p>
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                                  row.platform === "azure"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-orange-50 text-orange-700 border-orange-200"
                                }`}
                              >
                                {row.platform.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`font-bold text-sm ${row.row_count >= 6 ? "text-emerald-600" : row.row_count > 0 ? "text-amber-600" : "text-red-600"}`}
                              >
                                {row.row_count}
                              </span>
                              <span className="text-xs text-gray-400 ml-1">
                                / 12 months
                              </span>
                            </td>
                            <td className="px-5 py-3 text-xs font-mono text-gray-600">
                              {row.oldest}
                            </td>
                            <td className="px-5 py-3 text-xs font-mono text-gray-600">
                              {row.newest}
                            </td>
                            <td className="px-5 py-3">
                              {row.row_count >= 11 ? (
                                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                                  <CheckCircle className="w-3.5 h-3.5" /> Full
                                  history
                                </span>
                              ) : row.row_count > 0 ? (
                                <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                                  <AlertTriangle className="w-3.5 h-3.5" />{" "}
                                  Partial
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs font-bold text-red-600">
                                  <XCircle className="w-3.5 h-3.5" /> No data
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleAccountCurrentMonth(
                                      row.account_id,
                                      row.platform,
                                      row.account_name
                                    )
                                  }
                                  disabled={
                                    accountCurrentMonthRunning.has(row.account_id) ||
                                    accountBackfillRunning.has(row.account_id)
                                  }
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 rounded-lg border border-emerald-200 transition whitespace-nowrap"
                                  title="Refresh current month only"
                                >
                                  {accountCurrentMonthRunning.has(row.account_id) ? (
                                    <><RefreshCw className="w-3 h-3 animate-spin" /> Running…</>
                                  ) : (
                                    <><CalendarDays className="w-3 h-3" /> Now</>
                                  )}
                                </button>
                                <button
                                  onClick={() =>
                                    handleAccountBackfill(
                                      row.account_id,
                                      row.platform,
                                      row.account_name
                                    )
                                  }
                                  disabled={
                                    accountBackfillRunning.has(row.account_id) ||
                                    accountCurrentMonthRunning.has(row.account_id)
                                  }
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 rounded-lg border border-indigo-200 transition whitespace-nowrap"
                                  title="Fetch all 12 months"
                                >
                                  {accountBackfillRunning.has(row.account_id) ? (
                                    <><RefreshCw className="w-3 h-3 animate-spin" /> Running…</>
                                  ) : (
                                    <><DatabaseZap className="w-3 h-3" /> Backfill</>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Resource Detection Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-50 rounded-xl shrink-0">
                    <ScanSearch className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-base">
                      Cloud Resource Detection
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      Scans all connected cloud accounts (Azure, AWS, GCP, BTP) for new or removed resources and fires Smart Alerts when changes are detected. Use this to:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-gray-500 list-disc list-inside ml-1">
                      <li>Immediately detect newly created cloud resources</li>
                      <li>Identify deleted or deprovisioned resources</li>
                      <li>Test Smart Alert notifications without waiting for the cron</li>
                    </ul>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 font-medium flex items-start gap-2">
                      <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        Clicking <strong>Run Detection Now</strong> first refreshes cost snapshots from the cloud APIs, then compares against the previous snapshot to find changes.
                        This takes ~1 minute — check <strong>Smart Alerts</strong> after it completes.
                        Auto-runs every <strong>2 hours</strong> via cron.
                      </span>
                    </div>
                    {resourceDetectionDone && (
                      <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        Detection triggered — cost snapshots refreshing, then detection runs. Check Smart Alerts in ~1 minute.
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
                  <div className="flex-1 text-xs text-gray-400">
                    Auto-runs every 2 hours
                  </div>
                  <button
                    onClick={handleTriggerResourceDetection}
                    disabled={resourceDetectionRunning}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition shadow-sm whitespace-nowrap"
                  >
                    {resourceDetectionRunning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Detecting…
                      </>
                    ) : (
                      <>
                        <ScanSearch className="w-4 h-4" /> Run Detection Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ MSP RATES TAB ════════════════════════════════════════════════ */}
        {tab === "msp" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="font-bold text-gray-800">Maitsys CSP Discount Rates</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                These rates are applied to all MSP savings calculations — live dashboards and invoice parsing.
                Changes take effect on the next invoice upload and next savings API call.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 tracking-wider">Cloud Provider</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 tracking-wider">Discount Rate (%)</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 tracking-wider">Last Updated</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 tracking-wider">Updated By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mspRates.map((r) => {
                    const providerColors = {
                      azure: "bg-blue-100 text-blue-700",
                      aws:   "bg-orange-100 text-orange-700",
                      gcp:   "bg-green-100 text-green-700",
                      btp:   "bg-teal-100 text-teal-700",
                    };
                    return (
                      <tr key={r.provider} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${providerColors[r.provider] ?? "bg-gray-100 text-gray-700"}`}>
                            {r.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={mspRatesEditing[r.provider] ?? ""}
                              onChange={(e) => setMspRatesEditing((prev) => ({ ...prev, [r.provider]: e.target.value }))}
                              className="w-24 px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                            />
                            <span className="text-gray-400 text-sm">%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : <span className="text-gray-300">Default</span>}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {r.updatedBy ?? <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveMspRates}
                disabled={mspRatesSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
              >
                {mspRatesSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Percent className="w-3.5 h-3.5" />}
                {mspRatesSaving ? "Saving…" : "Save Rates"}
              </button>
              <button
                onClick={fetchMspRates}
                className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
              <strong>Note:</strong> Updating rates does not retroactively recalculate savings on already-uploaded invoices.
              Only new invoice uploads and live dashboard savings will reflect the new rates.
            </div>
          </div>
        )}

        {/* ══ SUBSCRIPTIONS TAB ════════════════════════════════════════════ */}
        {tab === "orgs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-800">
                  Organisation Subscriptions
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage plans, user limits, AI access, and cloud provider
                  access.
                </p>
              </div>
              <button
                onClick={fetchOrgs}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5 bg-white border border-gray-200 rounded-xl transition"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingOrgs ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-3.5 text-xs font-bold text-gray-500tracking-wider">
                        Organisation
                      </th>
                      <th className="px-5 py-3.5 text-xs font-bold text-gray-500tracking-wider">
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          Plan
                        </span>
                      </th>
                      <th className="px-5 py-3.5 text-xs font-bold text-gray-500tracking-wider">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Users
                        </span>
                      </th>
                      <th className="px-5 py-3.5 text-xs font-bold text-gray-500tracking-wider">
                        <span className="flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          AI
                        </span>
                      </th>
                      <th className="px-5 py-3.5 text-xs font-bold text-gray-500tracking-wider">
                        <span className="flex items-center gap-1">
                          <Cloud className="w-3 h-3" />
                          Cloud
                        </span>
                      </th>
                      <th className="px-5 py-3.5 text-xs font-bold text-gray-500tracking-wider">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          Start Date
                        </span>
                      </th>
                      <th className="px-5 py-3.5 text-xs font-bold text-gray-500tracking-wider">
                        <span className="flex items-center gap-1">
                          <CalendarClock className="w-3 h-3" />
                          Expiry
                        </span>
                      </th>
                      <th className="px-5 py-3.5 text-xs font-bold text-gray-500tracking-wider">
                        Status
                      </th>
                      <th className="px-5 py-3.5 text-xs font-bold text-gray-500tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orgs.map((org) => {
                      const days = daysLeft(org.expires_at);
                      const isExpired = days !== null && days < 0;
                      return (
                        <tr
                          key={org.id}
                          className={`hover:bg-gray-50 transition ${isExpired ? "bg-red-50/30" : ""}`}
                        >
                          {/* Org name */}
                          <td className="px-5 py-4">
                            <p className="font-bold text-gray-800">
                              {org.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {org.memberCount} member
                              {org.memberCount !== 1 ? "s" : ""}
                            </p>
                          </td>

                          {/* Plan — inline dropdown */}
                          <td className="px-5 py-4">
                            <div className="relative">
                              <select
                                value={org.plan_type}
                                onChange={(e) =>
                                  handleInlineUpdate(
                                    org.id,
                                    "plan_type",
                                    e.target.value,
                                    org,
                                  )
                                }
                                className={`text-xs font-bold px-2.5 py-1 rounded-full border appearance-none pr-5 cursor-pointer focus:outline-none ${PLAN_COLORS[org.plan_type] ?? PLAN_COLORS.free}`}
                              >
                                {PLAN_OPTIONS.map((p) => (
                                  <option key={p} value={p}>
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                            </div>
                          </td>

                          {/* User Limit */}
                          <td className="px-5 py-4">
                            <span className="text-xs font-semibold text-gray-700">
                              {org.max_users === 0
                                ? "∞ unlimited"
                                : `${org.max_users} seats`}
                            </span>
                          </td>

                          {/* AI toggle */}
                          <td className="px-5 py-4">
                            <button
                              onClick={() =>
                                handleInlineUpdate(
                                  org.id,
                                  "ai_enabled",
                                  !org.ai_enabled,
                                  org,
                                )
                              }
                              className={`relative w-9 h-5 rounded-full transition-colors ${org.ai_enabled ? "bg-brand-600" : "bg-gray-300"}`}
                              title={
                                org.ai_enabled ? "Disable AI" : "Enable AI"
                              }
                            >
                              <span
                                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${org.ai_enabled ? "translate-x-4" : ""}`}
                              />
                            </button>
                          </td>

                          {/* Cloud — inline multi-select */}
                          <td className="px-5 py-4">
                            <CloudMultiSelectSA
                              org={org}
                              onSave={handleCloudInlineUpdate}
                            />
                          </td>

                          {/* Start Date */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <CalendarDays className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              {fmtDate(org.starts_at)}
                            </div>
                          </td>

                          {/* Expiry Date */}
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <CalendarClock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                {fmtDate(org.expires_at)}
                              </div>
                            </div>
                          </td>

                          {/* Expiry badge */}
                          <td className="px-5 py-4">
                            <ExpiryBadge expiresAt={org.expires_at} />
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <button
                              onClick={() => setExtendOrg(org)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition shadow-sm whitespace-nowrap"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" /> Extend
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {orgs.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="p-10 text-center text-gray-400"
                        >
                          No organisations found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
