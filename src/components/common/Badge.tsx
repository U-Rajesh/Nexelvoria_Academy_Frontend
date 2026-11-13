import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-semibold rounded-full select-none tracking-wide';

  const variants = {
    success: 'bg-emerald-50/90 text-emerald-700 border border-emerald-200/80',
    warning: 'bg-amber-50/90 text-amber-700 border border-amber-200/80',
    danger: 'bg-rose-50/90 text-rose-700 border border-rose-200/80',
    info: 'bg-sky-50/90 text-sky-700 border border-sky-200/80',
    purple: 'bg-indigo-50/90 text-indigo-700 border border-indigo-200/80',
    neutral: 'bg-slate-100/90 text-slate-700 border border-slate-200/80',
  };

  const dots = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    purple: 'bg-purple-500',
    neutral: 'bg-slate-400',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dots[variant])} />}
      {children}
    </span>
  );
};

