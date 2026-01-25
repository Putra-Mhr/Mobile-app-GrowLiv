import ProductsGrid from "@/components/ProductsGrid";
import useProducts from "@/hooks/useProducts";
import useNotifications from "@/hooks/useNotifications";
import useWishlist from "@/hooks/useWishlist";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions } from "react-native";
import { router } from "expo-router";
import { useUser } from "@clerk/clerk-expo";

import { PageBackground } from "@/components/PageBackground";

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
        subtitle: "Segar langsung dari kebun petani lokal!",
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80",
        colors: ["rgba(34, 197, 94, 0.85)", "rgba(21, 128, 61, 0.9)"] as [string, string],
        category: "Sayuran",
    },
    {
        id: 2,
        title: "Buah Segar",
        subtitle: "Vitamin alami untuk kesehatan keluarga",
        image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&q=80",
        colors: ["rgba(249, 115, 22, 0.85)", "rgba(234, 88, 12, 0.9)"] as [string, string],
        category: "Buah",
    },
    {
        id: 3,
        title: "Herbal Alami",
        subtitle: "Jaga kesehatan dengan tanaman herbal",
        image: "https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=800&q=80",
        colors: ["rgba(6, 182, 212, 0.85)", "rgba(8, 145, 178, 0.9)"] as [string, string],
        category: "Herbal",
    },
    {
        id: 4,
        title: "Rempah Pilihan",
        subtitle: "Bumbu dapur berkualitas tinggi",
        image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80",
        colors: ["rgba(217, 119, 6, 0.85)", "rgba(180, 83, 9, 0.9)"] as [string, string],
        category: "Rempah",
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
    const { unreadCount } = useNotifications();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { user } = useUser();
    const scrollRef = useRef<ScrollView>(null);

    const timeGreeting = getTimeGreeting();

    // Auto-scroll carousel
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBanner((prev) => {
                const next = (prev + 1) % BANNERS.length;
                scrollRef.current?.scrollTo({ x: next * width, animated: true });
                return next;
            });
        }, 4000);

        return () => clearInterval(interval);
    }, []);

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
        <View className="flex-1">
            <PageBackground />
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
                        <TouchableOpacity
                            className="bg-white/20 p-3 rounded-xl"
                            onPress={() => router.push("/(profile)/notifications")}
                        >
                            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
                            {unreadCount > 0 && (
                                <View className="absolute -top-1 -right-1 bg-red-500 min-w-[18px] h-[18px] rounded-full items-center justify-center px-1">
                                    <Text className="text-white text-xs font-bold">{unreadCount > 99 ? "99+" : unreadCount}</Text>
                                </View>
                            )}
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
                {/* Full-Width Image Carousel */}
                <View style={{ marginTop: 16, paddingBottom: 8 }}>
                    <ScrollView
                        ref={scrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / width);
                            setCurrentBanner(index);
                        }}
                        scrollEventThrottle={16}
                        decelerationRate="fast"
                    >
                        {BANNERS.map((banner) => (
                            <TouchableOpacity
                                key={banner.id}
                                activeOpacity={0.95}
                                onPress={() => setSelectedCategory(banner.category)}
                                style={{ width: width, paddingHorizontal: 20 }}
                            >
                                <View style={{ height: 180, borderRadius: 20, overflow: "hidden" }}>
                                    {/* Background Image */}
                                    <Image
                                        source={{ uri: banner.image }}
                                        style={{ position: "absolute", width: "100%", height: "100%" }}
                                        resizeMode="cover"
                                    />
                                    {/* Gradient Overlay */}
                                    <LinearGradient
                                        colors={banner.colors}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={{ flex: 1, padding: 20, justifyContent: "flex-end" }}
                                    >
                                        <View className="flex-row items-center mb-2">
                                            <Ionicons name="leaf" size={14} color="rgba(255,255,255,0.9)" />
                                            <Text className="text-white/90 text-xs ml-1 uppercase tracking-wider font-medium">
                                                Promo Spesial
                                            </Text>
                                        </View>
                                        <Text className="text-white text-2xl font-bold mb-1">
                                            {banner.title}
                                        </Text>
                                        <Text className="text-white/90 text-sm mb-3">
                                            {banner.subtitle}
                                        </Text>
                                        <View className="flex-row items-center">
                                            <View className="bg-white/25 px-4 py-2 rounded-full flex-row items-center">
                                                <Text className="text-white font-semibold">Belanja Sekarang</Text>
                                                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Carousel Indicators */}
                    <View className="flex-row justify-center mt-3 gap-2">
                        {BANNERS.map((_, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => {
                                    scrollRef.current?.scrollTo({ x: index * width, animated: true });
                                    setCurrentBanner(index);
                                }}
                            >
                                <View
                                    className={`h-2 rounded-full ${index === currentBanner ? "bg-green-500 w-6" : "bg-gray-300 w-2"
                                        }`}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
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
