import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label = 'Loading...',
  className,
}) => {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-7 w-7',
    lg: 'h-10 w-10',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 gap-3', className)}>
      <Loader2 className={cn('animate-spin text-indigo-600', sizeMap[size])} />
      {label && <p className="text-xs font-medium text-slate-500 animate-pulse">{label}</p>}
    </div>
  );
};

