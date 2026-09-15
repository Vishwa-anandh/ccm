import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import { round2 } from "../../utils/pricingCalc";
import { formatCurrency } from "../../utils/formatters";
import { CCM_LOGO_SRC, MAITSYS_LOGO_SRC } from "./InvoiceLogos";

// Two selectable sender identities ("logo" prop). CCM's mark
// (/app-logo.png) is icon-only, so its name/email/website print beside
// it; Maitsys's mark (/maitsys-logo.png) is a full wordmark that already
// contains "MAITSYS", so only email/website print beside it — repeating
// the name would be redundant.
const SENDER_PROFILES = {
  maitsys: { name: "Maitsys", email: "contact@maitsys.com", website: "www.maitsys.com" },
  ccm: { name: "CCM", email: "billing@ccm.io", website: "www.ccm.io" },
};

/**
 * InvoicePreview — the single source of visual truth for the invoice
 * document. Whatever renders here is exactly what exportInvoicePdf()
 * captures into the downloaded PDF. Layout modeled after a real vendor
 * invoice (Microsoft's Azure billing PDF): sender + a highlighted
 * "Invoice Summary" card up top, Bill To, a Billing Summary total box,
 * then the line-item table — restyled with this app's own brand colors
 * instead of the source's yellow/Microsoft branding.
 */
