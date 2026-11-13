import React, { useState } from 'react';
import {
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  CheckCircle2,
  Layers,
  BarChart3,
  Flame,
  LayoutTemplate,
} from 'lucide-react';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Badge } from '../../common/Badge';
import { useNotification } from '../../../context/NotificationContext';
import { cmsService, type HomePageConfig } from '../../../services/cmsService';

export const CMSHomePageTab: React.FC = () => {
  const [config, setConfig] = useState<HomePageConfig>(() => cmsService.getHomePageConfig());
  const [activeSubSection, setActiveSubSection] = useState<'visibility' | 'hero' | 'stats' | 'advantage' | 'methodology'>('visibility');
  const { showToast } = useNotification();

  const handleSave = () => {
    cmsService.saveHomePageConfig(config);
    showToast({
      type: 'success',
      title: 'Homepage Config Saved',
      message: 'Changes are now live on the public website homepage in real-time.',
    });
  };

  const handleReset = () => {
    if (window.confirm('Reset homepage content and section visibility to factory defaults?')) {
      const def = cmsService.resetHomePageConfig();
      setConfig(def);
      showToast({
        type: 'info',
        title: 'Reset to Defaults',
        message: 'Homepage restored to original default configuration.',
      });
    }
  };

  const toggleSection = (sectionKey: keyof HomePageConfig['sectionVisibility']) => {
    setConfig((prev) => ({
      ...prev,
      sectionVisibility: {
        ...prev.sectionVisibility,
        [sectionKey]: !prev.sectionVisibility[sectionKey],
      },
    }));
  };

  const toggleAllSections = (enable: boolean) => {
    const updated = { ...config.sectionVisibility };
    (Object.keys(updated) as Array<keyof typeof updated>).forEach((k) => {
      updated[k] = enable;
    });
    setConfig((prev) => ({ ...prev, sectionVisibility: updated }));
  };

  const updateStat = (idx: number, field: string, val: any) => {
    const updated = [...config.statistics];
    updated[idx] = { ...updated[idx], [field]: val };
    setConfig({ ...config, statistics: updated });
  };

  const updateAdvantage = (idx: number, field: string, val: string) => {
    const updated = [...config.advantages];
    updated[idx] = { ...updated[idx], [field]: val };
    setConfig({ ...config, advantages: updated });
  };

  const updateMethodology = (idx: number, field: string, val: string) => {
    const updated = [...config.methodology];
    updated[idx] = { ...updated[idx], [field]: val };
    setConfig({ ...config, methodology: updated });
  };

  const SECTIONS_META: Array<{ key: keyof HomePageConfig['sectionVisibility']; label: string; desc: string }> = [
    { key: 'hero', label: '1. Hero Banner & CTAs', desc: 'Main headline, subtitle, enrollment CTAs, and value badges' },
    { key: 'statistics', label: '2. Animated Key Metrics Bar', desc: '5 count-up statistics (Learners, Placement %, Highest CTC, etc.)' },
    { key: 'intro', label: '3. Institute Introduction', desc: 'About Nexelvoria mission statement and campus overview' },
    { key: 'courses', label: '4. Flagship Courses Section', desc: '3 flagship training courses cards with syllabus detail links' },
    { key: 'advantage', label: '5. Nexelvoria Advantage', desc: '6 feature cards highlighting our enterprise training rigor' },
    { key: 'methodology', label: '6. 5-Stage Methodology', desc: 'Interactive pedagogical roadmap from fundamentals to capstones' },
    { key: 'trainersOrbit', label: '7. Trainers Orbit Section', desc: 'Scroll-triggered 3D rotating cards of faculty and industry mentors' },
    { key: 'hiringMarquee', label: '8. Hiring Partners Marquee', desc: 'Continuous dual-row scrolling partner company logos' },
    { key: 'achievements', label: '9. Student Milestones', desc: 'Hackathon wins, certifications, and alumni achievements' },
    { key: 'partnerships', label: '10. Institutional & Corporate Cards', desc: 'Highlights for college MoUs and enterprise upskilling' },
    { key: 'testimonials', label: '11. Student Testimonials', desc: 'Alumni reviews with ratings, packages, and student pictures' },
    { key: 'blog', label: '12. Engineering Blog Preview', desc: 'Latest technical guides and interview preparation articles' },
    { key: 'faqs', label: '13. FAQs Preview Section', desc: 'Top 5 accordion questions with link to complete FAQs' },
    { key: 'leadForm', label: '14. Inline Course Lead Form', desc: 'Interactive lead capture form and counseling callback modal' },
  ];

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-indigo-600" />
            Homepage Content & Section Visibility Controls
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure every headline, animated statistic, advantage card, and toggle public section visibility.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} leftIcon={<RotateCcw className="h-4 w-4 text-slate-400" />}>
            Reset Defaults
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} leftIcon={<Save className="h-4 w-4" />}>
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Sub-navigation Pills */}
      <div className="flex flex-wrap gap-2 text-xs border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubSection('visibility')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubSection === 'visibility' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          Section Visibility (14 Sections)
        </button>
        <button
          onClick={() => setActiveSubSection('hero')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubSection === 'hero' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Hero Content
        </button>
        <button
          onClick={() => setActiveSubSection('stats')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubSection === 'stats' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          5 Key Statistics
        </button>
        <button
          onClick={() => setActiveSubSection('advantage')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubSection === 'advantage' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          Nexelvoria Advantage (6)
        </button>
        <button
          onClick={() => setActiveSubSection('methodology')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubSection === 'methodology' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          5-Stage Methodology
        </button>
      </div>

      {/* 1. Visibility Switches */}
      {activeSubSection === 'visibility' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Homepage Section Visibility Toggles</h3>
              <p className="text-xs text-slate-500">Turn any section ON or OFF. Disabled sections are completely hidden from the public website.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => toggleAllSections(true)}>
                Enable All
              </Button>
              <Button variant="outline" size="sm" onClick={() => toggleAllSections(false)}>
                Disable All
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SECTIONS_META.map((sec) => {
              const isEnabled = config.sectionVisibility[sec.key];
              return (
                <div
                  key={sec.key}
                  onClick={() => toggleSection(sec.key)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isEnabled
                      ? 'bg-indigo-50/40 border-indigo-200 shadow-xs'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{sec.label}</span>
                      <Badge variant={isEnabled ? 'success' : 'neutral'} size="sm">
                        {isEnabled ? 'VISIBLE' : 'HIDDEN'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{sec.desc}</p>
                  </div>

                  <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                    isEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}>
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 2. Hero Content Form */}
      {activeSubSection === 'hero' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Hero Section Content</h3>
            <p className="text-xs text-slate-500">Edit the top banner headlines, call-to-action buttons, and value badges.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Top Pill Badge Text</label>
              <input
                type="text"
                value={config.hero.badgeText}
                onChange={(e) => setConfig({ ...config, hero: { ...config.hero, badgeText: e.target.value } })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title Prefix *</label>
                <input
                  type="text"
                  value={config.hero.titlePrefix}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, titlePrefix: e.target.value } })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title Highlight (Indigo Color) *</label>
                <input
                  type="text"
                  value={config.hero.titleHighlight}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, titleHighlight: e.target.value } })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-indigo-600 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Subtitle / Value Proposition</label>
              <textarea
                rows={3}
                value={config.hero.subtitle}
                onChange={(e) => setConfig({ ...config, hero: { ...config.hero, subtitle: e.target.value } })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary CTA Button Label</label>
                <input
                  type="text"
                  value={config.hero.ctaPrimaryText}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, ctaPrimaryText: e.target.value } })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary CTA Target Link</label>
                <input
                  type="text"
                  value={config.hero.ctaPrimaryLink}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, ctaPrimaryLink: e.target.value } })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Secondary CTA Button Label</label>
                <input
                  type="text"
                  value={config.hero.ctaSecondaryText}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, ctaSecondaryText: e.target.value } })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Trust Badges (Comma-separated)</label>
              <input
                type="text"
                value={config.hero.valueBadges.join(', ')}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    hero: {
                      ...config.hero,
                      valueBadges: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Displayed beneath the CTA buttons with checkmarks.</span>
            </div>
          </div>
        </Card>
      )}

      {/* 3. Statistics Editor */}
      {activeSubSection === 'stats' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">5 Animated Key Statistics</h3>
            <p className="text-xs text-slate-500">These counters animate into view when the visitor scrolls onto the metrics bar.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.statistics.map((stat, idx) => (
              <div key={stat.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-600">STAT 0{idx + 1}</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={stat.isVisible !== false}
                      onChange={(e) => updateStat(idx, 'isVisible', e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] text-slate-600 font-medium">Visible</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Value (e.g. 500+, 95%)</label>
                  <input
                    type="text"
                    value={stat.value}
                    onChange={(e) => updateStat(idx, 'value', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Label Text</label>
                  <input
                    type="text"
                    value={stat.label}
                    onChange={(e) => updateStat(idx, 'label', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 4. Advantage Cards Editor */}
      {activeSubSection === 'advantage' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Nexelvoria Advantage Cards (6)</h3>
            <p className="text-xs text-slate-500">Edit titles and explanations for the 6 core value proposition pillars.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.advantages.map((adv, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                <span className="text-xs font-mono font-bold text-indigo-600">CARD 0{idx + 1}</span>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Card Title</label>
                  <input
                    type="text"
                    value={adv.title}
                    onChange={(e) => updateAdvantage(idx, 'title', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Description</label>
                  <textarea
                    rows={2}
                    value={adv.desc}
                    onChange={(e) => updateAdvantage(idx, 'desc', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 5. Methodology Editor */}
      {activeSubSection === 'methodology' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">5-Stage Methodology Roadmap</h3>
            <p className="text-xs text-slate-500">Edit step titles and details for our pedagogical framework.</p>
          </div>

          <div className="space-y-4">
            {config.methodology.map((m, idx) => (
              <div key={m.step} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-4">
                <span className="text-2xl font-black text-slate-300 font-mono shrink-0">{m.step}</span>
                <div className="flex-1 space-y-2 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Step Title</label>
                    <input
                      type="text"
                      value={m.title}
                      onChange={(e) => updateMethodology(idx, 'title', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Step Description</label>
                    <textarea
                      rows={2}
                      value={m.desc}
                      onChange={(e) => updateMethodology(idx, 'desc', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
