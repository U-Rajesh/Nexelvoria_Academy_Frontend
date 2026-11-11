import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
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
import type { OnlineTest, TestAttempt, Course, Batch } from '../../types';

export const AdminTestPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [tests, setTests] = useState<OnlineTest[]>([]);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Retake Override Modal State (BR-012)
  const [retakeModalAttempt, setRetakeModalAttempt] = useState<TestAttempt | null>(null);
  const [retakeReason, setRetakeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    const [tRes, attRes, cRes, bRes] = await Promise.all([
      adminService.getTests(),
      adminService.getTestAttempts(),
      adminService.getCourses(),
      adminService.getBatches(),
    ]);

    if (tRes.success) setTests(tRes.data);
    if (attRes.success) setAttempts(attRes.data);
    if (cRes.success) setCourses(cRes.data);
    if (bRes.success) setBatches(bRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAuthorizeRetake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !retakeModalAttempt || !retakeReason.trim()) return;

    setIsSubmitting(true);
    const res = await adminService.authorizeTestRetake(
      { id: user.id, name: user.name },
      retakeModalAttempt.id,
      retakeReason
    );
    setIsSubmitting(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Exam Retake Authorized (BR-012)',
        message: `Student ${retakeModalAttempt.studentName} has been authorized to retake the examination. System audit logged.`,
      });
      setRetakeModalAttempt(null);
      setRetakeReason('');
      loadData();
    }
  };

  const attemptColumns: Column<TestAttempt>[] = [
    {
      key: 'studentName',
      header: 'Student Name',
      sortable: true,
      render: (a) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{a.studentName}</span>
          <span className="text-[11px] text-slate-400 font-mono">ID: {a.studentId}</span>
        </div>
      ),
    },
    {
      key: 'testId',
      header: 'Examination Test',
      render: (a) => {
        const test = tests.find((t) => t.id === a.testId);
        return <span className="font-semibold text-slate-800 text-xs">{test?.title || a.testId}</span>;
      },
    },
    {
      key: 'totalScore',
      header: 'Score Obtained',
      sortable: true,
      render: (a) => (
        <span className="font-mono text-xs font-extrabold text-slate-900">
          {a.totalScore} Pts
        </span>
      ),
    },
    {
      key: 'isPassed',
      header: 'Result (Passing Gate)',
      sortable: true,
      render: (a) => (
        <Badge variant={a.isPassed ? 'success' : 'danger'} size="sm" dot>
          {a.isPassed ? 'PASSED' : 'FAILED'}
        </Badge>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Attempt Date',
      sortable: true,
      render: (a) => <span className="text-xs text-slate-500">{formatDate(a.submittedAt)}</span>,
    },
    {
      key: 'isRetakeAuthorized',
      header: 'Retake Status (BR-012)',
      sortable: true,
      render: (a) => (
        <Badge variant={a.isRetakeAuthorized ? 'purple' : 'neutral'} size="sm">
          {a.isRetakeAuthorized ? 'RETAKE GRANTED' : 'STANDARD ATTEMPT'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Administrative Action',
      render: (a) => (
        <Button
          variant="outline"
          size="sm"
          disabled={a.isRetakeAuthorized}
          onClick={() => {
            setRetakeModalAttempt(a);
            setRetakeReason(
              `Technical connectivity interruption during exam session verified. Authorized retake per institute policy BR-012.`
            );
          }}
          className={`text-xs ${
            a.isRetakeAuthorized
              ? 'opacity-40 cursor-not-allowed'
              : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50'
          }`}
          leftIcon={<RotateCcw className="h-3 w-3" />}
        >
          {a.isRetakeAuthorized ? 'Override Active' : 'Authorize Retake'}
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
            Institutional examination monitoring, candidate evaluation records, and administrator overrides for re-examination authorizations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="purple" size="md">
            Passing Threshold: 60% Required (BR-011)
          </Badge>
        </div>
      </div>

      {/* Online Tests Catalog Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
          Published Assessments Catalog ({tests.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((test) => {
            const courseObj = courses.find((c) => c.id === test.courseId);
            return (
              <Card key={test.id} className="p-4 bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="info" size="sm">{test.durationMinutes} Minutes</Badge>
                  <span className="text-xs font-bold text-slate-700">{test.totalMarks} Marks</span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs">{test.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-1">{courseObj?.title}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Pass Threshold: <strong>{test.passingPercentage}%</strong></span>
                  <span>{test.questions.length} Questions</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Test Attempts & Retake Overrides */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
          Student Examination Attempts & Retake Approvals (BR-012)
        </h3>

        <DataTable
          data={attempts}
          columns={attemptColumns}
          searchPlaceholder="Search candidate name or examination..."
          pageSize={10}
        />
      </div>

      {/* Retake Override Modal (BR-012) */}
      {retakeModalAttempt && (
        <Modal
          isOpen={!!retakeModalAttempt}
          onClose={() => setRetakeModalAttempt(null)}
          title="Authorize Examination Retake Override (SRS BR-012)"
          size="md"
        >
          <form onSubmit={handleAuthorizeRetake} className="space-y-4 text-xs text-slate-700">
            <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-indigo-600" /> Administrative Override (BR-012)
              </p>
              <p className="text-[11px] leading-relaxed">
                Under standard rules, students are locked after their test attempt. An Administrator or Teacher can authorize an additional attempt with a verified justification.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-400 block">Student Candidate</span>
                <span className="font-bold text-slate-900">{retakeModalAttempt.studentName}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Previous Score</span>
                <span className="font-mono font-bold text-rose-600">
                  {retakeModalAttempt.totalScore} Pts ({retakeModalAttempt.isPassed ? 'Passed' : 'Failed'})
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Mandatory Retake Authorization Reason *
              </label>
              <textarea
                required
                rows={3}
                placeholder="State the academic or technical justification for granting a second test attempt..."
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

