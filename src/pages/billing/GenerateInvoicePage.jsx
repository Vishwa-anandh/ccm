import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, AlertTriangle, FileStack, Eye, EyeOff } from "lucide-react";
import { getCustomers, getPricingRules, getPaymentTerms, buildInvoice } from "../../api/billingApi";
import { fireToast } from "../../components/ToastProvider";
import CustomFieldsEditor from "../../components/invoice-builder/CustomFieldsEditor";
import LineItemsEditor from "../../components/invoice-builder/LineItemsEditor";
import InvoicePreview from "../../components/invoice-builder/InvoicePreview";
import TemplatePicker from "../../components/invoice-builder/TemplatePicker";
import PctRuleInput from "../../components/billing/PctRuleInput";

const todayIso = () => new Date().toISOString().slice(0, 10);
// Pure calendar-date arithmetic via Date.UTC, deliberately never touching
// the browser's local timezone — parsing "YYYY-MM-DDT00:00:00" as local
// time and adding milliseconds crosses DST boundaries and silently lands
// on the wrong day (caught during verification: Sep 10 + 60 days landed
// on Nov 8 instead of Nov 9 in a DST-observing timezone).
const addDaysIso = (dateStr, days) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

/**
 * GenerateInvoicePage — /billing/generate ("Create Invoice"). Finance
 * builds a Customer Invoice by hand: pick a customer, then use the same
 * dynamic rows/columns/custom-fields editors as the standalone Invoice
 * Builder, with a live document preview and a choice of visual template. A
 * full page (not a modal) so the preview has real room, matching the
 * standalone /invoice-builder layout. There's no vendor data behind a
 * manually built invoice, so each line starts with 0% discount/adjustment;
 * Finance can still edit those inline afterward, exactly like an
 * auto-pulled invoice. Created invoices are immediately final and visible
 * — no Draft/Approved step.
 */
const GenerateInvoicePage = () => {
  const navigate = useNavigate();
  const previewRef = useRef(null);
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [pricingRules, setPricingRules] = useState([]);
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [paymentTermId, setPaymentTermId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(todayIso);
  const [taxPct, setTaxPct] = useState(0);
  const [overallAdjustmentPct, setOverallAdjustmentPct] = useState(0);
  const [template, setTemplate] = useState("classic");
  const [customFields, setCustomFields] = useState([]);
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([
    { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, discountPct: 0, extra: {} },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const [c, rules, terms] = await Promise.all([getCustomers(), getPricingRules(), getPaymentTerms()]);
        setCustomers(c);
        setCustomerId(c[0]?.id ?? "");
        setPricingRules(rules);
        setPaymentTerms(terms);
        setPaymentTermId(terms[0]?.id ?? "");
      } finally {
        setLoadingCustomers(false);
      }
    })();
  }, []);

  const customer = customers.find((c) => c.id === customerId);
  const selectedTerm = paymentTerms.find((t) => t.id === paymentTermId);
  // Due Date = Invoice Date + the selected term's day count — read-only,
  // shown so Finance can see what date it resolves to before creating.
  const computedDueDate = addDaysIso(invoiceDate, selectedTerm?.days ?? 14);
  const canCreate = customerId && rows.some((r) => r.description.trim().length > 0);

  const handleCreate = async () => {
    if (!canCreate) return;
    setBusy(true);
    setError("");
    try {
      const invoice = await buildInvoice({
        customerId,
        invoiceDate,
        paymentTermId,
        customFields,
        columns,
        rows,
        taxPct,
        overallAdjustmentPct,
        template,
      });
      fireToast(`Invoice ${invoice.invoiceNumber} created`, "success");
      navigate("/billing", { state: { selectedInvoiceId: invoice.id } });
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't create the invoice.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 xl:p-8 w-full space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => navigate("/billing")}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Billing
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <span className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-xl">
              <FileStack className="w-5 h-5 text-brand-600" />
            </span>
            Create Invoice
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-11">
            Add line items, columns, and custom fields by hand — the preview updates live.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700"
            title={showPreview ? "Hide the invoice preview" : "Show the invoice preview"}
          >
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
          <button
            onClick={handleCreate}
            disabled={busy || !canCreate}
            className="btn-primary disabled:opacity-50"
          >
            {busy && <RefreshCw className="w-4 h-4 animate-spin" />}
            Create Invoice
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className={`grid grid-cols-1 gap-6 ${showPreview ? "lg:grid-cols-2" : ""}`}>
        <div className="space-y-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-card">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Customer</label>
            {loadingCustomers ? (
              <div className="skeleton rounded-xl h-10 w-full" />
            ) : (
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-semibold"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <p className="text-[10px] text-gray-400 -mt-2">
            Pick a Pricing Rule or type a custom % for each line's Discount below. Maitsys Adjustment % is set afterward, right on the created invoice.
          </p>

          <div className="grid grid-cols-2 gap-3">
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
              <label className="block text-xs font-semibold text-gray-500 mb-1">Payment Term</label>
              {paymentTerms.length === 0 ? (
                <p className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2.5">
                  No payment terms yet — add one in the Payment Terms tab.
                </p>
              ) : (
                <select
                  value={paymentTermId}
                  onChange={(e) => setPaymentTermId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                >
                  {paymentTerms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.days} days)
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <p className="text-[10px] text-gray-400 -mt-2">
            Due Date: <span className="font-semibold text-gray-600 dark:text-gray-300">{computedDueDate}</span> — Invoice Date + the selected term's days.
          </p>

          <div className="grid grid-cols-2 gap-3">
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
              <label className="block text-xs font-semibold text-gray-500 mb-1">Overall Adjustment %</label>
              <PctRuleInput value={overallAdjustmentPct} onChange={setOverallAdjustmentPct} rules={pricingRules} />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 tracking-wide">Template</p>
            <TemplatePicker value={template} onChange={setTemplate} />
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
              pricingRules={pricingRules}
            />
          </div>
        </div>

        {showPreview && (
          <div className="bg-gray-100 dark:bg-gray-950 rounded-2xl p-4 overflow-auto lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-6rem)]">
            <div className="shadow-lg mx-auto" style={{ maxWidth: 640 }}>
              <InvoicePreview
                ref={previewRef}
                invoiceNumber="PREVIEW"
                invoiceDate={invoiceDate}
                dueDate={computedDueDate}
                billTo={{
                  name: customer?.name ?? "",
                  address: customer?.billingAddress ?? "",
                  email: customer?.primaryContactEmail ?? "",
                }}
                customFields={customFields}
                columns={columns}
                rows={rows}
                taxPct={taxPct}
                overallAdjustmentPct={overallAdjustmentPct}
                notes=""
                template={template}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateInvoicePage;
