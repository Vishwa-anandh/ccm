import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import {
  CreditCard,
  CheckCircle,
  Lock,
  Bot,
  Calendar,
  Shield,
  Star,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  Clock,
  Zap,
  Globe,
  FileText,
  Unlock,
  Save,
  Check,
} from "lucide-react";

// ─── Pricing Plans ────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    tagline: "Everything you need to get started",
    badge: null,
    gradient: "from-slate-600 to-slate-500",
    color: "bg-slate-600",
    ring: "ring-slate-200 dark:ring-slate-700",
    activeBorder: "border-slate-400",
    badgeBg: "border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400",
    btnClass: "border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400",
    features: [
      "Azure & AWS cost monitoring",
      "Budget alerts & threshold rules",
      "Invoice upload & PDF/CSV parsing",
      "Smart anomaly detection alerts",
      "Savings overview & MSP discounts",
      "Up to 5 team members",
      "Community support",
    ],
    locked: [],
  },
  {
    id: "premium",
    name: "Professional",
    price: "$0",
    period: "/month",
    tagline: "For growing teams with deeper needs",
    badge: "Most Popular",
    gradient: "from-indigo-600 to-blue-500",
    color: "bg-indigo-600",
    ring: "ring-indigo-200 dark:ring-indigo-700",
    activeBorder: "border-indigo-500",
    badgeBg: "border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400",
    btnClass: "border border-indigo-400 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:border-indigo-500",
    features: [
      "Everything in Free",
      "GCP & SAP BTP cost monitoring",
      "AI Chatbot Assistant (CCM insights)",
      "Smart alerts with email notifications",
      "Advanced cost analytics & forecasting",
      "Up to 25 team members",
      "Priority email support",
    ],
    locked: [],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$0",
    period: "/month",
    tagline: "Unlimited scale, dedicated support",
    badge: "Full Access",
    gradient: "from-purple-600 to-violet-500",
    color: "bg-purple-600",
    ring: "ring-purple-200 dark:ring-purple-700",
    activeBorder: "border-purple-500",
    badgeBg: "border border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400",
    btnClass: "border border-purple-400 dark:border-purple-600 text-purple-600 dark:text-purple-400 hover:border-purple-500",
    features: [
      "Everything in Professional",
      "Unlimited cloud accounts & providers",
      "Unlimited team members & roles",
      "Custom cloud access permissions",
      "Dedicated Account Manager",
      "White-glove onboarding & training",
      "SLA-backed priority support",
    ],
    locked: [],
  },
];

