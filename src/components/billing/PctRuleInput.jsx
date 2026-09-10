import React from "react";
import PropTypes from "prop-types";

/**
 * PctRuleInput — a percentage field that can be filled either by picking a
 * saved Pricing Rule (name + %) or by typing a custom value directly.
 * Picking a rule just writes its percentage into `value`; the calculation
 * always reads the plain number, never a rule id, so typing over a
 * rule-filled value works exactly like typing into a bare input.
 */
const PctRuleInput = ({ value, onChange, rules, disabled = false }) => {
  // Reflects the dropdown to "Custom" the moment the number no longer
  // matches any saved rule's percentage — e.g. the user hand-edited it.
  const matchedRuleId = rules.find((r) => r.percentage === Number(value))?.id ?? "";

  return (
    <div className="flex items-center gap-1">
      <select
        value={matchedRuleId}
        disabled={disabled}
        onChange={(e) => {
          const rule = rules.find((r) => r.id === e.target.value);
          if (rule) onChange(rule.percentage);
        }}
        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-1 py-1 text-[10px] max-w-[92px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        title="Pick a saved Pricing Rule"
      >
        <option value="">Custom</option>
        {rules.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name} ({r.percentage}%)
          </option>
        ))}
      </select>
      <input
        type="number"
        step="0.1"
        min="0"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        title="Type a custom percentage"
        className="w-16 text-right rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
};

PctRuleInput.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  rules: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string, name: PropTypes.string, percentage: PropTypes.number }),
  ).isRequired,
  disabled: PropTypes.bool,
};

export default PctRuleInput;
