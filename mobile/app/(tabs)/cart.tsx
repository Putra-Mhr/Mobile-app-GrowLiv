import { useAddresses } from "@/hooks/useAddresses";
import useCart from "@/hooks/useCart";
import { useApi } from "@/lib/api";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useState, useEffect } from "react";
import { Address } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import OrderSummary from "@/components/OrderSummary";
import AddressSelectionModal from "@/components/AddressSelectionModal";
import { MidtransPayment } from "@/components/MidtransPayment";
import { useNotification } from "@/context/NotificationContext";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { PageBackground } from "@/components/PageBackground";

const CartScreen = () => {
  const api = useApi();
  const {
    cart,
    cartItemCount,
    cartTotal,
    clearCart,
    isError,
    isLoading,
    isRemoving,
    isUpdating,
    removeFromCart,
    updateQuantity,
    refetch,
  } = useCart();
  const { addresses } = useAddresses();
  const { showToast, showConfirmation } = useNotification();

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [midtransVisible, setMidtransVisible] = useState(false);
  const [midtransUrl, setMidtransUrl] = useState<string | null>(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // Set default address on load
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddress) {
      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddress(defaultAddr);
    }
  }, [addresses]);

  // Calculate shipping cost when selectedAddress changes
  useEffect(() => {
    const calculateShipping = async () => {
      if (!selectedAddress?.coordinates) return;

      try {
        const { data } = await api.post("/cart/shipping", {
          coordinates: selectedAddress.coordinates
        });
        if (data && typeof data.total === 'number') {
          setShippingCost(data.total);
        }
      } catch (error) {
        console.error("Failed to calculate shipping:", error);
      }
    };

    calculateShipping();
  }, [selectedAddress]);

  const cartItems = cart?.items || [];
  const subtotal = cartTotal;
  const shipping = shippingCost;
  const adminFee = 1500; // Flat admin fee
  const total = subtotal + shipping + adminFee;

  const handleQuantityChange = (productId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    updateQuantity({ productId, quantity: newQuantity });
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    showConfirmation({
      title: 'Hapus Barang',
      message: `Hapus "${productName}" dari keranjang?`,
      type: 'danger',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      onConfirm: () => removeFromCart(productId),
    });
  };

  const handlePayment = async () => {
    if (cartItems.length === 0) return;

    if (!selectedAddress) {
      showConfirmation({
        title: 'Alamat Diperlukan',
        message: 'Pilih alamat pengiriman terlebih dahulu.',
        type: 'info',
        confirmText: 'Pilih Alamat',
        onConfirm: () => setAddressModalVisible(true),
      });
      return;
    }

    // Validate address has coordinates
    if (!selectedAddress.coordinates?.latitude || !selectedAddress.coordinates?.longitude) {
      showToast(
        'warning',
        'Lokasi Diperlukan',
        'Alamat yang dipilih tidak memiliki lokasi peta. Mohon ubah atau update alamat.',
      );
      return;
    }




    try {
      setPaymentLoading(true);

      const { data } = await api.post("/payment/create-snap-transaction", {
        cartItems,
        shippingAddress: {
          fullName: selectedAddress.fullName,
          streetAddress: selectedAddress.streetAddress,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.zipCode,
          phoneNumber: selectedAddress.phoneNumber,
          coordinates: selectedAddress.coordinates,
        },
      });

      if (data.redirect_url) {
        setMidtransUrl(data.redirect_url);
        setMidtransVisible(true);
      } else {
        showToast('error', 'Gagal Memproses', 'Gagal mendapatkan URL pembayaran');
      }

    } catch (error: any) {
      console.error("Payment failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        response: error?.response?.data,
      });
      const errorMessage = error?.response?.data?.error || 'Gagal memproses pembayaran. Silakan coba lagi.';
      showToast('error', 'Pembayaran Gagal', errorMessage);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleMidtransSuccess = (orderId: string) => {
    setMidtransVisible(false);

    clearCart();
    refetch();
    showToast('success', 'Pembayaran Berhasil! 🎉', 'Pesanan Anda sedang diproses');
    router.replace({ pathname: '/(profile)/orders', params: { orderId } });
  };

  const handleMidtransPending = (orderId: string) => {
    setMidtransVisible(false);

    clearCart();
    refetch();
    showToast('info', 'Menunggu Pembayaran', 'Silakan selesaikan pembayaran Anda.');
    router.replace('/(profile)/orders');
  };

  const handleMidtransError = () => {
    setMidtransVisible(false);
    showToast('error', 'Pembayaran Dibatalkan', 'Anda membatalkan pembayaran.');
  };

  if (isLoading) return <LoadingUI />;
  if (isError) return <ErrorUI />;
  if (cartItems.length === 0) return <EmptyUI />;

  return (
    <View className="flex-1">
      <PageBackground />
      {/* Green Header */}
      <LinearGradient
        colors={["#22C55E", "#16A34A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 50,
          paddingBottom: 20,
          paddingHorizontal: 24,
        }}
      >
        <View className="flex-row items-center">
          <View className="bg-white/20 p-2 rounded-xl mr-3">
            <Ionicons name="cart" size={24} color="#FFFFFF" />
          </View>
          <View>
            <Text className="text-white text-2xl font-bold">Keranjang</Text>
            <Text className="text-white/70 text-sm">{cartItemCount} barang siap checkout</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 240 }}
      >
        <View className="px-5 gap-3 mt-4">
          {cartItems.map((item, index) => (
            <View key={item._id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <View className="p-4 flex-row">
                <View className="relative">
                  <Image
                    source={item.product?.images?.[0] || { uri: "https://via.placeholder.com/100" }}
                    className="bg-gray-100"
                    contentFit="cover"
                    style={{ width: 90, height: 90, borderRadius: 12 }}
                  />
                  <View className="absolute -top-1 -left-1 bg-green-500 rounded-full p-1">
                    <Ionicons name="leaf" size={10} color="#FFFFFF" />
                  </View>
                </View>

                <View className="flex-1 ml-4 justify-between">
                  <View>
                    <Text className="text-gray-800 font-bold text-base leading-tight" numberOfLines={2}>
                      {item.product?.name || "Unknown Product"}
                    </Text>
                    <Text className="text-green-600 font-bold text-lg mt-1">
                      {item.product?.price ? `Rp ${(item.product.price * item.quantity).toLocaleString("id-ID")}` : "Unavailable"}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between mt-2">
                    <View className="flex-row items-center bg-gray-100 rounded-xl p-1">
                      <TouchableOpacity
                        className="w-8 h-8 items-center justify-center rounded-lg bg-white"
                        onPress={() => handleQuantityChange(item.product._id, item.quantity, -1)}
                        disabled={isUpdating}
                      >
                        <Ionicons name="remove" size={16} color="#374151" />
                      </TouchableOpacity>

                      <Text className="text-gray-800 font-bold text-base mx-4">{item.quantity}</Text>

                      <TouchableOpacity
                        className="w-8 h-8 items-center justify-center rounded-lg bg-green-500"
                        onPress={() => handleQuantityChange(item.product._id, item.quantity, 1)}
                        disabled={isUpdating}
                      >
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      className="w-9 h-9 items-center justify-center bg-red-50 rounded-xl"
                      activeOpacity={0.7}
                      onPress={() => handleRemoveItem(item.product._id, item.product.name)}
                      disabled={isRemoving}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Address Selection Card */}
        <View className="px-5 mt-6">
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Ionicons name="location" size={20} color="#22C55E" />
                <Text className="text-gray-800 text-lg font-bold ml-2">Alamat Pengiriman</Text>
              </View>
              <TouchableOpacity
                onPress={() => setAddressModalVisible(true)}
              >
                <Text className="text-green-600 font-bold text-sm">
                  {selectedAddress ? "Ubah" : "Pilih"}
                </Text>
              </TouchableOpacity>
            </View>

            {selectedAddress ? (
              <View>
                <View className="flex-row items-center mb-1">
                  <Text className="font-bold text-gray-800 mr-2">{selectedAddress.label}</Text>
                  {selectedAddress.isDefault && (
                    <View className="bg-green-100 px-2 py-0.5 rounded">
                      <Text className="text-green-700 text-xs font-bold">Utama</Text>
                    </View>
                  )}
                </View>
                <Text className="text-gray-600 font-medium">{selectedAddress.fullName}</Text>
                <Text className="text-gray-500 text-xs mt-1">{selectedAddress.phoneNumber}</Text>
                <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
                  {selectedAddress.streetAddress}, {selectedAddress.city}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setAddressModalVisible(true)}
                className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 items-center justify-center"
              >
                <Ionicons name="add-circle-outline" size={24} color="#9CA3AF" />
                <Text className="text-gray-400 font-medium mt-1">Pilih Alamat Pengiriman</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <OrderSummary subtotal={subtotal} shipping={shipping} adminFee={adminFee} total={total} isEstimate={!selectedAddress} />
      </ScrollView>

      {/* Bottom Checkout Section */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 pt-4 pb-32 px-5"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 8 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-green-100 items-center justify-center mr-3">
              <Ionicons name="leaf" size={20} color="#16A34A" />
            </View>
            <View>
              <Text className="text-gray-500 text-sm">Total Belanja</Text>
              <Text className="text-gray-800 font-bold text-xl">
                Rp {total.toLocaleString("id-ID")}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          className="overflow-hidden rounded-2xl shadow-lg"
          style={{ shadowColor: "#22C55E", shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}
          activeOpacity={0.9}
          onPress={handlePayment}
          disabled={paymentLoading}
        >
          <LinearGradient
            colors={["#22C55E", "#15803D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-4 flex-row items-center justify-center"
          >
            {paymentLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="card-outline" size={20} color="#FFFFFF" />
                <Text className="text-white font-bold text-lg ml-2">Bayar Sekarang</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <AddressSelectionModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        onProceed={(address) => {
          setSelectedAddress(address);
          setAddressModalVisible(false);
        }}
        isProcessing={false}
      />

      <MidtransPayment
        isVisible={midtransVisible}
        paymentUrl={midtransUrl}
        onClose={() => setMidtransVisible(false)}
        onSuccess={handleMidtransSuccess}
        onPending={handleMidtransPending}
        onError={handleMidtransError}
      />
    </View>
  );
};

export default CartScreen;

function LoadingUI() {
  return (
    <View className="flex-1 items-center justify-center">
      <PageBackground />
      <View className="bg-green-50 p-6 rounded-full mb-4">
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
      <Text className="text-gray-600 font-medium">Memuat keranjang...</Text>
    </View>
  );
}

function ErrorUI() {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <PageBackground />
      <View className="bg-red-50 p-6 rounded-full mb-4">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
      </View>
      <Text className="text-gray-800 font-bold text-xl mt-2">Gagal Memuat</Text>
      <Text className="text-gray-500 text-center mt-2">
        Periksa koneksi internet Anda dan coba lagi
      </Text>
    </View>
  );
}

function EmptyUI() {
  return (
    <View className="flex-1">
      <PageBackground />
      <LinearGradient
        colors={["#22C55E", "#16A34A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 50, paddingBottom: 20, paddingHorizontal: 24 }}
      >
        <Text className="text-white text-2xl font-bold">Keranjang</Text>
      </LinearGradient>

      <View className="flex-1 items-center justify-center px-8">
        <View className="relative mb-6">
          <View className="bg-green-50 p-8 rounded-full">
            <Ionicons name="cart-outline" size={64} color="#22C55E" />
          </View>
          <View className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-sm">
            <Ionicons name="leaf" size={24} color="#22C55E" />
          </View>
        </View>
        <Text className="text-gray-800 font-bold text-xl">Keranjang Kosong</Text>
        <Text className="text-gray-500 text-center mt-2 mb-6">
          Yuk mulai belanja produk segar dari petani lokal!
        </Text>
        <TouchableOpacity
          className="overflow-hidden rounded-xl"
          onPress={() => router.push("/(tabs)/shop")}
        >
          <LinearGradient
            colors={["#22C55E", "#15803D"]}
            className="px-8 py-3 flex-row items-center"
          >
            <Ionicons name="basket-outline" size={20} color="#FFFFFF" />
            <Text className="text-white font-bold ml-2">Mulai Belanja</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
