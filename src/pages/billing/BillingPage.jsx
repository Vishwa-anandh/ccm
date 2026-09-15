import React, { useRef, useState } from "react";
import { CalendarClock, Receipt as ReceiptIcon, Upload } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PaymentTermsTab from "./PaymentTermsTab";
import InvoicesTab from "./InvoicesTab";
import CustomerBillingView from "./CustomerBillingView";
import UploadInvoiceModal from "../../components/billing/UploadInvoiceModal";

const TABS = [
  { id: "invoices", label: "Invoices", icon: ReceiptIcon },
  { id: "payment-terms", label: "Payment Terms", icon: CalendarClock },
];

/**
 * BillingPage — /billing. One route, two views (doc: "one application, two
 * permission levels"): Finance/Admin gets the full console (create +
 * price invoices — no Draft/Approve step, a created invoice is
 * immediately final); everyone else gets their own read-only invoice
 * history with Pay Now. No PermissionRoute/AccessDenied needed — a
 * customer isn't denied anything here, they just see their own bills.
 *
 * Customers (billable-account management) moved to its own sidebar
 * destination (/billing/customers, CustomersPage.jsx) — it's a distinct
 * workflow from invoicing, not a tab of it.
 *
 * "Upload Invoice" opens UploadInvoiceModal as a popup rather than
 * navigating to /billing/generate — Finance stays on this page, and once
 * an invoice is created the modal closes and InvoicesTab (held via ref)
 * refreshes and selects it in place, no route change needed. The
 * standalone /billing/generate route (GenerateInvoicePage.jsx) still
 * exists for a direct link.
 */
const BillingPage = () => {
  const { user } = useAuth();
  const isPrivileged = user?.role === "admin" || user?.role === "owner";
  const [activeTab, setActiveTab] = useState("invoices");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const invoicesTabRef = useRef(null);

  const handleInvoiceCreated = (invoiceId) => {
    setShowUploadModal(false);
    invoicesTabRef.current?.reloadAndSelect(invoiceId);
  };

  if (isPrivileged) {
    return (
      <div className="p-4 sm:p-6 xl:p-8 w-full space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-xl">
                <ReceiptIcon className="w-5 h-5 text-brand-600" />
              </div>
              Billing
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-11">
              Generate branded customer invoices from already-ingested vendor invoices.
            </p>
          </div>
          {activeTab === "invoices" && (
            <button onClick={() => setShowUploadModal(true)} className="btn-primary">
              <Upload className="w-4 h-4" /> Upload Invoice
            </button>
          )}
        </div>

        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === t.id
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Kept mounted (display:none via hidden) rather than swapped out
            entirely so invoicesTabRef stays attached across tab switches —
            the modal can report a created invoice regardless of which tab
            is currently visible. */}
        <div className={activeTab === "invoices" ? "" : "hidden"}>
          <InvoicesTab ref={invoicesTabRef} />
        </div>
        {activeTab === "payment-terms" && <PaymentTermsTab />}

        <UploadInvoiceModal
          open={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onCreated={handleInvoiceCreated}
        />
      </div>
    );
  }

  return <CustomerBillingView />;
};

export default BillingPage;
