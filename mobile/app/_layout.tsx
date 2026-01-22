import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import "../global.css";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { NotificationProvider } from "@/context/NotificationContext";
import { useApi } from "@/lib/api";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any, query) => {
      // Log errors to console instead of Sentry
      console.error("React Query Error:", {
        queryKey: query.queryKey[0]?.toString() || "unknown",
        errorMessage: error.message,
        statusCode: error.response?.status,
        fullQueryKey: query.queryKey,
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      // Log mutation errors to console instead of Sentry
      console.error("React Query Mutation Error:", {
        errorMessage: error.message,
        statusCode: error.response?.status,
      });
    },
  }),
});

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

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <NavigationHandler />
          <Stack screenOptions={{ headerShown: false }} />
        </NotificationProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
