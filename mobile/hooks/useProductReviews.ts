import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { Review } from "@/types";

interface CreateReviewData {
    productId: string;
    rating: number;
    comment?: string;
}

export const useProductReviews = (productId: string) => {
    const api = useApi();
    const queryClient = useQueryClient();

    const {
        data: reviews,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["reviews", productId],
        queryFn: async () => {
            if (!productId) return [];

            try {
                // Use the new GET endpoint for product reviews
                const { data } = await api.get<{ reviews: Review[] }>(`/reviews/product/${productId}`);
                return data.reviews || [];
            } catch (error: any) {

                return [];
            }
        },
        enabled: !!productId,
        retry: false,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const createReviewMutation = useMutation({
        mutationFn: async (reviewData: CreateReviewData) => {
            // Use the new POST endpoint for product reviews (no order required)
            const { data } = await api.post<{ review: Review }>("/reviews/product", reviewData);
            return data.review;
        },
        onSuccess: () => {
            // Refetch reviews after successful submission
            queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["product", productId] });
        },
    });

    // Safely calculate stats from reviews
    const safeReviews = reviews || [];
    const reviewStats = {
        averageRating: safeReviews.length > 0
            ? safeReviews.reduce((sum, r) => sum + r.rating, 0) / safeReviews.length
            : 0,
        totalReviews: safeReviews.length,
        distribution: [5, 4, 3, 2, 1].map(star => ({
            star,
            count: safeReviews.filter(r => r.rating === star).length,
            percentage: safeReviews.length > 0
                ? (safeReviews.filter(r => r.rating === star).length / safeReviews.length) * 100
                : 0,
        })),
    };

    return {
        reviews: safeReviews,
        isLoading,
        isError: false,
        reviewStats,
        refetchReviews: refetch,
        createReview: createReviewMutation.mutate,
        createReviewAsync: createReviewMutation.mutateAsync,
        isCreatingReview: createReviewMutation.isPending,
        createReviewError: createReviewMutation.error,
    };
};
