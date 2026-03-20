import type { AuthUser } from "./types";

const toBranchArray = (value: any) => {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
};

const normalizeBranchIds = (value: any): { _id: string; name: string }[] =>
  toBranchArray(value).flatMap((branch: any) => {
    if (typeof branch === "string") {
      return [{ _id: branch, name: branch }];
    }

    const branchId = branch?._id ?? branch?.id;
    if (!branchId) return [];

    return [
      {
        _id: branchId,
        name: branch?.name ?? "Unnamed Branch",
      },
    ];
  });

export const mapAuthUser = (payload: any): AuthUser | null => {
  if (!payload?.role) return null;
  const branchIds = normalizeBranchIds(payload.branchIds ?? payload.branchId);
  const data = {
    ...payload,
    id: payload._id ?? payload.id,
    restroId: payload.restroId ?? payload.restaurantId,
    branchIds,
    branchId: branchIds[0]?._id ?? "",
    gstNo: payload.gstNo ?? payload.gstNumber,
  };
  return data;
};
