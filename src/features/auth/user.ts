import type { AuthUser } from "./types";

export const mapAuthUser = (payload: any): AuthUser | null => {
  if (!payload?.role) return null;

  return {
    id: payload._id ?? payload.id,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    role: payload.role,
    restroId: payload.restroId ?? payload.restaurantId,
    branchId: payload.branchId,
    gstNo: payload.gstNo ?? payload.gstNumber,
    imageUrl: payload.imageUrl,
  };
};
