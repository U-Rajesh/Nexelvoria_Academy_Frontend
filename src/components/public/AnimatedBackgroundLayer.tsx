import React from 'react';

/**
 * AnimatedBackgroundLayer
 *
 * Renders a subtle, high-performance ambient animated background layer behind the website.
 * Employs lightweight CSS transforms and radial gradients:
 * - Soft cyan, sky blue, and indigo ambient orbs.
 * - Smooth continuous multi-dimensional drift.
 * - Lightweight micro-mesh texture.
 * - Non-interactive (pointer-events: none, z-index 0).
 * - Full prefers-reduced-motion support.
 */
export const AnimatedBackgroundLayer: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
    >
      {/* Ambient Orb 1: Soft Cyan / Sky Blue (Top Left & Center) */}
      <div
        className="absolute top-[4%] -left-[8%] w-[55vw] h-[55vw] max-w-[850px] max-h-[850px] rounded-full opacity-55 blur-3xl animate-ambient-1"
        style={{
          background: 'radial-gradient(circle at 40% 40%, rgba(6, 182, 212, 0.18) 0%, rgba(56, 189, 248, 0.10) 45%, transparent 70%)',
        }}
      />

      {/* Ambient Orb 2: Soft Indigo / Violet (Top Right & Mid-Right) */}
      <div
        className="absolute top-[18%] -right-[10%] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] rounded-full opacity-50 blur-3xl animate-ambient-2"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.16) 0%, rgba(139, 92, 246, 0.08) 50%, transparent 75%)',
        }}
      />

      {/* Ambient Orb 3: Soft Azure / Cobalt Blue (Bottom Center & Left) */}
      <div
        className="absolute bottom-[4%] left-[12%] w-[45vw] h-[45vw] max-w-[700px] max-h-[700px] rounded-full opacity-45 blur-3xl animate-ambient-3"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.14) 0%, rgba(14, 165, 233, 0.06) 55%, transparent 75%)',
        }}
      />

      {/* Subtle Micro-Grid Texture Overlay (Adds crisp physical architectural depth) */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(15, 23, 42, 0.8) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Lightweight Floating Ambient Particles */}
      <div className="absolute top-[24%] left-[20%] w-2 h-2 rounded-full bg-cyan-400/50 blur-[0.5px] animate-ambient-particle" />
      <div
        className="absolute top-[48%] right-[22%] w-2.5 h-2.5 rounded-full bg-indigo-400/45 blur-[0.5px] animate-ambient-particle"
        style={{ animationDelay: '4s', animationDuration: '18s' }}
      />
      <div
        className="absolute top-[72%] left-[28%] w-1.5 h-1.5 rounded-full bg-sky-400/50 blur-[0.5px] animate-ambient-particle"
        style={{ animationDelay: '8s', animationDuration: '20s' }}
      />
      <div
        className="absolute top-[88%] right-[16%] w-2 h-2 rounded-full bg-indigo-300/40 blur-[0.5px] animate-ambient-particle"
        style={{ animationDelay: '12s', animationDuration: '22s' }}
      />
    </div>
  );
};

/**
 * AmbientDarkGlow
 *
 * For dark sections (Hero, Advantage, Milestones, Lead Enquiry, Pedagogy).
 * Imparts a luminous, rich aurora depth to deep slate backgrounds without altering layout or text readability.
 */
export const AmbientDarkGlow: React.FC<{
  variant?: 'cyan-indigo' | 'indigo-violet' | 'emerald-cyan';
  className?: string;
}> = ({ variant = 'cyan-indigo', className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
    >
      {variant === 'cyan-indigo' && (
        <>
          <div
            className="absolute -top-24 left-1/4 w-[500px] h-[350px] sm:w-[700px] sm:h-[450px] rounded-full blur-[110px] opacity-40 animate-aurora"
            style={{
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.45) 0%, rgba(6, 182, 212, 0.25) 50%, transparent 75%)',
            }}
          />
          <div
            className="absolute -bottom-20 right-1/4 w-[450px] h-[300px] sm:w-[600px] sm:h-[400px] rounded-full blur-[120px] opacity-30 animate-ambient-2"
            style={{
              background: 'radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, rgba(99, 102, 241, 0.15) 60%, transparent 80%)',
            }}
          />
        </>
      )}

      {variant === 'indigo-violet' && (
        <>
          <div
            className="absolute top-0 right-1/3 w-[600px] h-[400px] rounded-full blur-[120px] opacity-35 animate-aurora"
            style={{
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(99, 102, 241, 0.25) 55%, transparent 75%)',
            }}
          />
          <div
            className="absolute bottom-0 left-1/4 w-[500px] h-[350px] rounded-full blur-[100px] opacity-30 animate-ambient-1"
            style={{
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%)',
            }}
          />
        </>
      )}

      {variant === 'emerald-cyan' && (
        <div
          className="absolute top-1/4 left-1/3 w-[600px] h-[350px] rounded-full blur-[110px] opacity-30 animate-aurora"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(6, 182, 212, 0.2) 55%, transparent 75%)',
          }}
        />
      )}

      {/* Subtle Grid Accent for Dark Sections */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
};
