import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../../utils/adminApi";
import type {
  AdminListQuery,
  AdminSubscriptionRecord,
  PaginatedAdminResponse,
} from "../auth/types";

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

export const usePlatformAdminSubscriptions = (
  query: AdminListQuery & { accessStatus?: string; planCode?: string },
) =>
  useQuery({
    queryKey: ["platform-admin", "subscriptions", query],
    queryFn: async () => {
      const response = await adminApi.get<{
        data: PaginatedAdminResponse<AdminSubscriptionRecord>;
      }>(
        `/api/admin/subscriptions${toQueryString({
          page: query.page,
          limit: query.limit,
          search: query.search,
          accessStatus: query.accessStatus,
          planCode: query.planCode,
        })}`,
      );
      return response.data;
    },
  });

export const updatePlatformSubscriptionOverride = async (
  subscriptionId: string,
  payload: {
    action: "ACTIVATE" | "DEACTIVATE" | "EXTEND";
    reason: string;
    effectiveUntil?: string;
  },
) => {
  const response = await adminApi.patch<{ data: AdminSubscriptionRecord }>(
    `/api/admin/subscriptions/${subscriptionId}/override`,
    payload,
  );
  return response.data;
};
