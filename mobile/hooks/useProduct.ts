import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { Product } from "@/types";

export const useProduct = (productId: string) => {
  const api = useApi();

  const result = useQuery<Product>({
    queryKey: ["product", productId],
    queryFn: async () => {
      console.log("useProduct: Fetching product with ID:", productId);
      try {
        const { data } = await api.get(`/products/${productId}`);
        console.log("useProduct: API response:", data);
        return data;
      } catch (error) {
        console.error("useProduct: API error:", error);
        throw error;
      }
    },
    enabled: !!productId,
  });

  console.log("useProduct: productId =", productId, "data =", result.data, "error =", result.error);

  return result;
};
