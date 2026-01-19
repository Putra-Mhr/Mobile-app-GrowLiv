import SafeScreen from "@/components/SafeScreen";
import { useAddresses } from "@/hooks/useAddressess";
import useCart from "@/hooks/useCart";
import { useApi } from "@/lib/api";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { useState } from "react";
import { Address } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import OrderSummary from "@/components/OrderSummary";
import AddressSelectionModal from "@/components/AddressSelectionModal";
import { MidtransPayment } from "@/components/MidtransPayment";
import { useNotification } from "@/context/NotificationContext";

import * as Sentry from "@sentry/react-native";
import { LinearGradient } from "expo-linear-gradient";

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
  } = useCart();
  const { addresses } = useAddresses();
  const { showToast, showConfirmation } = useNotification();

  /* const { initPaymentSheet, presentPaymentSheet } = useStripe(); */

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [midtransVisible, setMidtransVisible] = useState(false);
  const [midtransUrl, setMidtransUrl] = useState<string | null>(null);

  const cartItems = cart?.items || [];
  const subtotal = cartTotal;
  const shipping = 15000; // Rp 15000 shipping fee
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  const handleQuantityChange = (productId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    updateQuantity({ productId, quantity: newQuantity });
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    showConfirmation({
      title: 'Remove Item',
      message: `Remove "${productName}" from your cart?`,
      type: 'danger',
      confirmText: 'Remove',
      cancelText: 'Keep',
      onConfirm: () => removeFromCart(productId),
    });
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    // check if user has addresses
    if (!addresses || addresses.length === 0) {
      showConfirmation({
        title: 'No Address',
        message: 'Please add a shipping address in your profile before checking out.',
        type: 'info',
        confirmText: 'OK',
        onConfirm: () => { },
      });
      return;
    }

    // show address selection modal
    setAddressModalVisible(true);
  };

  const handleProceedWithPayment = async (selectedAddress: Address) => {
    setAddressModalVisible(false);

    // log chechkout initiated
    Sentry.logger.info("Checkout initiated", {
      itemCount: cartItemCount,
      total: total.toFixed(2),
      city: selectedAddress.city,
    });

    try {
      setPaymentLoading(true);

      // create snap transaction
      const { data } = await api.post("/payment/create-snap-transaction", {
        cartItems,
        shippingAddress: {
          fullName: selectedAddress.fullName,
          streetAddress: selectedAddress.streetAddress,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.zipCode,
          phoneNumber: selectedAddress.phoneNumber,
        },
      });

      if (data.redirect_url) {
        setMidtransUrl(data.redirect_url);
        setMidtransVisible(true);
      } else {
        showToast('error', 'Payment Error', 'Failed to get payment URL');
      }

    } catch (error) {
      Sentry.logger.error("Payment failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        cartTotal: total,
        itemCount: cartItems.length,
      });

      showToast('error', 'Payment Failed', 'Failed to process payment. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleMidtransSuccess = (orderId: string) => {
    setMidtransVisible(false);
    showToast('success', 'Payment Successful! 🎉', 'Your order is being processed');
    clearCart();
    // Navigate to order details or success page? For now just clear cart
  };

  const handleMidtransPending = (orderId: string) => {
    setMidtransVisible(false);
    showToast('info', 'Payment Pending', 'Please complete your payment.');
    clearCart(); // Optional: clear cart or keep it? Usually clear if order created.
  };

  const handleMidtransError = () => {
    setMidtransVisible(false);
    showToast('error', 'Payment Cancelled', 'You cancelled the payment.');
  };

  if (isLoading) return <LoadingUI />;
  if (isError) return <ErrorUI />;
  if (cartItems.length === 0) return <EmptyUI />;

  return (
    <View className="flex-1 bg-white">
      {/* Green Header Background */}
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
        <Text className="text-white text-3xl font-bold tracking-tight">Keranjang</Text>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 240 }}
      >
        <View className="px-6 gap-3 mt-4">
          {cartItems.map((item, index) => (
            <View key={item._id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
              <View className="p-4 flex-row">
                {/* product image */}
                <View className="relative">
                  <Image
                    source={item.product?.images?.[0] || { uri: "https://via.placeholder.com/100" }}
                    className="bg-gray-100"
                    contentFit="cover"
                    style={{ width: 100, height: 100, borderRadius: 16 }}
                  />
                  <View className="absolute top-2 right-2 bg-green-500 rounded-full px-2 py-0.5">
                    <Text className="text-white text-xs font-bold">×{item.quantity}</Text>
                  </View>
                </View>

                <View className="flex-1 ml-4 justify-between">
                  <View>
                    <Text
                      className="text-gray-800 font-bold text-lg leading-tight"
                      numberOfLines={2}
                    >
                      {item.product?.name || "Unknown Product"}
                    </Text>
                    <View className="flex-row items-center mt-2">
                      <Text className="text-green-600 font-bold text-xl">
                        {item.product?.price ? `Rp ${(item.product.price * item.quantity).toLocaleString("id-ID")}` : "Unavailable"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mt-2">
                    <View className="flex-row items-center bg-gray-50 rounded-full">
                      <TouchableOpacity
                        className="w-8 h-8 items-center justify-center rounded-full bg-white shadow-sm"
                        onPress={() => handleQuantityChange(item.product._id, item.quantity, -1)}
                        disabled={isUpdating}
                      >
                        <Ionicons name="remove" size={16} color="#374151" />
                      </TouchableOpacity>

                      <Text className="text-gray-800 font-bold text-base mx-3">{item.quantity}</Text>

                      <TouchableOpacity
                        className="w-8 h-8 items-center justify-center rounded-full bg-green-500 shadow-sm"
                        onPress={() => handleQuantityChange(item.product._id, item.quantity, 1)}
                        disabled={isUpdating}
                      >
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      className="w-8 h-8 items-center justify-center bg-red-50 rounded-full"
                      activeOpacity={0.7}
                      onPress={() => handleRemoveItem(item.product._id, item.product.name)}
                      disabled={isRemoving}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        <OrderSummary subtotal={subtotal} shipping={shipping} tax={tax} total={total} />
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 pt-4 pb-32 px-6"
      >
        {/* Quick Stats */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
              <Ionicons name="cart" size={20} color="#16A34A" />
            </View>
            <Text className="text-gray-500">
              {cartItemCount} {cartItemCount === 1 ? "barang" : "barang"}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-gray-800 font-bold text-xl">
              Rp {total.toLocaleString("id-ID")}
            </Text>
          </View>
        </View>

        {/* Checkout Button */}
        <TouchableOpacity
          className="bg-green-500 rounded-2xl overflow-hidden shadow-lg shadow-green-200"
          activeOpacity={0.9}
          onPress={handleCheckout}
          disabled={paymentLoading}
        >
          <LinearGradient
            colors={["#22C55E", "#15803D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-5 flex-row items-center justify-center"
          >
            {paymentLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text className="text-white font-bold text-lg mr-2">Bayar Sekarang</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <AddressSelectionModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        onProceed={handleProceedWithPayment}
        isProcessing={paymentLoading}
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
    <View className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" color="#00D9FF" />
      <Text className="text-text-secondary mt-4">Loading cart...</Text>
    </View>
  );
}

function ErrorUI() {
  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
      <Text className="text-text-primary font-semibold text-xl mt-4">Failed to load cart</Text>
      <Text className="text-text-secondary text-center mt-2">
        Please check your connection and try again
      </Text>
    </View>
  );
}

function EmptyUI() {
  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-16 pb-5">
        <Text className="text-text-primary text-3xl font-bold tracking-tight">Cart</Text>
      </View>
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="cart-outline" size={80} color="#666" />
        <Text className="text-text-primary font-semibold text-xl mt-4">Your cart is empty</Text>
        <Text className="text-text-secondary text-center mt-2">
          Add some products to get started
        </Text>
      </View>
    </View>
  );
}
