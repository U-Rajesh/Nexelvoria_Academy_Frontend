import React, { useState } from 'react';
import { Briefcase, CheckCircle2, Send, Laptop, ShieldCheck, Download } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { useNotification } from '../../context/NotificationContext';

export const CorporateTrainingPage: React.FC = () => {
  const [form, setForm] = useState({ company: '', name: '', email: '', phone: '', domain: '' });
  const { showToast } = useNotification();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      type: 'success',
      title: 'Corporate Training Inquiry Logged',
      message: 'Thank you! Our enterprise training director will get in touch with customized syllabi and sandbox quotes.',
    });
    setForm({ company: '', name: '', email: '', phone: '', domain: '' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="info" size="md">Enterprise Solutions</Badge>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Upskill Engineering Teams with Custom Cohorts
        </h1>
        <p className="text-slate-500 text-sm">
          Accelerate your workforce into modern cloud architectures, microservices migration, Kubernetes, and enterprise GenAI systems.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="p-6 space-y-3">
          <Laptop className="h-8 w-8 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">Dedicated Sandboxes</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every corporate cohort receives tailored AWS/GCP cloud environments pre-configured with project repositories and CI/CD pipelines.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <ShieldCheck className="h-8 w-8 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Customized Tech Stack</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            We adapt curriculum modules to mirror your company’s internal architectural patterns and proprietary internal APIs.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <Briefcase className="h-8 w-8 text-sky-600" />
          <h3 className="text-base font-bold text-slate-900">Outcome-Driven Milestones</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Real-time analytics reports delivered to engineering VPs on engineer attendance, test pass rates, and codebase contributions.
          </p>
        </Card>
      </div>

      {/* Inquiry Form */}
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
    </div>
  );
};

