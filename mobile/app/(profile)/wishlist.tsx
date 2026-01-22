import useCart from "@/hooks/useCart";
import useWishlist from "@/hooks/useWishlist";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useNotification } from "@/context/NotificationContext";
import { LinearGradient } from "expo-linear-gradient";

function WishlistScreen() {
  const { wishlist, isLoading, isError, removeFromWishlist, isRemovingFromWishlist } =
    useWishlist();

  const { addToCart, isAddingToCart } = useCart();
  const { showToast, showConfirmation } = useNotification();

  const handleRemoveFromWishlist = (productId: string, productName: string) => {
    showConfirmation({
      title: 'Hapus dari Wishlist',
      message: `Hapus "${productName}" dari wishlist Anda?`,
      type: 'warning',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      onConfirm: () => removeFromWishlist(productId),
    });
  };

  const handleAddToCart = (productId: string, productName: string) => {
    addToCart(
      { productId, quantity: 1 },
      {
        onSuccess: () => {
          showToast('success', 'Berhasil! 🛒', `${productName} ditambahkan ke keranjang`);
          // Auto-redirect to cart page
          router.push('/(tabs)/cart');
        },
        onError: (error: any) => {
          showToast('error', 'Gagal', error?.response?.data?.error || 'Gagal menambahkan ke keranjang');
        },
      }
    );
  };

  if (isLoading) return <LoadingUI />;
  if (isError) return <ErrorUI />;

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
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Wishlist</Text>
            <Text className="text-white/70 text-sm">
              {wishlist.length} {wishlist.length === 1 ? "produk" : "produk"} favorit
            </Text>
          </View>
          {wishlist.length > 0 && (
            <View className="bg-white/20 px-3 py-1 rounded-full flex-row items-center">
              <Ionicons name="heart" size={14} color="#FFFFFF" />
              <Text className="text-white font-bold text-sm ml-1">{wishlist.length}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {wishlist.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="relative mb-6">
            <View className="bg-pink-50 p-8 rounded-full">
              <Ionicons name="heart-outline" size={64} color="#EC4899" />
            </View>
            <View className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-sm">
              <Ionicons name="leaf" size={24} color="#22C55E" />
            </View>
          </View>
          <Text className="text-gray-800 font-bold text-xl">Wishlist Kosong</Text>
          <Text className="text-gray-500 text-center mt-2 mb-6">
            Simpan produk favorit Anda di sini untuk belanja nanti!
          </Text>
          <TouchableOpacity
            className="overflow-hidden rounded-xl"
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)")}
          >
            <LinearGradient
              colors={["#22C55E", "#15803D"]}
              className="px-6 py-3 flex-row items-center"
            >
              <Ionicons name="search" size={18} color="#FFFFFF" />
              <Text className="text-white font-bold ml-2">Jelajahi Produk</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="px-5 py-4">
            {wishlist.map((item) => (
              <View
                key={item._id}
                className="bg-white rounded-2xl overflow-hidden mb-3 shadow-sm border border-gray-100"
              >
                <View className="flex-row p-4">
                  <View className="relative">
                    <Image
                      source={item.images[0]}
                      className="bg-gray-100"
                      style={{ width: 90, height: 90, borderRadius: 12 }}
                    />
                    {item.stock > 0 && (
                      <View className="absolute -top-1 -left-1 bg-green-500 rounded-full p-1">
                        <Ionicons name="leaf" size={10} color="#FFFFFF" />
                      </View>
                    )}
                  </View>

                  <View className="flex-1 ml-4">
                    <View className="flex-row items-start justify-between">
                      <Text className="text-gray-800 font-bold text-base flex-1 mr-2" numberOfLines={2}>
                        {item.name}
                      </Text>
                      <TouchableOpacity
                        className="bg-red-50 p-2 rounded-xl"
                        activeOpacity={0.7}
                        onPress={() => handleRemoveFromWishlist(item._id, item.name)}
                        disabled={isRemovingFromWishlist}
                      >
                        <Ionicons name="heart-dislike-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    <Text className="text-green-600 font-bold text-lg mt-1">
                      {item.price ? `Rp ${item.price.toLocaleString("id-ID")}` : "Unavailable"}
                    </Text>

                    <View className="flex-row items-center mt-2">
                      {item.stock > 0 ? (
                        <View className="flex-row items-center bg-green-50 px-2 py-1 rounded-full">
                          <View className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                          <Text className="text-green-600 text-xs font-medium">
                            {item.stock} tersedia
                          </Text>
                        </View>
                      ) : (
                        <View className="flex-row items-center bg-red-50 px-2 py-1 rounded-full">
                          <View className="w-2 h-2 bg-red-500 rounded-full mr-1" />
                          <Text className="text-red-500 text-xs font-medium">Stok Habis</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {item.stock > 0 && (
                  <View className="px-4 pb-4">
                    <TouchableOpacity
                      className="overflow-hidden rounded-xl"
                      activeOpacity={0.8}
                      onPress={() => handleAddToCart(item._id, item.name)}
                      disabled={isAddingToCart}
                    >
                      <LinearGradient
                        colors={["#22C55E", "#15803D"]}
                        className="py-3 flex-row items-center justify-center"
                      >
                        {isAddingToCart ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
                            <Text className="text-white font-bold ml-2">Tambah ke Keranjang</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
export default WishlistScreen;

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
          <Text className="text-white text-2xl font-bold">Wishlist</Text>
        </View>
      </LinearGradient>
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-gray-500 mt-4">Memuat wishlist...</Text>
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
          <Text className="text-white text-2xl font-bold">Wishlist</Text>
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
