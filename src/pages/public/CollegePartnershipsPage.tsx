import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Send, MapPin, Award } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { PageLabel } from '../../components/common/PageLabel';
import { Card } from '../../components/common/Card';
import { useNotification } from '../../context/NotificationContext';
import { cmsService, type CollegePartnershipConfig } from '../../services/cmsService';
import { ScrollReveal } from '../../components/public/ScrollReveal';

export const CollegePartnershipsPage: React.FC = () => {
  const [config, setConfig] = useState<CollegePartnershipConfig>(() => cmsService.getCollegePartnerships());

  useEffect(() => {
    const syncCollege = () => {
      setConfig(cmsService.getCollegePartnerships());
    };
    window.addEventListener('cms-update', syncCollege);
    window.addEventListener('app-storage-update', syncCollege);
    window.addEventListener('storage', syncCollege);
    return () => {
      window.removeEventListener('cms-update', syncCollege);
      window.removeEventListener('app-storage-update', syncCollege);
      window.removeEventListener('storage', syncCollege);
    };
  }, []);

  const [form, setForm] = useState({ college: '', contactPerson: '', email: '', phone: '', studentCount: '' });
  const { showToast } = useNotification();

  // Helper for college initials monogram
  const getInitials = (name: string) => {
    const words = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return (name.slice(0, 2) || 'CL').toUpperCase();
  };

  // Only active partnerships are displayed publicly
  const activePartners = useMemo(() => {
    const list = config.partners || config.partnerColleges || [];
    return list.filter((col) => col.status === 'active');
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cmsService.submitEnquiry({
      type: 'college_mou',
      name: form.contactPerson,
      email: form.email,
      phone: form.phone,
      collegeName: form.college,
      message: `Expected Batch Size: ${form.studentCount}`,
    });
    showToast({
      type: 'success',
      title: 'Partnership Inquiry Submitted',
      message: 'Thank you! Our Institutional Partnerships team will reach out with MoU guidelines and campus workshop schedules.',
    });
    setForm({ college: '', contactPerson: '', email: '', phone: '', studentCount: '' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
      {config.sectionVisibility.header && (
        <ScrollReveal animation="fade-up">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <PageLabel>Institutional Alliances</PageLabel>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              {config.header.title}
            </h1>
            <p className="text-slate-500 text-sm">
              {config.header.subtitle}
            </p>
          </div>
        </ScrollReveal>
      )}

      {/* 1. Partnered Institutions - Active Partnerships Only */}
      {config.sectionVisibility.partnerList && activePartners.length > 0 && (
        <ScrollReveal animation="fade-up" className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Partnered Institutions</h3>
            <p className="text-sm text-slate-500">
              Colleges and universities holding active training MoUs, Centers of Excellence, and direct placement pipelines with Nexelvoria.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activePartners.map((col) => {
              const hasLogo = Boolean(col.collegeLogo || col.logoUrl);
              const locationDisplay =
                col.city && col.state
                  ? `${col.city}, ${col.state}`
                  : col.city || col.state || col.location || '';

              return (
                <div
                  key={col.id}
                  className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Top Row: Logo & Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-14 w-14 rounded-xl bg-slate-50 border border-slate-200/80 p-1.5 flex items-center justify-center shrink-0 shadow-xs overflow-hidden group-hover:border-indigo-200 transition-colors">
                        {hasLogo ? (
                          <img
                            src={col.collegeLogo || col.logoUrl}
                            alt={col.collegeName}
                            className="max-h-11 max-w-11 object-contain transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback');
                              if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div
                          className={`logo-fallback h-full w-full rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-700 font-extrabold text-sm flex flex-col items-center justify-center border border-indigo-100 ${
                            hasLogo ? 'hidden' : ''
                          }`}
                        >
                          <span className="tracking-wider">{getInitials(col.collegeName)}</span>
                        </div>
                      </div>

                      {/* Active Status Badge */}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active MoU
                      </span>
                    </div>

                    {/* College Name & Location */}
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {col.collegeName}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{locationDisplay || 'Location Verified'}</span>
                        {col.mouYear && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>MoU Est. {col.mouYear}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {col.description || 'Institutional partnership agreement for student technical training, workshops, and campus placements.'}
                    </p>
                  </div>

                  {/* Partnership Types Tags */}
                  <div className="pt-4 mt-5 border-t border-slate-100">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Partnership Scope
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {col.partnershipTypes && col.partnershipTypes.length > 0 ? (
                        col.partnershipTypes.map((type, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50/80 text-indigo-700 border border-indigo-100/80"
                          >
                            <Award className="h-2.5 w-2.5 text-indigo-500" />
                            {type}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          Technical Training
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      )}

      {/* 2. Institutional MoU Inquiry Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Partnership Benefits */}
        {config.sectionVisibility.benefits && (
          <ScrollReveal animation="slide-left" className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Why Institutions Partner with Nexelvoria</h2>
            <div className="space-y-4 text-xs sm:text-sm text-slate-600">
              {config.benefits.map((b, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block mb-0.5">{b.title}</strong>
                    {b.desc}
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* Partnership Form */}
        {config.sectionVisibility.form && (
          <ScrollReveal animation="slide-right">
            <Card className="p-6 sm:p-8 shadow-lg">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Institutional MoU Inquiry</h3>
              <p className="text-xs text-slate-500 mb-6">Submit college details for custom curriculum and fee structures.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">College / University Name</label>
                  <input
                    type="text"
                    required
                    value={form.college}
                    onChange={(e) => setForm({ ...form, college: e.target.value })}
                    placeholder="e.g. Osmania University College of Engineering"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person & Designation</label>
                    <input
                      type="text"
                      required
                      value={form.contactPerson}
                      onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                      placeholder="e.g. Dr. Ramesh Kumar (TPO)"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email ID</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="tpo@college.edu.in"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Contact</label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="10-digit number"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Batch Size</label>
                    <select
                      value={form.studentCount}
                      onChange={(e) => setForm({ ...form, studentCount: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">Select size</option>
                      <option value="50-100">50 - 100 Students</option>
                      <option value="100-300">100 - 300 Students</option>
                      <option value="300+">300+ Students</option>
                    </select>
                  </div>
                </div>

                <Button variant="primary" size="md" type="submit" className="w-full mt-2" rightIcon={<Send className="h-4 w-4" />}>
                  Submit Partnership Request
                </Button>
              </form>
            </Card>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
};
