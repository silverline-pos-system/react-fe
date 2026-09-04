/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import {
  getPasswordResetPendingCount,
  subscribeToPasswordResetPendingCount,
} from "@/features/admin/services/adminApi";

const PasswordResetCountContext = createContext({
  pendingCount: 0,
  loading: true,
});

/**
 * Owns a single SSE subscription for the pending password-reset count and
 * shares it with every consumer (sidebar badge, dashboard card, ...).
 * Mount once high in the admin tree so only one stream is opened per admin.
 */
export function PasswordResetCountProvider({ children }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    const fetchCount = async () => {
      try {
        const data = await getPasswordResetPendingCount();
        setPendingCount(data || 0);
      } catch {
        // silent — keep last known count
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
    unsubscribe = subscribeToPasswordResetPendingCount(
      (count) => setPendingCount(count || 0),
      () => {
        // keep last known count if the stream is temporarily unavailable
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <PasswordResetCountContext.Provider value={{ pendingCount, loading }}>
      {children}
    </PasswordResetCountContext.Provider>
  );
}

export function usePasswordResetCount() {
  return useContext(PasswordResetCountContext);
}

export default PasswordResetCountContext;
