import { api } from "../../utils/api";
import { useQuery } from "@tanstack/react-query";

export const createOrder = async (payload: {
  restaurantId: string;
  branchId: string;
  tableId: string;
  orderType: "DINE_IN" | "TAKEAWAY";
  paymentMode: "ONLINE_ADVANCE" | "CASH_CONFIRMED_BY_STAFF";
  notes?: string;
  items: Array<{
    menuId: string;
    quantity: number;
    addOns?: Array<{ code?: string; name: string; price: number }>;
  }>;
}) => {
  const response = await api.post<{ data: { _id?: string; id?: string } }>("/api/v1/orders", payload);
  return response.data;
};

export const useBranchOrders = (branchId?: string) =>
  useQuery({
    queryKey: ["orders", "branch", branchId],
    enabled: Boolean(branchId),
    queryFn: async () => {
      const response = await api.get<{ data: any[] }>(`/api/v1/orders/branch/${branchId}`);
      return response.data;
    },
  });
