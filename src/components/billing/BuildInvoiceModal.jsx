import React, { useState } from "react";
import PropTypes from "prop-types";
import { X, FileStack, RefreshCw, AlertTriangle } from "lucide-react";
import { buildInvoice } from "../../api/billingApi";
import { fireToast } from "../ToastProvider";
import CustomFieldsEditor from "../invoice-builder/CustomFieldsEditor";
import LineItemsEditor from "../invoice-builder/LineItemsEditor";

const todayIso = () => new Date().toISOString().slice(0, 10);
const plusDaysIso = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

/**
 * BuildInvoiceModal — Finance builds a Customer Invoice by hand: pick a
 * customer, then use the same dynamic rows/columns/custom-fields editors
 * as the standalone Invoice Builder to construct the line items. Replaces
 * the old vendor-invoice auto-pull flow (GenerateInvoiceModal) entirely —
 * there's no vendor data behind a manually built invoice, so each line
 * starts with 0% discount/adjustment; Finance can still edit those inline
 * on the resulting Draft, exactly like an auto-pulled invoice.
 */
const BuildInvoiceModal = ({ customers, onClose, onBuilt }) => {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [invoiceDate, setInvoiceDate] = useState(todayIso);
  const [dueDate, setDueDate] = useState(() => plusDaysIso(14));
  const [billingPeriodStart, setBillingPeriodStart] = useState(() => todayIso().slice(0, 8) + "01");
  const [billingPeriodEnd, setBillingPeriodEnd] = useState(todayIso);
  const [taxPct, setTaxPct] = useState(0);
  const [customFields, setCustomFields] = useState([]);
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([
    { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, extra: {} },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canCreate = customerId && rows.some((r) => r.description.trim().length > 0);

  const handleCreate = async () => {
    if (!canCreate) return;
    setBusy(true);
    setError("");
    try {
      const invoice = await buildInvoice({
        customerId,
        invoiceDate,
        dueDate,
        billingPeriodStart,
        billingPeriodEnd,
        customFields,
        columns,
        rows,
        taxPct,
      });
      fireToast(`Draft ${invoice.invoiceNumber} created`, "success");
      onBuilt(invoice);
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't create the invoice.");
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
        className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col"
        style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.2)", maxHeight: "90vh" }}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center">
              <FileStack className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Build Customer Invoice</p>
              <p className="text-[11px] text-gray-400 font-medium">
                Add line items, columns, and custom fields by hand
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

        <div className="p-6 space-y-5 overflow-y-auto">
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Billing Period Start</label>
              <input
                type="date"
                value={billingPeriodStart}
                onChange={(e) => setBillingPeriodStart(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Billing Period End</label>
              <input
                type="date"
                value={billingPeriodEnd}
                onChange={(e) => setBillingPeriodEnd(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="max-w-[140px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Tax %</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={taxPct}
              onChange={(e) => setTaxPct(Number(e.target.value))}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 tracking-wide">Custom Fields</p>
            <CustomFieldsEditor fields={customFields} onChange={setCustomFields} />
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 tracking-wide">Line Items</p>
            <LineItemsEditor
              columns={columns}
              rows={rows}
              onColumnsChange={setColumns}
              onRowsChange={setRows}
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={busy || !canCreate}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy && <RefreshCw className="w-4 h-4 animate-spin" />}
            Create Draft
          </button>
        </div>
      </div>
    </div>
  );
};

BuildInvoiceModal.propTypes = {
  customers: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onBuilt: PropTypes.func.isRequired,
};

export default BuildInvoiceModal;
