import React, { useState } from 'react';
import { Clock, Upload, Send, ExternalLink } from 'lucide-react';
import { Github } from '../../components/common/SocialIcons';
import { SEED_ASSIGNMENTS, SEED_ASSIGNMENT_SUBMISSIONS } from '../../mocks/seedData';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import type { Assignment, AssignmentSubmission } from '../../types';

export const StudentAssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [assignments] = useState<Assignment[]>(SEED_ASSIGNMENTS);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(SEED_ASSIGNMENT_SUBMISSIONS);
  const [activeModalAssignment, setActiveModalAssignment] = useState<Assignment | null>(null);

  const [submissionMethod, setSubmissionMethod] = useState<'github_link' | 'file_upload' | 'text'>('github_link');
  const [githubUrl, setGithubUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenSubmit = (assignment: Assignment) => {
    setActiveModalAssignment(assignment);
    setGithubUrl('');
    setTextContent('');
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalAssignment || !user) return;

    setIsSubmitting(true);
    const res = await studentService.submitAssignment(user.id, user.name, activeModalAssignment.id, {
      method: submissionMethod,
      githubUrl,
      textContent,
      fileName: submissionMethod === 'file_upload' ? 'assignment_solution.zip' : undefined,
    });
    setIsSubmitting(false);

    if (res.success && res.data) {
      setSubmissions((prev) => [res.data, ...prev]);
      setActiveModalAssignment(null);
      showToast({
        type: 'success',
        title: 'Assignment Submitted',
        message: 'Your code submission has been delivered to your instructor for evaluation.',
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assignments & Practicals</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete and submit hands-on programming projects. Your code will be reviewed and graded by lead faculty.
        </p>
      </div>

      <div className="space-y-4">
        {assignments.map((asg) => {
          const submission = submissions.find((s) => s.assignmentId === asg.id);
          const isGraded = submission?.status === 'graded';
          const isSubmitted = !!submission;

          return (
            <Card key={asg.id} className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="purple" size="sm">Max Marks: {asg.maxMarks}</Badge>
                    {isGraded ? (
                      <Badge variant="success" size="sm" dot>
                        Graded: {submission.marksObtained} / {asg.maxMarks}
                      </Badge>
                    ) : isSubmitted ? (
                      <Badge variant="info" size="sm" dot>Under Evaluation</Badge>
                    ) : (
                      <Badge variant="warning" size="sm" dot>Pending Submission</Badge>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{asg.title}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-500" /> Due Date: {formatDate(asg.dueDate)}
                  </p>
                </div>

                <div className="shrink-0">
                  {isSubmitted ? (
                    <Button variant="outline" size="sm" onClick={() => handleOpenSubmit(asg)}>
                      Resubmit Solution
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" onClick={() => handleOpenSubmit(asg)}>
                      Submit Assignment
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl leading-relaxed">
                {asg.instructions}
              </p>

              {/* Graded Feedback Box */}
              {submission && (
                <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between text-slate-500">
                    <span>Submitted on: {formatDate(submission.submittedAt)} via {submission.method}</span>
                    {submission.githubUrl && (
                      <a
                        href={submission.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline flex items-center gap-1 font-mono"
                      >
                        <Github className="h-3.5 w-3.5" /> Repository Link <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  {submission.teacherFeedback && (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1 text-emerald-950">
                      <span className="font-bold block text-[11px] uppercase tracking-wider text-emerald-700">
                        Instructor Evaluation Feedback
                      </span>
                      <p className="text-xs leading-relaxed italic">{submission.teacherFeedback}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Submission Modal */}
      <Modal
        isOpen={!!activeModalAssignment}
        onClose={() => setActiveModalAssignment(null)}
        title={`Submit Solution: ${activeModalAssignment?.title}`}
        size="md"
      >
        <form onSubmit={handleSubmitAssignment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Submission Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSubmissionMethod('github_link')}
                className={`p-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  submissionMethod === 'github_link'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                GitHub Link
              </button>
              <button
                type="button"
                onClick={() => setSubmissionMethod('file_upload')}
                className={`p-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  submissionMethod === 'file_upload'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                ZIP Upload
              </button>
              <button
                type="button"
                onClick={() => setSubmissionMethod('text')}
                className={`p-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  submissionMethod === 'text'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                Text Solution
              </button>
            </div>
          </div>

          {submissionMethod === 'github_link' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GitHub Repository URL
              </label>
              <input
                type="url"
                required
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username/project-repo"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          )}

          {submissionMethod === 'file_upload' && (
            <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl text-center space-y-2">
              <Upload className="h-6 w-6 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600">Select source code archive (.zip or .tar.gz)</p>
              <input type="file" className="text-xs text-slate-500" />
            </div>
          )}

          {submissionMethod === 'text' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Code Snippet / Implementation Notes
              </label>
              <textarea
                rows={5}
                required
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste your source code or write response..."
                className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          )}

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setActiveModalAssignment(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting} rightIcon={<Send className="h-4 w-4" />}>
              Submit to Instructor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
