import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../../utils/adminApi";
import type { AdminDashboardPayload } from "../auth/types";

export const usePlatformAdminDashboard = () =>
  useQuery({
    queryKey: ["platform-admin", "dashboard"],
    queryFn: async () => {
      const response = await adminApi.get<{ data: AdminDashboardPayload }>("/api/admin/dashboard");
      return response.data;
    },
  });
