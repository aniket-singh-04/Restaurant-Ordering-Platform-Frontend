import { useQuery } from "@tanstack/react-query";
import { api } from "../../utils/api";

export type OrderRecord = {
  _id?: string;
  id: string;
  restaurantId?: string;
  branchId?: string;
  tableId?: string;
  orderType: "DINE_IN" | "TAKEAWAY";
  OrderStatus: string;
  paymentStatus: string;
  refundStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  acceptanceDeadlineAt?: string;
  acceptanceExpiredAt?: string;
  acceptanceRemainingMs?: number | null;
  canCustomerCancel?: boolean;
  canStaffCancel?: boolean;
  canAccept?: boolean;
  paymentSummary?: {
    mode: string;
    advanceRequired: number;
    advanceReceived: number;
    remainingDue: number;
    settlementStatus: string;
  } | null;
  refundSummary?: {
    status: string;
  };
  totalsSnapshot: {
    subtotal: number;
    addonsTotal: number;
    tax: number;
    discount: number;
    dineInCharge?: number;
    grandTotal: number;
  };
  itemsSnapshot?: Array<{
    itemId: string;
    nameSnapshot: string;
    priceSnapshot: number;
    quantity: number;
  }>;
};

type OrderPayload = {
  restaurantId: string;
  branchId: string;
  tableId?: string;
  orderType: "DINE_IN" | "TAKEAWAY";
  paymentMode: "ONLINE_ADVANCE" | "CASH_CONFIRMED_BY_STAFF";
  notes?: string;
  items: Array<{
    menuId: string;
    quantity: number;
    addOns?: Array<{ code?: string; name: string; price: number }>;
  }>;
};

const listQuery = (path?: string) =>
  useQuery({
    queryKey: ["orders", path],
    enabled: Boolean(path),
    queryFn: async () => {
      const response = await api.get<{ data: OrderRecord[] }>(path ?? "");
      return response.data;
    },
  });

export const createOrder = async (payload: OrderPayload) => {
  const response = await api.post<{ data: OrderRecord }>("/api/v1/orders", payload);
  return response.data;
};

export const getOrder = async (orderId: string) => {
  const response = await api.get<{ data: OrderRecord }>(`/api/v1/orders/${orderId}`);
  return response.data;
};

export const cancelOrder = async (orderId: string, reason?: string) => {
  await api.post(`/api/v1/orders/${orderId}/cancel`, reason ? { reason } : undefined);
};

export const updateOrderStatus = async (
  orderId: string,
  nextState: string,
  reason?: string,
) => {
  await api.patch(`/api/v1/orders/${orderId}/state`, { nextState, reason });
};

export const confirmCashOrder = async (orderId: string) => {
  const response = await api.post<{ data: OrderRecord }>(`/api/v1/orders/${orderId}/confirm-cash`);
  return response.data;
};

export const useMyOrders = () => listQuery("/api/v1/orders/my");

export const useBranchOrders = (branchId?: string) =>
  listQuery(branchId ? `/api/v1/orders/branch/${branchId}` : undefined);

export const useRestaurantOrders = (restaurantId?: string) =>
  listQuery(restaurantId ? `/api/v1/orders/restaurant/${restaurantId}` : undefined);
