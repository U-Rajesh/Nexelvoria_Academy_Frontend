import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Award,
  Clock,
  History,
  ShieldCheck,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { SEED_TEST_ATTEMPTS } from '../../mocks/seedData';
import { teacherService } from '../../services/teacherService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import type { TestAttempt } from '../../types';

export const TestRetakeAuthPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [attempts, setAttempts] = useState<TestAttempt[]>(SEED_TEST_ATTEMPTS);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  // Reject Modal State
  const [rejectingAttempt, setRejectingAttempt] = useState<TestAttempt | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    const loadAttempts = async () => {
      const teacherId = user?.id || 'user-tch-001';
      const res = await teacherService.getTestAttempts(teacherId);
      if (res.success) {
        // Ensure mock attempts have realistic retake request states
        const enriched = res.data.map((att, idx) => {
          if (idx === 1 && !att.retakeRequestStatus) {
            return {
              ...att,
              retakeRequestStatus: 'pending' as const,
              retakeRequestedAt: '2026-11-09T14:30:00Z',
            };
          }
          return att;
        });
        setAttempts(enriched);
      }
    };

    loadAttempts();
  }, [user]);

  const handleApprove = async (attempt: TestAttempt) => {
    if (!user) return;
    const res = await teacherService.authorizeTestRetake({ id: user.id, name: user.name }, attempt.id);

    if (res.success && res.data) {
      setAttempts((prev) => prev.map((a) => (a.id === res.data.id ? res.data : a)));
      showToast({
        type: 'success',
        title: 'Retake Authorized (TCH-011, BR-012)',
        message: `Examination retake granted for ${attempt.studentName}. LMS test engine unlocked.`,
      });
    }
  };

  const handleOpenRejectModal = (attempt: TestAttempt) => {
    setRejectingAttempt(attempt);
    setRejectionReason('');
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingAttempt || !rejectionReason.trim()) {
      showToast({ type: 'error', message: 'Rejection reason is mandatory per SRS Rule TCH-011.' });
      return;
    }

    setIsRejecting(true);
    const res = await teacherService.rejectTestRetake(
      { id: user?.id || 'user-tch-001', name: user?.name || 'Dr. Vikram Rao' },
      rejectingAttempt.id,
      rejectionReason.trim()
    );
    setIsRejecting(false);

    if (res.success && res.data) {
      setAttempts((prev) => prev.map((a) => (a.id === res.data.id ? res.data : a)));
      setRejectingAttempt(null);
      showToast({
        type: 'info',
        title: 'Retake Rejected',
        message: `Retake request for ${rejectingAttempt.studentName} was declined with recorded reason.`,
      });
    }
  };

  const pendingRequests = attempts.filter((a) => a.retakeRequestStatus === 'pending' || (!a.isRetakeAuthorized && !a.retakeRejectedReason && !a.isPassed));
  const historyRequests = attempts.filter((a) => a.isRetakeAuthorized || a.retakeRequestStatus === 'rejected' || a.retakeRejectedReason);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Examination Retake Authorization</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review candidate re-examination requests pursuant to <strong>SRS Rule TCH-011 & BR-012</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="warning" size="md" dot>
            {pendingRequests.length} Pending Approval
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Pending Requests ({pendingRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Retake Audit History ({historyRequests.length})
        </button>
      </div>

      {/* Pending Requests Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card className="p-12 text-center text-xs text-slate-400">
              <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
              <p className="font-semibold text-slate-700">No Pending Retake Requests</p>
              <p className="mt-1">All re-examination petitions have been evaluated.</p>
            </Card>
          ) : (
            pendingRequests.map((attempt) => (
              <Card key={attempt.id} className="p-6 space-y-4 border-amber-200/80 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{attempt.studentName}</span>
                      <Badge variant="danger" size="sm" dot>Failed (Score: {attempt.totalScore}/50)</Badge>
                      <Badge variant="purple" size="sm">Oct 2026 Morning Cohort</Badge>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Java 21 Enterprise & Spring Boot Assessment
                    </p>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500">
                    Requested: {attempt.retakeRequestedAt ? formatDate(attempt.retakeRequestedAt) : 'Recent'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Candidate Statement / Reason:</span>
                  <p className="italic">
                    "I experienced sudden network disconnection on question 14 during my first attempt, resulting in premature test auto-submission. Requesting authorization to retake."
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Attempt ID: {attempt.id} • Passing Threshold: 60%
                  </span>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenRejectModal(attempt)}
                      className="text-rose-600 hover:bg-rose-50 border-rose-200"
                    >
                      Reject with Reason
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-teal-600 hover:bg-teal-700"
                      onClick={() => handleApprove(attempt)}
                      leftIcon={<CheckCircle2 className="h-4 w-4" />}
                    >
                      Approve Retake (BR-012)
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Retake Audit History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {historyRequests.length === 0 ? (
            <Card className="p-10 text-center text-xs text-slate-400">
              No previous retake decisions recorded.
            </Card>
          ) : (
            historyRequests.map((attempt) => (
              <Card key={attempt.id} className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{attempt.studentName}</span>
                      {attempt.isRetakeAuthorized ? (
                        <Badge variant="success" size="sm" dot>Retake Approved</Badge>
                      ) : (
                        <Badge variant="danger" size="sm" dot>Retake Declined</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Java 21 Enterprise & Spring Boot Assessment
                    </p>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 font-mono">
                    {attempt.isRetakeAuthorized && (
                      <span>Authorized by: {attempt.retakeAuthorizedBy || 'Dr. Vikram Rao'}</span>
                    )}
                  </div>
                </div>

                {attempt.retakeRejectedReason && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-900">
                    <strong>Rejection Reason:</strong> {attempt.retakeRejectedReason}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Mandatory Rejection Reason Modal (TCH-011) */}
      {rejectingAttempt && (
        <Modal
          isOpen={!!rejectingAttempt}
          onClose={() => setRejectingAttempt(null)}
          title="Decline Retake Request (Mandatory Reason Required)"
          size="md"
        >
          <form onSubmit={handleConfirmReject} className="space-y-4 text-xs text-slate-700">
            <p className="text-slate-600">
              Per <strong>SRS Rule TCH-011</strong>, declining an examination retake requires recording a formal academic reason for candidate auditing.
            </p>

            <div>
              <label className="block font-semibold mb-1">
                Formal Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="State specific reason (e.g., student has already exhausted maximum permitted test attempts, or submission logs show all questions were answered without anomaly)..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button variant="outline" size="sm" type="button" onClick={() => setRejectingAttempt(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                isLoading={isRejecting}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Rejection with Reason
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
