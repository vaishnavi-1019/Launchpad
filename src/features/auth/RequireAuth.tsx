import { LoaderCircle } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

export function RequireAuth() {
  const { configured, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="auth-route-loading"><LoaderCircle size={20} /> Checking your session…</div>;
  }
  if (!configured || !user) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate replace to={`/auth?returnTo=${encodeURIComponent(returnTo)}`} />;
  }
  return <Outlet />;
}
