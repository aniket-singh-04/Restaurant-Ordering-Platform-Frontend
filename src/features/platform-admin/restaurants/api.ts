import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../../utils/adminApi";
import type {
  AdminListQuery,
  AdminRestaurantMetrics,
  AdminRestaurantRecord,
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

export const usePlatformAdminRestaurants = (
  query: AdminListQuery & { reviewStatus?: string; suspensionStatus?: string },
) =>
  useQuery({
    queryKey: ["platform-admin", "restaurants", query],
    queryFn: async () => {
      const response = await adminApi.get<{ data: PaginatedAdminResponse<AdminRestaurantRecord> }>(
        `/api/admin/restaurants${toQueryString({
          page: query.page,
          limit: query.limit,
          search: query.search,
          reviewStatus: query.reviewStatus,
          suspensionStatus: query.suspensionStatus,
        })}`,
      );
      return response.data;
    },
  });

export const usePlatformAdminRestaurantMetrics = (restaurantId?: string) =>
  useQuery({
    queryKey: ["platform-admin", "restaurant-metrics", restaurantId],
    enabled: Boolean(restaurantId),
    queryFn: async () => {
      const response = await adminApi.get<{ data: AdminRestaurantMetrics }>(
        `/api/admin/restaurants/${restaurantId}/metrics`,
      );
      return response.data;
    },
  });

export const reviewPlatformRestaurant = async (
  restaurantId: string,
  payload: {
    action: "APPROVE" | "REJECT";
    reason?: string;
  },
) => {
  const response = await adminApi.patch<{ data: AdminRestaurantRecord }>(
    `/api/admin/restaurants/${restaurantId}/review`,
    payload,
  );
  return response.data;
};

export const updatePlatformRestaurantSuspension = async (
  restaurantId: string,
  payload: {
    action: "SUSPEND" | "UNSUSPEND";
    reason?: string;
  },
) => {
  const response = await adminApi.patch<{ data: AdminRestaurantRecord }>(
    `/api/admin/restaurants/${restaurantId}/suspension`,
    payload,
  );
  return response.data;
};
