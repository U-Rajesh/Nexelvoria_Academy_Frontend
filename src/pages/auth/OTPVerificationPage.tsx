import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  RotateCw,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';

export const OTPVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('studentId') || 'user-stu-002';
  const emailParam = searchParams.get('email') || 'ananya.patel@outlook.com';
  const mobileParam = searchParams.get('mobile') || '9812345678';

  const { verifyEmailOtp, verifyMobileOtp, verifyDualOtp, resendEmailOtp, resendMobileOtp, user } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  // Channel verification states
  const [emailOtp, setEmailOtp] = useState('123456');
  const [mobileOtp, setMobileOtp] = useState('123456');
  const [isEmailVerified, setIsEmailVerified] = useState((user as any)?.isEmailVerified ?? false);
  const [isMobileVerified, setIsMobileVerified] = useState((user as any)?.isMobileVerified ?? false);

  // Submitting states
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isVerifyingMobile, setIsVerifyingMobile] = useState(false);
  const [isVerifyingAll, setIsVerifyingAll] = useState(false);

  // Countdown timers (in seconds)
  const [emailCountdown, setEmailCountdown] = useState(60);
  const [mobileCountdown, setMobileCountdown] = useState(60);

  // Error messages
  const [emailError, setEmailError] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Success state
  const [allVerified, setAllVerified] = useState(false);

  // Countdown effect for email
  useEffect(() => {
    if (emailCountdown <= 0) return;
    const timer = setInterval(() => {
      setEmailCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [emailCountdown]);

  // Countdown effect for mobile
  useEffect(() => {
    if (mobileCountdown <= 0) return;
    const timer = setInterval(() => {
      setMobileCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [mobileCountdown]);

  // Check if both channels are verified
  useEffect(() => {
    if (isEmailVerified && isMobileVerified) {
      setAllVerified(true);
      showToast({
        type: 'success',
        title: 'Account Verification Complete',
        message: 'Both Email and Mobile verified! Your profile is now pending Admin approval (BR-002).',
      });
      const timeout = setTimeout(() => {
        navigate('/student/dashboard');
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isEmailVerified, isMobileVerified, navigate, showToast]);

  // Handle single Email OTP submission
  const handleVerifyEmail = async () => {
    setEmailError(null);
    setGeneralError(null);

    if (emailOtp.length !== 6) {
      setEmailError('Please enter a valid 6-digit OTP code.');
      return;
    }

    setIsVerifyingEmail(true);
    const res = await verifyEmailOtp(studentId, emailOtp);
    setIsVerifyingEmail(false);

    if (res.success) {
      setIsEmailVerified(true);
      showToast({
        type: 'success',
        title: 'Email Verified',
        message: 'Your email address has been verified successfully.',
      });
    } else {
      setEmailError(res.error || 'Invalid email OTP code. (Demo code: 123456)');
    }
  };

  // Handle single Mobile OTP submission
  const handleVerifyMobile = async () => {
    setMobileError(null);
    setGeneralError(null);

    if (mobileOtp.length !== 6) {
      setMobileError('Please enter a valid 6-digit OTP code.');
      return;
    }

    setIsVerifyingMobile(true);
    const res = await verifyMobileOtp(studentId, mobileOtp);
    setIsVerifyingMobile(false);

    if (res.success) {
      setIsMobileVerified(true);
      showToast({
        type: 'success',
        title: 'Mobile Verified',
        message: 'Your mobile number has been verified successfully.',
      });
    } else {
      setMobileError(res.error || 'Invalid mobile OTP code. (Demo code: 123456)');
    }
  };

  // Handle Resend Email OTP
  const handleResendEmail = async () => {
    if (emailCountdown > 0) return;
    setEmailError(null);
    const res = await resendEmailOtp(studentId);
    if (res.success) {
      setEmailCountdown(60);
      showToast({
        type: 'info',
        title: 'Email OTP Dispatched',
        message: 'A fresh 6-digit code has been sent to your email. (Demo: 123456)',
      });
    } else {
      setEmailError(res.error || 'Failed to resend email code.');
    }
  };

  // Handle Resend Mobile OTP
  const handleResendMobile = async () => {
    if (mobileCountdown > 0) return;
    setMobileError(null);
    const res = await resendMobileOtp(studentId);
    if (res.success) {
      setMobileCountdown(60);
      showToast({
        type: 'info',
        title: 'Mobile OTP Dispatched',
        message: 'A fresh 6-digit SMS OTP has been sent to your phone. (Demo: 123456)',
      });
    } else {
      setMobileError(res.error || 'Failed to resend mobile SMS.');
    }
  };

  // Handle Dual Simultaneous Verification
  const handleVerifyBoth = async () => {
    setGeneralError(null);
    setEmailError(null);
    setMobileError(null);

    if (emailOtp.length !== 6 || mobileOtp.length !== 6) {
      setGeneralError('Both OTP fields require a valid 6-digit code.');
      return;
    }

    setIsVerifyingAll(true);
    const res = await verifyDualOtp(studentId, { emailOtp, mobileOtp });
    setIsVerifyingAll(false);

    if (res.success) {
      setIsEmailVerified(true);
      setIsMobileVerified(true);
      setAllVerified(true);
      showToast({
        type: 'success',
        title: 'Dual OTP Verified Successfully',
        message: 'Account verified. Now awaiting Admin approval (BR-002) before payment can proceed.',
      });
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 1500);
    } else {
      setGeneralError(res.error || 'Verification failed. Please verify codes and retry.');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Top Breadcrumb / Return */}
      <div className="flex items-center justify-between">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Sign In</span>
        </Link>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
          Rule: BR-001 Dual OTP
        </span>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Verify Email & Mobile OTP
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Per <strong>Business Rule BR-001</strong>, both channels must be independently verified to establish account security and prevent fraudulent registrations.
          </p>
        </div>

        {/* Global Error Notice */}
        {generalError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Success Banner when both are verified */}
        {allVerified && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-fade-in">
            <div className="h-9 w-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-emerald-900">Dual Verification Completed!</p>
              <p className="text-emerald-700 mt-0.5">
                Status transitioned to <strong>Pending Admin Approval (BR-002)</strong>. Redirecting you to the student portal...
              </p>
            </div>
          </div>
        )}

        {/* 2-Card Layout for Separate Verification Channels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Email OTP */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isEmailVerified
                ? 'bg-emerald-50/50 border-emerald-200 shadow-sm'
                : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isEmailVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">Email Verification</h2>
                  <p className="text-[11px] text-slate-500 truncate max-w-[150px]" title={emailParam}>
                    {emailParam}
                  </p>
                </div>
              </div>

              {isEmailVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  <Clock className="h-3 w-3" />
                  Pending
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  6-Digit Email Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  disabled={isEmailVerified}
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className={`w-full text-center font-mono tracking-widest text-base font-bold py-2 border rounded-lg focus:outline-none transition-all ${
                    isEmailVerified
                      ? 'bg-emerald-100/40 text-emerald-800 border-emerald-200 cursor-not-allowed'
                      : 'bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-900'
                  }`}
                />
                {emailError && (
                  <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{emailError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant={isEmailVerified ? 'outline' : 'primary'}
                  size="sm"
                  disabled={isEmailVerified || emailOtp.length !== 6}
                  isLoading={isVerifyingEmail}
                  onClick={handleVerifyEmail}
                  className="flex-1 py-1.5 text-xs font-semibold"
                >
                  {isEmailVerified ? 'Email Verified' : 'Verify Email'}
                </Button>

                {!isEmailVerified && (
                  <button
                    type="button"
                    disabled={emailCountdown > 0}
                    onClick={handleResendEmail}
                    className="px-2.5 py-1.5 text-[11px] font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <RotateCw className={`h-3 w-3 ${emailCountdown > 0 ? '' : 'text-indigo-600'}`} />
                    {emailCountdown > 0 ? `${emailCountdown}s` : 'Resend'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Mobile SMS OTP */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isMobileVerified
                ? 'bg-emerald-50/50 border-emerald-200 shadow-sm'
                : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isMobileVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">Mobile SMS Verification</h2>
                  <p className="text-[11px] text-slate-500">
                    +91 {mobileParam}
                  </p>
                </div>
              </div>

              {isMobileVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  <Clock className="h-3 w-3" />
                  Pending
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  6-Digit SMS Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  disabled={isMobileVerified}
                  value={mobileOtp}
                  onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className={`w-full text-center font-mono tracking-widest text-base font-bold py-2 border rounded-lg focus:outline-none transition-all ${
                    isMobileVerified
                      ? 'bg-emerald-100/40 text-emerald-800 border-emerald-200 cursor-not-allowed'
                      : 'bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-900'
                  }`}
                />
                {mobileError && (
                  <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{mobileError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant={isMobileVerified ? 'outline' : 'primary'}
                  size="sm"
                  disabled={isMobileVerified || mobileOtp.length !== 6}
                  isLoading={isVerifyingMobile}
                  onClick={handleVerifyMobile}
                  className="flex-1 py-1.5 text-xs font-semibold"
                >
                  {isMobileVerified ? 'Mobile Verified' : 'Verify Mobile'}
                </Button>

                {!isMobileVerified && (
                  <button
                    type="button"
                    disabled={mobileCountdown > 0}
                    onClick={handleResendMobile}
                    className="px-2.5 py-1.5 text-[11px] font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <RotateCw className={`h-3 w-3 ${mobileCountdown > 0 ? '' : 'text-indigo-600'}`} />
                    {mobileCountdown > 0 ? `${mobileCountdown}s` : 'Resend'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Global Combined Verification Action */}
        {(!isEmailVerified || !isMobileVerified) && (
          <div className="pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleVerifyBoth}
              isLoading={isVerifyingAll}
              className="w-full py-2.5 flex items-center justify-center gap-2 shadow-sm font-semibold"
            >
              <span>Verify Both Channels Simultaneously</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Demo Helper Banner */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 space-y-0.5">
          <p>
            💡 <strong className="text-slate-700">Demo Testing Mode:</strong> Both Email & SMS verification codes are pre-configured to{' '}
            <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">123456</span>.
          </p>
          <p className="text-[11px] text-slate-400">
            Upon completion, student moves to status: <span className="font-mono text-slate-600">pending_approval</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
