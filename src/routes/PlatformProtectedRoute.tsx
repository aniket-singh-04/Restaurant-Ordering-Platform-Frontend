import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import FullPageLoader from "../components/FullPageLoader";
import { usePlatformAdminAuth } from "../features/platform-admin/auth/context";

export default function PlatformProtectedRoute({
  children,
}: {
  children: ReactNode;
}) {
  const { admin, loading } = usePlatformAdminAuth();
  const location = useLocation();

  if (loading) {
    return <FullPageLoader label="Loading platform access..." />;
  }

  if (!admin) {
    return (
      <Navigate
        to="/platform/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <>{children}</>;
}
