import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { X, FileStack, RefreshCw, AlertTriangle } from "lucide-react";
import { generateInvoice } from "../../api/billingApi";
import { fireToast } from "../ToastProvider";

const PERIODS = [
  { value: "2026-07", label: "July 2026" },
  { value: "2026-08", label: "August 2026" },
  { value: "2026-09", label: "September 2026" },
];

/**
 * GenerateInvoiceModal — Finance picks a customer + billing period; the
 * backend (mocked) pulls that customer's already-ingested vendor invoices
 * for the period and creates an editable Draft Customer Invoice from them
 * (doc §5, steps 1–3). Modal recipe mirrors UploadModal in
 * src/pages/InvoicesPage.jsx.
 */
const GenerateInvoiceModal = ({ customers, onClose, onGenerated }) => {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [period, setPeriod] = useState(PERIODS[PERIODS.length - 1].value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const periodRange = useMemo(() => {
    const [y, m] = period.split("-").map(Number);
    const start = `${period}-01`;
    const end = new Date(y, m, 0).toISOString().slice(0, 10);
    return { start, end };
  }, [period]);

  const handleGenerate = async () => {
    if (!customerId) return;
    setBusy(true);
    setError("");
    try {
      const invoice = await generateInvoice({
        customerId,
        billingPeriodStart: periodRange.start,
        billingPeriodEnd: periodRange.end,
      });
      fireToast(`Draft ${invoice.invoiceNumber} created`, "success");
      onGenerated(invoice);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Couldn't generate an invoice for this customer and period.",
      );
    } finally {
      setBusy(false);
    }
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
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center">
              <FileStack className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Generate Customer Invoice</p>
              <p className="text-[11px] text-gray-400 font-medium">
                Pulls that customer's already-ingested vendor invoices
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

        <div className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 tracking-wide">Customer</p>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2.5 text-sm font-semibold"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 tracking-wide">Billing Period</p>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2.5 text-sm font-semibold"
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={busy || !customerId}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy && <RefreshCw className="w-4 h-4 animate-spin" />}
            Generate Draft
          </button>
        </div>
      </div>
    </div>
  );
};

GenerateInvoiceModal.propTypes = {
  customers: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onGenerated: PropTypes.func.isRequired,
};

export default GenerateInvoiceModal;
