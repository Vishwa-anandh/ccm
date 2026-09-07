import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import {
  Upload,
  FileText,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  AlertTriangle,
  BarChart2,
  X,
  CheckCircle,
  Calendar,
  Receipt,
  Tag,
  CreditCard,
  Layers,
  Info,
  CloudUpload,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import PropTypes from "prop-types";
import api from "../api";
import { formatCurrency } from "../utils/formatters";
import { useConfirm } from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";

const MONTH_NAMES = [
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
const AZURE_COLORS = [
  "#0078D4",
  "#2196F3",
  "#42A5F5",
  "#64B5F6",
  "#00B4D8",
  "#0096C7",
  "#5E60CE",
  "#48CAE4",
];
const AWS_COLORS = [
  "#FF9900",
  "#FF6B00",
  "#FFB347",
  "#FFA500",
  "#E07B00",
  "#FFCC80",
  "#D4820A",
  "#FFD580",
];

const AzureIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path d="M5.9 21h7.8l5.7-14.2h-7.3L5.9 21Z" fill="#0078D4" />
    <path d="M5.9 21L.1 6.8h6.7l3.1 7.4L5.9 21Z" fill="#0078D4" />
    <path d="M12.3 20.6 19.5 3.5h-6.9L9.9 10l2.4 10.6Z" fill="#5EA0EF" />
  </svg>
);
const AwsIcon = ({ className }) => (
  <svg viewBox="0 0 60 36" className={className} fill="none">
    <text
      x="5"
      y="28"
      fontFamily="Arial Black,Arial"
      fontWeight="900"
      fontSize="26"
      fill="#FF9900"
    >
      AWS
    </text>
  </svg>
);

/* ── helpers ─────────────────────────────────────────────── */

const fmtDate = (s) => {
  if (!s) return "—";
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) {
    const d = new Date(`${m[3]}-${m[1]}-${m[2]}`);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return s;
};

function monthLabel(month, year) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}
function momDelta(cur, prev) {
  if (!prev || prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}

/* ── sub-components ──────────────────────────────────────── */

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 ${className}`}
    style={{
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
    }}
  >
    {children}
  </div>
);

const DeltaBadge = ({ pct }) => {
  if (pct === null) return <span className="badge badge-gray">First</span>;
  if (Math.abs(pct) < 0.5)
    return (
      <span className="badge badge-gray flex items-center gap-1">
        <Minus className="w-3 h-3" />
        Flat
      </span>
    );
  const up = pct > 0;
  return (
    <span
      className={`badge flex items-center gap-1 ${up ? "badge-red" : "badge-green"}`}
    >
      {up ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {up ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
};

const MetaChip = ({ icon: Icon, label, value, accent = "gray" }) => {
  // eslint-disable-line no-unused-vars
  const colors = {
    blue: "text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    green:
      "text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    orange:
      "text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    gray: "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  }[accent];
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${colors}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
      <span className="text-[10px]  tracking-wide opacity-60 shrink-0">
        {label}
      </span>
      <span className="font-bold truncate">{value || "—"}</span>
    </div>
  );
};

const KpiTile = ({ label, value, sub, accent = "gray", large = false }) => {
  const accents = {
    blue: "from-blue-500/10 to-transparent border-blue-100 dark:border-blue-900",
    green:
      "from-emerald-500/10 to-transparent border-emerald-100 dark:border-emerald-900",
    red: "from-red-500/10 to-transparent border-red-100 dark:border-red-900",
    gray: "from-gray-500/5 to-transparent border-gray-100 dark:border-gray-800",
    orange:
      "from-orange-500/10 to-transparent border-orange-100 dark:border-orange-900",
  }[accent];

  const len = String(value).length;
  const fontSize = large
    ? len > 13
      ? "text-sm"
      : len > 10
        ? "text-base"
        : "text-xl"
    : len > 13
      ? "text-xs"
      : "text-sm";

  return (
    <div className={`rounded-xl border p-3 min-w-0 ${accents}`}>
      <p className="text-[10px] font-bold tracking-wider text-gray-400 mb-1 truncate">
        {label}
      </p>
      <p
        className={`font-bold text-gray-900 dark:text-white tabular-nums leading-tight break-all ${fontSize}`}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-gray-400 mt-0.5 font-medium truncate">
          {sub}
        </p>
      )}
    </div>
  );
};

/* ── Upload zone ─────────────────────────────────────────── */

const UploadZone = ({ onUploaded }) => {
  const { user } = useAuth();
  const isPrivileged = user?.role === "admin" || user?.role === "owner";
  const allowedProviders = ["azure", "aws", "btp", "gcp"].filter((p) => {
    if (isPrivileged) return true;
    if (p === "azure") return user?.canViewAzure && !user?.azureReadOnly;
    if (p === "aws") return user?.canViewAws && !user?.awsReadOnly;
    if (p === "btp") return user?.canViewBtp && !user?.btpReadOnly;
    if (p === "gcp") return user?.canViewGcp && !user?.gcpReadOnly;
    return false;
  });

  const [dragging, setDragging] = useState(false);
  const [provider, setProvider] = useState(
    () => allowedProviders[0] ?? "azure",
  );
  const [billingName, setBillingName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    const allowedExts = provider === "btp" ? ["xlsx"] : ["pdf"];
    if (!allowedExts.includes(ext)) {
      setError(
        provider === "btp"
          ? "SAP BTP invoices must be an XLSX file."
          : `${provider === "aws" ? "AWS" : provider === "gcp" ? "GCP" : "Azure"} invoices must be a PDF file.`,
      );
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");
    const form = new FormData();
    form.append("file", file);
    form.append("provider", provider);
    if (billingName.trim()) form.append("billingName", billingName.trim());

    try {
      await api.post("/invoices/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(`${file.name} parsed and saved.`);
      setBillingName("");
      onUploaded();
    } catch (err) {
      setError(
        err.response?.data?.error || "Upload failed. Check the file format.",
      );
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      handleFile(e.dataTransfer.files[0]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider],
  );

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-4">
      {/* Provider selector */}
      <div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2  tracking-wide">
          Provider
        </p>
        {allowedProviders.length === 0 ? (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-xs font-semibold text-red-600 dark:text-red-400">
            <Info className="w-3.5 h-3.5 shrink-0" />
            No cloud access — contact your administrator.
          </div>
        ) : (
          <div className="flex gap-3">
            {allowedProviders.map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                  provider === p
                    ? p === "aws"
                      ? "border-orange-400 dark:border-orange-600 text-orange-700 dark:text-orange-400"
                      : p === "btp"
                        ? "border-emerald-500 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400"
                        : p === "gcp"
                          ? "border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-400"
                          : "border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-400"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {p === "aws" ? (
                  <AwsIcon className="w-6 h-3.5" />
                ) : p === "btp" ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="currentColor"
                  >
                    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L20 8.5v7L12 19.82 4 15.5v-7l8-4.32zM8 10v4h2v-4H8zm3 0v4h2v-4h-2zm3 0v4h2v-4h-2z" />
                  </svg>
                ) : p === "gcp" ? (
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                    <path
                      d="M17.6 11.8c0-.1 0-.2-.1-.3l-2.1-3.6c-.1-.2-.3-.3-.5-.3H9.1c-.2 0-.4.1-.5.3L6.5 11.5c-.1.1-.1.2-.1.3s0 .2.1.3l2.1 3.6c.1.2.3.3.5.3h5.8c.2 0 .4-.1.5-.3l2.1-3.6c.1-.1.1-.2.1-.3z"
                      fill="#3b82f6"
                    />
                    <circle cx="12" cy="12" r="2.2" fill="white" />
                    <circle cx="12" cy="12" r="1" fill="#3b82f6" />
                  </svg>
                ) : (
                  <AzureIcon className="w-4 h-4" />
                )}
                {p === "aws"
                  ? "AWS"
                  : p === "btp"
                    ? "SAP BTP"
                    : p === "gcp"
                      ? "GCP"
                      : "Azure"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Billing Name */}
      <div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2  tracking-wide">
          Billing Name{" "}
          <span className="normal-case font-normal opacity-60">
            (optional — used when not found in file)
          </span>
        </p>
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={billingName}
            onChange={(e) => setBillingName(e.target.value)}
            placeholder="e.g. Casella Azure, Acme Corp AWS…"
            maxLength={120}
            disabled={uploading || allowedProviders.length === 0}
            className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 disabled:opacity-50 transition"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          if (allowedProviders.length) {
            e.preventDefault();
            setDragging(true);
          }
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={allowedProviders.length ? onDrop : undefined}
        onClick={() => allowedProviders.length && inputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-10 transition-all duration-200 ${
          allowedProviders.length === 0
            ? "border-gray-100 dark:border-gray-800 opacity-40 cursor-not-allowed"
            : dragging
              ? "border-blue-500 cursor-pointer"
              : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={provider === "btp" ? ".xlsx" : ".pdf"}
          className="hidden"
          disabled={allowedProviders.length === 0}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {uploading ? (
          <>
            <RefreshCw className="w-7 h-7 text-blue-500 animate-spin mb-3" />
            <p className="text-sm font-semibold text-gray-500">
              Parsing invoice…
            </p>
            <p className="text-xs text-gray-400 mt-1">
              This may take a few seconds
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 flex items-center justify-center mb-3">
              <CloudUpload className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Drop your invoice here
            </p>
            <p className="text-xs text-gray-400 mt-1">
              or{" "}
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                browse to upload
              </span>
            </p>
            <div className="flex items-center gap-2 mt-3">
              {provider === "btp" ? (
                <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium px-2.5 py-1 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <FileText className="w-3 h-3" />
                  XLSX
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium px-2.5 py-1 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <FileText className="w-3 h-3" />
                  PDF
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {success && (
        <div className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
};

/* ── Upload modal ────────────────────────────────────────── */

const UploadModal = ({ onClose, onUploaded }) => {
  const handleUploaded = () => {
    onUploaded();
    setTimeout(onClose, 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col"
        style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.2)", maxHeight: "90vh" }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center">
              <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Upload Invoice
              </p>
              <p className="text-[11px] text-gray-400 font-medium">
                PDF or XLSX — Azure/AWS/BTP/GCP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto">
          <UploadZone onUploaded={handleUploaded} />
        </div>
      </div>
    </div>
  );
};

/* ── Invoice detail panel ────────────────────────────────── */

const CustomTooltip = ({ active, payload, total }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-lg">
      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
        {payload[0].name}
      </p>
      <p
        className="text-sm font-bold"
        style={{ color: payload[0].payload.fill }}
      >
        {formatCurrency(payload[0].value)}
      </p>
      <p className="text-[10px] text-gray-400">
        {((payload[0].value / total) * 100).toFixed(1)}% of total
      </p>
    </div>
  );
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  total: PropTypes.number.isRequired,
};

const InvoiceDetail = ({ detail, onDelete, onClose, deleting }) => {
  const meta = detail.raw_summary ?? {};
  const services = detail.services ?? [];
  const sections = meta.sections ?? [];
  const BTP_COLORS = [
    "#0070F2",
    "#107E3E",
    "#F0AB00",
    "#E9730C",
    "#5C96EB",
    "#6A6D70",
  ];
  const COLORS =
    detail.provider === "aws"
      ? AWS_COLORS
      : detail.provider === "btp"
        ? BTP_COLORS
        : AZURE_COLORS;
  const total = parseFloat(detail.total_cost);
  const charges = meta.charges ? parseFloat(meta.charges) : 0;
  const tax = meta.taxAmount ? parseFloat(meta.taxAmount) : 0;
  const maxSvc = services[0]?.cost || 1;
  const top8 = services.slice(0, 8);
  // Currency-aware formatter — uses the invoice's own currency (EUR, USD, etc.)
  const cur = detail.currency || "USD";
  const fmt = (v) => formatCurrency(v, cur);

  return (
    <div className="space-y-5">
      {/* ── Invoice header ── */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {detail.provider === "azure" ? (
                <span className="badge border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400">
                  AZURE
                </span>
              ) : detail.provider === "btp" ? (
                <span className="badge border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400">
                  SAP BTP
                </span>
              ) : detail.provider === "gcp" ? (
                <span className="badge border border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-400">
                  GCP
                </span>
              ) : (
                <span className="badge border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400">
                  AWS
                </span>
              )}
              {meta.invoiceNumber && (
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 font-mono">
                  #{meta.invoiceNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 font-medium truncate">
              {detail.file_name}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onDelete(detail.id)}
              disabled={deleting === detail.id}
              className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:border hover:border-red-200 dark:hover:border-red-800 transition-all"
              title="Delete invoice"
            >
              {deleting === detail.id ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Meta chips */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {meta.billingProfile && (
              <MetaChip
                icon={Tag}
                label="Profile"
                value={meta.billingProfile}
                accent={
                  detail.provider === "aws"
                    ? "orange"
                    : detail.provider === "btp"
                      ? "emerald"
                      : "blue"
                }
              />
            )}
            {meta.poNumber && (
              <MetaChip
                icon={Receipt}
                label="PO"
                value={meta.poNumber}
                accent="gray"
              />
            )}
            {(meta.billingPeriodStart || meta.billingPeriodEnd) && (
              <MetaChip
                icon={Calendar}
                label="Period"
                value={`${fmtDate(meta.billingPeriodStart)} – ${fmtDate(meta.billingPeriodEnd)}`}
                accent="green"
              />
            )}
            {meta.invoiceDate && (
              <MetaChip
                icon={FileText}
                label="Invoice Date"
                value={fmtDate(meta.invoiceDate)}
                accent="gray"
              />
            )}
            {meta.dueDate && (
              <MetaChip
                icon={CreditCard}
                label="Due"
                value={fmtDate(meta.dueDate)}
                accent="orange"
              />
            )}
          </div>

          {/* Billing KPIs */}
          <div
            className={`grid gap-2 mt-3 ${detail.provider === "azure" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"}`}
          >
            <KpiTile
              label="Total Amount"
              value={fmt(total)}
              sub={detail.currency}
              accent="blue"
              large
            />
            <KpiTile
              label="Pre-tax Charges"
              value={charges > 0 ? fmt(charges) : fmt(total - tax)}
              accent="gray"
            />
            <KpiTile
              label={`Sales Tax${meta.taxRate ? ` (${meta.taxRate}%)` : ""}`}
              value={tax > 0 ? fmt(tax) : "—"}
              accent={tax > 0 ? "red" : "gray"}
            />
            {detail.provider === "azure" && meta.totalSavings > 0 && (
              <div className="rounded-xl border border-emerald-100 dark:border-emerald-900 p-4">
                <div className="flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <p className="text-[10px] font-bold  tracking-wider text-emerald-600 dark:text-emerald-400">
                    CSP Savings
                  </p>
                </div>
                <p
                  className={`font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-tight break-all ${String(fmt(meta.totalSavings)).length > 13 ? "text-sm" : String(fmt(meta.totalSavings)).length > 10 ? "text-base" : "text-lg"}`}
                >
                  {fmt(meta.totalSavings)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                  Maitsys CSP
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ════════════════════════════════════════════════
          SAP BTP — RICH DETAIL SECTIONS
          ════════════════════════════════════════════════ */}
      {detail.provider === "btp" &&
        (() => {
          const ai = meta.accountInfo ?? {};
          const gac = meta.globalAccountCosts ?? [];
          const subs = meta.subaccountCosts ?? [];
          const usg = meta.actualUsage ?? [];
          const gacTotal = gac.reduce((s, r) => s + r.cost, 0);
          const subTotal = subs.reduce((s, r) => s + r.totalCost, 0);
          const maxGac = gac[0]?.cost || 1;
          const maxSub = subs[0]?.totalCost || 1;

          return (
            <>
              {/* ── 1. Account Overview ── */}
              {Object.keys(ai).length > 0 && (
                <Card>
                  <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 flex items-center justify-center">
                        <Info className="w-3.5 h-3.5 text-emerald-600" />
                      </span>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        SAP BTP Global Account
                      </h3>
                      {ai.globalAccountName && (
                        <span className="ml-auto text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded-full">
                          {ai.globalAccountName}
                        </span>
                      )}
                    </div>
                    {/* Summary stat row */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        {
                          label: "Directories",
                          value: ai.numDirectories,
                          icon: "📁",
                          tip: "Folders that group subaccounts together",
                        },
                        {
                          label: "Subaccounts",
                          value: ai.numSubaccounts,
                          icon: "🖥️",
                          tip: "Individual environments (Dev / Test / Prod)",
                        },
                        {
                          label: "Regions",
                          value: ai.numRegions,
                          icon: "🌍",
                          tip: "Data-centre locations in use",
                        },
                      ]
                        .filter((r) => r.value)
                        .map((r, i) => (
                          <div
                            key={i}
                            className="rounded-xl border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-center"
                            title={r.tip}
                          >
                            <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                              {r.icon} {r.value}
                            </p>
                            <p className="text-[10px] text-gray-500 font-semibold">
                              {r.label}
                            </p>
                          </div>
                        ))}
                    </div>
                    {/* Detail chips */}
                    <div className="flex flex-wrap gap-2">
                      {ai.accountType && (
                        <span className="text-[10px] font-bold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-lg">
                          Type: {ai.accountType}
                        </span>
                      )}
                      {ai.contractStart && (
                        <span className="text-[10px] font-bold border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg">
                          Contract: {ai.contractStart} → {ai.plannedContractEnd}
                        </span>
                      )}
                      {ai.accountId && (
                        <span className="text-[10px] font-mono border border-gray-200 dark:border-gray-700 text-gray-500 px-2 py-1 rounded-lg">
                          ID: {ai.accountId.slice(0, 20)}…
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* ── 2. Cost Split: Global vs Subaccount ── */}
              {(gacTotal > 0 || subTotal > 0) && (
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <p className="text-[10px] font-bold text-gray-400 tracking-wide ">
                        Global Account
                      </p>
                    </div>
                    <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums">
                      {fmt(gacTotal)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {gac.length} services charged
                    </p>
                    <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{
                          width: `${total > 0 ? (gacTotal / total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <p className="text-[10px] font-bold text-gray-400 tracking-wide ">
                        Subaccounts
                      </p>
                    </div>
                    <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums">
                      {fmt(subTotal)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {subs.length} subaccounts
                    </p>
                    <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{
                          width: `${total > 0 ? (subTotal / total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </Card>
                </div>
              )}

              {/* ── Maitsys CSP Savings ── */}
              {(gacTotal > 0 || subTotal > 0) &&
                (() => {
                  const BTP_CSP_RATE = 0.02;
                  const rows =
                    gac.length > 0
                      ? gac.map((r) => ({ name: r.name, cost: r.cost }))
                      : subs.map((r) => ({
                          name: r.subaccountName || r.name || "Subaccount",
                          cost: r.totalCost,
                        }));
                  const sourceTotal = gac.length > 0 ? gacTotal : subTotal;
                  const totalSavingsAmt = sourceTotal * BTP_CSP_RATE;

                  return (
                    <Card>
                      {/* Header */}
                      <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 flex items-center justify-center">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            </span>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                              Maitsys CSP Savings
                            </h3>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                              -{fmt(totalSavingsAmt)}
                            </p>
                            <p className="text-[10px] text-gray-400 font-semibold">
                              2% MSP discount
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                            style={{ width: "2%" }}
                          />
                        </div>
                      </div>

                      {/* Service rows */}
                      <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        {rows.slice(0, 10).map((r, i) => {
                          const sharePct =
                            sourceTotal > 0
                              ? ((r.cost / sourceTotal) * 100).toFixed(1)
                              : "0";
                          const savings = r.cost * BTP_CSP_RATE;
                          return (
                            <div
                              key={i}
                              className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                            >
                              <span className="text-[10px] font-bold text-gray-400 w-10 shrink-0 tabular-nums">
                                {sharePct}%
                              </span>
                              <p className="flex-1 text-xs font-semibold text-gray-800 dark:text-gray-200 truncate min-w-0">
                                {r.name}
                              </p>
                              <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums shrink-0">
                                {fmt(r.cost)}
                              </span>
                              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0 w-24 text-right">
                                -{fmt(savings)}
                              </span>
                            </div>
                          );
                        })}
                        {rows.length > 10 && (
                          <div className="px-5 py-2 text-[10px] text-gray-400 text-center">
                            +{rows.length - 10} more services
                          </div>
                        )}
                      </div>

                      {/* Total footer */}
                      <div className="flex items-center justify-between px-5 py-3 border-t border-emerald-200 dark:border-emerald-800 rounded-b-2xl">
                        <div>
                          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            Total CSP Savings
                          </p>
                          <p className="text-[10px] text-gray-400">
                            2% applied to {fmt(sourceTotal)} invoice total
                          </p>
                        </div>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                          -{fmt(totalSavingsAmt)}
                        </span>
                      </div>
                    </Card>
                  );
                })()}

              {/* ── 3. Global Account — Service Breakdown ── */}
              {gac.length > 0 && (
                <Card>
                  <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center">
                      <Receipt className="w-3.5 h-3.5 text-amber-600" />
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Global Account — Service Costs
                    </h3>
                    <span className="ml-auto text-xs font-bold text-amber-600 dark:text-amber-400">
                      {fmt(gacTotal)}
                    </span>
                  </div>
                  {/* Pie + bar charts side by side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-800">
                    {/* Donut */}
                    <div className="p-4">
                      <p className="text-[10px] font-bold text-gray-400 tracking-wide mb-2">
                        Cost Distribution
                      </p>
                      <div className="h-48 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={gac.slice(0, 8).map((r, i) => ({
                                name: r.name,
                                value: r.cost,
                                fill: BTP_COLORS[i % BTP_COLORS.length],
                              }))}
                              cx="50%"
                              cy="50%"
                              innerRadius={46}
                              outerRadius={74}
                              paddingAngle={2}
                              dataKey="value"
                              nameKey="name"
                              stroke="none"
                            >
                              {gac.slice(0, 8).map((_, i) => (
                                <Cell
                                  key={i}
                                  fill={BTP_COLORS[i % BTP_COLORS.length]}
                                  cornerRadius={3}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(v) => [fmt(v), "Cost"]}
                              contentStyle={{
                                borderRadius: "10px",
                                fontSize: "11px",
                                fontWeight: "600",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <p className="text-[10px] text-gray-400">
                            {gac.length} services
                          </p>
                          <p className="text-sm font-black text-gray-900 dark:text-white">
                            {fmt(gacTotal)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        {gac.slice(0, 8).map((r, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  BTP_COLORS[i % BTP_COLORS.length],
                              }}
                            />
                            <span className="text-[10px] text-gray-500 truncate max-w-[80px]">
                              {r.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Horizontal bar chart */}
                    <div className="p-4">
                      <p className="text-[10px] font-bold text-gray-400 tracking-wide mb-2">
                        Top Services by Cost
                      </p>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={gac.slice(0, 8)}
                            layout="vertical"
                            margin={{ top: 0, right: 80, left: 0, bottom: 0 }}
                          >
                            <XAxis
                              type="number"
                              stroke="#94a3b8"
                              fontSize={9}
                              tickFormatter={(v) =>
                                `${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`
                              }
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              stroke="#94a3b8"
                              fontSize={9}
                              width={80}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v) =>
                                v.length > 12 ? v.slice(0, 12) + "…" : v
                              }
                            />
                            <Tooltip
                              formatter={(v) => [fmt(v), "Cost"]}
                              contentStyle={{
                                borderRadius: "10px",
                                fontSize: "11px",
                                fontWeight: "600",
                              }}
                            />
                            <Bar
                              dataKey="cost"
                              radius={[0, 4, 4, 0]}
                              animationDuration={600}
                            >
                              {gac.slice(0, 8).map((_, i) => (
                                <Cell
                                  key={i}
                                  fill={BTP_COLORS[i % BTP_COLORS.length]}
                                />
                              ))}
                              <LabelList
                                dataKey="cost"
                                position="right"
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  fill: "#64748b",
                                }}
                                formatter={(v) => fmt(v)}
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  {/* Ranked progress bars */}
                  <div className="px-5 pb-4 space-y-2.5">
                    <p className="text-[10px] font-bold text-gray-400 tracking-wide pt-2">
                      All Services — Ranked by Cost
                    </p>
                    {gac.map((r, i) => {
                      const barPct = Math.round((r.cost / maxGac) * 100);
                      const sharePct =
                        gacTotal > 0
                          ? ((r.cost / gacTotal) * 100).toFixed(1)
                          : "0";
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-4 text-[10px] font-bold text-gray-400 shrink-0 text-right">
                                {i + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                                  {r.name}
                                </p>
                                {r.planName && (
                                  <p className="text-[10px] text-gray-400 truncate">
                                    Plan: {r.planName}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className="text-[10px] text-gray-400">
                                {sharePct}%
                              </span>
                              <span className="text-xs font-black text-gray-900 dark:text-white tabular-nums">
                                {fmt(r.cost)}
                              </span>
                              {r.usage > 0 && (
                                <span className="text-[10px] text-gray-400 hidden sm:inline">
                                  Usage: {r.usage.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${barPct}%`,
                                backgroundColor:
                                  BTP_COLORS[i % BTP_COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* ── 4. Subaccount Cost Breakdown (each expanded) ── */}
              {subs.length > 0 && (
                <Card>
                  <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Subaccount Cost Breakdown
                    </h3>
                    <span className="ml-auto text-xs font-bold text-blue-600 dark:text-blue-400">
                      {subs.length} subaccounts · {fmt(subTotal)}
                    </span>
                  </div>

                  {/* Stacked bar showing all subaccounts proportion */}
                  <div className="px-5 py-3 border-b border-gray-50 dark:border-gray-800">
                    <p className="text-[10px] font-bold text-gray-400 tracking-wide mb-2">
                      Spend Distribution Across Subaccounts
                    </p>
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                      {subs.map((s, i) => {
                        const w =
                          subTotal > 0 ? (s.totalCost / subTotal) * 100 : 0;
                        return w > 0.5 ? (
                          <div
                            key={i}
                            className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                            title={`${s.name}: ${fmt(s.totalCost)}`}
                            style={{
                              width: `${w}%`,
                              backgroundColor:
                                BTP_COLORS[i % BTP_COLORS.length],
                            }}
                          />
                        ) : null;
                      })}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                      {subs.map((s, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                BTP_COLORS[i % BTP_COLORS.length],
                            }}
                          />
                          <span className="text-[10px] text-gray-500 truncate max-w-[100px]">
                            {s.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Each subaccount expanded */}
                  <div className="px-4 py-3 space-y-2">
                    {subs.map((sub, i) => {
                      const subPct =
                        total > 0
                          ? ((sub.totalCost / total) * 100).toFixed(1)
                          : "0";
                      const subBarPct = Math.round(
                        (sub.totalCost / maxSub) * 100,
                      );
                      const maxSvcCost = sub.services?.[0]?.cost || 1;
                      const barColor = BTP_COLORS[i % BTP_COLORS.length];
                      return (
                        <div
                          key={i}
                          className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                        >
                          {/* Subaccount header */}
                          <div className="px-4 py-3 flex items-center justify-between gap-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 shrink-0">
                                {sub.name.slice(0, 2).toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {sub.name}
                                </p>
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                                  {sub.directory && (
                                    <span className="text-[10px] text-gray-400">
                                      {sub.directory}
                                    </span>
                                  )}
                                  {sub.dataCenter && (
                                    <span className="text-[10px] text-gray-400">
                                      {sub.dataCenter}
                                    </span>
                                  )}
                                  {sub.id && (
                                    <span className="text-[10px] font-mono text-gray-300 dark:text-gray-600">
                                      {sub.id.slice(0, 16)}…
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                                {fmt(sub.totalCost)}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {subPct}% of total
                              </p>
                            </div>
                          </div>
                          {/* Progress bar — colored fill only */}
                          <div className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${subBarPct}%`,
                                    backgroundColor: barColor,
                                  }}
                                />
                              </div>
                              <span className="text-[10px] text-gray-400 shrink-0 w-8 text-right">
                                {subBarPct}%
                              </span>
                            </div>
                          </div>
                          {/* Service breakdown inside this subaccount */}
                          {sub.services?.length > 0 && (
                            <div className="px-4 pb-3 space-y-1.5">
                              {sub.services.map((svc, j) => {
                                const svcPct = Math.round(
                                  (svc.cost / maxSvcCost) * 100,
                                );
                                const svcShare =
                                  sub.totalCost > 0
                                    ? (
                                        (svc.cost / sub.totalCost) *
                                        100
                                      ).toFixed(1)
                                    : "0";
                                return (
                                  <div key={j}>
                                    <div className="flex items-center justify-between mb-0.5">
                                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                        {svc.name}
                                      </span>
                                      <div className="flex items-center gap-2 shrink-0 ml-2">
                                        <span className="text-[10px] text-gray-400">
                                          {svcShare}%
                                        </span>
                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
                                          {fmt(svc.cost)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                          width: `${svcPct}%`,
                                          backgroundColor: barColor,
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* ── 5. Actual Usage by Service ── */}
              {usg.length > 0 && (
                <Card>
                  <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center">
                      <Tag className="w-3.5 h-3.5 text-purple-600" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        Actual Usage by Service
                      </h3>
                      <p className="text-[10px] text-gray-400">
                        How much of each service was actually consumed (not just
                        billed)
                      </p>
                    </div>
                  </div>
                  {/* Usage bar chart */}
                  {usg.some((r) => r.totalUsage > 0) && (
                    <div className="px-4 pt-4 pb-2">
                      <p className="text-[10px] font-bold text-gray-400 tracking-wide mb-2">
                        Top Services by Consumption
                      </p>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={usg
                              .filter((r) => r.totalUsage > 0)
                              .slice(0, 10)}
                            layout="vertical"
                            margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
                          >
                            <XAxis
                              type="number"
                              stroke="#94a3b8"
                              fontSize={9}
                              tickFormatter={(v) =>
                                v >= 1000 ? (v / 1000).toFixed(0) + "k" : v
                              }
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              type="category"
                              dataKey="serviceName"
                              stroke="#94a3b8"
                              fontSize={9}
                              width={90}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v) =>
                                v.length > 13 ? v.slice(0, 13) + "…" : v
                              }
                            />
                            <Tooltip
                              formatter={(v, _, p) => [
                                `${v.toLocaleString()} ${p.payload.unit || "units"}`,
                                "Usage",
                              ]}
                              contentStyle={{
                                borderRadius: "10px",
                                fontSize: "11px",
                                fontWeight: "600",
                              }}
                            />
                            <Bar
                              dataKey="totalUsage"
                              radius={[0, 4, 4, 0]}
                              animationDuration={600}
                            >
                              {usg.slice(0, 10).map((_, i) => (
                                <Cell
                                  key={i}
                                  fill={BTP_COLORS[i % BTP_COLORS.length]}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  {/* Usage detail table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800">
                          <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                            #
                          </th>
                          <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                            Service
                          </th>
                          <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                            Plan
                          </th>
                          <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                            Metric
                          </th>
                          <th className="px-4 py-2 text-right text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                            Usage
                          </th>
                          <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                            Unit
                          </th>
                          <th className="px-4 py-2 text-center text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                            Subaccounts
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {usg.map((r, i) => (
                          <tr
                            key={i}
                            className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                          >
                            <td className="px-4 py-2 text-[10px] font-bold text-gray-400">
                              {i + 1}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{
                                    backgroundColor:
                                      BTP_COLORS[i % BTP_COLORS.length],
                                  }}
                                />
                                <span className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[140px]">
                                  {r.serviceName}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-gray-500 max-w-[110px] truncate">
                              {r.planName || "—"}
                            </td>
                            <td className="px-4 py-2 text-gray-500 max-w-[110px] truncate">
                              {r.metric || "—"}
                            </td>
                            <td className="px-4 py-2 text-right font-bold text-gray-900 dark:text-white tabular-nums">
                              {r.totalUsage > 0
                                ? r.totalUsage.toLocaleString()
                                : "—"}
                            </td>
                            <td className="px-4 py-2 text-gray-500">
                              {r.unit || "—"}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                {r.subaccountCount}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          );
        })()}

      {/* ── Section summary ── */}
      {sections.length > 0 && (
        <Card>
          <div className="px-5 pt-4 pb-2 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
            <Layers className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold text-gray-900 dark:text-white  tracking-wide">
              Section Breakdown
            </h3>
          </div>
          <div className="px-5 py-3 space-y-2">
            {sections.map((sec, i) => {
              const pct = total > 0 ? (sec.total / total) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                      {sec.name}
                    </span>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="text-[10px] text-gray-400 font-medium">
                        Tax: {fmt(sec.tax)}
                      </span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">
                        {fmt(sec.total)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: AZURE_COLORS[i % AZURE_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Maitsys CSP Savings (AWS & Azure) ── */}
      {detail.provider !== "btp" &&
        services.length > 0 &&
        (() => {
          const CSP_RATE =
            detail.provider === "aws" || detail.provider === "gcp"
              ? 0.035
              : 0.07;
          const totalSavingsAmt = services.reduce((s, svc) => {
            const sav =
              detail.provider === "azure" && svc.savings > 0
                ? svc.savings
                : svc.cost * CSP_RATE;
            return s + sav;
          }, 0);
          const rateLabel =
            detail.provider === "aws" || detail.provider === "gcp"
              ? "3.5%"
              : "7%";

          return (
            <Card>
              {/* Header */}
              <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Maitsys CSP Savings
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      -{fmt(totalSavingsAmt)}
                    </p>
                    <p className="text-[10px] text-gray-400 font-semibold">
                      {rateLabel} MSP discount
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${detail.provider === "aws" ? "bg-orange-400" : detail.provider === "gcp" ? "bg-blue-400" : "bg-blue-400"}`}
                    style={{ width: `${CSP_RATE * 100}%` }}
                  />
                </div>
              </div>
              {/* Service rows */}
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {services.slice(0, 10).map((svc, i) => {
                  const sharePct =
                    total > 0 ? ((svc.cost / total) * 100).toFixed(1) : "0";
                  const savings =
                    detail.provider === "azure" && svc.savings > 0
                      ? svc.savings
                      : svc.cost * CSP_RATE;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <span className="text-[10px] font-bold text-gray-400 w-10 shrink-0 tabular-nums">
                        {sharePct}%
                      </span>
                      <p className="flex-1 text-xs font-semibold text-gray-800 dark:text-gray-200 truncate min-w-0">
                        {svc.name}
                      </p>
                      <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums shrink-0">
                        {fmt(svc.cost)}
                      </span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0 w-24 text-right">
                        -{fmt(savings)}
                      </span>
                    </div>
                  );
                })}
                {services.length > 10 && (
                  <div className="px-5 py-2 text-[10px] text-gray-400 text-center">
                    +{services.length - 10} more services
                  </div>
                )}
              </div>
              {/* Total footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-emerald-200 dark:border-emerald-800 rounded-b-2xl">
                <div>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    Total CSP Savings
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {rateLabel} applied to {fmt(total)} invoice total
                  </p>
                </div>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  -{fmt(totalSavingsAmt)}
                </span>
              </div>
            </Card>
          );
        })()}

      {/* ── Service charts (hidden for BTP — rich sections above cover this) ── */}
      {detail.provider !== "btp" && services.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Donut chart */}
            <Card className="p-4">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300  tracking-wide mb-3">
                Cost Distribution
              </p>
              <div className="h-56 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={top8.map((s, i) => ({
                        ...s,
                        fill: COLORS[i % COLORS.length],
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="cost"
                      nameKey="name"
                      stroke="none"
                    >
                      {top8.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                          cornerRadius={4}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] text-gray-400 font-semibold">
                    {services.length} services
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {fmt(total)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {top8.map((s, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[80px]">
                      {s.name}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Horizontal bar chart */}
            <Card className="p-4">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300  tracking-wide mb-3">
                Service Spend
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={top8}
                    layout="vertical"
                    margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      type="number"
                      stroke="#94a3b8"
                      fontSize={9}
                      fontWeight="600"
                      tickFormatter={(v) =>
                        fmt(
                          v >= 1000 ? Math.round(v / 1000) * 1000 : v,
                        ).replace(/\.00$/, "")
                      }
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={9}
                      fontWeight="600"
                      width={90}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) =>
                        v.length > 14 ? v.slice(0, 14) + "…" : v
                      }
                    />
                    <Tooltip
                      formatter={(v) => [fmt(v), "Cost"]}
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        fontSize: "11px",
                        fontWeight: "600",
                      }}
                    />
                    <Bar
                      dataKey="cost"
                      radius={[0, 4, 4, 0]}
                      animationDuration={700}
                    >
                      {top8.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Ranked services */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300  tracking-wide">
                All Services — Cost Ranking
              </p>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-3 h-3" />
                Maitsys CSP Savings
              </div>
            </div>
            <div className="space-y-3">
              {services.map((svc, i) => {
                const pct = Math.round((svc.cost / maxSvc) * 100);
                const share = ((svc.cost / total) * 100).toFixed(1);
                const cspRate =
                  detail.provider === "aws" || detail.provider === "gcp"
                    ? 0.035
                    : 0.07;
                const savingsAmt =
                  detail.provider === "azure" && svc.savings > 0
                    ? svc.savings
                    : svc.cost * cspRate;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-5 text-center text-[10px] font-bold text-gray-400 shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                          {svc.name}
                        </span>
                        <div className="flex items-center gap-2 ml-2 shrink-0">
                          <span className="text-[10px] text-gray-400">
                            {share}%
                          </span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">
                            {fmt(svc.cost)}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            -{fmt(savingsAmt)}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: COLORS[i % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      ) : detail.provider !== "btp" ? (
        <Card className="p-8 text-center">
          <Info className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-400">
            Service breakdown not extracted
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Re-upload the PDF — service parsing requires text-based PDFs.
          </p>
        </Card>
      ) : null}
    </div>
  );
};

/* ── Main page ───────────────────────────────────────────── */

const PAGE_SIZE = 10;

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]); // current page
  const [allInvoices, setAllInvoices] = useState([]); // all records — for KPI totals
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [deleting, setDeleting] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  const fetchPage = async (pg, prov) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pg),
        pageSize: String(PAGE_SIZE),
      });
      if (prov !== "all") params.set("provider", prov);
      const res = await api.get(`/invoices?${params}`);
      setInvoices(res.data.data ?? []);
      setTotalPages(res.data.totalPages ?? 1);
      setTotalCount(res.data.total ?? 0);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  const fetchAll = async () => {
    try {
      const res = await api.get("/invoices?page=1&pageSize=500");
      setAllInvoices(res.data.data ?? []);
    } catch {
      /* silent */
    }
  };

  const refreshAll = () => {
    fetchAll();
    fetchPage(page, filter);
  };

  useEffect(() => {
    api
      .get("/invoices?page=1&pageSize=500")
      .then((res) => setAllInvoices(res.data.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (filter !== "all") params.set("provider", filter);
    api
      .get(`/invoices?${params}`)
      .then((res) => {
        setInvoices(res.data.data ?? []);
        setTotalPages(res.data.totalPages ?? 1);
        setTotalCount(res.data.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, filter]);

  const changeFilter = (f) => {
    setFilter(f);
    setPage(1);
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: "Delete Invoice?",
      message: "This invoice record will be permanently removed.",
      confirmLabel: "Delete",
      variant: "delete",
    });
    if (!ok) return;
    setDeleting(id);
    try {
      await api.delete(`/invoices/${id}`);
      if (selected === id) setSelected(null);
      fetchAll();
      // stay on current page but refresh; if page is now empty, go back one
      const newCount = totalCount - 1;
      const newMaxPage = Math.max(1, Math.ceil(newCount / PAGE_SIZE));
      const targetPage = Math.min(page, newMaxPage);
      if (targetPage === page) fetchPage(page, filter);
      else setPage(targetPage);
    } catch {
      /* silent */
    } finally {
      setDeleting(null);
    }
  };

  // KPI totals from all records
  const totalSpend = allInvoices.reduce(
    (s, i) => s + parseFloat(i.total_cost || 0),
    0,
  );
  const awsCount = allInvoices.filter((i) => i.provider === "aws").length;
  const azureCount = allInvoices.filter((i) => i.provider === "azure").length;
  const btpCount = allInvoices.filter((i) => i.provider === "btp").length;
  const gcpCount = allInvoices.filter((i) => i.provider === "gcp").length;
  const latestInv = allInvoices[0];

  const detail = invoices.find((i) => i.id === selected);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 bg-mesh-light dark:bg-mesh-dark transition-colors duration-300 pb-20">
      {/* ── Upload modal overlay ── */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={refreshAll}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-bold tracking-widesttext-blue-600 dark:text-blue-400">
                Invoice Intelligence
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Cloud Invoices
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Upload Azure, AWS, SAP BTP & GCP invoices · instant visual
              breakdown
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={refreshAll}
              disabled={loading}
              className="btn-secondary"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:border-blue-500 text-sm font-bold transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Invoice</span>
            </button>
          </div>
        </div>

        {/* ── KPI row — single responsive strip ── */}
        <div className="grid grid-cols-6 gap-3">
          {[
            {
              label: "Total Invoices",
              val: totalCount,
              sub: "all providers",
              icon: <FileText className="w-4 h-4" />,
              iconBg: "border-gray-200 dark:border-gray-700",
              iconColor: "text-gray-500 dark:text-gray-400",
              bar: "bg-gray-400",
            },
            {
              label: "Azure",
              val: azureCount,
              sub: "Microsoft Azure",
              icon: <AzureIcon className="w-4 h-4" />,
              iconBg: "border-blue-200 dark:border-blue-800",
              iconColor: "text-blue-600",
              bar: "bg-blue-500",
            },
            {
              label: "AWS",
              val: awsCount,
              sub: "Amazon Web Services",
              icon: <AwsIcon className="w-5 h-3" />,
              iconBg: "border-orange-200 dark:border-orange-800",
              iconColor: "text-orange-500",
              bar: "bg-orange-500",
            },
            {
              label: "SAP BTP",
              val: btpCount,
              sub: "Business Technology Platform",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                  fill="currentColor"
                >
                  <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L20 8.5v7L12 19.82 4 15.5v-7l8-4.32zM8 10v4h2v-4H8zm3 0v4h2v-4h-2zm3 0v4h2v-4h-2z" />
                </svg>
              ),
              iconBg: "border-emerald-200 dark:border-emerald-800",
              iconColor: "text-emerald-600",
              bar: "bg-emerald-500",
            },
            {
              label: "Google Cloud",
              val: gcpCount,
              sub: "GCP Projects",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                  <path
                    d="M17.6 11.8c0-.1 0-.2-.1-.3l-2.1-3.6c-.1-.2-.3-.3-.5-.3H9.1c-.2 0-.4.1-.5.3L6.5 11.5c-.1.1-.1.2-.1.3s0 .2.1.3l2.1 3.6c.1.2.3.3.5.3h5.8c.2 0 .4-.1.5-.3l2.1-3.6c.1-.1.1-.2.1-.3z"
                    fill="#3b82f6"
                  />
                  <circle cx="12" cy="12" r="2.2" fill="white" />
                  <circle cx="12" cy="12" r="1" fill="#3b82f6" />
                </svg>
              ),
              iconBg: "border-blue-200 dark:border-blue-800",
              iconColor: "text-blue-500",
              bar: "bg-blue-500",
            },
            {
              label: "Total Spend",
              val: formatCurrency(totalSpend),
              sub: latestInv
                ? `Latest: ${monthLabel(latestInv.month, latestInv.year)}`
                : "across all invoices",
              icon: <BarChart2 className="w-4 h-4" />,
              iconBg: "border-violet-200 dark:border-violet-800",
              iconColor: "text-violet-600",
              bar: "bg-violet-500",
              highlight: true,
            },
          ].map((s, i) => (
            <div
              key={i}
              className={`relative flex flex-col px-4 py-3.5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 overflow-hidden
                ${
                  s.highlight
                    ? "border-violet-200 dark:border-violet-800 bg-white dark:bg-gray-900"
                    : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
                }`}
              style={{
                boxShadow:
                  "0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)",
              }}
            >
              {/* Icon + label row */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <div
                  className={`w-4 h-4 flex items-center justify-center shrink-0 ${s.iconColor}`}
                >
                  {s.icon}
                </div>
                <p className="text-[10px] font-bold tracking-wider text-gray-400 truncate">
                  {s.label}
                </p>
              </div>
              {/* Value */}
              <p
                className={`text-lg font-black tabular-nums leading-tight truncate ${s.highlight ? "text-violet-700 dark:text-violet-400" : "text-gray-900 dark:text-white"}`}
              >
                {s.val}
              </p>
              <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── Invoice list + detail (dual-scroll split pane) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* ── Left: sticky list with internal scroll ── */}
          <div
            className="lg:col-span-2 lg:sticky lg:top-6 flex flex-col"
            style={{ maxHeight: "calc(100vh - 120px)" }}
          >
            {/* Panel header — never scrolls */}
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h2 className="text-xs font-bold text-gray-700 dark:text-gray-300  tracking-wide flex items-center gap-2">
                Invoice Records
                <span className="badge badge-gray">{totalCount}</span>
              </h2>
              <div className="flex items-center border border-gray-200 dark:border-gray-700 p-1 rounded-xl">
                {["all", "aws", "azure", "btp", "gcp"].map((f) => (
                  <button
                    key={f}
                    onClick={() => changeFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all duration-300 ${
                      filter === f
                        ? f === "aws"
                          ? "border border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400"
                          : f === "azure"
                            ? "border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400"
                            : f === "btp"
                              ? "border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400"
                              : f === "gcp"
                                ? "border border-blue-300 dark:border-blue-700 text-blue-500 dark:text-blue-400"
                                : "border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                        : "border border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    {f === "all"
                      ? "All"
                      : f === "btp"
                        ? "BTP"
                        : f === "gcp"
                          ? "GCP"
                          : f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable list body */}
            <div
              className="flex-1 overflow-y-auto space-y-3 pr-1"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#cbd5e1 transparent",
              }}
            >
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="skeleton rounded-2xl h-24" />
                ))
              ) : invoices.length === 0 ? (
                <Card className="py-16 text-center">
                  <FileText className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-400">
                    No invoices yet
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Click{" "}
                    <button
                      onClick={() => setShowUpload(true)}
                      className="font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors"
                    >
                      Upload Invoice
                    </button>{" "}
                    to get started
                  </p>
                </Card>
              ) : (
                invoices.map((inv, idx) => {
                  const prev = invoices[idx + 1];
                  const delta = prev
                    ? momDelta(
                        parseFloat(inv.total_cost),
                        parseFloat(prev.total_cost),
                      )
                    : null;
                  const isActive = selected === inv.id;
                  const meta = inv.raw_summary ?? {};

                  return (
                    <button
                      key={inv.id}
                      onClick={() => setSelected(isActive ? null : inv.id)}
                      className={`group w-full text-left rounded-2xl border transition-all duration-300 overflow-hidden relative ${
                        isActive
                          ? inv.provider === "aws"
                            ? "border-orange-400 bg-orange-50/50 dark:bg-orange-950/20 ring-2 ring-orange-500/20"
                            : inv.provider === "btp"
                              ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20"
                              : inv.provider === "gcp"
                                ? "border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20"
                                : "border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20"
                          : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg hover:-translate-y-0.5"
                      }`}
                      style={{
                        boxShadow: isActive
                          ? "0 10px 30px -10px rgba(0,0,0,0.1)"
                          : undefined,
                      }}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-10 h-10 flex items-center justify-center shrink-0 mt-0.5">
                              {inv.provider === "aws" ? (
                                <AwsIcon className="w-7 h-3.5" />
                              ) : inv.provider === "btp" ? (
                                <svg
                                  viewBox="0 0 24 24"
                                  className="w-5 h-5 text-emerald-600"
                                  fill="currentColor"
                                >
                                  <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L20 8.5v7L12 19.82 4 15.5v-7l8-4.32zM8 10v4h2v-4H8zm3 0v4h2v-4h-2zm3 0v4h2v-4h-2z" />
                                </svg>
                              ) : inv.provider === "gcp" ? (
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  className="w-5 h-5"
                                >
                                  <path
                                    d="M17.6 11.8c0-.1 0-.2-.1-.3l-2.1-3.6c-.1-.2-.3-.3-.5-.3H9.1c-.2 0-.4.1-.5.3L6.5 11.5c-.1.1-.1.2-.1.3s0 .2.1.3l2.1 3.6c.1.2.3.3.5.3h5.8c.2 0 .4-.1.5-.3l2.1-3.6c.1-.1.1-.2.1-.3z"
                                    fill="#3b82f6"
                                  />
                                  <circle
                                    cx="12"
                                    cy="12"
                                    r="2.2"
                                    fill="white"
                                  />
                                  <circle
                                    cx="12"
                                    cy="12"
                                    r="1"
                                    fill="#3b82f6"
                                  />
                                </svg>
                              ) : (
                                <AzureIcon className="w-5 h-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {monthLabel(inv.month, inv.year)}
                              </p>
                              <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                                {meta.invoiceNumber
                                  ? `#${meta.invoiceNumber}`
                                  : inv.file_name || "Uploaded"}
                              </p>
                              {meta.billingProfile && (
                                <p
                                  className={`text-[11px] font-bold truncate mt-0.5 ${
                                    inv.provider === "aws"
                                      ? "text-orange-600 dark:text-orange-400"
                                      : inv.provider === "btp"
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : inv.provider === "gcp"
                                          ? "text-blue-500 dark:text-blue-400"
                                          : "text-blue-600 dark:text-blue-400"
                                  }`}
                                >
                                  {meta.billingProfile}
                                </p>
                              )}
                              {meta.billingPeriodStart && (
                                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 shrink-0" />
                                  {fmtDate(meta.billingPeriodStart)} –{" "}
                                  {fmtDate(meta.billingPeriodEnd)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end gap-1">
                            <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">
                              {formatCurrency(
                                parseFloat(inv.total_cost),
                                inv.currency || "USD",
                              )}
                            </p>
                            {meta.dueDate && (
                              <p className="text-[10px] text-orange-500 font-semibold flex items-center gap-1">
                                <CreditCard className="w-3 h-3" />
                                Due {fmtDate(meta.dueDate)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Pagination footer — never scrolls */}
            {totalPages > 1 && (
              <div className="shrink-0 mt-3 flex items-center justify-between gap-2">
                <p className="text-[10px] text-gray-400 font-medium">
                  Page {page} of {totalPages} · {totalCount} records
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (n) =>
                        n === 1 || n === totalPages || Math.abs(n - page) <= 1,
                    )
                    .reduce((acc, n, i, arr) => {
                      if (i > 0 && n - arr[i - 1] > 1) acc.push("…");
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((n, i) =>
                      n === "…" ? (
                        <span
                          key={`e${i}`}
                          className="px-1 text-[10px] text-gray-400"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={n}
                          onClick={() => setPage(n)}
                          className={`min-w-[26px] h-[26px] rounded-lg text-[10px] font-bold border transition-all ${
                            page === n
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                          }`}
                        >
                          {n}
                        </button>
                      ),
                    )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: detail panel (scrolls with page) ── */}
          <div className="lg:col-span-3">
            {!detail ? (
              <Card className="min-h-[420px] flex items-center justify-center">
                <div className="text-center py-16 px-8">
                  <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                    <BarChart2 className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                    Select an invoice to analyse
                  </p>
                  <p className="text-xs text-gray-400 mt-1.5 max-w-[220px] mx-auto leading-relaxed">
                    See billing breakdown, service costs, tax details &amp;
                    visual charts
                  </p>
                </div>
              </Card>
            ) : (
              <InvoiceDetail
                detail={detail}
                onDelete={handleDelete}
                onClose={() => setSelected(null)}
                deleting={deleting}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage;
