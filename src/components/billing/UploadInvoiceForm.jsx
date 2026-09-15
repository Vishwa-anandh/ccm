import React, { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  FileStack,
  Eye,
  EyeOff,
  CloudUpload,
  FileWarning,
  RotateCcw,
} from "lucide-react";
import { getCustomers, getPaymentTerms, buildInvoice } from "../../api/billingApi";
import { parseInvoiceFile, mergeParsedInvoiceResults } from "../../utils/invoiceFileParser";
import { round2 } from "../../utils/pricingCalc";
import { formatCurrency } from "../../utils/formatters";
import { fireToast } from "../../components/ToastProvider";
import CustomFieldsEditor from "../invoice-builder/CustomFieldsEditor";
import LineItemsEditor from "../invoice-builder/LineItemsEditor";
import InvoicePreview from "../invoice-builder/InvoicePreview";
import TemplatePicker from "../invoice-builder/TemplatePicker";
import LogoPicker from "../invoice-builder/LogoPicker";
import SentEmailModal from "./SentEmailModal";
import SendInvoiceConfirmModal from "./SendInvoiceConfirmModal";
import Dropdown from "../Dropdown";

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
 * UploadInvoiceForm — the invoice builder: review the parsed line items,
 * price them, Send Invoice. Always the full /billing/generate page (never
 * embedded in a modal) — the Billing page's "Upload Invoice" button opens
 * UploadInvoiceModal.jsx, a small popup that only picks/parses the
 * file(s), then navigates here with the parsed result already in hand
 * (`initialParsed`) so this page lands straight on the builder view. A
 * direct visit to /billing/generate (no `initialParsed`) still shows this
 * component's own upload dropzone first, so the route works standalone.
 *
 * `onClose` dismisses the workflow (the "← Back to Billing" action),
 * `onCreated(invoiceId)` fires once an invoice has actually been built and
 * its "sent email" preview closed.
 */
