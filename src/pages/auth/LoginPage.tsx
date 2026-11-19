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
  ShieldCheck,
} from 'lucide-react';
import { loginSchema, type LoginFormData } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { AccountStatusBanner } from '../../components/auth/AccountStatusBanner';
import { storeVerificationTicket } from '../../utils/verificationTicket';
import type { AccountState } from '../../types';

/**
 * Heading, badge and default destination per portal.
 *
 * The empty key is the default (a student or a direct visit to `/login`).
 * An unrecognised `?portal=` value falls back to it, so a hand-edited URL
 * cannot produce a broken page - and could not grant anything even if it
 * did, because this table is presentation only.
 */
const PORTAL_COPY: Record<
  string,
  { badge?: string; heading: string; subtitle: string; home: string }
> = {
  '': {
    heading: 'Sign In to Nexelvoria',
    subtitle:
      'Enter your registered email address or 10-digit mobile number to access your portal.',
    home: '/student/dashboard',
  },
  teacher: {
    badge: 'Teacher Portal',
    heading: 'Faculty Sign In',
    subtitle:
      'For Nexelvoria trainers and mentors. Use the email address the academy issued you.',
    home: '/teacher/dashboard',
  },
  admin: {
    badge: 'Admin Portal',
    heading: 'Institute Administration',
    subtitle:
      'For admissions and operations staff. Access is granted by role and recorded.',
    home: '/admin/dashboard',
  },
  'super-admin': {
    badge: 'Super Admin Portal',
    heading: 'System Administration',
    subtitle:
      'Restricted to system administrators. Elevated actions are audited.',
    home: '/super-admin/dashboard',
  },
};

/**
 * Seeded development identifiers, for the quick-fill buttons.
 *
 * EMAIL ADDRESSES ONLY, and deliberately no passwords: those are generated
 * per run by `dev/container.dev.ts` and printed to the backend terminal.
 * Nothing secret belongs in frontend source, which ships to every visitor.
 *
 * Kept in step with `DEV_ACCOUNTS` in the backend's `dev/container.dev.ts`.
 */
const DEV_ACCOUNT_HINTS: { label: string; email: string }[] = [
  { label: 'Admin', email: 'dev.admin@nexelvoria.local' },
  { label: 'Teacher', email: 'dev.teacher@nexelvoria.local' },
  { label: 'Super Admin', email: 'dev.superadmin@nexelvoria.local' },
];

/** Whether the localStorage auth mock is active. */
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