// ─── Cloud Provider Cards ─────────────────────────────────────────────────────
const CLOUD_PROVIDERS = [
  {
    id: "aws",
    label: "Amazon Web Services",
    tagline: "EC2 · S3 · RDS · Lambda · Cost Explorer",
    badge: "3.5% MSP discount",
    borderActive: "border-orange-400",
    borderIdle: "border-gray-200 dark:border-gray-700",
    bgActive: "",
    bgIdle: "",
    iconBg: "border border-orange-200 dark:border-orange-800",
    textActive: "text-orange-700 dark:text-orange-300",
    badgeBg: "border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300",
    gradient: "from-orange-500 to-amber-400",
    color: "bg-orange-500",
    ringColor: "ring-orange-400",
    icon: (
      <svg
        viewBox="0 0 96 96"
        className="w-5 h-5 text-orange-500"
        fill="currentColor"
      >
        <path d="M85.54 64.67C75.52 71.98 60.95 75.84 48.4 75.84c-17.52 0-33.3-6.47-45.23-17.24-1-.84-.1-2 1.07-1.34 12.88 7.5 28.79 12.02 45.23 12.02 11.09 0 23.29-2.3 34.52-7.07 1.69-.73 3.11 1.11 1.55 2.46z" />
        <path d="M89.72 59.9c-1.33-1.72-8.83-.82-12.2-.41-1.02.12-1.18-.77-.26-1.42 5.97-4.2 15.76-2.99 16.9-1.58 1.15 1.42-.3 11.23-5.9 15.92-.87.73-1.69.34-1.3-.61 1.25-3.13 4.1-10.19 2.76-11.9z" />
      </svg>
    ),
  },
  {
    id: "azure",
    label: "Microsoft Azure",
    tagline: "VMs · App Services · Storage · AKS",
    badge: "7% MSP discount",
    borderActive: "border-blue-400",
    borderIdle: "border-gray-200 dark:border-gray-700",
    bgActive: "",
    bgIdle: "",
    iconBg: "border border-blue-200 dark:border-blue-800",
    textActive: "text-blue-700 dark:text-blue-300",
    badgeBg: "border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300",
    gradient: "from-blue-600 to-sky-400",
    color: "bg-blue-600",
    ringColor: "ring-blue-400",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path d="M5.9 21L13.7 21L19.4 6.8L12.1 6.8L5.9 21Z" fill="#0078D4" />
        <path
          d="M12.4 21L12.4 20.6L12.1 21L12.4 21ZM5.9 21L0.1 6.8L6.8 6.8L9.9 14.2L5.9 21Z"
          fill="#0078D4"
        />
        <path
          d="M12.3 20.6L19.5 3.5L12.6 3.5L9.9 10L12.3 20.6Z"
          fill="#5EA0EF"
        />
      </svg>
    ),
  },
  {
    id: "btp",
    label: "SAP BTP",
    tagline: "Subaccounts · Services · Usage · Costs",
    badge: "2% MSP discount",
    borderActive: "border-emerald-500",
    borderIdle: "border-gray-200 dark:border-gray-700",
    bgActive: "",
    bgIdle: "",
    iconBg: "border border-emerald-200 dark:border-emerald-800",
    textActive: "text-emerald-700 dark:text-emerald-300",
    badgeBg: "border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300",
    gradient: "from-emerald-600 to-teal-400",
    color: "bg-emerald-600",
    ringColor: "ring-emerald-400",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5 text-emerald-600"
        fill="currentColor"
      >
        <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L20 8.5v7L12 19.82 4 15.5v-7l8-4.32zM8 10v4h2v-4H8zm3 0v4h2v-4h-2zm3 0v4h2v-4h-2z" />
      </svg>
    ),
  },
  {
    id: "gcp",
    label: "Google Cloud Platform",
    tagline: "Compute · BigQuery · Cloud Storage · Billing",
    badge: "3.5% MSP discount",
    borderActive: "border-brand-500",
    borderIdle: "border-gray-200 dark:border-gray-700",
    bgActive: "",
    bgIdle: "",
    iconBg: "border border-brand-200 dark:border-brand-800",
    textActive: "text-brand-700 dark:text-brand-300",
    badgeBg: "border border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300",
    gradient: "from-brand-600 to-brand-400",
    color: "bg-brand-600",
    ringColor: "ring-brand-400",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path d="M12 5.4l2.6 2.6H9.4L12 5.4z" fill="#60a5fa" />
        <path d="M5.4 12l2.6-2.6v5.2L5.4 12z" fill="#93c5fd" />
        <path d="M12 18.6l-2.6-2.6h5.2L12 18.6z" fill="#3b82f6" />
        <path d="M18.6 12l-2.6 2.6V9.4l2.6 2.6z" fill="#2563EB" />
        <circle cx="12" cy="12" r="3" fill="#3b82f6" />
      </svg>
    ),
  },
];

