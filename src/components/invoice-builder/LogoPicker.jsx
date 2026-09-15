import React from "react";
import PropTypes from "prop-types";
import { Check } from "lucide-react";

const LOGOS = [
  { id: "maitsys", label: "Maitsys", image: "/app-logo.png" },
  { id: "ccm", label: "CCM", image: null },
];

/**
 * LogoPicker — which sender identity (Maitsys or CCM) prints on the
 * invoice document. Purely presentational, same "compact pill" sizing as
 * TemplatePicker's compact mode — meant to sit right beside it.
 */
const LogoPicker = ({ value, onChange }) => (
  <div className="grid grid-cols-2 gap-3">
    {LOGOS.map((l) => {
      const active = value === l.id;
      return (
        <button
          key={l.id}
          type="button"
          onClick={() => onChange(l.id)}
          className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
            active
              ? "border-brand-400 bg-brand-50/50 dark:bg-brand-950/20"
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
          }`}
        >
          {l.image ? (
            <img src={l.image} alt={l.label} className="w-4 h-4 object-contain shrink-0" />
          ) : (
            <span className="w-4 h-4 rounded bg-brand-600 text-white text-[8px] font-bold flex items-center justify-center shrink-0">
              CCM
            </span>
          )}
          <span className="text-gray-900 dark:text-white">{l.label}</span>
          {active && <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
        </button>
      );
    })}
  </div>
);

LogoPicker.propTypes = {
  value: PropTypes.oneOf(["maitsys", "ccm"]).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default LogoPicker;
