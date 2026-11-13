import React, { useState } from 'react';
import { MapPin, Clock, CheckCircle2, Award, Users, HeartHandshake } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { PageLabel } from '../../components/common/PageLabel';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import { SEO } from '../../components/common/SEO';
import { useNotification } from '../../context/NotificationContext';
import { cmsService, type CareerOpening } from '../../services/cmsService';
import { analytics } from '../../utils/analytics';

export const CareersPage: React.FC = () => {
  const [openings] = useState<CareerOpening[]>(() => cmsService.getCareers());
  const [selectedJob, setSelectedJob] = useState<CareerOpening | null>(null);
  const [applyModalJob, setApplyModalJob] = useState<CareerOpening | null>(null);
  const [applicationForm, setApplicationForm] = useState({
    name: '',
    email: '',
    phone: '',
    linkedIn: '',
    experience: '',
    resumeLink: '',
    coverNote: '',
  });

  const { showToast } = useNotification();

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyModalJob) return;

    cmsService.submitEnquiry({
      type: 'general',
      name: applicationForm.name,
      email: applicationForm.email,
      phone: applicationForm.phone,
      message: `[Job Application: ${applyModalJob.title}] Exp: ${applicationForm.experience} | Resume: ${applicationForm.resumeLink} | LinkedIn: ${applicationForm.linkedIn} | Note: ${applicationForm.coverNote}`,
    });
    analytics.trackEvent('submit_job_application', 'Career', applyModalJob.title);

    showToast({
      type: 'success',
      title: 'Application Submitted',
      message: `Thank you ${applicationForm.name}! Your application for "${applyModalJob.title}" has been received by our faculty recruitment team.`,
    });
    setApplyModalJob(null);
    setApplicationForm({ name: '', email: '', phone: '', linkedIn: '', experience: '', resumeLink: '', coverNote: '' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
      <SEO
        title="Careers at Nexelvoria – Faculty & Leadership Roles"
        description="Join Nexelvoria Academy as a technical instructor, distributed systems mentor, curriculum designer, or corporate relations manager."
        keywords={['Tech Instructor Jobs', 'Software Mentor Openings', 'EdTech Careers', 'Nexelvoria Hiring']}
      />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <PageLabel>Join Our Mission</PageLabel>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Shape the Future of Technology Education
        </h1>
        <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
          We are building the most practical, high-rigor software engineering finishing school in India. Join us as an instructor, curriculum architect, or corporate placement lead.
        </p>
      </div>

      {/* Culture Values */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        <Card className="p-6 space-y-2 bg-white">
          <Award className="h-8 w-8 text-indigo-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">Competitive Compensation</h3>
          <p className="text-xs text-slate-500">Above-market remuneration, performance bonuses, and ESOP pathways for core faculty.</p>
        </Card>
        <Card className="p-6 space-y-2 bg-white">
          <Users className="h-8 w-8 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">Transform Student Lives</h3>
          <p className="text-xs text-slate-500">Directly coach motivated young engineers from Tier-2/3 colleges into Fortune 500 careers.</p>
        </Card>
        <Card className="p-6 space-y-2 bg-white">
          <HeartHandshake className="h-8 w-8 text-sky-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">Autonomous Culture</h3>
          <p className="text-xs text-slate-500">Shape your curriculum, design innovative lab sandboxes, and spearhead research initiatives.</p>
        </Card>
      </div>

      {/* Open Positions List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Current Job Openings</h2>
          <Badge variant="info" size="sm">{openings.length} Active Positions</Badge>
        </div>

        <div className="space-y-4">
          {openings.map((job) => (
            <Card key={job.id} className="p-6 hover:shadow-lg transition-shadow bg-white">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      {job.department}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {job.location}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {job.type} ({job.experience})
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
                  <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">{job.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setSelectedJob(job)}>
                    Job Details
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setApplyModalJob(job)}>
                    Apply Now
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Job Details Modal */}
      <Modal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        title={selectedJob?.title || 'Position Details'}
        description={`${selectedJob?.department} • ${selectedJob?.location} (${selectedJob?.experience})`}
      >
        {selectedJob && (
          <div className="space-y-5 text-xs">
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Key Responsibilities</h4>
              <ul className="space-y-1.5 text-slate-600">
                {selectedJob.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Required Qualifications</h4>
              <ul className="space-y-1.5 text-slate-600">
                {selectedJob.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const jobToApply = selectedJob;
                  setSelectedJob(null);
                  setApplyModalJob(jobToApply);
                }}
              >
                Apply for this Position
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Job Application Modal (PUB-014) */}
      <Modal
        isOpen={!!applyModalJob}
        onClose={() => setApplyModalJob(null)}
        title={`Apply: ${applyModalJob?.title}`}
        description="Submit your credentials directly to our faculty hiring committee."
      >
        <form onSubmit={handleApplySubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
            <input
              type="text"
              required
              value={applicationForm.name}
              onChange={(e) => setApplicationForm({ ...applicationForm, name: e.target.value })}
              placeholder="e.g. Srikant Iyer"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={applicationForm.email}
                onChange={(e) => setApplicationForm({ ...applicationForm, email: e.target.value })}
                placeholder="srikant@example.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Phone *</label>
              <input
                type="tel"
                required
                pattern="[6-9][0-9]{9}"
                value={applicationForm.phone}
                onChange={(e) => setApplicationForm({ ...applicationForm, phone: e.target.value })}
                placeholder="10-digit number"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Years of Experience *</label>
              <input
                type="text"
                required
                value={applicationForm.experience}
                onChange={(e) => setApplicationForm({ ...applicationForm, experience: e.target.value })}
                placeholder="e.g. 7 years"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">LinkedIn Profile URL *</label>
              <input
                type="url"
                required
                value={applicationForm.linkedIn}
                onChange={(e) => setApplicationForm({ ...applicationForm, linkedIn: e.target.value })}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Resume / CV Link (Google Drive / Dropbox) *</label>
            <input
              type="url"
              required
              value={applicationForm.resumeLink}
              onChange={(e) => setApplicationForm({ ...applicationForm, resumeLink: e.target.value })}
              placeholder="https://drive.google.com/..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Brief Note on Why You Want to Teach (Optional)</label>
            <textarea
              rows={2}
              value={applicationForm.coverNote}
              onChange={(e) => setApplicationForm({ ...applicationForm, coverNote: e.target.value })}
              placeholder="Tell us about your teaching philosophy or mentorship background..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setApplyModalJob(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
