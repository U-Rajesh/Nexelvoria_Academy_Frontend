import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Sliders,
  Play,
  RotateCcw,
  Save,
  CheckCircle2,
  Pause,
} from 'lucide-react';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Badge } from '../../common/Badge';
import { Modal } from '../../feedback/Modal';
import { useNotification } from '../../../context/NotificationContext';
import {
  cmsService,
  type HiringPartnerCompany,
  type MarqueeAnimationConfig,
} from '../../../services/cmsService';
import { HiringPartnersMarquee } from '../../public/HiringPartnersMarquee';

const LOGO_PRESETS = [
  { label: 'Google', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg' },
  { label: 'Amazon', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg' },
  { label: 'Microsoft', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg' },
  { label: 'Oracle', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/oracle/oracle-original.svg' },
  { label: 'Salesforce', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/salesforce/salesforce-original.svg' },
  { label: 'Docker', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' },
  { label: 'Kubernetes', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg' },
  { label: 'GitHub', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg' },
  { label: 'GitLab', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/gitlab/gitlab-original.svg' },
  { label: 'RedHat', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redhat/redhat-original.svg' },
];

export const CMSHiringPartnersTab: React.FC = () => {
  const [partners, setPartners] = useState<HiringPartnerCompany[]>(() => cmsService.getHiringPartners());
  const [marqueeConfig, setMarqueeConfig] = useState<MarqueeAnimationConfig>(() => cmsService.getMarqueeConfig());
  const [activeView, setActiveView] = useState<'partners' | 'animation' | 'preview'>('partners');

  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<HiringPartnerCompany | null>(null);

  const { showToast } = useNotification();

  const handleOpenAddPartner = () => {
    setEditingPartner({
      id: `partner-${Date.now()}`,
      name: '',
      logoUrl: LOGO_PRESETS[0].url,
      websiteUrl: 'https://example.com',
      location: 'Hyderabad / Bengaluru',
      activeOpenings: 5,
      displayOrder: partners.length + 1,
      isActive: true,
    });
    setPartnerModalOpen(true);
  };

  const handleOpenEditPartner = (p: HiringPartnerCompany) => {
    setEditingPartner({ ...p });
    setPartnerModalOpen(true);
  };

  const handleSavePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    if (!editingPartner.name.trim() || !(editingPartner.logoUrl || '').trim()) {
      showToast({
        type: 'warning',
        title: 'Validation Error',
        message: 'Partner name and logo URL are required.',
      });
      return;
    }

    cmsService.saveHiringPartner(editingPartner);
    setPartners(cmsService.getHiringPartners());
    setPartnerModalOpen(false);
    showToast({
      type: 'success',
      title: 'Hiring Partner Saved',
      message: `${editingPartner.name} updated in the hiring network.`,
    });
  };

  const handleDeletePartner = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from hiring partners?`)) {
      cmsService.deleteHiringPartner(id);
      setPartners(cmsService.getHiringPartners());
      showToast({
        type: 'info',
        title: 'Partner Removed',
        message: `${name} has been removed.`,
      });
    }
  };

  const handleTogglePartnerActive = (id: string) => {
    const target = partners.find((p) => p.id === id);
    if (!target) return;
    const updated = { ...target, isActive: !target.isActive };
    cmsService.saveHiringPartner(updated);
    setPartners(cmsService.getHiringPartners());
    showToast({
      type: 'success',
      title: 'Status Updated',
      message: `${target.name} is now ${updated.isActive ? 'Active' : 'Hidden'}.`,
    });
  };

  const handleSaveMarqueeConfig = () => {
    cmsService.saveMarqueeConfig(marqueeConfig);
    showToast({
      type: 'success',
      title: 'Marquee Settings Saved',
      message: 'Continuous marquee scroll settings applied across public website.',
    });
  };

  const handleResetMarquee = () => {
    const def = cmsService.resetMarqueeConfig();
    setMarqueeConfig(def);
    showToast({
      type: 'info',
      title: 'Settings Reset',
      message: 'Marquee settings restored to defaults.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            Hiring Partners & Continuous Marquee Animation Controls
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage partner enterprise logos, active openings, row count, speeds, and scroll directions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeView === 'partners' && (
            <Button variant="primary" size="sm" onClick={handleOpenAddPartner} leftIcon={<Plus className="h-4 w-4" />}>
              Add Hiring Partner
            </Button>
          )}
          {activeView === 'animation' && (
            <>
              <Button variant="outline" size="sm" onClick={handleResetMarquee} leftIcon={<RotateCcw className="h-4 w-4 text-slate-400" />}>
                Reset
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveMarqueeConfig} leftIcon={<Save className="h-4 w-4" />}>
                Save Settings
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Sub-view Navigation */}
      <div className="flex gap-2 text-xs border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveView('partners')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeView === 'partners' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          Partner Companies ({partners.length})
        </button>
        <button
          onClick={() => setActiveView('animation')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeView === 'animation' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          Marquee Animation Controls
        </button>
        <button
          onClick={() => setActiveView('preview')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeView === 'preview' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Play className="h-3.5 w-3.5" />
          Live Marquee Preview
        </button>
      </div>

      {/* 1. Partners Table */}
      {activeView === 'partners' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <th className="p-3.5 font-bold">Logo & Company</th>
                  <th className="p-3.5 font-bold">Location</th>
                  <th className="p-3.5 font-bold">Active Openings</th>
                  <th className="p-3.5 font-bold">Display Order</th>
                  <th className="p-3.5 font-bold">Status</th>
                  <th className="p-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partners.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                          <img src={p.logoUrl} alt={p.name} className="max-h-7 max-w-7 object-contain" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{p.name}</p>
                          {p.websiteUrl && (
                            <a
                              href={p.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1"
                            >
                              Visit Website <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600">{p.location || 'Pan-India'}</td>
                    <td className="p-3.5">
                      <Badge variant="purple" size="sm">
                        {p.activeOpenings ?? 5} Openings
                      </Badge>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">#{p.displayOrder ?? 1}</td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleTogglePartnerActive(p.id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          p.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {p.isActive !== false ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEditPartner(p)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Partner"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePartner(p.id, p.name)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Partner"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 2. Marquee Animation Settings */}
      {activeView === 'animation' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Continuous Logo Marquee Controls</h3>
            <p className="text-xs text-slate-500">Fine-tune the animation behavior, row count, velocity, and hover pauses.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* General Toggles */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <span className="font-bold text-slate-900 text-xs block">Display & Velocity</span>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Enable Marquee on Website</p>
                  <p className="text-[11px] text-slate-500">When disabled, the hiring partners section is hidden.</p>
                </div>
                <input
                  type="checkbox"
                  checked={marqueeConfig.isEnabled}
                  onChange={(e) => setMarqueeConfig({ ...marqueeConfig, isEnabled: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Row Configuration</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMarqueeConfig({ ...marqueeConfig, rowCount: 1 })}
                    className={`p-2 rounded-lg border font-bold text-center cursor-pointer ${
                      marqueeConfig.rowCount === 1 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    1 Single Row
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarqueeConfig({ ...marqueeConfig, rowCount: 2 })}
                    className={`p-2 rounded-lg border font-bold text-center cursor-pointer ${
                      marqueeConfig.rowCount === 2 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    2 Rows (Alternating)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scroll Velocity</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['slow', 'normal', 'fast'] as const).map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setMarqueeConfig({ ...marqueeConfig, speed: spd })}
                      className={`p-2 rounded-lg border font-bold text-center capitalize cursor-pointer ${
                        marqueeConfig.speed === spd ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {spd} ({spd === 'slow' ? '45s' : spd === 'normal' ? '30s' : '18s'})
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div>
                  <p className="font-bold text-slate-900">Pause on Cursor Hover</p>
                  <p className="text-[11px] text-slate-500">Halts scrolling when a user moves cursor over logos.</p>
                </div>
                <input
                  type="checkbox"
                  checked={marqueeConfig.pauseOnHover}
                  onChange={(e) => setMarqueeConfig({ ...marqueeConfig, pauseOnHover: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                />
              </div>
            </div>

            {/* Directional Configuration */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <span className="font-bold text-slate-900 text-xs block">Scroll Directions</span>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Row 1 Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMarqueeConfig({ ...marqueeConfig, directionRow1: 'left' })}
                    className={`p-2 rounded-lg border font-bold text-center cursor-pointer ${
                      marqueeConfig.directionRow1 === 'left' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    ← Leftward
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarqueeConfig({ ...marqueeConfig, directionRow1: 'right' })}
                    className={`p-2 rounded-lg border font-bold text-center cursor-pointer ${
                      marqueeConfig.directionRow1 === 'right' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Rightward →
                  </button>
                </div>
              </div>

              {marqueeConfig.rowCount === 2 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Row 2 Direction</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMarqueeConfig({ ...marqueeConfig, directionRow2: 'left' })}
                      className={`p-2 rounded-lg border font-bold text-center cursor-pointer ${
                        marqueeConfig.directionRow2 === 'left' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      ← Leftward
                    </button>
                    <button
                      type="button"
                      onClick={() => setMarqueeConfig({ ...marqueeConfig, directionRow2: 'right' })}
                      className={`p-2 rounded-lg border font-bold text-center cursor-pointer ${
                        marqueeConfig.directionRow2 === 'right' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      Rightward →
                    </button>
                  </div>
                </div>
              )}

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Tip:</strong> Dual rows with alternating directions (Row 1 Left, Row 2 Right) provide the smoothest visual rhythm on high-resolution displays.
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 3. Live Preview */}
      {activeView === 'preview' && (
        <Card className="p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Live Marquee Rendering</h3>
              <p className="text-xs text-slate-500">Interactive preview of how the marquee animates right now with current active partners.</p>
            </div>
            <Badge variant="purple" size="md">
              {marqueeConfig.rowCount} Row{marqueeConfig.rowCount > 1 ? 's' : ''} • {marqueeConfig.speed} speed
            </Badge>
          </div>

          <div className="py-6 bg-slate-50/50 rounded-xl border border-slate-200">
            <HiringPartnersMarquee />
          </div>
        </Card>
      )}

      {/* Partner Add/Edit Modal */}
      <Modal
        isOpen={partnerModalOpen}
        onClose={() => setPartnerModalOpen(false)}
        title={editingPartner?.id && partners.some((p) => p.id === editingPartner.id) ? 'Edit Hiring Partner' : 'Add New Hiring Partner'}
      >
        {editingPartner && (
          <form onSubmit={handleSavePartner} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={editingPartner.name}
                onChange={(e) => setEditingPartner({ ...editingPartner, name: e.target.value })}
                placeholder="e.g. Snowflake, Atlassian"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Logo URL *</label>
              <input
                type="url"
                required
                value={editingPartner.logoUrl}
                onChange={(e) => setEditingPartner({ ...editingPartner, logoUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>

            {/* Logo Presets Quick-Select */}
            <div>
              <label className="block font-semibold text-slate-600 mb-1.5">Or choose a preset logo:</label>
              <div className="flex flex-wrap gap-2">
                {LOGO_PRESETS.map((lp) => (
                  <button
                    key={lp.label}
                    type="button"
                    onClick={() => setEditingPartner({ ...editingPartner, logoUrl: lp.url, name: editingPartner.name || lp.label })}
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-medium cursor-pointer"
                  >
                    {lp.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Careers / Website URL</label>
                <input
                  type="url"
                  value={editingPartner.websiteUrl || ''}
                  onChange={(e) => setEditingPartner({ ...editingPartner, websiteUrl: e.target.value })}
                  placeholder="https://company.com/careers"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Hiring Office</label>
                <input
                  type="text"
                  value={editingPartner.location || ''}
                  onChange={(e) => setEditingPartner({ ...editingPartner, location: e.target.value })}
                  placeholder="e.g. Hyderabad / Bengaluru"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Active Alumni Openings</label>
                <input
                  type="number"
                  min={0}
                  value={editingPartner.activeOpenings ?? 5}
                  onChange={(e) => setEditingPartner({ ...editingPartner, activeOpenings: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Order Priority</label>
                <input
                  type="number"
                  min={1}
                  value={editingPartner.displayOrder ?? 1}
                  onChange={(e) => setEditingPartner({ ...editingPartner, displayOrder: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="partnerActive"
                checked={editingPartner.isActive !== false}
                onChange={(e) => setEditingPartner({ ...editingPartner, isActive: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="partnerActive" className="font-semibold text-slate-700 cursor-pointer">
                Publish this partner in continuous marquee
              </label>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setPartnerModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save Partner
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