const INVOICE_OPTION = {
  id: "invoice",
  label: "Manual Invoice Upload",
  tagline: "Upload PDF & CSV invoices — no live cloud sync needed",
  badge: "Invoice-only mode",
  borderActive: "border-violet-400",
  borderIdle: "border-gray-200 dark:border-gray-700",
  bgActive: "",
  bgIdle: "",
  iconBg: "border border-violet-200 dark:border-violet-800",
  textActive: "text-violet-700 dark:text-violet-300",
  badgeBg: "border border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300",
  gradient: "from-violet-600 to-purple-400",
  color: "bg-violet-600",
  ringColor: "ring-violet-400",
  icon: (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5 text-violet-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
};

const PROVIDER_SHAPE = PropTypes.shape({
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  tagline: PropTypes.string.isRequired,
  badge: PropTypes.string.isRequired,
  borderActive: PropTypes.string.isRequired,
  borderIdle: PropTypes.string.isRequired,
  bgActive: PropTypes.string.isRequired,
  bgIdle: PropTypes.string.isRequired,
  iconBg: PropTypes.string.isRequired,
  textActive: PropTypes.string.isRequired,
  badgeBg: PropTypes.string.isRequired,
  gradient: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  ringColor: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function PlanFeatureItem({ label, included }) {
  return (
    <div className="flex items-center gap-2 py-1">
      {included ? (
        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      ) : (
        <Lock className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
      )}
      <span
        className={`text-xs ${included ? "text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-600"}`}
      >
        {label}
      </span>
    </div>
  );
}
PlanFeatureItem.propTypes = {
  label: PropTypes.string.isRequired,
  included: PropTypes.bool.isRequired,
};

function ValidityBadge({ expiresAt }) {
  const days = daysUntil(expiresAt);
  if (days === null) return null;

  let color =
    "text-emerald-600 border-emerald-300 dark:border-emerald-700 dark:text-emerald-400";
  let icon = <CheckCircle className="w-3 h-3" />;

  if (days < 0) {
    color = "text-red-600 border-red-300 dark:border-red-700 dark:text-red-400";
    icon = <AlertTriangle className="w-3 h-3" />;
  } else if (days <= 30) {
    color =
      "text-amber-600 border-amber-300 dark:border-amber-700 dark:text-amber-400";
    icon = <Clock className="w-3 h-3" />;
  }

  const label =
    days < 0
      ? `Expired ${Math.abs(days)} days ago`
      : days === 0
        ? "Expires today"
        : `${days} days remaining`;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}
    >
      {icon}
      {label}
    </span>
  );
}
ValidityBadge.propTypes = { expiresAt: PropTypes.string };

function ProviderCard({ p, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
        selected
          ? "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/40"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${p.iconBg}`}>
        {p.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
            {p.label}
          </span>
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${p.badgeBg}`}
          >
            {p.badge}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5 truncate">
          {p.tagline}
        </p>
      </div>
      <div
        className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
          selected
            ? `${p.color} border-transparent`
            : "border-gray-300 dark:border-gray-600"
        }`}
      >
        {selected && (
          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
        )}
      </div>
    </button>
  );
}
ProviderCard.propTypes = {
  p: PROVIDER_SHAPE.isRequired,
  selected: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

// ─── Cloud Access Manager ─────────────────────────────────────────────────────
function CloudAccessManager({ sub, onSaved }) {
  const { invoiceOnly, cloudAccess, refreshUser } = useAuth();

  const initProviders = () => {
    // Prefer sub.cloud_access (DB source of truth) over auth context cloudAccess
    if (sub?.cloud_access && sub.cloud_access.length > 0) return sub.cloud_access;
    if (cloudAccess && cloudAccess.length > 0) return cloudAccess;
    if (sub?.cloud_preference) {
      return sub.cloud_preference
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  };

  const [selectedProviders, setSelectedProviders] = useState(initProviders);
  const [invoiceSelected, setInvoiceSelected] = useState(
    invoiceOnly || sub?.invoice_only || false,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const toggleProvider = (id) =>
    setSelectedProviders((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const isInvoiceOnlyMode = invoiceSelected && selectedProviders.length === 0;
  const canSave = selectedProviders.length > 0 || invoiceSelected;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await api.post("/users/update-cloud-preference", {
        cloud_preference:
          selectedProviders.length > 0 ? selectedProviders.join(",") : null,
        invoice_only: invoiceSelected,
      });
      await refreshUser();
      setSaveSuccess(true);
      localStorage.removeItem(
        "onboarded_cloud_" + (sub?.organization_id ?? ""),
      );
      if (onSaved) onSaved();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(
        err.response?.data?.error ?? "Failed to update cloud access.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-indigo-200 dark:border-indigo-800 rounded-xl">
            <Unlock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Cloud Access
            </h3>
            <p className="text-xs text-gray-400">
              Select which cloud providers your organisation uses
            </p>
          </div>
        </div>
        {(invoiceOnly ||
          (cloudAccess && cloudAccess.length > 0) ||
          sub?.cloud_preference) && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400">
            ✓ Configured
          </span>
        )}
      </div>

      {/* ── 2-column body ── */}
      <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-800">
        {/* LEFT — Cloud providers */}
        <div className="p-5 space-y-3">
          <p className="text-[10px] font-bold  tracking-wider text-gray-400">
            Live Cloud Connection{" "}
            <span className="normal-case font-normal">
              (select all that apply)
            </span>
          </p>
          <div className="space-y-2">
            {CLOUD_PROVIDERS.map((p) => (
              <ProviderCard
                key={p.id}
                p={p}
                selected={selectedProviders.includes(p.id)}
                onToggle={() => toggleProvider(p.id)}
              />
            ))}
          </div>
        </div>

        {/* RIGHT — Invoice option + mode hint */}
        <div className="p-5 space-y-3">
          <div>
            <p className="text-[10px] font-bold tracking-wider text-gray-400 mb-2">
              Manual Invoice Upload
            </p>
            <ProviderCard
              p={INVOICE_OPTION}
              selected={invoiceSelected}
              onToggle={() => setInvoiceSelected((v) => !v)}
            />
          </div>

          {/* Mode hint */}
          {canSave && (
            <div
              className={`text-xs font-medium px-3 py-2 rounded-xl border ${
                isInvoiceOnlyMode
                  ? "border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400"
                  : selectedProviders.length > 0 && invoiceSelected
                    ? "border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400"
                    : "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
              }`}
            >
              {isInvoiceOnlyMode
                ? "📄 Invoice-only mode — cost dashboard from uploaded invoices"
                : selectedProviders.length > 0 && invoiceSelected
                  ? `✦ Hybrid — ${selectedProviders.length} cloud provider${selectedProviders.length > 1 ? "s" : ""} + Invoice upload`
                  : `☁ Live cloud mode — ${selectedProviders.length} provider${selectedProviders.length > 1 ? "s" : ""} connected`}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer: save button full-width at bottom ── */}
      <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
        {saveError && (
          <p className="text-xs text-red-600 dark:text-red-400 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
            {saveError}
          </p>
        )}
        {saveSuccess && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Cloud access updated — refresh the page to see changes.
          </p>
        )}
        <div className="flex items-center justify-between gap-4">
          <p className="text-[10px] text-gray-400 dark:text-gray-600">
            Changes apply organisation-wide and take effect immediately after page refresh.
          </p>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="shrink-0 flex items-center gap-2 border border-indigo-400 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm py-2.5 px-5 rounded-xl transition-all"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Update Cloud Access
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
CloudAccessManager.propTypes = {
  sub: PropTypes.object,
  onSaved: PropTypes.func,
};

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, isCurrent }) {
  const isPopular = plan.badge === "Most Popular";
  return (
    <div
      className={`relative flex flex-col rounded-2xl border-2 transition-all ${
        isPopular
          ? "border-indigo-500 shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 scale-[1.02]"
          : isCurrent
            ? `${plan.activeBorder} shadow-md`
            : "border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600"
      } bg-white dark:bg-gray-900 overflow-visible`}
    >
      {/* Most Popular top banner */}
      {isPopular && (
        <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
          <span className="border border-indigo-400 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold tracking-widest px-4 py-1 rounded-full bg-white dark:bg-gray-900">
            Most Popular
          </span>
        </div>
      )}

      {/* Current Plan badge */}
      {isCurrent && !isPopular && (
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400">
            Current
          </span>
        </div>
      )}
      {isCurrent && isPopular && (
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400">
            Current
          </span>
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        {/* Plan name */}
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
          {plan.name}
        </h3>
        <p
          className={`text-xs mb-4 ${isPopular ? "text-indigo-500 font-semibold" : "text-gray-400"}`}
        >
          {plan.tagline}
        </p>

        {/* Price */}
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
            Pricing coming soon
          </span>
        </div>

        {/* Divider */}
        <hr className="border-gray-100 dark:border-gray-800 mb-4" />

        {/* Features */}
        <div className="flex-1 space-y-2 mb-6">
          {plan.features.map((f) => (
            <div key={f} className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {f}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        {isCurrent ? (
          <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            Current Plan
          </div>
        ) : (
          <a
            href="https://www.maitsys.com/contact-us"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${plan.btnClass}`}
          >
            {plan.id === "free" ? "Get Started" : "Choose Plan"}
            <ArrowUpRight className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
