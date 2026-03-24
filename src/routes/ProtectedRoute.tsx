import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import FullPageLoader from "../components/FullPageLoader";
import { roleMatches } from "../features/auth/access";
import type { UserRole } from "../features/auth/types";

interface ProtectedRouteProps {
  children: ReactNode;
  user?: UserRole | UserRole[];
}

export default function ProtectedRoute({
  user: allowedRoles,
  children,
}: ProtectedRouteProps) {
  const { user: currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;

  if (!currentUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (allowedRoles) {
    if (!roleMatches(currentUser.role, allowedRoles)) {
      return <Navigate to="/not-authorized" replace />;
    }
  }

  return <>{children}</>;
}
