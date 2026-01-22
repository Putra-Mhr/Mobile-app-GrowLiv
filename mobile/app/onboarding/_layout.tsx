import { Stack } from "expo-router";

export default function OnboardingLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                gestureEnabled: false, // Prevent gestures to go back
                animation: "slide_from_right",
            }}
        >
            <Stack.Screen name="profile-info" />
            <Stack.Screen name="preferences" />
            <Stack.Screen name="default-address" />
        </Stack>
    );
}
