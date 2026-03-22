import type { AuthUser, UserRole } from "./types";

export const ADMIN_PANEL_ROLES: UserRole[] = [
  "ADMIN",
  "RESTRO_OWNER",
  "BRANCH_OWNER",
  "STAFF",
];

export const AUTHENTICATED_APP_ROLES: UserRole[] = [
  ...ADMIN_PANEL_ROLES,
  "CUSTOMER",
];

export const normalizeRoles = (roles?: UserRole | UserRole[]) => {
  if (!roles) return undefined;
  return Array.isArray(roles) ? roles : [roles];
};

export const roleMatches = (
  role: UserRole | null | undefined,
  roles?: UserRole | UserRole[],
) => {
  if (!roles) return Boolean(role);

  const normalizedRoles = normalizeRoles(roles);
  return Boolean(role && normalizedRoles?.includes(role));
};

export const userHasRole = (
  user: AuthUser | null,
  roles?: UserRole | UserRole[],
) => roleMatches(user?.role, roles);

export const isAdminPanelRole = (role: UserRole | null | undefined) =>
  Boolean(role && ADMIN_PANEL_ROLES.includes(role));
