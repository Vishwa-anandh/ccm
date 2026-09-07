# Invoice Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a staff-only, ad-hoc invoice builder at `/invoice-builder` — a fully dynamic invoice document (add/remove line-item rows, add/remove entire table columns, add arbitrary custom header fields) that exports to a downloadable branded PDF, entirely separate from the existing Billing module.

**Architecture:** A single page (`InvoiceBuilderPage`) owns all component-local state (nothing persisted, no API calls). It renders an editor column (built from two small focused sub-editors: `CustomFieldsEditor`, `LineItemsEditor`) next to a live-preview column (`InvoicePreview`), which is also the exact DOM node captured into the PDF via `exportInvoicePdf`. Gated behind the existing `PermissionRoute`/`isPrivileged` convention, same as `/users`.

**Tech Stack:** React 19 (existing), `html2canvas` + `jspdf` (new deps, screenshot-to-PDF), existing `round2` (`src/utils/pricingCalc.js`) and `formatCurrency` (`src/utils/formatters.js`) utilities, existing `fireToast` (`src/components/ToastProvider.jsx`).

**Spec:** `docs/superpowers/specs/2026-09-07-invoice-builder-design.md`

## Global Constraints

- No test framework (vitest/jest/etc.) is configured anywhere in this project, and none is being introduced for this feature. Every task's verification step instead uses this project's actual established method (used throughout this session): curl the running Vite dev server for each new/changed file to confirm it transforms without a compile error, plus a final full Playwright browser-driven pass in the last task.
- This project has no git repository initialized (`git status` reports "not a git repository"). Skip every git add/commit step below — saving the file is the durable checkpoint for each task.
- The dev server is expected to be running via `npm run dev` (Vite) before starting; if not, start it in the background before Task 1's verification step. Adjust the port in curl commands below if it differs from `5174`.
- Row shape is always `{ id, description, quantity, unitPrice, extra }` where `extra` is `{ [columnId]: string }`. Column shape is always `{ id, label }`. These exact shapes are used unchanged across every task below — do not introduce a separate `key` field on columns; `column.id` is the lookup key into `row.extra`.

---

### Task 1: PDF export utility + dependencies

**Files:**
- Modify: `package.json` (adds `html2canvas`, `jspdf`)
- Create: `src/utils/exportInvoicePdf.js`

**Interfaces:**
- Produces: `exportInvoicePdf(node: HTMLElement, filename: string): Promise<void>` — captures `node` and triggers a PDF download. Later tasks (Task 5) call this exactly.

- [ ] **Step 1: Install the two new dependencies**

Run:
```bash
cd "C:/Users/vishw/Downloads/ccm" && npm install html2canvas jspdf
```
Expected: `package.json`'s `dependencies` now include `html2canvas` and `jspdf`; command exits 0.

- [ ] **Step 2: Create the export utility**

Write `src/utils/exportInvoicePdf.js`:

```js
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * exportInvoicePdf — captures a DOM node (the InvoicePreview root) and
 * saves it as a downloadable, possibly multi-page, PDF. The preview is
 * the single source of truth for layout: whatever renders there is what
 * ends up in the file.
 */
export async function exportInvoicePdf(node, filename) {
  const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}
```

- [ ] **Step 3: Verify it compiles**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5174/src/utils/exportInvoicePdf.js
```
Expected: `200`

---

### Task 2: InvoicePreview component

**Files:**
- Create: `src/components/invoice-builder/InvoicePreview.jsx`

**Interfaces:**
- Consumes: `round2` from `../../utils/pricingCalc` (existing, exported), `formatCurrency` from `../../utils/formatters` (existing, exported).
- Produces: default export `InvoicePreview`, a `forwardRef` component with props `{ invoiceNumber: string, invoiceDate: string, dueDate: string, billTo: {name,address,email}, customFields: [{id,label,value}], columns: [{id,label}], rows: [{id,description,quantity,unitPrice,extra}], taxPct: number, notes: string }`. The forwarded ref attaches to the root `<div>` — Task 5 passes this ref into `exportInvoicePdf`.

- [ ] **Step 1: Write the component**

Write `src/components/invoice-builder/InvoicePreview.jsx`:

```jsx
import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import { round2 } from "../../utils/pricingCalc";
import { formatCurrency } from "../../utils/formatters";

const MAITSYS_SENDER = {
  name: "Maitsys",
  logo: "/app-logo.png",
  email: "contact@maitsys.com",
  website: "www.maitsys.com",
};

