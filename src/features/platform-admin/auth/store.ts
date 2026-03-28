import { create } from "zustand";
import type { PlatformAdminUser } from "./types";

type PlatformAdminAuthState = {
  accessToken: string | null;
  admin: PlatformAdminUser | null;
  initialized: boolean;
  setAccessToken: (token: string | null) => void;
  setAdmin: (admin: PlatformAdminUser | null) => void;
  setInitialized: (initialized: boolean) => void;
  clear: () => void;
};

export const usePlatformAdminAuthStore = create<PlatformAdminAuthState>((set) => ({
  accessToken: null,
  admin: null,
  initialized: false,
  setAccessToken: (accessToken) => set({ accessToken }),
  setAdmin: (admin) => set({ admin }),
  setInitialized: (initialized) => set({ initialized }),
  clear: () => set({ accessToken: null, admin: null, initialized: true }),
}));

export const platformAdminAuthStore = {
  getState: () => usePlatformAdminAuthStore.getState(),
  setAccessToken: (token: string | null) =>
    usePlatformAdminAuthStore.getState().setAccessToken(token),
  setAdmin: (admin: PlatformAdminUser | null) =>
    usePlatformAdminAuthStore.getState().setAdmin(admin),
  setInitialized: (initialized: boolean) =>
    usePlatformAdminAuthStore.getState().setInitialized(initialized),
  clear: () => usePlatformAdminAuthStore.getState().clear(),
};
