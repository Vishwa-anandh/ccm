import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Mail, X, ExternalLink } from "lucide-react";

/**
 * SentEmailModal — a mock "inbox" preview for the email an invoice
 * creation just (simulated-)sent. There's no real mail server in this
 * demo, so this is the only place to actually click the link a real
 * customer would receive — it's a genuine <a> to the public,
 * unauthenticated /invoice/:token page (PublicInvoicePage.jsx).
 *
 * Same overlay/panel recipe as ConfirmDialog.jsx (fixed inset-0 blurred
 * backdrop, rounded-2xl white/gray-900 panel) for visual consistency.
 */
const SentEmailModal = ({ email, onClose }) => {
  useEffect(() => {
    if (!email) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [email, onClose]);

  if (!email) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
        style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-brand-50 dark:bg-brand-900/20">
              <Mail className="w-5 h-5 text-brand-600" />
            </div>
            <div className="pt-0.5">
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                Email sent
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                No real mail server exists in this demo — here's exactly what was "sent."
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all ml-2 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800 mx-5" />

        <div className="px-5 py-4 space-y-3">
          <div className="text-xs space-y-1.5">
            <p>
              <span className="text-gray-400 font-semibold">To: </span>
              <span className="text-gray-800 dark:text-gray-200 font-mono">{email.to}</span>
            </p>
            <p>
              <span className="text-gray-400 font-semibold">Subject: </span>
              <span className="text-gray-800 dark:text-gray-200 font-semibold">{email.subject}</span>
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {email.body}
          </div>
          <a
            href={email.publicUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-primary w-full justify-center text-sm"
          >
            <ExternalLink className="w-4 h-4" /> Open Invoice &amp; Pay
          </a>
        </div>
      </div>
    </div>
  );
};

SentEmailModal.propTypes = {
  email: PropTypes.shape({
    to: PropTypes.string,
    subject: PropTypes.string,
    body: PropTypes.string,
    publicUrl: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};

export default SentEmailModal;
