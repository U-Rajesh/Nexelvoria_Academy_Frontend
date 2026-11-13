import React, { useState } from 'react';
import { School, Handshake, CheckCircle2, Send, Building2, Users } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { useNotification } from '../../context/NotificationContext';
import { cmsService, type CollegePartnershipConfig } from '../../services/cmsService';
import { ScrollReveal } from '../../components/public/ScrollReveal';

export const CollegePartnershipsPage: React.FC = () => {
  const [config] = useState<CollegePartnershipConfig>(() => cmsService.getCollegePartnerships());
  const [form, setForm] = useState({ college: '', contactPerson: '', email: '', phone: '', studentCount: '' });
  const { showToast } = useNotification();

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
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <Badge variant="purple" size="md">Institutional Alliances</Badge>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              {config.header.title}
            </h1>
            <p className="text-slate-500 text-sm">
              {config.header.subtitle}
            </p>
          </div>
        </ScrollReveal>
      )}

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

      {/* Partnered Colleges Showcase */}
      {config.sectionVisibility.partnerList && config.partnerColleges && config.partnerColleges.length > 0 && (
        <ScrollReveal animation="fade-up" className="space-y-6 pt-4">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="text-xl font-bold text-slate-900">Partnered Institutions</h3>
            <p className="text-xs text-slate-500">Colleges that have active training MoUs and center-of-excellence setups with Nexelvoria.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {config.partnerColleges.map((col, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <School className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{col.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{col.location} • {col.mouYear}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
};
