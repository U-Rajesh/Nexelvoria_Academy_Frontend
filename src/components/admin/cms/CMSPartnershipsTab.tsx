import React, { useState } from 'react';
import {
  School,
  Building2,
  Plus,
  Trash2,
  Edit,
  Save,
  RotateCcw,
  Handshake,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Badge } from '../../common/Badge';
import { Modal } from '../../feedback/Modal';
import { useNotification } from '../../../context/NotificationContext';
import {
  cmsService,
  type CollegePartnershipConfig,
  type CorporateTrainingConfig,
} from '../../../services/cmsService';

export const CMSPartnershipsTab: React.FC = () => {
  const [collegeConfig, setCollegeConfig] = useState<CollegePartnershipConfig>(() => cmsService.getCollegePartnerships());
  const [corpConfig, setCorpConfig] = useState<CorporateTrainingConfig>(() => cmsService.getCorporateTraining());
  const [activeSubTab, setActiveSubTab] = useState<'college' | 'corporate'>('college');

  // Modal for College Partner
  const [collegeModalOpen, setCollegeModalOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState<{ id?: string; name: string; location: string; mouYear: string; activeStudentsCount?: number } | null>(null);

  // Modal for Corporate Client
  const [corpModalOpen, setCorpModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<{ id?: string; name: string; logoUrl?: string } | null>(null);

  const { showToast } = useNotification();

  // Save College Config
  const handleSaveCollege = () => {
    cmsService.saveCollegePartnerships(collegeConfig);
    showToast({
      type: 'success',
      title: 'College MoU Config Saved',
      message: 'College partnerships page updated.',
    });
  };

  // Save Corporate Config
  const handleSaveCorp = () => {
    cmsService.saveCorporateTraining(corpConfig);
    showToast({
      type: 'success',
      title: 'Corporate Training Config Saved',
      message: 'Corporate training page updated.',
    });
  };

  // Add / Edit College
  const handleOpenAddCollege = () => {
    setEditingCollege({
      id: `col-${Date.now()}`,
      name: '',
      location: 'Hyderabad, Telangana',
      mouYear: '2026',
      activeStudentsCount: 150,
    });
    setCollegeModalOpen(true);
  };

  const handleSaveCollegeItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollege) return;
    if (!editingCollege.name.trim()) {
      showToast({ type: 'warning', title: 'Validation Error', message: 'College name is required.' });
      return;
    }

    const currentList = [...collegeConfig.partnerColleges];
    const existingIdx = currentList.findIndex((c) => c.name === editingCollege.name);
    if (existingIdx >= 0) {
      currentList[existingIdx] = editingCollege;
    } else {
      currentList.push(editingCollege);
    }

    const updated = { ...collegeConfig, partnerColleges: currentList };
    setCollegeConfig(updated);
    cmsService.saveCollegePartnerships(updated);
    setCollegeModalOpen(false);
    showToast({ type: 'success', title: 'College Partner Saved', message: `${editingCollege.name} added.` });
  };

  const handleDeleteCollegeItem = (name: string) => {
    const updated = {
      ...collegeConfig,
      partnerColleges: collegeConfig.partnerColleges.filter((c) => c.name !== name),
    };
    setCollegeConfig(updated);
    cmsService.saveCollegePartnerships(updated);
    showToast({ type: 'info', title: 'College Removed', message: `${name} removed from list.` });
  };

  // Add / Edit Corporate Client
  const handleOpenAddClient = () => {
    setEditingClient({
      id: `client-${Date.now()}`,
      name: '',
      logoUrl: '',
    });
    setCorpModalOpen(true);
  };

  const handleSaveClientItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    if (!editingClient.name.trim()) {
      showToast({ type: 'warning', title: 'Validation Error', message: 'Company name is required.' });
      return;
    }

    const currentList = [...corpConfig.clients];
    const existingIdx = currentList.findIndex((c) => c.name === editingClient.name);
    if (existingIdx >= 0) {
      currentList[existingIdx] = editingClient;
    } else {
      currentList.push(editingClient);
    }

    const updated = { ...corpConfig, clients: currentList };
    setCorpConfig(updated);
    cmsService.saveCorporateTraining(updated);
    setCorpModalOpen(false);
    showToast({ type: 'success', title: 'Corporate Client Saved', message: `${editingClient.name} added.` });
  };

  const handleDeleteClientItem = (name: string) => {
    const updated = {
      ...corpConfig,
      clients: corpConfig.clients.filter((c) => c.name !== name),
    };
    setCorpConfig(updated);
    cmsService.saveCorporateTraining(updated);
    showToast({ type: 'info', title: 'Client Removed', message: `${name} removed from list.` });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Handshake className="h-5 w-5 text-indigo-600" />
            Institutional MoUs & Corporate Upskilling Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure partner colleges, university MoUs, enterprise client cohorts, and syllabus offerings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'college' ? (
            <Button variant="primary" size="sm" onClick={handleSaveCollege} leftIcon={<Save className="h-4 w-4" />}>
              Save College Config
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleSaveCorp} leftIcon={<Save className="h-4 w-4" />}>
              Save Corporate Config
            </Button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 text-xs border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('college')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'college' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <School className="h-3.5 w-3.5" />
          College & University MoUs ({collegeConfig.partnerColleges.length} Colleges)
        </button>
        <button
          onClick={() => setActiveSubTab('corporate')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'corporate' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          Corporate Upskilling & Clients ({corpConfig.clients.length} Enterprises)
        </button>
      </div>

      {/* College Tab Content */}
      {activeSubTab === 'college' && (
        <div className="space-y-6">
          {/* Visibility Toggles */}
          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Page Section Visibility</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['header', 'benefits', 'form', 'partnerList'] as const).map((key) => (
                <label key={key} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={collegeConfig.sectionVisibility[key]}
                    onChange={(e) =>
                      setCollegeConfig({
                        ...collegeConfig,
                        sectionVisibility: { ...collegeConfig.sectionVisibility, [key]: e.target.checked },
                      })
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-700 capitalize">{key}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* Header & Benefits */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Header & Value Proposition</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Page Title</label>
                <input
                  type="text"
                  value={collegeConfig.header.title}
                  onChange={(e) => setCollegeConfig({ ...collegeConfig, header: { ...collegeConfig.header, title: e.target.value } })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={collegeConfig.header.subtitle}
                  onChange={(e) => setCollegeConfig({ ...collegeConfig, header: { ...collegeConfig.header, subtitle: e.target.value } })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-800 mb-2">3 Core Institutional Benefits</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {collegeConfig.benefits.map((b, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-xs">
                    <input
                      type="text"
                      value={b.title}
                      onChange={(e) => {
                        const updated = [...collegeConfig.benefits];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        setCollegeConfig({ ...collegeConfig, benefits: updated });
                      }}
                      className="w-full px-2 py-1 border border-slate-200 rounded font-bold text-xs"
                    />
                    <textarea
                      rows={3}
                      value={b.desc}
                      onChange={(e) => {
                        const updated = [...collegeConfig.benefits];
                        updated[idx] = { ...updated[idx], desc: e.target.value };
                        setCollegeConfig({ ...collegeConfig, benefits: updated });
                      }}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Partnered Colleges Table */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Partnered Colleges & Engineering Institutions</h3>
                <p className="text-xs text-slate-500">Colleges featured on the public website with active institutional agreements.</p>
              </div>
              <Button variant="primary" size="sm" onClick={handleOpenAddCollege} leftIcon={<Plus className="h-3.5 w-3.5" />}>
                Add College
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {collegeConfig.partnerColleges.map((col, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-xs">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{col.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{col.location} • MoU: {col.mouYear}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteCollegeItem(col.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Remove College"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Corporate Tab Content */}
      {activeSubTab === 'corporate' && (
        <div className="space-y-6">
          {/* Visibility Toggles */}
          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Page Section Visibility</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['header', 'offerings', 'form', 'clients'] as const).map((key) => (
                <label key={key} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={corpConfig.sectionVisibility[key]}
                    onChange={(e) =>
                      setCorpConfig({
                        ...corpConfig,
                        sectionVisibility: { ...corpConfig.sectionVisibility, [key]: e.target.checked },
                      })
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-700 capitalize">{key}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* Header & Offerings */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Header & Solution Offerings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Page Title</label>
                <input
                  type="text"
                  value={corpConfig.header.title}
                  onChange={(e) => setCorpConfig({ ...corpConfig, header: { ...corpConfig.header, title: e.target.value } })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={corpConfig.header.subtitle}
                  onChange={(e) => setCorpConfig({ ...corpConfig, header: { ...corpConfig.header, subtitle: e.target.value } })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-800 mb-2">3 Enterprise Training Offerings</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {corpConfig.offerings.map((off, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-xs">
                    <input
                      type="text"
                      value={off.title}
                      onChange={(e) => {
                        const updated = [...corpConfig.offerings];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        setCorpConfig({ ...corpConfig, offerings: updated });
                      }}
                      className="w-full px-2 py-1 border border-slate-200 rounded font-bold text-xs"
                    />
                    <textarea
                      rows={3}
                      value={off.desc}
                      onChange={(e) => {
                        const updated = [...corpConfig.offerings];
                        updated[idx] = { ...updated[idx], desc: e.target.value };
                        setCorpConfig({ ...corpConfig, offerings: updated });
                      }}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Corporate Clients List */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Corporate Clients & Enterprise Roster</h3>
                <p className="text-xs text-slate-500">Enterprises displayed as trusted corporate upskilling partners.</p>
              </div>
              <Button variant="primary" size="sm" onClick={handleOpenAddClient} leftIcon={<Plus className="h-3.5 w-3.5" />}>
                Add Client
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {corpConfig.clients.map((cli, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 truncate">{cli.name || cli.companyName}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteClientItem(cli.name || cli.companyName || '')}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer shrink-0"
                    title="Remove Client"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* College Modal */}
      <Modal isOpen={collegeModalOpen} onClose={() => setCollegeModalOpen(false)} title="Add Partner College">
        {editingCollege && (
          <form onSubmit={handleSaveCollegeItem} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">College / University Name *</label>
              <input
                type="text"
                required
                value={editingCollege.name}
                onChange={(e) => setEditingCollege({ ...editingCollege, name: e.target.value })}
                placeholder="e.g. Osmania University College of Engineering"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campus Location</label>
                <input
                  type="text"
                  value={editingCollege.location}
                  onChange={(e) => setEditingCollege({ ...editingCollege, location: e.target.value })}
                  placeholder="e.g. Hyderabad, Telangana"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">MoU Year</label>
                <input
                  type="text"
                  value={editingCollege.mouYear}
                  onChange={(e) => setEditingCollege({ ...editingCollege, mouYear: e.target.value })}
                  placeholder="2026"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setCollegeModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save College
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Corporate Modal */}
      <Modal isOpen={corpModalOpen} onClose={() => setCorpModalOpen(false)} title="Add Corporate Client">
        {editingClient && (
          <form onSubmit={handleSaveClientItem} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company / Enterprise Name *</label>
              <input
                type="text"
                required
                value={editingClient.name}
                onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                placeholder="e.g. Infosys, Wipro, Tech Mahindra"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setCorpModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save Client
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
