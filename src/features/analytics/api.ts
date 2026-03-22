import { useQuery } from "@tanstack/react-query";
import { api } from "../../utils/api";

export type OverviewMetrics = {
  orders: number;
  revenueMinor: number;
  avgOrderValueMinor?: number;
  restaurants?: number;
};

export const useRestaurantOverview = (restaurantId?: string) =>
  useQuery({
    queryKey: ["analytics", "restaurant", restaurantId],
    enabled: Boolean(restaurantId),
    queryFn: async () => {
      const response = await api.get<{ data: OverviewMetrics }>(
        `/api/v1/analytics/restaurant/${restaurantId}/overview`,
      );
      return response.data;
    },
  });

export const useBranchTrends = (branchId?: string) =>
  useQuery({
    queryKey: ["analytics", "branch", branchId],
    enabled: Boolean(branchId),
    queryFn: async () => {
      const response = await api.get<{ data: Array<{ _id: { year: number; month: number; day: number }; revenueMinor: number; orders: number }> }>(
        `/api/v1/analytics/branch/${branchId}/trends`,
      );
      return response.data;
    },
  });

export const usePlatformOverview = () =>
  useQuery({
    queryKey: ["analytics", "platform"],
    queryFn: async () => {
      const response = await api.get<{ data: OverviewMetrics }>(
        "/api/v1/analytics/platform/overview",
      );
      return response.data;
    },
  });
