import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface BottomActionBarProps {
    price: number;
    quantity: number;
    inStock: boolean;
    isAddingToCart: boolean;
    onAddToCart: () => void;
}

const BottomActionBar = ({
    price,
    quantity,
    inStock,
    isAddingToCart,
    onAddToCart,
}: BottomActionBarProps) => {
    return (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 pb-8">
            <View className="flex-row items-center gap-3">
                <View className="flex-1">
                    <Text className="text-gray-500 text-sm mb-1">Total Harga</Text>
                    <Text className="text-green-600 text-2xl font-bold">
                        Rp {(price * quantity).toLocaleString("id-ID")}
                    </Text>
                </View>
                <TouchableOpacity
                    className="rounded-2xl overflow-hidden shadow-lg shadow-green-200"
                    activeOpacity={0.8}
                    onPress={onAddToCart}
                    disabled={!inStock || isAddingToCart}
                >
                    <LinearGradient
                        colors={!inStock ? ["#9CA3AF", "#6B7280"] : ["#22C55E", "#15803D"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="px-8 py-4 flex-row items-center"
                    >
                        {isAddingToCart ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="cart" size={24} color="#FFFFFF" />
                                <Text className="font-bold text-lg ml-2 text-white">
                                    {!inStock ? "Stok Habis" : "Tambah"}
                                </Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default BottomActionBar;
