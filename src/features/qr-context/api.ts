import { useQuery } from "@tanstack/react-query";
import { api } from "../../utils/api";

export type QrContext = {
  restaurant: {
    id: string;
    name: string;
    slug?: string;
  };
  branch: {
    id: string;
    name: string;
    city?: string;
    status?: string;
  };
  table: {
    id: string;
    tableNumber: string;
    capacity?: number;
  };
  menuVersion: number;
};

export const useQrContext = (publicQrId?: string) =>
  useQuery({
    queryKey: ["qr-context", publicQrId],
    enabled: Boolean(publicQrId),
    queryFn: async () => {
      const response = await api.get<{ data: QrContext }>(
        `/api/v1/tables/public/qr/${publicQrId}/context`,
      );
      return response.data;
    },
  });
