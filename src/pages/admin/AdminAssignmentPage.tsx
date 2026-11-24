import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { adminService, type AcademicAssignment, type AcademicSubmission, type EvaluationVersion } from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { Modal } from '../../components/feedback/Modal';
import { Card } from '../../components/common/Card';

export const AdminAssignmentPage: React.FC = () => {
  const { showToast } = useNotification();
  const [assignments, setAssignments] = useState<AcademicAssignment[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedAssignment, setSelectedAssignment] = useState<AcademicAssignment | null>(null);
  const [submissions, setSubmissions] = useState<AcademicSubmission[]>([]);

  // Evaluation form (one submission at a time)
  const [evaluating, setEvaluating] = useState<AcademicSubmission | null>(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ASM-012: evaluation history of one submission (all versions, newest first)
  const [historyFor, setHistoryFor] = useState<string | null>(null);
  const [history, setHistory] = useState<EvaluationVersion[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const toggleHistory = async (submissionId: string) => {
    if (historyFor === submissionId) return setHistoryFor(null);
    setHistoryFor(submissionId);
    setHistory([]);
    setHistoryError(null);
    const res = await adminService.getEvaluationHistory(submissionId);
    if (res.success) setHistory(res.data);
    else setHistoryError(res.error || 'The evaluation history could not be loaded.');
  };

  const loadData = async () => {
    const res = await adminService.getAcademicAssignments();
    if (res.success) {
      setAssignments(res.data);
      setLoadError(null);
    } else {
      setLoadError(res.error || 'Assignments could not be loaded.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openSubmissions = async (a: AcademicAssignment) => {
    setSelectedAssignment(a);
    setSubmissions([]);
    setEvaluating(null);
    const res = await adminService.getAssignmentSubmissions(a.id);
    if (res.success) setSubmissions(res.data);
    else showToast({ type: 'error', title: 'Submissions unavailable', message: res.error || 'Please retry.' });
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluating || !selectedAssignment) return;
    const value = Number(marks);
    if (!Number.isFinite(value) || value < 0 || value > selectedAssignment.maximumMarks) return;
    setIsSubmitting(true);
    const res = await adminService.evaluateSubmission(evaluating.id, {
      marksAwarded: value,
      ...(feedback.trim() ? { feedback: feedback.trim() } : {}),
    });
    setIsSubmitting(false);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Evaluation Recorded',
        message: `Saved as evaluation version ${res.data?.latestEvaluation?.evaluationVersion ?? ''}; earlier evaluations are kept.`,
      });
      setEvaluating(null);
      setMarks('');
      setFeedback('');
      openSubmissions(selectedAssignment);
      loadData();
    } else {
      showToast({ type: 'error', title: 'Evaluation not saved', message: res.error || 'Please retry.' });
    }
  };

  const columns: Column<AcademicAssignment>[] = [
    {
      key: 'title',
      header: 'Assignment Title',
      sortable: true,
      render: (a) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{a.title}</span>
          {a.instructions && <span className="text-[11px] text-slate-500 line-clamp-1">{a.instructions}</span>}
        </div>
      ),
    },
    {
      key: 'courseName',
      header: 'Course Program',
      render: (a) => <span className="font-semibold text-slate-800 text-xs">{a.courseName || a.courseId}</span>,
    },
    {
      key: 'batchCode',
      header: 'Batch Cohort',
      render: (a) => (a.batchId ? <Badge variant="purple" size="sm">{a.batchCode || a.batchId}</Badge> : <span className="text-[11px] text-slate-400">All batches</span>),
    },
    {
      key: 'maximumMarks',
      header: 'Max Marks',
      sortable: true,
      render: (a) => <span className="text-xs font-bold text-slate-900">{a.maximumMarks} Pts</span>,
    },
    {
      key: 'dueAt',
      header: 'Due Deadline',
      sortable: true,
      render: (a) => <span className="text-xs text-slate-500">{a.dueAt ? formatDate(a.dueAt) : 'No deadline'}</span>,
    },
    {
      key: 'submissionCount',
      header: 'Submissions Count',
      render: (a) => (
        <div>
          <span className="text-xs font-bold text-slate-900">{a.submissionCount} Submissions</span>
          <span className="text-[11px] text-emerald-600 block">({a.evaluatedCount} Evaluated)</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (a) => (
        <Button variant="ghost" size="sm" onClick={() => openSubmissions(a)} className="text-xs text-indigo-600 hover:bg-indigo-50">
          View Submissions →
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assignment Oversight (ADM-011)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Oversight of teacher-created assignments and student submissions. Admin evaluations are added as new versions; earlier evaluations are never overwritten.
          </p>
        </div>
      </div>

      {loadError && <Card className="p-4 border border-rose-200 bg-rose-50 text-xs text-rose-800">{loadError}</Card>}

      {/* Main Table */}
      <DataTable data={assignments} columns={columns} searchPlaceholder="Search assignment title or course..." pageSize={10} />

      {/* Submissions Detail Modal */}
      {selectedAssignment && (
        <Modal isOpen={!!selectedAssignment} onClose={() => setSelectedAssignment(null)} title={`Submissions: ${selectedAssignment.title}`} size="lg">
          <div className="space-y-4 text-xs text-slate-700">
            {selectedAssignment.instructions && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-400 block uppercase font-semibold">Task Instructions</span>
                <p className="text-slate-700 mt-1 leading-relaxed">{selectedAssignment.instructions}</p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">Student Submissions ({submissions.length})</h4>

              {submissions.length === 0 ? (
                <p className="text-slate-400 italic p-4 text-center">No submissions recorded yet for this task.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="p-4 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">{sub.studentName || `Student #${sub.studentUserId}`}</span>
                          <span className="text-[11px] text-slate-400">
                            Submitted on: {formatDate(sub.submittedAt)} · Version {sub.submissionVersion}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-indigo-700">
                            {sub.latestEvaluation ? `${sub.latestEvaluation.marksAwarded} / ${selectedAssignment.maximumMarks}` : 'Ungraded'}
                          </span>
                          {sub.submissionStatus && (
                            <Badge variant={sub.latestEvaluation ? 'success' : 'warning'} size="sm" className="ml-2">
                              {sub.submissionStatus.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {sub.gitHubUrl && (
                        <div className="flex items-center gap-1.5 text-indigo-600 font-mono">
                          <ExternalLink className="h-3 w-3" />
                          <a href={sub.gitHubUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {sub.gitHubUrl}
                          </a>
                        </div>
                      )}
                      {sub.textContent && <p className="p-2 rounded bg-slate-50 border border-slate-100 whitespace-pre-wrap">{sub.textContent}</p>}

                      {sub.latestEvaluation?.feedback && (
                        <div className="p-2.5 rounded bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-900">
                          <strong>Feedback (v{sub.latestEvaluation.evaluationVersion}):</strong> {sub.latestEvaluation.feedback}
                        </div>
                      )}

                      {sub.latestEvaluation && (
                        <div className="text-[11px]">
                          <button type="button" className="text-indigo-600 hover:underline" onClick={() => toggleHistory(sub.id)}>
                            {historyFor === sub.id ? 'Hide evaluation history' : 'Show evaluation history'}
                          </button>
                          {historyFor === sub.id && (
                            <div className="mt-1 p-2 rounded border border-slate-200 bg-white space-y-1">
                              {historyError ? (
                                <span className="text-rose-700">{historyError}</span>
                              ) : history.length === 0 ? (
                                <span className="text-slate-400">Loading…</span>
                              ) : (
                                history.map((h) => (
                                  <div key={h.id} className="flex flex-wrap gap-x-2">
                                    <strong>v{h.evaluationVersion}</strong>
                                    <span>{h.marksAwarded} marks</span>
                                    <span className="text-slate-500">by {h.evaluatedByName ?? `User #${h.evaluatedByUserId}`}</span>
                                    <span className="text-slate-400">{new Date(h.evaluatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                                    {h.feedback && <span className="italic text-slate-600">"{h.feedback}"</span>}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {evaluating?.id === sub.id ? (
                        <form onSubmit={handleEvaluate} className="p-3 rounded-lg border border-indigo-200 bg-indigo-50 space-y-2">
                          <div className="grid grid-cols-3 gap-2 items-end">
                            <div>
                              <label className="block font-semibold text-slate-800 mb-1">Marks (0–{selectedAssignment.maximumMarks}) *</label>
                              <input
                                required
                                type="number"
                                min={0}
                                max={selectedAssignment.maximumMarks}
                                step="0.01"
                                value={marks}
                                onChange={(e) => setMarks(e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block font-semibold text-slate-800 mb-1">Feedback</label>
                              <input
                                maxLength={4000}
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setEvaluating(null)}>
                              Cancel
                            </Button>
                            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                              Save Evaluation
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-indigo-600 hover:bg-indigo-50"
                            onClick={() => {
                              setEvaluating(sub);
                              setMarks('');
                              setFeedback('');
                            }}
                          >
                            {sub.latestEvaluation ? 'Re-evaluate' : 'Evaluate'}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedAssignment(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
