import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { View, Text } from "react-native";
import { PageBackground } from "@/components/PageBackground";

export default function CouponScreen() {
    return (
        <View className="flex-1">
            <PageBackground />

            {/* Header */}
            <LinearGradient
                colors={["#F59E0B", "#D97706"]}
                className="pt-14 pb-6 px-5"
            >
                <Text className="text-white text-2xl font-bold">Kupon</Text>
                <Text className="text-amber-100 text-sm mt-1">
                    Dapatkan diskon spesial
                </Text>
            </LinearGradient>

            {/* Coming Soon Content */}
            <View className="flex-1 items-center justify-center px-8 -mt-10">
                <View className="bg-white/80 rounded-3xl p-8 items-center shadow-sm w-full">
                    {/* Icon */}
                    <View className="w-24 h-24 rounded-full bg-amber-50 items-center justify-center mb-6">
                        <Ionicons name="ticket-outline" size={48} color="#F59E0B" />
                    </View>

                    {/* Title */}
                    <Text className="text-2xl font-bold text-gray-800 mb-3">
                        Segera Hadir! 🎉
                    </Text>

                    {/* Description */}
                    <Text className="text-gray-500 text-center text-base leading-6 mb-6">
                        Fitur kupon sedang dalam pengembangan. Nantikan diskon dan promo
                        menarik dari seller favorit Anda!
                    </Text>

                    {/* Feature Preview Cards */}
                    <View className="w-full gap-3">
                        <View className="flex-row items-center bg-amber-50 rounded-xl p-3">
                            <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mr-3">
                                <Ionicons name="pricetag" size={20} color="#D97706" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-800 font-semibold text-sm">Diskon Produk</Text>
                                <Text className="text-gray-500 text-xs">Potongan harga spesial</Text>
                            </View>
                        </View>

                        <View className="flex-row items-center bg-green-50 rounded-xl p-3">
                            <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                                <Ionicons name="car" size={20} color="#16A34A" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-800 font-semibold text-sm">Gratis Ongkir</Text>
                                <Text className="text-gray-500 text-xs">Bebas biaya pengiriman</Text>
                            </View>
                        </View>

                        <View className="flex-row items-center bg-blue-50 rounded-xl p-3">
                            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                                <Ionicons name="gift" size={20} color="#2563EB" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-800 font-semibold text-sm">Promo Spesial</Text>
                                <Text className="text-gray-500 text-xs">Event & promo eksklusif</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}
