import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Inbox, ArrowLeft, Mail, Search } from "lucide-react";
import { getCustomers, getInvoices, getInvoiceEmail } from "../../api/billingApi";
import { formatCurrency } from "../../utils/formatters";
import CustomerInvoiceDetail, { StatusPill } from "../../components/billing/CustomerInvoiceDetail";
import SentEmailModal from "../../components/billing/SentEmailModal";
import { fireToast } from "../../components/ToastProvider";
import Dropdown from "../../components/Dropdown";

/**
 * Invoices — Finance's full list across every customer, view-only.
 * Uploading an invoice file (GenerateInvoicePage — PDF/Excel/CSV, parsed
 * into editable line items) is where Discount %/Adjustment %/Overall
 * Adjustment % get set, and it shows up here immediately — no Draft/
 * Approved holding state, no further editing, no Approve/Publish step.
 * It's already visible on the matching customer's own Billing view with a
 * Pay Now action (which only the customer gets — Finance just views the
 * invoice here).
 */
const InvoicesTab = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(location.state?.selectedInvoiceId ?? null);
  const [viewingEmail, setViewingEmail] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");

  const customerFor = (id) => customers.find((c) => c.id === id);

  const sortedInvoices = useMemo(
    () => invoices.slice().sort((a, b) => (a.invoiceDate < b.invoiceDate ? 1 : -1)),
    [invoices],
  );

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedInvoices.filter((inv) => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false;
      if (customerFilter !== "all" && inv.customerId !== customerFilter) return false;
      if (!q) return true;
      const customerName = customerFor(inv.customerId)?.name ?? "";
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        customerName.toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedInvoices, search, statusFilter, customerFilter, customers]);

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

  const selected = invoices.find((i) => i.id === selectedId);

  const handleViewEmail = async () => {
    try {
      setViewingEmail(await getInvoiceEmail(selected.id));
    } catch {
      fireToast("No email on file for this invoice (created before this feature existed).", "error");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Below lg this is a master-detail drill-down: the list and detail
          are never both visible on a narrow screen, so selecting an
          invoice doesn't leave Finance scrolling past the rest of the
          list to reach it — at lg+ both panes show side by side as before,
          50/50 split. */}
      <div className={`space-y-3 ${selected ? "hidden lg:block" : ""}`}>
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
            <p className="text-xs text-gray-400 mt-1">Click Upload Invoice to get started.</p>
          </div>
        )}

        {!loading && invoices.length > 0 && (
          <>
            {/* Search + filters, styled after the reference table's toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search invoice # or customer…"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                />
              </div>
              <Dropdown
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: "All" },
                  { value: "Sent", label: "Sent" },
                  { value: "Paid", label: "Paid" },
                  { value: "Overdue", label: "Overdue" },
                ]}
              />
              <Dropdown
                label="Customer"
                value={customerFilter}
                onChange={setCustomerFilter}
                options={[
                  { value: "all", label: "All" },
                  ...customers.map((c) => ({
                    value: c.id,
                    label: c.discountPct > 0 ? `${c.name} (${c.discountPct}%)` : c.name,
                  })),
                ]}
              />
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 max-h-[70vh] overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] font-bold text-gray-400 tracking-wide sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 z-10">
                    <th className="text-left px-3 py-2.5 whitespace-nowrap">Invoice #</th>
                    <th className="text-left px-3 py-2.5 whitespace-nowrap">Customer</th>
                    <th className="text-left px-3 py-2.5 whitespace-nowrap">Invoice Date</th>
                    <th className="text-left px-3 py-2.5 whitespace-nowrap">Due Date</th>
                    <th className="text-left px-3 py-2.5 whitespace-nowrap">Status</th>
                    <th className="text-right px-3 py-2.5 whitespace-nowrap">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                        No invoices match these filters.
                      </td>
                    </tr>
                  )}
                  {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedId(inv.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedId === inv.id
                        ? "bg-brand-50/60 dark:bg-brand-950/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                    }`}
                  >
                    <td className="px-3 py-2.5 font-bold text-gray-900 dark:text-white font-mono whitespace-nowrap">
                      #{inv.invoiceNumber}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300 max-w-[130px] truncate">
                      {customerFor(inv.customerId)?.name}
                      {customerFor(inv.customerId)?.discountPct > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {" "}
                          ({customerFor(inv.customerId).discountPct}%)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{inv.invoiceDate}</td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{inv.dueDate}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <StatusPill status={inv.status} />
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-gray-900 dark:text-white tabular-nums whitespace-nowrap">
                      {formatCurrency(inv.totalDue, inv.currency)}
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className={`${!selected ? "hidden lg:block" : ""}`}>
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
