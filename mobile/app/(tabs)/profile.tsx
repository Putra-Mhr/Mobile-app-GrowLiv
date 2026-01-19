import { useAuth, useUser } from "@clerk/clerk-expo";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const MENU_ITEMS = [
  { id: 1, icon: "person-outline", title: "Edit Profil", color: "#3B82F6", bgColor: "#DBEAFE", action: "/profile" },
  { id: 2, icon: "list-outline", title: "Pesanan", color: "#10B981", bgColor: "#D1FAE5", action: "/orders" },
  { id: 3, icon: "location-outline", title: "Alamat", color: "#F59E0B", bgColor: "#FEF3C7", action: "/addresses" },
  { id: 4, icon: "heart-outline", title: "Wishlist", color: "#EF4444", bgColor: "#FEE2E2", action: "/wishlist" },
] as const;

const BADGES = [
  { icon: "leaf", label: "Petani Aktif", color: "#22C55E" },
  { icon: "star", label: "Member Gold", color: "#F59E0B" },
];

const ProfileScreen = () => {
  const { signOut } = useAuth();
  const { user } = useUser();

  const handleMenuPress = (action: (typeof MENU_ITEMS)[number]["action"]) => {
    if (action === "/profile") return;
    router.push(action);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Green Header with Pattern Overlay */}
      <LinearGradient
        colors={["#22C55E", "#16A34A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: 220,
          paddingTop: 50,
          paddingHorizontal: 20,
        }}
      >
        {/* Decorative leaves in header */}
        <View className="absolute top-12 right-4 opacity-20">
          <Ionicons name="leaf" size={80} color="#FFFFFF" style={{ transform: [{ rotate: "30deg" }] }} />
        </View>
        <View className="absolute top-24 left-8 opacity-10">
          <Ionicons name="leaf" size={60} color="#FFFFFF" style={{ transform: [{ rotate: "-20deg" }] }} />
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-white text-3xl font-bold tracking-tight">Profil</Text>
          <TouchableOpacity className="bg-white/20 p-2 rounded-xl">
            <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1 -mt-24"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* PROFILE CARD */}
        <View className="px-5 pb-4">
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <View className="flex-row items-center">
              <View className="relative">
                <View className="p-1 rounded-full bg-gradient-to-r from-green-400 to-emerald-500">
                  <Image
                    source={user?.imageUrl}
                    style={{ width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: '#FFFFFF' }}
                    transition={200}
                  />
                </View>
                <View className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-7 h-7 items-center justify-center border-2 border-white">
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
              </View>

              <View className="flex-1 ml-4">
                <Text className="text-gray-800 text-xl font-bold mb-1">
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text className="text-gray-500 text-sm mb-2">
                  {user?.emailAddresses?.[0]?.emailAddress || "No email"}
                </Text>
                {/* Achievement Badges */}
                <View className="flex-row gap-2">
                  {BADGES.map((badge, idx) => (
                    <View key={idx} className="flex-row items-center bg-green-50 px-2 py-1 rounded-full">
                      <Ionicons name={badge.icon as any} size={12} color={badge.color} />
                      <Text className="text-xs font-medium ml-1" style={{ color: badge.color }}>
                        {badge.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Gardening Tip of the Day */}
        <View className="px-5 mb-4">
          <LinearGradient
            colors={["#ECFDF5", "#D1FAE5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-2xl p-4"
          >
            <View className="flex-row items-center mb-2">
              <View className="bg-green-500 p-2 rounded-lg mr-2">
                <Ionicons name="bulb" size={16} color="#FFFFFF" />
              </View>
              <Text className="text-green-800 font-bold">Tips Berkebun Hari Ini</Text>
            </View>
            <Text className="text-green-700 text-sm leading-5">
              🌱 Siram tanaman di pagi hari sebelum matahari terik untuk hasil optimal!
            </Text>
          </LinearGradient>
        </View>

        {/* MENU ITEMS - Grid Layout */}
        <View className="flex-row flex-wrap gap-3 mx-5 mb-4">
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="bg-white rounded-2xl p-5 items-center justify-center shadow-sm border border-gray-100"
              style={{ width: "47%" }}
              activeOpacity={0.7}
              onPress={() => handleMenuPress(item.action)}
            >
              <LinearGradient
                colors={[item.bgColor, item.bgColor]}
                className="rounded-2xl w-14 h-14 items-center justify-center mb-3"
              >
                <Ionicons name={item.icon} size={24} color={item.color} />
              </LinearGradient>
              <Text className="text-gray-800 font-bold text-base">{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* NOTIFICATIONS BTN */}
        <View className="mb-3 mx-5 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <TouchableOpacity
            className="flex-row items-center justify-between"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <LinearGradient
                colors={["#DCFCE7", "#BBF7D0"]}
                className="w-11 h-11 rounded-xl items-center justify-center mr-3"
              >
                <Ionicons name="notifications-outline" size={22} color="#16A34A" />
              </LinearGradient>
              <View>
                <Text className="text-gray-800 font-semibold text-base">Notifikasi</Text>
                <Text className="text-gray-500 text-xs">Kelola preferensi notifikasi</Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <View className="bg-red-500 w-5 h-5 rounded-full items-center justify-center mr-2">
                <Text className="text-white text-xs font-bold">3</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* PRIVACY AND SECURITY LINK */}
        <View className="mb-6 mx-5 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <TouchableOpacity
            className="flex-row items-center justify-between"
            activeOpacity={0.7}
            onPress={() => router.push("/privacy-security")}
          >
            <View className="flex-row items-center">
              <LinearGradient
                colors={["#DBEAFE", "#BFDBFE"]}
                className="w-11 h-11 rounded-xl items-center justify-center mr-3"
              >
                <Ionicons name="shield-checkmark-outline" size={22} color="#3B82F6" />
              </LinearGradient>
              <View>
                <Text className="text-gray-800 font-semibold text-base">Privasi & Keamanan</Text>
                <Text className="text-gray-500 text-xs">Pengaturan akun dan keamanan</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* SIGNOUT BTN */}
        <TouchableOpacity
          className="mx-5 mb-3 overflow-hidden rounded-2xl"
          activeOpacity={0.8}
          onPress={() => signOut()}
        >
          <LinearGradient
            colors={["#FEE2E2", "#FECACA"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-4 flex-row items-center justify-center"
          >
            <Ionicons name="log-out-outline" size={22} color="#DC2626" />
            <Text className="text-red-600 font-bold text-base ml-2">Keluar</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text className="mx-5 mb-3 text-center text-gray-400 text-xs">Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;
