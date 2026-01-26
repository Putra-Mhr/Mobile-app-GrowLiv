import ProductsGrid from "@/components/ProductsGrid";
import useProducts from "@/hooks/useProducts";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Dimensions } from "react-native";
import { PageBackground } from "@/components/PageBackground";

const { width } = Dimensions.get("window");

const CATEGORIES = [
    { name: "All", label: "Semua", icon: "grid", color: "#0D9488", bgColor: "#CCFBF1" },
    { name: "Sayuran", label: "Sayuran", icon: "leaf", color: "#16A34A", bgColor: "#DCFCE7" },
    { name: "Buah", label: "Buah", icon: "nutrition", color: "#EF4444", bgColor: "#FEE2E2" },
    { name: "Herbal", label: "Herbal", icon: "flower", color: "#06B6D4", bgColor: "#CFFAFE" },
    { name: "Rempah", label: "Rempah", icon: "flask", color: "#D97706", bgColor: "#FEF3C7" },
    { name: "Produk Hewani", label: "Hewani", icon: "egg", color: "#F59E0B", bgColor: "#FFF7ED" },
    { name: "Perikanan", label: "Perikanan", icon: "fish", color: "#3B82F6", bgColor: "#DBEAFE" },
    { name: "Produk Olahan", label: "Olahan", icon: "basket", color: "#8B5CF6", bgColor: "#EDE9FE" },
];

