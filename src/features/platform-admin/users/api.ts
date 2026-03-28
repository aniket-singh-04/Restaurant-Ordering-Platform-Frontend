import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../../utils/adminApi";
import type { AdminListQuery, AdminUserRecord, PaginatedAdminResponse } from "../auth/types";

const toQueryString = (query: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
};

export const usePlatformAdminUsers = (
  query: AdminListQuery & { role?: string; status?: string; isDeleted?: string },
) =>
  useQuery({
    queryKey: ["platform-admin", "users", query],
    queryFn: async () => {
      const response = await adminApi.get<{ data: PaginatedAdminResponse<AdminUserRecord> }>(
        `/api/admin/users${toQueryString({
          page: query.page,
          limit: query.limit,
          search: query.search,
          role: query.role,
          status: query.status,
          isDeleted: query.isDeleted,
        })}`,
      );
      return response.data;
    },
  });

export const updatePlatformAdminUserStatus = async (
  userId: string,
  payload: {
    action: "BLOCK" | "UNBLOCK";
    reason: string;
  },
) => {
  const response = await adminApi.patch<{ data: AdminUserRecord }>(
    `/api/admin/users/${userId}/status`,
    payload,
  );
  return response.data;
};

export const softDeletePlatformAdminUser = async (userId: string, reason: string) => {
  const response = await adminApi.delete<{ data: AdminUserRecord }>(
    `/api/admin/users/${userId}`,
    { reason },
  );
  return response.data;
};
