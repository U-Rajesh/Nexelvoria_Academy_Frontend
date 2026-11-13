import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, ShieldCheck, XCircle, Search, ExternalLink, Plus, CheckCircle, FileText } from 'lucide-react';
import { getStorageItem, setStorageItem } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/appConfig';
import { SEED_COURSES, SEED_USERS } from '../../mocks/seedData';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { Modal } from '../../components/feedback/Modal';
import type { CertificateRecord } from '../../types';

export const AdminCertificatePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [certificates, setCertificates] = useState<CertificateRecord[]>(
    getStorageItem<CertificateRecord[]>(STORAGE_KEYS.CERTIFICATES, [])
  );

  const [revokingCert, setRevokingCert] = useState<CertificateRecord | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Manual Issuance State (CER-003 & CER-004)
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({
    studentName: 'Rahul Verma',
    studentId: 'user-stu-001',
    courseId: SEED_COURSES[0].id,
    courseTitle: SEED_COURSES[0].title,
    templateId: 'executive_gold' as 'standard_dark' | 'executive_gold' | 'minimal_blue',
    attendancePercentage: 88,
    examScorePercentage: 85,
    remarks: 'Approved by Academic Director for distinguished capstone completion.',
  });

  const handleCourseChange = (courseId: string) => {
    const selectedCourse = SEED_COURSES.find((c) => c.id === courseId);
    setIssueForm((prev) => ({
      ...prev,
      courseId,
      courseTitle: selectedCourse?.title || prev.courseTitle,
    }));
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (Number(issueForm.attendancePercentage) < 75) {
      showToast({
        type: 'warning',
        title: 'Attendance Criteria Warning (BR-011)',
        message: 'Student attendance is below the mandatory 75% threshold.',
      });
    }

    setIsProcessing(true);
    const res = await adminService.issueCertificate(
      { id: user.id, name: user.name },
      {
        studentId: issueForm.studentId,
        studentName: issueForm.studentName,
        courseId: issueForm.courseId,
        courseTitle: issueForm.courseTitle,
        attendancePercentage: Number(issueForm.attendancePercentage),
        examScorePercentage: Number(issueForm.examScorePercentage),
        templateId: issueForm.templateId,
      }
    );
    setIsProcessing(false);

    if (res.success && res.data) {
      setCertificates((prev) => [res.data, ...prev]);
      setIsIssueModalOpen(false);
      showToast({
        type: 'success',
        title: 'Certificate Issued Manually (CER-003)',
        message: `Certificate ${res.data.certificateNumber} generated with ${issueForm.templateId} template.`,
      });
    }
  };

  const handleRevokeConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokingCert || !user || !revokeReason.trim()) return;

    setIsProcessing(true);
    const res = await adminService.revokeCertificate(
      { id: user.id, name: user.name },
      revokingCert.id,
      revokeReason
    );
    setIsProcessing(false);
    setRevokingCert(null);
    setRevokeReason('');

    if (res.success && res.data) {
      setCertificates((prev) => prev.map((c) => (c.id === res.data.id ? res.data : c)));
      showToast({
        type: 'warning',
        title: 'Certificate Revoked',
        message: `Certificate ${res.data.certificateNumber} has been revoked. (SRS Rule CER-008)`,
      });
    }
  };

  const columns: Column<CertificateRecord>[] = [
    {
      key: 'certificateNumber',
      header: 'Certificate ID',
      sortable: true,
      render: (c) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-900 block">{c.certificateNumber}</span>
          {c.issuedManuallyByAdminId && (
            <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">
              Manual (CER-003)
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'studentName',
      header: 'Student Name',
      sortable: true,
      render: (c) => <span className="font-semibold text-slate-800 text-xs">{c.studentName}</span>,
    },
    {
      key: 'courseTitle',
      header: 'Program Title',
      render: (c) => <span className="text-xs text-slate-600 line-clamp-1">{c.courseTitle}</span>,
    },
    {
      key: 'templateId',
      header: 'Template (CER-004)',
      render: (c) => {
        const templateMap: Record<string, { label: string; variant: 'neutral' | 'warning' | 'info' }> = {
          standard_dark: { label: 'Standard Navy', variant: 'neutral' },
          executive_gold: { label: 'Executive Gold', variant: 'warning' },
          minimal_blue: { label: 'Distinction Blue', variant: 'info' },
        };
        const t = templateMap[c.templateId || 'standard_dark'] || { label: 'Standard Navy', variant: 'neutral' };
        return <Badge variant={t.variant} size="sm">{t.label}</Badge>;
      },
    },
    {
      key: 'attendancePercentage',
      header: 'Attendance %',
      sortable: true,
      render: (c) => (
        <span className={`text-xs font-semibold ${c.attendancePercentage < 75 ? 'text-rose-600' : 'text-slate-700'}`}>
          {c.attendancePercentage}%
        </span>
      ),
    },
    {
      key: 'examScorePercentage',
      header: 'Exam Score',
      sortable: true,
      render: (c) => (
        <span className={`text-xs font-semibold ${c.examScorePercentage < 60 ? 'text-rose-600' : 'text-slate-700'}`}>
          {c.examScorePercentage}%
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status (CER-008)',
      sortable: true,
      render: (c) => (
        <Badge variant={c.status === 'valid' ? 'success' : 'danger'} size="sm" dot>
          {c.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c) => (
        <div className="flex items-center gap-3">
          <Link
            to={c.qrVerificationUrl}
            target="_blank"
            className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
          >
            Verify <ExternalLink className="h-3 w-3" />
          </Link>
          {c.status === 'valid' && (
            <button
              onClick={() => {
                setRevokingCert(c);
                setRevokeReason('');
              }}
              className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
            >
              Revoke
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Certificate Registry & Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage credentials, issue manual certificates with enterprise templates (CER-003 & CER-004), audit candidate criteria (BR-011), and revoke invalid records (CER-008).
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsIssueModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
          className="shrink-0"
        >
          Issue Certificate Manually
        </Button>
      </div>

      <DataTable
        data={certificates}
        columns={columns}
        searchPlaceholder="Search certificate ID or student..."
        pageSize={10}
      />

      {/* Manual Issuance Modal (CER-003 & CER-004) */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Issue Certificate Manually (CER-003 & CER-004)"
        size="md"
      >
        <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 flex items-start gap-2">
            <Award className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              <strong>Administrative Conferral:</strong> Manual issuance allows authorized administrators to confer certificates directly to candidates who have completed special batches, corporate programs, or accredited equivalent coursework.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Student Full Name *</label>
              <input
                type="text"
                required
                value={issueForm.studentName}
                onChange={(e) => setIssueForm({ ...issueForm, studentName: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Student ID / System ID</label>
              <input
                type="text"
                value={issueForm.studentId}
                onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Program / Course *</label>
            <select
              value={issueForm.courseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SEED_COURSES.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.courseCode || 'CRS'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Certificate Design Template (CER-004) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'executive_gold', label: 'Executive Gold', desc: 'Prestige border & golden seal' },
                { id: 'standard_dark', label: 'Standard Navy', desc: 'Corporate deep navy header' },
                { id: 'minimal_blue', label: 'Distinction Blue', desc: 'Modern high-contrast honors' },
              ].map((tpl) => (
                <label
                  key={tpl.id}
                  className={`p-3 border rounded-xl cursor-pointer transition-colors block text-left ${
                    issueForm.templateId === tpl.id
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="templateId"
                    value={tpl.id}
                    checked={issueForm.templateId === tpl.id}
                    onChange={() =>
                      setIssueForm({
                        ...issueForm,
                        templateId: tpl.id as 'standard_dark' | 'executive_gold' | 'minimal_blue',
                      })
                    }
                    className="sr-only"
                  />
                  <div className="font-bold text-slate-900">{tpl.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{tpl.desc}</div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Attendance Record (%) (Min 75% per BR-011) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={issueForm.attendancePercentage}
                onChange={(e) => setIssueForm({ ...issueForm, attendancePercentage: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Final Exam Score (%) (Min 60% per BR-011) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={issueForm.examScorePercentage}
                onChange={(e) => setIssueForm({ ...issueForm, examScorePercentage: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Administrative Remarks / Justification</label>
            <textarea
              rows={2}
              value={issueForm.remarks}
              onChange={(e) => setIssueForm({ ...issueForm, remarks: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Verified by Course Coordinator for corporate cohort completion..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsIssueModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isProcessing}>
              Generate & Issue Certificate
            </Button>
          </div>
        </form>
      </Modal>

      {/* Revocation Modal */}
      <Modal
        isOpen={!!revokingCert}
        onClose={() => setRevokingCert(null)}
        title={`Revoke Certificate: ${revokingCert?.certificateNumber}`}
        size="sm"
      >
        <form onSubmit={handleRevokeConfirm} className="space-y-4 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
            <strong>Warning:</strong> Revoking a certificate permanently flags the public verification URL as revoked.
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Revocation Reason (Required for Audit Trail) *
            </label>
            <textarea
              rows={3}
              required
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="e.g. Plagiarism discovered in capstone code / administrative error..."
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setRevokingCert(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" type="submit" isLoading={isProcessing}>
              Confirm Revocation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


