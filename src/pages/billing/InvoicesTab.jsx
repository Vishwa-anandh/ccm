import React, { useEffect, useState } from "react";
import { Plus, Inbox, ArrowLeft } from "lucide-react";
import {
  getCustomers,
  getInvoices,
  updateInvoiceLines,
  approveInvoice,
  publishInvoice,
} from "../../api/billingApi";
import { formatCurrency } from "../../utils/formatters";
import CustomerInvoiceDetail, { StatusPill } from "../../components/billing/CustomerInvoiceDetail";
import BuildInvoiceModal from "../../components/billing/BuildInvoiceModal";
import { fireToast } from "../../components/ToastProvider";

/**
 * Invoices — Finance's full list across every customer (doc §5, steps
 * 4–7): generate a draft, edit/recalculate lines, approve, publish. Once
 * Published/"Sent" it becomes visible on the matching customer's own
 * Billing view (CustomerBillingView.jsx) with a Pay Now action.
 */
const InvoicesTab = () => {
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showBuild, setShowBuild] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async (keepSelected = true) => {
    setLoading(true);
    try {
      const [c, inv] = await Promise.all([getCustomers(), getInvoices()]);
      setCustomers(c);
      setInvoices(inv);
      if (!keepSelected) setSelectedId(inv[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const customerFor = (id) => customers.find((c) => c.id === id);
  const selected = invoices.find((i) => i.id === selectedId);

  const handleBuilt = (invoice) => {
    setShowBuild(false);
    setInvoices((prev) => [...prev, invoice]);
    setSelectedId(invoice.id);
  };

  const handleSaveLines = async (lines, taxPct) => {
    setBusy(true);
    try {
      const updated = await updateInvoiceLines(selected.id, { lines, taxPct });
      setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      fireToast("Draft saved", "success");
    } catch (err) {
      fireToast(err.response?.data?.error || "Couldn't save changes.", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async () => {
    setBusy(true);
    try {
      const updated = await approveInvoice(selected.id);
      setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      fireToast("Invoice approved", "success");
    } catch (err) {
      fireToast(err.response?.data?.error || "Couldn't approve invoice.", "error");
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async () => {
    setBusy(true);
    try {
      const updated = await publishInvoice(selected.id);
      setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      fireToast("Invoice published — now visible to the customer", "success");
    } catch (err) {
      fireToast(err.response?.data?.error || "Couldn't publish invoice.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Below lg this is a master-detail drill-down: the list and detail
          are never both visible on a narrow screen, so selecting an
          invoice doesn't leave Finance scrolling past the rest of the
          list to reach it — at lg+ both panes show side by side as before. */}
      <div className={`lg:col-span-2 space-y-3 ${selected ? "hidden lg:block" : ""}`}>
        <button
          onClick={() => setShowBuild(true)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Generate Invoice
        </button>

        {loading && <p className="text-sm text-gray-400">Loading…</p>}
        {!loading && invoices.length === 0 && (
          <div className="flex flex-col items-center justify-center p-10 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 border-dashed rounded-2xl">
            <Inbox className="w-8 h-8 text-gray-400 mb-3" />
            <p className="text-sm font-bold text-gray-900 dark:text-white">No invoices yet</p>
          </div>
        )}

        <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          {invoices
            .slice()
            .sort((a, b) => (a.invoiceDate < b.invoiceDate ? 1 : -1))
            .map((inv) => (
              <button
                key={inv.id}
                onClick={() => setSelectedId(inv.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selectedId === inv.id
                    ? "border-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
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
                    {inv.billingPeriodStart} – {inv.billingPeriodEnd}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                    {formatCurrency(inv.totalDue, inv.currency)}
                  </span>
                </div>
              </button>
            ))}
        </div>
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
              customer={customerFor(selected.customerId)}
              editable
              busy={busy}
              onSaveLines={handleSaveLines}
              onApprove={handleApprove}
              onPublish={handlePublish}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[300px] text-sm text-gray-400">
            Select an invoice to view its detail
          </div>
        )}
      </div>

      {showBuild && (
        <BuildInvoiceModal
          customers={customers}
          onClose={() => setShowBuild(false)}
          onBuilt={handleBuilt}
        />
      )}
    </div>
  );
};

export default InvoicesTab;
