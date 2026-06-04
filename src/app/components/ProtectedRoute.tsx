import { Navigate, Outlet, useLocation } from "react-router";
import { ShieldX } from "lucide-react";
import { useAuth, type LoginRole } from "../lib/auth";
import type { ReactNode } from "react";

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function AccessDeniedScreen() {
  return (
    <div className="flex min-h-full items-center justify-center bg-white p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-red-50">
          <ShieldX className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-950">Access Denied</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your role does not have permission to view this page.
        </p>
      </div>
    </div>
  );
}

export function RequireRole({
  allowedRoles,
  children,
}: {
  allowedRoles: LoginRole[];
  children: ReactNode;
}) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <AccessDeniedScreen />;
  }

  return children;
}
