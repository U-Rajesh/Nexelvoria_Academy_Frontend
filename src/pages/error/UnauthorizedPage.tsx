import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const { user } = useAuth();

  const getHomePath = () => {
    if (!user) return '/login';
    if (user.role === 'student') return '/student/dashboard';
    if (user.role === 'teacher') return '/teacher/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'super_admin') return '/super-admin/dashboard';
    return '/';
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="h-16 w-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">403 - Access Restricted</h1>
      <p className="text-slate-500 max-w-md mt-2 mb-6">
        You do not have the required permissions or role authorization to access this section of Nexelvoria Academy.
      </p>
      <div className="flex items-center gap-3">
        <Link to={getHomePath()}>
          <Button variant="primary" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Go to Your Dashboard
          </Button>
        </Link>
        <Link to="/">
          <Button variant="outline" leftIcon={<Home className="h-4 w-4" />}>
            Public Portal
          </Button>
        </Link>
      </div>
    </div>
  );
};

