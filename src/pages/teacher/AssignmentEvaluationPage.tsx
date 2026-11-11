import React, { useState } from 'react';
import { FileCheck2, ExternalLink, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { Github } from '../../components/common/SocialIcons';
import { SEED_ASSIGNMENTS, SEED_ASSIGNMENT_SUBMISSIONS } from '../../mocks/seedData';
import { teacherService } from '../../services/teacherService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import type { AssignmentSubmission } from '../../types';

export const AssignmentEvaluationPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(SEED_ASSIGNMENT_SUBMISSIONS);
  const [evaluatingSub, setEvaluatingSub] = useState<AssignmentSubmission | null>(null);

  const [marks, setMarks] = useState<number>(45);
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenEvaluation = (sub: AssignmentSubmission) => {
    setEvaluatingSub(sub);
    setMarks(sub.marksObtained || 45);
    setFeedback(sub.teacherFeedback || '');
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingSub || !user) return;

    setIsSubmitting(true);
    const res = await teacherService.evaluateSubmission(
      { id: user.id, name: user.name },
      evaluatingSub.id,
      marks,
      feedback
    );
    setIsSubmitting(false);

    if (res.success && res.data) {
      setSubmissions((prev) => prev.map((s) => (s.id === res.data.id ? res.data : s)));
      setEvaluatingSub(null);
      showToast({
        type: 'success',
        title: 'Grading Saved',
        message: `Evaluation for ${res.data.studentName} updated. Marks: ${marks}/50.`,
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assignment Submissions Evaluation</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review student code submissions, verify test suites, and award marks and rubric feedback.
        </p>
      </div>

      <div className="space-y-4">
        {submissions.map((sub) => (
          <Card key={sub.id} className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{sub.studentName}</span>
                  <Badge variant={sub.status === 'graded' ? 'success' : 'warning'} size="sm" dot>
                    {sub.status.toUpperCase()}
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold text-slate-700 mt-1">
                  Spring Boot REST API with JWT Auth & Unit Testing
                </h3>
                <p className="text-xs text-slate-400">Submitted on: {formatDate(sub.submittedAt)} via {sub.method}</p>
              </div>

              <div className="flex items-center gap-4">
                {sub.marksObtained !== undefined && (
                  <span className="text-base font-extrabold text-teal-700">
                    {sub.marksObtained} / 50 Marks
                  </span>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700"
                  onClick={() => handleOpenEvaluation(sub)}
                >
                  {sub.status === 'graded' ? 'Edit Grading' : 'Grade Submission'}
                </Button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              {sub.githubUrl && (
                <a
                  href={sub.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline flex items-center gap-1 font-mono font-medium"
                >
                  <Github className="h-4 w-4" /> Inspect Candidate Repository <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {sub.teacherFeedback && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 italic">
                <strong>Feedback Given:</strong> "{sub.teacherFeedback}"
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Evaluation Modal */}
      <Modal
        isOpen={!!evaluatingSub}
        onClose={() => setEvaluatingSub(null)}
        title={`Grade Submission: ${evaluatingSub?.studentName}`}
        size="md"
      >
        <form onSubmit={handleSaveEvaluation} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Marks Awarded (Out of 50)
            </label>
            <input
              type="number"
              min={0}
              max={50}
              required
              value={marks}
              onChange={(e) => setMarks(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Instructor Rubric Feedback & Code Review Notes
            </label>
            <textarea
              rows={4}
              required
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Highlight strengths, architecture practices, and unit test improvements..."
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setEvaluatingSub(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              className="bg-teal-600 hover:bg-teal-700"
              isLoading={isSubmitting}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Publish Marks to Student
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
