import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { AxiosError } from "axios";
import { Product } from "@/types";
import { useAuth } from "@clerk/clerk-expo";

const useWishlist = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { isSignedIn, isLoaded } = useAuth();

  const {
    data: wishlist,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      try {
        const { data } = await api.get<{ wishlist: Product[] }>("/users/wishlist");
        return data.wishlist;
      } catch (err) {
        const error = err as AxiosError;
        // Silently return empty array for auth/user errors
        const status = error.response?.status;
        if (status === 401 || status === 403 || status === 404 || status === 500) {
          // New user or not synced yet - return empty wishlist
          return [] as Product[];
        }
        throw error;
      }
    },
    // Only fetch if user is fully signed in and auth is loaded
    enabled: isLoaded && !!isSignedIn,
    // Don't retry on common errors
    retry: (failureCount, err) => {
      const error = err as AxiosError;
      const status = error.response?.status;
      if (status === 401 || status === 403 || status === 404 || status === 500) {
        return false;
      }
      return failureCount < 1;
    },
    staleTime: 1000 * 60,
    // Return empty array on error instead of throwing
    placeholderData: [],
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.post<{ wishlist: string[] }>("/users/wishlist", { productId });
      return data.wishlist;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
    onError: () => {
      // Silently fail for new users
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.delete<{ wishlist: string[] }>(`/users/wishlist/${productId}`);
      return data.wishlist;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
    onError: () => {
      // Silently fail
    },
  });

  const isInWishlist = (productId: string) => {
    return wishlist?.some((product) => product._id === productId) ?? false;
  };

  const toggleWishlist = (productId: string) => {
    if (!isSignedIn) return;
    if (isInWishlist(productId)) {
      removeFromWishlistMutation.mutate(productId);
    } else {
      addToWishlistMutation.mutate(productId);
    }
  };

  return {
    wishlist: wishlist || [],
    isLoading: isLoading && isSignedIn,
    isError: false, // Always return false to prevent error states
    wishlistCount: wishlist?.length || 0,
    isInWishlist,
    toggleWishlist,
    addToWishlist: addToWishlistMutation.mutate,
    removeFromWishlist: removeFromWishlistMutation.mutate,
    isAddingToWishlist: addToWishlistMutation.isPending,
    isRemovingFromWishlist: removeFromWishlistMutation.isPending,
  };
};

export default useWishlist;
