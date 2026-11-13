import { useState, useEffect, useRef } from 'react';

interface UseScrollProgressOptions {
  offsetStart?: number; // Offset from top of viewport to begin progress (0 to 1)
  offsetEnd?: number;   // Offset from top of viewport to end progress (0 to 1)
}

export const useScrollProgress = <T extends HTMLElement = HTMLDivElement>(
  options: UseScrollProgressOptions = {}
) => {
  const { offsetStart = 0, offsetEnd = 1 } = options;
  const elementRef = useRef<T | null>(null);
  const [progress, setProgress] = useState(0);
  const [isInViewport, setIsInViewport] = useState(false);

  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Element top relative to viewport start
      const elementTop = rect.top;
      const elementHeight = rect.height;

      // Check if element is active in viewport
      const visible = rect.bottom > 0 && rect.top < windowHeight;
      setIsInViewport(visible);

      if (!visible) {
        if (rect.top >= windowHeight) setProgress(0);
        else if (rect.bottom <= 0) setProgress(1);
        return;
      }

      // Calculate progress between offsetStart and offsetEnd
      const totalScrollableDistance = elementHeight - windowHeight;
      if (totalScrollableDistance <= 0) {
        // Shorter than viewport
        const currentPos = windowHeight - elementTop;
        const totalDist = windowHeight + elementHeight;
        const rawProgress = Math.max(0, Math.min(1, currentPos / totalDist));
        setProgress(rawProgress);
        return;
      }

      // Sticky progress: 0 when top touches top of viewport, 1 when bottom touches bottom
      const scrolledPastTop = -elementTop;
      const rawProgress = Math.max(0, Math.min(1, scrolledPastTop / totalScrollableDistance));

      // Remap between offsetStart and offsetEnd if specified
      const remapped = Math.max(
        0,
        Math.min(1, (rawProgress - offsetStart) / (offsetEnd - offsetStart))
      );

      setProgress(remapped);
    };

    const onScroll = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    // Initial calculation
    handleScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [offsetStart, offsetEnd]);

  return { ref: elementRef, progress, isInViewport };
};

