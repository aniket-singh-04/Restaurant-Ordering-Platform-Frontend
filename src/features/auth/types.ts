export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "RESTRO_OWNER"
  | "BRANCH_OWNER"
  | "STAFF"
  | "CUSTOMER";

export interface AuthUser {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  restroId?: string;
  branchIds?: { _id: string; name: string }[];
  gstNo?: string;
  imageUrl?: string;
}
