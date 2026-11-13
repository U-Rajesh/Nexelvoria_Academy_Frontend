import { useState, useEffect, useRef } from 'react';

export interface ParsedStat {
  prefix: string;
  targetNumber: number;
  decimals: number;
  suffix: string;
  hasComma: boolean;
}

/**
 * Parses raw statistical strings like "5,000+", "94.8%", "₹ 8.5 LPA", "₹ 32.5 LPA", "120+"
 */
export const parseStatisticString = (raw: string): ParsedStat => {
  const trimmed = raw.trim();

  // Match optional prefix, numeric part (with optional commas and decimal), and suffix
  const match = trimmed.match(/^([^0-9.]*)([0-9,.]+)(.*)$/);
  if (!match) {
    return {
      prefix: '',
      targetNumber: 0,
      decimals: 0,
      suffix: trimmed,
      hasComma: false,
    };
  }

  const prefix = match[1] || '';
  const numStr = match[2] || '0';
  const suffix = match[3] || '';

  const hasComma = numStr.includes(',');
  const cleanNumStr = numStr.replace(/,/g, '');
  const parsedNumber = parseFloat(cleanNumStr) || 0;

  const decimalPart = cleanNumStr.split('.')[1];
  const decimals = decimalPart ? decimalPart.length : 0;

  return {
    prefix,
    targetNumber: parsedNumber,
    decimals,
    suffix,
    hasComma,
  };
};

export const formatCountNumber = (val: number, decimals: number, hasComma: boolean): string => {
  const fixed = val.toFixed(decimals);
  if (!hasComma) return fixed;

  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

interface UseCountUpOptions {
  duration?: number;
  delay?: number;
  startTrigger?: boolean;
}

export const useCountUp = (rawStatString: string, { duration = 2000, delay = 0, startTrigger = false }: UseCountUpOptions = {}) => {
  const parsed = useRef<ParsedStat>(parseStatisticString(rawStatString));
  const [displayValue, setDisplayValue] = useState<string>(() => {
    // Initial display before animation starts: "0" with prefix/suffix
    const { prefix, decimals, suffix } = parsed.current;
    return `${prefix}${decimals > 0 ? (0).toFixed(decimals) : '0'}${suffix}`;
  });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Keep parsed in sync if input string changes
    parsed.current = parseStatisticString(rawStatString);
  }, [rawStatString]);

  useEffect(() => {
    if (!startTrigger) return;

    // Support prefers-reduced-motion: finish immediately
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(rawStatString);
      setIsComplete(true);
      return;
    }

    const { prefix, targetNumber, decimals, suffix, hasComma } = parsed.current;
    let animationFrameId: number;
    let startTime: number | null = null;
    let timeoutId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth cubic ease-out deceleration curve: 1 - (1 - t)^3
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentNumber = easeProgress * targetNumber;

      if (progress < 1) {
        setDisplayValue(`${prefix}${formatCountNumber(currentNumber, decimals, hasComma)}${suffix}`);
        animationFrameId = requestAnimationFrame(animate);
      } else {
        // Complete precisely at target value
        setDisplayValue(`${prefix}${formatCountNumber(targetNumber, decimals, hasComma)}${suffix}`);
        setIsComplete(true);
      }
    };

    timeoutId = window.setTimeout(() => {
      animationFrameId = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [startTrigger, duration, delay, rawStatString]);

  return { displayValue, isComplete };
};

