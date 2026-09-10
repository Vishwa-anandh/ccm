import React from "react";
import { Building2 } from "lucide-react";
import CustomersTab from "./CustomersTab";

/**
 * CustomersPage — /billing/customers. Previously a tab inside BillingPage;
 * promoted to its own sidebar destination since managing billable customer
 * accounts is a distinct workflow from generating/reviewing invoices.
 * CustomersTab itself is unchanged — this just gives it the same top-level
 * page chrome every other sidebar destination has (BillingPage, etc.).
 */
const CustomersPage = () => (
  <div className="p-4 sm:p-6 xl:p-8 w-full space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
        <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-xl">
          <Building2 className="w-5 h-5 text-brand-600" />
        </div>
        Customers
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-11">
        Manage the billable customer accounts used when generating invoices.
      </p>
    </div>

    <CustomersTab />
  </div>
);

export default CustomersPage;
