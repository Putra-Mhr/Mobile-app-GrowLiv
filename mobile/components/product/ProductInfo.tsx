import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Product, ReviewStats } from "@/types";
import { router } from "expo-router";

interface ProductInfoProps {
    product: Product;
    reviewStats: ReviewStats;
    inStock: boolean;
    quantity: number;
    setQuantity: (q: number) => void;
}

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

const ProductInfo = ({
    product,
    reviewStats,
    inStock,
    quantity,
    setQuantity,
}: ProductInfoProps) => {
    const displayRating =
        reviewStats.totalReviews > 0 ? reviewStats.averageRating : product.averageRating;
    const displayTotalReviews =
        reviewStats.totalReviews > 0 ? reviewStats.totalReviews : product.totalReviews;

    return (
        <View className="bg-white rounded-t-3xl -mt-6 p-6">
            {/* Category */}
            <View className="flex-row items-center mb-3">
                <View className="bg-green-100 px-3 py-1 rounded-full">
                    <Text className="text-green-600 text-xs font-bold">{product.category}</Text>
                </View>
            </View>

            {/* Product Name */}
            <Text className="text-gray-800 text-2xl font-bold mb-3">{product.name}</Text>

            {/* Store/Seller Info */}
            {product.store && (
                <TouchableOpacity
                    className="flex-row items-center bg-amber-50 p-3 rounded-xl mb-4"
                    onPress={() => router.push(`/store/${product.store?._id}` as any)}
                    activeOpacity={0.7}
                >
                    {product.store.imageUrl ? (
                        <Image
                            source={product.store.imageUrl}
                            style={{ width: 32, height: 32, borderRadius: 16 }}
                        />
                    ) : (
                        <View className="w-8 h-8 bg-amber-200 rounded-full items-center justify-center">
                            <Ionicons name="storefront" size={16} color="#D97706" />
                        </View>
                    )}
                    <View className="ml-3 flex-1">
                        <Text className="text-gray-500 text-xs">Dijual oleh</Text>
                        <Text className="text-amber-800 font-semibold">{product.store.name}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
            )}

            {/* Rating & Reviews Summary */}
            <View className="flex-row items-center mb-4">
                <View className="flex-row items-center bg-amber-50 px-3 py-2 rounded-full">
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <Text className="text-gray-800 font-bold ml-1 mr-2">{displayRating.toFixed(1)}</Text>
                    <Text className="text-gray-500 text-sm">({displayTotalReviews} review)</Text>
                </View>
                {inStock ? (
                    <View className="ml-3 flex-row items-center">
                        <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        <Text className="text-green-600 font-semibold text-sm">{product.stock} stok</Text>
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
                        {reviewStats.distribution.map(({ star, count, percentage }) => (
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
        </View>
    );
};

export default ProductInfo;
