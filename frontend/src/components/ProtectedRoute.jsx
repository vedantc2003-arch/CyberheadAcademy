import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (user === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" data-testid="auth-loading">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }
  if (user === false) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};
