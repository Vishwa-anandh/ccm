import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Receipt, ShieldCheck, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getCustomers, getInvoices, payInvoice } from "../../api/billingApi";
import { formatCurrency } from "../../utils/formatters";
import CustomerInvoiceDetail, { StatusPill } from "../../components/billing/CustomerInvoiceDetail";
import { fireToast } from "../../components/ToastProvider";

// Only these ever reach the customer — Draft/Approved stay Finance-side
// until Finance publishes (doc §9: "Nothing publishes without approval...
// only Published status and later becomes visible on the customer's CCM
// account").
const VISIBLE_STATUSES = ["Sent", "Paid", "Overdue"];

/**
 * CustomerBillingView — what a regular (non-Finance) CCM user sees at
 * /billing: their own org's invoice history and status (doc §5, step 9),
 * with Pay Now (step 10) once an invoice is published and unpaid.
 */
const CustomerBillingView = ({ headerAction }) => {
  const { user } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [customers, allInvoices] = await Promise.all([getCustomers(), getInvoices()]);
      const mine = customers.find((c) => c.orgId === user?.currentOrgId);
      setCustomer(mine ?? null);
      const visible = allInvoices.filter(
        (i) => i.customerId === mine?.id && VISIBLE_STATUSES.includes(i.status),
      );
      setInvoices(visible);
      setSelectedId((prev) => prev ?? visible[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = invoices.find((i) => i.id === selectedId);

  const handlePayNow = async () => {
    setBusy(true);
    try {
      const updated = await payInvoice(selected.id);
      setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      fireToast("Payment successful — thank you!", "success");
    } catch (err) {
      fireToast(err.response?.data?.error || "Payment failed.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (!loading && !customer) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <Receipt className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-sm font-bold text-gray-900 dark:text-white">No billing account on file</p>
        <p className="text-xs text-gray-400 mt-1 max-w-sm">
          Your organization hasn't been set up as a billable customer yet — contact Maitsys if you're expecting invoices here.
        </p>
      </div>
    );
  }

  // Full-width, matching BillingPage's Finance console and the app's
  // dominant dashboard convention (see BillingPage.jsx for the survey).
  return (
    <div className="p-4 sm:p-6 xl:p-8 w-full space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-xl">
              <Receipt className="w-5 h-5 text-brand-600" />
            </div>
            Billing
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-11">
            Your invoices from Maitsys — view history, status, and pay online.
          </p>
        </div>
        {headerAction}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Same master-detail drill-down as InvoicesTab: below lg only one
            of list/detail shows at a time, so picking a bill doesn't leave
            you scrolling past the rest of the list to see it. */}
        <div className={`lg:col-span-2 space-y-2 ${selected ? "hidden lg:block" : ""}`}>
          {loading && (
            <div className="space-y-2">
              <div className="skeleton rounded-2xl h-20 w-full" />
              <div className="skeleton rounded-2xl h-20 w-full" />
              <div className="skeleton rounded-2xl h-20 w-full" />
            </div>
          )}
          {!loading && invoices.length === 0 && (
            <div className="flex flex-col items-center justify-center p-10 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 border-dashed rounded-2xl">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">No invoices yet</p>
              <p className="text-xs text-gray-400 mt-1">You're all caught up.</p>
            </div>
          )}
          {!loading &&
            invoices
              .slice()
              .sort((a, b) => (a.invoiceDate < b.invoiceDate ? 1 : -1))
              .map((inv) => (
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
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-400">
                      {inv.billingPeriodStart} – {inv.billingPeriodEnd}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                      {formatCurrency(inv.totalDue, inv.currency)}
                    </span>
                  </div>
                </button>
              ))}
        </div>

        <div className={`lg:col-span-3 ${!selected ? "hidden lg:block" : ""}`}>
          {selected ? (
            <div className="space-y-3">
              <button
                onClick={() => setSelectedId(null)}
                className="lg:hidden flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <ArrowLeft className="w-4 h-4" /> Back to list
              </button>
              <CustomerInvoiceDetail
                key={selected.id}
                invoice={selected}
                customer={customer}
                editable={false}
                busy={busy}
                onPayNow={handlePayNow}
              />
            </div>
          ) : (
            !loading && (
              <div className="flex items-center justify-center h-full min-h-[200px] text-sm text-gray-400">
                Select an invoice to view its detail
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

CustomerBillingView.propTypes = {
  headerAction: PropTypes.node,
};

export default CustomerBillingView;