export const LoginPage: React.FC = () => {
  const { login, switchRole } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('redirect');

  /**
   * Which portal the visitor arrived from, e.g. `/login?portal=admin`.
   *
   * =========================================================================
   * PRESENTATION ONLY. THIS GRANTS NOTHING.
   *
   * It changes the heading and the default landing path, and that is all.
   * The role that actually matters comes from the signed JWT the backend
   * issues, and every protected route and every API call is authorised from
   * that. Arriving via `?portal=super-admin` and signing in as a teacher
   * lands you in the teacher portal and gets you a 403 from any admin
   * endpoint - the hint is simply ignored.
   *
   * There is ONE login page, ONE auth service and ONE endpoint behind all
   * three portals. Nothing about authentication is duplicated per role.
   * =========================================================================
   */
  const portal = searchParams.get('portal');

  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  /**
   * The refused-account state, when the backend reported one.
   *
   * `state` is absent for `ACCOUNT_PENDING` - the backend could not
   * establish whether the student needs to verify an email or wait for an
   * admin, so no banner is claimed and the server's own message is shown.
   */
  const [accountStatus, setAccountStatus] = useState<{
    state?: AccountState;
    /** Only with ACCOUNT_PENDING_VERIFICATION. Never a student id. */
    verificationTicket?: string;
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

  const portalCopy = PORTAL_COPY[portal ?? ''] ?? PORTAL_COPY[''];

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
        /**
         * Navigate by the ROLE THE SERVER RETURNED, never by `?portal=`.
         *
         * The portal hint only supplies a fallback if the stored role is
         * somehow unreadable. A teacher who arrives via the Super Admin link
         * therefore lands in the teacher portal, and `ProtectedRoute` would
         * bounce them out of `/super-admin` anyway.
         */
        const currentUser = JSON.parse(localStorage.getItem('nexelvoria_current_user') || '{}');
        if (currentUser.role === 'student') navigate('/student/dashboard');
        else if (currentUser.role === 'teacher') navigate('/teacher/dashboard');
        else if (currentUser.role === 'admin') navigate('/admin/dashboard');
        else if (currentUser.role === 'super_admin') navigate('/super-admin/dashboard');
        else navigate(portalCopy.home);
      }
    } else {
      // Branch on the CODE, not on prose. `accountState` is derived from it
      // for the banner, and is undefined for the indeterminate
      // ACCOUNT_PENDING - in which case only the message below is shown.
      if (result.code) {
        setAccountStatus({
          state: result.accountState,
          verificationTicket: result.verificationTicket,
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
        {portalCopy.badge && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-1.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold border border-indigo-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{portalCopy.badge}</span>
          </div>
        )}
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{portalCopy.heading}</h1>
        <p className="text-xs text-slate-500">{portalCopy.subtitle}</p>
      </div>

      {/* Account Status Alert Banner */}
      {accountStatus?.state && (
        <div className="space-y-2">
          <AccountStatusBanner
            state={accountStatus.state}
            onActionClick={
              accountStatus.state === 'pending_verification' && accountStatus.verificationTicket
                ? () => {
                    // The ticket goes to sessionStorage, NOT the URL. A
                    // student id used to travel in this query string, where
                    // it landed in browser history and referrer headers.
                    storeVerificationTicket(accountStatus.verificationTicket as string);
                    navigate(
                      `/verify-otp?email=${encodeURIComponent(currentIdentifier || '')}`
                    );
                  }
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

      {/*
        One-click personas, MOCK MODE ONLY.

        They work by calling `switchRole`, which writes a fake
        `jwt_mock_<id>` token - so they are gated behind VITE_USE_MOCK_AUTH
        for the same reason `switchRole` itself is: against the real API they
        would overwrite a valid access token and every later request would
        401. Their email addresses are mock seed data and do not exist in the
        development backend either, so in real mode they could not sign in
        even if the token were left alone.
      */}
      {USE_MOCK_AUTH && (
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

      )}

      {/*
        Real API mode: fill the IDENTIFIER for a seeded development account.

        Identifiers only. No password is present in this file, in the bundle,
        or in any API response - `npm run dev:integration` prints the
        generated passwords once to its own terminal, and nowhere else.
        `.local` addresses cannot resolve publicly, so these are not
        contactable and are not sensitive.
      */}
      {!USE_MOCK_AUTH && (
        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Development Accounts
            </p>
            <span className="text-[10px] text-slate-400 font-medium">Fills the email only</span>
          </div>

          <div className="space-y-1.5">
            {DEV_ACCOUNT_HINTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setAuthError(null);
                  setAccountStatus(null);
                  setValue('identifier', account.email);
                  setValue('password', '');
                }}
                className="w-full flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs transition-colors cursor-pointer border border-slate-200"
              >
                <span className="flex items-center gap-2 truncate">
                  <UserCheck className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-[11px]">{account.label}</span>
                  <span className="text-[10px] text-slate-500 font-mono truncate">
                    {account.email}
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">Use</span>
              </button>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Passwords are generated per run and printed in the terminal running{' '}
            <span className="font-mono">npm run dev:integration</span>. Set{' '}
            <span className="font-mono">DEV_SEED_&lt;ROLE&gt;_PASSWORD</span> in the backend{' '}
            <span className="font-mono">.env</span> to keep one stable.
          </p>
        </div>
      )}

      <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
        New candidate?{' '}
        <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
          Create student account
        </Link>
      </div>
    </div>
  );
};
