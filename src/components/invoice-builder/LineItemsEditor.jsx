import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Plus, Trash2, Columns, Percent } from "lucide-react";
import { round2 } from "../../utils/pricingCalc";
import { formatCurrency } from "../../utils/formatters";

/**
 * LineItemsEditor — the dynamic rows + columns editor. Description/
 * Quantity/Unit Price/Amount are fixed system fields (Amount is always
 * computed, never entered directly); "+ Add Column" appends extra,
 * display-only text columns that appear on every row.
 *
 * `discountAvailable` is optional — pass true (Billing's
 * GenerateInvoicePage does) to make a Discount column available, which
 * folds into Amount. Leaving it unset (the standalone Invoice Builder
 * page does) removes the feature entirely — this component's original two
 * consumers stay identical. When available, Finance can still remove/
 * re-add the column itself (its trash icon / "+ Add Discount"), same as
 * any custom column; each row keeps its own discountPct even while the
 * column is hidden, so re-adding it doesn't lose anything already entered.
 *
 * The Discount column is a per-line checkbox, not a free-text %: checking
 * a row applies `customerDiscountPct` (the selected customer's own
 * Discount % field) to that line; unchecking clears it back to 0%. There's
 * no manual per-line override — the single source of the percentage is
 * always the customer record.
 */
const LineItemsEditor = ({ columns, rows, onColumnsChange, onRowsChange, discountAvailable = false, customerDiscountPct = 0 }) => {
  const [discountColumnVisible, setDiscountColumnVisible] = useState(discountAvailable);
  const showDiscount = discountAvailable && discountColumnVisible;
  const selectAllRef = useRef(null);

  const discountedCount = rows.filter((r) => Number(r.discountPct || 0) > 0).length;
  const allDiscounted = rows.length > 0 && discountedCount === rows.length;
  const someDiscounted = discountedCount > 0 && discountedCount < rows.length;

  // Native checkboxes only expose "indeterminate" as a DOM property, not a
  // JSX attribute — set it imperatively whenever the mixed-selection state
  // changes, so "some but not all rows discounted" reads as a dash, not a
  // misleading checked/unchecked box.
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someDiscounted;
  }, [someDiscounted]);

  const handleSelectAllDiscount = (checked) => {
    onRowsChange(rows.map((r) => ({ ...r, discountPct: checked ? customerDiscountPct : 0 })));
  };

  const addRow = () => {
    // Defaults to the customer's Discount % applied (checked), matching
    // every other row, rather than starting unchecked and looking
    // inconsistent next to rows that already have it applied.
    onRowsChange([
      ...rows,
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, discountPct: customerDiscountPct, extra: {} },
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
    onRowsChange(
      rows.map((r) => {
        const { [id]: _removed, ...rest } = r.extra;
        return { ...r, extra: rest };
      }),
    );
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
              {showDiscount && (
                <th className="text-right px-2 py-1.5 w-32">
                  <div className="flex items-center justify-end gap-1.5">
                    <label
                      className={`flex items-center gap-1 ${customerDiscountPct > 0 && rows.length > 0 ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                      title={
                        customerDiscountPct > 0 && rows.length > 0
                          ? "Apply/clear the discount on every line"
                          : "Select a customer with a Discount % set first"
                      }
                    >
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        disabled={customerDiscountPct <= 0 || rows.length === 0}
                        checked={allDiscounted}
                        onChange={(e) => handleSelectAllDiscount(e.target.checked)}
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed"
                      />
                      Discount
                    </label>
                    <button
                      type="button"
                      onClick={() => setDiscountColumnVisible(false)}
                      aria-label="Remove Discount column"
                      title="Remove this column"
                      className="text-red-400 hover:text-red-600 shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </th>
              )}
              <th className="text-right px-2 py-1.5 w-24">Amount</th>
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
                      aria-label="Remove column"
                      className="text-red-400 hover:text-red-600 shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const gross = round2(Number(r.quantity || 0) * Number(r.unitPrice || 0));
              const amount = showDiscount
                ? round2(gross * (1 - Number(r.discountPct || 0) / 100))
                : gross;
              return (
                <tr key={r.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-2 py-1.5">
                    <input
                      value={r.description}
                      onChange={(e) => updateRow(r.id, "description", e.target.value)}
                      placeholder="Item description"
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={r.quantity}
                      onChange={(e) => updateRow(r.id, "quantity", Number(e.target.value))}
                      className="w-full text-right bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={r.unitPrice}
                      onChange={(e) => updateRow(r.id, "unitPrice", Number(e.target.value))}
                      className="w-full text-right bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2"
                    />
                  </td>
                  {showDiscount && (
                    <td className="px-2 py-1.5">
                      <label
                        className={`flex items-center justify-end gap-1.5 ${customerDiscountPct > 0 ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                        title={customerDiscountPct > 0 ? "" : "Select a customer with a Discount % set first"}
                      >
                        <span className="text-gray-500 dark:text-gray-400 tabular-nums">
                          {customerDiscountPct > 0 ? `${customerDiscountPct}%` : "—"}
                        </span>
                        <input
                          type="checkbox"
                          disabled={customerDiscountPct <= 0}
                          checked={Number(r.discountPct || 0) > 0}
                          onChange={(e) => updateRow(r.id, "discountPct", e.target.checked ? customerDiscountPct : 0)}
                          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed"
                        />
                      </label>
                    </td>
                  )}
                  <td className="px-2 py-1.5 text-right font-bold tabular-nums text-gray-700 dark:text-gray-300">
                    {formatCurrency(amount)}
                  </td>
                  {columns.map((c) => (
                    <td key={c.id} className="px-2 py-1.5">
                      <input
                        value={r.extra[c.id] ?? ""}
                        onChange={(e) => updateRowExtra(r.id, c.id, e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => removeRow(r.id)}
                      aria-label="Remove row"
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
        {discountAvailable && !discountColumnVisible && (
          <button
            type="button"
            onClick={() => setDiscountColumnVisible(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <Percent className="w-3.5 h-3.5" /> Add Discount
          </button>
        )}
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
      discountPct: PropTypes.number,
      extra: PropTypes.object.isRequired,
    }),
  ).isRequired,
  onColumnsChange: PropTypes.func.isRequired,
  onRowsChange: PropTypes.func.isRequired,
  discountAvailable: PropTypes.bool,
  customerDiscountPct: PropTypes.number,
};

export default LineItemsEditor;
