import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  Award,
  ArrowRight,
  ExternalLink,
  Compass,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  MoveHorizontal,
} from 'lucide-react';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { PageLabel } from '../common/PageLabel';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/feedback/Modal';
import { Linkedin } from '../../components/common/SocialIcons';
import type { TrainerProfile } from '../../services/cmsService';

interface TrainerOrbitSectionProps {
  trainers: TrainerProfile[];
  title?: string;
  subtitle?: string;
  badgeText?: string;
  showExploreButton?: boolean;
}

export const TrainerOrbitSection: React.FC<TrainerOrbitSectionProps> = ({
  trainers,
  title = 'Learn from Senior Engineers & Practicing Architects',
  subtitle = 'Industry technology leaders with enterprise track records at Microsoft, Oracle, AWS, and tier-1 tech consulting firms.',
  badgeText = 'Industry Mentors',
  showExploreButton = true,
}) => {
  // Outer scroll container tracks progress through section (0 to 1)
  const { ref: containerRef, progress } = useScrollProgress<HTMLDivElement>();

  // Interactive selected trainer modal
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerProfile | null>(null);

  // Viewport measurement for responsive 3D spacing
  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  // Reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Manual jump / snap index target
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  const isManualRef = useRef(false);

  // Drag & Swipe Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [dragFloatIndex, setDragFloatIndex] = useState<number>(0);

  const isPointerDownRef = useRef(false);
  const isHorizontalDragRef = useRef(false);
  const hasMovedSignificantlyRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const startFloatIndexRef = useRef(0);
  const lastMoveXRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const snapAnimationIdRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Cleanup any snap animation on unmount
  useEffect(() => {
    return () => {
      if (snapAnimationIdRef.current) {
        cancelAnimationFrame(snapAnimationIdRef.current);
      }
    };
  }, []);

  // Strictly preserve the original mentor profiles without any dummy data or duplication
  const orbitalTrainers = useMemo(() => {
    return trainers || [];
  }, [trainers]);

  const N = orbitalTrainers.length || 1;

  // Responsive 3D Cover-Flow layout parameters
  const { s1, s2, cardWidthClass } = useMemo(() => {
    if (windowWidth < 640) {
      // Mobile (< 640px)
      return { s1: 145, s2: 90, cardWidthClass: 'w-[250px]' };
    }
    if (windowWidth < 1024) {
      // Tablet (640px - 1023px)
      return { s1: 215, s2: 140, cardWidthClass: 'w-[280px]' };
    }
    // Desktop (>= 1024px)
    return { s1: 275, s2: 180, cardWidthClass: 'w-[320px]' };
  }, [windowWidth]);

  // Floating active index driven continuously by scroll progress or manual drag/jump:
  // When progress = 0: floatIndex = 0 (first mentor centered)
  // As user scrolls DOWN: progress increases -> floatIndex increases -> cards shift RIGHT to LEFT
  // As user scrolls UP: progress decreases -> floatIndex decreases -> cards shift LEFT to RIGHT
  const activeFloatIndex = useMemo(() => {
    if (isDragging) {
      return dragFloatIndex;
    }
    if (manualIndex !== null) {
      return manualIndex;
    }
    return progress * Math.max(0, N - 1);
  }, [isDragging, dragFloatIndex, manualIndex, progress, N]);

  // Release manual jump once smooth page scroll settles at target index
  useEffect(() => {
    if (manualIndex !== null && !isDragging) {
      const scrollFloat = progress * Math.max(0, N - 1);
      if (Math.abs(scrollFloat - manualIndex) < 0.05) {
        const timeout = setTimeout(() => {
          setManualIndex(null);
          isManualRef.current = false;
        }, 30);
        return () => clearTimeout(timeout);
      }
    }
  }, [progress, manualIndex, isDragging, N]);

  // Closest integer index currently in center
  const centerIndex = Math.min(N - 1, Math.max(0, Math.round(activeFloatIndex)));
  const centerTrainer = orbitalTrainers[centerIndex] || orbitalTrainers[0];

  // Helper to jump to a specific mentor via pagination dot, arrows, or post-drag snap
  const handleJumpToIndex = useCallback(
    (idx: number, smoothScroll = true) => {
      const targetIdx = Math.max(0, Math.min(N - 1, idx));
      isManualRef.current = true;
      setManualIndex(targetIdx);

      if (containerRef.current && smoothScroll && N > 1) {
        const rect = containerRef.current.getBoundingClientRect();
        const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;
        if (totalScrollable > 0) {
          const targetProgress = targetIdx / (N - 1);
          const currentScroll = window.scrollY;
          const targetScroll = currentScroll + rect.top + targetProgress * totalScrollable;
          window.scrollTo({ top: targetScroll, behavior: 'smooth' });
        }
      }
    },
    [containerRef, N]
  );

  const handlePrev = useCallback(() => {
    const nextIdx = Math.max(0, centerIndex - 1);
    handleJumpToIndex(nextIdx);
  }, [centerIndex, handleJumpToIndex]);

  const handleNext = useCallback(() => {
    const nextIdx = Math.min(N - 1, centerIndex + 1);
    handleJumpToIndex(nextIdx);
  }, [centerIndex, N, handleJumpToIndex]);

  // Pointer / Drag & Swipe Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only primary button (left mouse click) or touch
    if (e.button !== 0) return;

    if (snapAnimationIdRef.current) {
      cancelAnimationFrame(snapAnimationIdRef.current);
      snapAnimationIdRef.current = null;
    }

    isPointerDownRef.current = true;
    isHorizontalDragRef.current = false;
    hasMovedSignificantlyRef.current = false;

    dragStartXRef.current = e.clientX;
    dragStartYRef.current = e.clientY;
    lastMoveXRef.current = e.clientX;
    lastMoveTimeRef.current = performance.now();
    velocityRef.current = 0;
    startFloatIndexRef.current = activeFloatIndex;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;

    const dx = e.clientX - dragStartXRef.current;
    const dy = e.clientY - dragStartYRef.current;

    // Detect gesture direction on first significant movement
    if (!hasMovedSignificantlyRef.current) {
      if (Math.hypot(dx, dy) > 7) {
        hasMovedSignificantlyRef.current = true;
        if (Math.abs(dx) >= Math.abs(dy)) {
          isHorizontalDragRef.current = true;
          setIsDragging(true);
          try {
            (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          } catch {
            // Ignore capture failure
          }
        } else {
          // Vertical movement - let native page scrolling take precedence
          isHorizontalDragRef.current = false;
          isPointerDownRef.current = false;
          return;
        }
      }
    }

    if (isHorizontalDragRef.current) {
      const now = performance.now();
      const dt = now - lastMoveTimeRef.current;
      if (dt > 8) {
        velocityRef.current = (e.clientX - lastMoveXRef.current) / dt;
        lastMoveTimeRef.current = now;
        lastMoveXRef.current = e.clientX;
      }

      // Drag sensitivity: moving by ~s1 pixels shifts by 1 card index
      const indexDelta = -dx / (s1 * 1.15);
      let newFloat = startFloatIndexRef.current + indexDelta;

      // Gentle rubber-banding past boundaries
      if (newFloat < 0) {
        newFloat = newFloat * 0.25;
      } else if (newFloat > N - 1) {
        newFloat = N - 1 + (newFloat - (N - 1)) * 0.25;
      }

      setDragFloatIndex(newFloat);
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current && !isDragging) return;

    isPointerDownRef.current = false;

    try {
      if ((e.currentTarget as HTMLElement).hasPointerCapture?.(e.pointerId)) {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      }
    } catch {
      // Ignore
    }

    if (isHorizontalDragRef.current && hasMovedSignificantlyRef.current) {
      // Determine snap target based on position and release flick velocity
      let target = dragFloatIndex;
      const v = velocityRef.current;

      if (v < -0.28) {
        // Flicked leftward -> advance to next card
        target = Math.ceil(dragFloatIndex);
      } else if (v > 0.28) {
        // Flicked rightward -> move to previous card
        target = Math.floor(dragFloatIndex);
      } else {
        // Standard release -> snap to nearest card
        target = Math.round(dragFloatIndex);
      }

      target = Math.max(0, Math.min(N - 1, target));

      // Smooth glide to snap target
      const startVal = dragFloatIndex;
      const endVal = target;
      const startTime = performance.now();
      const duration = 240;

      const animateSnap = (now: number) => {
        const elapsed = now - startTime;
        const p = Math.min(1, elapsed / duration);
        // easeOutCubic curve
        const ease = 1 - Math.pow(1 - p, 3);
        const current = startVal + (endVal - startVal) * ease;
        setDragFloatIndex(current);

        if (p < 1) {
          snapAnimationIdRef.current = requestAnimationFrame(animateSnap);
        } else {
          setIsDragging(false);
          handleJumpToIndex(endVal, true);
        }
      };

      snapAnimationIdRef.current = requestAnimationFrame(animateSnap);

      // Brief suppress window so pointerup does not trigger card click
      setTimeout(() => {
        hasMovedSignificantlyRef.current = false;
        isHorizontalDragRef.current = false;
      }, 150);
    } else {
      setIsDragging(false);
      hasMovedSignificantlyRef.current = false;
      isHorizontalDragRef.current = false;
    }
  };

  if (orbitalTrainers.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[240vh] sm:h-[280vh] bg-slate-950 text-white select-none border-y border-slate-800"
    >
      {/* Sticky Viewport Stage: Pinned while user scrolls through the 3D cover flow */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between items-center overflow-hidden py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        {/* Subtle Ambient Background Gradients */}
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
          <div className="h-[480px] w-[480px] sm:h-[720px] sm:w-[720px] rounded-full bg-indigo-600/15 blur-3xl animate-aurora" />
          <div className="h-[300px] w-[300px] sm:h-[480px] sm:w-[480px] rounded-full bg-cyan-500/10 blur-2xl animate-ambient-2" />
        </div>

        {/* Section Header */}
        <div className="relative z-10 text-center max-w-3xl mx-auto space-y-2 pt-2 sm:pt-4">
          <PageLabel theme="dark">
            {badgeText}
          </PageLabel>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {title}
          </h2>

          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto line-clamp-2">
            {subtitle}
          </p>

          <div className="flex items-center justify-center gap-2 text-[11px] sm:text-xs text-slate-400 font-mono pt-1">
            <Compass className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span>
              Scroll down or drag horizontally (Right → Left) • Click card for full bio
            </span>
            <MoveHorizontal className="h-3 w-3 text-cyan-400 shrink-0 ml-0.5 hidden sm:inline" />
          </div>
        </div>

        {/* 3D Cover-Flow Stage Container with Touch Drag & Swipe Support */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUpOrCancel}
          onPointerCancel={handlePointerUpOrCancel}
          className={`relative z-10 w-full max-w-6xl mx-auto flex-1 flex flex-col items-center justify-center min-h-[390px] sm:min-h-[460px] touch-pan-y ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            perspective: windowWidth < 640 ? '900px' : '1200px',
            perspectiveOrigin: '50% 50%',
          }}
          title="Drag horizontally or scroll to traverse mentor profiles"
        >
          {/* Card Carousel Stage with 3D Preservation */}
          <div
            className="relative w-full h-[330px] sm:h-[370px] flex items-center justify-center"
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            {orbitalTrainers.map((tr, idx) => {
              // Delta represents relative position relative to active center:
              // delta = 0: Center Card (Prominent, front-facing, straight, focused)
              // delta > 0: Card on the Right side (rotated towards center)
              // delta < 0: Card on the Left side (rotated towards center)
              // When user scrolls DOWN or drags left, activeFloatIndex increases -> delta decreases -> Right cards move towards Center!
              // When user scrolls UP or drags right, activeFloatIndex decreases -> delta increases -> Left cards move towards Center!
              const delta = idx - activeFloatIndex;
              const absDelta = Math.abs(delta);
              const sign = delta >= 0 ? 1 : -1;

              // Horizontal X translation based on piecewise spacing
              let x = 0;
              if (absDelta <= 1) {
                x = delta * s1;
              } else {
                x = sign * (s1 + (absDelta - 1) * s2);
              }

              // 3D Perspective Y-Rotation:
              // Right cards (delta > 0) face inward to the left (negative rotateY)
              // Left cards (delta < 0) face inward to the right (positive rotateY)
              // Center card (delta = 0) faces straight forward (rotateY = 0)
              let rotateY = 0;
              if (!prefersReducedMotion) {
                if (absDelta <= 1) {
                  rotateY = -delta * 34; // smoothly interpolates between -34deg and +34deg
                } else {
                  const extra = Math.min(1, absDelta - 1);
                  rotateY = -sign * (34 + extra * 12); // up to ±46deg for far cards
                }
              }

              // Z-translation (depth):
              // Center card is pushed prominently forward (+70px); side cards recede into distance
              let translateZ = 0;
              if (!prefersReducedMotion) {
                if (absDelta <= 1) {
                  translateZ = 70 - absDelta * 160; // +70px at center, -90px at adjacent
                } else {
                  translateZ = -90 - (absDelta - 1) * 110; // -200px at far cards
                }
              }

              // Scale: Center card is largest (1.06), adjacent cards 0.85, outer cards 0.68
              let scale = 1;
              if (absDelta <= 1) {
                scale = 1.06 - absDelta * 0.21;
              } else {
                scale = Math.max(0.62, 0.85 - (absDelta - 1) * 0.17);
              }

              // Opacity: Center & adjacent cards 1.0; outer cards fade smoothly; beyond 2.8 invisible
              let opacity = 1;
              if (absDelta > 1.2) {
                opacity = Math.max(0, 1.0 - (absDelta - 1.2) * 0.62);
              }

              // Stacking order: Center card must have highest z-index (50), layering decreasing outward
              const zIndex = Math.max(1, Math.round(50 - absDelta * 12));

              // Center state check
              const isCenter = absDelta < 0.5;

              // Skip rendering off-screen elements completely for optimal performance
              if (opacity <= 0.01) {
                return null;
              }

              return (
                <div
                  key={tr.id}
                  onClick={(e) => {
                    if (hasMovedSignificantlyRef.current) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    handleJumpToIndex(idx);
                    setSelectedTrainer(tr);
                  }}
                  className={`absolute transition-[box-shadow,border-color] duration-300 ${cardWidthClass} ${
                    isDragging ? 'pointer-events-none' : 'cursor-pointer'
                  }`}
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) translateX(${x.toFixed(1)}px) translateZ(${translateZ.toFixed(1)}px) rotateY(${rotateY.toFixed(1)}deg) scale(${scale.toFixed(3)})`,
                    opacity: opacity.toFixed(3),
                    zIndex,
                    transformStyle: 'preserve-3d',
                    willChange: 'transform, opacity',
                  }}
                  title={`Click to view ${tr.name}'s bio`}
                >
                  {/* Premium Mentor 3D Cover-Flow Card */}
                  <div
                    className={`relative p-4 sm:p-5 rounded-2xl border backdrop-blur-xl transition-all duration-300 select-none ${
                      isCenter
                        ? 'bg-slate-900/95 border-indigo-500 shadow-[0_25px_60px_-15px_rgba(99,102,241,0.4)] ring-1 ring-indigo-400/60'
                        : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-500 hover:bg-slate-900/90 shadow-xl'
                    }`}
                  >
                    {/* Depth Shading Overlay for Side Cards */}
                    {!isCenter && (
                      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-slate-950/30 backdrop-blur-[0.5px] transition-opacity duration-300" />
                    )}

                    {/* Top Section: Avatar + Name + Live Center Ping */}
                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        <img
                          src={tr.avatarUrl}
                          alt={tr.name}
                          draggable={false}
                          className={`h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover object-top border-2 shadow-md transition-colors pointer-events-none ${
                            isCenter ? 'border-indigo-400' : 'border-slate-700'
                          }`}
                        />
                        {isCenter && (
                          <span
                            className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5"
                            title="Active Industry Mentor"
                          >
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-base sm:text-lg font-bold text-white truncate">
                            {tr.name}
                          </h4>
                        </div>
                        <p className="text-xs sm:text-sm text-indigo-400 font-semibold truncate mt-0.5">
                          {tr.role}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium mt-1">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span className="font-bold">{tr.rating.toFixed(1)}</span>
                          <span className="text-slate-400 font-normal">
                            ({tr.experienceYears}y exp)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Technical Specialization */}
                    <div className="mt-3.5 pt-3 border-t border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                        Domain Architecture
                      </span>
                      <p className="text-xs text-slate-200 line-clamp-2 font-medium leading-relaxed">
                        {tr.specialization}
                      </p>
                    </div>

                    {/* Former Organizations & Bio CTA */}
                    <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="truncate max-w-[160px] text-slate-400">
                        <span className="text-slate-500 font-medium">Ex: </span>
                        <span className="text-slate-300 font-medium">
                          {tr.formerCompanies.slice(0, 2).join(', ')}
                        </span>
                      </div>
                      <span className="text-indigo-400 font-semibold inline-flex items-center gap-0.5 hover:underline shrink-0">
                        View Bio →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Navigation & Center Mentor Spotlight Bar */}
          <div className="relative z-20 flex flex-col items-center gap-2 mt-4 sm:mt-6">
            {/* Active Mentor Quick Info Pill */}
            {centerTrainer && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 backdrop-blur-md shadow-sm">
                <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                <span className="font-semibold text-white">{centerTrainer.name}</span>
                <span className="text-slate-500">•</span>
                <span className="text-indigo-400 truncate max-w-[180px] sm:max-w-[260px]">
                  {centerTrainer.role}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">
                  {centerIndex + 1} of {N}
                </span>
              </div>
            )}

            {/* Pagination Controls & Dots */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={centerIndex === 0}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous Mentor"
                aria-label="Previous Mentor"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1.5 px-2">
                {orbitalTrainers.map((_, dotIdx) => {
                  const isCurrent = dotIdx === centerIndex;
                  return (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => handleJumpToIndex(dotIdx)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        isCurrent
                          ? 'w-7 bg-indigo-500 shadow-xs'
                          : 'w-2 bg-slate-700 hover:bg-slate-500'
                      }`}
                      title={`Jump to mentor ${dotIdx + 1}`}
                      aria-label={`Jump to mentor ${dotIdx + 1}`}
                    />
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={centerIndex === N - 1}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next Mentor"
                aria-label="Next Mentor"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Section Footer Callout */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 pb-2 sm:pb-4">
          {showExploreButton && (
            <Link to="/trainers">
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Meet All Faculty & Mentors
              </Button>
            </Link>
          )}

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle className="h-3.5 w-3.5" /> 100% Live Instructor Masterclasses
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-indigo-400 font-medium">
              <Award className="h-3.5 w-3.5" /> 1:1 Architectural Code Reviews
            </span>
          </div>
        </div>
      </div>

      {/* Selected Mentor Full Profile Modal (100% Preserved) */}
      <Modal
        isOpen={!!selectedTrainer}
        onClose={() => setSelectedTrainer(null)}
        title={selectedTrainer?.name || 'Faculty Profile'}
        description={selectedTrainer?.role || 'Technical Mentor'}
      >
        {selectedTrainer && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <img
                src={selectedTrainer.avatarUrl}
                alt={selectedTrainer.name}
                className="h-16 w-16 rounded-xl object-cover object-top border-2 border-indigo-200 shrink-0 shadow-sm"
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900">{selectedTrainer.name}</h3>
                <p className="text-xs text-indigo-600 font-semibold">{selectedTrainer.role}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{selectedTrainer.qualifications}</p>
                <div className="flex items-center gap-1 text-amber-500 font-bold mt-1">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>{selectedTrainer.rating.toFixed(2)} Student Rating</span>
                  <span className="text-slate-400 font-normal ml-1">
                    ({selectedTrainer.experienceYears}+ Years Enterprise Experience)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-900 block mb-1">Technical Specialization</span>
              <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-medium text-slate-800">
                {selectedTrainer.specialization}
              </p>
            </div>

            <div>
              <span className="font-semibold text-slate-900 block mb-1">Mentor Biography & Background</span>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {selectedTrainer.bio}
              </p>
            </div>

            <div>
              <span className="font-semibold text-slate-900 block mb-1">Former Organizations</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedTrainer.formerCompanies.map((c) => (
                  <span key={c} className="px-2.5 py-1 bg-slate-100 rounded-md text-slate-800 font-medium">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-900 block mb-1">Courses Instructed</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedTrainer.coursesTaught.map((c) => (
                  <span key={c} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md font-medium border border-indigo-100">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-200">
              {selectedTrainer.linkedinUrl && (
                <a
                  href={selectedTrainer.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  <Linkedin size={14} />
                  <span>View LinkedIn Profile</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedTrainer(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
