import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Send,
  Laptop,
  ShieldCheck,
  Building2,
  Users,
  TrendingUp,
  Wrench,
  Sliders,
  GraduationCap,
  Code,
  Terminal,
  Cpu,
  Layers,
  Globe,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { PageLabel } from '../../components/common/PageLabel';
import { Card } from '../../components/common/Card';
import { useNotification } from '../../context/NotificationContext';
import {
  cmsService,
  type CorporateTrainingConfig,
  type CorporateTrainingService,
} from '../../services/cmsService';
import { ScrollReveal } from '../../components/public/ScrollReveal';

export const CorporateTrainingPage: React.FC = () => {
  const [config, setConfig] = useState<CorporateTrainingConfig>(() => cmsService.getCorporateTraining());
  const [form, setForm] = useState({ company: '', name: '', email: '', phone: '', domain: '' });
  const { showToast } = useNotification();

  useEffect(() => {
    const syncCorp = () => {
      setConfig(cmsService.getCorporateTraining());
    };
    window.addEventListener('cms-update', syncCorp);
    window.addEventListener('app-storage-update', syncCorp);
    window.addEventListener('storage', syncCorp);
    return () => {
      window.removeEventListener('cms-update', syncCorp);
      window.removeEventListener('app-storage-update', syncCorp);
      window.removeEventListener('storage', syncCorp);
    };
  }, []);

  // Filter Active Services only, sorted by displayOrder
  const activeServices: CorporateTrainingService[] = useMemo(() => {
    const allServices = Array.isArray(config.services) ? config.services : [];
    return allServices
      .filter((service) => service.status === 'active')
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [config.services]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sent = await cmsService.submitEnquiry({
      type: 'corporate_training',
      name: form.name,
      email: form.email,
      phone: form.phone,
      companyName: form.company,
      courseOfInterest: form.domain,
      message: `Corporate inquiry for domain: ${form.domain}`,
    });
    if (!sent.success) {
      showToast({ type: 'error', title: 'Not sent', message: sent.error || 'Your request could not be sent. Please try again.' });
      return;
    }
    showToast({
      type: 'success',
      title: 'Corporate Training Inquiry Logged',
      message: 'Thank you! Our enterprise training director will get in touch with customized syllabi and sandbox quotes.',
    });
    setForm({ company: '', name: '', email: '', phone: '', domain: '' });
  };

  const renderServiceIcon = (iconName: string) => {
    if (iconName?.startsWith('data:') || iconName?.startsWith('http')) {
      return (
        <img
          src={iconName}
          alt="Service Graphic"
          className="h-7 w-7 object-contain rounded-md"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      );
    }

    switch (iconName) {
      case 'Users':
        return <Users className="h-6 w-6 text-sky-600 group-hover:text-white transition-colors" />;
      case 'TrendingUp':
        return <TrendingUp className="h-6 w-6 text-emerald-600 group-hover:text-white transition-colors" />;
      case 'Wrench':
        return <Wrench className="h-6 w-6 text-amber-600 group-hover:text-white transition-colors" />;
      case 'Sliders':
        return <Sliders className="h-6 w-6 text-indigo-600 group-hover:text-white transition-colors" />;
      case 'GraduationCap':
        return <GraduationCap className="h-6 w-6 text-purple-600 group-hover:text-white transition-colors" />;
      case 'Briefcase':
        return <Briefcase className="h-6 w-6 text-sky-600 group-hover:text-white transition-colors" />;
      case 'ShieldCheck':
        return <ShieldCheck className="h-6 w-6 text-emerald-600 group-hover:text-white transition-colors" />;
      case 'Code':
        return <Code className="h-6 w-6 text-indigo-600 group-hover:text-white transition-colors" />;
      case 'Terminal':
        return <Terminal className="h-6 w-6 text-indigo-600 group-hover:text-white transition-colors" />;
      case 'Cpu':
        return <Cpu className="h-6 w-6 text-indigo-600 group-hover:text-white transition-colors" />;
      case 'Layers':
        return <Layers className="h-6 w-6 text-indigo-600 group-hover:text-white transition-colors" />;
      case 'Globe':
        return <Globe className="h-6 w-6 text-sky-600 group-hover:text-white transition-colors" />;
      case 'Sparkles':
        return <Sparkles className="h-6 w-6 text-amber-600 group-hover:text-white transition-colors" />;
      case 'Laptop':
      default:
        return <Laptop className="h-6 w-6 text-indigo-600 group-hover:text-white transition-colors" />;
    }
  };

  const isServicesSectionVisible =
    config.sectionVisibility?.services !== false &&
    config.sectionVisibility?.offerings !== false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
      {/* 1. Header Section */}
      {config.sectionVisibility?.header !== false && (
        <ScrollReveal animation="fade-up">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <PageLabel>{config.header?.badgeText || 'Enterprise Solutions'}</PageLabel>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
              {config.header?.title || 'Upskill Engineering Teams with Custom Cohorts'}
            </h1>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
              {config.header?.subtitle ||
                'Accelerate your workforce into modern cloud architectures, microservices migration, Kubernetes, and enterprise GenAI systems.'}
            </p>
          </div>
        </ScrollReveal>
      )}

      {/* 2. Corporate Training Services Grid */}
      {isServicesSectionVisible && (
        <div className="space-y-6">
          {activeServices.length === 0 ? (
            <ScrollReveal animation="fade-up">
              <div className="text-center py-14 px-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 max-w-2xl mx-auto space-y-3">
                <Building2 className="h-10 w-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No Corporate Training Programs Currently Listed</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Our enterprise solutions directors are currently refreshing our public training catalog. Please use the form below to request custom cohort schedules and corporate syllabi.
                </p>
              </div>
            </ScrollReveal>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeServices.map((service, idx) => (
                <ScrollReveal key={service.id || idx} animation="scale-in" delay={idx * 80}>
                  <Card className="p-7 flex flex-col justify-between h-full border border-slate-200/90 hover:border-indigo-400 hover:shadow-xl transition-all duration-300 group bg-white rounded-2xl">
                    <div className="space-y-4">
                      {/* Card Header: Icon & Program Number */}
                      <div className="flex items-center justify-between">
                        <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 transition-colors shadow-xs">
                          {renderServiceIcon(service.icon)}
                        </div>
                        <span className="px-2.5 py-1 text-[11px] font-bold font-mono text-indigo-700 bg-indigo-50/80 rounded-full border border-indigo-100">
                          Program 0{idx + 1}
                        </span>
                      </div>

                      {/* Title & Short Description */}
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {service.title}
                        </h3>
                        <p className="text-xs font-semibold text-indigo-900/80 mt-1 leading-snug">
                          {service.shortDescription}
                        </p>
                      </div>

                      {/* Full Detailed Description */}
                      {service.fullDescription && (
                        <p className="text-xs text-slate-500 leading-relaxed pt-1">
                          {service.fullDescription}
                        </p>
                      )}

                      {/* Topics / Technologies Tags */}
                      {service.topics && service.topics.length > 0 && (
                        <div className="pt-3 border-t border-slate-100">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
                            Key Technologies & Focus Areas
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {service.topics.map((topic, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200/60"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Inquiry Form */}
      {config.sectionVisibility?.form !== false && (
        <ScrollReveal animation="fade-up">
          <Card className="max-w-2xl mx-auto p-8 shadow-xl border-slate-200 rounded-2xl">
            <div className="text-center sm:text-left mb-6">
              <h3 className="text-xl font-bold text-slate-900">Request Corporate Brochure & Sandbox Demo</h3>
              <p className="text-xs text-slate-500 mt-1">
                Connect with our Enterprise Solutions Directors for customized curricula and cohort pricing.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization *</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name *</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email *</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Training Track of Interest</label>
                <select
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Select Training Track</option>
                  <option value="Technical Training">Technical Training (Java, Python, React, .NET)</option>
                  <option value="Soft Skills Training">Soft Skills Training (Communication, Leadership, Teamwork)</option>
                  <option value="Employee Skill Development">Employee Skill Development (Role Transitions & Upskilling)</option>
                  <option value="Corporate Workshops">Corporate Workshops (GenAI, DevOps & Cloud Labs)</option>
                  <option value="Customized Training Programs">Customized Enterprise Programs</option>
                  <option value="Placement & Internship Training">Placement & Graduate Trainee Enablement</option>
                </select>
              </div>

              <Button
                variant="primary"
                size="md"
                type="submit"
                className="w-full"
                rightIcon={<Send className="h-4 w-4" />}
              >
                Connect with Corporate Solutions
              </Button>
            </form>
          </Card>
        </ScrollReveal>
      )}

      {/* 4. Enterprise Clients Showcase */}
      {config.sectionVisibility?.clients !== false && config.clients && config.clients.length > 0 && (
        <ScrollReveal animation="fade-up" className="space-y-6 pt-4">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="text-xl font-bold text-slate-900">Trusted by Engineering Teams</h3>
            <p className="text-xs text-slate-500">
              Enterprises that have scaled their technical capacity with Nexelvoria custom cohorts.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {config.clients.map((client, idx) => (
              <div
                key={idx}
                className="px-5 py-3 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-2 hover:border-slate-300 transition-colors"
              >
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
