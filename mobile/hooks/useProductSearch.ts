import { useApi } from "@/lib/api";
import { Product } from "@/types";
import { useQuery } from "@tanstack/react-query";

interface SearchParams {
    q?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
}

interface SearchResult {
    products: Product[];
    total: number;
    page: number;
    totalPages: number;
}

/**
 * Server-side product search using MongoDB text index.
 * Only fires when query has ≥ 2 characters or a category is selected.
 */
const useProductSearch = (params: SearchParams) => {
    const api = useApi();
    const { q, category, minPrice, maxPrice, page = 1, limit = 20 } = params;

    // Only search when there's a meaningful query or filter
    const hasQuery = !!q && q.trim().length >= 2;
    const hasFilter = !!category || !!minPrice || !!maxPrice;
    const enabled = hasQuery || hasFilter;

    return useQuery<SearchResult>({
        queryKey: ["product-search", q, category, minPrice, maxPrice, page, limit],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (q) searchParams.set("q", q.trim());
            if (category) searchParams.set("category", category);
            if (minPrice) searchParams.set("minPrice", String(minPrice));
            if (maxPrice) searchParams.set("maxPrice", String(maxPrice));
            searchParams.set("page", String(page));
            searchParams.set("limit", String(limit));

            const { data } = await api.get<SearchResult>(
                `/products/search?${searchParams.toString()}`
            );
            return data;
        },
        enabled,
        placeholderData: (prev) => prev, // Keep previous data while loading
        staleTime: 30_000, // Cache for 30s
    });
};

export default useProductSearch;
