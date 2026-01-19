import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";

type SecurityOption = {
  id: string;
  icon: string;
  title: string;
  description: string;
  type: "navigation" | "toggle";
  value?: boolean;
};

function PrivacyAndSecurityScreen() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [shareData, setShareData] = useState(false);

  const securitySettings: SecurityOption[] = [
    {
      id: "password",
      icon: "lock-closed-outline",
      title: "Ubah Kata Sandi",
      description: "Perbarui kata sandi akun Anda",
      type: "navigation",
    },
    {
      id: "two-factor",
      icon: "shield-checkmark-outline",
      title: "Autentikasi Dua Faktor",
      description: "Tambahkan lapisan keamanan ekstra",
      type: "toggle",
      value: twoFactorEnabled,
    },
    {
      id: "biometric",
      icon: "finger-print-outline",
      title: "Login Biometrik",
      description: "Gunakan Face ID atau sidik jari",
      type: "toggle",
      value: biometricEnabled,
    },
  ];

  const privacySettings: SecurityOption[] = [
    {
      id: "push",
      icon: "notifications-outline",
      title: "Notifikasi Push",
      description: "Terima notifikasi push",
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
      description: "Terima email promo dan penawaran",
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
    },
    {
      id: "devices",
      icon: "phone-portrait-outline",
      title: "Perangkat Terhubung",
      description: "Kelola perangkat dengan akses",
    },
    {
      id: "data-download",
      icon: "download-outline",
      title: "Unduh Data Anda",
      description: "Dapatkan salinan data Anda",
    },
  ];

  const handleToggle = (id: string, value: boolean) => {
    switch (id) {
      case "two-factor":
        setTwoFactorEnabled(value);
        break;
      case "biometric":
        setBiometricEnabled(value);
        break;
      case "push":
        setPushNotifications(value);
        break;
      case "email":
        setEmailNotifications(value);
        break;
      case "marketing":
        setMarketingEmails(value);
        break;
      case "data":
        setShareData(value);
        break;
    }
  };

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
            <TouchableOpacity
              key={setting.id}
              className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
              activeOpacity={setting.type === "toggle" ? 1 : 0.7}
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

                {setting.type === "toggle" ? (
                  <Switch
                    value={setting.value}
                    onValueChange={(value) => handleToggle(setting.id, value)}
                    thumbColor="#FFFFFF"
                    trackColor={{ false: "#D1D5DB", true: "#22C55E" }}
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                )}
              </View>
            </TouchableOpacity>
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
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* DELETE ACC BTN */}
        <View className="px-5 pt-4">
          <TouchableOpacity
            className="bg-white rounded-2xl p-5 flex-row items-center justify-between border-2 border-red-200 shadow-sm"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="bg-red-100 rounded-full w-12 h-12 items-center justify-center mr-4">
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
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
              Anda dapat mengatur pengaturan privasi kapan saja.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default PrivacyAndSecurityScreen;
