import { Stack } from "expo-router";
import "../global.css";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { NotificationProvider } from "@/context/NotificationContext";

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

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </NotificationProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

