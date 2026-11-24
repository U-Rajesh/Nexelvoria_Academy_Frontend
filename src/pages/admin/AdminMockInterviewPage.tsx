import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Video, Plus, FileText, GraduationCap, BookOpen, Search, ChevronDown, ChevronUp, Sparkles, Edit, Power } from 'lucide-react';
import {
  adminService,
  type AdminInterviewQuestion,
  type AdminMockInterview,
  type QuestionDifficulty,
} from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { Modal } from '../../components/feedback/Modal';
import { Card } from '../../components/common/Card';
import type { StudentProfile, TeacherProfile } from '../../types';

const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium';
const DIFFICULTIES: QuestionDifficulty[] = ['beginner', 'intermediate', 'advanced'];
const difficultyVariant = (d?: QuestionDifficulty) => (d === 'beginner' ? 'success' : d === 'intermediate' ? 'warning' : 'danger');
const emptyQuestion = { category: '', questionText: '', difficultyLevel: 'intermediate' as QuestionDifficulty, sampleAnswer: '' };

export const AdminMockInterviewPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const toastError = (title: string, error?: string) => showToast({ type: 'error', title, message: error || 'Please retry.' });

  const [interviews, setInterviews] = useState<AdminMockInterview[]>([]);
  const [questions, setQuestions] = useState<AdminInterviewQuestion[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'schedules' | 'question_bank'>('schedules');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [showInactive, setShowInactive] = useState(false);
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<string[]>([]);

  // Schedule
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Evaluate / view
  const [selected, setSelected] = useState<AdminMockInterview | null>(null);
  const [evalScore, setEvalScore] = useState('');
  const [evalFeedback, setEvalFeedback] = useState('');
  const [evalStatus, setEvalStatus] = useState<'completed' | 'cancelled'>('completed');

  // Question add / edit
  const [questionModal, setQuestionModal] = useState<{ mode: 'create' } | { mode: 'edit'; question: AdminInterviewQuestion } | null>(null);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [mRes, qRes, sRes, tRes] = await Promise.all([
      adminService.getMockInterviews(),
      adminService.getInterviewQuestions(true),
      adminService.getStudents(),
      adminService.getTeachers(),
    ]);
    setIsLoading(false);
    const failed = [mRes, qRes, sRes, tRes].find((r) => !r.success);
    setLoadError(failed ? failed.error || 'Data could not be loaded.' : null);
    if (mRes.success) setInterviews(mRes.data);
    if (qRes.success) setQuestions(qRes.data);
    if (sRes.success) {
      setStudents(sRes.data);
      setStudentId((cur) => cur || sRes.data[0]?.id || '');
    }
    if (tRes.success) {
      setTeachers(tRes.data);
      setTrainerId((cur) => cur || tRes.data[0]?.id || '');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const categories = ['All', ...Array.from(new Set(questions.map((q) => q.category))).sort()];
  const filteredQuestions = questions.filter((q) => {
    const s = searchQuery.toLowerCase();
    return (
      (showInactive || q.isActive !== false) &&
      (q.questionText.toLowerCase().includes(s) || q.category.toLowerCase().includes(s) || (q.sampleAnswer ?? '').toLowerCase().includes(s)) &&
      (selectedCategory === 'All' || q.category === selectedCategory) &&
      (selectedDifficulty === 'All' || q.difficultyLevel === selectedDifficulty)
    );
  });

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !trainerId || !scheduledAt) return;
    setIsSubmitting(true);
    const res = await adminService.scheduleMockInterview({
      studentUserId: studentId,
      teacherUserId: trainerId,
      scheduledAt: new Date(scheduledAt).toISOString(),
      ...(meetingLink.trim() ? { meetingUrl: meetingLink.trim() } : {}),
    });
    setIsSubmitting(false);
    if (res.success) {
      const s = students.find((x) => x.id === studentId);
      showToast({ type: 'success', title: 'Mock Interview Scheduled', message: `Mock interview booked for ${s?.name || 'the student'}. (PLC-009)` });
      setIsScheduleModalOpen(false);
      setScheduledAt('');
      loadData();
    } else toastError('Not scheduled', res.error);
  };

  const openInterview = (m: AdminMockInterview) => {
    setSelected(m);
    setEvalScore('');
    setEvalFeedback('');
    setEvalStatus('completed');
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const score = Number(evalScore);
    if (!Number.isFinite(score) || score < 0 || score > 100) return;
    setIsSubmitting(true);
    const res = await adminService.evaluateMockInterview(selected.id, { overallScore: score, feedback: evalFeedback.trim(), status: evalStatus });
    setIsSubmitting(false);
    if (res.success) {
      showToast({ type: 'success', title: evalStatus === 'completed' ? 'Evaluation Recorded' : 'Interview Cancelled', message: 'The result is saved and cannot be overwritten. (PLC-010)' });
      setSelected(null);
      loadData();
    } else toastError('Not saved', res.error);
  };

  const openQuestion = (q?: AdminInterviewQuestion) => {
    if (q) {
      setQuestionModal({ mode: 'edit', question: q });
      setQuestionForm({ category: q.category, questionText: q.questionText, difficultyLevel: q.difficultyLevel ?? 'intermediate', sampleAnswer: q.sampleAnswer ?? '' });
    } else {
      setQuestionModal({ mode: 'create' });
      setQuestionForm(emptyQuestion);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionModal) return;
    setIsSubmitting(true);
    const body = {
      category: questionForm.category.trim(),
      questionText: questionForm.questionText.trim(),
      difficultyLevel: questionForm.difficultyLevel,
    };
    const res =
      questionModal.mode === 'create'
        ? await adminService.addInterviewQuestion({ ...body, ...(questionForm.sampleAnswer.trim() ? { sampleAnswer: questionForm.sampleAnswer.trim() } : {}) })
        : await adminService.updateInterviewQuestion(questionModal.question.id, { ...body, sampleAnswer: questionForm.sampleAnswer.trim() || null });
    setIsSubmitting(false);
    if (res.success) {
      showToast({ type: 'success', title: 'Question Saved', message: res.message || 'The question bank was updated. (PLC-011)' });
      setQuestionModal(null);
      loadData();
    } else toastError('Question not saved', res.error);
  };

  const handleQuestionActive = async (q: AdminInterviewQuestion) => {
    const res = await adminService.setInterviewQuestionActive(q.id, q.isActive === false);
    if (res.success) {
      showToast({ type: 'info', title: 'Question Status', message: res.message || 'Status changed.' });
      loadData();
    } else toastError('Status not changed', res.error);
  };

  const columns: Column<AdminMockInterview>[] = [
    {
      key: 'studentName',
      header: 'Candidate Student',
      sortable: true,
      render: (m) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{m.studentName || `Student #${m.studentUserId}`}</span>
          <span className="text-[11px] text-slate-400 font-mono">ID: {m.studentUserId}</span>
        </div>
      ),
    },
    {
      key: 'teacherName',
      header: 'Interviewer Panelist',
      render: (m) => (
        <div className="flex items-center gap-1.5">
          <GraduationCap className="h-4 w-4 text-indigo-600" />
          <span className="text-xs font-semibold text-slate-800">{m.teacherName || `Teacher #${m.teacherUserId}`}</span>
        </div>
      ),
    },
    {
      key: 'scheduledAt',
      header: 'Date & Time',
      sortable: true,
      render: (m) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs block">{formatDate(m.scheduledAt)}</span>
          <span className="text-[11px] text-slate-500 font-mono">{new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      ),
    },
    {
      key: 'interviewStatus',
      header: 'Status',
      sortable: true,
      render: (m) => (
        <Badge variant={m.interviewStatus === 'completed' ? 'success' : m.interviewStatus === 'scheduled' ? 'info' : 'neutral'} size="sm" dot>
          {m.interviewStatus.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'overallScore',
      header: 'Score',
      render: (m) => <span className="text-xs font-bold">{m.overallScore != null ? `${m.overallScore} / 100` : '—'}</span>,
    },
    {
      key: 'meetingUrl',
      header: 'Meeting Link',
      render: (m) =>
        m.meetingUrl ? (
          <a href={m.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-mono">
            <Video className="h-3 w-3" /> Join Call
          </a>
        ) : (
          <span className="text-slate-400 text-xs">No link</span>
        ),
    },
    {
      key: 'actions',
      header: 'Feedback Report',
      render: (m) => (
        <Button variant="ghost" size="sm" onClick={() => openInterview(m)} className="text-xs text-indigo-600 hover:bg-indigo-50" leftIcon={<FileText className="h-3.5 w-3.5" />}>
          {m.interviewStatus === 'scheduled' && isAdmin ? 'Evaluate' : 'View Report'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mock Interviews & Placement Readiness</h1>
          <p className="text-xs text-slate-500 mt-1">
            Schedule mock interviews (PLC-009), record evaluations (PLC-010) and maintain the interview question bank (PLC-011).
          </p>
        </div>
        {isAdmin && activeTab === 'schedules' && (
          <Button variant="primary" size="sm" onClick={() => setIsScheduleModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
            Schedule Mock Interview
          </Button>
        )}
        {isAdmin && activeTab === 'question_bank' && (
          <Button variant="primary" size="sm" onClick={() => openQuestion()} leftIcon={<Plus className="h-4 w-4" />}>
            Add Question
          </Button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${activeTab === 'schedules' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Calendar className="h-4 w-4" />
          Scheduled Sessions ({interviews.length})
        </button>
        <button
          onClick={() => setActiveTab('question_bank')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${activeTab === 'question_bank' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <BookOpen className="h-4 w-4" />
          Question Bank (PLC-011)
          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">{questions.filter((q) => q.isActive !== false).length}</span>
        </button>
      </div>

      {loadError && <Card className="p-4 border border-rose-200 bg-rose-50 text-xs text-rose-800">{loadError}</Card>}
      {isLoading && <p className="text-xs text-slate-400">Loading…</p>}

      {/* Tab 1: Scheduled Interviews */}
      {activeTab === 'schedules' && (
        <>
          {!isLoading && interviews.length === 0 && <p className="text-xs text-slate-400 italic">No mock interviews scheduled yet.</p>}
          <DataTable data={interviews} columns={columns} searchPlaceholder="Search candidate or interviewer..." pageSize={10} />
        </>
      )}

      {/* Tab 2: Question Bank */}
      {activeTab === 'question_bank' && (
        <div className="space-y-6">
          <Card className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search questions, categories or suggested answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="p-2 text-xs border border-slate-200 rounded-lg bg-white">
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      Category: {c}
                    </option>
                  ))}
                </select>
                <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)} className="p-2 text-xs border border-slate-200 rounded-lg bg-white">
                  {['All', ...DIFFICULTIES].map((d) => (
                    <option key={d} value={d}>
                      Difficulty: {d}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-xs text-slate-600 whitespace-nowrap">
                  <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Show inactive
                </label>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              Showing <strong>{filteredQuestions.length}</strong> of {questions.length} questions
            </div>
          </Card>

          {!isLoading && filteredQuestions.length === 0 && <p className="text-xs text-slate-400 italic">No questions match.</p>}
          <div className="space-y-4">
            {filteredQuestions.map((q) => {
              const isExpanded = expandedQuestionIds.includes(q.id);
              return (
                <Card key={q.id} className={`p-5 space-y-3 ${q.isActive === false ? 'opacity-60' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {q.difficultyLevel && (
                        <Badge variant={difficultyVariant(q.difficultyLevel)} size="sm">
                          {q.difficultyLevel}
                        </Badge>
                      )}
                      <Badge variant="purple" size="sm">
                        {q.category}
                      </Badge>
                      {q.isActive === false && <Badge variant="neutral" size="sm">INACTIVE</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openQuestion(q)} leftIcon={<Edit className="h-3 w-3" />} className="text-xs">
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleQuestionActive(q)} leftIcon={<Power className="h-3 w-3" />} className="text-xs">
                            {q.isActive === false ? 'Activate' : 'Deactivate'}
                          </Button>
                        </>
                      )}
                      {q.sampleAnswer && (
                        <button
                          onClick={() => setExpandedQuestionIds((prev) => (prev.includes(q.id) ? prev.filter((x) => x !== q.id) : [...prev, q.id]))}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              Hide Suggested Answer <ChevronUp className="h-3.5 w-3.5" />
                            </>
                          ) : (
                            <>
                              View Suggested Answer <ChevronDown className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium whitespace-pre-wrap">{q.questionText}</p>
                  {isExpanded && q.sampleAnswer && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Suggested Answer</span>
                      </div>
                      <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{q.sampleAnswer}</div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && isAdmin && (
        <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title="Schedule Mock Interview (PLC-009)" size="md">
          <form onSubmit={handleSchedule} className="space-y-4 text-xs text-slate-700">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Candidate Student *</label>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={inputCls} required>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.collegeName ? `(${s.collegeName})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">Only students with an active (paid or authorized) enrollment can be scheduled (BR-013).</p>
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Faculty Interviewer *</label>
              <select value={trainerId} onChange={(e) => setTrainerId(e.target.value)} className={inputCls} required>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.specialization ? `(${t.specialization})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Date & Time * (future)</label>
              <input type="datetime-local" required value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Video Call URL</label>
              <input type="url" maxLength={1000} value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} className={`${inputCls} font-mono`} />
            </div>
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsScheduleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Confirm Interview
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Evaluate / Report Modal */}
      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Mock Interview: ${selected.studentName || `Student #${selected.studentUserId}`}`} size="md">
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Interviewer: {selected.teacherName || `Teacher #${selected.teacherUserId}`}</span>
                <Badge variant={selected.interviewStatus === 'completed' ? 'success' : selected.interviewStatus === 'scheduled' ? 'info' : 'neutral'} size="sm">
                  {selected.interviewStatus.toUpperCase()}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500">Scheduled on: {new Date(selected.scheduledAt).toLocaleString()}</p>
            </div>

            {selected.interviewStatus !== 'scheduled' ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-400 block">Overall Score</span>
                  <span className="text-base font-extrabold text-indigo-700">{selected.overallScore != null ? `${selected.overallScore} / 100` : '—'}</span>
                </div>
                {selected.feedback && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-900 space-y-1">
                    <strong>Feedback:</strong>
                    <p className="text-[11px] leading-relaxed whitespace-pre-wrap">{selected.feedback}</p>
                  </div>
                )}
              </div>
            ) : isAdmin ? (
              <form onSubmit={handleEvaluate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Result *</label>
                    <select value={evalStatus} onChange={(e) => setEvalStatus(e.target.value as 'completed' | 'cancelled')} className={inputCls}>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Overall Score (0–100) *</label>
                    <input type="number" required min={0} max={100} step="0.01" value={evalScore} onChange={(e) => setEvalScore(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Feedback * (min 5 characters)</label>
                  <textarea required minLength={5} rows={4} value={evalFeedback} onChange={(e) => setEvalFeedback(e.target.value)} className={inputCls} />
                </div>
                <p className="text-[11px] text-slate-500">A recorded result cannot be changed afterwards.</p>
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                    Save Result
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-6 text-center text-slate-400 border border-dashed rounded-lg">
                <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p>Interview scheduled. The result will appear after the session.</p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Question Modal */}
      {questionModal && (
        <Modal isOpen={!!questionModal} onClose={() => setQuestionModal(null)} title={questionModal.mode === 'create' ? 'Add Interview Question (PLC-011)' : 'Edit Interview Question'} size="md">
          <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs text-slate-700">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Category *</label>
                <input required minLength={2} maxLength={100} list="question-categories" value={questionForm.category} onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })} className={inputCls} />
                <datalist id="question-categories">
                  {categories
                    .filter((c) => c !== 'All')
                    .map((c) => (
                      <option key={c} value={c} />
                    ))}
                </datalist>
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Difficulty</label>
                <select value={questionForm.difficultyLevel} onChange={(e) => setQuestionForm({ ...questionForm, difficultyLevel: e.target.value as QuestionDifficulty })} className={inputCls}>
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Question * (min 5 characters)</label>
              <textarea required minLength={5} rows={3} value={questionForm.questionText} onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Suggested Answer</label>
              <textarea rows={4} value={questionForm.sampleAnswer} onChange={(e) => setQuestionForm({ ...questionForm, sampleAnswer: e.target.value })} className={inputCls} />
            </div>
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setQuestionModal(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save Question
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
