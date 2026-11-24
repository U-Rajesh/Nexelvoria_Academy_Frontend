import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ExternalLink, Megaphone, Edit, Power, MessageSquare, ShieldCheck, History } from 'lucide-react';
import {
  adminService,
  type EmployerFeedback,
  type PlacementAnalyticsData,
  type PlacementApplication,
  type PlacementApplicationStatus,
  type PlacementCompany,
  type PlacementEligibilityCriterion,
  type PlacementJob,
  type PlacementJobInput,
  type PlacementJobStatus,
  type PlacementOffer,
  type PlacementPackageRow,
  type PlacementRecordRow,
  type PlacementRound,
  type PlacementStatusChange,
} from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { formatDate, formatINR } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { Modal } from '../../components/feedback/Modal';
import { Card } from '../../components/common/Card';

type Tab = 'applications' | 'jobs' | 'companies' | 'records' | 'analytics';

/** D1: the only application statuses; interview progress is tracked as rounds. */
const APP_STATUSES: Array<{ value: PlacementApplicationStatus; label: string }> = [
  { value: 'applied', label: 'Applied' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'selected', label: 'Selected' },
  { value: 'rejected', label: 'Rejected' },
];
const JOB_STATUS_VARIANT: Record<PlacementJobStatus, 'success' | 'neutral' | 'warning'> = { open: 'success', closed: 'neutral', draft: 'warning' };
const EMPLOYMENT_LABEL: Record<PlacementJobInput['employmentType'], string> = { full_time: 'Full-time', internship: 'Internship', contract: 'Contract' };

const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium';
const emptyJobForm = { companyId: '', jobTitle: '', employmentType: 'full_time' as PlacementJobInput['employmentType'], workLocation: '', salaryMin: '', salaryMax: '', minExperienceYears: '0', applicationDeadline: '', jobDescription: '', jobStatus: 'draft' as PlacementJobStatus };
const emptyCompanyForm = { companyName: '', industry: '', websiteUrl: '', address: '', contactName: '', contactEmail: '', contactMobile: '', description: '' };

const salaryText = (j: PlacementJob) =>
  j.salaryMin != null || j.salaryMax != null
    ? `${j.salaryMin != null ? formatINR(j.salaryMin) : '…'} – ${j.salaryMax != null ? formatINR(j.salaryMax) : '…'}`
    : 'Salary not specified';

