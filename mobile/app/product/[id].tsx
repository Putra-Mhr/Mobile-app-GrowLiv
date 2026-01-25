import useCart from "@/hooks/useCart";
import { useProduct } from "@/hooks/useProduct";
import { useProductReviews } from "@/hooks/useProductReviews";
import useWishlist from "@/hooks/useWishlist";
import { Review, ReviewUser } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
} from "react-native";
import { useNotification } from "@/context/NotificationContext";

const { width } = Dimensions.get("window");

// Helper function to render stars
const RenderStars = ({ rating, size = 16 }: { rating: number; size?: number }) => {
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? "star" : star - 0.5 <= rating ? "star-half" : "star-outline"}
          size={size}
          color="#F59E0B"
        />
      ))}
    </View>
  );
};

// Review Card Component
const ReviewCard = ({ review }: { review: Review }) => {
  const user = typeof review.userId === "object" ? review.userId as ReviewUser : null;
  const date = new Date(review.createdAt).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
      <View className="flex-row items-center mb-3">
        <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
          ) : (
            <Ionicons name="person" size={20} color="#22C55E" />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-gray-800 font-bold">{user?.name || "Pengguna"}</Text>
          <Text className="text-gray-400 text-xs">{date}</Text>
        </View>
        <RenderStars rating={review.rating} size={14} />
      </View>
      {review.comment && (
        <Text className="text-gray-600 leading-5">{review.comment}</Text>
      )}
    </View>
  );
};

const ProductDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isError, isLoading } = useProduct(id);
  const { reviews, reviewStats } = useProductReviews(id || "");
  const { addToCart, isAddingToCart } = useCart();
  const { showToast } = useNotification();

  const { isInWishlist, toggleWishlist, isAddingToWishlist, isRemovingFromWishlist } =
    useWishlist();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);


  const handleAddToCart = () => {
    if (!product) return;
    addToCart(
      { productId: product._id, quantity },
      {
        onSuccess: () => {
          showToast('success', 'Ditambahkan!', `${product.name} ditambahkan ke keranjang`);
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
  if (isError || !product) return <ErrorUI />;

  const inStock = product.stock > 0;
  const displayRating = reviewStats.totalReviews > 0 ? reviewStats.averageRating : product.averageRating;
  const displayTotalReviews = reviewStats.totalReviews > 0 ? reviewStats.totalReviews : product.totalReviews;

  return (
    <View className="flex-1 bg-gray-50">
      {/* HEADER */}
      <View className="absolute top-0 left-0 right-0 z-10 px-6 pt-12 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          className="bg-white shadow-md w-12 h-12 rounded-full items-center justify-center"
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>

        <TouchableOpacity
          className={`w-12 h-12 rounded-full items-center justify-center shadow-md ${isInWishlist(product._id) ? "bg-red-500" : "bg-white"
            }`}
          onPress={() => toggleWishlist(product._id)}
          disabled={isAddingToWishlist || isRemovingFromWishlist}
          activeOpacity={0.7}
        >
          {isAddingToWishlist || isRemovingFromWishlist ? (
            <ActivityIndicator size="small" color={isInWishlist(product._id) ? "#FFFFFF" : "#22C55E"} />
          ) : (
            <Ionicons
              name={isInWishlist(product._id) ? "heart" : "heart-outline"}
              size={24}
              color={isInWishlist(product._id) ? "#FFFFFF" : "#EF4444"}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* IMAGE GALLERY */}
        <View className="relative">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setSelectedImageIndex(index);
            }}
          >
            {product.images.map((image: string, index: number) => (
              <View key={index} style={{ width }}>
                <Image source={image} style={{ width, height: 380 }} contentFit="cover" />
              </View>
            ))}
          </ScrollView>

          {/* Image Indicators */}
          <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
            {product.images.map((_: any, index: number) => (
              <View
                key={index}
                className={`h-2 rounded-full ${index === selectedImageIndex ? "bg-green-500 w-6" : "bg-gray-300 w-2"
                  }`}
              />
            ))}
          </View>
        </View>

        {/* PRODUCT INFO */}
        <View className="bg-white rounded-t-3xl -mt-6 p-6">
          {/* Category */}
          <View className="flex-row items-center mb-3">
            <View className="bg-green-100 px-3 py-1 rounded-full">
              <Text className="text-green-600 text-xs font-bold">{product.category}</Text>
            </View>
          </View>

          {/* Product Name */}
          <Text className="text-gray-800 text-2xl font-bold mb-3">{product.name}</Text>

          {/* Rating & Reviews Summary */}
          <View className="flex-row items-center mb-4">
            <View className="flex-row items-center bg-amber-50 px-3 py-2 rounded-full">
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text className="text-gray-800 font-bold ml-1 mr-2">
                {displayRating.toFixed(1)}
              </Text>
              <Text className="text-gray-500 text-sm">({displayTotalReviews} review)</Text>
            </View>
            {inStock ? (
              <View className="ml-3 flex-row items-center">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <Text className="text-green-600 font-semibold text-sm">
                  {product.stock} stok
                </Text>
              </View>
            ) : (
              <View className="ml-3 flex-row items-center">
                <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                <Text className="text-red-500 font-semibold text-sm">Stok Habis</Text>
              </View>
            )}
          </View>

          {/* Price */}
          <View className="flex-row items-center mb-6">
            <Text className="text-green-600 text-3xl font-bold">
              Rp {product.price.toLocaleString("id-ID")}
            </Text>
          </View>

          {/* Quantity */}
          <View className="mb-6">
            <Text className="text-gray-800 text-lg font-bold mb-3">Jumlah</Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                className="bg-gray-100 rounded-full w-12 h-12 items-center justify-center"
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                activeOpacity={0.7}
                disabled={!inStock}
              >
                <Ionicons name="remove" size={24} color={inStock ? "#374151" : "#9CA3AF"} />
              </TouchableOpacity>

              <Text className="text-gray-800 text-xl font-bold mx-6">{quantity}</Text>

              <TouchableOpacity
                className="bg-green-500 rounded-full w-12 h-12 items-center justify-center"
                onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                activeOpacity={0.7}
                disabled={!inStock || quantity >= product.stock}
              >
                <Ionicons
                  name="add"
                  size={24}
                  color={!inStock || quantity >= product.stock ? "#9CA3AF" : "#FFFFFF"}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View className="mb-8">
            <Text className="text-gray-800 text-lg font-bold mb-3">Deskripsi</Text>
            <Text className="text-gray-600 text-base leading-6">{product.description}</Text>
          </View>

          {/* Rating Distribution */}
          <View className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 mb-6">
            <View className="flex-row items-center mb-4">
              <Ionicons name="star" size={20} color="#F59E0B" />
              <Text className="text-gray-800 text-lg font-bold ml-2">Rating & Review</Text>
            </View>

            <View className="flex-row">
              {/* Left - Big Rating */}
              <View className="items-center mr-6">
                <Text className="text-4xl font-bold text-gray-800">{displayRating.toFixed(1)}</Text>
                <RenderStars rating={displayRating} size={18} />
                <Text className="text-gray-500 text-sm mt-1">{displayTotalReviews} review</Text>
              </View>

              {/* Right - Distribution Bars */}
              <View className="flex-1">
                {reviewStats.ratingDistribution.map(({ star, count, percentage }) => (
                  <View key={star} className="flex-row items-center mb-1">
                    <Text className="text-gray-600 text-xs w-4">{star}</Text>
                    <Ionicons name="star" size={10} color="#F59E0B" />
                    <View className="flex-1 h-2 bg-gray-200 rounded-full mx-2">
                      <View
                        className="h-2 bg-amber-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </View>
                    <Text className="text-gray-500 text-xs w-6">{count}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Write Review Section Removed - User must purchase to review via Order History */}

          {/* User Reviews List */}
          {reviews.length > 0 && (
            <View>
              <Text className="text-gray-800 text-lg font-bold mb-4">
                Review dari Pengguna ({reviews.length})
              </Text>
              {reviews.map((review) => (
                <ReviewCard key={review._id} review={review} />
              ))}
            </View>
          )}

          {reviews.length === 0 && (
            <View className="items-center py-8">
              <Ionicons name="chatbubble-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-400 mt-2">Belum ada review</Text>
              <Text className="text-gray-400 text-sm">Jadilah yang pertama memberikan review!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 pb-8">
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="text-gray-500 text-sm mb-1">Total Harga</Text>
            <Text className="text-green-600 text-2xl font-bold">
              Rp {(product.price * quantity).toLocaleString("id-ID")}
            </Text>
          </View>
          <TouchableOpacity
            className="rounded-2xl overflow-hidden shadow-lg shadow-green-200"
            activeOpacity={0.8}
            onPress={handleAddToCart}
            disabled={!inStock || isAddingToCart}
          >
            <LinearGradient
              colors={!inStock ? ["#9CA3AF", "#6B7280"] : ["#22C55E", "#15803D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="px-8 py-4 flex-row items-center"
            >
              {isAddingToCart ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="cart" size={24} color="#FFFFFF" />
                  <Text className="font-bold text-lg ml-2 text-white">
                    {!inStock ? "Stok Habis" : "Tambah"}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default ProductDetailScreen;

function ErrorUI() {
  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-1 items-center justify-center px-6">
        <View className="bg-red-50 p-6 rounded-full mb-4">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        </View>
        <Text className="text-gray-800 font-semibold text-xl mt-4">Produk tidak ditemukan</Text>
        <Text className="text-gray-500 text-center mt-2">
          Produk ini mungkin sudah dihapus atau tidak ada
        </Text>
        <TouchableOpacity
          className="bg-green-500 rounded-2xl px-6 py-3 mt-6"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">Kembali</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function LoadingUI() {
  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-gray-500 mt-4">Memuat produk...</Text>
      </View>
    </View>
  );
}
