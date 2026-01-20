import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { Cart } from "@/types";
import { useAuth } from "@clerk/clerk-expo";

const useCart = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();

  const {
    data: cart,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      console.log("useCart: Fetching cart");
      try {
        const { data } = await api.get<{ cart: Cart }>("/cart");
        console.log("useCart: API response:", data);
        return data.cart;
      } catch (error: any) {
        // If user doesn't exist yet (new account), return empty cart
        if (error?.response?.status === 401 || error?.response?.status === 404) {
          console.log("useCart: User not found, returning empty cart");
          return { items: [] } as Cart;
        }
        console.error("useCart: API error:", error);
        throw error;
      }
    },
    // Only fetch if user is signed in
    enabled: !!isSignedIn,
    // Don't retry on 401/404 errors
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
    // Stale time to reduce unnecessary refetches
    staleTime: 1000 * 60, // 1 minute
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      const { data } = await api.post<{ cart: Cart }>("/cart", { productId, quantity });
      return data.cart;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const { data } = await api.put<{ cart: Cart }>(`/cart/${productId}`, { quantity });
      return data.cart;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.delete<{ cart: Cart }>(`/cart/${productId}`);
      return data.cart;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete<{ cart: Cart }>("/cart");
      return data.cart;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const cartTotal =
    cart?.items?.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0) ?? 0;

  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return {
    cart,
    isLoading: isLoading && isSignedIn,
    isError,
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
