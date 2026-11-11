import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const ForgotPasswordPage: React.FC = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200/90 shadow-xl space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reset Password</h2>
        <p className="text-xs text-slate-500">
          Enter your registered email address or mobile number to receive password recovery instructions.
        </p>
      </div>

      {isSubmitted ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-xs text-emerald-800">
          <div className="flex items-center gap-2 text-emerald-700 font-bold">
            <CheckCircle2 className="h-5 w-5" />
            <span>Recovery Link Dispatched</span>
          </div>
          <p>
            If an account exists with <strong>{emailOrPhone}</strong>, you will receive a secure OTP to reset your password.
          </p>
          <Link to="/login" className="block pt-2">
            <Button variant="outline" size="sm" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registered Email or Mobile Number
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="rohan@example.com or 9876543210"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full py-2.5" rightIcon={<Send className="h-4 w-4" />}>
            Send Reset Instructions
          </Button>

          <div className="pt-2 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

