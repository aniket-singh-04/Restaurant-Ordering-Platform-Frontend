import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../../utils/adminApi";
import type {
  AdminListQuery,
  AdminPaymentRecord,
  AdminPaymentRefundRecord,
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

export const usePlatformAdminPayments = (
  query: AdminListQuery & { status?: string; refundStatus?: string; provider?: string },
) =>
  useQuery({
    queryKey: ["platform-admin", "payments", query],
    queryFn: async () => {
      const response = await adminApi.get<{ data: PaginatedAdminResponse<AdminPaymentRecord> }>(
        `/api/admin/payments${toQueryString({
          page: query.page,
          limit: query.limit,
          search: query.search,
          status: query.status,
          refundStatus: query.refundStatus,
          provider: query.provider,
        })}`,
      );
      return response.data;
    },
  });

export const getPlatformAdminPayment = async (paymentAttemptId: string) => {
  const response = await adminApi.get<{ data: AdminPaymentRecord }>(
    `/api/admin/payments/${paymentAttemptId}`,
  );
  return response.data;
};

export const refundPlatformAdminPayment = async (paymentAttemptId: string, reason: string) => {
  const idempotencyKey =
    window.crypto?.randomUUID?.() ?? `refund-${paymentAttemptId}-${Date.now()}`;
  const response = await adminApi.post<{ data: AdminPaymentRefundRecord }>(
    `/api/admin/payments/${paymentAttemptId}/refund`,
    { reason },
    {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    },
  );
  return response.data;
};
