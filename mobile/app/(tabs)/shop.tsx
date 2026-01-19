import ProductsGrid from "@/components/ProductsGrid";
import SortFilterModal from "@/components/SortFilterModal";
import { useShopPreferences } from "@/hooks/useShopPreferences";
import useProducts from "@/hooks/useProducts";
import { Product } from "@/types";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Dimensions, FlatList } from "react-native";

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
    const [showFilterModal, setShowFilterModal] = useState(false);

    const { data: products, isLoading, isError } = useProducts();
    const {
        sortBy,
        filters,
        viewMode,
        hasActiveFilters,
        activeFilterCount,
        setSortBy,
        setFilters,
        setViewMode,
        resetFilters,
    } = useShopPreferences();

    const filteredAndSortedProducts = useMemo(() => {
        if (!products) return [];

        let filtered = [...products];

        // Filter by category
        if (selectedCategory !== "All") {
            filtered = filtered.filter((product) => product.category === selectedCategory);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter((product) =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by stock
        if (filters.inStockOnly) {
            filtered = filtered.filter((product) => product.stock > 0);
        }

        // Filter by price range
        if (filters.priceMin !== null) {
            filtered = filtered.filter((product) => product.price >= filters.priceMin!);
        }
        if (filters.priceMax !== null) {
            filtered = filtered.filter((product) => product.price <= filters.priceMax!);
        }

        // Apply sorting
        switch (sortBy) {
            case 'price_asc':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price_desc':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'name_asc':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name_desc':
                filtered.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'newest':
                filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                break;
            default:
                break;
        }

        return filtered;
    }, [products, selectedCategory, searchQuery, filters, sortBy]);

    const getSortLabel = () => {
        switch (sortBy) {
            case 'price_asc': return 'Harga ↑';
            case 'price_desc': return 'Harga ↓';
            case 'name_asc': return 'A-Z';
            case 'name_desc': return 'Z-A';
            case 'newest': return 'Terbaru';
            default: return null;
        }
    };

    const renderListItem = ({ item }: { item: Product }) => (
        <TouchableOpacity
            className="bg-white rounded-2xl mb-3 overflow-hidden shadow-sm border border-gray-100"
            activeOpacity={0.8}
        >
            <View className="flex-row p-3">
                <Image
                    source={item.images?.[0] || "https://via.placeholder.com/100"}
                    style={{ width: 100, height: 100, borderRadius: 12 }}
                    contentFit="cover"
                />
                <View className="flex-1 ml-4 justify-between">
                    <View>
                        <Text className="text-gray-800 font-bold text-base" numberOfLines={2}>
                            {item.name}
                        </Text>
                        <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
                            {item.description}
                        </Text>
                    </View>
                    <View className="flex-row items-center justify-between mt-2">
                        <Text className="text-teal-600 font-bold text-lg">
                            Rp {item.price.toLocaleString("id-ID")}
                        </Text>
                        <View className="flex-row items-center">
                            {item.stock > 0 ? (
                                <View className="flex-row items-center bg-green-50 px-2 py-1 rounded-full">
                                    <View className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                                    <Text className="text-green-600 text-xs font-medium">{item.stock} stok</Text>
                                </View>
                            ) : (
                                <View className="bg-red-50 px-2 py-1 rounded-full">
                                    <Text className="text-red-500 text-xs font-medium">Habis</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50">
            {/* Teal Header - Different from Home's green */}
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
                    {/* Filter Button */}
                    <TouchableOpacity
                        className="bg-white/20 p-3 rounded-xl relative"
                        onPress={() => setShowFilterModal(true)}
                    >
                        <Ionicons name="options" size={22} color="#FFFFFF" />
                        {activeFilterCount > 0 && (
                            <View className="absolute -top-1 -right-1 bg-amber-400 w-5 h-5 rounded-full items-center justify-center">
                                <Text className="text-xs font-bold text-gray-800">{activeFilterCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
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
                {/* Category Filter with different styling */}
                <View className="bg-white py-4 shadow-sm">
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                    >
                        {CATEGORIES.map((category) => {
                            const isSelected = selectedCategory === category.name;
                            return (
                                <TouchableOpacity
                                    key={category.name}
                                    className={`flex-row items-center px-4 py-2 rounded-full ${isSelected ? 'shadow-sm' : ''
                                        }`}
                                    style={{
                                        backgroundColor: isSelected ? category.color : category.bgColor,
                                    }}
                                    onPress={() => setSelectedCategory(category.name)}
                                >
                                    <Ionicons
                                        name={category.icon as any}
                                        size={16}
                                        color={isSelected ? "#FFFFFF" : category.color}
                                    />
                                    <Text
                                        className={`ml-2 font-semibold text-sm ${isSelected ? "text-white" : ""
                                            }`}
                                        style={{ color: isSelected ? "#FFFFFF" : category.color }}
                                    >
                                        {category.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Results Bar */}
                <View className="px-5 py-4">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-wrap gap-2">
                            <Text className="text-gray-800 font-bold text-lg">
                                {filteredAndSortedProducts.length} Produk
                            </Text>
                            {getSortLabel() && (
                                <View className="bg-teal-100 px-2 py-1 rounded-full flex-row items-center">
                                    <Ionicons name="swap-vertical" size={12} color="#0D9488" />
                                    <Text className="text-teal-700 text-xs font-medium ml-1">{getSortLabel()}</Text>
                                </View>
                            )}
                            {filters.inStockOnly && (
                                <View className="bg-green-100 px-2 py-1 rounded-full flex-row items-center">
                                    <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
                                    <Text className="text-green-700 text-xs font-medium ml-1">Tersedia</Text>
                                </View>
                            )}
                        </View>

                        {/* View Mode Toggle */}
                        <View className="flex-row bg-gray-100 rounded-xl p-1">
                            <TouchableOpacity
                                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                                onPress={() => setViewMode('grid')}
                            >
                                <Ionicons
                                    name="grid"
                                    size={18}
                                    color={viewMode === 'grid' ? '#0D9488' : '#9CA3AF'}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                                onPress={() => setViewMode('list')}
                            >
                                <Ionicons
                                    name="list"
                                    size={18}
                                    color={viewMode === 'list' ? '#0D9488' : '#9CA3AF'}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Active Filters Reset */}
                    {hasActiveFilters && (
                        <TouchableOpacity
                            className="flex-row items-center mt-3"
                            onPress={resetFilters}
                        >
                            <Ionicons name="refresh" size={14} color="#0D9488" />
                            <Text className="text-teal-600 text-sm ml-1">Reset filter</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Products */}
                <View className="px-5">
                    {viewMode === 'grid' ? (
                        <ProductsGrid
                            products={filteredAndSortedProducts}
                            isLoading={isLoading}
                            isError={isError}
                        />
                    ) : (
                        <FlatList
                            data={filteredAndSortedProducts}
                            renderItem={renderListItem}
                            keyExtractor={(item) => item._id}
                            scrollEnabled={false}
                            ListEmptyComponent={
                                <View className="items-center justify-center py-20">
                                    <Ionicons name="search" size={64} color="#D1D5DB" />
                                    <Text className="text-gray-400 text-lg mt-4">Tidak ada produk ditemukan</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </ScrollView>

            {/* Sort/Filter Modal */}
            <SortFilterModal
                visible={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                sortBy={sortBy}
                filters={filters}
                viewMode={viewMode}
                onSortChange={setSortBy}
                onFiltersChange={setFilters}
                onViewModeChange={setViewMode}
                onReset={resetFilters}
            />
        </View>
    );
};

export default ShopScreen;
