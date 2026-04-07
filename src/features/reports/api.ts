import { useQuery } from "@tanstack/react-query";
import { api } from "../../utils/api";

export type ReportPeriodType = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export type ReportArtifactRecord = {
  id: string;
  restaurantId: string;
  branchId?: string | null;
  periodType: ReportPeriodType;
  periodStart: string;
  periodEnd: string;
  status: string;
  expiresAt?: string | null;
  generatedAt?: string | null;
  generationError?: string | null;
  metrics?: {
    totalOrders?: number;
    grossRevenueMinor?: number;
    refundTotalMinor?: number;
    totalRevenueMinor?: number;
    onlineRevenueMinor?: number;
    cashRevenueMinor?: number;
    itemWiseQuantity?: Record<string, number>;
  };
};

export type ReportDownloadPayload = {
  reportId: string;
  downloadUrl: string;
  s3Key: string;
};

export const useOwnerReports = (periodType?: ReportPeriodType) =>
  useQuery({
    queryKey: ["reports", "owner", periodType],
    queryFn: async () => {
      const query = periodType ? `?periodType=${encodeURIComponent(periodType)}` : "";
      const response = await api.get<{ data: ReportArtifactRecord[] }>(
        `/api/v1/reports${query}`,
      );
      return response.data;
    },
  });

export const generateOwnerReport = async (periodType: ReportPeriodType) => {
  const response = await api.post<{ data: ReportArtifactRecord }>(
    "/api/v1/reports/generate",
    { periodType },
  );
  return response.data;
};

export const getOwnerReport = async (reportId: string) => {
  const response = await api.get<{ data: ReportArtifactRecord }>(
    `/api/v1/reports/${reportId}`,
  );
  return response.data;
};

export const downloadOwnerReport = async (reportId: string) => {
  const response = await api.get<{ data: ReportDownloadPayload }>(
    `/api/v1/reports/${reportId}/download`,
  );
  return response.data;
};
