import React from "react";
import PropTypes from "prop-types";
import {
  Receipt,
  Calendar,
  CreditCard,
  FileText,
  Tag,
  Building2,
  CheckCircle,
  Send,
  Wallet,
  RefreshCw,
  LayoutTemplate,
} from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

/**
 * CustomerInvoiceDetail — the "invoice document" view for the Billing
 * module. Always read-only: an invoice is shown here exactly as it was
 * created/priced (Discount %/Adjustment %/Overall Adjustment % are all set
 * once, at creation time, in GenerateInvoicePage — this view never edits
 * them). The only action it ever offers is Pay Now, and only when the
 * caller opts in via `allowPayment` (the customer's own Billing view does;
 * Finance's Invoices list does not — paying is a customer-only action).
 *
 * Visually mirrors InvoiceDetail in src/pages/InvoicesPage.jsx (header Card
 * → meta chips → KPI tiles → line items) — small local equivalents of that
 * page's Card/MetaChip/KpiTile are declared here rather than imported,
 * since that page doesn't export them.
 */

// shadow-card matches the app's shared card shadow (tailwind.config.js
// boxShadow.card / index.css .card), instead of re-declaring the same
// values as an inline style.
const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card ${className}`}>
    {children}
  </div>
);

const MetaChip = ({ icon: Icon, label, value, accent = "gray" }) => {
  const colors = {
    blue: "text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800",
    green: "text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    orange: "text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    gray: "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  }[accent];
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${colors}`}>
      <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
      <span className="text-[10px] tracking-wide opacity-60 shrink-0">{label}</span>
      <span className="font-bold truncate">{value || "—"}</span>
    </div>
  );
};

