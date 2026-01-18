import SafeScreen from "@/components/SafeScreen";
import { useAuth, useUser } from "@clerk/clerk-expo";

import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const MENU_ITEMS = [
  { id: 1, icon: "person-outline", title: "Edit Profile", color: "#3B82F6", action: "/profile" },
  { id: 2, icon: "list-outline", title: "Orders", color: "#10B981", action: "/orders" },
  { id: 3, icon: "location-outline", title: "Addresses", color: "#F59E0B", action: "/addresses" },
  { id: 4, icon: "heart-outline", title: "Wishlist", color: "#EF4444", action: "/wishlist" },
] as const;

const ProfileScreen = () => {
  const { signOut } = useAuth();
  const { user } = useUser();

  const handleMenuPress = (action: (typeof MENU_ITEMS)[number]["action"]) => {
    if (action === "/profile") return;
    router.push(action);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Green Header Background */}
      <LinearGradient
        colors={["#22C55E", "#16A34A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: 200,
          paddingTop: 50,
          paddingHorizontal: 20,
        }}
      >
        <Text className="text-white text-3xl font-bold tracking-tight mb-6">Profile</Text>
      </LinearGradient>

      <ScrollView
        className="flex-1 -mt-20"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* PROFILE CARD */}
        <View className="px-6 pb-6">
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <View className="flex-row items-center">
              <View className="relative">
                <Image
                  source={user?.imageUrl}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                  transition={200}
                />
                <View className="absolute -bottom-1 -right-1 bg-green-500 rounded-full size-7 items-center justify-center border-2 border-white">
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
              </View>

              <View className="flex-1 ml-4">
                <Text className="text-gray-800 text-2xl font-bold mb-1">
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {user?.emailAddresses?.[0]?.emailAddress || "No email"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* MENU ITEMS */}
        <View className="flex-row flex-wrap gap-3 mx-6 mb-4">
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="bg-white rounded-2xl p-6 items-center justify-center shadow-sm border border-gray-100"
              style={{ width: "48%" }}
              activeOpacity={0.7}
              onPress={() => handleMenuPress(item.action)}
            >
              <View
                className="rounded-full w-14 h-14 items-center justify-center mb-3"
                style={{ backgroundColor: item.color + "20" }}
              >
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <Text className="text-gray-800 font-bold text-base">{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* NOTIFICATONS BTN */}
        <View className="mb-3 mx-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <TouchableOpacity
            className="flex-row items-center justify-between py-2"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center mr-3">
                <Ionicons name="notifications-outline" size={22} color="#16A34A" />
              </View>
              <Text className="text-gray-800 font-semibold text-lg">Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* PRIVACY AND SECURTIY LINK */}
        <View className="mb-6 mx-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <TouchableOpacity
            className="flex-row items-center justify-between py-2"
            activeOpacity={0.7}
            onPress={() => router.push("/privacy-security")}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
                <Ionicons name="shield-checkmark-outline" size={22} color="#3B82F6" />
              </View>
              <Text className="text-gray-800 font-semibold text-lg">Privacy & Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* SIGNOUT BTN */}
        <TouchableOpacity
          className="mx-6 mb-3 bg-red-50 rounded-2xl py-4 flex-row items-center justify-center"
          activeOpacity={0.8}
          onPress={() => signOut()}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text className="text-red-500 font-bold text-base ml-2">Sign Out</Text>
        </TouchableOpacity>

        <Text className="mx-6 mb-3 text-center text-gray-400 text-xs text-secondary">Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

// REACT NATIVE IMAGE VS EXPO IMAGE:

// React Native Image (what we have used so far):
// import { Image } from "react-native";
//
// <Image source={{ uri: url }} />

// Basic image component
// No built-in caching optimization
// Requires source={{ uri: string }}

// Expo Image (from expo-image):
// import { Image } from "expo-image";

// <Image source={url} />

// Caching - automatic disk/memory caching
// Placeholder - blur hash, thumbnail while loading
// Transitions - crossfade, fade animations
// Better performance - optimized native rendering
// Simpler syntax: source={url} or source={{ uri: url }}
// Supports contentFit instead of resizeMode

// Example with expo-image:
// <Image   source={user?.imageUrl}  placeholder={blurhash}  transition={200}  contentFit="cover"  className="size-20 rounded-full"/>

// Recommendation: For production apps, expo-image is better — faster, cached, smoother UX.
// React Native's Image works fine for simple cases though.
