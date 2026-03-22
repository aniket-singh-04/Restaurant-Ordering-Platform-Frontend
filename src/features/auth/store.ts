import { create } from "zustand";
import type { AuthUser } from "./types";

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  setAccessToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  clear: () => set({ accessToken: null, user: null }),
}));

export const authStore = {
  getState: () => useAuthStore.getState(),
  setAccessToken: (token: string | null) => useAuthStore.getState().setAccessToken(token),
  setUser: (user: AuthUser | null) => useAuthStore.getState().setUser(user),
  clear: () => useAuthStore.getState().clear(),
};
