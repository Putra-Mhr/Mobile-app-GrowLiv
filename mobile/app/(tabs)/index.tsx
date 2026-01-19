import ProductsGrid from "@/components/ProductsGrid";
import useProducts from "@/hooks/useProducts";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, Animated } from "react-native";
import { router } from "expo-router";
import { useUser } from "@clerk/clerk-expo";

const { width } = Dimensions.get("window");

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

const BANNERS = [
  {
    id: 1,
    title: "Panen Hari Ini",
    subtitle: "Segar langsung dari kebun!",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200",
    colors: ["#22C55E", "#15803D"] as [string, string],
    category: "Sayuran",
  },
  {
    id: 2,
    title: "Buah Segar",
    subtitle: "Vitamin untuk keluarga",
    image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200",
    colors: ["#F97316", "#EA580C"] as [string, string],
    category: "Buah",
  },
  {
    id: 3,
    title: "Herbal Alami",
    subtitle: "Sehat dengan alam",
    image: "https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=200",
    colors: ["#06B6D4", "#0891B2"] as [string, string],
    category: "Herbal",
  },
];

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) {
    return { greeting: "Selamat Pagi", icon: "🌅", message: "Mulai hari dengan sayuran segar!" };
  } else if (hour >= 11 && hour < 15) {
    return { greeting: "Selamat Siang", icon: "☀️", message: "Waktunya belanja kebutuhan dapur" };
  } else if (hour >= 15 && hour < 18) {
    return { greeting: "Selamat Sore", icon: "🌤️", message: "Siapkan bahan untuk makan malam" };
  } else {
    return { greeting: "Selamat Malam", icon: "🌙", message: "Pesan untuk diantar besok pagi" };
  }
};

const HomeScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentBanner, setCurrentBanner] = useState(0);
  const { data: products, isLoading, isError } = useProducts();
  const { user } = useUser();
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const timeGreeting = getTimeGreeting();

  // Auto-scroll banner
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentBanner((prev) => (prev + 1) % BANNERS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products;

    if (selectedCategory !== "All") {
      filtered = filtered.filter((p) =>
        p.category && p.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [products, searchQuery, selectedCategory]);

  // Get featured products (first 4 for horizontal scroll)
  const featuredProducts = useMemo(() => {
    if (!products) return [];
    return products.slice(0, 6);
  }, [products]);

  const currentBannerData = BANNERS[currentBanner];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Green Header Background */}
      <LinearGradient
        colors={["#22C55E", "#16A34A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 50,
          paddingBottom: 24,
          paddingHorizontal: 20,
        }}
      >
        {/* Greeting Section */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-3xl mr-2">{timeGreeting.icon}</Text>
              <View>
                <Text className="text-white/80 text-sm">{timeGreeting.greeting},</Text>
                <Text className="text-white text-xl font-bold">
                  {user?.firstName || "Petani"}!
                </Text>
              </View>
            </View>
            <Text className="text-white/70 text-sm mt-1">{timeGreeting.message}</Text>
          </View>

          <View className="flex-row gap-2">
            {/* Notification */}
            <TouchableOpacity className="bg-white/20 p-3 rounded-xl">
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
              <View className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full items-center justify-center">
                <Text className="text-white text-xs font-bold">2</Text>
              </View>
            </TouchableOpacity>

            {/* Wishlist */}
            <TouchableOpacity
              className="bg-white/20 p-3 rounded-xl"
              onPress={() => router.push("/(profile)/wishlist")}
            >
              <Ionicons name="heart-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="bg-white flex-row items-center px-4 py-3 rounded-2xl shadow-lg">
          <Ionicons name="search" size={20} color="#22C55E" />
          <TextInput
            placeholder="Cari sayuran, buah, rempah..."
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
        {/* Animated Banner Carousel */}
        <View className="px-5 py-4">
          <Animated.View style={{ opacity: fadeAnim }}>
            <LinearGradient
              colors={currentBannerData.colors}
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
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="leaf" size={16} color="rgba(255,255,255,0.8)" />
                    <Text className="text-white/80 text-xs ml-1 uppercase tracking-wider">
                      Promo Spesial
                    </Text>
                  </View>
                  <Text className="text-white text-2xl font-bold mb-1">
                    {currentBannerData.title}
                  </Text>
                  <Text className="text-white/80 text-sm mb-4">
                    {currentBannerData.subtitle}
                  </Text>
                  <TouchableOpacity
                    className="bg-white/20 self-start px-4 py-2 rounded-full flex-row items-center"
                    onPress={() => setSelectedCategory(currentBannerData.category)}
                  >
                    <Text className="text-white font-semibold">Lihat Detail</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
                <Image
                  source={{ uri: currentBannerData.image }}
                  style={{ width: 120, height: 100, borderRadius: 12 }}
                  resizeMode="cover"
                />
              </View>

              {/* Banner Indicators */}
              <View className="flex-row justify-center mt-4 gap-2">
                {BANNERS.map((_, index) => (
                  <View
                    key={index}
                    className={`h-2 rounded-full ${index === currentBanner ? "bg-white w-6" : "bg-white/40 w-2"
                      }`}
                  />
                ))}
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Categories Section */}
        <View className="bg-white rounded-t-3xl pt-6 pb-4 shadow-sm">
          <View className="px-5 flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Ionicons name="leaf" size={20} color="#22C55E" />
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
              <TouchableOpacity onPress={() => router.push("/(tabs)/shop")}>
                <Text className="text-green-500 font-medium">Lihat Semua</Text>
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
                  className="bg-gray-50 rounded-2xl overflow-hidden"
                  style={{ width: 150 }}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/product/${product._id}`)}
                >
                  <Image
                    source={{ uri: product.images?.[0] || "https://via.placeholder.com/150" }}
                    style={{ width: 150, height: 120 }}
                    resizeMode="cover"
                  />
                  <View className="p-3">
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
        )
        }

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
      </ScrollView >
    </View >
  );
};

export default HomeScreen;
