import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    Animated,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

// ============ TYPES ============
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastData {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ConfirmationOptions {
    title: string;
    message: string;
    type?: 'warning' | 'danger' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

interface NotificationContextType {
    showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
    showConfirmation: (options: ConfirmationOptions) => void;
    hideToast: (id: string) => void;
}

// ============ CONTEXT ============
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

// ============ TOAST COMPONENT ============
const ToastIcon = ({ type }: { type: ToastType }) => {
    const iconMap: Record<ToastType, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
        success: { name: 'checkmark-circle', color: '#10B981' },
        error: { name: 'close-circle', color: '#EF4444' },
        warning: { name: 'warning', color: '#F59E0B' },
        info: { name: 'information-circle', color: '#3B82F6' },
    };

    const icon = iconMap[type];
    return <Ionicons name={icon.name} size={24} color={icon.color} />;
};

const Toast = ({ toast, onHide }: { toast: ToastData; onHide: (id: string) => void }) => {
    const translateY = useRef(new Animated.Value(100)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.9)).current;

    const hideWithAnimation = useCallback(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 100,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => onHide(toast.id));
    }, [translateY, opacity, onHide, toast.id]);

    useEffect(() => {
        // Entry animation
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto dismiss
        const timer = setTimeout(() => {
            hideWithAnimation();
        }, toast.duration || 3000);

        return () => clearTimeout(timer);
    }, [translateY, opacity, scale, toast.duration, hideWithAnimation]);

    const getBorderColor = () => {
        const colorMap: Record<ToastType, string> = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6',
        };
        return colorMap[toast.type];
    };

    const getBackgroundColor = () => {
        const bgMap: Record<ToastType, string> = {
            success: '#F0FDF4',
            error: '#FEF2F2',
            warning: '#FFFBEB',
            info: '#EFF6FF',
        };
        return bgMap[toast.type];
    };

    return (
        <Animated.View
            style={[
                styles.toastContainer,
                {
                    transform: [{ translateY }, { scale }],
                    opacity,
                    borderLeftColor: getBorderColor(),
                    backgroundColor: getBackgroundColor(),
                },
            ]}
        >
            <View style={styles.toastContent}>
                <View style={[styles.toastIconContainer, { backgroundColor: `${getBorderColor()}15` }]}>
                    <ToastIcon type={toast.type} />
                </View>
                <View style={styles.toastTextContainer}>
                    <Text style={styles.toastTitle}>{toast.title}</Text>
                    {toast.message && <Text style={styles.toastMessage}>{toast.message}</Text>}
                </View>
                <TouchableOpacity onPress={hideWithAnimation} style={styles.toastCloseButton}>
                    <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>

            {/* Decorative bottom bar */}
            <View style={[styles.toastDecoration, { backgroundColor: getBorderColor() }]} />
        </Animated.View>
    );
};

