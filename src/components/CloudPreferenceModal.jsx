import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";

// ─── Individual provider definitions ─────────────────────────────────────────
const CLOUD_PROVIDERS = [
  {
    id: "aws",
    label: "Amazon Web Services",
    tagline: "EC2 · S3 · RDS · Lambda · Cost Explorer",
    badge: "3.5% MSP discount",
    gradient: "from-orange-500 to-amber-400",
    color: "bg-orange-500",
    ringColor: "ring-orange-400",
    borderActive: "border-orange-400",
    borderIdle: "border-gray-200 dark:border-gray-700",
    bgActive: "",
    bgIdle: "",
    iconBg: "border border-orange-200 dark:border-orange-800",
    textActive: "text-orange-700 dark:text-orange-300",
    badgeBg: "border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300",
    icon: (
      <svg
        viewBox="0 0 96 96"
        className="w-6 h-6 text-orange-500"
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
    gradient: "from-blue-600 to-sky-400",
    color: "bg-blue-600",
    ringColor: "ring-blue-400",
    borderActive: "border-blue-400",
    borderIdle: "border-gray-200 dark:border-gray-700",
    bgActive: "",
    bgIdle: "",
    iconBg: "border border-blue-200 dark:border-blue-800",
    textActive: "text-blue-700 dark:text-blue-300",
    badgeBg: "border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
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
    gradient: "from-emerald-600 to-teal-400",
    color: "bg-emerald-600",
    ringColor: "ring-emerald-400",
    borderActive: "border-emerald-500",
    borderIdle: "border-gray-200 dark:border-gray-700",
    bgActive: "",
    bgIdle: "",
    iconBg: "border border-emerald-200 dark:border-emerald-800",
    textActive: "text-emerald-700 dark:text-emerald-300",
    badgeBg: "border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="w-6 h-6 text-emerald-600"
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
    gradient: "from-brand-600 to-brand-400",
    color: "bg-brand-600",
    ringColor: "ring-brand-400",
    borderActive: "border-brand-500",
    borderIdle: "border-gray-200 dark:border-gray-700",
    bgActive: "",
    bgIdle: "",
    iconBg: "border border-brand-200 dark:border-brand-800",
    textActive: "text-brand-700 dark:text-brand-300",
    badgeBg: "border border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
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
  gradient: "from-violet-600 to-purple-400",
  color: "bg-violet-600",
  ringColor: "ring-violet-400",
  borderActive: "border-violet-400",
  borderIdle: "border-gray-200 dark:border-gray-700",
  bgActive: "",
  bgIdle: "",
  iconBg: "border border-violet-200 dark:border-violet-800",
  textActive: "text-violet-700 dark:text-violet-300",
  badgeBg: "border border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300",
  icon: (
    <svg
      viewBox="0 0 24 24"
      className="w-6 h-6 text-violet-500"
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
  gradient: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  ringColor: PropTypes.string.isRequired,
  borderActive: PropTypes.string.isRequired,
  borderIdle: PropTypes.string.isRequired,
  bgActive: PropTypes.string.isRequired,
  bgIdle: PropTypes.string.isRequired,
  iconBg: PropTypes.string.isRequired,
  textActive: PropTypes.string.isRequired,
  badgeBg: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
});

// ─── Feature preview data ─────────────────────────────────────────────────────
const CLOUD_FEATURES = [
  { name: "Cost Dashboard", locked: false },
  { name: "Savings & Recommendations", locked: false },
  { name: "Budget Management", locked: false },
  { name: "Smart Alerts", locked: false },
  { name: "Invoice Upload", locked: false },
  { name: "Sync Logs", locked: false },
];

const INVOICE_ONLY_FEATURES = [
  { name: "Cost Dashboard (Invoice-based)", locked: false },
  { name: "Invoice Upload", locked: false },
  { name: "Savings", locked: true },
  { name: "Budgets", locked: true },
  { name: "Smart Alerts", locked: true },
  { name: "Sync Logs", locked: true },
];

function getModeLabel(isInvoiceOnly, hasCloud, invoiceSelected) {
  if (isInvoiceOnly) return "Invoice-only mode — upload bills to track costs";
  if (hasCloud && invoiceSelected)
    return "Hybrid mode — live cloud data + invoice upload";
  if (hasCloud)
    return `${hasCloud} provider${hasCloud > 1 ? "s" : ""} selected`;
  return null;
}

function getModeHeader(isInvoiceOnly, invoiceSelected) {
  if (isInvoiceOnly) return "📄 Invoice-only — limited menus";
  if (invoiceSelected) return "✦ Hybrid — all features unlocked";
  return "☁ Cloud mode — full access";
}

function getButtonLabel(
  loading,
  canSave,
  isInvoiceOnly,
  providerCount,
  invoiceSelected,
) {
  if (loading) return null;
  if (!canSave) return "Select at least one option";
  if (isInvoiceOnly) return "Continue with Invoice Upload →";
  const suffix = invoiceSelected ? " + Invoices" : "";
  return `Continue with ${providerCount} Provider${providerCount > 1 ? "s" : ""}${suffix} →`;
}

// ─── Provider card ─────────────────────────────────────────────────────────────
const ProviderCard = ({ p, selected, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
      selected
        ? "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/40"
        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 hover:border-gray-300 dark:hover:border-gray-600"
    }`}
  >
    <div
      className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${p.iconBg}`}
    >

      {p.icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`font-bold text-sm ${selected ? p.textActive : "text-slate-800 dark:text-slate-200"}`}
        >
          {p.label}
        </span>
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${p.badgeBg}`}
        >
          {p.badge}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{p.tagline}</p>
    </div>
    <div
      className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
        selected
          ? `${p.color} border-transparent`
          : "border-gray-300 dark:border-gray-600"
      }`}
    >
      {selected && (
        <svg
          className="w-2.5 h-2.5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </div>
  </button>
);
ProviderCard.propTypes = {
  p: PROVIDER_SHAPE.isRequired,
  selected: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

// ─── Feature preview row ──────────────────────────────────────────────────────
const FeatureRow = ({ name, locked }) => (
  <div
    className={`flex items-center gap-1.5 text-[10px] font-medium ${
      locked
        ? "text-gray-400 line-through"
        : "text-slate-700 dark:text-slate-300"
    }`}
  >
    <span>{locked ? "🔒" : "✓"}</span>
    <span>{name}</span>
  </div>
);
FeatureRow.propTypes = {
  name: PropTypes.string.isRequired,
  locked: PropTypes.bool.isRequired,
};

// ─── Main Modal ────────────────────────────────────────────────────────────────
export default function CloudPreferenceModal() {
  const { user, invoiceOnly, cloudAccess } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [invoiceSelected, setInvoiceSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "owner")) return;

    const alreadyConfigured =
      invoiceOnly ||
      (cloudAccess && cloudAccess.length > 0) ||
      user.cloudPreference;

    if (alreadyConfigured) {
      localStorage.setItem(`onboarded_cloud_${user.currentOrgId}`, "true");
      setIsOpen(false);
    } else {
      localStorage.removeItem(`onboarded_cloud_${user.currentOrgId}`);
      setIsOpen(true);
    }
  }, [user, invoiceOnly, cloudAccess]);

  const toggleProvider = (id) =>
    setSelectedProviders((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const isInvoiceOnlyMode = invoiceSelected && selectedProviders.length === 0;
  const canSave = selectedProviders.length > 0 || invoiceSelected;
  const previewFeatures = isInvoiceOnlyMode
    ? INVOICE_ONLY_FEATURES
    : CLOUD_FEATURES;
  const modeLabel = getModeLabel(
    isInvoiceOnlyMode,
    selectedProviders.length,
    invoiceSelected,
  );
  const modeHeader = getModeHeader(isInvoiceOnlyMode, invoiceSelected);
  const btnLabel = getButtonLabel(
    loading,
    canSave,
    isInvoiceOnlyMode,
    selectedProviders.length,
    invoiceSelected,
  );

  const handleSave = async () => {
    if (!canSave) return;
    setLoading(true);
    setError(null);
    try {
      await api.post("/users/update-cloud-preference", {
        cloud_preference:
          selectedProviders.length > 0 ? selectedProviders.join(",") : null,
        invoice_only: invoiceSelected,
      });
      localStorage.setItem(`onboarded_cloud_${user.currentOrgId}`, "true");
      setIsOpen(false);
      globalThis.location.reload();
    } catch (err) {
      console.error("Failed to save cloud preference:", err);
      setError("Failed to save preference. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path d="M3 15a4 4 0 0 0 4 4h9a5 5 0 1 0-.1-9.999 5.002 5.002 0 0 0-9.78 2.096A4.001 4.001 0 0 0 3 15z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight text-gray-900 dark:text-white">
                Welcome to CCM
              </h2>
              <p className="text-gray-400 text-xs">Cloud Cost Monitor</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            How will your organisation track cloud costs? Choose cloud
            providers, invoice upload, or both.
          </p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Cloud providers */}
          <div>
            <p className="text-[10px] font-bold  tracking-wider text-gray-400 mb-2 px-1">
              Live Cloud Connection
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

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
              or
            </span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Invoice option */}
          <div>
            <p className="text-[10px] font-bold  tracking-wider text-gray-400 mb-2 px-1">
              Manual Invoice Upload
            </p>
            <ProviderCard
              p={INVOICE_OPTION}
              selected={invoiceSelected}
              onToggle={() => setInvoiceSelected((v) => !v)}
            />
          </div>

          {/* Feature preview */}
          {canSave && (
            <div
              className={`rounded-xl border p-3 transition-all duration-300 ${
                isInvoiceOnlyMode
                  ? "border-violet-200 dark:border-violet-800"
                  : "border-emerald-200 dark:border-emerald-800"
              }`}
            >
              <p className="text-[10px] font-bold  tracking-wider text-gray-500 mb-2">
                {modeHeader}
              </p>
              <div className="grid grid-cols-2 gap-1">
                {previewFeatures.map((item) => (
                  <FeatureRow
                    key={item.name}
                    name={item.name}
                    locked={item.locked}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 space-y-3">
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
              {error}
            </p>
          )}

          {modeLabel && (
            <p className="text-center text-xs font-semibold text-slate-600 dark:text-slate-400">
              {modeLabel}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={loading || !canSave}
            className="w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl transition-all border border-indigo-400 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              btnLabel
            )}
          </button>

          <p className="text-xs text-center text-gray-400 dark:text-gray-600">
            You can change this later from your organisation settings.{" "}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate("/subscription");
              }}
              className="text-indigo-500 hover:underline"
            >
              Manage in Subscription
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
