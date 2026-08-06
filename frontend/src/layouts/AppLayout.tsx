import type { JSX } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoadingState } from "../components/LoadingState";

export function AppLayout(): JSX.Element {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <LoadingState label="Preparing your workspace..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
