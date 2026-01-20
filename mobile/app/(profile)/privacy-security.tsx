import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, Share, Switch, Text, TouchableOpacity, View } from "react-native";
import { useApi } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import { useAuth, useUser } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";

type SecurityOption = {
  id: string;
  icon: string;
  title: string;
  description: string;
  type: "toggle";
  value?: boolean;
};

interface ExportData {
  exportDate: string;
  profile: {
    name: string;
    email: string;
    phoneNumber: string;
    birthDate: string | null;
    gender: string;
    bio: string;
    createdAt: string;
    updatedAt: string;
  };
  addresses: Array<{
    label: string;
    fullName: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    phoneNumber: string;
    isDefault: boolean;
  }>;
  wishlist: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  privacySettings: Record<string, boolean>;
}

function PrivacyAndSecurityScreen() {
  const api = useApi();
  const { showToast, showConfirmation } = useNotification();
  const { user } = useUser();
  const { signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDevicesModal, setShowDevicesModal] = useState(false);
  const [exportedData, setExportedData] = useState<ExportData | null>(null);

  // Privacy settings state
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [shareData, setShareData] = useState(false);

  // Load settings from API
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/privacy-settings");
      const settings = response.data.privacySettings;

      setBiometricEnabled(settings.biometricEnabled ?? false);
      setPushNotifications(settings.pushNotifications ?? true);
      setEmailNotifications(settings.emailNotifications ?? true);
      setMarketingEmails(settings.marketingEmails ?? false);
      setShareData(settings.shareData ?? false);
    } catch (error) {
      console.error("Error loading privacy settings:", error);
      showToast("error", "Gagal Memuat", "Tidak dapat memuat pengaturan privasi");
    } finally {
      setLoading(false);
    }
  }, [api, showToast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save single setting to API with real functionality
  const saveSetting = async (key: string, value: boolean) => {
    try {
      await api.put("/users/privacy-settings", { [key]: value });

      // Store biometric preference locally for app startup
      if (key === "biometricEnabled") {
        await SecureStore.setItemAsync("biometricEnabled", value.toString());
      }

      showToast("success", "Tersimpan", "Pengaturan berhasil diperbarui");
    } catch (error) {
      console.error("Error saving privacy setting:", error);
      showToast("error", "Gagal", "Tidak dapat menyimpan pengaturan");
      loadSettings();
    }
  };

  const handleToggle = async (id: string, value: boolean) => {
    switch (id) {
      case "biometric":
        setBiometricEnabled(value);
        await saveSetting("biometricEnabled", value);
        if (value) {
          showToast("info", "Biometrik Aktif", "Login dengan Face ID/sidik jari akan digunakan saat tersedia");
        }
        break;
      case "push":
        setPushNotifications(value);
        await saveSetting("pushNotifications", value);
        if (value) {
          showToast("info", "Notifikasi Aktif", "Anda akan menerima notifikasi push");
        } else {
          showToast("info", "Notifikasi Nonaktif", "Notifikasi push dimatikan");
        }
        break;
      case "email":
        setEmailNotifications(value);
        await saveSetting("emailNotifications", value);
        break;
      case "marketing":
        setMarketingEmails(value);
        await saveSetting("marketingEmails", value);
        break;
      case "data":
        setShareData(value);
        await saveSetting("shareData", value);
        if (value) {
          showToast("info", "Terima Kasih", "Data anonim Anda membantu kami meningkatkan aplikasi");
        }
        break;
    }
  };

  // Account Deletion
  const handleDeleteAccount = () => {
    showConfirmation({
      title: "Hapus Akun",
      message: "Apakah Anda yakin ingin menghapus akun? Semua data Anda akan dihapus secara permanen dan tidak dapat dipulihkan.",
      type: "danger",
      confirmText: "Hapus",
      cancelText: "Batal",
      onConfirm: async () => {
        try {
          setDeleteLoading(true);
          await api.delete("/users/account");
          showToast("success", "Akun Dihapus", "Akun Anda telah berhasil dihapus");
          await signOut();
          router.replace("/");
        } catch (error) {
          console.error("Error deleting account:", error);
          showToast("error", "Gagal", "Tidak dapat menghapus akun. Silakan coba lagi.");
        } finally {
          setDeleteLoading(false);
        }
      },
    });
  };

  // Export User Data
  const handleDownloadData = async () => {
    try {
      setExportLoading(true);
      const response = await api.get("/users/export-data");
      setExportedData(response.data.data);
      setShowDataModal(true);
    } catch (error) {
      console.error("Error exporting data:", error);
      showToast("error", "Gagal", "Tidak dapat mengekspor data. Silakan coba lagi.");
    } finally {
      setExportLoading(false);
    }
  };

  // Share exported data
  const handleShareData = async () => {
    if (!exportedData) return;

    try {
      await Share.share({
        message: JSON.stringify(exportedData, null, 2),
        title: "Data Akun GrowLiv",
      });
    } catch (error) {
      console.error("Error sharing data:", error);
    }
  };

  // View Connected Devices
  const handleViewDevices = () => {
    setShowDevicesModal(true);
  };

  // View Account Activity
  const handleViewActivity = () => {
    setShowActivityModal(true);
  };

  // Format date helper
  const formatDate = (date: Date | null | undefined, format: "full" | "short" = "full") => {
    if (!date) return "Tidak diketahui";
    const d = new Date(date);
    if (format === "full") {
      return d.toLocaleString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return d.toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const securitySettings: SecurityOption[] = [
    {
      id: "biometric",
      icon: "finger-print-outline",
      title: "Login Biometrik",
      description: "Gunakan Face ID atau sidik jari untuk login cepat",
      type: "toggle",
      value: biometricEnabled,
    },
  ];

  const privacySettings: SecurityOption[] = [
    {
      id: "push",
      icon: "notifications-outline",
      title: "Notifikasi Push",
      description: "Terima notifikasi pesanan & promo",
      type: "toggle",
      value: pushNotifications,
    },
    {
      id: "email",
      icon: "mail-outline",
      title: "Notifikasi Email",
      description: "Terima update pesanan via email",
      type: "toggle",
      value: emailNotifications,
    },
    {
      id: "marketing",
      icon: "megaphone-outline",
      title: "Email Promosi",
      description: "Terima email promo dan penawaran khusus",
      type: "toggle",
      value: marketingEmails,
    },
    {
      id: "data",
      icon: "analytics-outline",
      title: "Berbagi Data Penggunaan",
      description: "Bantu kami meningkatkan aplikasi",
      type: "toggle",
      value: shareData,
    },
  ];

  const accountSettings = [
    {
      id: "activity",
      icon: "time-outline",
      title: "Aktivitas Akun",
      description: "Lihat riwayat login terbaru",
      onPress: handleViewActivity,
    },
    {
      id: "devices",
      icon: "phone-portrait-outline",
      title: "Perangkat Terhubung",
      description: "Kelola perangkat dengan akses",
      onPress: handleViewDevices,
    },
    {
      id: "data-download",
      icon: "download-outline",
      title: "Unduh Data Anda",
      description: "Dapatkan salinan data Anda",
      onPress: handleDownloadData,
      loading: exportLoading,
    },
  ];

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50">
        <LinearGradient
          colors={["#22C55E", "#16A34A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 }}
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-white/20 p-2 rounded-xl mr-3"
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold">Privasi & Keamanan</Text>
          </View>
        </LinearGradient>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#22C55E" />
          <Text className="text-gray-500 mt-4">Memuat pengaturan...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Activity Modal */}
      <Modal
        visible={showActivityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActivityModal(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white rounded-3xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <View className="bg-green-50 p-6 items-center">
              <View className="bg-white p-3 rounded-full shadow-sm">
                <LinearGradient
                  colors={["#22C55E", "#16A34A"]}
                  className="w-14 h-14 rounded-full items-center justify-center"
                >
                  <Ionicons name="time-outline" size={28} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text className="text-gray-800 text-xl font-bold mt-4">Aktivitas Akun</Text>
            </View>

            {/* Content */}
            <View className="p-6">
              <View className="flex-row items-center mb-4">
                <View className="bg-blue-100 p-2 rounded-full mr-3">
                  <Ionicons name="log-in-outline" size={20} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 text-sm">Login Terakhir</Text>
                  <Text className="text-gray-800 font-semibold">{formatDate(user?.lastSignInAt)}</Text>
                </View>
              </View>

              <View className="flex-row items-center mb-4">
                <View className="bg-purple-100 p-2 rounded-full mr-3">
                  <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 text-sm">Akun Dibuat</Text>
                  <Text className="text-gray-800 font-semibold">{formatDate(user?.createdAt, "short")}</Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="bg-green-100 p-2 rounded-full mr-3">
                  <Ionicons name="checkmark-circle-outline" size={20} color="#22C55E" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 text-sm">Status</Text>
                  <Text className="text-green-600 font-semibold">Aktif</Text>
                </View>
              </View>
            </View>

            {/* Button */}
            <View className="px-6 pb-6">
              <TouchableOpacity
                onPress={() => setShowActivityModal(false)}
                className="overflow-hidden rounded-2xl"
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#22C55E", "#15803D"]}
                  className="py-4 items-center"
                >
                  <Text className="text-white font-bold text-base">Tutup</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Devices Modal */}
      <Modal
        visible={showDevicesModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDevicesModal(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white rounded-3xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <View className="bg-green-50 p-6 items-center">
              <View className="bg-white p-3 rounded-full shadow-sm">
                <LinearGradient
                  colors={["#22C55E", "#16A34A"]}
                  className="w-14 h-14 rounded-full items-center justify-center"
                >
                  <Ionicons name="phone-portrait-outline" size={28} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text className="text-gray-800 text-xl font-bold mt-4">Perangkat Terhubung</Text>
            </View>

            {/* Content */}
            <View className="p-6">
              <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                <View className="flex-row items-center mb-3">
                  <View className="bg-green-100 p-2 rounded-full mr-3">
                    <Ionicons name="phone-portrait" size={20} color="#22C55E" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-bold">Perangkat Ini</Text>
                    <Text className="text-green-600 text-sm">Aktif sekarang</Text>
                  </View>
                  <View className="bg-green-500 w-3 h-3 rounded-full" />
                </View>

                <View className="border-t border-gray-200 pt-3">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="mail-outline" size={16} color="#6B7280" />
                    <Text className="text-gray-600 text-sm ml-2">{user?.primaryEmailAddress?.emailAddress || "-"}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="logo-google" size={16} color="#6B7280" />
                    <Text className="text-gray-600 text-sm ml-2">
                      {user?.externalAccounts?.[0]?.provider === "google" ? "Google Account" :
                        user?.externalAccounts?.[0]?.provider === "apple" ? "Apple Account" : "OAuth"}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex-row items-start">
                <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
                <Text className="text-gray-600 text-sm ml-2 flex-1">
                  Untuk mengelola sesi lainnya, silakan kunjungi pengaturan akun Google/Apple Anda.
                </Text>
              </View>
            </View>

            {/* Button */}
            <View className="px-6 pb-6">
              <TouchableOpacity
                onPress={() => setShowDevicesModal(false)}
                className="overflow-hidden rounded-2xl"
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#22C55E", "#15803D"]}
                  className="py-4 items-center"
                >
                  <Text className="text-white font-bold text-base">Tutup</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Data Export Modal */}
      <Modal
        visible={showDataModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDataModal(false)}
      >
        <View className="flex-1 bg-black/60">
          <View className="flex-1 mt-20 bg-white rounded-t-3xl">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
              <Text className="text-gray-800 text-xl font-bold">Data Anda</Text>
              <TouchableOpacity onPress={() => setShowDataModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-5 py-4">
              {exportedData && (
                <>
                  {/* Profile Section */}
                  <View className="mb-6">
                    <Text className="text-gray-800 font-bold text-lg mb-3">Profil</Text>
                    <View className="bg-gray-50 rounded-xl p-4">
                      <Text className="text-gray-600">Nama: {exportedData.profile.name}</Text>
                      <Text className="text-gray-600">Email: {exportedData.profile.email}</Text>
                      <Text className="text-gray-600">Telepon: {exportedData.profile.phoneNumber || "-"}</Text>
                      <Text className="text-gray-600">Gender: {exportedData.profile.gender || "-"}</Text>
                      <Text className="text-gray-600">Bio: {exportedData.profile.bio || "-"}</Text>
                    </View>
                  </View>

                  {/* Addresses Section */}
                  <View className="mb-6">
                    <Text className="text-gray-800 font-bold text-lg mb-3">
                      Alamat ({exportedData.addresses.length})
                    </Text>
                    {exportedData.addresses.length > 0 ? (
                      exportedData.addresses.map((addr, idx) => (
                        <View key={idx} className="bg-gray-50 rounded-xl p-4 mb-2">
                          <Text className="text-gray-800 font-semibold">{addr.label}</Text>
                          <Text className="text-gray-600">{addr.streetAddress}</Text>
                          <Text className="text-gray-600">{addr.city}, {addr.state} {addr.zipCode}</Text>
                        </View>
                      ))
                    ) : (
                      <Text className="text-gray-500">Belum ada alamat tersimpan</Text>
                    )}
                  </View>

                  {/* Wishlist Section */}
                  <View className="mb-6">
                    <Text className="text-gray-800 font-bold text-lg mb-3">
                      Wishlist ({exportedData.wishlist.length})
                    </Text>
                    {exportedData.wishlist.length > 0 ? (
                      exportedData.wishlist.map((item, idx) => (
                        <View key={idx} className="bg-gray-50 rounded-xl p-4 mb-2">
                          <Text className="text-gray-800">{item.name}</Text>
                          <Text className="text-green-600 font-semibold">
                            Rp {item.price.toLocaleString("id-ID")}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text className="text-gray-500">Wishlist kosong</Text>
                    )}
                  </View>

                  {/* Export Info */}
                  <View className="mb-6 bg-green-50 rounded-xl p-4">
                    <Text className="text-gray-600 text-sm">
                      Data diekspor pada: {new Date(exportedData.exportDate).toLocaleString("id-ID")}
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Share Button */}
            <View className="px-5 pb-8 pt-4 border-t border-gray-200">
              <TouchableOpacity
                onPress={handleShareData}
                className="overflow-hidden rounded-2xl"
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#22C55E", "#15803D"]}
                  className="py-4 flex-row items-center justify-center"
                >
                  <Ionicons name="share-outline" size={22} color="#FFFFFF" />
                  <Text className="text-white font-bold text-base ml-2">Bagikan Data</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
            className="bg-white/20 p-2 rounded-xl mr-3"
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Privasi & Keamanan</Text>
            <Text className="text-white/70 text-sm">Kelola pengaturan keamanan akun</Text>
          </View>
          <View className="bg-white/20 p-2 rounded-xl">
            <Ionicons name="shield-checkmark" size={22} color="#FFFFFF" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* SECURITY SETTING */}
        <View className="px-5 pt-6">
          <Text className="text-gray-800 text-lg font-bold mb-4">Keamanan</Text>

          {securitySettings.map((setting) => (
            <View
              key={setting.id}
              className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
            >
              <View className="flex-row items-center">
                <View className="bg-green-100 rounded-full w-12 h-12 items-center justify-center mr-4">
                  <Ionicons name={setting.icon as any} size={24} color="#22C55E" />
                </View>

                <View className="flex-1">
                  <Text className="text-gray-800 font-bold text-base mb-1">
                    {setting.title}
                  </Text>
                  <Text className="text-gray-500 text-sm">{setting.description}</Text>
                </View>

                <Switch
                  value={setting.value}
                  onValueChange={(value) => handleToggle(setting.id, value)}
                  thumbColor="#FFFFFF"
                  trackColor={{ false: "#D1D5DB", true: "#22C55E" }}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Privacy Section */}
        <View className="px-5 pt-4">
          <Text className="text-gray-800 text-lg font-bold mb-4">Privasi</Text>

          {privacySettings.map((setting) => (
            <View key={setting.id}>
              <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                <View className="flex-row items-center">
                  <View className="bg-green-100 rounded-full w-12 h-12 items-center justify-center mr-4">
                    <Ionicons name={setting.icon as any} size={24} color="#22C55E" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-bold text-base mb-1">
                      {setting.title}
                    </Text>
                    <Text className="text-gray-500 text-sm">{setting.description}</Text>
                  </View>
                  <Switch
                    value={setting.value}
                    onValueChange={(value) => handleToggle(setting.id, value)}
                    trackColor={{ false: "#D1D5DB", true: "#22C55E" }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ACCOUNT SECTION */}
        <View className="px-5 pt-4">
          <Text className="text-gray-800 text-lg font-bold mb-4">Akun</Text>

          {accountSettings.map((setting) => (
            <TouchableOpacity
              key={setting.id}
              className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
              activeOpacity={0.7}
              onPress={setting.onPress}
              disabled={setting.loading}
            >
              <View className="flex-row items-center">
                <View className="bg-green-100 rounded-full w-12 h-12 items-center justify-center mr-4">
                  <Ionicons name={setting.icon as any} size={24} color="#22C55E" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-bold text-base mb-1">
                    {setting.title}
                  </Text>
                  <Text className="text-gray-500 text-sm">{setting.description}</Text>
                </View>
                {setting.loading ? (
                  <ActivityIndicator size="small" color="#22C55E" />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* DELETE ACC BTN */}
        <View className="px-5 pt-4">
          <TouchableOpacity
            className="bg-white rounded-2xl p-5 flex-row items-center justify-between border-2 border-red-200 shadow-sm"
            activeOpacity={0.7}
            onPress={handleDeleteAccount}
            disabled={deleteLoading}
          >
            <View className="flex-row items-center">
              <View className="bg-red-100 rounded-full w-12 h-12 items-center justify-center mr-4">
                {deleteLoading ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Ionicons name="trash-outline" size={24} color="#EF4444" />
                )}
              </View>
              <View>
                <Text className="text-red-500 font-bold text-base mb-1">Hapus Akun</Text>
                <Text className="text-gray-500 text-sm">Hapus akun secara permanen</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* INFO ALERT */}
        <View className="px-5 pt-6 pb-4">
          <View className="bg-green-50 border border-green-200 rounded-2xl p-4 flex-row">
            <Ionicons name="information-circle-outline" size={24} color="#22C55E" />
            <Text className="text-gray-600 text-sm ml-3 flex-1">
              Kami serius menjaga privasi Anda. Data Anda dienkripsi dan disimpan dengan aman.
              Pengaturan ini tersimpan di akun Anda dan berlaku di semua perangkat.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default PrivacyAndSecurityScreen;
