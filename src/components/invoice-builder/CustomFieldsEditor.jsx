import React from "react";
import PropTypes from "prop-types";
import { Plus, Trash2 } from "lucide-react";

/**
 * CustomFieldsEditor — arbitrary label/value pairs shown in the invoice
 * header (e.g. "PO Number: PO-1234"), beyond the standard Invoice #/Date/
 * Due Date fields. Each field is independently addable/removable.
 */
const CustomFieldsEditor = ({ fields, onChange }) => {
  const addField = () => {
    onChange([...fields, { id: crypto.randomUUID(), label: "", value: "" }]);
  };

  const updateField = (id, key, val) => {
    onChange(fields.map((f) => (f.id === id ? { ...f, [key]: val } : f)));
  };

  const removeField = (id) => {
    onChange(fields.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-2">
      {fields.map((f) => (
        <div key={f.id} className="flex items-center gap-2">
          <input
            value={f.label}
            onChange={(e) => updateField(f.id, "label", e.target.value)}
            placeholder="Field label (e.g. PO Number)"
            className="w-1/2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs"
          />
          <input
            value={f.value}
            onChange={(e) => updateField(f.id, "value", e.target.value)}
            placeholder="Value"
            className="w-1/2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs"
          />
          <button
            type="button"
            onClick={() => removeField(f.id)}
            className="text-red-500 hover:text-red-600 p-1.5 rounded-lg shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addField}
        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        <Plus className="w-3.5 h-3.5" /> Add Field
      </button>
    </div>
  );
};

CustomFieldsEditor.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default CustomFieldsEditor;
