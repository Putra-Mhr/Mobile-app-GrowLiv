import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { router } from "expo-router";

interface HomeHeaderProps {
    user: any; // Using any for now to match strictness level, but ideally User type
    unreadCount: number;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

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

const HomeHeader = ({ user, unreadCount, searchQuery, setSearchQuery }: HomeHeaderProps) => {
    const timeGreeting = getTimeGreeting();

    return (
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
    );
};

export default HomeHeader;
