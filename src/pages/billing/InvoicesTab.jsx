import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, Inbox, ArrowLeft, Mail } from "lucide-react";
import { getCustomers, getInvoices, getInvoiceEmail } from "../../api/billingApi";
import { formatCurrency } from "../../utils/formatters";
import CustomerInvoiceDetail, { StatusPill } from "../../components/billing/CustomerInvoiceDetail";
import SentEmailModal from "../../components/billing/SentEmailModal";
import { fireToast } from "../../components/ToastProvider";

/**
 * Invoices — Finance's full list across every customer, view-only.
 * Creating an invoice (GenerateInvoicePage) is where Discount %/
 * Adjustment %/Overall Adjustment % get set, and it shows up here
 * immediately — no Draft/Approved holding state, no further editing, no
 * Approve/Publish step. It's already visible on the matching customer's
 * own Billing view with a Pay Now action (which only the customer gets —
 * Finance just views the invoice here).
 */
const InvoicesTab = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(location.state?.selectedInvoiceId ?? null);
  const [viewingEmail, setViewingEmail] = useState(null);

  const sortedInvoices = useMemo(
    () => invoices.slice().sort((a, b) => (a.invoiceDate < b.invoiceDate ? 1 : -1)),
    [invoices],
  );

  const load = async (keepSelected = true) => {
    setLoading(true);
    try {
      const [c, inv] = await Promise.all([getCustomers(), getInvoices()]);
      setCustomers(c);
      setInvoices(inv);
      if (!keepSelected) {
        const sorted = inv.slice().sort((a, b) => (a.invoiceDate < b.invoiceDate ? 1 : -1));
        setSelectedId(sorted[0]?.id ?? null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Default to the most recent invoice being selected, unless we were
    // handed a specific one to land on (e.g. just created it).
    load(Boolean(location.state?.selectedInvoiceId));
    // Consume the "just generated" selection once — a later remount of this
    // tab (e.g. switching away and back) shouldn't keep re-selecting it.
    if (location.state?.selectedInvoiceId) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const customerFor = (id) => customers.find((c) => c.id === id);
  const selected = invoices.find((i) => i.id === selectedId);

  const handleViewEmail = async () => {
    try {
      setViewingEmail(await getInvoiceEmail(selected.id));
    } catch {
      fireToast("No email on file for this invoice (created before this feature existed).", "error");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
      {/* Below lg this is a master-detail drill-down: the list and detail
          are never both visible on a narrow screen, so selecting an
          invoice doesn't leave Finance scrolling past the rest of the
          list to reach it — at lg+ both panes show side by side as before,
          30/70 split. */}
      <div className={`lg:col-span-3 space-y-3 ${selected ? "hidden lg:block" : ""}`}>
        <button onClick={() => navigate("/billing/generate")} className="btn-primary w-full justify-center">
          <Plus className="w-4 h-4" /> Create Invoice
        </button>

        {loading && (
          <div className="space-y-2">
            <div className="skeleton rounded-2xl h-24 w-full" />
            <div className="skeleton rounded-2xl h-24 w-full" />
            <div className="skeleton rounded-2xl h-24 w-full" />
          </div>
        )}
        {!loading && invoices.length === 0 && (
          <div className="flex flex-col items-center justify-center p-10 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 border-dashed rounded-2xl">
            <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/30 text-brand-500 rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">No invoices yet</p>
            <p className="text-xs text-gray-400 mt-1">Click Create Invoice to get started.</p>
          </div>
        )}

        <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          {sortedInvoices.map((inv) => (
            <button
              key={inv.id}
              onClick={() => setSelectedId(inv.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                selectedId === inv.id
                  ? "border-brand-400 bg-brand-50/50 dark:bg-brand-950/20"
                  : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-900 dark:text-white font-mono truncate">
                  #{inv.invoiceNumber}
                </span>
                <StatusPill status={inv.status} />
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">{customerFor(inv.customerId)?.name}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-gray-400">
                  {inv.invoiceDate} · Due {inv.dueDate}{inv.paymentTermName ? ` (${inv.paymentTermName})` : ""}
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                  {formatCurrency(inv.totalDue, inv.currency)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={`lg:col-span-7 ${!selected ? "hidden lg:block" : ""}`}>
        {selected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setSelectedId(null)}
                className="lg:hidden flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <ArrowLeft className="w-4 h-4" /> Back to list
              </button>
              <button
                onClick={handleViewEmail}
                className="ml-auto flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <Mail className="w-3.5 h-3.5" /> View Sent Email
              </button>
            </div>
            <CustomerInvoiceDetail
              key={selected.id}
              invoice={selected}
              customer={customerFor(selected.customerId)}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[300px] text-sm text-gray-400">
            Select an invoice to view its detail
          </div>
        )}
      </div>

      <SentEmailModal email={viewingEmail} onClose={() => setViewingEmail(null)} />
    </div>
  );
};

export default InvoicesTab;
