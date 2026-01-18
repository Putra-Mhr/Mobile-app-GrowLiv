import SafeScreen from "@/components/SafeScreen";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";

const CouponScreen = () => {
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
                    paddingHorizontal: 24,
                }}
            >
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-white text-3xl font-bold tracking-tight">Kupon Saya</Text>
                </View>
            </LinearGradient>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* EMPTY STATE */}
                <View className="flex-1 items-center justify-center px-6 py-20 mt-10">
                    <View className="w-32 h-32 bg-green-50 rounded-full items-center justify-center mb-6">
                        <Ionicons name="ticket" size={64} color="#22C55E" />
                    </View>
                    <Text className="text-gray-800 font-bold text-2xl text-center mb-2">Belum Ada Kupon</Text>
                    <Text className="text-gray-500 text-center text-base px-8 mb-8 leading-6">
                        Saat ini belum ada kupon yang tersedia. Cek lagi nanti untuk promo menarik lainnya!
                    </Text>

                    <TouchableOpacity
                        className="bg-green-500 py-3 px-8 rounded-full shadow-lg shadow-green-200"
                        activeOpacity={0.8}
                        onPress={() => { }}
                    >
                        <Text className="text-white font-bold text-lg">Cari Promo</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

export default CouponScreen;
