import ProductsGrid from "@/components/ProductsGrid";
import useProducts from "@/hooks/useProducts";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions } from "react-native";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

const CATEGORIES = [
  { name: "All", label: "Semua", icon: "grid", color: "#22C55E", bgColor: "#DCFCE7" },
  { name: "Vegetable", label: "Sayuran", icon: "leaf", color: "#16A34A", bgColor: "#DCFCE7" },
  { name: "Fruit", label: "Buah", icon: "nutrition", color: "#EF4444", bgColor: "#FEE2E2" },
  { name: "Herbal", label: "Herbal", icon: "flower", color: "#06B6D4", bgColor: "#CFFAFE" },
  { name: "Spice", label: "Rempah", icon: "flask", color: "#D97706", bgColor: "#FEF3C7" },
  { name: "Animal", label: "Hewani", icon: "egg", color: "#F59E0B", bgColor: "#FFF7ED" },
  { name: "Fishery", label: "Perikanan", icon: "fish", color: "#3B82F6", bgColor: "#DBEAFE" },
  { name: "Processed", label: "Olahan", icon: "basket", color: "#8B5CF6", bgColor: "#EDE9FE" },
];

const HomeScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { data: products, isLoading, isError } = useProducts();

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products;

    // Filter by category (if not All)
    if (selectedCategory !== "All") {
      // Simple case-insensitive match for demo purposes, or exact match if your backend is strict
      filtered = filtered.filter((p) =>
        p.category && p.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [products, searchQuery, selectedCategory]);

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
        {/* Search Bar and Icons */}
        <View className="flex-row items-center gap-3">
          {/* Search Input */}
          <View className="flex-1 bg-white flex-row items-center px-4 py-3 rounded-xl">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Cari produk tani..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-3 text-base text-gray-800"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Notification */}
          <TouchableOpacity className="bg-white/20 p-3 rounded-xl">
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Wishlist */}
          <TouchableOpacity
            className="bg-white/20 p-3 rounded-xl"
            onPress={() => router.push("/(profile)/wishlist")}
          >
            <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View className="px-5 py-4">
          <LinearGradient
            colors={["#22C55E", "#15803D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 20,
              padding: 20,
              overflow: "hidden",
            }}
          >
            <View className="flex-row items-center">
              <View className="flex-1">
                <Text className="text-white text-2xl font-bold mb-1">Panen Hari Ini</Text>
                <Text className="text-white/80 text-sm mb-4">Segar langsung dari kebun!</Text>
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => setSelectedCategory("Vegetable")}
                >
                  <Text className="text-white font-semibold underline">Lihat Detail</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200" }}
                style={{ width: 120, height: 100, borderRadius: 12 }}
                resizeMode="cover"
              />
            </View>
          </LinearGradient>
        </View>

        {/* Categories Section */}
        <View className="bg-white rounded-t-3xl -mt-2 pt-6">
          <View className="px-5 flex-row items-center justify-between mb-4">
            <Text className="text-gray-800 text-lg font-bold">Kategori</Text>
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

        {/* Products Section */}
        <View className="px-5 mt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-800 text-lg font-bold">
              {selectedCategory === "All" ? "Rekomendasi Pilihan" : `Kategori ${CATEGORIES.find(c => c.name === selectedCategory)?.label}`}
            </Text>
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

