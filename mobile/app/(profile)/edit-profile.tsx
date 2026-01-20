import { useUser } from "@clerk/clerk-expo";
import { useCallback, useEffect, useRef, useState } from "react";
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

interface ProfileData {
    name: string;
    email: string;
    imageUrl: string;
    phoneNumber: string;
    birthDate: string | null;
    gender: string;
    bio: string;
}

const GENDER_OPTIONS = [
    { value: "", label: "Pilih Gender" },
    { value: "male", label: "Laki-laki" },
    { value: "female", label: "Perempuan" },
    { value: "other", label: "Lainnya" },
];

const EditProfileScreen = () => {
    const { user } = useUser();
    const api = useApi();
    const { showToast } = useNotification();
    const scrollViewRef = useRef<ScrollView>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showGenderPicker, setShowGenderPicker] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    const [gender, setGender] = useState("");
    const [bio, setBio] = useState("");

    // Scroll to bio when focused
    const handleBioFocus = () => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 300);
    };

    // Load profile data
    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/users/profile");
            const profile: ProfileData = response.data.profile;

            setName(profile.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim());
            setPhoneNumber(profile.phoneNumber || "");
            setBirthDate(profile.birthDate ? new Date(profile.birthDate) : null);
            setGender(profile.gender || "");
            setBio(profile.bio || "");
        } catch (error) {
            console.error("Error loading profile:", error);
            // Use Clerk data as fallback
            setName(`${user?.firstName || ""} ${user?.lastName || ""}`.trim());
        } finally {
            setLoading(false);
        }
    }, [api, user]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleSave = async () => {
        if (!name.trim()) {
            showToast('error', 'Data Belum Lengkap', 'Nama tidak boleh kosong');
            return;
        }

        try {
            setSaving(true);
            await api.put("/users/profile", {
                name: name.trim(),
                phoneNumber: phoneNumber.trim(),
                birthDate: birthDate?.toISOString() || null,
                gender,
                bio: bio.trim(),
            });

            showToast('success', 'Berhasil! ✓', 'Profil berhasil disimpan');
            router.back();
        } catch (error) {
            console.error("Error saving profile:", error);
            showToast('error', 'Gagal Menyimpan', 'Silakan coba lagi');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return "Pilih tanggal lahir";
        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const getGenderLabel = (value: string) => {
        return GENDER_OPTIONS.find((opt) => opt.value === value)?.label || "Pilih Gender";
    };

    if (loading) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#22C55E" />
                <Text className="text-gray-500 mt-3">Memuat profil...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">

            {/* Header */}
            <LinearGradient
                colors={["#22C55E", "#16A34A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 }}
            >
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-white/20 p-2 rounded-xl"
                    >
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold flex-1 text-center mr-10">Edit Profil</Text>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Profile Photo Section */}
                    <View className="items-center py-6">
                        <View className="relative">
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
                            <View className="absolute bottom-0 right-0 bg-green-500 rounded-full w-8 h-8 items-center justify-center border-3 border-white">
                                <Ionicons name="camera" size={16} color="#FFFFFF" />
                            </View>
                        </View>
                        <Text className="text-gray-400 text-sm mt-2">
                            Foto dikelola oleh akun Anda
                        </Text>
                    </View>

                    {/* Form Section */}
                    <View className="px-5">
                        {/* Name Input */}
                        <View className="mb-4">
                            <Text className="text-gray-700 font-semibold mb-2 ml-1">
                                Nama Lengkap
                            </Text>
                            <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
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

                        {/* Email (Read-only) */}
                        <View className="mb-4">
                            <Text className="text-gray-700 font-semibold mb-2 ml-1">Email</Text>
                            <View className="bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden">
                                <View className="flex-row items-center px-4">
                                    <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                                    <Text className="flex-1 py-4 px-3 text-gray-500">
                                        {user?.emailAddresses?.[0]?.emailAddress || "No email"}
                                    </Text>
                                    <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
                                </View>
                            </View>
                            <Text className="text-gray-400 text-xs mt-1 ml-1">
                                Email dikelola oleh penyedia akun
                            </Text>
                        </View>

                        {/* Phone Number Input */}
                        <View className="mb-4">
                            <Text className="text-gray-700 font-semibold mb-2 ml-1">
                                Nomor Telepon
                            </Text>
                            <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
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
                            <Text className="text-gray-700 font-semibold mb-2 ml-1">
                                Tanggal Lahir
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
                            >
                                <View className="flex-row items-center px-4 py-4">
                                    <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                                    <Text
                                        className={`flex-1 px-3 ${birthDate ? "text-gray-800" : "text-gray-400"}`}
                                    >
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
                            <Text className="text-gray-700 font-semibold mb-2 ml-1">
                                Jenis Kelamin
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowGenderPicker(!showGenderPicker)}
                                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
                            >
                                <View className="flex-row items-center px-4 py-4">
                                    <Ionicons
                                        name={gender === "male" ? "male" : gender === "female" ? "female" : "person-outline"}
                                        size={20}
                                        color="#9CA3AF"
                                    />
                                    <Text
                                        className={`flex-1 px-3 ${gender ? "text-gray-800" : "text-gray-400"}`}
                                    >
                                        {getGenderLabel(gender)}
                                    </Text>
                                    <Ionicons
                                        name={showGenderPicker ? "chevron-up" : "chevron-down"}
                                        size={18}
                                        color="#9CA3AF"
                                    />
                                </View>
                            </TouchableOpacity>

                            {/* Gender Options Dropdown */}
                            {showGenderPicker && (
                                <View className="bg-white rounded-2xl border border-gray-200 mt-2 overflow-hidden">
                                    {GENDER_OPTIONS.filter((opt) => opt.value !== "").map((option) => (
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
                                                name={
                                                    option.value === "male"
                                                        ? "male"
                                                        : option.value === "female"
                                                            ? "female"
                                                            : "person"
                                                }
                                                size={20}
                                                color={gender === option.value ? "#22C55E" : "#9CA3AF"}
                                            />
                                            <Text
                                                className={`flex-1 px-3 ${gender === option.value ? "text-green-600 font-semibold" : "text-gray-700"
                                                    }`}
                                            >
                                                {option.label}
                                            </Text>
                                            {gender === option.value && (
                                                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Bio Input */}
                        <View className="mb-4">
                            <Text className="text-gray-700 font-semibold mb-2 ml-1">
                                Bio / Tentang Saya
                            </Text>
                            <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                                <View className="flex-row items-start px-4 pt-4">
                                    <Ionicons name="document-text-outline" size={20} color="#9CA3AF" />
                                    <TextInput
                                        value={bio}
                                        onChangeText={setBio}
                                        onFocus={handleBioFocus}
                                        placeholder="Ceritakan sedikit tentang diri Anda..."
                                        placeholderTextColor="#9CA3AF"
                                        multiline
                                        numberOfLines={4}
                                        maxLength={500}
                                        textAlignVertical="top"
                                        className="flex-1 py-0 px-3 pb-4 text-gray-800"
                                        style={{ minHeight: 100 }}
                                    />
                                </View>
                                <View className="px-4 pb-3">
                                    <Text className="text-gray-400 text-xs text-right">{bio.length}/500</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Save Button at Bottom */}
                    <View className="px-5 mt-4 mb-8">
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={saving}
                            activeOpacity={0.8}
                            className="overflow-hidden rounded-2xl"
                        >
                            <LinearGradient
                                colors={["#22C55E", "#15803D"]}
                                className="py-4 flex-row items-center justify-center"
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" />
                                        <Text className="text-white font-bold text-base ml-2">
                                            Simpan Perubahan
                                        </Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default EditProfileScreen;
