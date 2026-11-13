import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RotateCw,
  Lock,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { PasswordStrengthIndicator } from '../../components/auth/PasswordStrengthIndicator';

type WizardStep = 1 | 2 | 3 | 4;

export const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<WizardStep>(1);
  const { showToast } = useNotification();
  const navigate = useNavigate();

  // Step 1: Identifier
  const [identifier, setIdentifier] = useState('rohan.sharma@gmail.com');
  const [maskedTarget, setMaskedTarget] = useState('');
  const [isSubmittingIdentifier, setIsSubmittingIdentifier] = useState(false);
  const [identifierError, setIdentifierError] = useState<string | null>(null);

  // Step 2: OTP
  const [otp, setOtp] = useState('123456');
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  // Step 3: New Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Timer effect for OTP step
  useEffect(() => {
    if (step !== 2 || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, countdown]);

  // Step 1 Submit: Request Reset Code
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdentifierError(null);

    const trimmed = identifier.trim();
    if (!trimmed) {
      setIdentifierError('Please enter your registered email address or mobile number.');
      return;
    }

    setIsSubmittingIdentifier(true);
    const res = await authService.requestPasswordReset(trimmed);
    setIsSubmittingIdentifier(false);

    if (res.success && res.data) {
      setMaskedTarget(res.data.maskedTarget);
      setStep(2);
      setCountdown(60);
      showToast({
        type: 'info',
        title: 'Recovery Code Dispatched',
        message: 'A 6-digit password reset code has been sent. (Demo code: 123456)',
      });
    } else {
      setIdentifierError(res.error || 'Account not found. Please verify identifier.');
    }
  };

  // Step 2 Submit: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    if (otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit verification code.');
      return;
    }

    setIsSubmittingOtp(true);
    const res = await authService.verifyResetOtp(identifier, otp);
    setIsSubmittingOtp(false);

    if (res.success) {
      setStep(3);
      showToast({
        type: 'success',
        title: 'Identity Verified',
        message: 'You can now set a new secure password.',
      });
    } else {
      setOtpError(res.error || 'Invalid recovery code. (Demo code: 123456)');
    }
  };

  // Handle Resend OTP in Step 2
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setOtpError(null);
    const res = await authService.requestPasswordReset(identifier);
    if (res.success) {
      setCountdown(60);
      showToast({
        type: 'info',
        title: 'Code Re-sent',
        message: 'A fresh recovery code was sent. (Demo: 123456)',
      });
    } else {
      setOtpError(res.error || 'Failed to resend code.');
    }
  };

  // Step 3 Submit: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError('Password must contain at least one uppercase letter (A-Z).');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setPasswordError('Password must contain at least one number (0-9).');
      return;
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
      setPasswordError('Password must contain at least one special character.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setIsSubmittingPassword(true);
    const res = await authService.resetPassword(identifier, newPassword);
    setIsSubmittingPassword(false);

    if (res.success) {
      setStep(4);
      showToast({
        type: 'success',
        title: 'Password Successfully Changed',
        message: 'Your account password has been updated and unlocked.',
      });
    } else {
      setPasswordError(res.error || 'Failed to reset password. Please retry.');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xl space-y-6">
      {/* Header and Step Indicator */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sign In</span>
          </Link>
          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
            Step {step} of 4
          </span>
        </div>

        <div className="text-center space-y-1">
          <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
            {step === 4 ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            ) : (
              <KeyRound className="h-5 w-5" />
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {step === 1 && 'Reset Account Password'}
            {step === 2 && 'Enter Recovery Code'}
            {step === 3 && 'Create New Password'}
            {step === 4 && 'Password Reset Complete'}
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {step === 1 && 'Enter your registered email or phone to receive a 6-digit recovery OTP.'}
            {step === 2 && `Enter the 6-digit verification code sent to ${maskedTarget || identifier}.`}
            {step === 3 && 'Choose a strong password with at least 8 characters, numbers, and symbols.'}
            {step === 4 && 'Your password has been successfully updated. You can now log into your portal.'}
          </p>
        </div>

        {/* Wizard Progress Bar */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s <= step ? 'bg-indigo-600' : 'bg-slate-100'
              }`}
            />
          ))}
        </div>
      </div>

      {/* STEP 1: IDENTIFIER INPUT */}
      {step === 1 && (
        <form onSubmit={handleRequestReset} className="space-y-4">
          {identifierError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{identifierError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registered Email or Mobile Number
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. rohan.sharma@gmail.com or 9876543210"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Test accounts: <span className="font-mono text-slate-600">rohan.sharma@gmail.com</span> or{' '}
              <span className="font-mono text-slate-600">ananya.patel@outlook.com</span>
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full py-2.5 font-semibold"
            isLoading={isSubmittingIdentifier}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Send Recovery Code
          </Button>
        </form>
      )}

      {/* STEP 2: OTP VERIFICATION */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          {otpError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{otpError}</span>
            </div>
          )}

          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-center justify-between">
            <div>
              <span className="block font-semibold">Verification Code Sent</span>
              <span className="text-[11px] text-indigo-700">{maskedTarget || identifier}</span>
            </div>
            <span className="font-mono text-xs bg-indigo-200/60 text-indigo-900 px-2 py-0.5 rounded font-bold">
              Demo: 123456
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              6-Digit Recovery Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full text-center font-mono tracking-widest text-lg font-bold py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Didn't receive the code?</span>
            <button
              type="button"
              disabled={countdown > 0}
              onClick={handleResendOtp}
              className="font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <RotateCw className="h-3 w-3" />
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setStep(1)}
              className="w-1/3 py-2 text-xs"
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-2/3 py-2 font-semibold text-xs"
              isLoading={isSubmittingOtp}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Verify Code
            </Button>
          </div>
        </form>
      )}

      {/* STEP 3: NEW PASSWORD */}
      {step === 3 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          {passwordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full pl-9 pr-10 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordStrengthIndicator password={newPassword} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-9 pr-10 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full py-2.5 font-semibold text-xs"
            isLoading={isSubmittingPassword}
            rightIcon={<ShieldCheck className="h-4 w-4" />}
          >
            Update & Unlock Account
          </Button>
        </form>
      )}

      {/* STEP 4: SUCCESS CONFIRMATION */}
      {step === 4 && (
        <div className="space-y-4 text-center">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-900">
            <p className="font-bold text-sm">Account Successfully Recovered!</p>
            <p className="text-emerald-700 leading-relaxed">
              Your password has been securely reset, and any previous account lockout has been lifted. You can now log into your student dashboard.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full py-2.5 font-semibold"
            onClick={() => navigate('/login')}
          >
            Proceed to Sign In
          </Button>
        </div>
      )}
    </div>
  );
};
