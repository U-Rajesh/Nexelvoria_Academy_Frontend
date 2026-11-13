import React, { useState } from 'react';
import { Briefcase, CheckCircle2, Send, Laptop, ShieldCheck, Download, Building2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { PageLabel } from '../../components/common/PageLabel';
import { Card } from '../../components/common/Card';
import { useNotification } from '../../context/NotificationContext';
import { cmsService, type CorporateTrainingConfig } from '../../services/cmsService';
import { ScrollReveal } from '../../components/public/ScrollReveal';

export const CorporateTrainingPage: React.FC = () => {
  const [config] = useState<CorporateTrainingConfig>(() => cmsService.getCorporateTraining());
  const [form, setForm] = useState({ company: '', name: '', email: '', phone: '', domain: '' });
  const { showToast } = useNotification();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cmsService.submitEnquiry({
      type: 'corporate_training',
      name: form.name,
      email: form.email,
      phone: form.phone,
      companyName: form.company,
      courseOfInterest: form.domain,
      message: `Corporate inquiry for domain: ${form.domain}`,
    });
    showToast({
      type: 'success',
      title: 'Corporate Training Inquiry Logged',
      message: 'Thank you! Our enterprise training director will get in touch with customized syllabi and sandbox quotes.',
    });
    setForm({ company: '', name: '', email: '', phone: '', domain: '' });
  };

  const renderOfferingIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck className="h-8 w-8 text-emerald-600" />;
      case 'Briefcase':
        return <Briefcase className="h-8 w-8 text-sky-600" />;
      case 'Laptop':
      default:
        return <Laptop className="h-8 w-8 text-indigo-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
      {config.sectionVisibility.header && (
        <ScrollReveal animation="fade-up">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <PageLabel>Enterprise Solutions</PageLabel>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              {config.header.title}
            </h1>
            <p className="text-slate-500 text-sm">
              {config.header.subtitle}
            </p>
          </div>
        </ScrollReveal>
      )}

      {config.sectionVisibility.offerings && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {config.offerings.map((offering, idx) => (
            <ScrollReveal key={idx} animation="scale-in" delay={idx * 100}>
              <Card className="p-6 space-y-3 h-full">
                {renderOfferingIcon(offering.icon || offering.iconName || 'Laptop')}
                <h3 className="text-base font-bold text-slate-900">{offering.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {offering.desc}
                </p>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      )}

      {/* Inquiry Form */}
      {config.sectionVisibility.form && (
        <ScrollReveal animation="fade-up">
          <Card className="max-w-2xl mx-auto p-8 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Request Corporate Brochure & Demo</h3>
            <p className="text-xs text-slate-500 mb-6">Talk to our Enterprise Account Managers.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    required
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="e.g. Acme Tech Corp"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Vikramaditya (Director of Eng)"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="vikram@acmetech.com"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Mobile number"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Domain of Interest</label>
                <select
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Select Domain</option>
                  <option value="Java Microservices">Java 21 & Distributed Microservices</option>
                  <option value="DevOps & K8s">Cloud DevOps, Terraform & Kubernetes</option>
                  <option value="GenAI">Generative AI, LangChain & LLM Ops</option>
                  <option value="Full Stack">Full Stack TypeScript & Modern Frontend</option>
                </select>
              </div>

              <Button variant="primary" size="md" type="submit" className="w-full" rightIcon={<Send className="h-4 w-4" />}>
                Connect with Corporate Solutions
              </Button>
            </form>
          </Card>
        </ScrollReveal>
      )}

      {/* Enterprise Clients Showcase */}
      {config.sectionVisibility.clients && config.clients && config.clients.length > 0 && (
        <ScrollReveal animation="fade-up" className="space-y-6 pt-4">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="text-xl font-bold text-slate-900">Trusted by Engineering Teams</h3>
            <p className="text-xs text-slate-500">Enterprises that have scaled their technical capacity with Nexelvoria custom cohorts.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {config.clients.map((client, idx) => (
              <div key={idx} className="px-5 py-3 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">{client.name || client.companyName}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
};
