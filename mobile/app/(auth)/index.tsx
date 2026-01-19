import useSocialAuth from "@/hooks/useSocialAuth";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { View, Text, Image, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

const AuthScreen = () => {
  const { loadingStrategy, handleSocialAuth } = useSocialAuth();

  return (
    <View className="flex-1 bg-white">
      {/* Green gradient background at top */}
      <LinearGradient
        colors={["#22C55E", "#16A34A", "#15803D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: height * 0.45,
          borderBottomLeftRadius: 50,
          borderBottomRightRadius: 50,
        }}
      >
        {/* Decorative leaves */}
        <View className="absolute top-16 left-6 opacity-20">
          <Ionicons name="leaf" size={80} color="#FFFFFF" />
        </View>
        <View className="absolute top-32 right-8 opacity-30" style={{ transform: [{ rotate: "45deg" }] }}>
          <Ionicons name="leaf" size={60} color="#FFFFFF" />
        </View>
        <View className="absolute bottom-20 left-1/4 opacity-20" style={{ transform: [{ rotate: "-30deg" }] }}>
          <Ionicons name="leaf" size={50} color="#FFFFFF" />
        </View>
      </LinearGradient>

      {/* Content */}
      <View className="flex-1 items-center justify-center px-8">
        {/* Logo Area */}
        <View className="items-center mb-8">
          <View className="bg-white rounded-3xl p-4 shadow-xl mb-4" style={{ shadowColor: "#16A34A", shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }}>
            <Image
              source={require("../../assets/images/auth-image.png")}
              className="w-48 h-48"
              resizeMode="contain"
            />
          </View>

          {/* App Name & Tagline */}
          <View className="items-center mt-6">
            <Text className="text-gray-800 text-3xl font-bold mb-2">GrowLiv</Text>
            <View className="flex-row items-center">
              <Ionicons name="leaf" size={16} color="#22C55E" />
              <Text className="text-gray-500 text-base ml-1">Fresh from the garden</Text>
              <Ionicons name="leaf" size={16} color="#22C55E" style={{ transform: [{ scaleX: -1 }] }} />
            </View>
          </View>
        </View>

        {/* Auth Buttons */}
        <View className="w-full gap-3">
          {/* Google Sign In */}
          <TouchableOpacity
            className="flex-row items-center justify-center bg-white rounded-2xl px-6 py-4 shadow-lg"
            onPress={() => handleSocialAuth("oauth_google")}
            disabled={loadingStrategy !== null}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
            activeOpacity={0.8}
          >
            {loadingStrategy === "oauth_google" ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <View className="flex-row items-center">
                <Image
                  source={require("../../assets/images/google.png")}
                  className="w-6 h-6 mr-3"
                  resizeMode="contain"
                />
                <Text className="text-gray-700 font-semibold text-base">Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Apple Sign In */}
          <TouchableOpacity
            className="flex-row items-center justify-center bg-gray-900 rounded-2xl px-6 py-4 shadow-lg"
            onPress={() => handleSocialAuth("oauth_apple")}
            disabled={loadingStrategy !== null}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
            activeOpacity={0.8}
          >
            {loadingStrategy === "oauth_apple" ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
                <Text className="text-white font-semibold text-base ml-3">Continue with Apple</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <View className="mt-8 px-4">
          <Text className="text-center text-gray-400 text-xs leading-5">
            By signing up, you agree to our{" "}
            <Text className="text-green-600 font-medium">Terms</Text>,{" "}
            <Text className="text-green-600 font-medium">Privacy Policy</Text>, and{" "}
            <Text className="text-green-600 font-medium">Cookie Use</Text>
          </Text>
        </View>

        {/* Bottom decoration */}
        <View className="absolute bottom-8 flex-row items-center">
          <View className="flex-row items-center bg-green-50 px-4 py-2 rounded-full">
            <Ionicons name="shield-checkmark" size={16} color="#22C55E" />
            <Text className="text-green-600 text-xs font-medium ml-2">100% Secure Login</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default AuthScreen;
