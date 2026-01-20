import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";

export interface Notification {
    _id: string;
    userId: string;
    type: "order_status" | "promo" | "info" | "reminder" | "system";
    title: string;
    message: string;
    data: Record<string, any>;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}

interface NotificationsResponse {
    notifications: Notification[];
    unreadCount: number;
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

const useNotifications = () => {
    const api = useApi();
    const queryClient = useQueryClient();
    const { isSignedIn } = useAuth();

    // Fetch all notifications
    const {
        data,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["notifications"],
        queryFn: async () => {
            const { data } = await api.get<NotificationsResponse>("/notifications");
            return data;
        },
        enabled: !!isSignedIn,
        staleTime: 1000 * 30, // 30 seconds
        retry: (failureCount, error: any) => {
            if (error?.response?.status === 401 || error?.response?.status === 404) {
                return false;
            }
            return failureCount < 2;
        },
    });

    // Fetch unread count only (lightweight)
    const { data: countData } = useQuery({
        queryKey: ["notifications-count"],
        queryFn: async () => {
            const { data } = await api.get<{ unreadCount: number }>("/notifications/unread-count");
            return data;
        },
        enabled: !!isSignedIn,
        staleTime: 1000 * 15, // 15 seconds
        refetchInterval: 1000 * 60, // Refetch every minute
    });

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            const { data } = await api.put(`/notifications/${notificationId}/read`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
        },
    });

    // Mark all as read mutation
    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.put("/notifications/read-all");
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
        },
    });

    // Delete notification mutation
    const deleteNotificationMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            const { data } = await api.delete(`/notifications/${notificationId}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
        },
    });

    // Delete all notifications mutation
    const deleteAllMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.delete("/notifications");
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
        },
    });

    return {
        notifications: data?.notifications || [],
        unreadCount: countData?.unreadCount || data?.unreadCount || 0,
        pagination: data?.pagination,
        isLoading: isLoading && isSignedIn,
        isError,
        refetch,
        markAsRead: markAsReadMutation.mutate,
        markAllAsRead: markAllAsReadMutation.mutate,
        deleteNotification: deleteNotificationMutation.mutate,
        deleteAll: deleteAllMutation.mutate,
        isMarkingRead: markAsReadMutation.isPending,
        isMarkingAllRead: markAllAsReadMutation.isPending,
        isDeleting: deleteNotificationMutation.isPending,
    };
};

export default useNotifications;
