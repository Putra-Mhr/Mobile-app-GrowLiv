import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { AxiosError } from "axios";

interface Profile {
    name: string;
    email: string;
    imageUrl: string;
    phoneNumber: string;
    birthDate: string | null;
    gender: string;
    bio: string;
    role: string;
}

interface Store {
    _id: string;
    name: string;
    description: string;
    logo: string;
    isVerified: boolean;
}

/**
 * Hook for fetching user profile from backend.
 * Uses React Query for caching, auto-refetch on focus, etc.
 */
export const useProfile = () => {
    const api = useApi();
    const { isSignedIn } = useAuth();

    const query = useQuery<Profile>({
        queryKey: ["profile"],
        queryFn: async () => {
            const { data } = await api.get("/users/profile");
            return data.profile;
        },
        enabled: !!isSignedIn,
        staleTime: 1000 * 60, // 1 minute
        retry: (failureCount, err) => {
            const error = err as AxiosError;
            if (error.response?.status === 401) return false;
            return failureCount < 2;
        },
    });

    return {
        profile: query.data ?? null,
        isLoading: query.isLoading,
        isError: query.isError,
        refetch: query.refetch,
    };
};

/**
 * Hook for fetching the current user's store (seller only).
 * Enabled only when the user role is 'seller'.
 */
export const useMyStore = (role?: string) => {
    const api = useApi();
    const { isSignedIn } = useAuth();

    const query = useQuery<Store>({
        queryKey: ["my-store"],
        queryFn: async () => {
            const { data } = await api.get("/stores/my-store");
            return data;
        },
        enabled: !!isSignedIn && role === "seller",
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: (failureCount, err) => {
            const error = err as AxiosError;
            if (error.response?.status === 404) return false; // No store yet
            return failureCount < 2;
        },
    });

    return {
        store: query.data ?? null,
        isLoading: query.isLoading,
        isError: query.isError,
        refetch: query.refetch,
    };
};
