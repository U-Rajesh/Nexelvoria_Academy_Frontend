import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, ShieldAlert } from 'lucide-react';
import {
  adminService,
  type AcademicRetake,
  type AcademicTest,
  type AcademicTestAttempt,
} from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { Modal } from '../../components/feedback/Modal';
import { Card } from '../../components/common/Card';

export const AdminTestPage: React.FC = () => {
  const { showToast } = useNotification();

  const [tests, setTests] = useState<AcademicTest[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [attempts, setAttempts] = useState<AcademicTestAttempt[]>([]);
  const [retakes, setRetakes] = useState<AcademicRetake[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Retake Override Modal State (BR-012)
  const [retakeModalAttempt, setRetakeModalAttempt] = useState<AcademicTestAttempt | null>(null);
  const [retakeReason, setRetakeReason] = useState('');
  const [additionalAttempts, setAdditionalAttempts] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    adminService.getAcademicTests().then((res) => {
      if (res.success) {
        setTests(res.data);
        if (res.data.length > 0) setSelectedTestId((cur) => cur || res.data[0]!.id);
      } else {
        setLoadError(res.error || 'Tests could not be loaded.');
      }
    });
  }, []);

  const loadTestData = useCallback(async () => {
    if (!selectedTestId) return;
    const [aRes, rRes] = await Promise.all([
      adminService.getTestAttempts(selectedTestId),
      adminService.getRetakeAuthorizations(selectedTestId),
    ]);
    if (!aRes.success || !rRes.success) {
      setLoadError(aRes.error || rRes.error || 'Test data could not be loaded.');
      return;
    }
    setLoadError(null);
    setAttempts(aRes.data);
    setRetakes(rRes.data);
  }, [selectedTestId]);

  useEffect(() => {
    loadTestData();
  }, [loadTestData]);

  const selectedTest = tests.find((t) => t.id === selectedTestId);
  const grantedFor = (studentUserId: string) =>
    retakes.filter((r) => r.studentUserId === studentUserId).reduce((sum, r) => sum + r.additionalAttempts, 0);

  const handleAuthorizeRetake = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = Number(additionalAttempts);
    if (!retakeModalAttempt || retakeReason.trim().length < 5 || !Number.isInteger(count) || count < 1) return;

    setIsSubmitting(true);
    const res = await adminService.authorizeTestRetake(retakeModalAttempt.testId, {
      studentUserId: retakeModalAttempt.studentUserId,
      additionalAttempts: count,
      reason: retakeReason.trim(),
    });
    setIsSubmitting(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Exam Retake Authorized (BR-012)',
        message: `${retakeModalAttempt.studentName || `Student #${retakeModalAttempt.studentUserId}`} was granted ${count} additional attempt(s). The authorization is audited.`,
      });
      setRetakeModalAttempt(null);
      setRetakeReason('');
      loadTestData();
    } else {
      showToast({ type: 'error', title: 'Retake not authorized', message: res.error || 'Please retry.' });
    }
  };

  const attemptColumns: Column<AcademicTestAttempt>[] = [
    {
      key: 'studentName',
      header: 'Student Name',
      sortable: true,
      render: (a) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{a.studentName || `Student #${a.studentUserId}`}</span>
          <span className="text-[11px] text-slate-400 font-mono">ID: {a.studentUserId}</span>
        </div>
      ),
    },
    {
      key: 'attemptNumber',
      header: 'Attempt',
      sortable: true,
      render: (a) => <span className="font-mono text-xs">#{a.attemptNumber}</span>,
    },
    {
      key: 'totalMarks',
      header: 'Score Obtained',
      sortable: true,
      render: (a) => (
        <span className="font-mono text-xs font-extrabold text-slate-900">
          {a.totalMarks !== undefined ? `${a.totalMarks} / ${selectedTest?.maximumMarks ?? '?'}` : 'Not scored'}
        </span>
      ),
    },
    {
      key: 'attemptStatus',
      header: 'Result (Passing Gate)',
      render: (a) => {
        const pass = selectedTest?.passingMarks;
        if (a.totalMarks === undefined || pass === undefined) {
          return <Badge variant="neutral" size="sm">{(a.attemptStatus || 'unknown').toUpperCase()}</Badge>;
        }
        return (
          <Badge variant={a.totalMarks >= pass ? 'success' : 'danger'} size="sm" dot>
            {a.totalMarks >= pass ? 'PASSED' : 'FAILED'}
          </Badge>
        );
      },
    },
    {
      key: 'submittedAt',
      header: 'Attempt Date',
      sortable: true,
      render: (a) => <span className="text-xs text-slate-500">{formatDate(a.submittedAt || a.startedAt)}</span>,
    },
    {
      key: 'id',
      header: 'Retake Status (BR-012)',
      render: (a) => {
        const granted = grantedFor(a.studentUserId);
        return (
          <Badge variant={granted > 0 ? 'purple' : 'neutral'} size="sm">
            {granted > 0 ? `+${granted} GRANTED` : 'STANDARD ATTEMPT'}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Administrative Action',
      render: (a) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setRetakeModalAttempt(a);
            setRetakeReason('');
            setAdditionalAttempts('1');
          }}
          className="text-xs border-indigo-300 text-indigo-600 hover:bg-indigo-50"
          leftIcon={<RotateCcw className="h-3 w-3" />}
        >
          Authorize Retake
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Examinations & Retake Overrides (ADM-011, BR-012)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor teacher-created tests and student attempts, and record audited retake authorizations.
          </p>
        </div>
      </div>

      {loadError && <Card className="p-4 border border-rose-200 bg-rose-50 text-xs text-rose-800">{loadError}</Card>}

      {/* Online Tests Catalog Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">Assessments Catalog ({tests.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((test) => (
            <Card
              key={test.id}
              className={`p-4 bg-white border space-y-2 cursor-pointer ${test.id === selectedTestId ? 'border-indigo-400 ring-1 ring-indigo-300' : 'border-slate-200'}`}
              onClick={() => setSelectedTestId(test.id)}
            >
              <div className="flex items-center justify-between">
                <Badge variant="info" size="sm">{test.durationMinutes} Minutes</Badge>
                <span className="text-xs font-bold text-slate-700">{test.maximumMarks} Marks</span>
              </div>
              <h4 className="font-bold text-slate-900 text-xs">{test.title}</h4>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                {test.courseName || `Course #${test.courseId}`}
                {test.batchCode ? ` · ${test.batchCode}` : ''}
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Pass Marks: <strong>{test.passingMarks ?? 'Not set'}</strong>
                </span>
                <span>
                  {test.attemptCount} Attempts · Max {test.maxAttempts}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Test Attempts & Retake Overrides */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
          Attempts{selectedTest ? `: ${selectedTest.title}` : ''} & Retake Approvals (BR-012)
        </h3>
        <DataTable data={attempts} columns={attemptColumns} searchPlaceholder="Search candidate name..." pageSize={10} />
      </div>

      {retakes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">Retake Authorization History</h3>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs">
            {retakes.map((r) => (
              <div key={r.id} className="p-3 bg-white flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-slate-900">{r.studentName || `Student #${r.studentUserId}`}</span>
                <span>+{r.additionalAttempts} attempt(s)</span>
                <span className="text-slate-500">{r.reason}</span>
                <span className="font-mono text-slate-400">
                  {formatDate(r.authorizedAt)} · by User #{r.authorizedByUserId}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Retake Override Modal (BR-012) */}
      {retakeModalAttempt && (
        <Modal isOpen={!!retakeModalAttempt} onClose={() => setRetakeModalAttempt(null)} title="Authorize Examination Retake Override (SRS BR-012)" size="md">
          <form onSubmit={handleAuthorizeRetake} className="space-y-4 text-xs text-slate-700">
            <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-indigo-600" /> Administrative Override (BR-012)
              </p>
              <p className="text-[11px] leading-relaxed">
                The authorization is stored with your user ID, the time and your reason, and is written to the audit log.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-400 block">Student Candidate</span>
                <span className="font-bold text-slate-900">{retakeModalAttempt.studentName || `Student #${retakeModalAttempt.studentUserId}`}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Attempt / Score</span>
                <span className="font-mono font-bold text-slate-800">
                  #{retakeModalAttempt.attemptNumber} · {retakeModalAttempt.totalMarks ?? 'Not scored'}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Additional Attempts *</label>
              <input
                required
                type="number"
                min={1}
                max={100}
                step={1}
                value={additionalAttempts}
                onChange={(e) => setAdditionalAttempts(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Mandatory Retake Authorization Reason (min 5 characters) *</label>
              <textarea
                required
                minLength={5}
                maxLength={500}
                rows={3}
                placeholder="State the academic or technical justification for granting another attempt..."
                value={retakeReason}
                onChange={(e) => setRetakeReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setRetakeModalAttempt(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Grant Retake Authorization
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
