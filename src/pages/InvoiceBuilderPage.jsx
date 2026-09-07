import React, { useRef, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import CustomFieldsEditor from "../components/invoice-builder/CustomFieldsEditor";
import LineItemsEditor from "../components/invoice-builder/LineItemsEditor";
import InvoicePreview from "../components/invoice-builder/InvoicePreview";
import { exportInvoicePdf } from "../utils/exportInvoicePdf";
import { fireToast } from "../components/ToastProvider";

const todayIso = () => new Date().toISOString().slice(0, 10);
const plusDaysIso = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

/**
 * InvoiceBuilderPage — /invoice-builder. A staff-only, ad-hoc invoice
 * builder, entirely separate from the Billing module: no customer
 * accounts, no pricing rules, no approval workflow, nothing persisted.
 * Build a fully custom invoice (dynamic rows/columns/header fields) and
 * download it as a PDF.
 */
const InvoiceBuilderPage = () => {
  const previewRef = useRef(null);
  const [invoiceNumber, setInvoiceNumber] = useState(() => `INV-${Date.now().toString().slice(-8)}`);
  const [invoiceDate, setInvoiceDate] = useState(todayIso);
  const [dueDate, setDueDate] = useState(() => plusDaysIso(14));
  const [billTo, setBillTo] = useState({ name: "", address: "", email: "" });
  const [customFields, setCustomFields] = useState([]);
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([
    { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, extra: {} },
  ]);
  const [taxPct, setTaxPct] = useState(0);
  const [notes, setNotes] = useState("");
  const [downloading, setDownloading] = useState(false);

  const canDownload = rows.some((r) => r.description.trim().length > 0);

  const handleDownload = async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      await exportInvoicePdf(previewRef.current, `${invoiceNumber}.pdf`);
    } catch (err) {
      fireToast("Couldn't generate the PDF. " + (err?.message || ""), "error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Invoice Builder
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Build a one-off invoice from scratch and download it as a PDF — outside the Billing
            module's approval workflow.
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={!canDownload || downloading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {downloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Invoice Number</label>
              <input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Bill To</label>
            <div className="space-y-2">
              <input
                value={billTo.name}
                onChange={(e) => setBillTo({ ...billTo, name: e.target.value })}
                placeholder="Client name"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                value={billTo.address}
                onChange={(e) => setBillTo({ ...billTo, address: e.target.value })}
                placeholder="Client address"
                rows={2}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="email"
                value={billTo.email}
                onChange={(e) => setBillTo({ ...billTo, email: e.target.value })}
                placeholder="Client email"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Custom Fields</label>
            <CustomFieldsEditor fields={customFields} onChange={setCustomFields} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Line Items</label>
            <LineItemsEditor
              columns={columns}
              rows={rows}
              onColumnsChange={setColumns}
              onRowsChange={setRows}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Notes / Terms</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Payment terms, thank-you note, etc."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-gray-950 rounded-2xl p-4 overflow-auto">
          <div className="shadow-lg mx-auto" style={{ maxWidth: 640 }}>
            <InvoicePreview
              ref={previewRef}
              invoiceNumber={invoiceNumber}
              invoiceDate={invoiceDate}
              dueDate={dueDate}
              billTo={billTo}
              customFields={customFields}
              columns={columns}
              rows={rows}
              taxPct={taxPct}
              notes={notes}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceBuilderPage;
