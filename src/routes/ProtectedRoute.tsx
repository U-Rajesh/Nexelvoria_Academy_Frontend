import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" label="Authenticating session..." />
      </div>
    );
  }

  // Not logged in -> redirect to login with return path
  if (!isAuthenticated || !user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // If role is not permitted for this route
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect user to their own role's home dashboard
    if (role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'super_admin') return <Navigate to="/super-admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