const ShopScreen = () => {
    const { filter } = useLocalSearchParams<{ filter?: string }>();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [activeFilter, setActiveFilter] = useState<"all" | "popular">("all");

    const { data: products, isLoading, isError } = useProducts();

    // Set filter based on URL param on mount
    useEffect(() => {
        if (filter === "popular") {
            setActiveFilter("popular");
        } else {
            setActiveFilter("all");
        }
    }, [filter]);

    // Check if product is from this week (last 7 days)
    const isFromThisWeek = (createdAt: string) => {
        if (!createdAt) return false;
        const createdDate = new Date(createdAt);
        const now = new Date();
        const diffMs = now.getTime() - createdDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
    };

    const filteredProducts = useMemo(() => {
        if (!products) return [];

        let filtered = [...products];

        // Filter by time (popular = this week)
        if (activeFilter === "popular") {
            filtered = filtered.filter((product) => isFromThisWeek(product.createdAt));
        }

        // Filter by category
        if (selectedCategory !== "All") {
            filtered = filtered.filter((product) =>
                product.category && product.category.toLowerCase().includes(selectedCategory.toLowerCase())
            );
        }

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter((product) =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    }, [products, selectedCategory, searchQuery, activeFilter]);

    const getHeaderTitle = () => {
        if (activeFilter === "popular") {
            return { title: "Populer Minggu Ini", subtitle: "Produk terpopuler dalam 7 hari" };
        }
        return { title: "Pasar", subtitle: "Belanja kebutuhan Anda" };
    };

    const headerInfo = getHeaderTitle();

    const renderHeader = () => (
        <View>
            <PageBackground />
            {/* Teal Header */}
            <LinearGradient
                colors={activeFilter === "popular" ? ["#F59E0B", "#D97706"] : ["#0D9488", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    paddingTop: 50,
                    paddingBottom: 20,
                    paddingHorizontal: 20,
                }}
            >
                {/* Header Title with Market Icon */}
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                        <View className="bg-white/20 p-2 rounded-xl mr-3">
                            <Ionicons
                                name={activeFilter === "popular" ? "star" : "storefront"}
                                size={24}
                                color="#FFFFFF"
                            />
                        </View>
                        <View>
                            <Text className="text-white text-2xl font-bold">{headerInfo.title}</Text>
                            <Text className="text-white/70 text-sm">{headerInfo.subtitle}</Text>
                        </View>
                    </View>
                </View>

                {/* Search Bar */}
                <View className="bg-white flex-row items-center px-4 py-3 rounded-2xl shadow-sm">
                    <Ionicons name="search" size={20} color={activeFilter === "popular" ? "#F59E0B" : "#0D9488"} />
                    <TextInput
                        placeholder="Cari produk..."
                        placeholderTextColor="#9CA3AF"
                        className="flex-1 ml-3 text-base text-gray-800"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>

            {/* Filter Toggle */}
            <View className="px-5 py-4 flex-row gap-2">
                <TouchableOpacity
                    className={`flex-row items-center px-4 py-2 rounded-full ${activeFilter === "all" ? "bg-teal-500" : "bg-gray-200"
                        }`}
                    onPress={() => setActiveFilter("all")}
                >
                    <Ionicons
                        name="grid-outline"
                        size={16}
                        color={activeFilter === "all" ? "#FFFFFF" : "#6B7280"}
                    />
                    <Text className={`ml-2 font-medium ${activeFilter === "all" ? "text-white" : "text-gray-600"}`}>
                        Semua Produk
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-row items-center px-4 py-2 rounded-full ${activeFilter === "popular" ? "bg-amber-500" : "bg-gray-200"
                        }`}
                    onPress={() => setActiveFilter("popular")}
                >
                    <Ionicons
                        name="star"
                        size={16}
                        color={activeFilter === "popular" ? "#FFFFFF" : "#6B7280"}
                    />
                    <Text className={`ml-2 font-medium ${activeFilter === "popular" ? "text-white" : "text-gray-600"}`}>
                        Minggu Ini
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Category Filter - Same style as Home Page */}
            <View className="bg-white pt-4 pb-4 shadow-sm">
                <View className="px-5 flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                        <Ionicons name="pricetags" size={20} color={activeFilter === "popular" ? "#F59E0B" : "#0D9488"} />
                        <Text className="text-gray-800 text-lg font-bold ml-2">Kategori</Text>
                    </View>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                >
                    {CATEGORIES.map((category) => {
                        const isSelected = selectedCategory === category.name;
                        return (
                            <TouchableOpacity
                                key={category.name}
                                className="items-center"
                                style={{ width: 70 }}
                                onPress={() => setSelectedCategory(category.name)}
                            >
                                <View
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 28,
                                        backgroundColor: isSelected ? category.color : category.bgColor,
                                        justifyContent: "center",
                                        alignItems: "center",
                                        marginBottom: 8,
                                        borderWidth: isSelected ? 3 : 0,
                                        borderColor: "#ffffff",
                                        shadowColor: isSelected ? category.color : "transparent",
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: isSelected ? 0.3 : 0,
                                        shadowRadius: 4,
                                        elevation: isSelected ? 4 : 0,
                                    }}
                                >
                                    <Ionicons
                                        name={category.icon as any}
                                        size={24}
                                        color={isSelected ? "#FFF" : category.color}
                                    />
                                </View>
                                <Text
                                    className={`text-xs text-center ${isSelected ? "font-bold text-teal-600" : "text-gray-600"}`}
                                    numberOfLines={1}
                                >
                                    {category.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Results Count */}
            <View className="px-5 py-4">
                <View className="flex-row items-center">
                    <View className={`p-2 rounded-lg mr-2 ${activeFilter === "popular" ? "bg-amber-100" : "bg-teal-100"}`}>
                        <Ionicons name="grid" size={16} color={activeFilter === "popular" ? "#F59E0B" : "#0D9488"} />
                    </View>
                    <Text className="text-gray-800 font-bold text-lg">
                        {filteredProducts.length} Produk
                    </Text>
                    {selectedCategory !== "All" && (
                        <View className="bg-teal-100 px-2 py-1 rounded-full ml-2">
                            <Text className="text-teal-700 text-xs font-medium">{selectedCategory}</Text>
                        </View>
                    )}
                    {activeFilter === "popular" && (
                        <View className="bg-amber-100 px-2 py-1 rounded-full ml-2">
                            <Text className="text-amber-700 text-xs font-medium">7 Hari Terakhir</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <ProductsGrid
                products={filteredProducts}
                isLoading={isLoading}
                isError={isError}
                ListHeaderComponent={renderHeader()}
            />
        </View>
    );
};

export default ShopScreen;
