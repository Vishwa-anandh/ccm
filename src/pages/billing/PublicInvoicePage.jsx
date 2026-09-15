/**
 * PublicInvoicePage — PUBLIC route (/invoice/:token)
 * No authentication required. This is exactly what a customer reaches by
 * clicking the link in their invoice email (SentEmailModal.jsx shows the
 * same link) — looked up by the invoice's secret publicToken, never by its
 * id, so there is no login/session dependency and no way to enumerate
 * other customers' invoices.
 *
 * Shows the actual branded invoice document (InvoiceDocument, the same
 * component the Billing page's "View Invoice" toggle uses) rather than the
 * app's own MetaChip/KPI data-summary view — a customer clicking an
 * emailed link expects to see the invoice itself. A sticky right-side
 * panel (total + summary + Pay Now) stays pinned at the top while the
 * document scrolls, the way a checkout summary sidebar works.
 */
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, FileWarning, RefreshCw, Wallet } from "lucide-react";
import { getPublicInvoice, payPublicInvoice } from "../../api/billingApi";
import InvoiceDocument from "../../components/billing/InvoiceDocument";
import { StatusPill } from "../../components/billing/CustomerInvoiceDetail";
import { formatCurrency } from "../../utils/formatters";
import { fireToast } from "../../components/ToastProvider";

const fmtDate = (s) => {
  if (!s) return "—";
  const d = new Date(`${s}T00:00:00`);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const PublicInvoicePage = () => {
  const { token } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const data = await getPublicInvoice(token);
      setInvoice(data.invoice);
      setCustomer(data.customer);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handlePayNow = async () => {
    setBusy(true);
    try {
      const updated = await payPublicInvoice(token);
      setInvoice(updated);
      fireToast("Payment received — thank you!", "success");
    } catch (err) {
      fireToast(err.response?.data?.error || "Couldn't process payment.", "error");
    } finally {
      setBusy(false);
    }
  };

  const canPay = invoice && (invoice.status === "Sent" || invoice.status === "Overdue");
  const fmt = (v) => formatCurrency(v, invoice?.currency || "USD");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <img src="/app-logo.png" alt="Maitsys" className="w-8 h-8 object-contain" />
          <div>
            <p className="font-bold text-gray-900 dark:text-white leading-tight">Maitsys</p>
            <p className="text-[10px] text-gray-400">Customer Invoice</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mb-3" />
            Loading invoice…
          </div>
        )}

        {!loading && notFound && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-full flex items-center justify-center mb-4">
              <FileWarning className="w-8 h-8" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Invoice not found</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              This link may be out of date, or the invoice is no longer available. Contact Maitsys billing if you think this is a mistake.
            </p>
          </div>
        )}

        {!loading && !notFound && invoice && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              {invoice.status === "Paid" && (
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 mb-4">
                  <CheckCircle2 className="w-4 h-4" /> This invoice has been paid — thank you!
                </div>
              )}
              <div className="shadow-lg rounded-xl overflow-hidden bg-white">
                <InvoiceDocument invoice={invoice} customer={customer} />
              </div>
            </div>

            {/* Sticky checkout-style summary — stays pinned at the top of
                the viewport as the document scrolls, rather than sitting
                buried at the bottom of a single column. */}
            <div className="lg:sticky lg:top-6">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <StatusPill status={invoice.status} />
                  <span className="text-xs font-mono text-gray-400">#{invoice.invoiceNumber}</span>
                </div>

                <div className="space-y-1.5 text-sm pt-1 border-t border-gray-100 dark:border-gray-800 pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{fmt(invoice.lineSubtotal)}</span>
                  </div>
                  {Number(invoice.overallAdjustmentAmount || 0) !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Summary Adjustment ({invoice.overallAdjustmentPct}%)</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {fmt(invoice.overallAdjustmentAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{fmt(invoice.tax)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                  <span className="font-bold text-gray-900 dark:text-white">Total Due</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{fmt(invoice.totalDue)}</span>
                </div>
                <p className="text-xs text-gray-400 -mt-2">Due {fmtDate(invoice.dueDate)}</p>

                {canPay && (
                  <button
                    onClick={handlePayNow}
                    disabled={busy}
                    className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all disabled:opacity-50 shadow-sm shadow-emerald-600/20"
                  >
                    {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                    Pay Now
                  </button>
                )}
                {invoice.status === "Paid" && (
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Paid
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicInvoicePage;
