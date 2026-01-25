import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Order } from "@/types";
import { formatDate, getStatusColor, capitalizeFirstLetter } from "@/lib/utils";
import OrderTimeline from "@/components/OrderTimeline";
import OrderSummary from "@/components/OrderSummary";
import RatingModal from "@/components/RatingModal";
import { useReviews } from "@/hooks/useReviews";
import { useNotification } from "@/context/NotificationContext";
import { useState } from "react";

export default function OrderDetailScreen() {
    const params = useLocalSearchParams();
    const { createReviewAsync, isCreatingReview } = useReviews();
    const { showToast } = useNotification();

    const [showRatingModal, setShowRatingModal] = useState(false);
    const [productRatings, setProductRatings] = useState<{ [key: string]: number }>({});
    const [productComments, setProductComments] = useState<{ [key: string]: string }>({});

    // Parse the order string back to object
    // Note: For production, better to fetch by ID. For now passing params is faster.
    const order: Order = params.order ? JSON.parse(params.order as string) : null;

    const handleOpenRating = () => {
        if (!order) return;
        setShowRatingModal(true);

        const initialRatings: { [key: string]: number } = {};
        const initialComments: { [key: string]: string } = {};
        order.orderItems.forEach((item) => {
            const productId = item.product._id;
            initialRatings[productId] = 0;
            initialComments[productId] = "";
        });
        setProductRatings(initialRatings);
        setProductComments(initialComments);
    };

    const handleSubmitRating = async () => {
        if (!order) return;

        const allRated = Object.values(productRatings).every((rating) => rating > 0);
        if (!allRated) {
            showToast('warning', 'Rating Belum Lengkap', 'Berikan rating untuk semua produk');
            return;
        }

        try {
            await Promise.all(
                order.orderItems.map((item) => {
                    createReviewAsync({
                        productId: item.product._id,
                        orderId: order._id,
                        rating: productRatings[item.product._id],
                        comment: productComments[item.product._id],
                    });
                })
            );

            showToast('success', 'Terima Kasih! ⭐', 'Rating Anda telah dikirim');
            setShowRatingModal(false);
            setProductRatings({});
            setProductComments({});
        } catch (error: any) {
            showToast('error', 'Gagal Mengirim', error?.response?.data?.error || 'Gagal mengirim rating');
        }
    };

    if (!order) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <Text>Order not found</Text>
            </View>
        );
    }

    // Calculate costs manually since they might not be stored directly if old order
    // Assuming simplified calc for display if not available
    const subtotal = order.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = order.totalPrice;
    const adminFee = 1500;
    const shipping = total - subtotal - adminFee;

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <LinearGradient
                colors={["#22C55E", "#16A34A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 }}
            >
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-white/20 p-2 rounded-xl mr-3"
                    >
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-white text-2xl font-bold">Detail Pesanan</Text>
                        <Text className="text-white/70 text-sm">#{order._id.slice(-8).toUpperCase()}</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>

                {/* Status Banner */}
                <View className="px-5 py-4 bg-white border-b border-gray-100">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-gray-500 font-medium">Status Pesanan</Text>
                        <View
                            className="px-3 py-1 rounded-full flex-row items-center"
                            style={{ backgroundColor: getStatusColor(order.status) + "20" }}
                        >
                            <Text
                                className="font-bold text-sm"
                                style={{ color: getStatusColor(order.status) }}
                            >
                                {capitalizeFirstLetter(order.status)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Tracking Timeline */}
                {order.trackingHistory && order.trackingHistory.length > 0 && (
                    <OrderTimeline events={order.trackingHistory} />
                )}

                {/* Shipping Address */}
                <View className="px-5 mt-4">
                    <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <Text className="text-gray-800 text-lg font-bold mb-3">Alamat Pengiriman</Text>
                        <View className="flex-row">
                            <Ionicons name="location-outline" size={20} color="#6B7280" style={{ marginTop: 2 }} />
                            <View className="ml-3 flex-1">
                                <Text className="font-bold text-gray-800 text-base">{order.shippingAddress.fullName}</Text>
                                <Text className="text-gray-600 mt-1">{order.shippingAddress.phoneNumber}</Text>
                                <Text className="text-gray-600 mt-1">
                                    {order.shippingAddress.streetAddress}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Order Items */}
                <View className="px-5 mt-4">
                    <Text className="text-gray-800 text-lg font-bold mb-3 ml-2">Produk Dibeli</Text>
                    {order.orderItems.map((item) => (
                        <View key={item._id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 flex-row">
                            <Image
                                source={{ uri: item.image }}
                                style={{ width: 60, height: 60, borderRadius: 10, backgroundColor: '#f0f0f0' }}
                            />
                            <View className="ml-3 flex-1 justify-center">
                                <Text className="text-gray-800 font-bold text-base" numberOfLines={2}>{item.name}</Text>
                                <View className="flex-row justify-between mt-1">
                                    <Text className="text-gray-500">{item.quantity} x Rp {item.price.toLocaleString("id-ID")}</Text>
                                    <Text className="text-gray-800 font-bold">Rp {(item.price * item.quantity).toLocaleString("id-ID")}</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Payment Summary */}
                <OrderSummary
                    subtotal={subtotal}
                    shipping={shipping}
                    adminFee={adminFee}
                    total={total}
                />

                {/* Review Button */}
                {order.status === "delivered" && (
                    <View className="px-5 mt-6 mb-8">
                        <TouchableOpacity
                            className={`rounded-2xl py-4 flex-row items-center justify-center shadow-sm ${order.hasReviewed ? "bg-green-100" : "bg-amber-500"
                                }`}
                            onPress={handleOpenRating}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={order.hasReviewed ? "create-outline" : "star"}
                                size={20}
                                color={order.hasReviewed ? "#16A34A" : "#FFFFFF"}
                            />
                            <Text
                                className={`font-bold text-lg ml-2 ${order.hasReviewed ? "text-green-700" : "text-white"
                                    }`}
                            >
                                {order.hasReviewed ? "Ubah Review" : "Beri Rating"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View className="h-10" />
            </ScrollView>

            <RatingModal
                visible={showRatingModal}
                onClose={() => setShowRatingModal(false)}
                order={order}
                productRatings={productRatings}
                productComments={productComments}
                onSubmit={handleSubmitRating}
                isSubmitting={isCreatingReview}
                onRatingChange={(productId, rating) =>
                    setProductRatings((prev) => ({ ...prev, [productId]: rating }))
                }
                onCommentChange={(productId, comment) =>
                    setProductComments((prev) => ({ ...prev, [productId]: comment }))
                }
            />
        </View>
    );
}
