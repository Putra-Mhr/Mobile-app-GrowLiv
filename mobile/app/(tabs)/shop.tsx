import ProductsGrid from "@/components/ProductsGrid";
import useProducts from "@/hooks/useProducts";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Dimensions } from "react-native";

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
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const { data: products, isLoading, isError } = useProducts();

    const filteredProducts = useMemo(() => {
        if (!products) return [];

        let filtered = [...products];

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
    }, [products, selectedCategory, searchQuery]);

    return (
        <View className="flex-1 bg-gray-50">
            {/* Teal Header */}
            <LinearGradient
                colors={["#0D9488", "#059669"]}
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
                            <Ionicons name="storefront" size={24} color="#FFFFFF" />
                        </View>
                        <View>
                            <Text className="text-white text-2xl font-bold">Pasar</Text>
                            <Text className="text-white/70 text-sm">Belanja kebutuhan Anda</Text>
                        </View>
                    </View>
                </View>

                {/* Search Bar */}
                <View className="bg-white flex-row items-center px-4 py-3 rounded-2xl shadow-sm">
                    <Ionicons name="search" size={20} color="#0D9488" />
                    <TextInput
                        placeholder="Cari produk di pasar..."
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

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Category Filter - Same style as Home Page */}
                <View className="bg-white pt-6 pb-4 shadow-sm">
                    <View className="px-5 flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center">
                            <Ionicons name="pricetags" size={20} color="#0D9488" />
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
                        <View className="bg-teal-100 p-2 rounded-lg mr-2">
                            <Ionicons name="grid" size={16} color="#0D9488" />
                        </View>
                        <Text className="text-gray-800 font-bold text-lg">
                            {filteredProducts.length} Produk
                        </Text>
                        {selectedCategory !== "All" && (
                            <View className="bg-teal-100 px-2 py-1 rounded-full ml-2">
                                <Text className="text-teal-700 text-xs font-medium">{selectedCategory}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Products Grid */}
                <View className="px-5">
                    <ProductsGrid
                        products={filteredProducts}
                        isLoading={isLoading}
                        isError={isError}
                    />
                </View>
            </ScrollView>
        </View>
    );
};

export default ShopScreen;