const UploadInvoiceForm = ({ onClose, onCreated, initialParsed = null }) => {
  const previewRef = useRef(null);
  const fileInputRef = useRef(null);
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [paymentTermId, setPaymentTermId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(todayIso);
  const [serialNumber, setSerialNumber] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [billingPeriodStart, setBillingPeriodStart] = useState(todayIso);
  const [billingPeriodEnd, setBillingPeriodEnd] = useState(todayIso);
  const [taxPct, setTaxPct] = useState(0);
  const [overallAdjustmentPct, setOverallAdjustmentPct] = useState(0);
  const [template, setTemplate] = useState("classic");
  const [logo, setLogo] = useState("maitsys");
  const [customFields, setCustomFields] = useState([]);
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [sentEmail, setSentEmail] = useState(null);
  const [createdInvoiceId, setCreatedInvoiceId] = useState(null);
  const [showSendConfirm, setShowSendConfirm] = useState(false);

  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [c, terms] = await Promise.all([getCustomers(), getPaymentTerms()]);
        setCustomers(c);
        setCustomerId(c[0]?.id ?? "");
        setPaymentTerms(terms);
        setPaymentTermId(terms[0]?.id ?? "");
        // Arrived here from UploadInvoiceModal, which already parsed the
        // file(s) — land straight on the builder view with that data
        // instead of showing the dropzone again. Uses the freshly-fetched
        // `c` directly rather than the `customers` state (not yet updated
        // in this same tick) for the customer-name-guess match.
        if (initialParsed) applyParsed(initialParsed, c);
      } finally {
        setLoadingCustomers(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const customer = customers.find((c) => c.id === customerId);
  const selectedTerm = paymentTerms.find((t) => t.id === paymentTermId);
  // Due Date = Invoice Date + the selected term's day count — read-only,
  // shown so Finance can see what date it resolves to before creating.
  const computedDueDate = addDaysIso(invoiceDate, selectedTerm?.days ?? 14);
  // Displayed/stored as a plain day count ("30 days") rather than the
  // term's own editable name ("Net 30") — the name is just a label Finance
  // picks from in Payment Terms; what actually matters to a customer
  // reading the invoice is how many days they have to pay.
  const paymentTermLabel = selectedTerm ? `${selectedTerm.days} day${selectedTerm.days === 1 ? "" : "s"}` : null;
  const canCreate = customerId && rows.some((r) => r.description.trim().length > 0);

  // Same totals math as InvoicePreview/SendInvoiceConfirmModal, computed
  // here too so a running Summary can sit at the bottom of the form
  // itself — visible even with the preview pane hidden or off-screen on
  // a narrower window, not just inside the (optional) document preview.
  const lineAmounts = rows.map((r) =>
    round2(Number(r.quantity || 0) * Number(r.unitPrice || 0) * (1 - Number(r.discountPct || 0) / 100)),
  );
  const lineSubtotal = round2(lineAmounts.reduce((s, a) => s + a, 0));
  const adjustmentAmount = round2(lineSubtotal * (Number(overallAdjustmentPct || 0) / 100));
  const subtotalAfterAdjustment = round2(lineSubtotal + adjustmentAmount);
  const taxAmount = round2(subtotalAfterAdjustment * (Number(taxPct || 0) / 100));
  const totalDue = round2(subtotalAfterAdjustment + taxAmount);

  // Each line's Discount checkbox applies customer.discountPct — the
  // discount is applied by default (every row starts checked) whenever the
  // selected customer has one set; Finance unchecks specific rows to
  // exclude them. Switching to a different customer resets every row to
  // that customer's own % (0 clears it), rather than only touching rows
  // that happened to already be checked — the default should always
  // reflect whichever customer is currently selected.
  useEffect(() => {
    if (!customer) return;
    setRows((prev) => prev.map((r) => ({ ...r, discountPct: customer.discountPct ?? 0 })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id, customer?.discountPct]);

  // Applies an already-merged parse result (columns/rows/meta) to the
  // builder's state — shared by handleFiles (this page's own dropzone,
  // used for a direct /billing/generate visit or "Upload a Different
  // File") and the mount effect (arriving via UploadInvoiceModal with
  // `initialParsed`, already parsed there). `customersList` is passed in
  // explicitly rather than read from the `customers` state, since the
  // mount-effect caller has it from a just-resolved fetch, one render
  // before that state settles.
  const applyParsed = (parsed, customersList) => {
    let resolvedCustomer = customersList.find((c) => c.id === customerId);
    if (parsed.meta.customerNameGuess) {
      const guess = parsed.meta.customerNameGuess.toLowerCase();
      const match = customersList.find(
        (c) => c.name.toLowerCase().includes(guess) || guess.includes(c.name.toLowerCase()),
      );
      if (match) {
        setCustomerId(match.id);
        resolvedCustomer = match;
      }
    }
    // Newly parsed rows default to the resolved customer's Discount %
    // applied (checked) — matches the effect above, which only re-runs on
    // a customer change, not on every new set of parsed rows.
    const discountPct = resolvedCustomer?.discountPct ?? 0;
    setRows(parsed.rows.map((r) => ({ ...r, discountPct })));
    setColumns(parsed.columns);
    if (parsed.meta.invoiceDateGuess) setInvoiceDate(parsed.meta.invoiceDateGuess);
    setUploaded(true);
  };

  const handleFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList ?? []).filter(Boolean);
      if (files.length === 0) return;
      setUploading(true);
      setUploadError("");
      const parsedResults = [];
      const failed = [];
      for (const file of files) {
        try {
          parsedResults.push(await parseInvoiceFile(file));
        } catch (err) {
          failed.push({ name: file.name, message: err.message || "Couldn't read that file." });
        }
      }
      if (parsedResults.length === 0) {
        setUploading(false);
        setUploadError(failed.map((f) => `${f.name}: ${f.message}`).join(" — "));
        return;
      }

      const parsed = mergeParsedInvoiceResults(parsedResults);
      applyParsed(parsed, customers);

      const fileWord = parsedResults.length === 1 ? "file" : "files";
      const itemWord = parsed.rows.length === 1 ? "item" : "items";
      let message = `Parsed ${parsed.rows.length} line ${itemWord} from ${parsedResults.length} ${fileWord} — review before saving.`;
      if (failed.length > 0) {
        message += ` (${failed.length} file${failed.length === 1 ? "" : "s"} couldn't be read: ${failed.map((f) => f.name).join(", ")})`;
      }
      fireToast(message, failed.length > 0 ? "info" : "success");
      setUploading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customers, customerId],
  );

  const handleStartOver = () => {
    setUploaded(false);
    setRows([]);
    setColumns([]);
    setCustomFields([]);
    setUploadError("");
  };

  // "Send Invoice" opens the confirmation modal first — it never creates
  // anything by itself. Only confirming inside that modal actually builds
  // the invoice and (simulated-)emails it.
  const handleSendClick = () => {
    if (!canCreate) return;
    setError("");
    setShowSendConfirm(true);
  };

  const handleConfirmSend = async () => {
    setBusy(true);
    setError("");
    try {
      const { invoice, email } = await buildInvoice({
        customerId,
        invoiceDate,
        serialNumber,
        poNumber,
        billingPeriodStart,
        billingPeriodEnd,
        paymentTermId,
        customFields,
        columns,
        rows,
        taxPct,
        overallAdjustmentPct,
        template,
        logo,
      });
      fireToast(`Invoice ${invoice.invoiceNumber} created — emailed to ${email.to}`, "success");
      setShowSendConfirm(false);
      // Stay open with the "sent email" preview shown (real link, clickable)
      // rather than leaving immediately; closing it is what actually
      // hands off to the host (onCreated) with the new invoice's id.
      setCreatedInvoiceId(invoice.id);
      setSentEmail(email);
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't create the invoice.");
      setShowSendConfirm(false);
    } finally {
      setBusy(false);
    }
  };

  const handleCloseSentEmail = () => {
    setSentEmail(null);
    onCreated(createdInvoiceId);
  };

  return (
    <div className="p-4 sm:p-6 xl:p-8 w-full space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Billing
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <span className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-xl">
              <FileStack className="w-5 h-5 text-brand-600" />
            </span>
            Upload Invoice
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-11">
            {uploaded
              ? "Review what was parsed below — add, edit, or delete anything before saving."
              : "Upload one or more PDF/Excel/CSV invoices — every file's line items are combined into one editable list."}
          </p>
        </div>
        {uploaded && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartOver}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Upload a Different File
            </button>
            <button
              onClick={() => setShowPreview((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700"
              title={showPreview ? "Hide the invoice preview" : "Show the invoice preview"}
            >
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
            <button
              onClick={handleSendClick}
              disabled={busy || !canCreate}
              className="btn-primary disabled:opacity-50"
            >
              {busy && <RefreshCw className="w-4 h-4 animate-spin" />}
              Send Invoice
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!uploaded && (
        <div className="max-w-xl mx-auto">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-14 transition-all duration-200 bg-white dark:bg-gray-900 ${
              dragging
                ? "border-brand-500 cursor-pointer"
                : "border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700 cursor-pointer"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.xlsx,.xls,.csv"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {uploading ? (
              <>
                <RefreshCw className="w-7 h-7 text-brand-500 animate-spin mb-3" />
                <p className="text-sm font-semibold text-gray-500">Reading invoice(s)…</p>
                <p className="text-xs text-gray-400 mt-1">This may take a few seconds</p>
              </>
            ) : (
              <>
                <CloudUpload className="w-8 h-8 text-brand-500 mb-3" />
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Drop your invoice(s) here</p>
                <p className="text-xs text-gray-400 mt-1">
                  or <span className="text-brand-600 dark:text-brand-400 font-semibold">browse to upload</span>
                </p>
                <p className="text-[10px] text-gray-400 mt-3">
                  Accepts PDF, .xlsx, .xls, or .csv — select or drop multiple to combine their line items
                </p>
              </>
            )}
          </div>
          {uploadError && (
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2.5 mt-3">
              <FileWarning className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {uploaded && (
        <div className={`grid grid-cols-1 gap-6 ${showPreview ? "lg:grid-cols-2" : ""}`}>
          <div className="space-y-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-card">
            {/* Customer/Template/Logo: stacked (Customer full-width, then
                Template+Logo side by side) in the narrower two-column
                layout, but with the preview hidden this panel gets the
                full page width — spread all three into one horizontal
                row instead of leaving that space unused. The Template/
                Logo wrapper switches to `contents` in the wide layout so
                its two children become direct items of the outer 3-col
                grid, rather than nesting a second grid inside one cell. */}
            <div className={showPreview ? "space-y-5" : "grid grid-cols-3 gap-3"}>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Customer</label>
                {loadingCustomers ? (
                  <div className="skeleton rounded-xl h-10 w-full" />
                ) : (
                  <Dropdown
                    variant="input"
                    value={customerId}
                    onChange={setCustomerId}
                    options={customers.map((c) => ({
                      value: c.id,
                      label: c.discountPct > 0 ? `${c.name} — ${c.discountPct}% discount` : c.name,
                    }))}
                  />
                )}
              </div>

              <div className={showPreview ? "grid grid-cols-2 gap-3" : "contents"}>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Template</p>
                  <TemplatePicker value={template} onChange={setTemplate} compact />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Logo</p>
                  <LogoPicker value={logo} onChange={setLogo} />
                </div>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 -mt-2">
              {customer && customer.discountPct > 0
                ? `Check "Discount" on any line below to apply ${customer.name}'s ${customer.discountPct}% to it.`
                : "This customer has no Discount % set — add one in Customers to enable per-line discounts."}
            </p>

            <div className="grid grid-cols-3 gap-3">
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
                <label className="block text-xs font-semibold text-gray-500 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Optional"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">PO Number</label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="Optional"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Payment Term</label>
                {paymentTerms.length === 0 ? (
                  <p className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2.5">
                    None yet
                  </p>
                ) : (
                  <Dropdown
                    variant="input"
                    value={paymentTermId}
                    onChange={setPaymentTermId}
                    options={paymentTerms.map((t) => ({
                      value: t.id,
                      label: `${t.days} day${t.days === 1 ? "" : "s"}`,
                    }))}
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Tax %</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  // A literal "0" sitting in the box reads like it's
                  // already filled in and has to be selected-and-deleted
                  // before typing a real value — show it blank (a "0"
                  // placeholder) instead, same as PO Number's "Optional".
                  // 0 is still the real stored value until Finance types
                  // something else.
                  value={taxPct === 0 ? "" : taxPct}
                  onChange={(e) => setTaxPct(e.target.value === "" ? 0 : Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Summary Adj. %</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={overallAdjustmentPct === 0 ? "" : overallAdjustmentPct}
                  onChange={(e) => setOverallAdjustmentPct(e.target.value === "" ? 0 : Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            {paymentTerms.length === 0 && (
              <p className="text-[10px] text-gray-400 -mt-2">No payment terms yet — add one in the Payment Terms tab.</p>
            )}
            <p className="text-[10px] text-gray-400 -mt-2">
              Due Date: <span className="font-semibold text-gray-600 dark:text-gray-300">{computedDueDate}</span> — Invoice Date + the selected term's days.
            </p>

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
                discountAvailable
                customerDiscountPct={customer?.discountPct ?? 0}
              />
            </div>

            {/* Running totals — always visible at the bottom of the form
                itself, not just inside the (optional, toggle-able)
                document preview beside it. */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Summary</p>
              </div>
              <div className="px-4 py-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Line Items Subtotal</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(lineSubtotal)}</span>
                </div>
                {Number(overallAdjustmentPct || 0) !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Summary Adjustment ({overallAdjustmentPct}%)</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(adjustmentAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax ({taxPct}%)</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(taxAmount)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center px-4 py-3 bg-amber-50 dark:bg-amber-950/20">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Total Due</span>
                <span className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(totalDue)}</span>
              </div>
            </div>
          </div>

          {showPreview && (
            <div className="bg-gray-100 dark:bg-gray-950 rounded-2xl p-4 overflow-auto lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-6rem)]">
              <div className="shadow-lg mx-auto" style={{ maxWidth: 640 }}>
                <InvoicePreview
                  ref={previewRef}
                  invoiceNumber="PREVIEW"
                  invoiceDate={invoiceDate}
                  serialNumber={serialNumber}
                  poNumber={poNumber}
                  billingPeriodStart={billingPeriodStart}
                  billingPeriodEnd={billingPeriodEnd}
                  dueDate={computedDueDate}
                  paymentTermName={paymentTermLabel}
                  billTo={{
                    name: customer?.name ?? "",
                    address: customer?.billingAddress ?? "",
                    email: customer?.primaryContactEmail ?? "",
                  }}
                  shipTo={{ address: customer?.shippingAddress ?? "" }}
                  customFields={customFields}
                  columns={columns}
                  rows={rows}
                  taxPct={taxPct}
                  overallAdjustmentPct={overallAdjustmentPct}
                  notes=""
                  template={template}
                  logo={logo}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <SendInvoiceConfirmModal
        open={showSendConfirm}
        customer={customer}
        rows={rows}
        taxPct={taxPct}
        overallAdjustmentPct={overallAdjustmentPct}
        busy={busy}
        onConfirm={handleConfirmSend}
        onCancel={() => setShowSendConfirm(false)}
      />
      <SentEmailModal email={sentEmail} onClose={handleCloseSentEmail} />
    </div>
  );
};

UploadInvoiceForm.propTypes = {
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func.isRequired,
  initialParsed: PropTypes.shape({
    columns: PropTypes.array.isRequired,
    rows: PropTypes.array.isRequired,
    meta: PropTypes.object.isRequired,
  }),
};

export default UploadInvoiceForm;
