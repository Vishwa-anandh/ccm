/**
 * PublicInvoicePage — PUBLIC route (/invoice/:token)
 * No authentication required. This is exactly what a customer reaches by
 * clicking the link in their invoice email (SentEmailModal.jsx shows the
 * same link) — looked up by the invoice's secret publicToken, never by its
 * id, so there is no login/session dependency and no way to enumerate
 * other customers' invoices. Reuses CustomerInvoiceDetail (the same
 * read-only document view Finance and the logged-in customer both see),
 * with allowPayment so Pay Now works right from here.
 */
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, FileWarning, RefreshCw } from "lucide-react";
import { getPublicInvoice, payPublicInvoice } from "../../api/billingApi";
import CustomerInvoiceDetail from "../../components/billing/CustomerInvoiceDetail";
import { fireToast } from "../../components/ToastProvider";

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <img src="/app-logo.png" alt="Maitsys" className="w-8 h-8 object-contain" />
          <div>
            <p className="font-bold text-gray-900 dark:text-white leading-tight">Maitsys</p>
            <p className="text-[10px] text-gray-400">Customer Invoice</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
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
          <>
            {invoice.status === "Paid" && (
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 mb-4">
                <CheckCircle2 className="w-4 h-4" /> This invoice has been paid — thank you!
              </div>
            )}
            <CustomerInvoiceDetail
              invoice={invoice}
              customer={customer}
              allowPayment
              busy={busy}
              onPayNow={handlePayNow}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PublicInvoicePage;