const KpiTile = ({ label, value, sub, accent = "gray", large = false }) => {
  const accents = {
    blue: "from-brand-500/10 to-transparent border-brand-100 dark:border-brand-900",
    green: "from-emerald-500/10 to-transparent border-emerald-100 dark:border-emerald-900",
    red: "from-red-500/10 to-transparent border-red-100 dark:border-red-900",
    gray: "from-gray-500/5 to-transparent border-gray-100 dark:border-gray-800",
  }[accent];
  return (
    <div className={`rounded-xl border p-3 min-w-0 bg-gradient-to-br ${accents}`}>
      <p className="text-[10px] font-bold tracking-wider text-gray-400 mb-1 truncate">{label}</p>
      <p className={`font-bold text-gray-900 dark:text-white tabular-nums leading-tight break-all ${large ? "text-xl" : "text-sm"}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5 font-medium truncate">{sub}</p>}
    </div>
  );
};

export const STATUS_STYLES = {
  Sent: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  Paid: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  Overdue: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
};

// Built on the shared `.badge` base (index.css) — same shape/sizing every
// other badge in the app uses — with Billing's own bg/border color per
// status layered on top, since `.badge-*` only covers text color and this
// needs three distinct filled states.
export const StatusPill = ({ status }) => (
  <span className={`badge border ${STATUS_STYLES[status] ?? STATUS_STYLES.Sent}`}>
    {status}
  </span>
);
StatusPill.propTypes = { status: PropTypes.string.isRequired };

const fmtDate = (s) => {
  if (!s) return "—";
  const d = new Date(`${s}T00:00:00`);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const CustomerInvoiceDetail = ({ invoice, customer, allowPayment = false, onPayNow, busy = false }) => {
  const cur = invoice.currency || "USD";
  const fmt = (v) => formatCurrency(v, cur);
  const customFields = invoice.customFields ?? [];
  const columns = invoice.columns ?? [];
  const lines = invoice.lines ?? [];
  const overallAdjPct = invoice.overallAdjustmentPct ?? 0;

  const canPay = allowPayment && (invoice.status === "Sent" || invoice.status === "Overdue");

  return (
    <div className="space-y-5">
      <Card>
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <StatusPill status={invoice.status} />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 font-mono">
                #{invoice.invoiceNumber}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium truncate flex items-center gap-1">
              <Building2 className="w-3 h-3" /> {customer?.name ?? "—"}
            </p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <MetaChip icon={FileText} label="Invoice Date" value={fmtDate(invoice.invoiceDate)} accent="gray" />
            {invoice.paymentTermName && (
              <MetaChip icon={Calendar} label="Payment Term" value={invoice.paymentTermName} accent="green" />
            )}
            {invoice.template && (
              <MetaChip
                icon={LayoutTemplate}
                label="Template"
                value={invoice.template === "modern" ? "Modern" : "Classic"}
                accent="gray"
              />
            )}
            <MetaChip icon={CreditCard} label="Due" value={fmtDate(invoice.dueDate)} accent="orange" />
            {invoice.publishedDate && (
              <MetaChip icon={Send} label="Published" value={fmtDate(invoice.publishedDate)} accent="blue" />
            )}
            {invoice.paidDate && (
              <MetaChip icon={CheckCircle} label="Paid" value={fmtDate(invoice.paidDate)} accent="green" />
            )}
            {customFields.map((f) => (
              <MetaChip key={f.id} icon={Tag} label={f.label} value={f.value} accent="gray" />
            ))}
          </div>

          <div className="grid gap-2 mt-3 grid-cols-2 sm:grid-cols-4">
            <KpiTile label="Line Items Subtotal" value={fmt(invoice.lineSubtotal)} accent="gray" />
            <KpiTile
              label="Overall Adjustment"
              value={fmt(invoice.overallAdjustmentAmount)}
              sub={`${overallAdjPct}%`}
              accent="gray"
            />
            <KpiTile label="Tax" value={fmt(invoice.tax)} accent="gray" />
            <KpiTile label="Total Due" value={fmt(invoice.totalDue)} sub={invoice.currency} accent="blue" large />
          </div>
        </div>
      </Card>

      <Card>
        <div className="px-5 pt-4 pb-2 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
          <Receipt className="w-4 h-4 text-brand-500" />
          <h3 className="text-xs font-bold text-gray-900 dark:text-white tracking-wide">Line Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 tracking-wide">
                <th className="text-left px-5 py-2">Description</th>
                <th className="text-right px-3 py-2">Vendor Total</th>
                <th className="text-right px-3 py-2">Discount %</th>
                <th className="text-right px-3 py-2">Net</th>
                <th className="text-right px-3 py-2">Adj. %</th>
                <th className="text-right px-5 py-2">Final Amount</th>
                {columns.map((c) => (
                  <th key={c.id} className="text-left px-3 py-2">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="border-t border-gray-50 dark:border-gray-800/60">
                  <td className="px-5 py-2.5">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{line.description}</p>
                    {line.subscriptionId && (
                      <p className="text-[10px] text-gray-400 font-mono">{line.subscriptionId}</p>
                    )}
                  </td>
                  <td className="text-right px-3 py-2.5 tabular-nums text-gray-500">
                    {fmt(line.vendorLineTotal)}
                  </td>
                  <td className="text-right px-3 py-2.5 tabular-nums">{line.discountPctApplied}%</td>
                  <td className="text-right px-3 py-2.5 tabular-nums text-gray-500">
                    {fmt(line.netAmountAfterDiscount)}
                  </td>
                  <td className="text-right px-3 py-2.5 tabular-nums">{line.maitsysAdjustmentPctApplied}%</td>
                  <td className="text-right px-5 py-2.5 tabular-nums font-bold text-gray-900 dark:text-white">
                    {fmt(line.finalLineAmount)}
                  </td>
                  {columns.map((c) => (
                    <td key={c.id} className="text-left px-3 py-2.5 text-gray-600 dark:text-gray-400">
                      {line.extra?.[c.id] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {invoice.paymentReference && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" /> {invoice.paymentReference} ({invoice.paymentMethod})
            </span>
          </div>
        )}
      </Card>

      {canPay && (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onPayNow?.()}
            disabled={busy}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-emerald-600/20"
          >
            {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
            Pay Now
          </button>
        </div>
      )}
    </div>
  );
};

CustomerInvoiceDetail.propTypes = {
  invoice: PropTypes.object.isRequired,
  customer: PropTypes.object,
  allowPayment: PropTypes.bool,
  onPayNow: PropTypes.func,
  busy: PropTypes.bool,
};

export default CustomerInvoiceDetail;
