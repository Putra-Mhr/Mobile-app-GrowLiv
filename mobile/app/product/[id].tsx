import SafeScreen from "@/components/SafeScreen";
import useCart from "@/hooks/useCart";
import { useProduct } from "@/hooks/useProduct";
import useWishlist from "@/hooks/useWishlist";
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

const ProductDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  console.log("ProductDetailScreen: Received id =", id);
  const { data: product, isError, isLoading } = useProduct(id);
  const { addToCart, isAddingToCart } = useCart();
  const { showToast } = useNotification();

  const { isInWishlist, toggleWishlist, isAddingToWishlist, isRemovingFromWishlist } =
    useWishlist();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(
      { productId: product._id, quantity },
      {
        onSuccess: () => showToast('success', 'Added to Cart!', `${product.name} has been added to your cart`),
        onError: (error: any) => {
          showToast('error', 'Failed to Add', error?.response?.data?.error || 'Could not add item to cart');
        },
      }
    );
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      showToast('warning', 'Rating Required', 'Please select a star rating');
      return;
    }
    setIsSubmittingReview(true);
    // Simulating review submission - in production, connect to backend
    setTimeout(() => {
      setIsSubmittingReview(false);
      showToast('success', 'Review Submitted!', 'Thank you for your feedback');
      setReviewRating(0);
      setReviewComment("");
    }, 1000);
  };

  if (isLoading) return <LoadingUI />;
  if (isError || !product) return <ErrorUI />;

  const inStock = product.stock > 0;

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

          {/* Rating & Reviews */}
          <View className="flex-row items-center mb-4">
            <View className="flex-row items-center bg-amber-50 px-3 py-2 rounded-full">
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text className="text-gray-800 font-bold ml-1 mr-2">
                {product.averageRating.toFixed(1)}
              </Text>
              <Text className="text-gray-500 text-sm">({product.totalReviews} reviews)</Text>
            </View>
            {inStock ? (
              <View className="ml-3 flex-row items-center">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <Text className="text-green-600 font-semibold text-sm">
                  {product.stock} in stock
                </Text>
              </View>
            ) : (
              <View className="ml-3 flex-row items-center">
                <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                <Text className="text-red-500 font-semibold text-sm">Out of Stock</Text>
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
            <Text className="text-gray-800 text-lg font-bold mb-3">Quantity</Text>

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

            {quantity >= product.stock && inStock && (
              <Text className="text-orange-500 text-sm mt-2">Maximum stock reached</Text>
            )}
          </View>

          {/* Description */}
          <View className="mb-8">
            <Text className="text-gray-800 text-lg font-bold mb-3">Description</Text>
            <Text className="text-gray-600 text-base leading-6">{product.description}</Text>
          </View>

          {/* Review Section */}
          <View className="bg-gray-50 rounded-2xl p-4 mb-4">
            <Text className="text-gray-800 text-lg font-bold mb-4">Write a Review</Text>

            {/* Star Rating */}
            <View className="flex-row items-center mb-4">
              <Text className="text-gray-600 mr-3">Your Rating:</Text>
              <View className="flex-row gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setReviewRating(star)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={star <= reviewRating ? "star" : "star-outline"}
                      size={28}
                      color={star <= reviewRating ? "#F59E0B" : "#D1D5DB"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Comment Input */}
            <TextInput
              className="bg-white border border-gray-200 rounded-xl p-4 text-gray-800 min-h-24"
              placeholder="Share your experience with this product..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              value={reviewComment}
              onChangeText={setReviewComment}
            />

            {/* Submit Button */}
            <TouchableOpacity
              className="mt-4 bg-green-500 rounded-xl py-3 items-center"
              onPress={handleSubmitReview}
              disabled={isSubmittingReview}
              activeOpacity={0.8}
            >
              {isSubmittingReview ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold">Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 pb-8">
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="text-gray-500 text-sm mb-1">Total Price</Text>
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
                    {!inStock ? "Stok Habis" : "Tambah ke Keranjang"}
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
        <Text className="text-gray-800 font-semibold text-xl mt-4">Product not found</Text>
        <Text className="text-gray-500 text-center mt-2">
          This product may have been removed or doesn&apos;t exist
        </Text>
        <TouchableOpacity
          className="bg-green-500 rounded-2xl px-6 py-3 mt-6"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">Go Back</Text>
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
        <Text className="text-gray-500 mt-4">Loading product...</Text>
      </View>
    </View>
  );
}
