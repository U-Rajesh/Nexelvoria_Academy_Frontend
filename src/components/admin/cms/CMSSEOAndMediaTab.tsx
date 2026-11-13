import React, { useState } from 'react';
import {
  Search,
  Image,
  Copy,
  Plus,
  Trash2,
  ExternalLink,
  Save,
  RotateCcw,
  Check,
  Globe,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Badge } from '../../common/Badge';
import { Modal } from '../../feedback/Modal';
import { useNotification } from '../../../context/NotificationContext';
import {
  cmsService,
  type SEOConfig,
  type PageSEO,
  type MediaAsset,
} from '../../../services/cmsService';

const AVAILABLE_ROUTES = [
  { path: '/', label: 'Home Page (/)' },
  { path: '/about-us', label: 'About Us (/about-us)' },
  { path: '/courses', label: 'Courses Catalog (/courses)' },
  { path: '/placements', label: 'Placement Records (/placements)' },
  { path: '/trainers', label: 'Faculty & Mentors (/trainers)' },
  { path: '/testimonials', label: 'Student Testimonials (/testimonials)' },
  { path: '/achievements', label: 'Milestones & Hackathons (/achievements)' },
  { path: '/college-partnerships', label: 'College MoUs (/college-partnerships)' },
  { path: '/corporate-training', label: 'Corporate Training (/corporate-training)' },
  { path: '/blog', label: 'Engineering Blog (/blog)' },
  { path: '/faqs', label: 'Knowledge Base FAQs (/faqs)' },
  { path: '/careers', label: 'Careers at Academy (/careers)' },
  { path: '/contact-us', label: 'Contact & Admissions (/contact-us)' },
  { path: '/verify-certificate', label: 'Certificate Verification (/verify-certificate)' },
];

