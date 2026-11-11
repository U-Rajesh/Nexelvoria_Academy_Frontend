import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Building,
  Plus,
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ExternalLink,
  DollarSign,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { Modal } from '../../components/feedback/Modal';
import { Card } from '../../components/common/Card';
import type { HiringCompany, JobOpening, JobApplication, Course } from '../../types';

export const AdminPlacementPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState<'applications' | 'jobs' | 'companies'>('applications');
  const [companies, setCompanies] = useState<HiringCompany[]>([]);
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Modals
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [updatingApp, setUpdatingApp] = useState<JobApplication | null>(null);

  // New Job State
  const [companyId, setCompanyId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [roleType, setRoleType] = useState<'Full-time' | 'Internship' | 'Contract'>('Full-time');
  const [workMode, setWorkMode] = useState<'Onsite' | 'Hybrid' | 'Remote'>('Hybrid');
  const [location, setLocation] = useState('Hyderabad');
  const [salaryPackageCTC, setSalaryPackageCTC] = useState('₹ 7.5 LPA - ₹ 9.5 LPA');
  const [experienceRequired, setExperienceRequired] = useState('0 - 1 Years');
  const [openingsCount, setOpeningsCount] = useState(5);
  const [deadline, setDeadline] = useState('2026-12-31');
  const [jobDescription, setJobDescription] = useState('');
  const [skillsRequired, setSkillsRequired] = useState('Java 17, Spring Boot, PostgreSQL, Docker');
  const [minAttendancePercentage, setMinAttendancePercentage] = useState(75);
  const [minExamScorePercentage, setMinExamScorePercentage] = useState(70);
  const [eligibleCourseId, setEligibleCourseId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // App Update State
  const [newAppStatus, setNewAppStatus] = useState<any>('technical_interview');
  const [roundNotes, setRoundNotes] = useState('');
  const [offeredCTC, setOfferedCTC] = useState('');

  const loadData = async () => {
    const [compRes, jRes, aRes, cRes] = await Promise.all([
      adminService.getHiringCompanies(),
      adminService.getJobOpenings(),
      adminService.getJobApplications(),
      adminService.getCourses(),
    ]);

    if (compRes.success) {
      setCompanies(compRes.data);
      if (compRes.data.length > 0 && !companyId) setCompanyId(compRes.data[0].id);
    }
    if (jRes.success) setJobs(jRes.data);
    if (aRes.success) setApplications(aRes.data);
    if (cRes.success) {
      setCourses(cRes.data);
      if (cRes.data.length > 0 && !eligibleCourseId) setEligibleCourseId(cRes.data[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !jobTitle.trim() || !companyId) return;

    const compObj = companies.find((c) => c.id === companyId);
    setIsSubmitting(true);

    const res = await adminService.createJobOpening(
      { id: user.id, name: user.name },
      {
        companyId,
        companyName: compObj?.name || 'Hiring Partner',
        title: jobTitle,
        roleType,
        workMode,
        location,
        salaryPackageCTC,
        experienceRequired,
        openingsCount,
        deadline,
        jobDescription: jobDescription || 'Enterprise software engineering opening.',
        skillsRequired: skillsRequired.split(',').map((s) => s.trim()).filter(Boolean),
        eligibilityCriteria: {
          minAttendancePercentage,
          minExamScorePercentage,
          eligibleCourseIds: eligibleCourseId ? [eligibleCourseId] : [],
          eligiblePassingYears: ['2025', '2026'],
        },
      }
    );
    setIsSubmitting(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Placement Opening Posted',
        message: `${jobTitle} at ${compObj?.name} published to student portal. (ADM-012)`,
      });
      setIsJobModalOpen(false);
      loadData();
    }
  };

  const handleUpdateAppStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !updatingApp) return;

    setIsSubmitting(true);
    const res = await adminService.updateJobApplicationStatus(
      { id: user.id, name: user.name },
      updatingApp.id,
      newAppStatus,
      roundNotes,
      offeredCTC
    );
    setIsSubmitting(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Recruitment Stage Updated',
        message: `${updatingApp.studentName}'s application moved to ${newAppStatus.toUpperCase()}.`,
      });
      setUpdatingApp(null);
      loadData();
    }
  };

  const appColumns: Column<JobApplication>[] = [
    {
      key: 'studentName',
      header: 'Applicant Student',
      sortable: true,
      render: (a) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{a.studentName}</span>
          <span className="text-[11px] text-slate-400 font-mono">ID: {a.studentId}</span>
        </div>
      ),
    },
    {
      key: 'jobTitle',
      header: 'Company & Opening',
      render: (a) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs block">{a.jobTitle}</span>
          <span className="text-[11px] text-indigo-600 font-medium">{a.companyName}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Hiring Stage Pipeline',
      sortable: true,
      render: (a) => {
        const isOffered = a.status === 'offered';
        const isRejected = a.status === 'rejected';
        return (
          <Badge
            variant={isOffered ? 'success' : isRejected ? 'danger' : 'purple'}
            size="sm"
            dot
          >
            {a.status.replace('_', ' ').toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: 'appliedAt',
      header: 'Application Date',
      sortable: true,
      render: (a) => <span className="text-xs text-slate-500">{formatDate(a.appliedAt)}</span>,
    },
    {
      key: 'currentRoundNotes',
      header: 'Evaluation Notes',
      render: (a) => (
        <span className="text-xs text-slate-600 line-clamp-1">
          {a.currentRoundNotes || 'Under screening'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (a) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setUpdatingApp(a);
            setNewAppStatus(a.status);
            setRoundNotes(a.currentRoundNotes || '');
            setOfferedCTC(a.offerSalaryCTC || '');
          }}
          className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
        >
          Update Stage
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Placement Drives & Corporate Partners (ADM-012)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage hiring partnerships, publish campus placement drives, verify student eligibility criteria, and track interview pipelines.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsJobModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Post Campus Drive
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'applications'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Student Applications ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'jobs'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Active Job Openings ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('companies')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'companies'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Corporate Hiring Partners ({companies.length})
        </button>
      </div>

      {/* Tab 1: Applications */}
      {activeTab === 'applications' && (
        <DataTable
          data={applications}
          columns={appColumns}
          searchPlaceholder="Search applicant student, role or company..."
          pageSize={10}
        />
      )}

      {/* Tab 2: Jobs */}
      {activeTab === 'jobs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <Card key={job.id} className="p-6 bg-white border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="purple" size="sm">{job.companyName}</Badge>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{job.title}</h3>
                  <p className="text-xs text-slate-500">{job.location} • {job.workMode} • {job.roleType}</p>
                </div>
                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                  {job.salaryPackageCTC}
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">{job.jobDescription}</p>

              <div className="p-3 bg-slate-50 rounded-lg text-[11px] space-y-1 text-slate-600">
                <div>Eligibility: Min {job.eligibilityCriteria.minAttendancePercentage}% Attendance & {job.eligibilityCriteria.minExamScorePercentage}% Exam Score</div>
                <div>Openings: <strong>{job.openingsCount} Vacancies</strong> • Deadline: <strong>{formatDate(job.deadline)}</strong></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab 3: Companies */}
      {activeTab === 'companies' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {companies.map((comp) => (
            <Card key={comp.id} className="p-5 bg-white border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{comp.name}</span>
                <Badge variant="info" size="sm">{comp.industry}</Badge>
              </div>
              <p className="text-xs text-slate-500">{comp.location}</p>
              <p className="text-[11px] text-slate-600 line-clamp-2">{comp.about}</p>
              <a
                href={comp.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium pt-2 border-t border-slate-100"
              >
                <ExternalLink className="h-3 w-3" /> Visit Company Portal
              </a>
            </Card>
          ))}
        </div>
      )}

      {/* Post Drive Modal */}
      {isJobModalOpen && (
        <Modal
          isOpen={isJobModalOpen}
          onClose={() => setIsJobModalOpen(false)}
          title="Publish Campus Placement Drive (ADM-012)"
          size="lg"
        >
          <form onSubmit={handleCreateJob} className="space-y-4 text-xs text-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Corporate Partner *</label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.industry})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Position / Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Associate Software Engineer - Java / Cloud"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Offered Salary Package CTC *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ₹ 7.5 LPA - ₹ 9.2 LPA"
                  value={salaryPackageCTC}
                  onChange={(e) => setSalaryPackageCTC(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Openings Vacancy Count</label>
                <input
                  type="number"
                  min={1}
                  value={openingsCount}
                  onChange={(e) => setOpeningsCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Work Mode</label>
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Job Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Application Deadline *</label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Eligible Course Program</label>
                <select
                  value={eligibleCourseId}
                  onChange={(e) => setEligibleCourseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="">All Programs Eligible</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Required Skills (Comma separated)</label>
              <input
                type="text"
                placeholder="Java, Spring Boot, Microservices, Docker, SQL"
                value={skillsRequired}
                onChange={(e) => setSkillsRequired(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Job Role Description</label>
              <textarea
                rows={2}
                placeholder="Key engineering responsibilities and candidate profile expectations..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsJobModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Publish Campus Drive
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Update Application Stage Modal */}
      {updatingApp && (
        <Modal
          isOpen={!!updatingApp}
          onClose={() => setUpdatingApp(null)}
          title={`Update Recruitment Stage: ${updatingApp.studentName}`}
          size="md"
        >
          <form onSubmit={handleUpdateAppStatus} className="space-y-4 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-900 block">{updatingApp.jobTitle}</span>
              <span className="text-indigo-600 text-[11px]">{updatingApp.companyName}</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Recruitment Stage *</label>
              <select
                value={newAppStatus}
                onChange={(e) => setNewAppStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="applied">Applied</option>
                <option value="shortlisted">Shortlisted for Technical Test</option>
                <option value="technical_interview">Technical Round 1 / 2</option>
                <option value="hr_interview">HR / Leadership Discussion</option>
                <option value="offered">Job Offer Extended (Success)</option>
                <option value="rejected">Rejected / Unsuccessful</option>
              </select>
            </div>

            {newAppStatus === 'offered' && (
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Offered CTC Package (₹ LPA)</label>
                <input
                  type="text"
                  placeholder="e.g. ₹ 8.5 LPA + Performance Bonus"
                  value={offeredCTC}
                  onChange={(e) => setOfferedCTC(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Interviewer Feedback / Notes</label>
              <textarea
                rows={3}
                placeholder="Enter feedback from the company recruiters or technical panelists..."
                value={roundNotes}
                onChange={(e) => setRoundNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setUpdatingApp(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save Stage Progression
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

