import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { Order } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import { AxiosError } from "axios";

export const useOrders = () => {
  const api = useApi();
  const { isSignedIn } = useAuth();

  return useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/orders");
        return data.orders;
      } catch (err) {
        const error = err as AxiosError;
        // New user or not synced yet — return empty
        if (error.response?.status === 401 || error.response?.status === 404) {
          return [] as Order[];
        }
        console.error("useOrders: API error:", error.response?.data || error.message);
        throw error;
      }
    },
    enabled: !!isSignedIn,
    staleTime: 1000 * 30, // 30 seconds
    retry: (failureCount, err) => {
      const error = err as AxiosError;
      const status = error.response?.status;
      if (status === 401 || status === 404) return false;
      return failureCount < 2;
    },
  });
};
