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
    }, []);

    const hideWithAnimation = () => {
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
    };

    const getBorderColor = () => {
        const colorMap: Record<ToastType, string> = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6',
        };
        return colorMap[toast.type];
    };

    const getGradientColors = () => {
        const gradientMap: Record<ToastType, string> = {
            success: 'rgba(16, 185, 129, 0.15)',
            error: 'rgba(239, 68, 68, 0.15)',
            warning: 'rgba(245, 158, 11, 0.15)',
            info: 'rgba(59, 130, 246, 0.15)',
        };
        return gradientMap[toast.type];
    };

    return (
        <Animated.View
            style={[
                styles.toastContainer,
                {
                    transform: [{ translateY }, { scale }],
                    opacity,
                    borderLeftColor: getBorderColor(),
                    backgroundColor: getGradientColors(),
                },
            ]}
        >
            <View style={styles.toastContent}>
                <View style={styles.toastIconContainer}>
                    <ToastIcon type={toast.type} />
                </View>
                <View style={styles.toastTextContainer}>
                    <Text style={styles.toastTitle}>{toast.title}</Text>
                    {toast.message && <Text style={styles.toastMessage}>{toast.message}</Text>}
                </View>
                <TouchableOpacity onPress={hideWithAnimation} style={styles.toastCloseButton}>
                    <Ionicons name="close" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            {/* Decorative elements */}
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
    }, [visible]);

    if (!options) return null;

    const getTypeStyles = () => {
        const typeMap = {
            warning: {
                iconName: 'warning' as keyof typeof Ionicons.glyphMap,
                iconColor: '#F59E0B',
                iconBg: 'rgba(245, 158, 11, 0.15)',
                confirmBg: '#F59E0B',
            },
            danger: {
                iconName: 'trash' as keyof typeof Ionicons.glyphMap,
                iconColor: '#EF4444',
                iconBg: 'rgba(239, 68, 68, 0.15)',
                confirmBg: '#EF4444',
            },
            info: {
                iconName: 'information-circle' as keyof typeof Ionicons.glyphMap,
                iconColor: '#3B82F6',
                iconBg: 'rgba(59, 130, 246, 0.15)',
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
                <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
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

                    {/* Decorative sparkles */}
                    <View style={styles.sparkleContainer}>
                        <View style={[styles.sparkle, styles.sparkle1]} />
                        <View style={[styles.sparkle, styles.sparkle2]} />
                        <View style={[styles.sparkle, styles.sparkle3]} />
                    </View>

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

            {/* Toast Container */}
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
    // Toast styles
    toastWrapper: {
        position: 'absolute',
        bottom: 140,
        left: 0,
        right: 0,
        zIndex: 9999,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    toastContainer: {
        width: width - 32,
        backgroundColor: 'rgba(30, 30, 35, 0.95)',
        borderRadius: 16,
        marginBottom: 8,
        overflow: 'hidden',
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 12,
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
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    toastTextContainer: {
        flex: 1,
    },
    toastTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    toastMessage: {
        color: '#9CA3AF',
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
        height: 2,
        opacity: 0.3,
    },

    // Modal styles
    modalBackdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContainer: {
        width: width - 48,
        backgroundColor: '#1E1E23',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        overflow: 'hidden',
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
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },
    modalMessage: {
        color: '#9CA3AF',
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
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#9CA3AF',
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

    // Decorative sparkles
    sparkleContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
    },
    sparkle: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    sparkle1: {
        top: 30,
        right: 30,
    },
    sparkle2: {
        top: 50,
        left: 25,
    },
    sparkle3: {
        bottom: 80,
        right: 45,
    },
});
