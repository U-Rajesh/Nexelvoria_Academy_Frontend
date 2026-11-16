import React, { useState, useEffect, useMemo } from 'react';
import {
  School,
  Building2,
  Plus,
  Trash2,
  Edit,
  Save,
  Handshake,
  CheckCircle2,
  MapPin,
  Upload,
  X,
  Search,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Modal } from '../../feedback/Modal';
import { useNotification } from '../../../context/NotificationContext';
import {
  cmsService,
  type CollegePartnershipConfig,
  type CollegePartnership,
  type PartnershipType,
  type CorporateTrainingConfig,
} from '../../../services/cmsService';
import { CMSCorporateTrainingTab } from './CMSCorporateTrainingTab';

const AVAILABLE_PARTNERSHIP_TYPES: PartnershipType[] = [
  'Placement Support',
  'Training',
  'Internships',
  'Skill Development',
  'Faculty Development (FDP)',
  'Curriculum Design',
];

export const CMSPartnershipsTab: React.FC = () => {
  const [collegeConfig, setCollegeConfig] = useState<CollegePartnershipConfig>(() => cmsService.getCollegePartnerships());
  const [corpConfig, setCorpConfig] = useState<CorporateTrainingConfig>(() => cmsService.getCorporateTraining());
  const [activeSubTab, setActiveSubTab] = useState<'college' | 'corporate'>('college');
  const [isSaving, setIsSaving] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'review'>('all');

  // Modal for College Partner
  const [collegeModalOpen, setCollegeModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCollege, setEditingCollege] = useState<CollegePartnership | null>(null);

  // Modal for Corporate Client
  const [corpModalOpen, setCorpModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<{ id?: string; name: string; logoUrl?: string } | null>(null);

  const { showToast } = useNotification();

  // Storage synchronization listener
  useEffect(() => {
    const handleSync = () => {
      setCollegeConfig(cmsService.getCollegePartnerships());
    };
    window.addEventListener('cms-update', handleSync);
    window.addEventListener('app-storage-update', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('cms-update', handleSync);
      window.removeEventListener('app-storage-update', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Save College Config (Header, benefits, visibility - never clobbering partners)
  const handleSaveCollege = () => {
    setIsSaving(true);
    const res = cmsService.saveCollegePageSettings({
      header: collegeConfig.header,
      benefits: collegeConfig.benefits,
      sectionVisibility: collegeConfig.sectionVisibility,
    });
    setIsSaving(false);

    if (!res.success) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: res.error || 'Failed to save page configuration.',
      });
      return;
    }

    setCollegeConfig(res.data);
    showToast({
      type: 'success',
      title: 'College MoU Config Saved',
      message: 'College partnerships page configuration saved.',
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

  // Open Add College Modal
  const handleOpenAddCollege = () => {
    setIsEditing(false);
    setEditingCollege({
      id: `col-${Date.now()}`,
      collegeName: '',
      name: '',
      collegeLogo: '',
      logoUrl: '',
      city: '',
      state: '',
      partnershipTypes: ['Training', 'Placement Support'],
      description: '',
      status: 'active',
      mouYear: String(new Date().getFullYear()),
      activeStudentsCount: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setCollegeModalOpen(true);
  };

  // Open Edit College Modal
  const handleOpenEditCollege = (col: CollegePartnership) => {
    setIsEditing(true);
    setEditingCollege({
      ...col,
      collegeName: col.collegeName || col.name || '',
      collegeLogo: col.collegeLogo || col.logoUrl || '',
      city: col.city || '',
      state: col.state || '',
      partnershipTypes: col.partnershipTypes || ['Training'],
      description: col.description || '',
      status: col.status || 'active',
    });
    setCollegeModalOpen(true);
  };

  // Handle Logo Upload from Local Device (Client-side downscaling to prevent LocalStorage quota overflow)
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast({ type: 'warning', title: 'Invalid File', message: 'Please select a valid image file (PNG, JPG, SVG, WebP).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast({ type: 'warning', title: 'File Too Large', message: 'Logo file size must be less than 5MB.' });
      return;
    }

    // For SVGs, read as data URL directly without canvas rasterization
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setEditingCollege((prev) =>
            prev ? { ...prev, collegeLogo: event.target!.result as string, logoUrl: event.target!.result as string } : null
          );
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    // For raster images (PNG, JPG, WebP), compress to max 200x200 to prevent LocalStorage quota overflow
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result;
      if (typeof rawDataUrl !== 'string') return;

      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/webp', 0.8) || canvas.toDataURL('image/png');
            setEditingCollege((prev) =>
              prev ? { ...prev, collegeLogo: compressed, logoUrl: compressed } : null
            );
          } else {
            setEditingCollege((prev) =>
              prev ? { ...prev, collegeLogo: rawDataUrl, logoUrl: rawDataUrl } : null
            );
          }
        } catch {
          setEditingCollege((prev) =>
            prev ? { ...prev, collegeLogo: rawDataUrl, logoUrl: rawDataUrl } : null
          );
        }
      };
      img.onerror = () => {
        setEditingCollege((prev) =>
          prev ? { ...prev, collegeLogo: rawDataUrl, logoUrl: rawDataUrl } : null
        );
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Toggle a Partnership Type in the modal
  const handleTogglePartnershipType = (type: PartnershipType) => {
    if (!editingCollege) return;
    const current = editingCollege.partnershipTypes || [];
    const exists = current.includes(type);
    const updated = exists ? current.filter((t) => t !== type) : [...current, type];
    setEditingCollege({ ...editingCollege, partnershipTypes: updated });
  };

  // Save College Item (Create or Update with validation)
  const handleSaveCollegeItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollege) return;

    const trimmedName = editingCollege.collegeName.trim();
    if (!trimmedName) {
      showToast({ type: 'warning', title: 'Validation Error', message: 'College name is required.' });
      return;
    }

    if (!editingCollege.description.trim()) {
      showToast({ type: 'warning', title: 'Validation Error', message: 'Partnership description is required.' });
      return;
    }

    if (!editingCollege.partnershipTypes || editingCollege.partnershipTypes.length === 0) {
      showToast({ type: 'warning', title: 'Validation Error', message: 'Please select at least one partnership type.' });
      return;
    }

    const payload: CollegePartnership = {
      ...editingCollege,
      collegeName: trimmedName,
      name: trimmedName,
      city: editingCollege.city.trim(),
      state: editingCollege.state.trim(),
      location: [editingCollege.city.trim(), editingCollege.state.trim()].filter(Boolean).join(', '),
      description: editingCollege.description.trim(),
      needsReview: false,
      updatedAt: new Date().toISOString(),
    };

    setIsSaving(true);
    const res = cmsService.saveCollegePartner(payload);
    setIsSaving(false);

    if (!res.success) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: res.error || 'Failed to save partnership record.',
      });
      return;
    }

    const refreshed = cmsService.getCollegePartnerships();
    setCollegeConfig(refreshed);
    setCollegeModalOpen(false);

    showToast({
      type: 'success',
      title: isEditing ? 'Partnership Updated' : 'Partnership Added',
      message: `${payload.collegeName} has been saved successfully.`,
    });
  };

  // Quick Toggle Active / Inactive Status
  const handleToggleStatus = (id: string, name: string, currentStatus: 'active' | 'inactive') => {
    const res = cmsService.toggleCollegePartnerStatus(id);
    if (!res.success) {
      showToast({
        type: 'error',
        title: 'Status Update Failed',
        message: res.error || 'Could not update partnership status.',
      });
      return;
    }
    const refreshed = cmsService.getCollegePartnerships();
    setCollegeConfig(refreshed);
    const nextStatus = currentStatus === 'active' ? 'Inactive' : 'Active';
    showToast({
      type: 'info',
      title: 'Status Updated',
      message: `"${name}" is now marked as ${nextStatus}.`,
    });
  };

  // Delete College
  const handleDeleteCollegeItem = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from partnered colleges?`)) {
      const res = cmsService.deleteCollegePartner(id);
      if (!res.success) {
        showToast({
          type: 'error',
          title: 'Deletion Failed',
          message: res.error || 'Could not delete college partnership.',
        });
        return;
      }
      const refreshed = cmsService.getCollegePartnerships();
      setCollegeConfig(refreshed);
      showToast({ type: 'info', title: 'College Removed', message: `${name} removed from list.` });
    }
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

  // Helper for college initials monogram
  const getInitials = (name: string) => {
    const words = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return (name.slice(0, 2) || 'CL').toUpperCase();
  };

  // Filtered colleges list
  const filteredColleges = useMemo(() => {
    const list = collegeConfig.partners || collegeConfig.partnerColleges || [];
    return list.filter((col) => {
      // Status filter
      if (statusFilter === 'active' && col.status !== 'active') return false;
      if (statusFilter === 'inactive' && col.status !== 'inactive') return false;
      if (statusFilter === 'review' && !col.needsReview) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (col.collegeName || col.name || '').toLowerCase().includes(q);
        const matchesCity = (col.city || '').toLowerCase().includes(q);
        const matchesState = (col.state || '').toLowerCase().includes(q);
        const matchesDesc = (col.description || '').toLowerCase().includes(q);
        const matchesTypes = (col.partnershipTypes || []).some((t) => t.toLowerCase().includes(q));
        return matchesName || matchesCity || matchesState || matchesDesc || matchesTypes;
      }
      return true;
    });
  }, [collegeConfig, statusFilter, searchQuery]);

  const allColleges = collegeConfig.partners || collegeConfig.partnerColleges || [];
  const activeCount = allColleges.filter((c) => c.status === 'active').length;
  const inactiveCount = allColleges.filter((c) => c.status === 'inactive').length;
  const reviewCount = allColleges.filter((c) => c.needsReview).length;

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
            Configure partnered colleges, university MoUs, enterprise client cohorts, and syllabus offerings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'college' ? (
            <Button variant="primary" size="sm" onClick={handleSaveCollege} disabled={isSaving} leftIcon={<Save className="h-4 w-4" />}>
              {isSaving ? 'Saving...' : 'Save Page Settings'}
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
            activeSubTab === 'college'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <School className="h-3.5 w-3.5" />
          College & University MoUs ({allColleges.length} Colleges)
        </button>
        <button
          onClick={() => setActiveSubTab('corporate')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'corporate'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          Corporate Upskilling & Clients ({corpConfig.clients.length} Enterprises)
        </button>
      </div>

      {/* College Tab Content */}
      {activeSubTab === 'college' && (
        <div className="space-y-6">
          {/* Section Visibility Toggles */}
          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Page Section Visibility</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['header', 'benefits', 'form', 'partnerList'] as const).map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer text-xs"
                >
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
                  onChange={(e) =>
                    setCollegeConfig({ ...collegeConfig, header: { ...collegeConfig.header, title: e.target.value } })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={collegeConfig.header.subtitle}
                  onChange={(e) =>
                    setCollegeConfig({ ...collegeConfig, header: { ...collegeConfig.header, subtitle: e.target.value } })
                  }
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

          {/* Partnered Colleges Management Card */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Partnered Colleges & Engineering Institutions</h3>
                <p className="text-xs text-slate-500">
                  Manage college partnerships, official logos, locations, partnership types, and public display status.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAddCollege}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
              >
                Add College Partnership
              </Button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  All ({allColleges.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                    statusFilter === 'active'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-slate-200'
                  }`}
                >
                  <Eye className="h-3 w-3" /> Active ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('inactive')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                    statusFilter === 'inactive'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <EyeOff className="h-3 w-3" /> Inactive ({inactiveCount})
                </button>
                {reviewCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('review')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                      statusFilter === 'review'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-amber-700 hover:bg-amber-50 border border-slate-200'
                    }`}
                  >
                    <AlertCircle className="h-3 w-3" /> Needs Review ({reviewCount})
                  </button>
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search college, city, type..."
                  className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Colleges Grid */}
            {filteredColleges.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-100 p-6 space-y-2">
                <School className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Partnerships Match Filter</p>
                <p className="text-[11px] text-slate-400">Try adjusting your search query or status filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {filteredColleges.map((col) => {
                  const isActive = col.status === 'active';
                  const hasLogo = Boolean(col.collegeLogo || col.logoUrl);
                  const locationDisplay =
                    col.city && col.state
                      ? `${col.city}, ${col.state}`
                      : col.city || col.state || col.location || '';

                  return (
                    <div
                      key={col.id}
                      className={`p-4 rounded-xl border transition-shadow bg-white flex flex-col justify-between space-y-3 ${
                        isActive
                          ? 'border-slate-200 shadow-xs hover:shadow-md'
                          : 'border-slate-200/60 bg-slate-50/50 opacity-90'
                      }`}
                    >
                      <div>
                        {/* Top Row: Logo, Title, and Status Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            {/* Logo with Monogram Fallback */}
                            <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                              {hasLogo ? (
                                <img
                                  src={col.collegeLogo || col.logoUrl}
                                  alt={col.collegeName}
                                  className="max-h-10 max-w-10 object-contain"
                                  onError={(e) => {
                                    // Fallback to monogram if image link breaks
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback');
                                    if (fallback) fallback.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div
                                className={`logo-fallback h-full w-full rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs flex flex-col items-center justify-center ${
                                  hasLogo ? 'hidden' : ''
                                }`}
                              >
                                <span>{getInitials(col.collegeName)}</span>
                              </div>
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                                {col.collegeName}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>{locationDisplay || 'Location not specified'}</span>
                                {col.mouYear && <span>• MoU {col.mouYear}</span>}
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="shrink-0">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <Check className="h-2.5 w-2.5" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                Inactive
                              </span>
                            )}
                            {col.needsReview && (
                              <span className="block mt-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 text-center">
                                Needs Review
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-600 leading-relaxed mt-2.5 line-clamp-2">
                          {col.description || 'No partnership description provided.'}
                        </p>

                        {/* Partnership Types Tags */}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {(col.partnershipTypes || ['Training']).map((type, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[10px] font-semibold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(col.id, col.collegeName, col.status)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                            isActive
                              ? 'text-slate-600 border-slate-200 hover:bg-slate-100'
                              : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          {isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          {isActive ? 'Mark Inactive' : 'Set Active'}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2.5"
                            onClick={() => handleOpenEditCollege(col)}
                            leftIcon={<Edit className="h-3 w-3" />}
                          >
                            Edit
                          </Button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCollegeItem(col.id, col.collegeName)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete partnership"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Corporate Tab Content */}
      {activeSubTab === 'corporate' && (
        <CMSCorporateTrainingTab />
      )}

      {/* College Add / Edit Modal (Complete 6-Field Management) */}
      <Modal
        isOpen={collegeModalOpen}
        onClose={() => setCollegeModalOpen(false)}
        title={isEditing ? 'Edit College Partnership' : 'Add Partner College'}
      >
        {editingCollege && (
          <form onSubmit={handleSaveCollegeItem} className="space-y-4 text-xs">
            {/* 1. College Name */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">College / University Name *</label>
              <input
                type="text"
                required
                value={editingCollege.collegeName}
                onChange={(e) => setEditingCollege({ ...editingCollege, collegeName: e.target.value })}
                placeholder="e.g. Osmania University College of Engineering"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* 2. College Logo (URL + Upload + Live Fallback Preview) */}
            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block font-semibold text-slate-700">Official College Logo</label>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                  {editingCollege.collegeLogo ? (
                    <img
                      src={editingCollege.collegeLogo}
                      alt="Logo preview"
                      className="max-h-12 max-w-12 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.modal-logo-fallback');
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div
                    className={`modal-logo-fallback h-full w-full rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs flex flex-col items-center justify-center ${
                      editingCollege.collegeLogo ? 'hidden' : ''
                    }`}
                  >
                    <span>{getInitials(editingCollege.collegeName || 'CL')}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-1.5">
                  <input
                    type="url"
                    value={editingCollege.collegeLogo}
                    onChange={(e) => setEditingCollege({ ...editingCollege, collegeLogo: e.target.value })}
                    placeholder="Enter official logo image URL (https://...)"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-[11px]"
                  />
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs">
                      <Upload className="h-3 w-3 text-indigo-600" /> Upload from Computer
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleLogoFileUpload}
                        className="hidden"
                      />
                    </label>
                    {editingCollege.collegeLogo && (
                      <button
                        type="button"
                        onClick={() => setEditingCollege({ ...editingCollege, collegeLogo: '' })}
                        className="text-[11px] text-slate-500 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer"
                      >
                        <X className="h-3 w-3" /> Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                A clean fallback emblem with the college's initials will automatically display if no logo is provided or if the link is inaccessible.
              </p>
            </div>

            {/* 3. Location (City and State - Not automatically assumed) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campus City</label>
                <input
                  type="text"
                  value={editingCollege.city}
                  onChange={(e) => setEditingCollege({ ...editingCollege, city: e.target.value })}
                  placeholder="e.g. Hyderabad, Bengaluru, Pune"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={editingCollege.state}
                  onChange={(e) => setEditingCollege({ ...editingCollege, state: e.target.value })}
                  placeholder="e.g. Telangana, Karnataka"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 4. Partnership Types (Multi-select Pills) */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Partnership Types * (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_PARTNERSHIP_TYPES.map((type) => {
                  const isSelected = (editingCollege.partnershipTypes || []).includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleTogglePartnershipType(type)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors border flex items-center gap-1 ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Description */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Partnership Description *</label>
              <textarea
                required
                rows={3}
                value={editingCollege.description}
                onChange={(e) => setEditingCollege({ ...editingCollege, description: e.target.value })}
                placeholder="Brief summary of the partnership, training focus, campus recruitment drives, or joint initiatives..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* 6. Partnership Status (Active / Inactive) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block font-semibold text-slate-700">Partnership Status *</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="partnershipStatus"
                    value="active"
                    checked={editingCollege.status === 'active'}
                    onChange={() => setEditingCollege({ ...editingCollege, status: 'active' })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Active (Visible on Public Website)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="partnershipStatus"
                    value="inactive"
                    checked={editingCollege.status === 'inactive'}
                    onChange={() => setEditingCollege({ ...editingCollege, status: 'inactive' })}
                    className="text-slate-600 focus:ring-slate-500"
                  />
                  <span className="text-xs font-semibold text-slate-600">
                    Inactive (Hidden from Public Website)
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setCollegeModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Partnership'}
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
