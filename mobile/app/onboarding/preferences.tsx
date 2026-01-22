import { useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useApi } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";

const DELIVERY_TIME_OPTIONS = [
    { value: "morning", label: "Pagi", icon: "sunny-outline", desc: "06:00 - 12:00" },
    { value: "afternoon", label: "Siang", icon: "partly-sunny-outline", desc: "12:00 - 18:00" },
    { value: "evening", label: "Sore/Malam", icon: "moon-outline", desc: "18:00 - 21:00" },
];

const CATEGORY_OPTIONS = [
    { value: "Dairy", label: "Dairy", icon: "water-outline" },
    { value: "Vegetable", label: "Sayuran", icon: "leaf-outline" },
    { value: "Fruit", label: "Buah-buahan", icon: "nutrition-outline" },
    { value: "Other Products from Farmer", label: "Produk Lainnya", icon: "apps-outline" },
];

const PreferencesScreen = () => {
    const api = useApi();
    const { showToast } = useNotification();

    const [loading, setLoading] = useState(false);
    const [deliveryTime, setDeliveryTime] = useState("");
    const [favoriteCategories, setFavoriteCategories] = useState<string[]>([]);

    const toggleCategory = (category: string) => {
        if (favoriteCategories.includes(category)) {
            setFavoriteCategories(favoriteCategories.filter((c) => c !== category));
        } else {
            setFavoriteCategories([...favoriteCategories, category]);
        }
    };

    const handleContinue = async () => {
        try {
            setLoading(true);
            // Save preferences
            await api.put("/users/profile", {
                preferences: {
                    deliveryTime,
                    favoriteCategories,
                },
            });

            // Navigate to default address screen
            router.push("/onboarding/default-address");
        } catch (error) {
            console.error("Error saving preferences:", error);
            showToast("error", "Gagal Menyimpan", "Silakan coba lagi");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <LinearGradient
                colors={["#22C55E", "#16A34A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20 }}
            >
                <View>
                    <Text className="text-white text-3xl font-bold mb-2">Preferensi Anda 🎯</Text>
                    <Text className="text-white/80 text-base">
                        Bantu kami memberikan pengalaman terbaik
                    </Text>
                </View>
                {/* Progress Indicator */}
                <View className="flex-row items-center mt-6 gap-2">
                    <View className="flex-1 h-1 bg-white rounded-full" />
                    <View className="flex-1 h-1 bg-white rounded-full" />
                    <View className="flex-1 h-1 bg-white/30 rounded-full" />
                </View>
                <Text className="text-white/70 text-sm mt-2">Langkah 2 dari 3</Text>
            </LinearGradient>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                <View className="px-5 py-6">
                    {/* Delivery Time Preference */}
                    <View className="mb-6">
                        <Text className="text-gray-800 text-lg font-bold mb-2">Waktu Pengiriman Favorit</Text>
                        <Text className="text-gray-500 text-sm mb-4">
                            Pilih waktu pengiriman yang paling nyaman untuk Anda (opsional)
                        </Text>

                        <View className="gap-3">
                            {DELIVERY_TIME_OPTIONS.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    onPress={() => setDeliveryTime(option.value)}
                                    className={`flex-row items-center bg-white rounded-2xl p-4 border-2 ${deliveryTime === option.value ? "border-green-500 bg-green-50" : "border-gray-200"
                                        }`}
                                    activeOpacity={0.7}
                                >
                                    <View
                                        className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${deliveryTime === option.value ? "bg-green-500" : "bg-gray-100"
                                            }`}
                                    >
                                        <Ionicons
                                            name={option.icon as any}
                                            size={24}
                                            color={deliveryTime === option.value ? "#FFFFFF" : "#9CA3AF"}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text
                                            className={`font-bold text-lg ${deliveryTime === option.value ? "text-green-600" : "text-gray-800"
                                                }`}
                                        >
                                            {option.label}
                                        </Text>
                                        <Text className="text-gray-500 text-sm">{option.desc}</Text>
                                    </View>
                                    {deliveryTime === option.value && (
                                        <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Favorite Categories */}
                    <View className="mb-6">
                        <Text className="text-gray-800 text-lg font-bold mb-2">Kategori Favorit</Text>
                        <Text className="text-gray-500 text-sm mb-4">
                            Pilih produk yang Anda sukai (bisa lebih dari satu)
                        </Text>

                        <View className="gap-3">
                            {CATEGORY_OPTIONS.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    onPress={() => toggleCategory(option.value)}
                                    className={`flex-row items-center bg-white rounded-2xl p-4 border-2 ${favoriteCategories.includes(option.value) ? "border-green-500 bg-green-50" : "border-gray-200"
                                        }`}
                                    activeOpacity={0.7}
                                >
                                    <View
                                        className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${favoriteCategories.includes(option.value) ? "bg-green-500" : "bg-gray-100"
                                            }`}
                                    >
                                        <Ionicons
                                            name={option.icon as any}
                                            size={24}
                                            color={favoriteCategories.includes(option.value) ? "#FFFFFF" : "#9CA3AF"}
                                        />
                                    </View>
                                    <Text
                                        className={`flex-1 font-bold text-lg ${favoriteCategories.includes(option.value) ? "text-green-600" : "text-gray-800"
                                            }`}
                                    >
                                        {option.label}
                                    </Text>
                                    {favoriteCategories.includes(option.value) && (
                                        <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 pb-8">
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-gray-100 rounded-2xl px-6 py-4"
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleContinue}
                        disabled={loading}
                        activeOpacity={0.8}
                        className="flex-1 overflow-hidden rounded-2xl"
                    >
                        <LinearGradient
                            colors={["#22C55E", "#15803D"]}
                            className="py-4 flex-row items-center justify-center"
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Text className="text-white font-bold text-base mr-2">Lanjutkan</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default PreferencesScreen;
