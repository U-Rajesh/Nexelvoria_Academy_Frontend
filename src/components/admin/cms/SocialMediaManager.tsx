import React, { useState, useEffect } from 'react';
import {
  Share2,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { Card } from '../../common/Card';
import { Modal } from '../../feedback/Modal';
import { ConfirmDialog } from '../../feedback/ConfirmDialog';
import { SocialIcon } from '../../common/SocialIcons';
import { useNotification } from '../../../context/NotificationContext';
import {
  cmsService,
  type SocialMediaLink,
  type SocialPlatformType,
} from '../../../services/cmsService';

const AVAILABLE_PLATFORMS: { key: SocialPlatformType; label: string; placeholder: string }[] = [
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/nexelvoria-academy' },
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/nexelvoria-academy' },
  { key: 'twitter', label: 'X (Twitter)', placeholder: 'https://x.com/nexelvoria' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@nexelvoria-academy' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/nexelvoria' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/nexelvoria' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/919876543210' },
  { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/nexelvoria' },
];

export interface SocialMediaManagerProps {
  title?: string;
  description?: string;
  highlightSection?: 'contact' | 'header-footer';
  onUpdated?: (links: SocialMediaLink[]) => void;
}

export const SocialMediaManager: React.FC<SocialMediaManagerProps> = ({
  title = 'Social Media Profiles & Channels',
  description = 'Manage official social profiles, profile URLs, and where they display across the Header, Footer, and Contact page.',
  highlightSection,
  onUpdated,
}) => {
  const { showToast } = useNotification();
  const [links, setLinks] = useState<SocialMediaLink[]>(() => cmsService.getSocialMediaLinks());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    platform: SocialPlatformType;
    platformName: string;
    url: string;
    isEnabled: boolean;
    showInHeader: boolean;
    showInFooter: boolean;
    showInContact: boolean;
  }>({
    platform: 'linkedin',
    platformName: 'LinkedIn',
    url: '',
    isEnabled: true,
    showInHeader: true,
    showInFooter: true,
    showInContact: true,
  });

  // Delete Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<SocialMediaLink | null>(null);

  // Listen to external CMS updates
  useEffect(() => {
    const handleSync = () => {
      const refreshed = cmsService.getSocialMediaLinks();
      setLinks(refreshed);
    };
    window.addEventListener('cms-social-update', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('cms-social-update', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const saveAndSync = (updated: SocialMediaLink[], toastMessage?: string) => {
    cmsService.saveSocialMediaLinks(updated);
    setLinks(updated);
    if (onUpdated) onUpdated(updated);
    if (toastMessage) {
      showToast({
        type: 'success',
        title: 'Social Links Updated',
        message: toastMessage,
      });
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      platform: 'linkedin',
      platformName: 'LinkedIn',
      url: '',
      isEnabled: true,
      showInHeader: highlightSection === 'header-footer',
      showInFooter: true,
      showInContact: highlightSection === 'contact',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: SocialMediaLink) => {
    setEditingId(item.id);
    setFormData({
      platform: item.platform,
      platformName: item.platformName || AVAILABLE_PLATFORMS.find((p) => p.key === item.platform)?.label || item.platform,
      url: item.url,
      isEnabled: item.isEnabled,
      showInHeader: item.showInHeader,
      showInFooter: item.showInFooter,
      showInContact: item.showInContact,
    });
    setIsModalOpen(true);
  };

  const handlePlatformChange = (pKey: string) => {
    const found = AVAILABLE_PLATFORMS.find((p) => p.key === pKey);
    setFormData({
      ...formData,
      platform: pKey as SocialPlatformType,
      platformName: found?.label || pKey,
      url: formData.url ? formData.url : (found?.placeholder || ''),
    });
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validation: platform must be selected
    if (!formData.platform) {
      showToast({
        type: 'warning',
        title: 'Platform Required',
        message: 'Please select a social media platform.',
      });
      return;
    }

    // 2. Validation: prevent empty URL
    const rawUrl = formData.url.trim();
    if (!rawUrl) {
      showToast({
        type: 'warning',
        title: 'URL Required',
        message: 'Please enter a valid social media profile URL.',
      });
      return;
    }

    // 3. Validation: valid URL structure
    let formattedUrl = rawUrl;
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      const parsed = new URL(formattedUrl);
      if (!parsed.hostname || !parsed.hostname.includes('.')) {
        throw new Error('Invalid host');
      }
    } catch {
      showToast({
        type: 'warning',
        title: 'Invalid URL Format',
        message: 'Please enter a valid web URL (e.g. https://linkedin.com/company/...)',
      });
      return;
    }

    // 4. Validation: prevent duplicate URL entries
    const normalizedTarget = formattedUrl.toLowerCase().replace(/\/+$/, '');
    const isDuplicate = links.some((l) => {
      if (editingId && l.id === editingId) return false;
      const existingNormalized = l.url.trim().toLowerCase().replace(/\/+$/, '');
      return existingNormalized === normalizedTarget;
    });

    if (isDuplicate) {
      showToast({
        type: 'warning',
        title: 'Duplicate Profile Entry',
        message: 'A social link with this profile URL already exists. Please enter a distinct profile URL.',
      });
      return;
    }

    // At least one location should preferably be checked
    const hasLocation = formData.showInHeader || formData.showInFooter || formData.showInContact;
    if (!hasLocation) {
      showToast({
        type: 'info',
        title: 'Notice: No Display Location',
        message: 'This link is saved but will not appear publicly until at least one location (Header, Footer, or Contact) is enabled.',
      });
    }

    if (editingId) {
      // Edit existing
      const updated = links.map((item) =>
        item.id === editingId
          ? {
              ...item,
              platform: formData.platform,
              platformName: formData.platformName,
              url: formattedUrl,
              isEnabled: formData.isEnabled,
              showInHeader: formData.showInHeader,
              showInFooter: formData.showInFooter,
              showInContact: formData.showInContact,
            }
          : item
      );
      saveAndSync(updated, `Updated "${formData.platformName}" social profile.`);
    } else {
      // Add new
      const newLink: SocialMediaLink = {
        id: `soc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        platform: formData.platform,
        platformName: formData.platformName,
        url: formattedUrl,
        isEnabled: formData.isEnabled,
        showInHeader: formData.showInHeader,
        showInFooter: formData.showInFooter,
        showInContact: formData.showInContact,
        order: links.length + 1,
      };
      saveAndSync([...links, newLink], `Added "${formData.platformName}" to social channels.`);
    }

    setIsModalOpen(false);
  };

  const handleToggleStatus = (link: SocialMediaLink) => {
    const nextState = !link.isEnabled;
    const updated = links.map((l) => (l.id === link.id ? { ...l, isEnabled: nextState } : l));
    saveAndSync(
      updated,
      `Social profile "${link.platformName || link.platform}" is now ${nextState ? 'Enabled (Public)' : 'Disabled (Hidden)'}.`
    );
  };

  const handleToggleLocation = (link: SocialMediaLink, locationKey: 'showInHeader' | 'showInFooter' | 'showInContact') => {
    const nextVal = !link[locationKey];
    const updated = links.map((l) => (l.id === link.id ? { ...l, [locationKey]: nextVal } : l));
    saveAndSync(updated);
  };

  const handlePromptDelete = (link: SocialMediaLink) => {
    setLinkToDelete(link);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!linkToDelete) return;
    const updated = links.filter((l) => l.id !== linkToDelete.id);
    saveAndSync(updated, `Removed "${linkToDelete.platformName || linkToDelete.platform}" profile link.`);
    setDeleteConfirmOpen(false);
    setLinkToDelete(null);
  };

  return (
    <Card className="p-6 space-y-5 bg-white border border-slate-200/90 shadow-xs">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                {title}
                <Badge variant="purple" size="sm">
                  {links.length} Configured
                </Badge>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenAddModal}
          leftIcon={<Plus className="h-3.5 w-3.5" />}
        >
          Add Social Platform
        </Button>
      </div>

      {/* Links List */}
      {links.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Share2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">No social media links configured yet</p>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
            Add official channels (LinkedIn, YouTube, X, Instagram, WhatsApp, etc.) to showcase across the website.
          </p>
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={handleOpenAddModal} leftIcon={<Plus className="h-3.5 w-3.5" />}>
              Add First Platform
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {links.map((item, index) => {
            const platformInfo = AVAILABLE_PLATFORMS.find((p) => p.key === item.platform);
            const displayName = item.platformName || platformInfo?.label || item.platform;

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  item.isEnabled
                    ? 'bg-white border-slate-200 shadow-xs hover:border-indigo-200'
                    : 'bg-slate-50/70 border-slate-200/60 opacity-70'
                }`}
              >
                {/* Platform Icon & URL info */}
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <span className="font-mono text-slate-400 text-xs w-5 text-center shrink-0">
                    {index + 1}.
                  </span>
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border ${
                      item.isEnabled
                        ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                  >
                    <SocialIcon platform={item.platform} size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">{displayName}</span>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 font-mono">
                        ({item.platform})
                      </span>
                      {item.isEnabled ? (
                        <Badge variant="success" size="sm" dot>
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Disabled
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-600 truncate font-mono max-w-md" title={item.url}>
                        {item.url}
                      </p>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open profile in new tab"
                          className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Display Locations & Quick Controls */}
                <div className="flex items-center justify-between md:justify-end gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                  {/* Locations checkboxes / badges */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleLocation(item, 'showInHeader')}
                      title="Click to toggle Header visibility"
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                        item.showInHeader
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Header: {item.showInHeader ? 'Yes' : 'No'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleLocation(item, 'showInFooter')}
                      title="Click to toggle Footer visibility"
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                        item.showInFooter
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Footer: {item.showInFooter ? 'Yes' : 'No'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleLocation(item, 'showInContact')}
                      title="Click to toggle Contact page visibility"
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                        item.showInContact
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Contact: {item.showInContact ? 'Yes' : 'No'}
                    </button>
                  </div>

                  {/* Actions: Toggle Active, Edit, Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item)}
                      title={item.isEnabled ? 'Disable Link' : 'Enable Link'}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        item.isEnabled
                          ? 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                          : 'text-slate-400 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {item.isEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      title="Edit Link"
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePromptDelete(item)}
                      title="Delete Link"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Social Media Link' : 'Add Social Media Link'}
        size="md"
      >
        <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
          {/* Platform selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Social Platform *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AVAILABLE_PLATFORMS.map((plat) => {
                const isSelected = formData.platform === plat.key;
                return (
                  <button
                    key={plat.key}
                    type="button"
                    onClick={() => handlePlatformChange(plat.key)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <SocialIcon platform={plat.key} size={16} />
                    <span className="truncate">{plat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Display Label */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Display Label (Optional)
            </label>
            <input
              type="text"
              value={formData.platformName}
              onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
              placeholder={AVAILABLE_PLATFORMS.find((p) => p.key === formData.platform)?.label || 'Platform Name'}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
            />
          </div>

          {/* Profile URL */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Profile / Page URL *
            </label>
            <input
              type="text"
              required
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder={
                AVAILABLE_PLATFORMS.find((p) => p.key === formData.platform)?.placeholder ||
                'https://platform.com/nexelvoria'
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-xs"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Enter the full profile URL including https:// (e.g., https://instagram.com/nexelvoria)
            </span>
          </div>

          {/* Target Locations */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="block font-semibold text-slate-700">
              Target Public Display Locations
            </label>
            <p className="text-[11px] text-slate-500">
              Select all website sections where this social media icon should appear:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  formData.showInHeader
                    ? 'bg-indigo-50/60 border-indigo-300 text-indigo-950 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.showInHeader}
                  onChange={(e) => setFormData({ ...formData, showInHeader: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs">Top Header Bar</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  formData.showInFooter
                    ? 'bg-indigo-50/60 border-indigo-300 text-indigo-950 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.showInFooter}
                  onChange={(e) => setFormData({ ...formData, showInFooter: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs">Website Footer</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  formData.showInContact
                    ? 'bg-indigo-50/60 border-indigo-300 text-indigo-950 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.showInContact}
                  onChange={(e) => setFormData({ ...formData, showInContact: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs">Contact Page</span>
              </label>
            </div>
          </div>

          {/* Enable / Disable toggle */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="block font-semibold text-slate-800">Public Visibility Status</span>
              <span className="text-[11px] text-slate-400">
                When enabled, link renders in configured locations. When disabled, it is safely hidden.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, isEnabled: !formData.isEnabled })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-xs transition-colors cursor-pointer ${
                formData.isEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {formData.isEnabled ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Enabled (Active)</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5 text-slate-400" />
                  <span>Disabled (Hidden)</span>
                </>
              )}
            </button>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingId ? 'Save Changes' : 'Add Social Link'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog for Deletion */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setLinkToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Removal of Social Media Link"
        message={`Are you sure you want to permanently delete the "${
          linkToDelete?.platformName || linkToDelete?.platform || 'selected'
        }" link? It will be removed immediately from the public Header, Footer, and Contact page.`}
        confirmLabel="Delete Link"
        cancelLabel="Keep Link"
        variant="danger"
      />
    </Card>
  );
};
