import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import FullPageLoader from "../components/FullPageLoader";
import { isAdminPanelRole } from "../features/auth/access";

export default function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;

  if (user) {
    const redirectTo = (location.state as { from?: string } | undefined)?.from;
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    if (isAdminPanelRole(user.role)) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
