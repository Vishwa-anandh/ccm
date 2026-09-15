import React from "react";
import PropTypes from "prop-types";
import { Check } from "lucide-react";
import { CCM_LOGO_SRC, MAITSYS_LOGO_SRC } from "./InvoiceLogos";

/**
 * LogoPicker — which sender identity (Maitsys or CCM) prints on the
 * invoice document. Purely presentational, same "compact pill" sizing as
 * TemplatePicker's compact mode — meant to sit right beside it.
 */
const LogoPicker = ({ value, onChange }) => (
  <div className="grid grid-cols-2 gap-3">
    <button
      type="button"
      onClick={() => onChange("maitsys")}
      className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-sm font-semibold transition-all ${
        value === "maitsys"
          ? "border-brand-400 bg-brand-50/50 dark:bg-brand-950/20"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      <img src={MAITSYS_LOGO_SRC} alt="Maitsys" className="h-4 w-auto max-w-[70px] object-contain shrink-0" />
      {value === "maitsys" && <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
    </button>
    <button
      type="button"
      onClick={() => onChange("ccm")}
      className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
        value === "ccm"
          ? "border-brand-400 bg-brand-50/50 dark:bg-brand-950/20"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      <img src={CCM_LOGO_SRC} alt="CCM" className="w-4 h-4 object-contain shrink-0" />
      <span className="text-gray-900 dark:text-white">CCM</span>
      {value === "ccm" && <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
    </button>
  </div>
);

LogoPicker.propTypes = {
  value: PropTypes.oneOf(["maitsys", "ccm"]).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default LogoPicker;
