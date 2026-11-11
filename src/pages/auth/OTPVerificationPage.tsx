import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, Mail, Phone, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { dualOtpSchema, type DualOtpFormData } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';

export const OTPVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('studentId') || 'user-stu-002';
  const email = searchParams.get('email') || 'ananya.patel@outlook.com';
  const mobile = searchParams.get('mobile') || '9812345678';

  const { verifyDualOtp } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [otpError, setOtpError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DualOtpFormData>({
    resolver: zodResolver(dualOtpSchema),
    defaultValues: {
      emailOtp: '123456', // Pre-populated for seamless demo testing
      mobileOtp: '123456',
    },
  });

  const onSubmit = async (data: DualOtpFormData) => {
    setOtpError(null);
    const result = await verifyDualOtp(studentId, data);

    if (result.success) {
      showToast({
        type: 'success',
        title: 'Dual OTP Verified Successfully',
        message: 'Account verified. Now awaiting Admin approval (BR-002) before payment can proceed.',
      });
      navigate('/student/dashboard');
    } else {
      setOtpError(result.error || 'Invalid OTP code. Please check and retry.');
    }
  };

  return (
    <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200/90 shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Verify Email & Mobile OTP
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          In compliance with <strong>Business Rule BR-001</strong>, both email and mobile numbers must be verified.
        </p>
      </div>

      <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1.5 text-xs text-indigo-900">
        <p className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
          <span>Email Code sent to: <strong>{email}</strong></span>
        </p>
        <p className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
          <span>SMS Code sent to: <strong>+91 {mobile}</strong></span>
        </p>
      </div>

      {otpError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{otpError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email OTP */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            6-Digit Email OTP
          </label>
          <input
            type="text"
            maxLength={6}
            {...register('emailOtp')}
            className="w-full text-center tracking-widest font-mono text-lg font-bold py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.emailOtp && (
            <p className="text-rose-500 text-[11px] mt-0.5">{errors.emailOtp.message}</p>
          )}
        </div>

        {/* Mobile OTP */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            6-Digit Mobile OTP
          </label>
          <input
            type="text"
            maxLength={6}
            {...register('mobileOtp')}
            className="w-full text-center tracking-widest font-mono text-lg font-bold py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.mobileOtp && (
            <p className="text-rose-500 text-[11px] mt-0.5">{errors.mobileOtp.message}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full py-2.5"
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Verify Both & Access Portal
        </Button>
      </form>

      <div className="pt-2 text-center text-xs text-slate-400">
        Demo Mode Tip: Both OTPs default to <span className="font-mono font-bold text-slate-600">123456</span>
      </div>
    </div>
  );
};

