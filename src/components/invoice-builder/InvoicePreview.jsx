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
  ({ invoiceNumber, invoiceDate, dueDate, billTo, customFields, columns, rows, taxPct, notes, template = "classic" }, ref) => {
    const lineAmounts = rows.map((r) => round2(Number(r.quantity || 0) * Number(r.unitPrice || 0)));
    const subtotal = round2(lineAmounts.reduce((s, a) => s + a, 0));
    const tax = round2(subtotal * (Number(taxPct || 0) / 100));
    const total = round2(subtotal + tax);
    const modern = template === "modern";

    return (
      <div ref={ref} className="bg-white text-gray-900 w-full" style={{ minHeight: 600 }}>
        <div className={`flex items-start justify-between p-10 pb-8 ${modern ? "bg-brand-600 text-white" : ""}`}>
          <div className="flex items-center gap-3">
            <img src={MAITSYS_SENDER.logo} alt="Maitsys" className="w-12 h-12 object-contain" />
            <div>
              <p className="font-bold text-lg">{MAITSYS_SENDER.name}</p>
              <p className={`text-xs ${modern ? "text-white/80" : "text-gray-500"}`}>{MAITSYS_SENDER.email}</p>
              <p className={`text-xs ${modern ? "text-white/80" : "text-gray-500"}`}>{MAITSYS_SENDER.website}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tracking-tight">INVOICE</p>
            <p className={`text-sm font-mono ${modern ? "text-white/80" : "text-gray-600"}`}>#{invoiceNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 px-10 pt-8 mb-8">
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

        <div className="px-10 pb-10">
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-800 text-[10px] font-bold text-gray-500 tracking-wide">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Unit Price</th>
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
            <div className="w-56 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax ({taxPct}%)</span>
                <span className="font-semibold">{formatCurrency(tax)}</span>
              </div>
              <div className={`flex justify-between text-base border-t-2 pt-1 mt-1 ${modern ? "border-brand-600" : "border-gray-800"}`}>
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
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
      unitPrice: PropTypes.number.isRequired,
      extra: PropTypes.object.isRequired,
    }),
  ).isRequired,
  taxPct: PropTypes.number.isRequired,
  notes: PropTypes.string,
  template: PropTypes.oneOf(["classic", "modern"]),
};

export default InvoicePreview;
