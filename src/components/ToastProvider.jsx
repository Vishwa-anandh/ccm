import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X, XCircle, WifiOff } from 'lucide-react';

const ToastContext = createContext(null);

const CONFIG = {
    error:   { icon: XCircle,       bg: 'bg-red-600',     border: 'border-red-700'   },
    warning: { icon: AlertTriangle, bg: 'bg-amber-500',   border: 'border-amber-600' },
    success: { icon: CheckCircle,   bg: 'bg-emerald-600', border: 'border-emerald-700' },
    info:    { icon: Info,          bg: 'bg-blue-600',    border: 'border-blue-700'  },
    offline: { icon: WifiOff,       bg: 'bg-gray-800',    border: 'border-gray-700'  },
};

let _id = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const show = useCallback((message, type = 'error', duration = 5000) => {
        const id = ++_id;
        // Keep at most 3 toasts on screen
        setToasts(prev => [...prev.slice(-2), { id, message, type }]);
        if (duration > 0) setTimeout(() => dismiss(id), duration);
        return id;
    }, [dismiss]);

    // API interceptors live outside the React tree — they communicate via window events
    useEffect(() => {
        const handler = (e) => show(e.detail.message, e.detail.type, e.detail.duration);
        window.addEventListener('ccm:toast', handler);
        return () => window.removeEventListener('ccm:toast', handler);
    }, [show]);

    return (
        <ToastContext.Provider value={{ show, dismiss }}>
            {children}

            {/* ── Toast stack — fixed top-right ── */}
            <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
                {toasts.map(t => {
                    const { icon: Icon, bg, border } = CONFIG[t.type] ?? CONFIG.error;
                    return (
                        <div
                            key={t.id}
                            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl
                                        text-white pointer-events-auto
                                        animate-in slide-in-from-right-4 fade-in duration-300
                                        ${bg} ${border}`}
                        >
                            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                            <p className="text-sm font-semibold flex-1 leading-snug">{t.message}</p>
                            <button
                                onClick={() => dismiss(t.id)}
                                className="shrink-0 p-0.5 rounded opacity-70 hover:opacity-100 hover:bg-white/20 transition-all"
                                aria-label="Dismiss"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
    return ctx;
}

/**
 * Fire a toast from outside the React tree (e.g. Axios interceptors).
 * type: 'error' | 'warning' | 'success' | 'info' | 'offline'
 */
export function fireToast(message, type = 'error', duration = 5000) {
    window.dispatchEvent(new CustomEvent('ccm:toast', { detail: { message, type, duration } }));
}
