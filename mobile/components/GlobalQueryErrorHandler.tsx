import { useNotification } from "@/context/NotificationContext";
import { QueryCache, MutationCache, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export const GlobalQueryErrorHandler = () => {
    const { showToast } = useNotification();
    const queryClient = useQueryClient();

    useEffect(() => {
        // We need to set the global cache callbacks here because showToast 
        // is only available inside the React tree (via Context)

        const queryCache = queryClient.getQueryCache();
        const mutationCache = queryClient.getMutationCache();

        // Save original configs to restore later if needed (optional cleanup)
        // For now we just overwrite the onError handler

        // This is a bit of a hack: React Query's global config is usually set in new QueryClient()
        // But we can't access Context there. So we attach listeners here.
        // However, standard QueryClass doesn't expose a simple "setErrorHandler".
        // Instead, we can rely on the fact that we can subscribe to the cache.

        // BETTER APPROACH: 
        // We will subscribe to the cache and listen for failures.

        const unsubscribeQuery = queryCache.subscribe((event) => {
            if (event.type === 'updated' && event.action?.type === 'failed') {
                const error = event.action.error as any;
                // Avoid showing toast for background refetches that user didn't initiate
                // checking if query has observers is a good proxy for "user cares about this"
                if (event.query.getObserversCount() > 0) {
                    const message = error?.response?.data?.message || error?.message || "Kesalahan Jaringan";
                    // Simple debounce/dedupe logic could go here if needed
                    showToast('error', 'Gagal Memuat Data', message);
                }
            }
        });

        const unsubscribeMutation = mutationCache.subscribe((event) => {
            if (event.type === 'updated' && event.action?.type === 'failed') {
                const error = event.action.error as any;
                const message = error?.response?.data?.message || error?.message || "Gagal Memproses";
                showToast('error', 'Terjadi Kesalahan', message);
            }
        });

        return () => {
            unsubscribeQuery();
            unsubscribeMutation();
        }
    }, [showToast, queryClient]);

    return null; // This component handles side effects only
};
