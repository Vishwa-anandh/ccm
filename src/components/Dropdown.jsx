import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Check, ChevronDown } from "lucide-react";

/**
 * Dropdown — a custom-styled select, used wherever a native <select>'s
 * browser-drawn menu would look out of place next to the app's own pill/
 * card styling (e.g. the Invoices table's Status/Customer filters).
 * Same overlay conventions as ConfirmDialog/SentEmailModal: closes on
 * click-outside and Escape.
 */
const Dropdown = ({ label, value, options, onChange, className = "" }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
          open
            ? "border-brand-400 bg-brand-50/50 dark:bg-brand-950/20"
            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"
        }`}
      >
        {label && <span className="text-gray-400 font-semibold whitespace-nowrap">{label}:</span>}
        <span className="font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap max-w-[110px] truncate">
          {selected?.label ?? value}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute z-20 mt-1.5 min-w-full w-max max-w-[220px] py-1 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg"
          style={{ boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                o.value === value
                  ? "text-brand-600 dark:text-brand-400 font-semibold bg-brand-50/60 dark:bg-brand-950/30"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <span className="truncate">{o.label}</span>
              {o.value === value && <Check className="w-3.5 h-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

Dropdown.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired }),
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default Dropdown;
