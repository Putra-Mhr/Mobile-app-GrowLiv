import Fuse from "fuse.js";
import { useMemo } from "react";

export interface SmartSearchOptions {
    keys?: string[];
    threshold?: number;
}

export const useSmartSearch = <T>(
    data: T[] | undefined,
    query: string,
    options: SmartSearchOptions = {}
): T[] => {
    const { keys = ["name"], threshold = 0.4 } = options;

    const fuse = useMemo(() => {
        if (!data) return null;
        return new Fuse(data, {
            keys,
            threshold,
            ignoreLocation: true,
            minMatchCharLength: 2,
        });
    }, [data, keys.join(","), threshold]);

    const results = useMemo(() => {
        if (!data) return [];
        if (!query || !query.trim()) return data;
        if (!fuse) return data;

        return fuse.search(query).map((result) => result.item);
    }, [fuse, query, data]);

    return results;
};

export default useSmartSearch;
