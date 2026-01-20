import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { Cart } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import { useEffect } from "react";

const useCart = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { isSignedIn, userId } = useAuth();

  // Reset cart query when user changes (logout/login)
  useEffect(() => {
    if (!isSignedIn) {
      queryClient.removeQueries({ queryKey: ["cart"] });
    }
  }, [isSignedIn, userId, queryClient]);

  const {
    data: cart,
    isLoading,
    isError,
    error,
  } = useQuery({
    // CRITICAL: Include userId in query key to isolate cart data per user
    queryKey: ["cart", userId],
    queryFn: async () => {
      console.log("useCart: Fetching cart for user:", userId);
      try {
        const { data } = await api.get<{ cart: Cart }>("/cart");
        console.log("useCart: API response:", data);
        return data.cart;
      } catch (error: any) {
        // If user doesn't exist yet (new account), return empty cart
        // The backend will auto-create the user on next request via auth middleware
        if (error?.response?.status === 401 || error?.response?.status === 404) {
          console.log("useCart: User not found or unauthorized, returning empty cart");
          return { items: [] } as Partial<Cart> as Cart;
        }
        // For network errors or other issues, throw to trigger error state
        console.error("useCart: API error:", error?.response?.data || error.message);
        throw error;
      }
    },
    // Only fetch if user is signed in and userId is available
    enabled: !!isSignedIn && !!userId,
    // Retry with exponential backoff for network errors
    retry: (failureCount, error: any) => {
      // Don't retry on 401/404 errors (user not found)
      if (error?.response?.status === 401 || error?.response?.status === 404) {
        return false;
      }
      // Retry up to 3 times for other errors (network issues, etc)
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    // Reduce stale time to 10 seconds for fresher data
    staleTime: 1000 * 10, // 10 seconds
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      const { data } = await api.post<{ cart: Cart }>("/cart", { productId, quantity });
      return data.cart;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart", userId] }),
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const { data } = await api.put<{ cart: Cart }>(`/cart/${productId}`, { quantity });
      return data.cart;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart", userId] }),
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.delete<{ cart: Cart }>(`/cart/${productId}`);
      return data.cart;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart", userId] }),
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete<{ cart: Cart }>("/cart");
      return data.cart;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart", userId] }),
  });

  const cartTotal =
    cart?.items?.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0) ?? 0;

  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return {
    cart,
    isLoading: isLoading && isSignedIn,
    isError,
    error,
    cartTotal,
    cartItemCount,
    addToCart: addToCartMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    clearCart: clearCartMutation.mutate,
    isAddingToCart: addToCartMutation.isPending,
    isUpdating: updateQuantityMutation.isPending,
    isRemoving: removeFromCartMutation.isPending,
    isClearing: clearCartMutation.isPending,
  };
};
export default useCart;
