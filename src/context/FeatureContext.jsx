/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

function normalizeFeatureListPayload(input) {
    if (Array.isArray(input)) {
        return input;
    }

    const candidates = [
        input?.features,
        input?.data,
        input?.items,
        input?.content,
        input?.results,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate;
        }
    }

    return [];
}

const FeatureContext = createContext({
    features: [],
    activeFeatures: [],
    isFeatureActive: () => true,
    loading: true,
    refetchFeatures: () => { },
});

export function FeatureProvider({ children }) {
    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFeatures = useCallback(async () => {
        try {
            const res = await axios.get("/api/v1/system/features");
            const data = normalizeFeatureListPayload(res.data);
            setFeatures(data);
            // Cache to localStorage for faster initial loads
            localStorage.setItem("saas_features", JSON.stringify(data));
        } catch (err) {
            console.error("Failed to load SaaS features:", err);
            // Fallback to cached
            const cached = localStorage.getItem("saas_features");
            if (cached) {
                try {
                    setFeatures(JSON.parse(cached));
                } catch {
                    setFeatures([]);
                }
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Load cached immediately for fast render
        const cached = localStorage.getItem("saas_features");
        if (cached) {
            try {
                setFeatures(normalizeFeatureListPayload(JSON.parse(cached)));
                setLoading(false);
            } catch {
                setFeatures([]);
            }
        }
        // Then fetch fresh from API
        fetchFeatures();
    }, [fetchFeatures]);

    const activeFeatures = features.filter((f) => f.isActive);

    const isFeatureActive = useCallback(
        (featureCode) => {
            if (!featureCode) return true;
            const feature = features.find((f) => f.featureCode === featureCode);
            // If feature not found in the list, allow access (don't block unknown features)
            if (!feature) return true;
            return feature.isActive === true;
        },
        [features]
    );

    return (
        <FeatureContext.Provider
            value={{
                features,
                activeFeatures,
                isFeatureActive,
                loading,
                refetchFeatures: fetchFeatures,
            }}
        >
            {children}
        </FeatureContext.Provider>
    );
}

export function useFeatures() {
    return useContext(FeatureContext);
}
