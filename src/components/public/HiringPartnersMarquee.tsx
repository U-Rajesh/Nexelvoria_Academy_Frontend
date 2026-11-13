import React, { useState, useEffect } from 'react';
import { Building, Briefcase, MapPin } from 'lucide-react';
import { cmsService, type HiringPartnerCompany, type MarqueeAnimationConfig } from '../../services/cmsService';

interface HiringPartnersMarqueeProps {
  companies?: HiringPartnerCompany[];
  className?: string;
  theme?: 'light' | 'dark';
}

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

  // Calculate speed durations in seconds
  const speedToDuration = (speed: 'slow' | 'normal' | 'fast'): string => {
    if (speed === 'slow') return '45s';
    if (speed === 'fast') return '18s';
    return '30s';
  };

  const row1Duration = speedToDuration(marqueeConfig.row1Speed || 'normal');
  const row2Duration = speedToDuration(marqueeConfig.row2Speed || 'normal');

  // Split companies into subsets
  const half = Math.ceil(partnerCompanies.length / (marqueeConfig.rowCount === 1 ? 1 : 2));
  const row1Companies = partnerCompanies.slice(0, half);
  const row2Companies = marqueeConfig.rowCount === 2 ? partnerCompanies.slice(half) : [];

  // Triple buffer to guarantee seamless 100% gapless continuous marquee
  const row1Items = [...row1Companies, ...row1Companies, ...row1Companies];
  const row2Items =
    row2Companies.length > 0
      ? [...row2Companies, ...row2Companies, ...row2Companies]
      : [];

  const cardBg =
    theme === 'dark'
      ? 'bg-slate-800/80 border-slate-700/80 text-white hover:border-indigo-400'
      : 'bg-white border-slate-200/90 text-slate-800 hover:border-indigo-500 hover:shadow-md';

  const maskGradientLeft =
    theme === 'dark'
      ? 'from-slate-900 to-transparent'
      : 'from-slate-50 via-slate-50/80 to-transparent';

  const maskGradientRight =
    theme === 'dark'
      ? 'from-transparent to-slate-900'
      : 'from-transparent via-slate-50/80 to-slate-50';

  const row1AnimationClass =
    marqueeConfig.row1Direction === 'right'
      ? 'animate-marquee-right'
      : 'animate-marquee-left';

  const row2AnimationClass =
    marqueeConfig.row2Direction === 'left'
      ? 'animate-marquee-left'
      : 'animate-marquee-right';

  const hoverPauseClass = marqueeConfig.pauseOnHover
    ? 'hover:[animation-play-state:paused]'
    : '';

  return (
    <div className={`relative overflow-hidden w-full space-y-4 py-4 select-none ${className}`}>
      {/* Edge Gradient Fades for Smooth Bleed */}
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r ${maskGradientLeft} z-10`}
      />
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-r ${maskGradientRight} z-10`}
      />

      {/* Row 1 */}
      <div
        className={`flex w-fit ${row1AnimationClass} ${hoverPauseClass} gap-4`}
        style={{ animationDuration: row1Duration }}
      >
        {row1Items.map((comp, idx) => (
          <div
            key={`r1-${comp.id}-${idx}`}
            className={`w-64 shrink-0 p-4 rounded-xl border transition-all duration-200 flex items-center gap-3.5 ${cardBg}`}
          >
            {comp.logoUrl ? (
              <img
                src={comp.logoUrl}
                alt={comp.name}
                className="h-10 w-10 rounded-lg object-contain bg-slate-50 p-1 border border-slate-200 shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <Building className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold truncate">{comp.name}</h4>
              <p className="text-[11px] text-slate-400 truncate">{comp.industry}</p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                <span className="flex items-center gap-0.5 truncate">
                  <MapPin className="h-2.5 w-2.5" />
                  {comp.location ? comp.location.split('/')[0].trim() : 'India'}
                </span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                  <Briefcase className="h-2.5 w-2.5" />
                  {comp.activeOpeningsCount || 3} openings
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2 (if enabled) */}
      {marqueeConfig.rowCount === 2 && row2Items.length > 0 && (
        <div
          className={`flex w-fit ${row2AnimationClass} ${hoverPauseClass} gap-4`}
          style={{ animationDuration: row2Duration }}
        >
          {row2Items.map((comp, idx) => (
            <div
              key={`r2-${comp.id}-${idx}`}
              className={`w-64 shrink-0 p-4 rounded-xl border transition-all duration-200 flex items-center gap-3.5 ${cardBg}`}
            >
              {comp.logoUrl ? (
                <img
                  src={comp.logoUrl}
                  alt={comp.name}
                  className="h-10 w-10 rounded-lg object-contain bg-slate-50 p-1 border border-slate-200 shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                  <Building className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold truncate">{comp.name}</h4>
                <p className="text-[11px] text-slate-400 truncate">{comp.industry}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                  <span className="flex items-center gap-0.5 truncate">
                    <MapPin className="h-2.5 w-2.5" />
                    {comp.location ? comp.location.split('/')[0].trim() : 'India'}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                    <Briefcase className="h-2.5 w-2.5" />
                    {comp.activeOpeningsCount || 3} openings
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
