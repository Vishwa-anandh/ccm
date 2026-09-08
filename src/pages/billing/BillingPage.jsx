import React, { useState } from "react";
import { Users, Percent, Receipt as ReceiptIcon, Eye, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { DEMO_MODE } from "../../api/demoBackend";
import CustomersTab from "./CustomersTab";
import PricingRulesTab from "./PricingRulesTab";
import InvoicesTab from "./InvoicesTab";
import CustomerBillingView from "./CustomerBillingView";

const TABS = [
  { id: "invoices", label: "Invoices", icon: ReceiptIcon },
  { id: "customers", label: "Customers", icon: Users },
  { id: "pricing-rules", label: "Pricing Rules", icon: Percent },
];

/**
 * BillingPage — /billing. One route, two views (doc: "one application, two
 * permission levels"): Finance/Admin gets the full console (generate,
 * price, approve, publish); everyone else gets their own read-only invoice
 * history with Pay Now. No PermissionRoute/AccessDenied needed — a
 * customer isn't denied anything here, they just see their own bills.
 */
const BillingPage = () => {
  const { user } = useAuth();
  const isPrivileged = user?.role === "admin" || user?.role === "owner";
  const [activeTab, setActiveTab] = useState("invoices");
  const [previewAsCustomer, setPreviewAsCustomer] = useState(false);

  if (isPrivileged && !previewAsCustomer) {
    const Active = { invoices: InvoicesTab, customers: CustomersTab, "pricing-rules": PricingRulesTab }[activeTab];
    // max-w-6xl (1152px) left a lot of unused width on ordinary wide
    // monitors (1920px+) — screen-2xl (1536px) still caps line length on
    // ultra-wide displays but actually uses the space in between.
    return (
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Billing</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Generate branded customer invoices from already-ingested vendor invoices.
            </p>
          </div>
          {DEMO_MODE && (
            <button
              onClick={() => setPreviewAsCustomer(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-700"
              title="Demo-only: see this same module as a customer would"
            >
              <Eye className="w-3.5 h-3.5" /> Preview as customer
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

        <Active />
      </div>
    );
  }

  return (
    <div>
      {DEMO_MODE && previewAsCustomer && (
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <button
            onClick={() => setPreviewAsCustomer(false)}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-700"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Back to Finance console
          </button>
        </div>
      )}
      <CustomerBillingView />
    </div>
  );
};

export default BillingPage;
