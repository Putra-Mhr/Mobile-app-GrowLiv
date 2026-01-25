import useCart from "@/hooks/useCart";
import { useProduct } from "@/hooks/useProduct";
import { useProductReviews } from "@/hooks/useProductReviews";
import useWishlist from "@/hooks/useWishlist";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import { useNotification } from "@/context/NotificationContext";

import ImageGallery from "@/components/product/ImageGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ReviewList from "@/components/product/ReviewList";
import BottomActionBar from "@/components/product/BottomActionBar";

const ProductDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isError, isLoading } = useProduct(id);
  const { reviews, reviewStats } = useProductReviews(id || "");
  const { addToCart, isAddingToCart } = useCart();
  const { showToast } = useNotification();

  const { isInWishlist, toggleWishlist, isAddingToWishlist, isRemovingFromWishlist } =
    useWishlist();

  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(
      { productId: product._id, quantity },
      {
        onSuccess: () => {
          showToast("success", "Ditambahkan!", `${product.name} ditambahkan ke keranjang`);
          // Auto-redirect to cart page
          router.push("/(tabs)/cart");
        },
        onError: (error: any) => {
          showToast(
            "error",
            "Gagal",
            error?.response?.data?.error || "Gagal menambahkan ke keranjang"
          );
        },
      }
    );
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
            <ActivityIndicator
              size="small"
              color={isInWishlist(product._id) ? "#FFFFFF" : "#22C55E"}
            />
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
        <ImageGallery images={product.images} />

        <ProductInfo
          product={product}
          reviewStats={reviewStats}
          inStock={inStock}
          quantity={quantity}
          setQuantity={setQuantity}
        />

        <ReviewList reviews={reviews} />
      </ScrollView>

      <BottomActionBar
        price={product.price}
        quantity={quantity}
        inStock={inStock}
        isAddingToCart={isAddingToCart}
        onAddToCart={handleAddToCart}
      />
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
