import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { Product } from "@/types";

export const useProduct = (productId: string) => {
  const api = useApi();

  const result = useQuery<Product>({
    queryKey: ["product", productId],
    queryFn: async () => {

      try {
        const { data } = await api.get(`/products/${productId}`);

        return data;
      } catch (error) {
        console.error("useProduct: API error:", error);
        throw error;
      }
    },
    enabled: !!productId,
  });



  return result;
};