/**
 * InvoicePreview — the single source of visual truth for the invoice
 * document. Whatever renders here is exactly what exportInvoicePdf()
 * captures into the downloaded PDF.
 */
const InvoicePreview = forwardRef(
  ({ invoiceNumber, invoiceDate, dueDate, billTo, customFields, columns, rows, taxPct, notes }, ref) => {
    const lineAmounts = rows.map((r) => round2(Number(r.quantity || 0) * Number(r.unitPrice || 0)));
    const subtotal = round2(lineAmounts.reduce((s, a) => s + a, 0));
    const tax = round2(subtotal * (Number(taxPct || 0) / 100));
    const total = round2(subtotal + tax);

    return (
      <div ref={ref} className="bg-white text-gray-900 p-10 w-full" style={{ minHeight: 600 }}>
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src={MAITSYS_SENDER.logo} alt="Maitsys" className="w-12 h-12 object-contain" />
            <div>
              <p className="font-bold text-lg">{MAITSYS_SENDER.name}</p>
              <p className="text-xs text-gray-500">{MAITSYS_SENDER.email}</p>
              <p className="text-xs text-gray-500">{MAITSYS_SENDER.website}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tracking-tight">INVOICE</p>
            <p className="text-sm font-mono text-gray-600">#{invoiceNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-wide mb-1">BILL TO</p>
            <p className="font-semibold">{billTo.name || "—"}</p>
            <p className="text-xs text-gray-500 whitespace-pre-line">{billTo.address}</p>
            <p className="text-xs text-gray-500">{billTo.email}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs text-gray-500">
              Invoice Date: <span className="font-semibold text-gray-800">{invoiceDate}</span>
            </p>
            <p className="text-xs text-gray-500">
              Due Date: <span className="font-semibold text-gray-800">{dueDate}</span>
            </p>
            {customFields.map((f) => (
              <p key={f.id} className="text-xs text-gray-500">
                {f.label}: <span className="font-semibold text-gray-800">{f.value}</span>
              </p>
            ))}
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-gray-800 text-[10px] font-bold text-gray-500 tracking-wide">
              <th className="text-left py-2">Description</th>
              <th className="text-right py-2">Qty</th>
              <th className="text-right py-2">Unit Price</th>
              {columns.map((c) => (
                <th key={c.id} className="text-left py-2">
                  {c.label}
                </th>
              ))}
              <th className="text-right py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-b border-gray-100">
                <td className="py-2">{r.description}</td>
                <td className="py-2 text-right">{r.quantity}</td>
                <td className="py-2 text-right">{formatCurrency(r.unitPrice)}</td>
                {columns.map((c) => (
                  <td key={c.id} className="py-2">
                    {r.extra[c.id] ?? ""}
                  </td>
                ))}
                <td className="py-2 text-right font-semibold">{formatCurrency(lineAmounts[i])}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-8">
          <div className="w-56 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax ({taxPct}%)</span>
              <span className="font-semibold">{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-base border-t-2 border-gray-800 pt-1 mt-1">
              <span className="font-bold">Total Due</span>
              <span className="font-bold">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {notes && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-wide mb-1">NOTES</p>
            <p className="text-xs text-gray-600 whitespace-pre-line">{notes}</p>
          </div>
        )}
      </div>
    );
  },
);

InvoicePreview.displayName = "InvoicePreview";

InvoicePreview.propTypes = {
  invoiceNumber: PropTypes.string.isRequired,
  invoiceDate: PropTypes.string.isRequired,
  dueDate: PropTypes.string.isRequired,
  billTo: PropTypes.shape({
    name: PropTypes.string,
    address: PropTypes.string,
    email: PropTypes.string,
  }).isRequired,
  customFields: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string, label: PropTypes.string, value: PropTypes.string }),
  ).isRequired,
  columns: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, label: PropTypes.string })).isRequired,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  taxPct: PropTypes.number.isRequired,
  notes: PropTypes.string,
};

export default InvoicePreview;
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5174/src/components/invoice-builder/InvoicePreview.jsx
```
Expected: `200`

---

### Task 3: CustomFieldsEditor component

**Files:**
- Create: `src/components/invoice-builder/CustomFieldsEditor.jsx`

**Interfaces:**
- Produces: default export `CustomFieldsEditor`, props `{ fields: [{id,label,value}], onChange: (fields) => void }`. Task 5 owns the `customFields` state and passes it + `setCustomFields` straight through as these props.

- [ ] **Step 1: Write the component**

Write `src/components/invoice-builder/CustomFieldsEditor.jsx`:

```jsx
import React from "react";
import PropTypes from "prop-types";
import { Plus, Trash2 } from "lucide-react";

