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
}

const ProductsGrid = ({ products, isLoading, isError }: ProductsGridProps) => {
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
        },
        onError: (error: any) => {
          showToast('error', 'Failed to Add', error?.response?.data?.error || 'Could not add item to cart');
        },
      }
    );
  };

  const renderProduct = ({ item: product, index }: { item: Product; index: number }) => {
    // Alternate background colors
    const bgColor = index % 2 === 0 ? "#FEF9C3" : "#DCFCE7";

    return (
      <TouchableOpacity
        style={{
          width: "48%",
          backgroundColor: bgColor,
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 12,
        }}
        activeOpacity={0.8}
        onPress={() => router.push(`/product/${product._id}`)}
      >
        <View className="relative">
          <Image
            source={{ uri: product.images[0] }}
            style={{ width: "100%", height: 140, backgroundColor: "#F3F4F6" }}
            resizeMode="cover"
          />

          {/* NEW Badge */}
          <View
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              backgroundColor: "#22C55E",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 4,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "700" }}>NEW</Text>
          </View>

          {/* Wishlist Button */}
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              backgroundColor: "rgba(255,255,255,0.9)",
              padding: 6,
              borderRadius: 20,
            }}
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

        <View style={{ padding: 12 }}>
          <Text style={{ color: "#22C55E", fontSize: 10, fontWeight: "500", marginBottom: 4 }}>
            {product.category.toUpperCase()}
          </Text>
          <Text
            style={{ color: "#1F2937", fontWeight: "700", fontSize: 14, marginBottom: 8 }}
            numberOfLines={1}
          >
            {product.name}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Ionicons name="star" size={12} color="#FFC107" />
            <Ionicons name="star" size={12} color="#FFC107" />
            <Ionicons name="star" size={12} color="#FFC107" />
            <Ionicons name="star" size={12} color="#FFC107" />
            <Ionicons name="star-half" size={12} color="#FFC107" />
            <Text style={{ color: "#6B7280", fontSize: 11, marginLeft: 4 }}>
              {product.totalReviews}
            </Text>
          </View>

          <Text style={{ color: "#1F2937", fontWeight: "700", fontSize: 16 }}>
            Rp {product.price.toLocaleString("id-ID")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

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
    <FlatList
      data={products}
      renderItem={renderProduct}
      keyExtractor={(item) => item._id}
      numColumns={2}
      columnWrapperStyle={{ justifyContent: "space-between" }}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
      ListEmptyComponent={NoProductsFound}
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

