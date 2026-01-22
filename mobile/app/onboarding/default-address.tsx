import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useApi } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";

const DefaultAddressScreen = () => {
    const api = useApi();
    const { showToast } = useNotification();

    const [loading, setLoading] = useState(false);
    const [label, setLabel] = useState("Rumah");
    const [fullName, setFullName] = useState("");
    const [streetAddress, setStreetAddress] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");

    const handleComplete = async () => {
        // Validate required fields
        if (!fullName.trim() || !streetAddress.trim() || !city.trim() || !state.trim() || !zipCode.trim() || !phoneNumber.trim()) {
            showToast("error", "Data Belum Lengkap", "Semua field wajib diisi");
            return;
        }

        try {
            setLoading(true);

            // Save default address
            await api.post("/users/addresses", {
                label,
                fullName: fullName.trim(),
                streetAddress: streetAddress.trim(),
                city: city.trim(),
                state: state.trim(),
                zipCode: zipCode.trim(),
                phoneNumber: phoneNumber.trim(),
                coordinates: {
                    latitude: -6.2088, // Jakarta default, user can edit later
                    longitude: 106.8456,
                },
                isDefault: true,
            });

            // Mark onboarding as completed
            await api.post("/users/complete-onboarding");

            showToast("success", "Selamat Datang! 🎉", "Profil Anda sudah lengkap");

            // Navigate to main app
            router.replace("/(tabs)");
        } catch (error: any) {
            console.error("Error completing onboarding:", error);
            showToast("error", "Gagal Menyimpan", error?.response?.data?.error || "Silakan coba lagi");
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
                    <Text className="text-white text-3xl font-bold mb-2">Alamat Utama 📍</Text>
                    <Text className="text-white/80 text-base">
                        Tambahkan alamat untuk mempermudah checkout
                    </Text>
                </View>
                {/* Progress Indicator */}
                <View className="flex-row items-center mt-6 gap-2">
                    <View className="flex-1 h-1 bg-white rounded-full" />
                    <View className="flex-1 h-1 bg-white rounded-full" />
                    <View className="flex-1 h-1 bg-white rounded-full" />
                </View>
                <Text className="text-white/70 text-sm mt-2">Langkah 3 dari 3</Text>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="px-5 py-6">
                        {/* Full Name */}
                        <View className="mb-4">
                            <Text className="text-gray-700 font-semibold mb-2 ml-1">Nama Penerima *</Text>
                            <View className="bg-white rounded-2xl border border-gray-200">
                                <View className="flex-row items-center px-4">
                                    <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                                    <TextInput
                                        value={fullName}
                                        onChangeText={setFullName}
                                        placeholder="Nama lengkap penerima"
                                        placeholderTextColor="#9CA3AF"
                                        className="flex-1 py-4 px-3 text-gray-800"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Phone Number */}
                        <View className="mb-4">
                            <Text className="text-gray-700 font-semibold mb-2 ml-1">Nomor Telepon *</Text>
                            <View className="bg-white rounded-2xl border border-gray-200">
                                <View className="flex-row items-center px-4">
                                    <Ionicons name="call-outline" size={20} color="#9CA3AF" />
                                    <TextInput
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                        placeholder="Nomor yang bisa dihubungi"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="phone-pad"
                                        className="flex-1 py-4 px-3 text-gray-800"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Street Address */}
                        <View className="mb-4">
                            <Text className="text-gray-700 font-semibold mb-2 ml-1">Alamat Lengkap *</Text>
                            <View className="bg-white rounded-2xl border border-gray-200">
                                <View className="flex-row items-start px-4 pt-4">
                                    <Ionicons name="location-outline" size={20} color="#9CA3AF" />
                                    <TextInput
                                        value={streetAddress}
                                        onChangeText={setStreetAddress}
                                        placeholder="Jalan, nomor rumah, RT/RW"
                                        placeholderTextColor="#9CA3AF"
                                        multiline
                                        numberOfLines={2}
                                        textAlignVertical="top"
                                        className="flex-1 py-0 px-3 pb-4 text-gray-800"
                                        style={{ minHeight: 60 }}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* City & State */}
                        <View className="flex-row gap-3 mb-4">
                            <View className="flex-1">
                                <Text className="text-gray-700 font-semibold mb-2 ml-1">Kota *</Text>
                                <View className="bg-white rounded-2xl border border-gray-200">
                                    <TextInput
                                        value={city}
                                        onChangeText={setCity}
                                        placeholder="Kota"
                                        placeholderTextColor="#9CA3AF"
                                        className="py-4 px-4 text-gray-800"
                                    />
                                </View>
                            </View>

                            <View className="flex-1">
                                <Text className="text-gray-700 font-semibold mb-2 ml-1">Provinsi *</Text>
                                <View className="bg-white rounded-2xl border border-gray-200">
                                    <TextInput
                                        value={state}
                                        onChangeText={setState}
                                        placeholder="Provinsi"
                                        placeholderTextColor="#9CA3AF"
                                        className="py-4 px-4 text-gray-800"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Zip Code */}
                        <View className="mb-4">
                            <Text className="text-gray-700 font-semibold mb-2 ml-1">Kode Pos *</Text>
                            <View className="bg-white rounded-2xl border border-gray-200">
                                <TextInput
                                    value={zipCode}
                                    onChangeText={setZipCode}
                                    placeholder="Contoh: 12345"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="number-pad"
                                    maxLength={5}
                                    className="py-4 px-4 text-gray-800"
                                />
                            </View>
                        </View>

                        {/* Info Box */}
                        <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mt-2">
                            <View className="flex-row items-start">
                                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                                <Text className="flex-1 text-blue-700 text-sm ml-2">
                                    Anda bisa mengedit dan menambahkan koordinat peta nanti di menu Profil → Alamat
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Bottom Navigation */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 pb-8">
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-gray-100 rounded-2xl px-6 py-4"
                        activeOpacity={0.7}
                        disabled={loading}
                    >
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleComplete}
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
                                    <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" />
                                    <Text className="text-white font-bold text-base ml-2">Selesai</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default DefaultAddressScreen;