export const AdminPlacementPage: React.FC = () => {
  const { showToast } = useNotification();
  const toastError = (title: string, error?: string) => showToast({ type: 'error', title, message: error || 'Please retry.' });

  const [activeTab, setActiveTab] = useState<Tab>('applications');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<PlacementCompany[]>([]);
  const [jobs, setJobs] = useState<PlacementJob[]>([]);
  const [applications, setApplications] = useState<PlacementApplication[]>([]);
  const [records, setRecords] = useState<PlacementRecordRow[]>([]);
  const [analytics, setAnalytics] = useState<PlacementAnalyticsData | null>(null);
  const [packages, setPackages] = useState<PlacementPackageRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | PlacementApplicationStatus>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Job create / edit
  const [jobModal, setJobModal] = useState<{ mode: 'create' } | { mode: 'edit'; job: PlacementJob } | null>(null);
  const [jobForm, setJobForm] = useState(emptyJobForm);
  const [eligibility, setEligibility] = useState<PlacementEligibilityCriterion[] | null>(null);

  // Company create / edit / feedback
  const [companyModal, setCompanyModal] = useState<{ mode: 'create' } | { mode: 'edit'; company: PlacementCompany } | null>(null);
  const [companyForm, setCompanyForm] = useState(emptyCompanyForm);
  const [feedbackFor, setFeedbackFor] = useState<PlacementCompany | null>(null);
  const [feedbackList, setFeedbackList] = useState<EmployerFeedback[]>([]);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackAppId, setFeedbackAppId] = useState('');

  // Application management
  const [manageApp, setManageApp] = useState<PlacementApplication | null>(null);
  const [appStatus, setAppStatus] = useState<PlacementApplicationStatus>('applied');
  const [appReason, setAppReason] = useState('');
  const [rounds, setRounds] = useState<PlacementRound[]>([]);
  const [offers, setOffers] = useState<PlacementOffer[]>([]);
  const [history, setHistory] = useState<PlacementStatusChange[]>([]);
  const [roundForm, setRoundForm] = useState({ roundName: '', scheduledAt: '', meetingUrl: '' });
  const [roundFeedback, setRoundFeedback] = useState<Record<string, string>>({});
  const [offerForm, setOfferForm] = useState({ offerReference: '', offeredSalary: '', offerDate: '', joiningDate: '' });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [cRes, jRes, aRes, rRes, anRes, pRes] = await Promise.all([
      adminService.getPlacementCompanies(),
      adminService.getPlacementJobs(),
      adminService.getPlacementApplications(),
      adminService.getPlacementRecords(),
      adminService.getPlacementAnalytics(),
      adminService.getPlacementPackages(),
    ]);
    setIsLoading(false);
    const failed = [cRes, jRes, aRes, rRes, anRes, pRes].find((r) => !r.success);
    setLoadError(failed ? failed.error || 'Placement data could not be loaded.' : null);
    if (cRes.success) setCompanies(cRes.data);
    if (jRes.success) setJobs(jRes.data);
    if (aRes.success) setApplications(aRes.data);
    if (rRes.success) setRecords(rRes.data);
    if (anRes.success) setAnalytics(anRes.data);
    if (pRes.success) setPackages(pRes.data);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------------------------------------------------------------- jobs
  const openJobModal = async (job?: PlacementJob) => {
    setEligibility(null);
    if (job) {
      setJobModal({ mode: 'edit', job });
      setJobForm({
        companyId: job.companyId,
        jobTitle: job.jobTitle,
        employmentType: job.employmentType,
        workLocation: job.workLocation,
        salaryMin: job.salaryMin != null ? String(job.salaryMin) : '',
        salaryMax: job.salaryMax != null ? String(job.salaryMax) : '',
        minExperienceYears: String(job.minExperienceYears ?? 0),
        applicationDeadline: job.applicationDeadline ?? '',
        jobDescription: job.jobDescription,
        jobStatus: job.jobStatus,
      });
      const e = await adminService.getJobEligibility(job.id);
      setEligibility(e.success ? e.data : []);
    } else {
      setJobModal({ mode: 'create' });
      setJobForm({ ...emptyJobForm, companyId: companies.find((c) => c.isActive)?.id ?? '' });
    }
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobModal) return;
    const fields: PlacementJobInput = {
      jobTitle: jobForm.jobTitle.trim(),
      employmentType: jobForm.employmentType,
      workLocation: jobForm.workLocation.trim(),
      salaryMin: jobForm.salaryMin ? Number(jobForm.salaryMin) : null,
      salaryMax: jobForm.salaryMax ? Number(jobForm.salaryMax) : null,
      minExperienceYears: Number(jobForm.minExperienceYears || 0),
      applicationDeadline: jobForm.applicationDeadline || null,
      jobDescription: jobForm.jobDescription.trim(),
    };
    setIsSubmitting(true);
    const res =
      jobModal.mode === 'create'
        ? await adminService.createPlacementJob({
            ...fields,
            salaryMin: fields.salaryMin ?? undefined,
            salaryMax: fields.salaryMax ?? undefined,
            applicationDeadline: fields.applicationDeadline ?? undefined,
            companyId: jobForm.companyId,
            jobStatus: jobForm.jobStatus,
          })
        : await adminService.updatePlacementJob(jobModal.job.id, fields);
    setIsSubmitting(false);
    if (res.success) {
      showToast({ type: 'success', title: jobModal.mode === 'create' ? 'Job Created' : 'Job Updated', message: res.message || `${fields.jobTitle} saved.` });
      setJobModal(null);
      loadData();
    } else {
      toastError('Job not saved', res.error);
    }
  };

  const handleJobStatus = async (job: PlacementJob, status: PlacementJobStatus) => {
    const res = await adminService.setPlacementJobStatus(job.id, status);
    if (res.success) {
      showToast({ type: 'success', title: 'Job Status', message: res.data?.changed === false ? 'The job already had this status.' : `${job.jobTitle} is now ${status}.` });
      loadData();
    } else toastError('Status not changed', res.error);
  };

  const handleAnnounce = async (job: PlacementJob) => {
    const res = await adminService.announcePlacementJob(job.id);
    if (res.success) {
      showToast({ type: 'success', title: 'Placement Alert Sent', message: `In-app alert sent to ${res.data?.recipientCount ?? 0} eligible student(s).` });
    } else toastError('Alert not sent', res.error);
  };

  // ------------------------------------------------------------ companies
  const openCompanyModal = (company?: PlacementCompany) => {
    if (company) {
      setCompanyModal({ mode: 'edit', company });
      setCompanyForm({
        companyName: company.companyName,
        industry: company.industry ?? '',
        websiteUrl: company.websiteUrl ?? '',
        address: company.address ?? '',
        contactName: company.contactName ?? '',
        contactEmail: company.contactEmail ?? '',
        contactMobile: company.contactMobile ?? '',
        description: company.description ?? '',
      });
    } else {
      setCompanyModal({ mode: 'create' });
      setCompanyForm(emptyCompanyForm);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyModal) return;
    setIsSubmitting(true);
    let res;
    if (companyModal.mode === 'create') {
      const input = Object.fromEntries(Object.entries(companyForm).filter(([, v]) => v.trim() !== '').map(([k, v]) => [k, v.trim()]));
      res = await adminService.createPlacementCompany(input as { companyName: string });
    } else {
      // Send only edited fields; an emptied optional field is cleared (null).
      const before = companyModal.company as unknown as Record<string, string | undefined>;
      const changes = Object.fromEntries(
        Object.entries(companyForm)
          .filter(([k, v]) => v.trim() !== (before[k] ?? ''))
          .map(([k, v]) => [k, v.trim() === '' && k !== 'companyName' ? null : v.trim()])
      );
      res = Object.keys(changes).length === 0 ? { success: true, data: null, message: 'Nothing changed.' } : await adminService.updatePlacementCompany(companyModal.company.id, changes);
    }
    setIsSubmitting(false);
    if (res.success) {
      showToast({ type: 'success', title: 'Company Saved', message: res.message || `${companyForm.companyName} saved.` });
      setCompanyModal(null);
      loadData();
    } else toastError('Company not saved', res.error);
  };

  const handleCompanyActive = async (company: PlacementCompany) => {
    const res = await adminService.setPlacementCompanyActive(company.id, !company.isActive);
    if (res.success) {
      showToast({ type: 'info', title: 'Company Status', message: res.message || 'Status changed.' });
      loadData();
    } else toastError('Status not changed', res.error);
  };

  const openFeedback = async (company: PlacementCompany) => {
    setFeedbackFor(company);
    setFeedbackText('');
    setFeedbackAppId('');
    setFeedbackList([]);
    const res = await adminService.getEmployerFeedback(company.id);
    if (res.success) setFeedbackList(res.data);
    else toastError('Feedback unavailable', res.error);
  };

  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackFor) return;
    setIsSubmitting(true);
    const res = await adminService.createEmployerFeedback(feedbackFor.id, { feedbackText: feedbackText.trim(), ...(feedbackAppId ? { jobApplicationId: feedbackAppId } : {}) });
    setIsSubmitting(false);
    if (res.success) {
      showToast({ type: 'success', title: 'Feedback Recorded', message: `Employer feedback saved for ${feedbackFor.companyName}.` });
      openFeedback(feedbackFor);
    } else toastError('Feedback not saved', res.error);
  };

  // ---------------------------------------------------------- applications
  const loadAppDetail = async (app: PlacementApplication) => {
    const [r, o, h] = await Promise.all([adminService.getInterviewRounds(app.id), adminService.getApplicationOffers(app.id), adminService.getApplicationHistory(app.id)]);
    if (r.success) {
      setRounds(r.data);
      setRoundFeedback(Object.fromEntries(r.data.map((x) => [x.id, x.feedback ?? ''])));
    }
    if (o.success) setOffers(o.data);
    if (h.success) setHistory(h.data);
    const failed = [r, o, h].find((x) => !x.success);
    if (failed) toastError('Application details incomplete', failed.error);
  };

  const openManage = (app: PlacementApplication) => {
    setManageApp(app);
    setAppStatus(app.applicationStatus);
    setAppReason('');
    setRounds([]);
    setOffers([]);
    setHistory([]);
    setRoundForm({ roundName: '', scheduledAt: '', meetingUrl: '' });
    setOfferForm({ offerReference: '', offeredSalary: '', offerDate: '', joiningDate: '' });
    loadAppDetail(app);
  };

  const handleAppStatus = async () => {
    if (!manageApp) return;
    setIsSubmitting(true);
    const res = await adminService.updatePlacementApplicationStatus(manageApp.id, appStatus, appReason.trim() || undefined);
    setIsSubmitting(false);
    if (res.success && res.data) {
      showToast({ type: 'success', title: 'Application Updated', message: `${manageApp.studentName || 'Application'} is now ${res.data.applicationStatus}.` });
      setManageApp(res.data);
      setAppReason('');
      loadAppDetail(res.data);
      loadData();
    } else toastError('Status not changed', res.error);
  };

  const handleAddRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageApp) return;
    setIsSubmitting(true);
    const res = await adminService.createInterviewRound(manageApp.id, {
      roundName: roundForm.roundName.trim(),
      ...(roundForm.scheduledAt ? { scheduledAt: new Date(roundForm.scheduledAt).toISOString() } : {}),
      ...(roundForm.meetingUrl.trim() ? { meetingUrl: roundForm.meetingUrl.trim() } : {}),
    });
    setIsSubmitting(false);
    if (res.success) {
      setRoundForm({ roundName: '', scheduledAt: '', meetingUrl: '' });
      loadAppDetail(manageApp);
    } else toastError('Round not added', res.error);
  };

  const handleRoundFeedback = async (round: PlacementRound) => {
    const res = await adminService.updateInterviewRound(round.id, { feedback: (roundFeedback[round.id] ?? '').trim() || null });
    if (res.success) {
      showToast({ type: 'success', title: 'Round Updated', message: res.data?.changed === false ? 'Nothing changed.' : `Feedback saved for ${round.roundName}.` });
      if (manageApp) loadAppDetail(manageApp);
    } else toastError('Round not updated', res.error);
  };

  const handleAddOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageApp) return;
    setIsSubmitting(true);
    const res = await adminService.createPlacementOffer(manageApp.id, {
      offerReference: offerForm.offerReference.trim(),
      ...(offerForm.offeredSalary ? { offeredSalary: Number(offerForm.offeredSalary) } : {}),
      ...(offerForm.offerDate ? { offerDate: offerForm.offerDate } : {}),
      ...(offerForm.joiningDate ? { joiningDate: offerForm.joiningDate } : {}),
    });
    setIsSubmitting(false);
    if (res.success) {
      showToast({ type: 'success', title: 'Offer Recorded', message: 'The offer was recorded. Offer letter files cannot be uploaded yet.' });
      setOfferForm({ offerReference: '', offeredSalary: '', offerDate: '', joiningDate: '' });
      loadAppDetail(manageApp);
    } else toastError('Offer not recorded', res.error);
  };

  const handleCreateRecord = async (offer?: PlacementOffer) => {
    if (!manageApp) return;
    const res = await adminService.createPlacementRecord({ jobApplicationId: manageApp.id, ...(offer ? { offerId: offer.id } : {}), ...(offer?.joiningDate ? { joiningDate: offer.joiningDate } : {}) });
    if (res.success) {
      showToast({ type: 'success', title: 'Placement Recorded', message: 'The placement record was created (pending verification).' });
      loadData();
    } else toastError('Placement not recorded', res.error);
  };

  const handleVerify = async (r: PlacementRecordRow) => {
    const res = await adminService.verifyPlacementRecord(r.id);
    if (res.success) {
      showToast({ type: 'success', title: 'Placement Verified', message: `${r.studentName || 'Placement'} at ${r.companyName || 'company'} verified.` });
      loadData();
    } else toastError('Not verified', res.error);
  };

  // --------------------------------------------------------------- tables
  const filteredApps = statusFilter === 'all' ? applications : applications.filter((a) => a.applicationStatus === statusFilter);

  const appColumns: Column<PlacementApplication>[] = [
    {
      key: 'studentName',
      header: 'Applicant Student',
      sortable: true,
      render: (a) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{a.studentName || `Student #${a.studentUserId}`}</span>
          <span className="text-[11px] text-slate-400 font-mono">ID: {a.studentUserId}</span>
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
      key: 'applicationStatus',
      header: 'Application Status',
      sortable: true,
      render: (a) => (
        <Badge variant={a.applicationStatus === 'selected' ? 'success' : a.applicationStatus === 'rejected' ? 'danger' : 'purple'} size="sm" dot>
          {a.applicationStatus.toUpperCase()}
        </Badge>
      ),
    },
    { key: 'appliedAt', header: 'Application Date', sortable: true, render: (a) => <span className="text-xs text-slate-500">{formatDate(a.appliedAt)}</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (a) => (
        <Button variant="outline" size="sm" onClick={() => openManage(a)} className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50">
          Manage
        </Button>
      ),
    },
  ];

  const recordColumns: Column<PlacementRecordRow>[] = [
    { key: 'studentName', header: 'Student', sortable: true, render: (r) => <span className="font-bold text-slate-900 text-xs">{r.studentName || `Student #${r.studentUserId}`}</span> },
    {
      key: 'companyName',
      header: 'Company & Role',
      render: (r) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs block">{r.jobTitle}</span>
          <span className="text-[11px] text-indigo-600">{r.companyName}</span>
        </div>
      ),
    },
    { key: 'packageOffered', header: 'Package', render: (r) => <span className="text-xs">{r.packageOffered != null ? formatINR(r.packageOffered) : '—'}</span> },
    { key: 'joiningDate', header: 'Joining', render: (r) => <span className="text-xs text-slate-500">{r.joiningDate ? formatDate(r.joiningDate) : '—'}</span> },
    {
      key: 'verificationStatus',
      header: 'Verification',
      render: (r) => (
        <Badge variant={r.verificationStatus === 'verified' ? 'success' : 'warning'} size="sm" dot>
          {r.verificationStatus.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) =>
        r.verificationStatus === 'pending' ? (
          <Button variant="outline" size="sm" onClick={() => handleVerify(r)} leftIcon={<ShieldCheck className="h-3.5 w-3.5" />} className="text-xs">
            Verify
          </Button>
        ) : (
          <span className="text-[11px] text-slate-400">{r.verifiedAt ? formatDate(r.verifiedAt) : ''}</span>
        ),
    },
  ];

  const tabBtn = (tab: Tab, label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Placement Drives & Corporate Partners (ADM-012)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage hiring partners, publish job openings, track applications, interview rounds and offers, and verify placement records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openCompanyModal()} leftIcon={<Plus className="h-4 w-4" />}>
            Add Company
          </Button>
          <Button variant="primary" size="sm" onClick={() => openJobModal()} leftIcon={<Plus className="h-4 w-4" />} disabled={!companies.some((c) => c.isActive)}>
            Post Job Opening
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {tabBtn('applications', `Student Applications (${applications.length})`)}
        {tabBtn('jobs', `Job Openings (${jobs.length})`)}
        {tabBtn('companies', `Hiring Partners (${companies.length})`)}
        {tabBtn('records', `Placement Records (${records.length})`)}
        {tabBtn('analytics', 'Placement Analytics')}
      </div>

      {loadError && <Card className="p-4 border border-rose-200 bg-rose-50 text-xs text-rose-800">{loadError}</Card>}
      {isLoading && <p className="text-xs text-slate-400">Loading placement data…</p>}

      {/* Tab: Applications */}
      {activeTab === 'applications' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">Status:</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50">
              <option value="all">All</option>
              {APP_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          {!isLoading && applications.length === 0 && <p className="text-xs text-slate-400 italic">No applications yet.</p>}
          <DataTable data={filteredApps} columns={appColumns} searchPlaceholder="Search applicant student, role or company..." pageSize={10} />
        </div>
      )}

      {/* Tab: Jobs */}
      {activeTab === 'jobs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isLoading && jobs.length === 0 && <p className="text-xs text-slate-400 italic">No job openings yet.</p>}
          {jobs.map((job) => (
            <Card key={job.id} className="p-6 bg-white border border-slate-200 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant="purple" size="sm">{job.companyName}</Badge>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{job.jobTitle}</h3>
                  <p className="text-xs text-slate-500">
                    {job.workLocation} • {EMPLOYMENT_LABEL[job.employmentType] ?? job.employmentType} • {job.minExperienceYears}+ yrs
                  </p>
                </div>
                <Badge variant={JOB_STATUS_VARIANT[job.jobStatus] ?? 'neutral'} size="sm" dot>
                  {job.jobStatus.toUpperCase()}
                </Badge>
              </div>
              <span className="inline-block text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{salaryText(job)}</span>
              <p className="text-xs text-slate-600 line-clamp-2">{job.jobDescription}</p>
              <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-600">
                Deadline: <strong>{job.applicationDeadline ? formatDate(job.applicationDeadline) : 'None'}</strong>
                {job.publishedAt ? <> • Published {formatDate(job.publishedAt)}</> : null}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={() => openJobModal(job)} leftIcon={<Edit className="h-3.5 w-3.5" />} className="text-xs">
                  Edit
                </Button>
                {job.jobStatus !== 'open' && (
                  <Button variant="ghost" size="sm" onClick={() => handleJobStatus(job, 'open')} className="text-xs text-emerald-700">
                    Open
                  </Button>
                )}
                {job.jobStatus === 'open' && (
                  <Button variant="ghost" size="sm" onClick={() => handleJobStatus(job, 'closed')} className="text-xs">
                    Close
                  </Button>
                )}
                {job.jobStatus === 'open' && (
                  <Button variant="ghost" size="sm" onClick={() => handleAnnounce(job)} leftIcon={<Megaphone className="h-3.5 w-3.5" />} className="text-xs text-indigo-600">
                    Send Placement Alert
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab: Companies */}
      {activeTab === 'companies' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {!isLoading && companies.length === 0 && <p className="text-xs text-slate-400 italic">No hiring partners yet.</p>}
          {companies.map((comp) => (
            <Card key={comp.id} className="p-5 bg-white border border-slate-200 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900">{comp.companyName}</span>
                <Badge variant={comp.isActive ? 'success' : 'neutral'} size="sm" dot>
                  {comp.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>
              {comp.industry && <Badge variant="info" size="sm">{comp.industry}</Badge>}
              {comp.address && <p className="text-xs text-slate-500">{comp.address}</p>}
              {comp.description && <p className="text-[11px] text-slate-600 line-clamp-2">{comp.description}</p>}
              {(comp.contactName || comp.contactEmail || comp.contactMobile) && (
                <p className="text-[11px] text-slate-500">{[comp.contactName, comp.contactEmail, comp.contactMobile].filter(Boolean).join(' · ')}</p>
              )}
              {comp.websiteUrl && (
                <a href={comp.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium">
                  <ExternalLink className="h-3 w-3" /> Visit Company Website
                </a>
              )}
              <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-100">
                <Button variant="ghost" size="sm" onClick={() => openCompanyModal(comp)} leftIcon={<Edit className="h-3 w-3" />} className="text-xs">
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleCompanyActive(comp)} leftIcon={<Power className="h-3 w-3" />} className="text-xs">
                  {comp.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openFeedback(comp)} leftIcon={<MessageSquare className="h-3 w-3" />} className="text-xs">
                  Feedback
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab: Records */}
      {activeTab === 'records' && (
        <div className="space-y-3">
          {!isLoading && records.length === 0 && <p className="text-xs text-slate-400 italic">No placement records yet. Create one from an application's offers.</p>}
          <DataTable data={records} columns={recordColumns} searchPlaceholder="Search student or company..." pageSize={10} />
        </div>
      )}

      {/* Tab: Analytics */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['Hiring Partners', `${analytics.companies.active} active / ${analytics.companies.total}`],
              ['Job Openings', String(analytics.jobs.total)],
              ['Applications', String(analytics.applications.total)],
              ['Interview Rounds', String(analytics.interviewRounds)],
              ['Offers', String(analytics.offers.total)],
              ['Highest Offer', analytics.offers.highestOfferedSalary != null ? formatINR(analytics.offers.highestOfferedSalary) : '—'],
              ['Placements', `${analytics.placements.verified} verified / ${analytics.placements.total}`],
              ['Mock Interview Avg Score', analytics.mockInterviews.averageScore != null ? analytics.mockInterviews.averageScore.toFixed(1) : '—'],
            ].map(([label, value]) => (
              <Card key={label} className="p-4 bg-white border border-slate-200">
                <span className="text-[11px] text-slate-400 block">{label}</span>
                <span className="text-base font-extrabold text-slate-900">{value}</span>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {[
              ['Jobs by status', analytics.jobs.byStatus],
              ['Applications by status', analytics.applications.byStatus],
              ['Mock interviews by status', analytics.mockInterviews.byStatus],
            ].map(([title, rows]) => (
              <Card key={title as string} className="p-4 bg-white border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">{title as string}</span>
                {Object.keys(rows as Record<string, number>).length === 0 ? (
                  <span className="text-slate-400 italic">No data</span>
                ) : (
                  Object.entries(rows as Record<string, number>).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="uppercase text-slate-600">{k}</span>
                      <strong>{v}</strong>
                    </div>
                  ))
                )}
              </Card>
            ))}
          </div>
          <Card className="p-4 bg-white border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-800 block">Placements by company</span>
            {analytics.placementsByCompany.length === 0 ? (
              <span className="text-slate-400 italic">No placements recorded</span>
            ) : (
              analytics.placementsByCompany.map((p) => (
                <div key={p.companyId} className="flex justify-between">
                  <span>{p.companyName || `Company #${p.companyId}`}</span>
                  <strong>{p.placements}</strong>
                </div>
              ))
            )}
          </Card>
          <Card className="p-4 bg-white border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-800 block">Placement packages (read-only)</span>
            <p className="text-[11px] text-slate-500">Package types and guarantee terms await approval, so packages cannot be created or assigned here.</p>
            {packages.length === 0 ? (
              <span className="text-slate-400 italic">No packages recorded</span>
            ) : (
              packages.map((p) => (
                <div key={p.id} className="flex justify-between">
                  <span>
                    {p.packageName} ({p.packageType}){p.isActive ? '' : ' · inactive'}
                  </span>
                  <span>
                    {formatINR(p.price)} · {p.studentCount} student(s)
                  </span>
                </div>
              ))
            )}
          </Card>
        </div>
      )}

      {/* Job Modal */}
      {jobModal && (
        <Modal isOpen={!!jobModal} onClose={() => setJobModal(null)} title={jobModal.mode === 'create' ? 'Post Job Opening (ADM-012)' : `Edit: ${jobModal.job.jobTitle}`} size="lg">
          <form onSubmit={handleSaveJob} className="space-y-4 text-xs text-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Hiring Partner *</label>
                <select value={jobForm.companyId} disabled={jobModal.mode === 'edit'} onChange={(e) => setJobForm({ ...jobForm, companyId: e.target.value })} className={inputCls} required>
                  <option value="">Select a company</option>
                  {companies
                    .filter((c) => c.isActive || c.id === jobForm.companyId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Job Title *</label>
                <input required minLength={2} maxLength={200} value={jobForm.jobTitle} onChange={(e) => setJobForm({ ...jobForm, jobTitle: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Employment Type</label>
                <select value={jobForm.employmentType} onChange={(e) => setJobForm({ ...jobForm, employmentType: e.target.value as PlacementJobInput['employmentType'] })} className={inputCls}>
                  <option value="full_time">Full-time</option>
                  <option value="internship">Internship</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Work Location *</label>
                <input required minLength={2} maxLength={200} value={jobForm.workLocation} onChange={(e) => setJobForm({ ...jobForm, workLocation: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Minimum Salary (₹ per year)</label>
                <input type="number" min={0} value={jobForm.salaryMin} onChange={(e) => setJobForm({ ...jobForm, salaryMin: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Maximum Salary (₹ per year)</label>
                <input type="number" min={0} value={jobForm.salaryMax} onChange={(e) => setJobForm({ ...jobForm, salaryMax: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Minimum Experience (years)</label>
                <input type="number" min={0} max={999} step={1} value={jobForm.minExperienceYears} onChange={(e) => setJobForm({ ...jobForm, minExperienceYears: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Application Deadline</label>
                <input type="date" value={jobForm.applicationDeadline} onChange={(e) => setJobForm({ ...jobForm, applicationDeadline: e.target.value })} className={inputCls} />
              </div>
              {jobModal.mode === 'create' && (
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Initial Status</label>
                  <select value={jobForm.jobStatus} onChange={(e) => setJobForm({ ...jobForm, jobStatus: e.target.value as PlacementJobStatus })} className={inputCls}>
                    <option value="draft">Draft (not visible to students)</option>
                    <option value="open">Open (publish now)</option>
                  </select>
                </div>
              )}
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Job Description * (min 10 characters)</label>
              <textarea required minLength={10} rows={3} value={jobForm.jobDescription} onChange={(e) => setJobForm({ ...jobForm, jobDescription: e.target.value })} className={inputCls} />
            </div>
            {jobModal.mode === 'edit' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
                <span className="font-semibold text-slate-800 block">Eligibility criteria (PLC-003, read-only)</span>
                {eligibility === null ? (
                  <span>Loading…</span>
                ) : eligibility.length === 0 ? (
                  <span>No criteria recorded. Criteria cannot be edited until their types and operators are approved.</span>
                ) : (
                  eligibility.map((c) => (
                    <div key={c.id}>
                      {c.criterionType} {c.operator} {c.criterionValue}
                    </div>
                  ))
                )}
              </div>
            )}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setJobModal(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                {jobModal.mode === 'create' ? 'Create Job' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Company Modal */}
      {companyModal && (
        <Modal isOpen={!!companyModal} onClose={() => setCompanyModal(null)} title={companyModal.mode === 'create' ? 'Add Hiring Partner (PLC-001)' : `Edit: ${companyModal.company.companyName}`} size="lg">
          <form onSubmit={handleSaveCompany} className="space-y-4 text-xs text-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(
                [
                  ['companyName', 'Company Name *', 'text', 200],
                  ['industry', 'Industry', 'text', 120],
                  ['websiteUrl', 'Website URL', 'url', 500],
                  ['address', 'Address', 'text', 500],
                  ['contactName', 'Contact Person', 'text', 150],
                  ['contactEmail', 'Contact Email', 'email', 254],
                  ['contactMobile', 'Contact Mobile', 'tel', 25],
                ] as const
              ).map(([key, label, type, max]) => (
                <div key={key}>
                  <label className="block font-semibold text-slate-800 mb-1">{label}</label>
                  <input type={type} maxLength={max} required={key === 'companyName'} value={companyForm[key]} onChange={(e) => setCompanyForm({ ...companyForm, [key]: e.target.value })} className={inputCls} />
                </div>
              ))}
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">About the Company</label>
              <textarea rows={3} value={companyForm.description} onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })} className={inputCls} />
            </div>
            <p className="text-[11px] text-slate-500">Company logos cannot be stored (no logo column). Companies are never deleted; deactivate them instead.</p>
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setCompanyModal(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save Company
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Employer Feedback Modal */}
      {feedbackFor && (
        <Modal isOpen={!!feedbackFor} onClose={() => setFeedbackFor(null)} title={`Employer Feedback: ${feedbackFor.companyName} (PLC-012)`} size="lg">
          <div className="space-y-4 text-xs text-slate-700">
            {feedbackList.length === 0 ? (
              <p className="text-slate-400 italic">No feedback recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
                {feedbackList.map((f) => (
                  <div key={f.id} className="p-3 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>{f.studentName ? `About ${f.studentName}` : 'General feedback'}</span>
                      <span>{formatDate(f.submittedAt)}</span>
                    </div>
                    <p>{f.feedbackText}</p>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleAddFeedback} className="space-y-2 pt-2 border-t border-slate-200">
              <label className="block font-semibold text-slate-800">Record feedback from this employer</label>
              <textarea required minLength={5} rows={3} value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} className={inputCls} />
              <select value={feedbackAppId} onChange={(e) => setFeedbackAppId(e.target.value)} className={inputCls}>
                <option value="">Not about a specific application</option>
                {applications
                  .filter((a) => a.companyId === feedbackFor.id)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.studentName || `Student #${a.studentUserId}`} · {a.jobTitle}
                    </option>
                  ))}
              </select>
              <p className="text-[11px] text-slate-500">Ratings are not recorded until a rating scale is approved.</p>
              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                  Save Feedback
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Manage Application Modal */}
      {manageApp && (
        <Modal isOpen={!!manageApp} onClose={() => setManageApp(null)} title={`Application: ${manageApp.studentName || `Student #${manageApp.studentUserId}`}`} size="lg">
          <div className="space-y-5 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-900 block">{manageApp.jobTitle}</span>
              <span className="text-indigo-600 text-[11px]">{manageApp.companyName}</span>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <span className="font-bold text-slate-900 block">Application Status</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                <select value={appStatus} onChange={(e) => setAppStatus(e.target.value as PlacementApplicationStatus)} className={inputCls}>
                  {APP_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <input maxLength={500} placeholder="Reason (kept in history)" value={appReason} onChange={(e) => setAppReason(e.target.value)} className={inputCls} />
                <Button variant="primary" size="sm" isLoading={isSubmitting} disabled={appStatus === manageApp.applicationStatus} onClick={handleAppStatus}>
                  Save Status
                </Button>
              </div>
            </div>

            {/* Rounds */}
            <div className="space-y-2">
              <span className="font-bold text-slate-900 block">Interview Rounds (PLC-006)</span>
              {rounds.length === 0 ? (
                <p className="text-slate-400 italic">No rounds yet.</p>
              ) : (
                rounds.map((r) => (
                  <div key={r.id} className="p-3 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">
                        Round {r.roundNumber}: {r.roundName}
                      </span>
                      <span className="text-slate-500">{r.scheduledAt ? new Date(r.scheduledAt).toLocaleString() : 'Not scheduled'}</span>
                    </div>
                    {r.meetingUrl && (
                      <a href={r.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                        Meeting link
                      </a>
                    )}
                    <div className="flex gap-2">
                      <input placeholder="Panel feedback" value={roundFeedback[r.id] ?? ''} onChange={(e) => setRoundFeedback({ ...roundFeedback, [r.id]: e.target.value })} className={inputCls} />
                      <Button variant="outline" size="sm" onClick={() => handleRoundFeedback(r)}>
                        Save
                      </Button>
                    </div>
                  </div>
                ))
              )}
              <form onSubmit={handleAddRound} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                <input required minLength={2} maxLength={150} placeholder="Round name (e.g. Technical 1, HR)" value={roundForm.roundName} onChange={(e) => setRoundForm({ ...roundForm, roundName: e.target.value })} className={inputCls} />
                <input type="datetime-local" value={roundForm.scheduledAt} onChange={(e) => setRoundForm({ ...roundForm, scheduledAt: e.target.value })} className={inputCls} />
                <input type="url" placeholder="Meeting URL" value={roundForm.meetingUrl} onChange={(e) => setRoundForm({ ...roundForm, meetingUrl: e.target.value })} className={inputCls} />
                <Button type="submit" variant="outline" size="sm" isLoading={isSubmitting}>
                  Add Round
                </Button>
              </form>
              <p className="text-[11px] text-slate-500">Round results (pass/fail) cannot be recorded until the round status values are confirmed.</p>
            </div>

            {/* Offers */}
            <div className="space-y-2">
              <span className="font-bold text-slate-900 block">Offers (PLC-007)</span>
              {offers.length === 0 ? (
                <p className="text-slate-400 italic">No offers recorded.</p>
              ) : (
                offers.map((o) => (
                  <div key={o.id} className="p-3 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <strong className="font-mono">{o.offerReference}</strong>
                      {o.offeredSalary != null ? ` · ${formatINR(o.offeredSalary)}` : ''}
                      {o.joiningDate ? ` · joins ${formatDate(o.joiningDate)}` : ''}
                    </span>
                    <Button variant="ghost" size="sm" className="text-xs text-indigo-600" onClick={() => handleCreateRecord(o)}>
                      Create Placement Record
                    </Button>
                  </div>
                ))
              )}
              <form onSubmit={handleAddOffer} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
                <input required minLength={2} maxLength={60} placeholder="Offer reference *" value={offerForm.offerReference} onChange={(e) => setOfferForm({ ...offerForm, offerReference: e.target.value })} className={inputCls} />
                <input type="number" min={0} placeholder="Salary (₹/yr)" value={offerForm.offeredSalary} onChange={(e) => setOfferForm({ ...offerForm, offeredSalary: e.target.value })} className={inputCls} />
                <input type="date" title="Offer date" value={offerForm.offerDate} onChange={(e) => setOfferForm({ ...offerForm, offerDate: e.target.value })} className={inputCls} />
                <input type="date" title="Joining date" value={offerForm.joiningDate} onChange={(e) => setOfferForm({ ...offerForm, joiningDate: e.target.value })} className={inputCls} />
                <Button type="submit" variant="outline" size="sm" isLoading={isSubmitting}>
                  Record Offer
                </Button>
              </form>
              <p className="text-[11px] text-slate-500">Offer letter files cannot be uploaded yet: no file storage is configured.</p>
            </div>

            {/* History */}
            <div className="space-y-1">
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <History className="h-3.5 w-3.5" /> Status History
              </span>
              {history.length === 0 ? (
                <p className="text-slate-400 italic">No status changes yet.</p>
              ) : (
                history.map((h) => (
                  <div key={h.id} className="flex justify-between text-[11px] border-b border-slate-100 py-1">
                    <span>
                      {(h.previousStatus ?? '—').toUpperCase()} → {h.newStatus.toUpperCase()}
                      {h.changeReason ? ` · ${h.changeReason}` : ''}
                    </span>
                    <span className="text-slate-500">
                      {h.changedByName || (h.changedByUserId ? `User #${h.changedByUserId}` : '')} · {formatDate(h.changedAt)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setManageApp(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
