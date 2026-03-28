import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { platformAdminAuthStore, usePlatformAdminAuthStore } from "./store";
import { loginPlatformAdmin, logoutPlatformAdmin, refreshPlatformAdminSession } from "./api";
import type { PlatformAdminUser } from "./types";

type PlatformAdminAuthContextValue = {
  admin: PlatformAdminUser | null;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const PlatformAdminAuthContext = createContext<PlatformAdminAuthContextValue | null>(null);

export function PlatformAdminAuthProvider({ children }: { children: ReactNode }) {
  const storeAdmin = usePlatformAdminAuthStore((state) => state.admin);
  const initialized = usePlatformAdminAuthStore((state) => state.initialized);
  const [admin, setAdmin] = useState<PlatformAdminUser | null>(storeAdmin);
  const [loading, setLoading] = useState(!initialized);

  const refresh = async () => {
    setLoading(true);
    try {
      const session = await refreshPlatformAdminSession();
      platformAdminAuthStore.setAccessToken(session.accessToken);
      platformAdminAuthStore.setAdmin(session.admin);
      setAdmin(session.admin);
    } catch {
      platformAdminAuthStore.clear();
      setAdmin(null);
    } finally {
      platformAdminAuthStore.setInitialized(true);
      setLoading(false);
    }
  };

  const login = async (payload: { email: string; password: string }) => {
    setLoading(true);
    try {
      const session = await loginPlatformAdmin(payload);
      platformAdminAuthStore.setAccessToken(session.accessToken);
      platformAdminAuthStore.setAdmin(session.admin);
      platformAdminAuthStore.setInitialized(true);
      setAdmin(session.admin);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutPlatformAdmin();
    } finally {
      platformAdminAuthStore.clear();
      setAdmin(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialized) {
      void refresh();
    }
  }, [initialized]);

  useEffect(() => {
    setAdmin(storeAdmin);
  }, [storeAdmin]);

  const value = useMemo(
    () => ({
      admin,
      loading,
      login,
      logout,
      refresh,
    }),
    [admin, loading],
  );

  return (
    <PlatformAdminAuthContext.Provider value={value}>
      {children}
    </PlatformAdminAuthContext.Provider>
  );
}

export const usePlatformAdminAuth = () => {
  const context = useContext(PlatformAdminAuthContext);
  if (!context) {
    throw new Error("PlatformAdminAuthProvider missing");
  }
  return context;
};
