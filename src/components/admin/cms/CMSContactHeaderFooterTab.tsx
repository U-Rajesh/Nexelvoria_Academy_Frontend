import React, { useState } from 'react';
import {
  Phone,
  Globe,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { useNotification } from '../../../context/NotificationContext';
import {
  cmsService,
  type ContactInfoConfig,
  type HeaderFooterConfig,
} from '../../../services/cmsService';
import { SocialMediaManager } from './SocialMediaManager';

export const CMSContactHeaderFooterTab: React.FC = () => {
  const [contactConfig, setContactConfig] = useState<ContactInfoConfig>(() => cmsService.getContactInfo());
  const [headerFooterConfig, setHeaderFooterConfig] = useState<HeaderFooterConfig>(() => cmsService.getHeaderFooterConfig());
  const [activeSection, setActiveSection] = useState<'contact' | 'header-footer'>('contact');

  const { showToast } = useNotification();

  const handleSaveContact = () => {
    cmsService.saveContactInfo(contactConfig);
    showToast({
      type: 'success',
      title: 'Contact Info Saved',
      message: 'Support phone, email, WhatsApp, and campus address updated across public pages.',
    });
  };

  const handleResetContact = () => {
    const def = cmsService.resetContactInfo();
    setContactConfig(def);
    showToast({ type: 'info', title: 'Contact Reset', message: 'Contact settings restored to defaults.' });
  };

  const handleSaveHeaderFooter = () => {
    cmsService.saveHeaderFooterConfig(headerFooterConfig);
    showToast({
      type: 'success',
      title: 'Header & Footer Saved',
      message: 'Navbar links, logo labels, and footer description updated.',
    });
  };

  const handleResetHeaderFooter = () => {
    const def = cmsService.resetHeaderFooterConfig();
    setHeaderFooterConfig(def);
    showToast({ type: 'info', title: 'Header/Footer Reset', message: 'Restored to defaults.' });
  };

  const handleAddNavLink = () => {
    setHeaderFooterConfig({
      ...headerFooterConfig,
      navLinks: [
        ...headerFooterConfig.navLinks,
        { label: 'New Link', path: '/' },
      ],
    });
  };

  const handleUpdateNavLink = (idx: number, field: 'label' | 'path', val: string) => {
    const updated = [...headerFooterConfig.navLinks];
    updated[idx] = { ...updated[idx], [field]: val };
    setHeaderFooterConfig({ ...headerFooterConfig, navLinks: updated });
  };

  const handleDeleteNavLink = (idx: number) => {
    setHeaderFooterConfig({
      ...headerFooterConfig,
      navLinks: headerFooterConfig.navLinks.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-600" />
            Contact Information, Campus Hub, Header & Footer Controls
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure admissions numbers, WhatsApp desk, office address, navbar routes, and global copyright notices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSection === 'contact' ? (
            <>
              <Button variant="outline" size="sm" onClick={handleResetContact} leftIcon={<RotateCcw className="h-4 w-4 text-slate-400" />}>
                Reset
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveContact} leftIcon={<Save className="h-4 w-4" />}>
                Save Contact Info
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleResetHeaderFooter} leftIcon={<RotateCcw className="h-4 w-4 text-slate-400" />}>
                Reset
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveHeaderFooter} leftIcon={<Save className="h-4 w-4" />}>
                Save Header & Footer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 text-xs border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSection('contact')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSection === 'contact' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Phone className="h-3.5 w-3.5" />
          Contact Info & Campus Hub (Contact Management)
        </button>
        <button
          onClick={() => setActiveSection('header-footer')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSection === 'header-footer' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          Navbar Links & Global Footer (Header/Footer Management)
        </button>
      </div>

      {/* 1. Contact Info Form */}
      {activeSection === 'contact' && (
        <>
        <Card className="p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Admissions Helplines & Physical Address</h3>
            <p className="text-xs text-slate-500">These details appear on /contact-us, top bar, and footer.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Admissions Support Phone *</label>
                <input
                  type="text"
                  required
                  value={contactConfig.supportPhone}
                  onChange={(e) => setContactConfig({ ...contactConfig, supportPhone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Support Email *</label>
                <input
                  type="email"
                  required
                  value={contactConfig.supportEmail}
                  onChange={(e) => setContactConfig({ ...contactConfig, supportEmail: e.target.value })}
                  placeholder="admissions@nexelvoria.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">WhatsApp Admissions Desk Number *</label>
                <input
                  type="text"
                  required
                  value={contactConfig.whatsappNumber}
                  onChange={(e) => setContactConfig({ ...contactConfig, whatsappNumber: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Powers the floating WhatsApp action button.</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nearest Metro Landmark</label>
                <input
                  type="text"
                  value={contactConfig.nearestMetro || ''}
                  onChange={(e) => setContactConfig({ ...contactConfig, nearestMetro: e.target.value })}
                  placeholder="e.g. Cyber Towers Metro Station"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Campus Physical Address *</label>
              <textarea
                rows={2}
                required
                value={contactConfig.address}
                onChange={(e) => setContactConfig({ ...contactConfig, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operating Hours Notice</label>
                <input
                  type="text"
                  value={contactConfig.operatingHours}
                  onChange={(e) => setContactConfig({ ...contactConfig, operatingHours: e.target.value })}
                  placeholder="Mon – Sat: 9:00 AM – 7:00 PM IST"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Response Turnaround Time</label>
                <input
                  type="text"
                  value={contactConfig.turnaroundTime}
                  onChange={(e) => setContactConfig({ ...contactConfig, turnaroundTime: e.target.value })}
                  placeholder="within 4 business hours"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Social Media Manager for Contact Section */}
        <SocialMediaManager
          title="Social Media Channels & Profiles"
          description="Manage official social media platforms, URLs, and display locations across Header, Footer, and Contact page."
          highlightSection="contact"
        />
        </>
      )}

      {/* 2. Header & Footer Form */}
      {activeSection === 'header-footer' && (
        <>
        <Card className="p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Header Branding & Global Navigation Links</h3>
            <p className="text-xs text-slate-500">Configure navbar routes and footer boilerplate statements.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Logo Brand Title *</label>
                <input
                  type="text"
                  value={headerFooterConfig.logoTitle}
                  onChange={(e) => setHeaderFooterConfig({ ...headerFooterConfig, logoTitle: e.target.value })}
                  placeholder="Nexelvoria"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Logo Subtitle *</label>
                <input
                  type="text"
                  value={headerFooterConfig.logoSubtitle}
                  onChange={(e) => setHeaderFooterConfig({ ...headerFooterConfig, logoSubtitle: e.target.value })}
                  placeholder="Online Training & LMS"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Nav Links Manager */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="font-bold text-slate-900 block">Navbar Navigation Links ({headerFooterConfig.navLinks.length})</label>
                <Button variant="outline" size="sm" onClick={handleAddNavLink} leftIcon={<Plus className="h-3 w-3" />}>
                  Add Nav Link
                </Button>
              </div>

              <div className="space-y-2">
                {headerFooterConfig.navLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                    <span className="font-mono text-slate-400 text-xs w-6">{idx + 1}.</span>
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => handleUpdateNavLink(idx, 'label', e.target.value)}
                      placeholder="Label"
                      className="w-1/3 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold"
                    />
                    <input
                      type="text"
                      value={link.path}
                      onChange={(e) => handleUpdateNavLink(idx, 'path', e.target.value)}
                      placeholder="/route"
                      className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                    />
                    <button
                      onClick={() => handleDeleteNavLink(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="Remove Link"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Description & Copyright */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Footer About Paragraph</label>
                <textarea
                  rows={3}
                  value={headerFooterConfig.footerDescription}
                  onChange={(e) => setHeaderFooterConfig({ ...headerFooterConfig, footerDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Footer Copyright Notice</label>
                <input
                  type="text"
                  value={headerFooterConfig.copyrightText}
                  onChange={(e) => setHeaderFooterConfig({ ...headerFooterConfig, copyrightText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Social Media Manager for Header & Footer */}
        <SocialMediaManager
          title="Header & Footer Social Media Channels"
          description="Configure which social channels are surfaced in the top Header utility bar and bottom Website Footer."
          highlightSection="header-footer"
        />
        </>
      )}
    </div>
  );
};
