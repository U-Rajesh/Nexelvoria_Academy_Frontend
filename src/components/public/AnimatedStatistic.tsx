import React from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useCountUp } from '../../hooks/useCountUp';

interface AnimatedStatisticProps {
  value: string; // e.g. "5,000+", "94.8%", "₹ 8.5 LPA", "₹ 32.5 LPA"
  label: string;
  delay?: number; // Milliseconds
  duration?: number;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
}

export const AnimatedStatistic: React.FC<AnimatedStatisticProps> = ({
  value,
  label,
  delay = 0,
  duration = 2000,
  className = 'space-y-1',
  valueClassName = 'text-3xl sm:text-4xl font-extrabold text-slate-900',
  labelClassName = 'text-xs uppercase tracking-wider font-semibold text-slate-500',
}) => {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.25 });
  const { displayValue, isComplete } = useCountUp(value, {
    duration,
    delay,
    startTrigger: isVisible,
  });

  return (
    <div
      ref={ref}
      className={`${className} transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <p className={`${valueClassName} tabular-nums tracking-tight transition-transform duration-300 ${isComplete ? 'scale-100' : ''}`}>
        {displayValue}
      </p>
      <p className={labelClassName}>{label}</p>
    </div>
  );
};

