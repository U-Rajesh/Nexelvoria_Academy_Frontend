import React, { useState } from 'react';
import { Briefcase, Building, MapPin, DollarSign, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { SEED_JOBS, SEED_APPLICATIONS } from '../../mocks/seedData';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import type { JobOpening, JobApplication } from '../../types';

export const StudentPlacementsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [jobs] = useState<JobOpening[]>(SEED_JOBS);
  const [applications, setApplications] = useState<JobApplication[]>(SEED_APPLICATIONS);
  const [activeTab, setActiveTab] = useState<'openings' | 'applications'>('openings');

  // Check enrollment status (BR-013: restricted to paid/enrolled students)
  const isEnrolledAndActive = user?.status === 'active';

  const handleApply = async (jobId: string) => {
    if (!user) return;
    const res = await studentService.applyForJob(user.id, user.name, jobId);
    if (res.success && res.data) {
      setApplications((prev) => [res.data, ...prev]);
      showToast({
        type: 'success',
        title: 'Job Application Submitted',
        message: 'Your resume and academic scores have been forwarded to the hiring team.',
      });
      setActiveTab('applications');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Placement Portal</h1>
        <p className="text-xs text-slate-500 mt-1">
          Exclusive job opportunities and campus hiring drives for verified Nexelvoria Academy candidates (SRS Rule BR-013).
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('openings')}
          className={`pb-3 font-semibold border-b-2 cursor-pointer ${
            activeTab === 'openings'
              ? 'text-indigo-600 border-indigo-600'
              : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          Active Job Openings ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 font-semibold border-b-2 cursor-pointer ${
            activeTab === 'applications'
              ? 'text-indigo-600 border-indigo-600'
              : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          My Applications ({applications.length})
        </button>
      </div>

      {/* Tab: Job Openings */}
      {activeTab === 'openings' && (
        <div className="space-y-4">
          {jobs.map((job) => {
            const hasApplied = applications.some((a) => a.jobId === job.id);
            return (
              <Card key={job.id} className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Building className="h-4 w-4 text-indigo-600" /> {job.companyName}
                      </span>
                      <Badge variant="purple" size="sm">{job.workMode}</Badge>
                      <Badge variant="info" size="sm">{job.roleType}</Badge>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                        <strong className="text-slate-800">{job.salaryPackageCTC}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" /> {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" /> Deadline: {formatDate(job.deadline)}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {hasApplied ? (
                      <Badge variant="success" size="md" dot>Applied</Badge>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApply(job.id)}
                        disabled={!isEnrolledAndActive}
                      >
                        1-Click Apply
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl">
                  {job.jobDescription}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap gap-1.5">
                    {job.skillsRequired.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                        {s}
                      </span>
                    ))}
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Openings: <strong>{job.openingsCount}</strong>
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tab: Applications Tracking */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id} className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-500">{app.companyName}</span>
                  <h3 className="text-base font-bold text-slate-900">{app.jobTitle}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Applied on: {formatDate(app.appliedAt)}</p>
                </div>
                <Badge variant={app.status === 'technical_interview' ? 'purple' : 'info'} size="md" dot>
                  {app.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              {app.currentRoundNotes && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900">
                  <strong>Interviewer Status Note:</strong> {app.currentRoundNotes}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

