import RatingModal from "@/components/RatingModal";
import { useOrders } from "@/hooks/useOrders";
import { useReviews } from "@/hooks/useReviews";
import { capitalizeFirstLetter, formatDate, getStatusColor } from "@/lib/utils";
import { Order } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useNotification } from "@/context/NotificationContext";
import { LinearGradient } from "expo-linear-gradient";

const STATUS_ICONS: { [key: string]: { icon: string; label: string } } = {
  pending: { icon: "time-outline", label: "Menunggu" },
  processing: { icon: "reload-outline", label: "Diproses" },
  shipped: { icon: "car-outline", label: "Dikirim" },
  delivered: { icon: "checkmark-circle-outline", label: "Selesai" },
  cancelled: { icon: "close-circle-outline", label: "Dibatalkan" },
};

function OrdersScreen() {
  const { data: orders, isLoading, isError } = useOrders();
  const { createReviewAsync, isCreatingReview } = useReviews();
  const { showToast } = useNotification();

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [productRatings, setProductRatings] = useState<{ [key: string]: number }>({});
  const [productComments, setProductComments] = useState<{ [key: string]: string }>({});

  const handleOpenRating = (order: Order) => {
    setShowRatingModal(true);
    setSelectedOrder(order);

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
    if (!selectedOrder) return;

    const allRated = Object.values(productRatings).every((rating) => rating > 0);
    if (!allRated) {
      showToast('warning', 'Rating Belum Lengkap', 'Berikan rating untuk semua produk');
      return;
    }

    try {
      await Promise.all(
        selectedOrder.orderItems.map((item) => {
          createReviewAsync({
            productId: item.product._id,
            orderId: selectedOrder._id,
            rating: productRatings[item.product._id],
            comment: productComments[item.product._id],
          });
        })
      );

      showToast('success', 'Terima Kasih! ⭐', 'Rating Anda telah dikirim');
      setShowRatingModal(false);
      setSelectedOrder(null);
      setProductRatings({});
      setProductComments({});
    } catch (error: any) {
      showToast('error', 'Gagal Mengirim', error?.response?.data?.error || 'Gagal mengirim rating');
    }
  };

  if (isLoading) return <LoadingUI />;
  if (isError) return <ErrorUI />;
  if (!orders || orders.length === 0) return <EmptyUI />;

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
            <Text className="text-white text-2xl font-bold">Pesanan Saya</Text>
            <Text className="text-white/70 text-sm">{orders.length} pesanan</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-5 py-4">
          {orders.map((order) => {
            const totalItems = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
            const firstImage = order.orderItems[0]?.image || "";
            const statusInfo = STATUS_ICONS[order.status] || STATUS_ICONS.pending;

            return (
              <View key={order._id} className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
                {/* Order Header */}
                <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-gray-100">
                  <View className="flex-row items-center">
                    <View className="bg-green-50 p-2 rounded-lg mr-2">
                      <Ionicons name="receipt-outline" size={16} color="#22C55E" />
                    </View>
                    <View>
                      <Text className="text-gray-800 font-bold text-sm">
                        #{order._id.slice(-8).toUpperCase()}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        {formatDate(order.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <View
                    className="px-3 py-1 rounded-full flex-row items-center"
                    style={{ backgroundColor: getStatusColor(order.status) + "20" }}
                  >
                    <Ionicons
                      name={statusInfo.icon as any}
                      size={12}
                      color={getStatusColor(order.status)}
                    />
                    <Text
                      className="text-xs font-bold ml-1"
                      style={{ color: getStatusColor(order.status) }}
                    >
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>

                {/* Order Items */}
                <View className="flex-row mb-3">
                  <View className="relative">
                    <Image
                      source={firstImage}
                      style={{ height: 70, width: 70, borderRadius: 10 }}
                      contentFit="cover"
                    />
                    {order.orderItems.length > 1 && (
                      <View className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-6 h-6 items-center justify-center border-2 border-white">
                        <Text className="text-white text-xs font-bold">
                          +{order.orderItems.length - 1}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-1 ml-3">
                    {order.orderItems.slice(0, 2).map((item) => (
                      <Text
                        key={item._id}
                        className="text-gray-600 text-sm"
                        numberOfLines={1}
                      >
                        {item.name} × {item.quantity}
                      </Text>
                    ))}
                    {order.orderItems.length > 2 && (
                      <Text className="text-gray-400 text-xs mt-1">
                        +{order.orderItems.length - 2} produk lainnya
                      </Text>
                    )}
                  </View>
                </View>

                {/* Order Footer */}
                <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
                  <View>
                    <Text className="text-gray-500 text-xs">{totalItems} barang</Text>
                    <Text className="text-green-600 font-bold text-lg">
                      Rp {order.totalPrice.toLocaleString("id-ID")}
                    </Text>
                  </View>

                  {order.status === "delivered" &&
                    (order.hasReviewed ? (
                      <View className="bg-green-50 px-4 py-2 rounded-xl flex-row items-center">
                        <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                        <Text className="text-green-600 font-semibold text-sm ml-1">Sudah Direview</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        className="overflow-hidden rounded-xl"
                        activeOpacity={0.7}
                        onPress={() => handleOpenRating(order)}
                      >
                        <LinearGradient
                          colors={["#F59E0B", "#D97706"]}
                          className="px-4 py-2 flex-row items-center"
                        >
                          <Ionicons name="star" size={16} color="#FFFFFF" />
                          <Text className="text-white font-bold text-sm ml-1">Beri Rating</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        order={selectedOrder}
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
export default OrdersScreen;

function LoadingUI() {
  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient
        colors={["#22C55E", "#16A34A"]}
        style={{ paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="bg-white/20 p-2 rounded-xl mr-3">
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Pesanan Saya</Text>
        </View>
      </LinearGradient>
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-gray-500 mt-4">Memuat pesanan...</Text>
      </View>
    </View>
  );
}

function ErrorUI() {
  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient
        colors={["#22C55E", "#16A34A"]}
        style={{ paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="bg-white/20 p-2 rounded-xl mr-3">
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Pesanan Saya</Text>
        </View>
      </LinearGradient>
      <View className="flex-1 items-center justify-center px-6">
        <View className="bg-red-50 p-6 rounded-full mb-4">
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        </View>
        <Text className="text-gray-800 font-bold text-xl">Gagal Memuat</Text>
        <Text className="text-gray-500 text-center mt-2">
          Periksa koneksi internet Anda
        </Text>
      </View>
    </View>
  );
}

function EmptyUI() {
  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient
        colors={["#22C55E", "#16A34A"]}
        style={{ paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="bg-white/20 p-2 rounded-xl mr-3">
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Pesanan Saya</Text>
        </View>
      </LinearGradient>
      <View className="flex-1 items-center justify-center px-6">
        <View className="bg-green-50 p-6 rounded-full mb-4">
          <Ionicons name="receipt-outline" size={48} color="#22C55E" />
        </View>
        <Text className="text-gray-800 font-bold text-xl">Belum Ada Pesanan</Text>
        <Text className="text-gray-500 text-center mt-2">
          Riwayat pesanan Anda akan muncul di sini
        </Text>
      </View>
    </View>
  );
}
