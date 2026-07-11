/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

const SystemNameContext = createContext({
    systemName: 'SmartRetail Pro',
    refreshSystemName: () => { },
});

export function SystemNameProvider({ children }) {
    const [systemName, setSystemName] = useState(() => {
        // Try localStorage first for instant load
        return localStorage.getItem('systemName') || 'SmartRetail Pro';
    });

    const fetchSystemName = useCallback(async () => {
        try {
            const response = await api.get('/v1/system/name');
            const name = response.data?.data?.systemName || 'SmartRetail Pro';
            setSystemName(name);
            localStorage.setItem('systemName', name);
        } catch {
            // silent — use cached or default
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchSystemName();
    }, [fetchSystemName]);

    // Keep browser tab title in sync with system name
    useEffect(() => {
        document.title = systemName;
    }, [systemName]);


    const refreshSystemName = useCallback(() => {
        fetchSystemName();
    }, [fetchSystemName]);

    return (
        <SystemNameContext.Provider value={{ systemName, refreshSystemName }}>
            {children}
        </SystemNameContext.Provider>
    );
}

export function useSystemName() {
    return useContext(SystemNameContext);
}

export default SystemNameContext;
