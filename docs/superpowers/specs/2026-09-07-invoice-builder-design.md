# Invoice Builder — Design

## Context

Maitsys staff sometimes need to send a client a one-off invoice that
doesn't fit the formal Billing module's flow (which requires an existing
Customer record, a configured Pricing Rule, and an approve → publish
workflow). This is a lightweight, ad-hoc alternative: a staff-only tool
to build a Maitsys-branded invoice PDF from scratch — with a fully
dynamic layout (add/remove line-item rows, add/remove entire columns,
add arbitrary custom header fields) — and download it immediately. It is
deliberately separate from the Billing module: no customer accounts, no
pricing rules, no approval workflow, no persistence.

## Access

New route `/invoice-builder`, inside `ProtectedLayout`, wrapped in the
existing `PermissionRoute` (`App.jsx`) with the same `isPrivileged` check
used for `/users` and `/sync-logs` — Finance/Admin only. A new Sidebar
nav entry sits in the existing "Administration" section (`Sidebar.jsx`,
alongside "User Management"), gated the same way the module's own
`features.customerInvoicing`-style flag gates Billing (a new
`features.invoiceBuilder: true` default, following that established
pattern).

## Data model (component-local state only — nothing persisted)

```js
{
  invoiceNumber: string,       // editable text, defaulted to a generated placeholder
  invoiceDate: string,         // date, defaults to today
  dueDate: string,             // date, defaults to +14 days
  billTo: { name, address, email },   // free text, no link to any Customer record
  customFields: [{ id, label, value }],  // arbitrary header key/value pairs
  columns: [{ id, key, label }],         // EXTRA columns only (beyond the 4 fixed ones below)
  rows: [{
    id, description, quantity, unitPrice,   // fixed/system fields, drive the Amount calc
    extra: { [columnId]: value },           // one value per extra column, plain text
  }],
  taxPct: number,
  notes: string,                // freeform terms/notes footer
}
```

**Fixed vs. custom columns:** Description, Quantity, Unit Price, and the
computed Amount (`quantity × unitPrice`, via the existing `round2` from
`src/utils/pricingCalc.js`) are permanent system columns — they always
exist and drive Subtotal/Tax/Total. "+ Add Column" only appends *extra*
columns after Amount (e.g. "SKU", "Notes per line") that hold plain text
per row and are display-only, not part of any calculation. This keeps
one predictable calculation path regardless of how staff customize the
table, rather than re-deriving the Billing module's discount/adjustment
engine for an ad-hoc tool that doesn't need it.

**Sender block** is fixed, not editable in the UI, sourced from one
constant (reusing real, already-used-elsewhere contact details): name
"Maitsys", logo `/app-logo.png`, `contact@maitsys.com`, `www.maitsys.com`.
No physical mailing address exists anywhere else in this codebase to
reuse, so that line is simply omitted rather than fabricated.

## Components

- `src/pages/InvoiceBuilderPage.jsx` — owns all state above; renders a
  left "editor" column (header fields, custom fields editor, line-items
  table editor, tax %, notes, Download button) and a right live-preview
  column showing `InvoicePreview` with the same state.
- `src/components/invoice-builder/InvoicePreview.jsx` — pure
  presentational render of the invoice document (sender block, Bill To,
  custom fields, the dynamic table, totals, notes). Takes a `forwardRef`
  so the page can pass its root DOM node into the PDF export function.
  This component is the single source of visual truth — "what you see
  is what gets exported."
- `src/components/invoice-builder/CustomFieldsEditor.jsx` and
  `LineItemsEditor.jsx` — small focused editors for their respective
  slices of state (add/remove field; add/remove row; add/remove column),
  each taking its slice of state + an `onChange` callback, no
  component reaching into a sibling's internals.
- `src/utils/exportInvoicePdf.js` — `exportInvoicePdf(node, filename)`:
  wraps `html2canvas(node)` → `jsPDF` image placement → `doc.save(filename)`.
  One function, one job, easily testable in isolation from the React tree.

## PDF export approach

**html2canvas + jsPDF** (screenshot-to-PDF), not programmatic jsPDF
layout or the browser print dialog. Reasoning: because columns and
header fields are staff-defined at runtime (arbitrary count, arbitrary
labels), a programmatic-layout approach would mean hand-writing generic
dynamic-table positioning math for a shape that can change per invoice —
real added complexity for no benefit here. With html2canvas, the already
laid-out `InvoicePreview` DOM (built with the same Tailwind/Card
conventions as the rest of the app) is captured directly, so however
many columns or fields staff add, there's no separate layout code path
to keep in sync. Trade-off accepted: output is a raster image (slightly
larger file, non-selectable text) — acceptable for an internal ad-hoc
tool, not a concern for the formal, customer-facing Billing module
invoices (which remain untouched by this feature).

New dependencies: `html2canvas`, `jspdf` (both added via `npm install`,
no other packages in the project currently provide this).

## Error handling

- Empty/zero rows: Download button disabled until at least one row has
  a non-empty description.
- `exportInvoicePdf` wraps the html2canvas/jsPDF calls in try/catch and
  surfaces a `fireToast` error (matching the existing toast convention
  used throughout the app) rather than a silent failure.
- No network calls are involved at all — this feature has no backend
  dependency, mocked or otherwise, so it's unaffected by demo-mode.

## Testing / verification

1. `npm install` picks up the two new dependencies cleanly.
2. Log in as the seeded (privileged) demo user, open **Invoice
   Builder** from the sidebar.
3. Add two line-item rows, add one extra column (e.g. "SKU") and confirm
   it appears on every row in both the editor and the live preview.
4. Add a custom header field (e.g. "PO Number") and confirm it renders
   in the preview.
5. Set a tax %, confirm Subtotal/Tax/Total in the preview match
   `quantity × unitPrice` summed across rows.
6. Click Download — confirm a PDF file is produced (verify via a
   headless Playwright run, as used earlier in this session, checking
   for the browser's download event) and that it visually matches the
   on-screen preview.
7. Confirm the route is inaccessible (redirected / access-denied) when
   not logged in as a privileged user, matching `/users`' existing
   behavior.
