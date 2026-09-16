import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Plus, Trash2, Columns, Percent, GripVertical } from "lucide-react";
import { round2 } from "../../utils/pricingCalc";
import { formatCurrency } from "../../utils/formatters";

const DEFAULT_WIDTHS = { description: 260, qty: 80, unitPrice: 96, discount: 132, amount: 96 };
const DEFAULT_CUSTOM_WIDTH = 128;
const ALIGN_RIGHT_KEYS = new Set(["qty", "unitPrice", "discount", "amount"]);

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
 *
 * Every column — system fields and custom ones alike — is resizable (drag
 * the thin handle on its right edge) and reorderable (drag its grip icon
 * to drop it anywhere in the row), all tracked locally: `columnOrder`
 * holds every column's key in display order, `colWidths` holds each key's
 * pixel width. Neither is persisted with the invoice — it's a layout
 * convenience for reviewing/editing, not saved data.
 */
const LineItemsEditor = ({ columns, rows, onColumnsChange, onRowsChange, discountAvailable = false, customerDiscountPct = 0 }) => {
  const [discountColumnVisible, setDiscountColumnVisible] = useState(discountAvailable);
  const showDiscount = discountAvailable && discountColumnVisible;
  const selectAllRef = useRef(null);

  // The more columns Finance adds, the less room each one has — rather
  // than letting cells get crushed (or forcing a wide horizontal scroll
  // sooner than necessary), text shrinks a step at a time and cell
  // padding tightens to match, so the table stays readable as it grows.
  // Description, Qty, Unit Price, Amount are always present (4); Discount
  // is one more when visible; each custom column adds one more.
  const totalColumnCount = 4 + (showDiscount ? 1 : 0) + columns.length;
  const tableTextClass = totalColumnCount >= 9 ? "text-[10px]" : totalColumnCount >= 7 ? "text-[11px]" : "text-xs";
  const cellPadClass = totalColumnCount >= 9 ? "px-1.5 py-1" : totalColumnCount >= 7 ? "px-1.5 py-1.5" : "px-2 py-1.5";
  const inputPadClass = totalColumnCount >= 9 ? "px-1.5 py-1.5" : "px-2 py-2";

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

  // --- Column order + widths (display-only, not part of the saved invoice) ---

  const [colWidths, setColWidths] = useState({});
  const [columnOrder, setColumnOrder] = useState(() => {
    const base = ["description", "qty", "unitPrice"];
    if (discountAvailable) base.push("discount");
    base.push("amount");
    return [...base, ...columns.map((c) => c.id)];
  });

  // Keeps columnOrder in sync as columns are added/removed or Discount is
  // toggled — a newly appearing key joins at the end (Finance can drag it
  // wherever); a removed key drops out; everything else keeps its place.
  useEffect(() => {
    const validKeys = [
      "description",
      "qty",
      "unitPrice",
      ...(showDiscount ? ["discount"] : []),
      "amount",
      ...columns.map((c) => c.id),
    ];
    const validSet = new Set(validKeys);
    setColumnOrder((prev) => {
      const kept = prev.filter((k) => validSet.has(k));
      const missing = validKeys.filter((k) => !kept.includes(k));
      if (missing.length === 0 && kept.length === prev.length) return prev;
      return [...kept, ...missing];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDiscount, columns.map((c) => c.id).join(",")]);

  const getColWidth = (key) => colWidths[key] ?? DEFAULT_WIDTHS[key] ?? DEFAULT_CUSTOM_WIDTH;

  const resizingRef = useRef(null);
  const handleResizeMove = (e) => {
    const r = resizingRef.current;
    if (!r) return;
    const delta = e.clientX - r.startX;
    setColWidths((prev) => ({ ...prev, [r.key]: Math.max(50, r.startWidth + delta) }));
  };
  const stopResize = () => {
    resizingRef.current = null;
    window.removeEventListener("mousemove", handleResizeMove);
    window.removeEventListener("mouseup", stopResize);
  };
  const startResize = (key) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = { key, startX: e.clientX, startWidth: getColWidth(key) };
    window.addEventListener("mousemove", handleResizeMove);
    window.addEventListener("mouseup", stopResize);
  };
  // Cleanup if the component unmounts mid-drag (e.g. "Upload a Different
  // File" while a resize is in progress).
  useEffect(() => () => {
    window.removeEventListener("mousemove", handleResizeMove);
    window.removeEventListener("mouseup", stopResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dragKeyRef = useRef(null);
  const handleDragStart = (key) => (e) => {
    dragKeyRef.current = key;
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOverHeader = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleDropOnHeader = (targetKey) => (e) => {
    e.preventDefault();
    const draggedKey = dragKeyRef.current;
    dragKeyRef.current = null;
    if (!draggedKey || draggedKey === targetKey) return;
    setColumnOrder((prev) => {
      const next = prev.filter((k) => k !== draggedKey);
      next.splice(next.indexOf(targetKey), 0, draggedKey);
      return next;
    });
  };

  const renderHeaderLabel = (key) => {
    if (key === "description") return "Description";
    if (key === "qty") return "Qty";
    if (key === "unitPrice") return "Unit Price";
    if (key === "amount") return "Amount";
    if (key === "discount") {
      return (
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
      );
    }
    const col = columns.find((c) => c.id === key);
    if (!col) return null;
    return (
      <div className="flex items-center gap-1">
        <input
          value={col.label}
          onChange={(e) => updateColumnLabel(col.id, e.target.value)}
          className="w-full bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 font-bold text-gray-500"
        />
        <button
          type="button"
          onClick={() => removeColumn(col.id)}
          aria-label="Remove column"
          className="text-red-400 hover:text-red-600 shrink-0"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  const renderBodyCell = (key, r, amount) => {
    switch (key) {
      case "description":
        return (
          <input
            value={r.description}
            onChange={(e) => updateRow(r.id, "description", e.target.value)}
            placeholder="Item description"
            className={`w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${inputPadClass}`}
          />
        );
      case "qty":
        return (
          <input
            type="number"
            min="0"
            step="1"
            value={r.quantity}
            onChange={(e) => updateRow(r.id, "quantity", Number(e.target.value))}
            className={`w-full text-right bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${inputPadClass}`}
          />
        );
      case "unitPrice":
        return (
          <input
            type="number"
            min="0"
            step="0.01"
            value={r.unitPrice}
            onChange={(e) => updateRow(r.id, "unitPrice", Number(e.target.value))}
            className={`w-full text-right bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${inputPadClass}`}
          />
        );
      case "discount":
        return (
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
        );
      case "amount":
        return (
          <span className="font-bold tabular-nums text-gray-700 dark:text-gray-300">{formatCurrency(amount)}</span>
        );
      default:
        return (
          <input
            value={r.extra[key] ?? ""}
            onChange={(e) => updateRowExtra(r.id, key, e.target.value)}
            className={`w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${inputPadClass}`}
          />
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className={`w-full table-fixed ${tableTextClass} transition-[font-size] duration-150`}>
          <thead>
            <tr className="text-[10px] font-bold text-gray-400 tracking-wide">
              {columnOrder.map((key) => {
                const alignRight = ALIGN_RIGHT_KEYS.has(key);
                const grip = (
                  <GripVertical
                    draggable
                    onDragStart={handleDragStart(key)}
                    aria-label="Drag to reorder column"
                    className="w-3 h-3 text-gray-300 cursor-grab active:cursor-grabbing shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                );
                return (
                  <th
                    key={key}
                    style={{ width: getColWidth(key) }}
                    onDragOver={handleDragOverHeader}
                    onDrop={handleDropOnHeader(key)}
                    className={`relative group ${cellPadClass} ${alignRight ? "text-right" : "text-left"}`}
                  >
                    <div className={`flex items-center gap-1 ${alignRight ? "justify-end" : ""}`}>
                      {!alignRight && grip}
                      <div className="min-w-0 flex-1">{renderHeaderLabel(key)}</div>
                      {alignRight && grip}
                    </div>
                    {/* Resize handle — its own mousedown target, separate
                        from the grip's HTML5 drag so resizing and
                        reordering never fight over the same gesture. */}
                    <div
                      onMouseDown={startResize(key)}
                      title="Drag to resize this column"
                      className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize select-none hover:bg-brand-400/50 active:bg-brand-500/60"
                    />
                  </th>
                );
              })}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const gross = round2(Number(r.quantity || 0) * Number(r.unitPrice || 0));
              const amount = showDiscount
                ? round2(gross * (1 - Number(r.discountPct || 0) / 100))
                : gross;
              return (
                <tr
                  key={r.id}
                  className={`border-t border-gray-100 dark:border-gray-800 transition-colors duration-150 hover:bg-brand-50/40 dark:hover:bg-brand-950/10 ${
                    i % 2 === 1 ? "bg-gray-50/60 dark:bg-gray-800/20" : ""
                  }`}
                >
                  {columnOrder.map((key) => (
                    <td key={key} className={cellPadClass}>
                      {renderBodyCell(key, r, amount)}
                    </td>
                  ))}
                  <td className={cellPadClass}>
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
