import { useMutation } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { AxiosError } from "axios";

interface ValidationIssue {
    productId: string;
    name: string;
    issue: "out_of_stock" | "insufficient_stock" | "not_found";
    requested: number;
    available: number;
}

interface ValidationResult {
    valid: boolean;
    issues: ValidationIssue[];
}

/**
 * Hook to validate cart stock before checkout.
 * Calls POST /api/cart/validate to check all items are available.
 *
 * Usage:
 * ```tsx
 * const { validateCart, isValidating, validationResult } = useCartValidation();
 *
 * const handleCheckout = async () => {
 *   const result = await validateCart();
 *   if (!result.valid) {
 *     // Show issues to user
 *     return;
 *   }
 *   // Proceed to payment
 * };
 * ```
 */
export const useCartValidation = () => {
    const api = useApi();

    const mutation = useMutation({
        mutationFn: async (): Promise<ValidationResult> => {
            try {
                const { data } = await api.post<ValidationResult>("/cart/validate");
                return data;
            } catch (err) {
                const error = err as AxiosError<ValidationResult>;
                // 400 means validation failed with issues — this is expected
                if (error.response?.status === 400 && error.response.data?.issues) {
                    return {
                        valid: false,
                        issues: error.response.data.issues,
                    };
                }
                throw error;
            }
        },
    });

    return {
        validateCart: mutation.mutateAsync,
        isValidating: mutation.isPending,
        validationResult: mutation.data,
        validationError: mutation.error,
    };
};
