import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { AlertTriangle, LogOut, Trash2, X, ShieldAlert } from "lucide-react";

const ConfirmContext = createContext(null);

const ICONS = {
  delete: {
    icon: Trash2,
    bg: "bg-red-100 dark:bg-red-950/40",
    color: "text-red-600 dark:text-red-400",
  },
  logout: {
    icon: LogOut,
    bg: "bg-orange-100 dark:bg-orange-950/40",
    color: "text-orange-600 dark:text-orange-400",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-yellow-100 dark:bg-yellow-950/40",
    color: "text-yellow-600 dark:text-yellow-400",
  },
  danger: {
    icon: ShieldAlert,
    bg: "bg-red-100 dark:bg-red-950/40",
    color: "text-red-600 dark:text-red-400",
  },
};

const CONFIRM_STYLES = {
  delete:  "bg-red-600 hover:bg-red-700 text-white",
  logout:  "bg-brand-600 hover:bg-brand-700 text-white",
  warning: "bg-brand-600 hover:bg-brand-700 text-white",
  danger:  "bg-red-600 hover:bg-red-700 text-white",
  default: "bg-brand-600 hover:bg-brand-700 text-white",
};

export const ConfirmProvider = ({ children }) => {
  const [state, setState] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        title: options.title ?? "Are you sure?",
        message: options.message ?? "This action cannot be undone.",
        confirmLabel: options.confirmLabel ?? "Confirm",
        cancelLabel: options.cancelLabel ?? "Cancel",
        variant: options.variant ?? "default",
      });
    });
  }, []);

  const handleConfirm = () => {
    setState(null);
    resolveRef.current?.(true);
  };
  const handleCancel = () => {
    setState(null);
    resolveRef.current?.(false);
  };

  // Close on Escape
  useEffect(() => {
    if (!state) return;
    const handler = (e) => {
      if (e.key === "Escape") handleCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state]);

  const {
    icon: Icon,
    bg: iconBg,
    color: iconColor,
  } = ICONS[state?.variant] ?? ICONS.warning;
  const confirmStyle = CONFIRM_STYLES[state?.variant] ?? CONFIRM_STYLES.default;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {state && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={handleCancel}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
            style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
                >
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                    {state.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    {state.message}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all ml-2 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 dark:bg-gray-800 mx-5" />

            {/* Actions */}
            <div className="flex gap-2 px-5 py-4">
              <button
                onClick={handleCancel}
                className="flex-1 py-2 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                {state.cancelLabel}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${confirmStyle}`}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmProvider");
  return ctx;
};
