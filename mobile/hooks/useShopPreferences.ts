import { useCallback, useState } from 'react';

export type SortOption = 'default' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'newest';
export type ViewMode = 'grid' | 'list';

export interface ShopFilters {
    inStockOnly: boolean;
    priceMin: number | null;
    priceMax: number | null;
}

interface ShopPreferences {
    sortBy: SortOption;
    filters: ShopFilters;
    viewMode: ViewMode;
}

const defaultPreferences: ShopPreferences = {
    sortBy: 'default',
    filters: {
        inStockOnly: false,
        priceMin: null,
        priceMax: null,
    },
    viewMode: 'grid',
};

// Global state to persist across component remounts (but not app restarts)
let globalPreferences: ShopPreferences = { ...defaultPreferences };

export function useShopPreferences() {
    const [preferences, setPreferences] = useState<ShopPreferences>(globalPreferences);

    const setSortBy = useCallback((sortBy: SortOption) => {
        setPreferences((prev) => {
            const updated = { ...prev, sortBy };
            globalPreferences = updated;
            return updated;
        });
    }, []);

    const setFilters = useCallback((filters: ShopFilters) => {
        setPreferences((prev) => {
            const updated = { ...prev, filters };
            globalPreferences = updated;
            return updated;
        });
    }, []);

    const setViewMode = useCallback((viewMode: ViewMode) => {
        setPreferences((prev) => {
            const updated = { ...prev, viewMode };
            globalPreferences = updated;
            return updated;
        });
    }, []);

    const resetFilters = useCallback(() => {
        setPreferences(() => {
            const updated = { ...defaultPreferences };
            globalPreferences = updated;
            return updated;
        });
    }, []);

    const hasActiveFilters =
        preferences.filters.inStockOnly ||
        preferences.filters.priceMin !== null ||
        preferences.filters.priceMax !== null ||
        preferences.sortBy !== 'default';

    const activeFilterCount = [
        preferences.filters.inStockOnly,
        preferences.filters.priceMin !== null || preferences.filters.priceMax !== null,
        preferences.sortBy !== 'default',
    ].filter(Boolean).length;

    return {
        ...preferences,
        isLoaded: true,
        hasActiveFilters,
        activeFilterCount,
        setSortBy,
        setFilters,
        setViewMode,
        resetFilters,
    };
}
