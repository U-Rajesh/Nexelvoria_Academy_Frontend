import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Clock, ShieldAlert, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import type { AccountState } from '../../types';

interface AccountStatusBannerProps {
  status?: AccountState;
  state?: AccountState;
  studentId?: string;
  remarks?: string;
  lockedUntil?: string;
  onActionClick?: () => void;
  className?: string;
}

export const AccountStatusBanner: React.FC<AccountStatusBannerProps> = ({
  status,
  state,
  studentId,
  remarks,
  onActionClick,
  className = '',
}) => {
  const currentStatus = status || state;
  if (!currentStatus || currentStatus === 'approved') return null;

  switch (currentStatus) {
    case 'pending_verification':
      return (
        <div className={`p-4 bg-amber-50 border border-amber-200/90 rounded-xl flex items-start gap-3 text-amber-900 text-xs ${className}`}>
          <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h4 className="font-bold">Dual OTP Verification Incomplete</h4>
            <p className="text-amber-800 leading-relaxed">
              Your registered email address and mobile number have not yet completed dual OTP verification (SRS Rule BR-001).
            </p>
            <div className="pt-1">
              {onActionClick ? (
                <button
                  type="button"
                  onClick={onActionClick}
                  className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
                >
                  Complete OTP Verification Now <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <Link
                  to={`/verify-otp${studentId ? `?studentId=${studentId}` : ''}`}
                  className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:text-indigo-900 underline"
                >
                  Complete OTP Verification Now <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      );

    case 'pending_approval':
      return (
        <div className={`p-4 bg-sky-50 border border-sky-200/90 rounded-xl flex items-start gap-3 text-sky-900 text-xs ${className}`}>
          <AlertCircle className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h4 className="font-bold">Application Status: Pending Admissions Review (BR-002)</h4>
            <p className="text-sky-800 leading-relaxed">
              Your dual OTP has been verified. Academic administration is reviewing your eligibility credentials and graduation year.
              Once approved, full course selection and tuition fee payment will be unlocked.
            </p>
            {remarks && (
              <p className="text-slate-600 italic mt-1 bg-white/70 p-2 rounded border border-sky-100">
                Admissions Note: {remarks}
              </p>
            )}
          </div>
        </div>
      );

    case 'rejected':
      return (
        <div className={`p-4 bg-rose-50 border border-rose-200/90 rounded-xl flex items-start gap-3 text-rose-900 text-xs ${className}`}>
          <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h4 className="font-bold">Registration Application Not Approved</h4>
            <p className="text-rose-800 leading-relaxed">
              Your student enrollment application has been declined by the admissions office.
            </p>
            {remarks && (
              <p className="text-rose-700 bg-white/70 p-2.5 rounded border border-rose-200 mt-1">
                <strong>Reason for rejection:</strong> {remarks}
              </p>
            )}
            <div className="pt-1">
              <Link to="/contact-us" className="font-bold text-rose-700 hover:text-rose-900 underline">
                Contact Admissions Support for Reconsideration →
              </Link>
            </div>
          </div>
        </div>
      );

    case 'suspended':
      return (
        <div className={`p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900 text-xs ${className}`}>
          <Lock className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h4 className="font-bold">Account Access Suspended</h4>
            <p className="text-rose-800 leading-relaxed">
              Your student portal privileges have been temporarily suspended by Institute Administration.
              Live classes, LMS video lessons, and mock test access are inactive.
            </p>
            <div className="pt-1">
              <Link to="/contact-us" className="font-bold text-rose-700 underline">
                Inquire with Academic Welfare Cell →
              </Link>
            </div>
          </div>
        </div>
      );

    case 'locked':
      return (
        <div className={`p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-amber-950 text-xs ${className}`}>
          <Lock className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h4 className="font-bold">Account Temporarily Locked for Security</h4>
            <p className="text-amber-800 leading-relaxed">
              Too many consecutive failed login attempts were recorded (5 failed attempts limit). For your protection, sign-in is restricted.
              You may reset your password using the verified reset wizard to unlock immediately.
            </p>
            <div className="pt-1">
              <Link to="/forgot-password" className="font-bold text-indigo-700 hover:text-indigo-900 underline">
                Unlock Account via Password Reset →
              </Link>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};
