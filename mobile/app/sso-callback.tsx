import { useEffect } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, View, Text } from "react-native";

export default function SSOCallback() {
    const router = useRouter();

    useEffect(() => {
        // After Clerk handles the SSO callback, redirect to home
        const timer = setTimeout(() => {
            router.replace("/(tabs)");
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View className="flex-1 items-center justify-center bg-white">
            <ActivityIndicator size="large" color="#22C55E" />
            <Text className="text-gray-600 mt-4">Menyelesaikan login...</Text>
        </View>
    );
}
