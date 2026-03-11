import { useState, useEffect } from "react";
import type { ScoreboardState, ConnectionStatus } from "../types";
import { subscribeToState, mergeCategories } from "../firebase";
import { DEFAULT_STATE, DEFAULT_CATEGORIES } from "../data/categories";

interface UseFirebaseStateReturn {
    state: ScoreboardState;
    status: ConnectionStatus;
}

/**
 * Subscribes to Firebase in real-time.
 * Merges saved categories with local defaults (preserves question banks).
 */
export function useFirebaseState(): UseFirebaseStateReturn {
    const [state, setState] = useState<ScoreboardState>(DEFAULT_STATE);
    const [status, setStatus] = useState<ConnectionStatus>("connecting");

    useEffect(() => {
        return subscribeToState((data) => {
            if (data) {
                setState({
                    ...DEFAULT_STATE,
                    ...data,
                    categories: data.categories
                        ? mergeCategories(data.categories)
                        : DEFAULT_CATEGORIES,
                });
                setStatus("live");
            } else {
                setStatus("offline");
            }
        });
    }, []);

    return { state, status };
}
