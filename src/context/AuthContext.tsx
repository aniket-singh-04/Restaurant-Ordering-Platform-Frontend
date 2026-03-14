import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  userHasRole,
} from "../features/auth/access";
import { removeAuthToken } from "../features/auth/storage";
import type { AuthUser, UserRole } from "../features/auth/types";
import { mapAuthUser } from "../features/auth/user";
import { api, ApiError } from "../utils/api";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  hasRole: (roles?: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const data = await api.get<any>("/api/v1/auth/me");
      const payload = data?.user ?? data?.data ?? data;
      setUser(mapAuthUser(payload));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
        removeAuthToken();
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setLoading(true);
    await fetchUser();
  };

  useEffect(() => {
    void fetchUser();
  }, []);

  const logout = async (): Promise<void> => {
    const response = await api.post<any>("/api/v1/auth/logout");
    if (response?.success === false) {
      throw new Error(response?.message || "Logout failed");
    }
    setUser(null);
    removeAuthToken();
  };

  const hasRole = (roles?: UserRole | UserRole[]) => userHasRole(user, roles);

  const value = useMemo(
    () => ({ user, loading, setUser, logout, refresh, hasRole }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider missing");
  return context;
};
