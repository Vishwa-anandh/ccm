import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Send, X, RefreshCw } from "lucide-react";
import { round2 } from "../../utils/pricingCalc";
import { formatCurrency } from "../../utils/formatters";

/**
 * SendInvoiceConfirmModal — the last checkpoint before Send Invoice
 * actually creates the invoice and (simulated-)emails the customer.
 * Lists every line item exactly as it will be saved, so Finance reviews
 * the real numbers one more time rather than sending on a click alone.
 *
 * Same overlay/panel recipe as SentEmailModal.jsx / ConfirmDialog.jsx.
 */
const SendInvoiceConfirmModal = ({
  open,
  customer,
  rows,
  taxPct,
  overallAdjustmentPct = 0,
  currency = "USD",
  busy = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const lineAmounts = rows.map((r) =>
    round2(Number(r.quantity || 0) * Number(r.unitPrice || 0) * (1 - Number(r.discountPct || 0) / 100)),
  );
  const lineSubtotal = round2(lineAmounts.reduce((s, a) => s + a, 0));
  const adjustmentAmount = round2(lineSubtotal * (Number(overallAdjustmentPct || 0) / 100));
  const subtotal = round2(lineSubtotal + adjustmentAmount);
  const tax = round2(subtotal * (Number(taxPct || 0) / 100));
  const total = round2(subtotal + tax);
  const fmt = (v) => formatCurrency(v, currency);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={() => !busy && onCancel()}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
        style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 pt-5 pb-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-brand-50 dark:bg-brand-900/20">
              <Send className="w-5 h-5 text-brand-600" />
            </div>
            <div className="pt-0.5 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                Confirm &amp; send invoice
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                Review these line items before emailing {customer?.name ?? "this customer"}
                {customer?.discountPct > 0 ? ` (${customer.discountPct}% discount)` : ""}.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={busy}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all ml-2 shrink-0 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800 mx-5" />

        <div className="px-5 py-4 max-h-[50vh] overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 tracking-wide border-b border-gray-100 dark:border-gray-800">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Unit Price</th>
                <th className="text-right py-2">Discount</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {rows.map((r, i) => (
                <tr key={r.id ?? i}>
                  <td className="py-2 pr-2 text-gray-800 dark:text-gray-200">{r.description || "—"}</td>
                  <td className="py-2 text-right text-gray-500">{r.quantity}</td>
                  <td className="py-2 text-right text-gray-500">{fmt(r.unitPrice)}</td>
                  <td className="py-2 text-right text-gray-500">
                    {Number(r.discountPct || 0) > 0 ? `${r.discountPct}%` : "—"}
                  </td>
                  <td className="py-2 text-right font-bold text-gray-900 dark:text-white">{fmt(lineAmounts[i])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800 mx-5" />

        <div className="px-5 py-3 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">{fmt(lineSubtotal)}</span>
          </div>
          {Number(overallAdjustmentPct || 0) !== 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Summary Adjustment ({overallAdjustmentPct}%)</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{fmt(adjustmentAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Tax ({taxPct}%)</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">{fmt(tax)}</span>
          </div>
          <div className="flex justify-between text-sm pt-1.5 border-t border-gray-100 dark:border-gray-800">
            <span className="font-bold text-gray-900 dark:text-white">Total Due</span>
            <span className="font-bold text-gray-900 dark:text-white">{fmt(total)}</span>
          </div>
        </div>

        <div className="px-5 pb-5 pt-2 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy} className="btn-primary text-xs disabled:opacity-50">
            {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Confirm &amp; Send
          </button>
        </div>
      </div>
    </div>
  );
};

SendInvoiceConfirmModal.propTypes = {
  open: PropTypes.bool.isRequired,
  customer: PropTypes.shape({ name: PropTypes.string, discountPct: PropTypes.number }),
  rows: PropTypes.array.isRequired,
  taxPct: PropTypes.number.isRequired,
  overallAdjustmentPct: PropTypes.number,
  currency: PropTypes.string,
  busy: PropTypes.bool,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default SendInvoiceConfirmModal;
