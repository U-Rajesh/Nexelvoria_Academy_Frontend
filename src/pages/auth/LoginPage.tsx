import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn, Lock, Mail, ArrowRight, Shield, GraduationCap, BookOpen, UserCheck } from 'lucide-react';
import { loginSchema, type LoginFormData } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';

export const LoginPage: React.FC = () => {
  const { login, switchRole } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('redirect');

  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: 'rohan.sharma@gmail.com',
      password: 'Password@123',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    const result = await login(data);
    if (result.success) {
      showToast({
        type: 'success',
        title: 'Welcome Back',
        message: 'You have logged in successfully.',
      });
      if (returnUrl) {
        navigate(decodeURIComponent(returnUrl));
      } else {
        // Redirect by role
        const currentUser = JSON.parse(localStorage.getItem('nexelvoria_current_user') || '{}');
        if (currentUser.role === 'student') navigate('/student/dashboard');
        else if (currentUser.role === 'teacher') navigate('/teacher/dashboard');
        else if (currentUser.role === 'admin') navigate('/admin/dashboard');
        else if (currentUser.role === 'super_admin') navigate('/super-admin/dashboard');
        else navigate('/');
      }
    } else {
      setAuthError(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleQuickFill = (email: string, role: any, path: string) => {
    setValue('identifier', email);
    setValue('password', 'Password@123');
    switchRole(role);
    showToast({
      type: 'info',
      title: 'Demo Persona Activated',
      message: `Signed in as ${role.toUpperCase()}`,
    });
    navigate(path);
  };

  return (
    <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200/90 shadow-xl space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In to Nexelvoria</h2>
        <p className="text-xs text-slate-500">
          Enter your registered email or 10-digit mobile number to access your portal.
        </p>
      </div>

      {authError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Email Address or Mobile Number
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              {...register('identifier')}
              placeholder="e.g. rohan.sharma@gmail.com"
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {errors.identifier && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.identifier.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">Password</label>
            <Link to="/forgot-password" className="text-[11px] text-indigo-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="password"
              {...register('password')}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {errors.password && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('rememberMe')} className="rounded text-indigo-600" />
            <span>Keep me signed in</span>
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full py-2.5"
          isLoading={isSubmitting}
          rightIcon={<LogIn className="h-4 w-4" />}
        >
          Sign In
        </Button>
      </form>

      {/* One-Click Demo Access Bar */}
      <div className="pt-4 border-t border-slate-100 space-y-2">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
          One-Click Demo Accounts (Instant Access)
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickFill('rohan.sharma@gmail.com', 'student', '/student/dashboard')}
            className="flex items-center gap-1.5 p-2 rounded-lg bg-indigo-50 text-indigo-800 hover:bg-indigo-100 text-left transition-colors cursor-pointer"
          >
            <GraduationCap className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <div className="truncate">
              <span className="font-bold block text-[11px]">Student</span>
              <span className="text-[10px] text-indigo-500 truncate block">Rohan Sharma</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('vikram.rao@nexelvoria.edu.in', 'teacher', '/teacher/dashboard')}
            className="flex items-center gap-1.5 p-2 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 text-left transition-colors cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            <div className="truncate">
              <span className="font-bold block text-[11px]">Teacher</span>
              <span className="text-[10px] text-teal-600 truncate block">Dr. Vikram Rao</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('priya.nair@nexelvoria.edu.in', 'admin', '/admin/dashboard')}
            className="flex items-center gap-1.5 p-2 rounded-lg bg-sky-50 text-sky-800 hover:bg-sky-100 text-left transition-colors cursor-pointer"
          >
            <UserCheck className="h-3.5 w-3.5 text-sky-600 shrink-0" />
            <div className="truncate">
              <span className="font-bold block text-[11px]">Admin</span>
              <span className="text-[10px] text-sky-600 truncate block">Priya Nair</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('founder@nexelvoria.edu.in', 'super_admin', '/super-admin/dashboard')}
            className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100 text-left transition-colors cursor-pointer"
          >
            <Shield className="h-3.5 w-3.5 text-rose-600 shrink-0" />
            <div className="truncate">
              <span className="font-bold block text-[11px]">Super Admin</span>
              <span className="text-[10px] text-rose-600 truncate block">Owner</span>
            </div>
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500">
        New candidate?{' '}
        <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
          Create student account
        </Link>
      </div>
    </div>
  );
};

