import { createContext, useContext, useState, useCallback } from 'react';

/**
 * Confirm Modal Context - Beautiful confirmation dialogs with options
 */
const ConfirmContext = createContext();

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within ConfirmProvider');
    }
    return context;
}

const CONFIRM_TYPES = {
    danger: {
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        icon: '⚠️',
        confirmBg: 'bg-red-500 hover:bg-red-600',
    },
    warning: {
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        icon: '⚡',
        confirmBg: 'bg-amber-500 hover:bg-amber-600',
    },
    success: {
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        icon: '✓',
        confirmBg: 'bg-green-500 hover:bg-green-600',
    },
    info: {
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        icon: 'ℹ️',
        confirmBg: 'bg-blue-500 hover:bg-blue-600',
    },
};

export function ConfirmProvider({ children }) {
    const [modal, setModal] = useState(null);

    const confirm = useCallback(({
        title = 'Konfirmasi',
        message,
        type = 'warning',
        confirmText = 'Ya, Lanjutkan',
        cancelText = 'Batal',
        details = [], // Array of detail strings
    }) => {
        return new Promise((resolve) => {
            setModal({
                title,
                message,
                type,
                confirmText,
                cancelText,
                details,
                onConfirm: () => {
                    setModal(null);
                    resolve(true);
                },
                onCancel: () => {
                    setModal(null);
                    resolve(false);
                },
            });
        });
    }, []);

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={modal.onCancel}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-[scaleIn_0.2s_ease-out]">
                        {/* Header */}
                        <div className="p-6 pb-4">
                            <div className="flex items-start gap-4">
                                <div className={`${CONFIRM_TYPES[modal.type].iconBg} w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0`}>
                                    {CONFIRM_TYPES[modal.type].icon}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{modal.title}</h3>
                                    <p className="text-gray-600 mt-1">{modal.message}</p>
                                </div>
                            </div>

                            {/* Details list */}
                            {modal.details.length > 0 && (
                                <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-2">
                                    {modal.details.map((detail, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                            <span className="text-green-500">✓</span>
                                            <span>{detail}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
                            <button
                                onClick={modal.onCancel}
                                className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-200 transition"
                            >
                                {modal.cancelText}
                            </button>
                            <button
                                onClick={modal.onConfirm}
                                className={`px-4 py-2 rounded-lg font-medium text-white ${CONFIRM_TYPES[modal.type].confirmBg} transition shadow-lg`}
                            >
                                {modal.confirmText}
                            </button>
                        </div>
                    </div>

                    <style>{`
            @keyframes scaleIn {
              from {
                transform: scale(0.9);
                opacity: 0;
              }
              to {
                transform: scale(1);
                opacity: 1;
              }
            }
          `}</style>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}