/**
 * CustomFieldsEditor — arbitrary label/value pairs shown in the invoice
 * header (e.g. "PO Number: PO-1234"), beyond the standard Invoice #/Date/
 * Due Date fields. Each field is independently addable/removable.
 */
const CustomFieldsEditor = ({ fields, onChange }) => {
  const addField = () => {
    onChange([...fields, { id: crypto.randomUUID(), label: "", value: "" }]);
  };

  const updateField = (id, key, val) => {
    onChange(fields.map((f) => (f.id === id ? { ...f, [key]: val } : f)));
  };

  const removeField = (id) => {
    onChange(fields.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-2">
      {fields.map((f) => (
        <div key={f.id} className="flex items-center gap-2">
          <input
            value={f.label}
            onChange={(e) => updateField(f.id, "label", e.target.value)}
            placeholder="Field label (e.g. PO Number)"
            className="w-1/2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs"
          />
          <input
            value={f.value}
            onChange={(e) => updateField(f.id, "value", e.target.value)}
            placeholder="Value"
            className="w-1/2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs"
          />
          <button
            type="button"
            onClick={() => removeField(f.id)}
            className="text-red-500 hover:text-red-600 p-1.5 rounded-lg shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addField}
        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        <Plus className="w-3.5 h-3.5" /> Add Field
      </button>
    </div>
  );
};

CustomFieldsEditor.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default CustomFieldsEditor;
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5174/src/components/invoice-builder/CustomFieldsEditor.jsx
```
Expected: `200`

---

### Task 4: LineItemsEditor component

**Files:**
- Create: `src/components/invoice-builder/LineItemsEditor.jsx`

**Interfaces:**
- Consumes: `round2` from `../../utils/pricingCalc` (existing, exported).
- Produces: default export `LineItemsEditor`, props `{ columns: [{id,label}], rows: [{id,description,quantity,unitPrice,extra}], onColumnsChange: (columns) => void, onRowsChange: (rows) => void }`. Task 5 owns `columns`/`rows` state and passes them + their setters straight through.

- [ ] **Step 1: Write the component**

Write `src/components/invoice-builder/LineItemsEditor.jsx`:

```jsx
import React from "react";
import PropTypes from "prop-types";
import { Plus, Trash2, Columns } from "lucide-react";
import { round2 } from "../../utils/pricingCalc";

/**
 * LineItemsEditor — the dynamic rows + columns editor. Description/
 * Quantity/Unit Price/Amount are fixed system fields (Amount is always
 * computed, never entered directly); "+ Add Column" appends extra,
 * display-only text columns that appear on every row.
 */
const LineItemsEditor = ({ columns, rows, onColumnsChange, onRowsChange }) => {
  const addRow = () => {
    onRowsChange([
      ...rows,
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, extra: {} },
    ]);
  };

  const removeRow = (id) => {
    onRowsChange(rows.filter((r) => r.id !== id));
  };

  const updateRow = (id, key, value) => {
    onRowsChange(rows.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  };

  const updateRowExtra = (id, columnId, value) => {
    onRowsChange(
      rows.map((r) => (r.id === id ? { ...r, extra: { ...r.extra, [columnId]: value } } : r)),
    );
  };

  const addColumn = () => {
    onColumnsChange([...columns, { id: crypto.randomUUID(), label: "New Column" }]);
  };

  const updateColumnLabel = (id, label) => {
    onColumnsChange(columns.map((c) => (c.id === id ? { ...c, label } : c)));
  };

  const removeColumn = (id) => {
    onColumnsChange(columns.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] font-bold text-gray-400 tracking-wide">
              <th className="text-left px-2 py-1.5">Description</th>
              <th className="text-right px-2 py-1.5 w-20">Qty</th>
              <th className="text-right px-2 py-1.5 w-24">Unit Price</th>
              {columns.map((c) => (
                <th key={c.id} className="text-left px-2 py-1.5 w-28">
                  <div className="flex items-center gap-1">
                    <input
                      value={c.label}
                      onChange={(e) => updateColumnLabel(c.id, e.target.value)}
                      className="w-full bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 font-bold text-gray-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeColumn(c.id)}
                      className="text-red-400 hover:text-red-600 shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </th>
              ))}
              <th className="text-right px-2 py-1.5 w-24">Amount</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const amount = round2(Number(r.quantity || 0) * Number(r.unitPrice || 0));
              return (
                <tr key={r.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-2 py-1.5">
                    <input
                      value={r.description}
                      onChange={(e) => updateRow(r.id, "description", e.target.value)}
                      placeholder="Item description"
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={r.quantity}
                      onChange={(e) => updateRow(r.id, "quantity", Number(e.target.value))}
                      className="w-full text-right bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={r.unitPrice}
                      onChange={(e) => updateRow(r.id, "unitPrice", Number(e.target.value))}
                      className="w-full text-right bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1"
                    />
                  </td>
                  {columns.map((c) => (
                    <td key={c.id} className="px-2 py-1.5">
                      <input
                        value={r.extra[c.id] ?? ""}
                        onChange={(e) => updateRowExtra(r.id, c.id, e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-right font-bold tabular-nums text-gray-700 dark:text-gray-300">
                    {amount.toFixed(2)}
                  </td>
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => removeRow(r.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          <Plus className="w-3.5 h-3.5" /> Add Row
        </button>
        <button
          type="button"
          onClick={addColumn}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          <Columns className="w-3.5 h-3.5" /> Add Column
        </button>
      </div>
    </div>
  );
};

LineItemsEditor.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string.isRequired }),
  ).isRequired,
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
      unitPrice: PropTypes.number.isRequired,
      extra: PropTypes.object.isRequired,
    }),
  ).isRequired,
  onColumnsChange: PropTypes.func.isRequired,
  onRowsChange: PropTypes.func.isRequired,
};

export default LineItemsEditor;
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5174/src/components/invoice-builder/LineItemsEditor.jsx
```
Expected: `200`

---

### Task 5: InvoiceBuilderPage — wire it all together

**Files:**
- Create: `src/pages/InvoiceBuilderPage.jsx`

**Interfaces:**
- Consumes: `CustomFieldsEditor` (Task 3), `LineItemsEditor` (Task 4), `InvoicePreview` (Task 2), `exportInvoicePdf` (Task 1), `fireToast` from `../components/ToastProvider` (existing, exported).
- Produces: default export `InvoiceBuilderPage`, a route-level page component with no props. Task 6 imports and routes to this.

- [ ] **Step 1: Write the page**

Write `src/pages/InvoiceBuilderPage.jsx`:

```jsx
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
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5174/src/pages/InvoiceBuilderPage.jsx
```
Expected: `200`

---

### Task 6: Routing, sidebar nav, and feature flag wiring

**Files:**
- Modify: `src/App.jsx` (add import + route)
- Modify: `src/components/Sidebar.jsx` (add icon import + nav entry)
- Modify: `src/context/AuthContext.jsx` (add `invoiceBuilder: true` to the `features` fallback default)
- Modify: `src/api/demoBackend.js` (add `invoiceBuilder: true` to `DEMO_USER.features`)

**Interfaces:**
- Consumes: `InvoiceBuilderPage` (Task 5), existing `PermissionRoute` + `isPrivileged` (`src/App.jsx`, already defined), existing `features` flag convention (`AuthContext.jsx`/`demoBackend.js`, already established by the Billing module).

- [ ] **Step 1: Add the route in `src/App.jsx`**

Find this existing import line:
```jsx
import InvoiceDemoPage from "./pages/InvoiceDemoPage";
```
Add immediately after it:
```jsx
import InvoiceBuilderPage from "./pages/InvoiceBuilderPage";
```

Find this existing route (inside the `ProtectedLayout` route block):
```jsx
                  <Route
                    path="/sync-logs"
                    element={
                      <PermissionRoute
                        check={(u) => isPrivileged(u)}
                        label="Sync Logs"
                      >
                        <SyncLogsPage />
                      </PermissionRoute>
                    }
                  />
```
Add immediately after it:
```jsx
                  <Route
                    path="/invoice-builder"
                    element={
                      <PermissionRoute
                        check={(u) => isPrivileged(u)}
                        label="Invoice Builder"
                      >
                        <InvoiceBuilderPage />
                      </PermissionRoute>
                    }
                  />
```

- [ ] **Step 2: Add the icon import and nav entry in `src/components/Sidebar.jsx`**

Find this existing import block:
```jsx
  User as UserIcon,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
} from "lucide-react";
```
Change it to:
```jsx
  User as UserIcon,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  FileEdit,
} from "lucide-react";
```

Find this existing block (inside the `isAdmin &&` Administration section):
```jsx
          <NavTooltip label="User Management" icon={Users} collapsed={iconOnly}>
            <NavLink to="/users" onClick={closeMobileMenu} className={({ isActive }) => ni(isActive)}>
              <Users className="w-5 h-5 shrink-0" />{!iconOnly && <span>User Management</span>}
            </NavLink>
          </NavTooltip>
```
Add immediately after it (still inside the same `isAdmin &&` block, gated by the new feature flag exactly like `features.syncLogs` is right below it):
```jsx

          {features.invoiceBuilder ? (
            <NavTooltip label="Invoice Builder" icon={FileEdit} collapsed={iconOnly}>
              <NavLink to="/invoice-builder" onClick={closeMobileMenu} className={({ isActive }) => ni(isActive)}>
                <FileEdit className="w-5 h-5 shrink-0" />{!iconOnly && <span>Invoice Builder</span>}
              </NavLink>
            </NavTooltip>
          ) : (
            <LockedNavItem icon={FileEdit} label="Invoice Builder" collapsed={iconOnly} />
          )}
```

- [ ] **Step 3: Add the feature flag default in `src/context/AuthContext.jsx`**

Find:
```js
    const features      = user?.features      ?? {
        budgets: true, smartAlerts: true, syncLogs: true,
        recommendations: true, cloudManagement: true, invoices: true,
        customerInvoicing: true,
    };
```
Change to:
```js
    const features      = user?.features      ?? {
        budgets: true, smartAlerts: true, syncLogs: true,
        recommendations: true, cloudManagement: true, invoices: true,
        customerInvoicing: true, invoiceBuilder: true,
    };
```

- [ ] **Step 4: Add the same flag to the demo user in `src/api/demoBackend.js`**

Find:
```js
  features: {
    budgets: true,
    smartAlerts: true,
    syncLogs: true,
    recommendations: true,
    cloudManagement: true,
    invoices: true,
    customerInvoicing: true,
  },
```
Change to:
```js
  features: {
    budgets: true,
    smartAlerts: true,
    syncLogs: true,
    recommendations: true,
    cloudManagement: true,
    invoices: true,
    customerInvoicing: true,
    invoiceBuilder: true,
  },
```

- [ ] **Step 5: Verify all four files compile**

Run:
```bash
for f in "src/App.jsx" "src/components/Sidebar.jsx" "src/context/AuthContext.jsx" "src/api/demoBackend.js"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5174/$f")
  echo "$code  $f"
done
```
Expected: `200` for all four lines.

---

### Task 7: End-to-end verification

**Files:**
- Create (scratchpad, not part of the app): a temporary Playwright script, e.g. `test-invoice-builder.mjs`, in this session's scratchpad directory — same tool/pattern already used earlier in this session for the Billing module (`playwright` npm package + Chromium already installed there).

**Interfaces:**
- Consumes: the fully wired app from Tasks 1–6.
- Produces: a pass/fail confirmation with screenshots; no application code.

- [ ] **Step 1: Write the verification script**

In the scratchpad directory used earlier this session (where `playwright` is already installed), write a script that:
1. Logs in via the existing demo-mode login (any email/password).
2. Navigates to `/invoice-builder`.
3. Fills Bill To name, adds two rows with descriptions/quantities/prices, clicks "Add Column", types a column label, fills that column's value on both rows, adds one custom header field, sets a tax %.
4. Listens for the page's `download` event, clicks "Download PDF", and asserts a download fired with a `.pdf` filename.
5. Collects `pageerror`/console `error` events throughout and prints them (expect none).

- [ ] **Step 2: Run it**

Run the script with Node (same invocation style as the earlier `test-billing.mjs` run this session).
Expected: script prints no console/page errors, and confirms a `.pdf` download fired.

- [ ] **Step 3: Manually confirm access control**

Using the same script or a quick manual check, confirm that visiting `/invoice-builder` while NOT logged in redirects to `/login`, matching the existing `/users` behavior (no separate code path needed — this falls out of `ProtectedLayout` + `PermissionRoute`, already exercised by other privileged routes).
