import React, { useState } from "react";
import PropTypes from "prop-types";
import { Lock, Eye, EyeOff } from "lucide-react";

/**
 * PasswordInput
 * – Suppresses the Microsoft Edge / Chrome built-in reveal button via CSS
 *   so we never get a double-eye situation.
 * – Renders our own Eye / EyeOff toggle on the right.
 */
export const PasswordInput = ({
  name,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  className,
  inputRef,
}) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      {/* Left lock icon */}
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Lock className="h-4 w-4 text-gray-400" />
      </div>

      <input
        ref={inputRef}
        name={name}
        /* Switch between text/password — do NOT conditionally mount a new
           element (that resets cursor position). */
        type={show ? "text" : "password"}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={name === "confirmPassword" ? "new-password" : name === "password" ? "current-password" : "off"}
        /* Suppress Edge/Chrome built-in password reveal button */
        style={{ WebkitTextSecurity: undefined }}
        className={`block w-full pl-10 pr-10 ${className}`}
      />

      {/* Right toggle */}
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        disabled={disabled}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>

      {/*
        Hide Microsoft Edge & Chrome built-in password-reveal icon.
        ::-ms-reveal       — Edge (Chromium)
        ::-webkit-contacts-auto-fill-button — Safari
        We inject a <style> scoped to this field via the name attr.
      */}
      <style>{`
        input[name="${name}"]::-ms-reveal,
        input[name="${name}"]::-ms-clear,
        input[name="${name}"]::-webkit-contacts-auto-fill-button,
        input[name="${name}"]::-webkit-credentials-auto-fill-button {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
      `}</style>
    </div>
  );
};

PasswordInput.propTypes = {
  name:        PropTypes.string.isRequired,
  value:       PropTypes.string.isRequired,
  onChange:    PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  required:    PropTypes.bool,
  disabled:    PropTypes.bool,
  className:   PropTypes.string,
  inputRef:    PropTypes.object,
};

PasswordInput.defaultProps = {
  placeholder: "Enter password",
  required:    false,
  disabled:    false,
  className:   "py-3 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D92D20]/20 focus:border-[#D92D20] transition-all bg-white text-sm",
  inputRef:    null,
};

/* ─────────────────────────────────────────────────────────────────────────────
   PasswordStrength
   Shows a 4-segment bar + label + hint list below a password field.
   Only renders when `password` has length > 0.
───────────────────────────────────────────────────────────────────────────── */
const rules = [
  { label: "At least 8 characters",           test: (p) => p.length >= 8 },
  { label: "Uppercase letter (A–Z)",           test: (p) => /[A-Z]/.test(p) },
  { label: "Lowercase letter (a–z)",           test: (p) => /[a-z]/.test(p) },
  { label: "Number (0–9)",                     test: (p) => /\d/.test(p) },
  { label: "Special character (!@#$…)",        test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const LEVELS = [
  { label: "Too weak",  color: "bg-red-500",    text: "text-red-600"    },
  { label: "Weak",      color: "bg-orange-400",  text: "text-orange-500" },
  { label: "Fair",      color: "bg-yellow-400",  text: "text-yellow-600" },
  { label: "Good",      color: "bg-blue-500",    text: "text-blue-600"   },
  { label: "Strong",    color: "bg-emerald-500", text: "text-emerald-600"},
];

export const PasswordStrength = ({ password }) => {
  if (!password) return null;

  const passed = rules.filter((r) => r.test(password)).length;
  // score 0-4 maps to LEVELS index 0-4
  const score = Math.min(passed, 4);
  const level = LEVELS[score];

  return (
    <div className="mt-2 space-y-2">
      {/* Segmented bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < score + 1 ? level.color : "bg-gray-100 dark:bg-gray-800"
            }`}
          />
        ))}
      </div>

      {/* Label */}
      <p className={`text-[11px] font-bold ${level.text}`}>{level.label}</p>

      {/* Rule checklist */}
      <ul className="space-y-0.5">
        {rules.map((r) => {
          const ok = r.test(password);
          return (
            <li key={r.label} className={`flex items-center gap-1.5 text-[11px] font-medium ${ok ? "text-emerald-600" : "text-gray-400"}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${ok ? "bg-emerald-500" : "bg-gray-300"}`} />
              {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

PasswordStrength.propTypes = {
  password: PropTypes.string.isRequired,
};

export default PasswordInput;
