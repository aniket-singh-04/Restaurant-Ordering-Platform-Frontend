import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../../utils/adminApi";
import type {
  ReportArtifactRecord,
  ReportDownloadPayload,
  ReportPeriodType,
} from "../../reports/api";

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

export const usePlatformAdminReports = (query: {
  restaurantId?: string;
  periodType?: ReportPeriodType;
}) =>
  useQuery({
    queryKey: ["platform-admin", "reports", query],
    queryFn: async () => {
      const response = await adminApi.get<{ data: ReportArtifactRecord[] }>(
        `/api/admin/reports${toQueryString(query)}`,
      );
      return response.data;
    },
  });

export const generatePlatformAdminReport = async (payload: {
  restaurantId: string;
  periodType: ReportPeriodType;
}) => {
  const response = await adminApi.post<{ data: ReportArtifactRecord }>(
    "/api/admin/reports/generate",
    payload,
  );
  return response.data;
};

export const getPlatformAdminReport = async (reportId: string) => {
  const response = await adminApi.get<{ data: ReportArtifactRecord }>(
    `/api/admin/reports/${reportId}`,
  );
  return response.data;
};

export const downloadPlatformAdminReport = async (reportId: string) => {
  const response = await adminApi.get<{ data: ReportDownloadPayload }>(
    `/api/admin/reports/${reportId}/download`,
  );
  return response.data;
};
