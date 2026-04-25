import { Navigate, Outlet } from "react-router-dom";

import { useSession } from "@/features/auth/api/useSession";

export function ProtectedRoute() {
  const { data: session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
