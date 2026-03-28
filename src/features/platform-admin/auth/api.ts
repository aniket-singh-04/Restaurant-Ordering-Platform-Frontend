import { adminApi } from "../../../utils/adminApi";
import type { PlatformAdminUser } from "./types";

type AdminSessionPayload = {
  accessToken: string;
  admin: PlatformAdminUser;
};

export const loginPlatformAdmin = async (payload: {
  email: string;
  password: string;
}) => {
  const response = await adminApi.post<{ data: AdminSessionPayload }>(
    "/api/admin/login",
    payload,
    { skipRefresh: true },
  );
  return response.data;
};

export const refreshPlatformAdminSession = async () => {
  const response = await adminApi.post<{ data: AdminSessionPayload }>(
    "/api/admin/refresh",
    undefined,
    { skipRefresh: true },
  );
  return response.data;
};

export const getPlatformAdminMe = async () => {
  const response = await adminApi.get<{ data: PlatformAdminUser }>("/api/admin/me");
  return response.data;
};

export const logoutPlatformAdmin = async () => {
  return adminApi.post<{ success: boolean; message?: string }>("/api/admin/logout");
};
