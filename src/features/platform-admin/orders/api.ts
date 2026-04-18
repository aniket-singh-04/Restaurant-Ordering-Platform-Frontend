import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../../utils/adminApi";
import type { AdminListQuery, AdminOrderRecord, PaginatedAdminResponse } from "../auth/types";

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

export const usePlatformAdminOrders = (
  query: AdminListQuery & {
    status?: string;
    paymentStatus?: string;
    restaurantId?: string;
    orderType?: string;
    orderSource?: string;
    paymentMode?: string;
  },
) =>
  useQuery({
    queryKey: ["platform-admin", "orders", query],
    queryFn: async () => {
      const response = await adminApi.get<{ data: PaginatedAdminResponse<AdminOrderRecord> }>(
        `/api/admin/orders${toQueryString({
          page: query.page,
          limit: query.limit,
          search: query.search,
          status: query.status,
          paymentStatus: query.paymentStatus,
          restaurantId: query.restaurantId,
          orderType: query.orderType,
          orderSource: query.orderSource,
          paymentMode: query.paymentMode,
        })}`,
      );
      return response.data;
    },
  });

export const getPlatformAdminOrder = async (orderId: string) => {
  const response = await adminApi.get<{
    data: {
      order: AdminOrderRecord;
      paymentAttempts: Array<Record<string, unknown>>;
      refunds: Array<Record<string, unknown>>;
    };
  }>(`/api/admin/orders/${orderId}`);
  return response.data;
};

export const exceptionCancelPlatformOrder = async (
  orderId: string,
  payload: {
    reasonCategory: "DISPUTE" | "SYSTEM_FAILURE";
    reason: string;
    refundCapturedPayments: boolean;
  },
) => {
  const response = await adminApi.post<{ data: AdminOrderRecord }>(
    `/api/admin/orders/${orderId}/exception-cancel`,
    payload,
  );
  return response.data;
};
