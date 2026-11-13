import React, { useState, useEffect } from 'react';
import { cmsService, type HiringPartnerCompany, type MarqueeAnimationConfig } from '../../services/cmsService';

interface HiringPartnersMarqueeProps {
  companies?: HiringPartnerCompany[];
  className?: string;
  theme?: 'light' | 'dark';
}

const speedToDuration = (speed: 'slow' | 'normal' | 'fast'): string => {
  if (speed === 'slow') return '45s';
  if (speed === 'fast') return '18s';
  return '30s';
};

interface MarqueeRowProps {
  companies: HiringPartnerCompany[];
  rowKey: string;
  animationClass: string;
  duration: string;
  pauseClass: string;
  cardBorder: string;
}

const MarqueeRow: React.FC<MarqueeRowProps> = ({
  companies,
  rowKey,
  animationClass,
  duration,
  pauseClass,
  cardBorder,
}) => {
  const [failedLogos, setFailedLogos] = useState<Set<string>>(() => new Set());

  // Three identical copies; the keyframes shift by exactly one copy (-33.333%) for a seamless loop.
  // Spacing is per-item padding (not flex `gap`) so each copy is exactly one third of the track width.
  const items = [...companies, ...companies, ...companies];

  return (
    <div className={`flex w-fit ${animationClass} ${pauseClass}`} style={{ animationDuration: duration }}>
      {items.map((comp, idx) => {
        const showLogo = !!comp.logoUrl && !failedLogos.has(comp.id);
        return (
          <div
            key={`${rowKey}-${comp.id}-${idx}`}
            className="shrink-0 px-2 sm:px-2.5"
            aria-hidden={idx >= companies.length}
          >
            <div
              className={`flex h-20 w-44 sm:h-24 sm:w-52 items-center justify-center rounded-2xl border bg-white px-6 py-5 sm:px-7 sm:py-6 shadow-sm transition-all duration-300 hover:shadow-md ${cardBorder}`}
              title={comp.name}
            >
              {showLogo ? (
                <img
                  src={comp.logoUrl}
                  alt={comp.name}
                  loading="lazy"
                  draggable={false}
                  className="h-full w-full object-contain"
                  onError={() => setFailedLogos((prev) => new Set(prev).add(comp.id))}
                />
              ) : (
                <span className="line-clamp-2 text-center text-sm font-bold leading-tight tracking-tight text-slate-700">
                  {comp.name}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const HiringPartnersMarquee: React.FC<HiringPartnersMarqueeProps> = ({
  companies: initialCompanies,
  className = '',
  theme = 'light',
}) => {
  const [partnerCompanies, setPartnerCompanies] = useState<HiringPartnerCompany[]>(() => {
    if (initialCompanies && initialCompanies.length > 0) return initialCompanies;
    return cmsService.getHiringPartners().filter((c) => c.isVisible !== false);
  });

  const [marqueeConfig, setMarqueeConfig] = useState<MarqueeAnimationConfig>(() =>
    cmsService.getMarqueeConfig()
  );

  useEffect(() => {
    if (!initialCompanies) {
      setPartnerCompanies(cmsService.getHiringPartners().filter((c) => c.isVisible !== false));
      setMarqueeConfig(cmsService.getMarqueeConfig());
    }
  }, [initialCompanies]);

  if (!marqueeConfig.isEnabled || partnerCompanies.length === 0) {
    return null;
  }

  const isTwoRows = marqueeConfig.rowCount === 2;

  // Split companies into subsets
  const half = Math.ceil(partnerCompanies.length / (isTwoRows ? 2 : 1));
  const row1Companies = partnerCompanies.slice(0, half);
  const row2Companies = isTwoRows ? partnerCompanies.slice(half) : [];

  // Logo cards stay white in both themes so brand colours render as intended.
  const cardBorder =
    theme === 'dark'
      ? 'border-slate-700/60 hover:border-indigo-400/70'
      : 'border-slate-200/80 hover:border-indigo-200';

  const maskGradientLeft =
    theme === 'dark'
      ? 'from-slate-900 to-transparent'
      : 'from-slate-50 via-slate-50/80 to-transparent';

  const maskGradientRight =
    theme === 'dark'
      ? 'from-transparent to-slate-900'
      : 'from-transparent via-slate-50/80 to-slate-50';

  const row1AnimationClass =
    marqueeConfig.row1Direction === 'right' ? 'animate-marquee-right' : 'animate-marquee-left';

  const row2AnimationClass =
    marqueeConfig.row2Direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right';

  // Hovering anywhere over the marquee pauses both rows.
  const pauseClass = marqueeConfig.pauseOnHover ? 'group-hover:[animation-play-state:paused]' : '';

  return (
    <div className={`group relative overflow-hidden w-full space-y-4 sm:space-y-5 py-4 select-none ${className}`}>
      {/* Edge Gradient Fades for Smooth Bleed */}
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r ${maskGradientLeft} z-10`}
      />
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-r ${maskGradientRight} z-10`}
      />

      <MarqueeRow
        companies={row1Companies}
        rowKey="r1"
        animationClass={row1AnimationClass}
        duration={speedToDuration(marqueeConfig.row1Speed || 'normal')}
        pauseClass={pauseClass}
        cardBorder={cardBorder}
      />

      {isTwoRows && row2Companies.length > 0 && (
        <MarqueeRow
          companies={row2Companies}
          rowKey="r2"
          animationClass={row2AnimationClass}
          duration={speedToDuration(marqueeConfig.row2Speed || 'normal')}
          pauseClass={pauseClass}
          cardBorder={cardBorder}
        />
      )}
    </div>
  );
};
