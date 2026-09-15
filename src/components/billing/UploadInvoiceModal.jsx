import React, { useEffect } from "react";
import PropTypes from "prop-types";
import UploadInvoiceForm from "./UploadInvoiceForm";

/**
 * UploadInvoiceModal — the Billing page's "Upload Invoice" button opens
 * this instead of navigating to /billing/generate, so Finance stays on
 * the Billing page underneath. Large, scrollable panel (the workflow has
 * a two-column form+preview layout once a file's uploaded, which needs
 * real room) rather than a small centered dialog.
 *
 * `onCreated(invoiceId)` fires once the invoice is actually built and its
 * "sent email" preview closed — the host (BillingPage) uses it to close
 * this modal and refresh/select the new invoice in the Invoices list.
 */
const UploadInvoiceModal = ({ open, onClose, onCreated }) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl my-auto bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
        style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.35)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <UploadInvoiceForm onClose={onClose} onCreated={onCreated} embedded />
        </div>
      </div>
    </div>
  );
};

UploadInvoiceModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func.isRequired,
};

export default UploadInvoiceModal;
