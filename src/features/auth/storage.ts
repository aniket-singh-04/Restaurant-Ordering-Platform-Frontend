import { authStore } from "./store";

export const getAuthToken = () => authStore.getState().accessToken;

export const setAuthToken = (token: string) => authStore.setAccessToken(token);

export const removeAuthToken = () => authStore.clear();