PlanCard.propTypes = {
  plan: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.string.isRequired,
    period: PropTypes.string.isRequired,
    tagline: PropTypes.string.isRequired,
    badge: PropTypes.string,
    gradient: PropTypes.string.isRequired,
    activeBorder: PropTypes.string.isRequired,
    badgeBg: PropTypes.string.isRequired,
    btnClass: PropTypes.string.isRequired,
    features: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  isCurrent: PropTypes.bool.isRequired,
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SubscriptionManagementPage() {
  const { user, refreshUser } = useAuth();

  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = user?.role === "admin" || user?.role === "owner";

  const fetchSubscription = async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data }] = await Promise.all([
        api.get("/users/subscription"),
        refreshUser(),
      ]);
      setSub(data.subscription);
    } catch (err) {
      setError(err.response?.data?.error ?? "Failed to load subscription details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const planType = sub?.plan_type ?? user?.planType ?? "free";
  const aiEnabled = sub?.ai_enabled ?? user?.aiEnabled ?? false;
  const maxUsers = sub?.max_users ?? null;
  const startsAt = sub?.starts_at ?? null;
  const expiresAt = sub?.expires_at ?? null;
  const isActive = sub?.is_active ?? true;
  const notes = sub?.notes ?? null;
  const orgName = user?.orgName ?? "Your Organisation";

  if (loading) {
    return (
      <div className="p-4 sm:p-6 xl:p-8 w-full space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-4 w-96 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl"
            />
          ))}
        </div>
        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 xl:p-8 w-full space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Subscription &amp; Billing
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your plan, cloud access, and features for{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {orgName}
            </span>
            .
          </p>
        </div>
        <button
          onClick={fetchSubscription}
          className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition px-3 py-2 rounded-xl border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Current Plan Card (top, single column) ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Card header strip */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-indigo-200 dark:border-indigo-800 rounded-xl">
              <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 tracking-wider font-semibold">
                Current Plan
              </p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize leading-tight">
                {planType === "basic" ? "Free" : planType}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isActive && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400">
                Inactive
              </span>
            )}
            {isActive && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400">
                Active
              </span>
            )}
          </div>
        </div>

        {/* ── 2-column body ── */}
        <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-800">
          {/* LEFT — plan details */}
          <div className="p-6 space-y-4">
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
              Plan Details
            </p>

            {/* row */}
            <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4 shrink-0" /> Started
              </div>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {startsAt ? formatDate(startsAt) : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4 shrink-0" /> Valid Until
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {expiresAt ? formatDate(expiresAt) : "—"}
                </span>
                {expiresAt && <ValidityBadge expiresAt={expiresAt} />}
              </div>
            </div>

            <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Shield className="w-4 h-4 shrink-0" /> Team Members
              </div>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Up to {maxUsers ?? "—"}
              </span>
            </div>

            {/* AI status row */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Bot className="w-4 h-4 shrink-0" /> AI Chatbot
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  aiEnabled
                    ? "border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400"
                    : "border-gray-300 dark:border-gray-600 text-gray-500"
                }`}
              >
                {aiEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>

          {/* RIGHT — included features */}
          <div className="p-6 space-y-4">
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
              Included with your plan
            </p>
            <div className="space-y-0">
              {[
                {
                  label: "Cost Dashboard",
                  icon: <Globe className="w-3.5 h-3.5 text-indigo-500" />,
                  enabled: true,
                },
                {
                  label: "Invoice Upload",
                  icon: <FileText className="w-3.5 h-3.5 text-violet-500" />,
                  enabled: true,
                },
                {
                  label: "Budget Alerts",
                  icon: (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  ),
                  enabled: true,
                },
                {
                  label: "Smart Alerts",
                  icon: (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  ),
                  enabled: true,
                },
                {
                  label: "Recommendations",
                  icon: (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  ),
                  enabled: true,
                },
                {
                  label: "AI Chatbot",
                  icon: aiEnabled ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                  ),
                  enabled: aiEnabled,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.label}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-semibold ${item.enabled ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`}
                  >
                    {item.enabled ? "✓ Included" : "Locked"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Cloud Access (single column, below plan card) ── */}
      {isAdmin ? (
        <CloudAccessManager sub={sub} onSaved={fetchSubscription} />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl">
              <Globe className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 tracking-wider font-semibold">
                Cloud Access
              </p>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {sub?.cloud_preference ?? "Not configured"}
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-800">
            <div className="p-5 space-y-2">
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-3">
                Access Info
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Cloud provider access is configured by your organisation
                administrator.
              </p>
            </div>
            <div className="p-5 flex items-center">
              <div className="w-full p-3 border border-amber-200 dark:border-amber-800 rounded-xl">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  Contact your admin to update cloud provider access.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Pricing Plans ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300  tracking-wider">
            Available Plans
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={
                planType === plan.id ||
                (planType === "basic" && plan.id === "free")
              }
            />
          ))}
        </div>
        <p className="text-xs text-center text-gray-400 dark:text-gray-600 mt-3">
          All plans include full access to multi-cloud monitoring, invoice
          upload, budgets, and alerts. Contact{" "}
          <a
            href="https://www.maitsys.com/contact-us"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:underline"
          >
            Maitsys
          </a>{" "}
          to upgrade.
        </p>
      </div>

      {/* ── Admin Note ── */}
      {notes && (
        <div className="flex items-start gap-3 p-4 border border-amber-200 dark:border-amber-700 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-0.5">
              Admin Note
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-500">
              {notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
