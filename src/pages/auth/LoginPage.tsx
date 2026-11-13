import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  LogIn,
  Lock,
  Mail,
  Shield,
  GraduationCap,
  BookOpen,
  UserCheck,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { loginSchema, type LoginFormData } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { AccountStatusBanner } from '../../components/auth/AccountStatusBanner';
import type { AccountState } from '../../types';

export const LoginPage: React.FC = () => {
  const { login, switchRole } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('redirect');

  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [accountStatus, setAccountStatus] = useState<{
    state: AccountState;
    studentId?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: 'rohan.sharma@gmail.com',
      password: 'Password@123',
      rememberMe: true,
    },
  });

  const currentIdentifier = watch('identifier');

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    setAccountStatus(null);

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
        const currentUser = JSON.parse(localStorage.getItem('nexelvoria_current_user') || '{}');
        if (currentUser.role === 'student') navigate('/student/dashboard');
        else if (currentUser.role === 'teacher') navigate('/teacher/dashboard');
        else if (currentUser.role === 'admin') navigate('/admin/dashboard');
        else if (currentUser.role === 'super_admin') navigate('/super-admin/dashboard');
        else navigate('/');
      }
    } else {
      if (result.accountState) {
        setAccountStatus({
          state: result.accountState,
          studentId: result.studentId,
        });
      }
      setAuthError(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleQuickFill = (email: string, role: any, path: string) => {
    setAuthError(null);
    setAccountStatus(null);
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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In to Nexelvoria</h1>
        <p className="text-xs text-slate-500">
          Enter your registered email address or 10-digit mobile number to access your portal.
        </p>
      </div>

      {/* Account Status Alert Banner */}
      {accountStatus && (
        <div className="space-y-2">
          <AccountStatusBanner
            state={accountStatus.state}
            studentId={accountStatus.studentId}
            onActionClick={
              accountStatus.state === 'pending_verification'
                ? () =>
                    navigate(
                      `/verify-otp?studentId=${accountStatus.studentId || ''}&email=${encodeURIComponent(
                        currentIdentifier || ''
                      )}`
                    )
                : undefined
            }
          />
        </div>
      )}

      {authError && !accountStatus && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{authError}</span>
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
              placeholder="e.g. rohan.sharma@gmail.com or 9876543210"
              className={`w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 ${
                errors.identifier
                  ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-indigo-500'
              }`}
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
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              placeholder="••••••••"
              className={`w-full pl-9 pr-10 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 ${
                errors.password
                  ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-indigo-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('rememberMe')}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Keep me signed in for 30 days</span>
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full py-2.5 font-semibold"
          isLoading={isSubmitting}
          rightIcon={<LogIn className="h-4 w-4" />}
        >
          Sign In
        </Button>
      </form>

      {/* One-Click Demo Access Bar */}
      <div className="pt-4 border-t border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            One-Click Demo Personas
          </p>
          <span className="text-[10px] text-indigo-600 font-medium">Click to test instant roles</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickFill('rohan.sharma@gmail.com', 'student', '/student/dashboard')}
            className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-900 text-left transition-colors cursor-pointer border border-indigo-100"
          >
            <GraduationCap className="h-4 w-4 text-indigo-600 shrink-0" />
            <div className="truncate">
              <span className="font-bold block text-[11px]">Enrolled Student</span>
              <span className="text-[10px] text-indigo-500 truncate block">Rohan Sharma</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('ananya.patel@outlook.com', 'student', '/student/dashboard')}
            className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/70 hover:bg-amber-100/80 text-amber-900 text-left transition-colors cursor-pointer border border-amber-100"
          >
            <GraduationCap className="h-4 w-4 text-amber-600 shrink-0" />
            <div className="truncate">
              <span className="font-bold block text-[11px]">Pending Student</span>
              <span className="text-[10px] text-amber-600 truncate block">Ananya Patel</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('vikram.rao@nexelvoria.edu.in', 'teacher', '/teacher/dashboard')}
            className="flex items-center gap-2 p-2 rounded-lg bg-teal-50/70 hover:bg-teal-100/80 text-teal-900 text-left transition-colors cursor-pointer border border-teal-100"
          >
            <BookOpen className="h-4 w-4 text-teal-600 shrink-0" />
            <div className="truncate">
              <span className="font-bold block text-[11px]">Teaching Faculty</span>
              <span className="text-[10px] text-teal-600 truncate block">Dr. Vikram Rao</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('priya.nair@nexelvoria.edu.in', 'admin', '/admin/dashboard')}
            className="flex items-center gap-2 p-2 rounded-lg bg-sky-50/70 hover:bg-sky-100/80 text-sky-900 text-left transition-colors cursor-pointer border border-sky-100"
          >
            <UserCheck className="h-4 w-4 text-sky-600 shrink-0" />
            <div className="truncate">
              <span className="font-bold block text-[11px]">Institute Admin</span>
              <span className="text-[10px] text-sky-600 truncate block">Priya Nair</span>
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleQuickFill('founder@nexelvoria.edu.in', 'super_admin', '/super-admin/dashboard')}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-rose-50/60 hover:bg-rose-100/70 text-rose-900 text-xs transition-colors cursor-pointer border border-rose-100"
        >
          <div className="flex items-center gap-2 truncate">
            <Shield className="h-4 w-4 text-rose-600 shrink-0" />
            <span className="font-bold text-[11px]">Super Administrator</span>
            <span className="text-[10px] text-rose-500 font-mono">founder@nexelvoria.edu.in</span>
          </div>
          <span className="text-[10px] bg-rose-200/60 text-rose-800 font-semibold px-2 py-0.5 rounded">Highest Auth</span>
        </button>
      </div>

      <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
        New candidate?{' '}
        <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
          Create student account
        </Link>
      </div>
    </div>
  );
};
