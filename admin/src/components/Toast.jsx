import { createContext, useContext, useState, useCallback } from 'react';

/**
 * Toast Context - Beautiful toast notifications with icons
 */
const ToastContext = createContext();

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

const TOAST_TYPES = {
    success: {
        bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
        icon: '✓',
        iconBg: 'bg-green-600',
    },
    error: {
        bg: 'bg-gradient-to-r from-red-500 to-rose-600',
        icon: '✕',
        iconBg: 'bg-red-600',
    },
    warning: {
        bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
        icon: '⚠',
        iconBg: 'bg-amber-600',
    },
    info: {
        bg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
        icon: 'ℹ',
        iconBg: 'bg-blue-600',
    },
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        warning: (msg) => addToast(msg, 'warning'),
        info: (msg) => addToast(msg, 'info'),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-md">
                {toasts.map((t) => {
                    const config = TOAST_TYPES[t.type];
                    return (
                        <div
                            key={t.id}
                            className={`${config.bg} text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-[slideIn_0.3s_ease-out] min-w-[300px]`}
                            style={{
                                animation: 'slideIn 0.3s ease-out',
                            }}
                        >
                            <div className={`${config.iconBg} w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-inner`}>
                                {config.icon}
                            </div>
                            <div className="flex-1 font-medium">{t.message}</div>
                            <button
                                onClick={() => removeToast(t.id)}
                                className="hover:bg-white/20 rounded-full p-1 transition"
                            >
                                ✕
                            </button>
                        </div>
                    );
                })}
            </div>
            <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
        </ToastContext.Provider>
    );
}
