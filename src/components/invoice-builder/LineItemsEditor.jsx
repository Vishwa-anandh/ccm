import React from "react";
import PropTypes from "prop-types";
import { Plus, Trash2, Columns } from "lucide-react";
import { round2 } from "../../utils/pricingCalc";
import { formatCurrency } from "../../utils/formatters";
import PctRuleInput from "../billing/PctRuleInput";

/**
 * LineItemsEditor — the dynamic rows + columns editor. Description/
 * Quantity/Unit Price/Amount are fixed system fields (Amount is always
 * computed, never entered directly); "+ Add Column" appends extra,
 * display-only text columns that appear on every row.
 *
 * `pricingRules` is optional — pass it (Billing's GenerateInvoicePage does)
 * to show a Discount % column with a select-a-rule-or-type-manually
 * picker, which also folds the discount into Amount. Leaving it undefined
 * (the standalone Invoice Builder page does) hides that column entirely —
 * this component's original two consumers stay identical.
 */
const LineItemsEditor = ({ columns, rows, onColumnsChange, onRowsChange, pricingRules }) => {
  const showDiscount = pricingRules !== undefined;

  const addRow = () => {
    onRowsChange([
      ...rows,
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, discountPct: 0, extra: {} },
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
              {showDiscount && <th className="text-right px-2 py-1.5 w-32">Discount %</th>}
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
                      <PctRuleInput
                        value={Number(r.discountPct || 0)}
                        onChange={(v) => updateRow(r.id, "discountPct", v)}
                        rules={pricingRules}
                      />
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
  pricingRules: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string, name: PropTypes.string, percentage: PropTypes.number }),
  ),
};

export default LineItemsEditor;
