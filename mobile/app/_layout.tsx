import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import "../global.css";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { NotificationProvider } from "@/context/NotificationContext";
import { useApi } from "@/lib/api";

const queryClient = new QueryClient(); // Remove default onError logging as it is now handled by GlobalQueryErrorHandler

// Component to handle navigation based on auth and onboarding status
function NavigationHandler() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const api = useApi();
  const hasCheckedOnboarding = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    const checkOnboarding = async () => {
      if (isSignedIn) {
        // Only check onboarding status once when user signs in
        if (hasCheckedOnboarding.current) return;

        try {
          const { data } = await api.get("/users/onboarding-status");
          hasCheckedOnboarding.current = true;

          const inOnboarding = segments[0] === "onboarding";

          // If onboarding not completed and not in onboarding flow, redirect to onboarding
          if (data.needsOnboarding && !inOnboarding) {
            router.replace("/onboarding/profile-info");
          }
          // If onboarding completed and in onboarding flow, redirect to main app
          else if (!data.needsOnboarding && inOnboarding) {
            router.replace("/(tabs)");
          }
        } catch (error) {
          console.error("Error checking onboarding status:", error);
          hasCheckedOnboarding.current = true;
          // If error, allow user to proceed
        }
      } else {
        // Reset check when user signs out
        hasCheckedOnboarding.current = false;

        // Not signed in, redirect to auth
        const inAuth = segments[0] === "(auth)";
        if (!inAuth) {
          router.replace("/(auth)");
        }
      }
    };

    checkOnboarding();
  }, [isSignedIn, isLoaded]);

  return null;
}

import { GlobalQueryErrorHandler } from "@/components/GlobalQueryErrorHandler";

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <GlobalQueryErrorHandler />
          <NavigationHandler />
          <Stack screenOptions={{ headerShown: false }} />
        </NotificationProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
