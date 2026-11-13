import React from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export type ScrollRevealAnimation =
  | 'fade-up'
  | 'fade-in'
  | 'slide-left'
  | 'slide-right'
  | 'scale-in';

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: ScrollRevealAnimation;
  delay?: number; // Milliseconds
  duration?: number; // Milliseconds
  className?: string;
  threshold?: number;
  as?: React.ElementType;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 700,
  className = '',
  threshold = 0.15,
  as: Component = 'div',
}) => {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({ threshold });

  const getAnimationStyles = (): React.CSSProperties => {
    const baseTransition: React.CSSProperties = {
      transitionProperty: 'opacity, transform',
      transitionDuration: `${duration}ms`,
      transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      transitionDelay: `${delay}ms`,
      willChange: isVisible ? 'auto' : 'opacity, transform',
    };

    if (isVisible) {
      return {
        ...baseTransition,
        opacity: 1,
        transform: 'none',
      };
    }

    switch (animation) {
      case 'fade-up':
        return {
          ...baseTransition,
          opacity: 0,
          transform: 'translateY(28px)',
        };
      case 'fade-in':
        return {
          ...baseTransition,
          opacity: 0,
        };
      case 'slide-left':
        return {
          ...baseTransition,
          opacity: 0,
          transform: 'translateX(-32px)',
        };
      case 'slide-right':
        return {
          ...baseTransition,
          opacity: 0,
          transform: 'translateX(32px)',
        };
      case 'scale-in':
        return {
          ...baseTransition,
          opacity: 0,
          transform: 'scale(0.93)',
        };
      default:
        return {
          ...baseTransition,
          opacity: 0,
          transform: 'translateY(24px)',
        };
    }
  };

  return (
    <Component ref={ref} style={getAnimationStyles()} className={className}>
      {children}
    </Component>
  );
};

