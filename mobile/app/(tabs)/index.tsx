import ProductsGrid from "@/components/ProductsGrid";
import useProducts from "@/hooks/useProducts";
import useNotifications from "@/hooks/useNotifications";
import useWishlist from "@/hooks/useWishlist";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";
import { useUser } from "@clerk/clerk-expo";

import { PageBackground } from "@/components/PageBackground";
import HomeHeader from "@/components/home/HomeHeader";
import BannerCarousel from "@/components/home/BannerCarousel";
import CategoryList from "@/components/home/CategoryList";
import { BANNERS, CATEGORIES } from "@/constants/data";
import useSmartSearch from "@/hooks/useSmartSearch";

const HomeScreen = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const { data: products, isLoading, isError } = useProducts();
    const { unreadCount } = useNotifications();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { user } = useUser();

    // First filter by category if needed
    const categoryFilteredProducts = useMemo(() => {
        if (!products) return [];
        if (selectedCategory === "All") return products;
        return products.filter((p) =>
            p.category && p.category.toLowerCase().includes(selectedCategory.toLowerCase())
        );
    }, [products, selectedCategory]);

    // Then apply Smart Search (Fuzzy) on the category-filtered results
    // keys: ["name", "category"] allows fuzzy match on title and category
    const filteredProducts = useSmartSearch(categoryFilteredProducts, searchQuery, {
        keys: ["name", "category"],
        threshold: 0.3 // Strictness: lower is stricter, 0.3 is good for typos
    });

    // Get featured products (first 6 for horizontal scroll)
    const featuredProducts = useMemo(() => {
        if (!products) return [];
        return products.slice(0, 6);
    }, [products]);

    return (
        <View className="flex-1">
            <PageBackground />

            <HomeHeader
                user={user}
                unreadCount={unreadCount}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <BannerCarousel
                    banners={BANNERS}
                    onSelectCategory={setSelectedCategory}
                />

                <CategoryList
                    categories={CATEGORIES}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                />

                {/* Featured Products - Horizontal Scroll */}
                {selectedCategory === "All" && featuredProducts.length > 0 && (
                    <View className="mt-8 bg-white py-4">
                        <View className="px-5 flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center">
                                <View className="bg-amber-100 p-2 rounded-lg mr-2">
                                    <Ionicons name="star" size={16} color="#F59E0B" />
                                </View>
                                <Text className="text-gray-800 text-lg font-bold">Populer Minggu Ini</Text>
                            </View>
                            <TouchableOpacity onPress={() => router.push("/(tabs)/shop?filter=popular")}>
                                <Text className="text-amber-500 font-medium">Lihat Semua</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                        >
                            {featuredProducts.map((product) => (
                                <TouchableOpacity
                                    key={product._id}
                                    style={{
                                        width: 160,
                                        backgroundColor: "#FFFFFF",
                                        borderRadius: 16,
                                        overflow: "hidden",
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.1,
                                        shadowRadius: 4,
                                        elevation: 3,
                                        borderWidth: 1,
                                        borderColor: "#E5E7EB",
                                    }}
                                    activeOpacity={0.8}
                                    onPress={() => router.push(`/product/${product._id}`)}
                                >
                                    <View style={{ position: "relative" }}>
                                        <Image
                                            source={{ uri: product.images?.[0] || "https://via.placeholder.com/150" }}
                                            style={{ width: 160, height: 120 }}
                                            resizeMode="cover"
                                        />
                                        {/* Wishlist Button */}
                                        <TouchableOpacity
                                            style={{
                                                position: "absolute",
                                                top: 8,
                                                right: 8,
                                                backgroundColor: "rgba(255,255,255,0.95)",
                                                padding: 6,
                                                borderRadius: 20,
                                                shadowColor: "#000",
                                                shadowOffset: { width: 0, height: 1 },
                                                shadowOpacity: 0.2,
                                                shadowRadius: 2,
                                                elevation: 2,
                                            }}
                                            activeOpacity={0.7}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                toggleWishlist(product._id);
                                            }}
                                        >
                                            <Ionicons
                                                name={isInWishlist(product._id) ? "heart" : "heart-outline"}
                                                size={18}
                                                color={isInWishlist(product._id) ? "#EF4444" : "#9CA3AF"}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ padding: 12 }}>
                                        <Text className="text-gray-800 font-semibold text-sm" numberOfLines={1}>
                                            {product.name}
                                        </Text>
                                        <Text className="text-green-600 font-bold mt-1">
                                            Rp {product.price.toLocaleString("id-ID")}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Products Section */}
                <View className="px-5 mt-6">
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center">
                            <View className="bg-green-100 p-2 rounded-lg mr-2">
                                <Ionicons name="grid" size={16} color="#22C55E" />
                            </View>
                            <Text className="text-gray-800 text-lg font-bold">
                                {selectedCategory === "All" ? "Rekomendasi Pilihan" : `Kategori ${CATEGORIES.find(c => c.name === selectedCategory)?.label}`}
                            </Text>
                        </View>
                        {selectedCategory === "All" && (
                            <TouchableOpacity onPress={() => router.push("/(tabs)/shop")}>
                                <Text className="text-green-500 font-medium">Lihat Semua</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Products Grid */}
                    <ProductsGrid products={filteredProducts} isLoading={isLoading} isError={isError} />
                </View>
            </ScrollView>
        </View>
    );
};

export default HomeScreen;
