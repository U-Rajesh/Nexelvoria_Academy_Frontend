import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  if (!password) return null;

  const checks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'At least one uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'At least one lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: 'At least one number (0-9)', met: /[0-9]/.test(password) },
    { label: 'At least one special character (!@#$%^&*)', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.met).length;

  const getStrengthMeta = () => {
    if (score <= 2) return { text: 'Weak', barClass: 'bg-rose-500', width: 'w-1/4', textColor: 'text-rose-600' };
    if (score === 3 || score === 4) return { text: 'Moderate', barClass: 'bg-amber-500', width: 'w-3/4', textColor: 'text-amber-600' };
    return { text: 'Strong', barClass: 'bg-emerald-500', width: 'w-full', textColor: 'text-emerald-600' };
  };

  const meta = getStrengthMeta();

  return (
    <div className="space-y-2 mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
      <div className="flex items-center justify-between font-semibold">
        <span className="text-slate-600">Password Strength:</span>
        <span className={meta.textColor}>{meta.text}</span>
      </div>

      {/* Strength Bar */}
      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full ${meta.barClass} ${meta.width} transition-all duration-300 rounded-full`} />
      </div>

      {/* Criteria Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 text-[11px]">
        {checks.map((c, i) => (
          <div key={i} className={`flex items-center gap-1.5 ${c.met ? 'text-emerald-700' : 'text-slate-400'}`}>
            {c.met ? <Check className="h-3 w-3 text-emerald-600 shrink-0" /> : <X className="h-3 w-3 text-slate-300 shrink-0" />}
            <span>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

