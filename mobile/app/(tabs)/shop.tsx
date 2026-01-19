import ProductsGrid from "@/components/ProductsGrid";
import SafeScreen from "@/components/SafeScreen";
import useProducts from "@/hooks/useProducts";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image } from "react-native";

const CATEGORIES = [
    { name: "All", label: "Semua", icon: "grid", color: "#22C55E", bgColor: "#DCFCE7" },
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

        let filtered = products;

        // filtering by category
        if (selectedCategory !== "All") {
            filtered = filtered.filter((product) => product.category === selectedCategory);
        }

        // filtering by searh query
        if (searchQuery.trim()) {
            filtered = filtered.filter((product) =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    }, [products, selectedCategory, searchQuery]);

    return (
        <View className="flex-1 bg-white">
            {/* Green Header Background */}
            <LinearGradient
                colors={["#22C55E", "#16A34A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    paddingTop: 50,
                    paddingBottom: 20,
                    paddingHorizontal: 20,
                }}
            >
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-white text-2xl font-bold">Belanja</Text>
                    <TouchableOpacity className="bg-white/20 p-2 rounded-xl">
                        <Ionicons name="filter" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className="bg-white flex-row items-center px-4 py-3 rounded-xl">
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        placeholder="Cari produk..."
                        placeholderTextColor="#9CA3AF"
                        className="flex-1 ml-3 text-base text-gray-800"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </LinearGradient>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* CATEGORY FILTER */}
                <View className="mt-6 mb-4">
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 20 }}
                    >
                        {CATEGORIES.map((category) => {
                            const isSelected = selectedCategory === category.name;
                            return (
                                <TouchableOpacity
                                    key={category.name}
                                    className="items-center mr-3"
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
                                        className={`text-xs text-center ${isSelected ? "font-bold text-green-600" : "text-gray-600"}`}
                                        numberOfLines={1}
                                    >
                                        {category.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                <View className="px-6 mb-6">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-text-primary text-lg font-bold">Products</Text>
                        <Text className="text-text-secondary text-sm">{filteredProducts.length} items</Text>
                    </View>

                    {/* PRODUCTS GRID */}
                    <ProductsGrid products={filteredProducts} isLoading={isLoading} isError={isError} />
                </View>
            </ScrollView>
        </View>
    );
};

export default ShopScreen;
