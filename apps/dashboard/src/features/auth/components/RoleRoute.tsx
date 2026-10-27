import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../../hooks/useAuth/useAuth";
import type { AppRole } from "../types/auth";

interface RoleRouteProps {
  allowedRoles: AppRole[];
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        role="status"
        aria-live="polite"
      >
        Loading permissions...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!role) {
    return (
      <div role="alert" className="p-6">
        Your account permissions could not be verified. Please sign in again or
        contact support.
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