export const CMSSEOAndMediaTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'seo' | 'media'>('seo');
  const [seoConfig, setSeoConfig] = useState<SEOConfig>(() => cmsService.getSEOConfig());
  const [selectedRoute, setSelectedRoute] = useState<string>('/');
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(() => cmsService.getMediaAssets());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Media Modal
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [newAsset, setNewAsset] = useState<{ name: string; url: string; category: MediaAsset['category'] }>({
    name: '',
    url: '',
    category: 'avatar',
  });

  const { showToast } = useNotification();

  // Current page SEO object
  const currentSEO: PageSEO = seoConfig.pages[selectedRoute] || {
    route: selectedRoute,
    title: '',
    description: '',
    keywords: [],
    ogImage: '',
  };

  const handleUpdateCurrentSEO = (field: keyof PageSEO, val: any) => {
    const updatedPages = {
      ...seoConfig.pages,
      [selectedRoute]: {
        ...currentSEO,
        route: selectedRoute,
        [field]: val,
      },
    };
    setSeoConfig({ ...seoConfig, pages: updatedPages });
  };

  const handleSaveSEO = () => {
    cmsService.saveSEOConfig(seoConfig);
    showToast({
      type: 'success',
      title: 'SEO Metadata Saved',
      message: `Meta tags and OpenGraph headers for ${selectedRoute} updated.`,
    });
  };

  const handleResetSEO = () => {
    const def = cmsService.resetSEOConfig();
    setSeoConfig(def);
    showToast({ type: 'info', title: 'SEO Reset', message: 'Restored default SEO configuration.' });
  };

  const handleCopyUrl = (url: string, name: string) => {
    navigator.clipboard.writeText(url);
    showToast({
      type: 'success',
      title: 'Image URL Copied',
      message: `Direct link for "${name}" copied to clipboard.`,
    });
  };

  const handleSaveNewAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.name.trim() || !newAsset.url.trim()) {
      showToast({ type: 'warning', title: 'Validation Error', message: 'Name and URL are required.' });
      return;
    }

    const created: MediaAsset = {
      id: `media-${Date.now()}`,
      name: newAsset.name,
      url: newAsset.url,
      category: newAsset.category,
      createdAt: new Date().toISOString(),
    };

    cmsService.saveMediaAsset(created);
    setMediaAssets(cmsService.getMediaAssets());
    setMediaModalOpen(false);
    setNewAsset({ name: '', url: '', category: 'avatar' });
    showToast({ type: 'success', title: 'Media Asset Added', message: `${created.name} registered.` });
  };

  const handleDeleteAsset = (id: string, name: string) => {
    if (window.confirm(`Delete media asset "${name}"?`)) {
      cmsService.deleteMediaAsset(id);
      setMediaAssets(cmsService.getMediaAssets());
      showToast({ type: 'info', title: 'Asset Removed', message: `${name} deleted.` });
    }
  };

  const filteredMedia = selectedCategory === 'all'
    ? mediaAssets
    : mediaAssets.filter((m) => m.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Search className="h-5 w-5 text-indigo-600" />
            Page SEO Metadata & Central Media Asset Library
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Optimize Google Search visibility for all 14 routes and manage reusable images, logos, and badges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'seo' ? (
            <>
              <Button variant="outline" size="sm" onClick={handleResetSEO} leftIcon={<RotateCcw className="h-4 w-4 text-slate-400" />}>
                Reset Defaults
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveSEO} leftIcon={<Save className="h-4 w-4" />}>
                Save SEO Tags
              </Button>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setMediaModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
              Add Media Asset
            </Button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 text-xs border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('seo')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'seo' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Search className="h-3.5 w-3.5" />
          Page SEO & SERP Snippet
        </button>
        <button
          onClick={() => setActiveSubTab('media')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'media' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Image className="h-3.5 w-3.5" />
          Media Asset Manager ({mediaAssets.length} Assets)
        </button>
      </div>

      {/* 1. SEO Manager */}
      {activeSubTab === 'seo' && (
        <div className="space-y-6">
          {/* Route Selector Card */}
          <Card className="p-4 bg-slate-50 border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">Select Public Route to Optimize</label>
                <select
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  {AVAILABLE_ROUTES.map((r) => (
                    <option key={r.path} value={r.path}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-slate-500">
                Editing SEO for: <code className="bg-white px-2 py-1 rounded border border-slate-200 font-bold text-indigo-700">{selectedRoute}</code>
              </div>
            </div>
          </Card>

          {/* Form and SERP Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <Card className="p-6 space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900">Meta Tags & OpenGraph</h3>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Meta Title (50-60 characters)</label>
                <input
                  type="text"
                  value={currentSEO.title}
                  onChange={(e) => handleUpdateCurrentSEO('title', e.target.value)}
                  placeholder="e.g. Best Full Stack Java Cloud Training in Hyderabad"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Character count: {currentSEO.title.length}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Meta Description (140-160 characters)</label>
                <textarea
                  rows={3}
                  value={currentSEO.description}
                  onChange={(e) => handleUpdateCurrentSEO('description', e.target.value)}
                  placeholder="Write an enticing summary for Google search results..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Character count: {currentSEO.description.length}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Keywords (Comma-separated)</label>
                <input
                  type="text"
                  value={currentSEO.keywords.join(', ')}
                  onChange={(e) =>
                    handleUpdateCurrentSEO(
                      'keywords',
                      e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  placeholder="Full Stack Java, AWS Cloud, LMS, Coding Institute"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Social Share Image URL (og:image 1200x630)</label>
                <input
                  type="url"
                  value={currentSEO.ogImage || ''}
                  onChange={(e) => handleUpdateCurrentSEO('ogImage', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </Card>

            {/* Google Search Snippet Preview */}
            <div className="space-y-4">
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Globe className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Google Search Result Simulator
                  </h3>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1 font-sans">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="h-4 w-4 rounded-full bg-slate-900 text-white text-[9px] flex items-center justify-center font-bold">N</span>
                    <span className="truncate">nexelvoria.com{selectedRoute === '/' ? '' : selectedRoute}</span>
                  </div>
                  <h4 className="text-base font-medium text-blue-800 hover:underline cursor-pointer leading-snug">
                    {currentSEO.title ? `${currentSEO.title} | Nexelvoria Academy` : 'Nexelvoria Academy – Online Training Institute & LMS'}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {currentSEO.description ||
                      'Nexelvoria Academy - Premier online training institute offering full-stack Java, MERN, Cloud DevOps, and GenAI courses with LMS and placement assistance.'}
                  </p>
                </div>

                {/* Social Share Card Preview */}
                {currentSEO.ogImage && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Social Share Card Preview (og:image)
                    </span>
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={currentSEO.ogImage} alt="Social Card" className="w-full h-36 object-cover" />
                      <div className="p-3 bg-white space-y-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{currentSEO.title}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{currentSEO.description}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* 2. Media Asset Library */}
      {activeSubTab === 'media' && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 text-xs">
            {['all', 'avatar', 'banner', 'logo', 'course', 'campus'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-colors cursor-pointer ${
                  selectedCategory === cat ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Media Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMedia.map((asset) => (
              <Card key={asset.id} className="overflow-hidden group hover:shadow-md transition-shadow">
                <div className="relative h-32 w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded backdrop-blur-xs">
                    {asset.category}
                  </span>
                </div>

                <div className="p-3 space-y-2">
                  <p className="text-xs font-bold text-slate-900 truncate">{asset.name}</p>

                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyUrl(asset.url, asset.name)}
                      leftIcon={<Copy className="h-3 w-3" />}
                    >
                      Copy URL
                    </Button>

                    <div className="flex items-center gap-1">
                      <a
                        href={asset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => handleDeleteAsset(asset.id, asset.name)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Delete asset"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Media Modal */}
      <Modal isOpen={mediaModalOpen} onClose={() => setMediaModalOpen(false)} title="Register Media Asset">
        <form onSubmit={handleSaveNewAsset} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Asset Name / Title *</label>
            <input
              type="text"
              required
              value={newAsset.name}
              onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
              placeholder="e.g. Student Avatar 1, Cloud Architecture Diagram"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Direct Image URL *</label>
            <input
              type="url"
              required
              value={newAsset.url}
              onChange={(e) => setNewAsset({ ...newAsset, url: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Asset Category</label>
            <select
              value={newAsset.category}
              onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="avatar">Avatar / Student Photo</option>
              <option value="banner">Banner / Hero Background</option>
              <option value="logo">Company / Partner Logo</option>
              <option value="course">Course Thumbnail</option>
              <option value="campus">Campus / Office Photo</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setMediaModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Asset
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
