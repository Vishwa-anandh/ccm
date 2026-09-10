import React from "react";
import PropTypes from "prop-types";
import { Check } from "lucide-react";

const TEMPLATES = [
  { id: "classic", label: "Classic", blurb: "Plain header, logo on the left" },
  { id: "modern", label: "Modern", blurb: "Brand-colored header band" },
];

/**
 * TemplatePicker — lets Finance choose the visual/branding layout for the
 * invoice document before generating it. Purely presentational: the chosen
 * id is threaded into InvoicePreview's `template` prop and persisted on the
 * built invoice, but never changes line items, totals, or the calc engine.
 *
 * `compact` drops the swatch/blurb down to a single-line pill so the whole
 * picker matches a standard input's height — for placing it next to a
 * field (GenerateInvoicePage puts it beside the Customer select).
 */
const TemplatePicker = ({ value, onChange, compact = false }) => (
  <div className="grid grid-cols-2 gap-3">
    {TEMPLATES.map((t) => {
      const active = value === t.id;
      const activeCls = active
        ? "border-brand-400 bg-brand-50/50 dark:bg-brand-950/20"
        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600";
      if (compact) {
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            title={t.blurb}
            className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${activeCls}`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${t.id === "modern" ? "bg-brand-600" : "bg-gray-300 dark:bg-gray-600"}`}
            />
            <span className="text-gray-900 dark:text-white">{t.label}</span>
            {active && <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
          </button>
        );
      }
      return (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`text-left rounded-xl border p-3 transition-all ${activeCls}`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-gray-900 dark:text-white">{t.label}</span>
            {active && <Check className="w-3.5 h-3.5 text-brand-600" />}
          </div>
          <div
            className={`h-8 rounded-md ${t.id === "modern" ? "bg-brand-600" : "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"}`}
          />
          <p className="text-[10px] text-gray-400 mt-1.5">{t.blurb}</p>
        </button>
      );
    })}
  </div>
);

TemplatePicker.propTypes = {
  value: PropTypes.oneOf(["classic", "modern"]).isRequired,
  onChange: PropTypes.func.isRequired,
  compact: PropTypes.bool,
};

export default TemplatePicker;
