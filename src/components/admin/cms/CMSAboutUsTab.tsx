import React, { useState } from 'react';
import {
  Compass,
  Target,
  Save,
  RotateCcw,
  Eye,
  BookOpen,
  Table,
  Building,
  Info,
} from 'lucide-react';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Badge } from '../../common/Badge';
import { useNotification } from '../../../context/NotificationContext';
import { cmsService, type AboutUsConfig } from '../../../services/cmsService';

export const CMSAboutUsTab: React.FC = () => {
  const [config, setConfig] = useState<AboutUsConfig>(() => cmsService.getAboutUsConfig());
  const [activeSubSection, setActiveSubSection] = useState<'visibility' | 'vision-mission' | 'objectives' | 'pedagogy' | 'comparison' | 'campus'>('visibility');
  const { showToast } = useNotification();

  const handleSave = () => {
    cmsService.saveAboutUsConfig(config);
    showToast({
      type: 'success',
      title: 'About Us Content Saved',
      message: 'Changes are now live on the public /about-us page in real-time.',
    });
  };

  const handleReset = () => {
    if (window.confirm('Reset About Us content and section visibility to factory defaults?')) {
      const def = cmsService.resetAboutUsConfig();
      setConfig(def);
      showToast({
        type: 'info',
        title: 'Reset to Defaults',
        message: 'About Us restored to original default configuration.',
      });
    }
  };

  const toggleSection = (sectionKey: keyof AboutUsConfig['sectionVisibility']) => {
    setConfig((prev) => ({
      ...prev,
      sectionVisibility: {
        ...prev.sectionVisibility,
        [sectionKey]: !prev.sectionVisibility[sectionKey],
      },
    }));
  };

  const updateObjective = (idx: number, field: 'title' | 'desc', val: string) => {
    const updated = [...config.objectives];
    updated[idx] = { ...updated[idx], [field]: val };
    setConfig({ ...config, objectives: updated });
  };

  const updatePedagogy = (idx: number, field: string, val: string) => {
    const updated = [...config.pedagogy];
    updated[idx] = { ...updated[idx], [field]: val };
    setConfig({ ...config, pedagogy: updated });
  };

  const updateComparisonRow = (idx: number, field: string, val: string) => {
    const updated = [...config.comparison];
    updated[idx] = { ...updated[idx], [field]: val };
    setConfig({ ...config, comparison: updated });
  };

  const SECTIONS_META: Array<{ key: keyof AboutUsConfig['sectionVisibility']; label: string; desc: string }> = [
    { key: 'header', label: '1. Mission & Pedagogy Header', desc: 'Main headline, badge and introductory mission narrative' },
    { key: 'visionMission', label: '2. Vision & Mission Cards', desc: 'Core institutional vision and operational mission cards' },
    { key: 'objectives', label: '3. Strategic Objectives (6)', desc: 'The 6 fundamental institutional goals and commitments' },
    { key: 'pedagogy', label: '4. The Nexelvoria Way Pedagogy', desc: '4 mandatory learning loop stages (Conceptual to Assessments)' },
    { key: 'comparison', label: '5. Transparent Benchmarking Matrix', desc: 'Comparison table: Traditional Colleges vs Aggregators vs Nexelvoria' },
    { key: 'campus', label: '6. Campus & Tech Headquarters', desc: 'Physical hub details, broadcasting studios, and contact links' },
  ];

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Info className="h-5 w-5 text-indigo-600" />
            About Us Page Management (Mission, Objectives & Benchmarking)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage vision, mission, 6 institutional objectives, pedagogical framework, and comparison matrix.
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
          Section Visibility (6)
        </button>
        <button
          onClick={() => setActiveSubSection('vision-mission')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubSection === 'vision-mission' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Compass className="h-3.5 w-3.5" />
          Header, Vision & Mission
        </button>
        <button
          onClick={() => setActiveSubSection('objectives')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubSection === 'objectives' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Target className="h-3.5 w-3.5" />
          6 Strategic Objectives
        </button>
        <button
          onClick={() => setActiveSubSection('pedagogy')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubSection === 'pedagogy' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          4-Stage Pedagogy
        </button>
        <button
          onClick={() => setActiveSubSection('comparison')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubSection === 'comparison' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Table className="h-3.5 w-3.5" />
          Comparison Matrix (6)
        </button>
        <button
          onClick={() => setActiveSubSection('campus')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubSection === 'campus' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Building className="h-3.5 w-3.5" />
          Campus Infrastructure
        </button>
      </div>

      {/* 1. Visibility Switches */}
      {activeSubSection === 'visibility' && (
        <Card className="p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">About Us Page Visibility Toggles</h3>
            <p className="text-xs text-slate-500">Toggle any section on or off on the /about-us route.</p>
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

      {/* 2. Header, Vision & Mission Form */}
      {activeSubSection === 'vision-mission' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Header, Vision & Mission Statements</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
              <span className="font-bold text-indigo-700 uppercase tracking-wider text-[10px]">Page Header</span>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Badge Text</label>
                <input
                  type="text"
                  value={config.header.badgeText}
                  onChange={(e) => setConfig({ ...config, header: { ...config.header, badgeText: e.target.value } })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Main Heading *</label>
                <input
                  type="text"
                  value={config.header.title}
                  onChange={(e) => setConfig({ ...config, header: { ...config.header, title: e.target.value } })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subtitle</label>
                <textarea
                  rows={2}
                  value={config.header.subtitle}
                  onChange={(e) => setConfig({ ...config, header: { ...config.header, subtitle: e.target.value } })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
                <span className="font-bold text-indigo-700 uppercase tracking-wider text-[10px]">Our Vision</span>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vision Title</label>
                  <input
                    type="text"
                    value={config.vision.title}
                    onChange={(e) => setConfig({ ...config, vision: { ...config.vision, title: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vision Description</label>
                  <textarea
                    rows={4}
                    value={config.vision.description}
                    onChange={(e) => setConfig({ ...config, vision: { ...config.vision, description: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
                <span className="font-bold text-emerald-700 uppercase tracking-wider text-[10px]">Our Mission</span>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mission Title</label>
                  <input
                    type="text"
                    value={config.mission.title}
                    onChange={(e) => setConfig({ ...config, mission: { ...config.mission, title: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mission Description</label>
                  <textarea
                    rows={4}
                    value={config.mission.description}
                    onChange={(e) => setConfig({ ...config, mission: { ...config.mission, description: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 3. 6 Strategic Objectives */}
      {activeSubSection === 'objectives' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">The 6 Strategic Institutional Objectives</h3>
            <p className="text-xs text-slate-500">Edit titles and descriptions of the core pillars that guide our institutional standards.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.objectives.map((obj, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                <span className="text-xs font-mono font-bold text-indigo-600">OBJECTIVE 0{idx + 1}</span>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Title</label>
                  <input
                    type="text"
                    value={obj.title}
                    onChange={(e) => updateObjective(idx, 'title', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Description</label>
                  <textarea
                    rows={2}
                    value={obj.desc}
                    onChange={(e) => updateObjective(idx, 'desc', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 4. 4-Stage Pedagogy */}
      {activeSubSection === 'pedagogy' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">4-Stage Pedagogy Loop</h3>
            <p className="text-xs text-slate-500">Edit stage titles, descriptions, and icon identifiers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.pedagogy.map((p, idx) => (
              <div key={p.stage} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                <span className="text-xs font-mono font-bold text-indigo-600">STAGE {p.stage}</span>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Stage Title</label>
                  <input
                    type="text"
                    value={p.title}
                    onChange={(e) => updatePedagogy(idx, 'title', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Description</label>
                  <textarea
                    rows={2}
                    value={p.desc}
                    onChange={(e) => updatePedagogy(idx, 'desc', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 5. Benchmarking Matrix */}
      {activeSubSection === 'comparison' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Transparent Benchmarking Comparison Table</h3>
            <p className="text-xs text-slate-500">Edit rows comparing Nexelvoria against Traditional Colleges and Video Platforms.</p>
          </div>

          <div className="space-y-4">
            {config.comparison.map((row, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700">ROW 0{idx + 1}: {row.feature}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Feature Name</label>
                    <input
                      type="text"
                      value={row.feature}
                      onChange={(e) => updateComparisonRow(idx, 'feature', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Traditional Colleges</label>
                    <input
                      type="text"
                      value={row.traditional}
                      onChange={(e) => updateComparisonRow(idx, 'traditional', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Video Aggregators</label>
                    <input
                      type="text"
                      value={row.aggregator}
                      onChange={(e) => updateComparisonRow(idx, 'aggregator', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-700 mb-0.5">Nexelvoria Academy</label>
                    <input
                      type="text"
                      value={row.nexelvoria}
                      onChange={(e) => updateComparisonRow(idx, 'nexelvoria', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-indigo-200 bg-indigo-50/50 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-indigo-900"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 6. Campus & Infrastructure */}
      {activeSubSection === 'campus' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Campus Infrastructure Details</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Section Title</label>
              <input
                type="text"
                value={config.campus?.title || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    campus: {
                      ...config.campus,
                      title: e.target.value,
                      description: config.campus?.description || '',
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Description Narrative</label>
              <textarea
                rows={4}
                value={config.campus?.description || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    campus: {
                      ...config.campus,
                      description: e.target.value,
                      title: config.campus?.title || '',
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