// ============ CONFIRMATION MODAL COMPONENT ============
const ConfirmationModal = ({
    visible,
    options,
    onClose,
}: {
    visible: boolean;
    options: ConfirmationOptions | null;
    onClose: () => void;
}) => {
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0.8);
            opacityAnim.setValue(0);
        }
    }, [visible, scaleAnim, opacityAnim]);

    if (!options) return null;

    const getTypeStyles = () => {
        const typeMap = {
            warning: {
                iconName: 'warning' as keyof typeof Ionicons.glyphMap,
                iconColor: '#F59E0B',
                iconBg: '#FEF3C7',
                confirmBg: '#F59E0B',
            },
            danger: {
                iconName: 'trash' as keyof typeof Ionicons.glyphMap,
                iconColor: '#EF4444',
                iconBg: '#FEE2E2',
                confirmBg: '#EF4444',
            },
            info: {
                iconName: 'information-circle' as keyof typeof Ionicons.glyphMap,
                iconColor: '#3B82F6',
                iconBg: '#DBEAFE',
                confirmBg: '#3B82F6',
            },
        };
        return typeMap[options.type || 'warning'];
    };

    const typeStyles = getTypeStyles();

    const handleConfirm = () => {
        onClose();
        options.onConfirm();
    };

    const handleCancel = () => {
        onClose();
        options.onCancel?.();
    };

    return (
        <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
            <Animated.View style={[styles.modalBackdrop, { opacity: opacityAnim }]}>
                <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="light" />
                <Animated.View
                    style={[
                        styles.modalContainer,
                        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
                    ]}
                >
                    {/* Decorative top bar */}
                    <View style={[styles.modalTopBar, { backgroundColor: typeStyles.confirmBg }]} />

                    {/* Icon */}
                    <View style={[styles.modalIconContainer, { backgroundColor: typeStyles.iconBg }]}>
                        <Ionicons name={typeStyles.iconName} size={40} color={typeStyles.iconColor} />
                    </View>

                    {/* Content */}
                    <Text style={styles.modalTitle}>{options.title}</Text>
                    <Text style={styles.modalMessage}>{options.message}</Text>

                    {/* Buttons */}
                    <View style={styles.modalButtonContainer}>
                        <TouchableOpacity
                            style={styles.modalCancelButton}
                            onPress={handleCancel}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.modalCancelText}>{options.cancelText || 'Cancel'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalConfirmButton, { backgroundColor: typeStyles.confirmBg }]}
                            onPress={handleConfirm}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.modalConfirmText}>{options.confirmText || 'Confirm'}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

// ============ PROVIDER ============
export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<ToastData[]>([]);
    const [confirmationOptions, setConfirmationOptions] = useState<ConfirmationOptions | null>(null);
    const [confirmationVisible, setConfirmationVisible] = useState(false);

    const showToast = useCallback(
        (type: ToastType, title: string, message?: string, duration?: number) => {
            const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            setToasts((prev) => [...prev, { id, type, title, message, duration }]);
        },
        []
    );

    const hideToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showConfirmation = useCallback((options: ConfirmationOptions) => {
        setConfirmationOptions(options);
        setConfirmationVisible(true);
    }, []);

    const hideConfirmation = useCallback(() => {
        setConfirmationVisible(false);
        setTimeout(() => setConfirmationOptions(null), 300);
    }, []);

    return (
        <NotificationContext.Provider value={{ showToast, hideToast, showConfirmation }}>
            {children}

            {/* Toast Container - positioned closer to bottom navbar */}
            <View style={styles.toastWrapper} pointerEvents="box-none">
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} onHide={hideToast} />
                ))}
            </View>

            {/* Confirmation Modal */}
            <ConfirmationModal
                visible={confirmationVisible}
                options={confirmationOptions}
                onClose={hideConfirmation}
            />
        </NotificationContext.Provider>
    );
};

// ============ STYLES ============
const styles = StyleSheet.create({
    // Toast styles - UPDATED FOR LIGHT THEME
    toastWrapper: {
        position: 'absolute',
        bottom: 100, // Closer to bottom navbar
        left: 0,
        right: 0,
        zIndex: 9999,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    toastContainer: {
        width: width - 32,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 8,
        overflow: 'hidden',
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    toastIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    toastTextContainer: {
        flex: 1,
    },
    toastTitle: {
        color: '#1F2937',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    toastMessage: {
        color: '#6B7280',
        fontSize: 14,
    },
    toastCloseButton: {
        padding: 4,
    },
    toastDecoration: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        opacity: 0.6,
    },

    // Modal styles - UPDATED FOR LIGHT THEME
    modalBackdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    modalContainer: {
        width: width - 48,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
    },
    modalTopBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
    },
    modalIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 8,
    },
    modalTitle: {
        color: '#1F2937',
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },
    modalMessage: {
        color: '#6B7280',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 24,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalCancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#4B5563',
        fontSize: 16,
        fontWeight: '600',
    },
    modalConfirmButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    modalConfirmText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
