import useCart from "@/hooks/useCart";
import useWishlist from "@/hooks/useWishlist";
import { Product } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useNotification } from "@/context/NotificationContext";

interface ProductsGridProps {
  isLoading: boolean;
  isError: boolean;
  products: Product[];
  ListHeaderComponent?: React.ReactElement | null;
}

const ProductsGrid = ({ products, isLoading, isError, ListHeaderComponent }: ProductsGridProps) => {
  const { isInWishlist, toggleWishlist, isAddingToWishlist, isRemovingFromWishlist } =
    useWishlist();

  const { isAddingToCart, addToCart } = useCart();
  const { showToast } = useNotification();

  const handleAddToCart = (productId: string, productName: string) => {
    addToCart(
      { productId, quantity: 1 },
      {
        onSuccess: () => {
          showToast('success', 'Added to Cart!', `${productName} has been added to your cart`);
          // Auto-redirect to cart page
          router.push('/(tabs)/cart');
        },
        onError: (error: any) => {
          showToast('error', 'Failed to Add', error?.response?.data?.error || 'Could not add item to cart');
        },
      }
    );
  };

  const renderProduct = ({ item: product, index }: { item: Product; index: number }) => {
    if (!product || !product.price) return null; // Skip invalid products

    // Alternate background colors
    const bgColor = index % 2 === 0 ? "#FEF9C3" : "#DCFCE7";

    // Check if product is new (created within last 24 hours)
    const isNewProduct = () => {
      if (!product.createdAt) return false;
      const createdDate = new Date(product.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - createdDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours <= 24;
    };

    return (
      <TouchableOpacity
        className={`w-[48%] rounded-2xl overflow-hidden mb-3 ${index % 2 === 0 ? "bg-yellow-100" : "bg-green-100"
          }`}
        activeOpacity={0.8}
        onPress={() => router.push(`/product/${product._id}`)}
      >
        <View className="relative">
          <Image
            source={{ uri: product.images[0] }}
            className="w-full h-[140px] bg-gray-100"
            resizeMode="cover"
          />

          {/* NEW Badge - only show for products created within 24 hours */}
          {isNewProduct() && (
            <View className="absolute top-2 left-2 bg-green-500 px-2 py-1 rounded">
              <Text className="text-white text-[10px] font-bold">NEW</Text>
            </View>
          )}

          {/* Wishlist Button */}
          <TouchableOpacity
            className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full"
            activeOpacity={0.7}
            onPress={() => toggleWishlist(product._id)}
            disabled={isAddingToWishlist || isRemovingFromWishlist}
          >
            {isAddingToWishlist || isRemovingFromWishlist ? (
              <ActivityIndicator size="small" color="#22C55E" />
            ) : (
              <Ionicons
                name={isInWishlist(product._id) ? "heart" : "heart-outline"}
                size={18}
                color={isInWishlist(product._id) ? "#EF4444" : "#9CA3AF"}
              />
            )}
          </TouchableOpacity>
        </View>

        <View className="p-3">
          <Text className="text-green-600 text-[10px] font-medium mb-1">
            {product.category.toUpperCase()}
          </Text>
          <Text
            className="text-gray-800 font-bold text-sm mb-2"
            numberOfLines={1}
          >
            {product.name}
          </Text>

          <View className="flex-row items-center mb-2">
            <Ionicons name="star" size={12} color="#FFC107" />
            <Ionicons name="star" size={12} color="#FFC107" />
            <Ionicons name="star" size={12} color="#FFC107" />
            <Ionicons name="star" size={12} color="#FFC107" />
            <Ionicons name="star-half" size={12} color="#FFC107" />
            <Text className="text-gray-500 text-[11px] ml-1">
              {product.totalReviews}
            </Text>
          </View>

          <Text className="text-gray-800 font-bold text-base">
            Rp {product.price.toLocaleString("id-ID")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={{ paddingVertical: 80, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={{ color: "#6B7280", marginTop: 16 }}>Loading products...</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={{ paddingVertical: 80, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={{ color: "#1F2937", fontWeight: "600", marginTop: 16 }}>
            Failed to load products
          </Text>
          <Text style={{ color: "#6B7280", fontSize: 14, marginTop: 8 }}>
            Please try again later
          </Text>
        </View>
      );
    }

    return (
      <View style={{ paddingVertical: 80, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="search-outline" size={48} color="#9CA3AF" />
        <Text style={{ color: "#1F2937", fontWeight: "600", marginTop: 16 }}>
          No products found
        </Text>
        <Text style={{ color: "#6B7280", fontSize: 14, marginTop: 8 }}>
          Try adjusting your filters
        </Text>
      </View>
    )
  }

  return (
    <FlatList
      data={products}
      renderItem={renderProduct}
      keyExtractor={(item) => item._id}
      numColumns={2}
      columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={{ paddingBottom: 100 }}
    />
  );
};

export default ProductsGrid;

function NoProductsFound() {
  return (
    <View style={{ paddingVertical: 80, alignItems: "center", justifyContent: "center" }}>
      <Ionicons name="search-outline" size={48} color="#9CA3AF" />
      <Text style={{ color: "#1F2937", fontWeight: "600", marginTop: 16 }}>
        No products found
      </Text>
      <Text style={{ color: "#6B7280", fontSize: 14, marginTop: 8 }}>
        Try adjusting your filters
      </Text>
    </View>
  );
}


