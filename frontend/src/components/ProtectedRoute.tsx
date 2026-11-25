import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRole: UserRole;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRole,
  children,
}) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated || role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
