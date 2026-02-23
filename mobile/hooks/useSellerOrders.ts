import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { AxiosError } from "axios";

interface OrderItem {
    name: string;
    quantity: number;
    price: number;
    image: string;
    product?: {
        _id: string;
        name: string;
        images: string[];
        price: number;
    };
}

interface TrackingEntry {
    status: string;
    title: string;
    description: string;
    timestamp: string;
}

export interface SellerOrder {
    _id: string;
    status: string;
    totalPrice: number;
    createdAt: string;
    user: {
        name: string;
        email: string;
        imageUrl?: string;
    };
    orderItems: OrderItem[];
    shippingAddress: {
        fullName: string;
        streetAddress: string;
        city: string;
        province: string;
        postalCode: string;
        phone: string;
    };
    trackingHistory: TrackingEntry[];
    shippedAt?: string;
    deliveredAt?: string;
    isPaid: boolean;
}

interface OrderDetailResponse {
    order: SellerOrder;
    trackingHistory: TrackingEntry[];
}

export const useSellerOrders = () => {
    const api = useApi();
    const queryClient = useQueryClient();

    // Fetch all seller orders
    const ordersQuery = useQuery<SellerOrder[]>({
        queryKey: ["seller-orders"],
        queryFn: async () => {
            const { data } = await api.get("/seller/orders");
            return data;
        },
        staleTime: 1000 * 30, // 30 seconds
    });

    // Update order status mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ orderId, status, description }: {
            orderId: string;
            status: string;
            description?: string;
        }) => {
            await api.put(`/seller/orders/${orderId}/status`, { status, description });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["seller-orders"] });
        },
        onError: (err) => {
            const error = err as AxiosError<{ message?: string }>;
            console.error("Failed to update order status:", error.response?.data?.message || error.message);
        },
    });

    return {
        orders: ordersQuery.data || [],
        isLoading: ordersQuery.isLoading,
        isError: ordersQuery.isError,
        refetch: ordersQuery.refetch,
        isRefetching: ordersQuery.isRefetching,
        updateStatus: updateStatusMutation.mutate,
        isUpdating: updateStatusMutation.isPending,
    };
};

/**
 * Hook to fetch a single seller order detail with tracking history
 */
export const useSellerOrderDetail = (orderId: string) => {
    const api = useApi();

    return useQuery<OrderDetailResponse>({
        queryKey: ["seller-order-detail", orderId],
        queryFn: async () => {
            const { data } = await api.get<OrderDetailResponse>(`/seller/orders/${orderId}`);
            return data;
        },
        enabled: !!orderId,
        staleTime: 1000 * 15, // 15 seconds
    });
};
