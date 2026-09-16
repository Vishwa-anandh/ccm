import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Send, X, RefreshCw } from "lucide-react";
import InvoicePreview from "../invoice-builder/InvoicePreview";

/**
 * SendInvoiceConfirmModal — the last checkpoint before Send Invoice
 * actually creates the invoice and (simulated-)emails the customer. Shows
 * the actual branded invoice document (the same InvoicePreview the
 * builder's live preview renders) rather than a plain line-item table, so
 * Finance confirms exactly what the customer is about to receive.
 *
 * Same overlay/panel recipe as SentEmailModal.jsx / ConfirmDialog.jsx.
 */
const SendInvoiceConfirmModal = ({ open, customer, previewProps, busy = false, onConfirm, onCancel }) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={() => !busy && onCancel()}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
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
                Review the invoice exactly as it will look before emailing {customer?.name ?? "this customer"}
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

        <div className="px-5 py-4 max-h-[65vh] overflow-y-auto bg-gray-100 dark:bg-gray-950">
          <div className="shadow-lg rounded-lg overflow-hidden">
            <InvoicePreview {...previewProps} />
          </div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800 mx-5" />

        <div className="px-5 py-4 flex items-center justify-end gap-2">
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
  previewProps: PropTypes.object,
  busy: PropTypes.bool,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default SendInvoiceConfirmModal;
