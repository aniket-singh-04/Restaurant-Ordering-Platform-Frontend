import { useQuery } from "@tanstack/react-query";
import type { QrContext } from "../../types/table";
import { api } from "../../utils/api";

export type { QrContext } from "../../types/table";

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
