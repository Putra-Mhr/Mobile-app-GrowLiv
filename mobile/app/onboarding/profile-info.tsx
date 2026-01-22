import { useUser } from "@clerk/clerk-expo";
import { useCallback, useState } from "react";
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
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useApi } from "@/lib/api";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNotification } from "@/context/NotificationContext";

const GENDER_OPTIONS = [
    { value: "male", label: "Laki-laki" },
    { value: "female", label: "Perempuan" },
    { value: "other", label: "Lainnya" },
];

const ProfileInfoScreen = () => {
    const { user } = useUser();
    const api = useApi();
    const { showToast } = useNotification();

    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showGenderPicker, setShowGenderPicker] = useState(false);

    // Form state
    const [name, setName] = useState(`${user?.firstName || ""} ${user?.lastName || ""}`.trim());
    const [phoneNumber, setPhoneNumber] = useState("");
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    const [gender, setGender] = useState("");
    const [bio, setBio] = useState("");

    const handleContinue = async () => {
        if (!name.trim()) {
            showToast("error", "Data Belum Lengkap", "Nama tidak boleh kosong");
            return;
        }

        if (!phoneNumber.trim()) {
            showToast("warning", "Data Belum Lengkap", "Nomor telepon diperlukan");
            return;
        }

        try {
            setLoading(true);
            // Save profile info
            await api.put("/users/profile", {
                name: name.trim(),
                phoneNumber: phoneNumber.trim(),
                birthDate: birthDate?.toISOString() || null,
                gender,
                bio: bio.trim(),
            });

            // Navigate to preferences screen
            router.push("/onboarding/preferences");
        } catch (error) {
            console.error("Error saving profile:", error);
            showToast("error", "Gagal Menyimpan", "Silakan coba lagi");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return "Pilih tanggal lahir (opsional)";
        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const getGenderLabel = (value: string) => {
        return GENDER_OPTIONS.find((opt) => opt.value === value)?.label || "Pilih Gender (opsional)";
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
                    <Text className="text-white text-3xl font-bold mb-2">Selamat Datang! 👋</Text>
                    <Text className="text-white/80 text-base">
                        Mari lengkapi profil Anda untuk pengalaman terbaik
                    </Text>
                </View>
                {/* Progress Indicator */}
                <View className="flex-row items-center mt-6 gap-2">
                    <View className="flex-1 h-1 bg-white rounded-full" />
                    <View className="flex-1 h-1 bg-white/30 rounded-full" />
                    <View className="flex-1 h-1 bg-white/30 rounded-full" />
                </View>
                <Text className="text-white/70 text-sm mt-2">Langkah 1 dari 3</Text>
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
                    {/* Profile Photo */}
                    <View className="items-center py-6">
                        <View className="p-1 rounded-full" style={{ backgroundColor: "#22C55E20" }}>
                            <Image
                                source={user?.imageUrl}
                                style={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: 50,
                                    borderWidth: 4,
                                    borderColor: "#FFFFFF",
                                }}
                                transition={200}
                            />
                        </View>
                        <Text className="text-gray-600 text-center mt-2 px-8">
                            Foto profil dikelola oleh akun Google/Apple Anda
                        </Text>
                    </View>

                    {/* Form Section */}
                    <View className="px-5">
                        {/* Name Input */}
                        <View className="mb-4">
                            <Text className="text-gray-700 font-semibold mb-2 ml-1">Nama Lengkap *</Text>
                            <View className="bg-white rounded-2xl border border-gray-200">
                                <View className="flex-row items-center px-4">
                                    <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                                    <TextInput
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Masukkan nama lengkap"
                                        placeholderTextColor="#9CA3AF"
                                        className="flex-1 py-4 px-3 text-gray-800"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Phone Number Input */}
                        <View className="mb-4">
                            <Text className="text-gray-700 font-semibold mb-2 ml-1">Nomor Telepon *</Text>
                            <View className="bg-white rounded-2xl border border-gray-200">
                                <View className="flex-row items-center px-4">
                                    <Ionicons name="call-outline" size={20} color="#9CA3AF" />
                                    <TextInput
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                        placeholder="Contoh: 081234567890"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="phone-pad"
                                        className="flex-1 py-4 px-3 text-gray-800"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Birth Date Picker */}
                        <View className="mb-4">
                            <Text className="text-gray-700 font-semibold mb-2 ml-1">Tanggal Lahir</Text>
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                className="bg-white rounded-2xl border border-gray-200"
                            >
                                <View className="flex-row items-center px-4 py-4">
                                    <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                                    <Text className={`flex-1 px-3 ${birthDate ? "text-gray-800" : "text-gray-400"}`}>
                                        {formatDate(birthDate)}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {showDatePicker && (
                            <DateTimePicker
                                value={birthDate || new Date(2000, 0, 1)}
                                mode="date"
                                display={Platform.OS === "ios" ? "spinner" : "default"}
                                maximumDate={new Date()}
                                minimumDate={new Date(1900, 0, 1)}
                                onChange={(event, selectedDate) => {
                                    setShowDatePicker(Platform.OS === "ios");
                                    if (selectedDate) {
                                        setBirthDate(selectedDate);
                                    }
                                }}
                            />
                        )}

                        {/* Gender Picker */}
                        <View className="mb-4">
                            <Text className="text-gray-700 font-semibold mb-2 ml-1">Jenis Kelamin</Text>
                            <TouchableOpacity
                                onPress={() => setShowGenderPicker(!showGenderPicker)}
                                className="bg-white rounded-2xl border border-gray-200"
                            >
                                <View className="flex-row items-center px-4 py-4">
                                    <Ionicons
                                        name={gender === "male" ? "male" : gender === "female" ? "female" : "person-outline"}
                                        size={20}
                                        color="#9CA3AF"
                                    />
                                    <Text className={`flex-1 px-3 ${gender ? "text-gray-800" : "text-gray-400"}`}>
                                        {getGenderLabel(gender)}
                                    </Text>
                                    <Ionicons
                                        name={showGenderPicker ? "chevron-up" : "chevron-down"}
                                        size={18}
                                        color="#9CA3AF"
                                    />
                                </View>
                            </TouchableOpacity>

                            {showGenderPicker && (
                                <View className="bg-white rounded-2xl border border-gray-200 mt-2 overflow-hidden">
                                    {GENDER_OPTIONS.map((option) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            onPress={() => {
                                                setGender(option.value);
                                                setShowGenderPicker(false);
                                            }}
                                            className={`flex-row items-center px-4 py-4 border-b border-gray-100 ${gender === option.value ? "bg-green-50" : ""
                                                }`}
                                        >
                                            <Ionicons
                                                name={option.value === "male" ? "male" : option.value === "female" ? "female" : "person"}
                                                size={20}
                                                color={gender === option.value ? "#22C55E" : "#9CA3AF"}
                                            />
                                            <Text
                                                className={`flex-1 px-3 ${gender === option.value ? "text-green-600 font-semibold" : "text-gray-700"
                                                    }`}
                                            >
                                                {option.label}
                                            </Text>
                                            {gender === option.value && <Ionicons name="checkmark-circle" size={20} color="#22C55E" />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Bio Input */}
                        <View className="mb-4">
                            <Text className="text-gray-700 font-semibold mb-2 ml-1">Bio</Text>
                            <View className="bg-white rounded-2xl border border-gray-200">
                                <View className="flex-row items-start px-4 pt-4">
                                    <Ionicons name="document-text-outline" size={20} color="#9CA3AF" />
                                    <TextInput
                                        value={bio}
                                        onChangeText={setBio}
                                        placeholder="Ceritakan sedikit tentang diri Anda..."
                                        placeholderTextColor="#9CA3AF"
                                        multiline
                                        numberOfLines={3}
                                        maxLength={200}
                                        textAlignVertical="top"
                                        className="flex-1 py-0 px-3 pb-4 text-gray-800"
                                        style={{ minHeight: 80 }}
                                    />
                                </View>
                                <View className="px-4 pb-3">
                                    <Text className="text-gray-400 text-xs text-right">{bio.length}/200</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Bottom Continue Button */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 pb-8">
                <TouchableOpacity
                    onPress={handleContinue}
                    disabled={loading}
                    activeOpacity={0.8}
                    className="overflow-hidden rounded-2xl"
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
    );
};

export default ProfileInfoScreen;
