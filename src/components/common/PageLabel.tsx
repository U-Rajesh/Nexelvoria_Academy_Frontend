import React, { useMemo } from 'react';
import { cn } from '../../utils/cn';

export interface PageLabelProps {
  children?: React.ReactNode;
  text?: string;
  theme?: 'light' | 'dark';
  className?: string;
  dot?: boolean;
  centered?: boolean;
  letterDelayMs?: number;
}

/**
 * PageLabel
 *
 * A clean, minimal, professionally designed section label that replaces generic AI pill badges.
 * Displays centered above main headings and animates smoothly letter-by-letter from left to right.
 */
export const PageLabel: React.FC<PageLabelProps> = ({
  children,
  text,
  theme = 'light',
  className,
  dot = true,
  centered = true,
  letterDelayMs = 28,
}) => {
  const labelText = typeof text === 'string' ? text : typeof children === 'string' ? children : '';
  const letters = useMemo(() => labelText.split(''), [labelText]);

  const textColor = theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600';
  const dotColor = theme === 'dark' ? 'bg-indigo-400' : 'bg-indigo-600';

  return (
    <div
      aria-label={labelText || undefined}
      className={cn(
        'inline-flex items-center gap-2 select-none tracking-widest uppercase font-semibold text-xs sm:text-[13px]',
        centered ? 'justify-center mx-auto' : '',
        textColor,
        className
      )}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0 shadow-xs', dotColor)}
          aria-hidden="true"
        />
      )}

      {labelText ? (
        <span className="inline-flex flex-wrap items-center justify-center">
          {letters.map((char, index) => (
            <span
              key={`${char}-${index}`}
              className="inline-block opacity-0 animate-letter-fade-up whitespace-pre"
              style={{
                animationDelay: `${index * letterDelayMs}ms`,
              }}
              aria-hidden="true"
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </span>
      ) : (
        children
      )}
    </div>
  );
};

