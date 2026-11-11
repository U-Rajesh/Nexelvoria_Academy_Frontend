import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Send,
  Flag,
} from 'lucide-react';
import { SEED_TESTS } from '../../mocks/seedData';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import type { Question, TestAttempt } from '../../types';

export const TestEnginePage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const { user } = useAuth();
  const { showToast } = useNotification();

  const test = SEED_TESTS.find((t) => t.id === testId) || SEED_TESTS[0];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(test.durationMinutes * 60);
  const [answers, setAnswers] = useState<Record<string, { selectedOptionIds?: string[]; textAnswer?: string; codeAnswer?: string }>>({
    'q-1': { selectedOptionIds: ['opt-b'] },
  });
  const [flaggedQuestionIds, setFlaggedQuestionIds] = useState<string[]>([]);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [resultAttempt, setResultAttempt] = useState<TestAttempt | null>(null);

  const handleSubmitFinal = useCallback(async () => {
    if (!user) return;
    const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
      questionId: qId,
      selectedOptionIds: val.selectedOptionIds,
      textAnswer: val.textAnswer,
      codeAnswer: val.codeAnswer,
    }));

    const res = await studentService.submitTestAttempt(user.id, user.name, test.id, formattedAnswers);
    setConfirmSubmitOpen(false);

    if (res.success && res.data) {
      setResultAttempt(res.data);
      showToast({
        type: 'success',
        title: 'Examination Submitted',
        message: 'Your examination scorecard is ready.',
      });
    }
  }, [user, answers, test.id, showToast]);

  const submitRef = useRef(handleSubmitFinal);
  submitRef.current = handleSubmitFinal;

  // Timer countdown
  useEffect(() => {
    if (resultAttempt) return; // Stop timer once submitted
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          submitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resultAttempt]);

  const currentQ: Question = test.questions[currentIdx];

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const toggleFlag = (qId: string) => {
    setFlaggedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const handleSelectOption = (qId: string, optId: string, isMulti: boolean) => {
    setAnswers((prev) => {
      const current = prev[qId]?.selectedOptionIds || [];
      if (isMulti) {
        const next = current.includes(optId) ? current.filter((id) => id !== optId) : [...current, optId];
        return { ...prev, [qId]: { ...prev[qId], selectedOptionIds: next } };
      }
      return { ...prev, [qId]: { ...prev[qId], selectedOptionIds: [optId] } };
    });
  };



  // If already submitted, display scorecard view
  if (resultAttempt) {
    const scorePct = Math.round((resultAttempt.totalScore / test.totalMarks) * 100);
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-6">
        <Card className="p-8 text-center space-y-6 shadow-xl border-slate-200">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            {resultAttempt.isPassed ? (
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-10 w-10 text-rose-600" />
            )}
          </div>

          <div className="space-y-1">
            <Badge variant={resultAttempt.isPassed ? 'success' : 'danger'} size="md" dot>
              {resultAttempt.isPassed ? 'Examination Passed' : 'Needs Retake'}
            </Badge>
            <h2 className="text-2xl font-bold text-slate-900 mt-2">{test.title} Scorecard</h2>
            <p className="text-xs text-slate-500">Student: {user?.name}</p>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl max-w-sm mx-auto space-y-2 border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Score</span>
            <p className="text-4xl font-extrabold text-slate-900">
              {resultAttempt.totalScore} <span className="text-base text-slate-400">/ {test.totalMarks}</span>
            </p>
            <p className="text-xs text-slate-500">
              Passing threshold: {test.passingPercentage}% • Achieved: {scorePct}%
            </p>
          </div>

          <div className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed bg-indigo-50/60 p-4 rounded-xl border border-indigo-100">
            <strong>Note on Subjective & Coding Questions:</strong> Objective MCQ answers were auto-evaluated instantly. Short answer and coding questions will be reviewed by Dr. Vikram Rao for final grading.
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <Link to="/student/tests">
              <Button variant="outline" size="md">Back to Online Tests</Button>
            </Link>
            <Link to="/student/dashboard">
              <Button variant="primary" size="md">Go to Dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Test Engine Header */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block">
            Online Examination Room
          </span>
          <h2 className="text-base sm:text-lg font-bold">{test.title}</h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Persistent Countdown Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 font-mono text-sm font-bold text-amber-300">
            <Clock className="h-4 w-4 text-amber-400 animate-pulse" />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmSubmitOpen(true)}
            rightIcon={<Send className="h-3.5 w-3.5" />}
          >
            Submit Exam
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left: Current Question Card */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-6 sm:p-8 space-y-6 shadow-md border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Question {currentIdx + 1} of {test.questions.length}
                </span>
                <Badge variant="purple" size="sm">{currentQ.type.replace('_', ' ').toUpperCase()}</Badge>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600">Marks: {currentQ.maxMarks}</span>
                <button
                  onClick={() => toggleFlag(currentQ.id)}
                  title="Flag for review"
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                    flaggedQuestionIds.includes(currentQ.id)
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Flag className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Review Flag</span>
                </button>
              </div>
            </div>

            {/* Prompt */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-slate-900 leading-relaxed">
                {currentQ.prompt}
              </h3>

              {currentQ.codeSnippet && (
                <pre className="p-4 bg-slate-900 text-slate-100 text-xs rounded-xl font-mono overflow-x-auto">
                  {currentQ.codeSnippet}
                </pre>
              )}
            </div>

            {/* Renderers per Question Type */}
            {/* MCQ or Multi-select or True/False */}
            {(currentQ.type === 'mcq' || currentQ.type === 'multiple_select' || currentQ.type === 'true_false') && (
              <div className="space-y-2.5">
                {currentQ.options?.map((opt) => {
                  const isSelected = answers[currentQ.id]?.selectedOptionIds?.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() =>
                        handleSelectOption(currentQ.id, opt.id, currentQ.type === 'multiple_select')
                      }
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-xs sm:text-sm text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-400 text-indigo-900 font-medium shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-${
                          currentQ.type === 'multiple_select' ? 'md' : 'full'
                        } border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <span>{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Short Answer */}
            {currentQ.type === 'short_answer' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Explanation / Short Answer
                </label>
                <textarea
                  rows={4}
                  value={answers[currentQ.id]?.textAnswer || ''}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [currentQ.id]: { ...prev[currentQ.id], textAnswer: e.target.value },
                    }))
                  }
                  placeholder="Explain clearly in 2-3 sentences..."
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Coding Question */}
            {currentQ.type === 'coding' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Source Code Implementation (Evaluated Manually by Faculty)
                </label>
                <textarea
                  rows={8}
                  value={answers[currentQ.id]?.codeAnswer || ''}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [currentQ.id]: { ...prev[currentQ.id], codeAnswer: e.target.value },
                    }))
                  }
                  placeholder="// Write your Java / TypeScript method implementation here..."
                  className="w-full p-3 text-xs bg-slate-900 text-slate-100 font-mono rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Question Navigation Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Previous Question
              </Button>

              {currentIdx < test.questions.length - 1 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentIdx((i) => Math.min(test.questions.length - 1, i + 1))}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Next Question
                </Button>
              ) : (
                <Button variant="danger" size="sm" onClick={() => setConfirmSubmitOpen(true)}>
                  Finish & Submit Exam
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Question Navigation Palette */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Question Palette
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {test.questions.map((q, idx) => {
                const hasAnswer =
                  answers[q.id]?.selectedOptionIds?.length ||
                  answers[q.id]?.textAnswer?.trim() ||
                  answers[q.id]?.codeAnswer?.trim();
                const isFlagged = flaggedQuestionIds.includes(q.id);
                const isCurrent = currentIdx === idx;

                let btnClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200';
                if (hasAnswer) btnClass = 'bg-emerald-600 text-white font-bold';
                if (isFlagged) btnClass = 'bg-amber-500 text-white font-bold';
                if (isCurrent) btnClass += ' ring-2 ring-indigo-500 ring-offset-2';

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 w-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span>Flagged for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                <span>Unvisited</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog before Final Submit */}
      <ConfirmDialog
        isOpen={confirmSubmitOpen}
        onClose={() => setConfirmSubmitOpen(false)}
        onConfirm={handleSubmitFinal}
        title="Submit Online Examination?"
        message={`Are you sure you want to finish this timed examination? You have answered ${
          Object.keys(answers).length
        } of ${test.questions.length} questions.`}
        confirmLabel="Yes, Submit Now"
        variant="primary"
      />
    </div>
  );
};