const InvoicePreview = forwardRef(
  (
    {
      invoiceNumber,
      invoiceDate,
      serialNumber,
      poNumber,
      billingPeriodStart,
      billingPeriodEnd,
      dueDate,
      paymentTermName,
      billTo,
      customFields,
      columns,
      rows,
      taxPct,
      overallAdjustmentPct = 0,
      notes,
      template = "classic",
      logo = "maitsys",
    },
    ref,
  ) => {
    // Folds each row's own Discount % (set via LineItemsEditor's optional
    // Discount column — undefined/0 for callers that don't offer it, e.g.
    // the standalone Invoice Builder) into the printed Amount.
    const lineAmounts = rows.map((r) =>
      round2(Number(r.quantity || 0) * Number(r.unitPrice || 0) * (1 - Number(r.discountPct || 0) / 100)),
    );
    const lineSubtotal = round2(lineAmounts.reduce((s, a) => s + a, 0));
    const adjustmentAmount = round2(lineSubtotal * (Number(overallAdjustmentPct || 0) / 100));
    const subtotal = round2(lineSubtotal + adjustmentAmount);
    const tax = round2(subtotal * (Number(taxPct || 0) / 100));
    const total = round2(subtotal + tax);
    const modern = template === "modern";
    const sender = SENDER_PROFILES[logo] ?? SENDER_PROFILES.maitsys;
    const hasDiscountColumn = rows.some((r) => Number(r.discountPct || 0) !== 0);

    return (
      <div ref={ref} className="bg-white text-gray-900 w-full" style={{ minHeight: 600 }}>
        <div className={`flex items-start justify-between p-10 pb-6 ${modern ? "bg-brand-600 text-white" : ""}`}>
          <div className="flex flex-col items-start gap-1.5 min-w-0">
            {logo === "ccm" ? (
              <>
                <div className="flex items-center gap-2">
                  <img src={CCM_LOGO_SRC} alt="CCM" className="w-8 h-8 object-contain shrink-0" />
                  <p className="font-bold text-lg">{sender.name}</p>
                </div>
                <p className={`text-xs ${modern ? "text-white/80" : "text-gray-500"}`}>{sender.email}</p>
                <p className={`text-xs ${modern ? "text-white/80" : "text-gray-500"}`}>{sender.website}</p>
              </>
            ) : (
              <>
                <img src={MAITSYS_LOGO_SRC} alt="Maitsys" className="h-10 w-auto max-w-[200px] object-contain shrink-0" />
                <p className={`text-xs ${modern ? "text-white/80" : "text-gray-500"}`}>{sender.email}</p>
                <p className={`text-xs ${modern ? "text-white/80" : "text-gray-500"}`}>{sender.website}</p>
              </>
            )}
          </div>
          <p className="text-2xl font-bold tracking-tight shrink-0">INVOICE</p>
        </div>

        <div className="grid grid-cols-2 gap-6 px-10 pt-6">
          {/* Bill To */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-wide mb-1">BILL TO</p>
            <p className="font-semibold">{billTo.name || "—"}</p>
            {/* break-words: a long single-line address (no manual newlines
                typed by Finance) still wraps to fit this column instead of
                overflowing straight across the page. */}
            <p className="text-xs text-gray-500 whitespace-pre-line break-words max-w-[260px]">{billTo.address}</p>
            <p className="text-xs text-gray-500 break-words max-w-[260px]">{billTo.email}</p>
          </div>

          {/* Invoice Summary card */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-700">Invoice Summary</p>
            </div>
            <div className="px-4 py-3 space-y-1.5 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Invoice Number</span>
                <span className="font-semibold text-gray-800 font-mono">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Invoice Date</span>
                <span className="font-semibold text-gray-800">{invoiceDate}</span>
              </div>
              {serialNumber && (
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Serial Number</span>
                  <span className="font-semibold text-gray-800">{serialNumber}</span>
                </div>
              )}
              {poNumber && (
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">PO Number</span>
                  <span className="font-semibold text-gray-800">{poNumber}</span>
                </div>
              )}
              {paymentTermName && (
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Payment Terms</span>
                  <span className="font-semibold text-gray-800">{paymentTermName}</span>
                </div>
              )}
              {customFields.map((f) => (
                <div key={f.id} className="flex justify-between gap-3">
                  <span className="text-gray-500">{f.label}</span>
                  <span className="font-semibold text-gray-800">{f.value}</span>
                </div>
              ))}
            </div>
            <div className={`px-4 py-3 ${modern ? "bg-brand-50" : "bg-amber-50"}`}>
              <p className="text-[10px] font-bold text-gray-500 tracking-wide">TOTAL DUE · Due on {dueDate}</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(total)}</p>
            </div>
          </div>
        </div>

        {/* Full-width statement, not a cramped two-column row — mirrors the
            reference vendor invoice's own "This invoice is for the billing
            period X - Y" line, which needs the page's full width to read
            cleanly (a Billing Period date range is too long to sit as a
            label/value pair inside the narrow Invoice Summary card). */}
        {billingPeriodStart && billingPeriodEnd && (
          <p className="px-10 pt-4 text-sm text-gray-700">
            This invoice is for the billing period{" "}
            <span className="font-semibold">
              {billingPeriodStart} – {billingPeriodEnd}
            </span>
            .
          </p>
        )}

        <div className="px-10 py-8">
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-800 text-[10px] font-bold text-gray-500 tracking-wide">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Unit Price</th>
                {hasDiscountColumn && <th className="text-right py-2">Discount %</th>}
                <th className="text-right py-2">Amount</th>
                {columns.map((c) => (
                  <th key={c.id} className="text-left py-2">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="py-2">{r.description}</td>
                  <td className="py-2 text-right">{r.quantity}</td>
                  <td className="py-2 text-right">{formatCurrency(r.unitPrice)}</td>
                  {hasDiscountColumn && (
                    <td className="py-2 text-right">{r.discountPct ? `${r.discountPct}%` : "—"}</td>
                  )}
                  <td className="py-2 text-right font-semibold">{formatCurrency(lineAmounts[i])}</td>
                  {columns.map((c) => (
                    <td key={c.id} className="py-2">
                      {r.extra[c.id] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-8">
            <div className="w-64 rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(lineSubtotal)}</span>
                </div>
                {Number(overallAdjustmentPct || 0) !== 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Summary Adjustment ({overallAdjustmentPct}%)</span>
                    <span className="font-semibold">{formatCurrency(adjustmentAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax ({taxPct}%)</span>
                  <span className="font-semibold">{formatCurrency(tax)}</span>
                </div>
              </div>
              <div className={`flex justify-between text-base px-4 py-3 ${modern ? "bg-brand-50" : "bg-amber-50"}`}>
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
      </div>
    );
  },
);

InvoicePreview.displayName = "InvoicePreview";

InvoicePreview.propTypes = {
  invoiceNumber: PropTypes.string.isRequired,
  invoiceDate: PropTypes.string.isRequired,
  serialNumber: PropTypes.string,
  poNumber: PropTypes.string,
  billingPeriodStart: PropTypes.string,
  billingPeriodEnd: PropTypes.string,
  dueDate: PropTypes.string.isRequired,
  paymentTermName: PropTypes.string,
  billTo: PropTypes.shape({
    name: PropTypes.string,
    address: PropTypes.string,
    email: PropTypes.string,
  }).isRequired,
  customFields: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string, label: PropTypes.string, value: PropTypes.string }),
  ).isRequired,
  columns: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, label: PropTypes.string })).isRequired,
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
      unitPrice: PropTypes.number.isRequired,
      discountPct: PropTypes.number,
      extra: PropTypes.object.isRequired,
    }),
  ).isRequired,
  taxPct: PropTypes.number.isRequired,
  overallAdjustmentPct: PropTypes.number,
  notes: PropTypes.string,
  template: PropTypes.oneOf(["classic", "modern"]),
  logo: PropTypes.oneOf(["maitsys", "ccm"]),
};

export default InvoicePreview;
