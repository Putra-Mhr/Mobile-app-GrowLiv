import React, { useState } from "react";
import { Modal, View, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";

interface MidtransPaymentProps {
    isVisible: boolean;
    paymentUrl: string | null;
    onClose: () => void;
    onSuccess: (orderId: string) => void;
    onPending: (orderId: string) => void;
    onError: () => void;
}

export const MidtransPayment = ({
    isVisible,
    paymentUrl,
    onClose,
    onSuccess,
    onPending,
    onError,
}: MidtransPaymentProps) => {
    const [loading, setLoading] = useState(true);

    if (!paymentUrl) return null;

    const handleNavigationStateChange = (navState: any) => {
        const { url } = navState;

        // Midtrans redirects to these URLs after payment
        // You should configure these in your Midtrans Dashboard -> Snap Preference -> System Settings
        // Default finish URL pattern often contains "status_code" or specific paths if configured,
        // otherwise Midtrans might just show a success screen within the WebView.
        // However, usually we can detect generic success/failure indicators or wait for the user to close X.
        // Better yet: Midtrans Snap allows callback to specific redirect_url.
        // If we don't set redirect_url in payload, it uses dashboard settings.
        // We can also check for "gopay" app deep links etc.

        // For simplicity, we detect standard Midtrans completion keywords if they redirect back to our site
        // or standard finish urls.
        // Note: The most reliable way is Webhooks. The Frontend just needs to know when to close.

        if (url.includes("status_code=200") || url.includes("transaction_status=settlement") || url.includes("success")) {
            // Close modal and trigger success (which might poll backend)
            // We can extract order_id if present
            onSuccess("");
        } else if (url.includes("pending") || url.includes("status_code=201")) {
            onPending("");
        } else if (url.includes("status_code=202") || url.includes("deny") || url.includes("cancel")) {
            onError();
        }
    };

    return (
        <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
            <View className="flex-1 bg-white">
                <View className="h-14 flex-row items-center justify-between px-4 mt-6 border-b border-gray-200">
                    <Text className="text-lg font-bold">Payment</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={28} color="black" />
                    </TouchableOpacity>
                </View>
                <View className="flex-1 relative">
                    {loading && (
                        <View className="absolute inset-0 flex items-center justify-center bg-white z-10">
                            <ActivityIndicator size="large" color="#22C55E" />
                        </View>
                    )}
                    <WebView
                        source={{ uri: paymentUrl }}
                        onLoadEnd={() => setLoading(false)}
                        onNavigationStateChange={handleNavigationStateChange}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        startInLoadingState={true}
                    />
                </View>
            </View>
        </Modal>
    );
};
