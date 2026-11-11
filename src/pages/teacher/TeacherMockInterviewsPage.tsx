import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Calendar,
  Clock,
  Video,
  ExternalLink,
  Star,
  CheckCircle2,
  Save,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { teacherService } from '../../services/teacherService';
import type { MockInterviewSchedule } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/feedback/Modal';
import { formatDate } from '../../utils/formatters';

export const TeacherMockInterviewsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [interviews, setInterviews] = useState<MockInterviewSchedule[]>([]);
  const [evaluatingInterview, setEvaluatingInterview] = useState<MockInterviewSchedule | null>(null);

  // Rubric Ratings
  const [techRating, setTechRating] = useState(4);
  const [systemDesignRating, setSystemDesignRating] = useState(4);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [writtenFeedback, setWrittenFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadInterviews = async () => {
      const teacherId = user?.id || 'user-tch-001';
      const res = await teacherService.getMockInterviews(teacherId);
      if (res.success) setInterviews(res.data);
    };

    loadInterviews();
  }, [user]);

  const handleOpenEvaluation = (interview: MockInterviewSchedule) => {
    setEvaluatingInterview(interview);
    setWrittenFeedback(interview.feedback || '');
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingInterview) return;

    setIsSubmitting(true);
    const overall = Math.round((techRating + systemDesignRating + communicationRating) / 3);
    const res = await teacherService.submitMockFeedback(
      evaluatingInterview.id,
      {
        technicalSkills: techRating,
        communication: communicationRating,
        problemSolving: systemDesignRating,
        overallRating: overall,
      },
      writtenFeedback
    );
    setIsSubmitting(false);

    if (res.success && res.data) {
      setInterviews((prev) => prev.map((i) => (i.id === res.data.id ? res.data : i)));
      setEvaluatingInterview(null);
      showToast({
        type: 'success',
        title: 'Mock Evaluation Saved',
        message: 'Feedback and rubric scores shared with candidate.',
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Technical Mock Interviews</h1>
          <p className="text-xs text-slate-500 mt-1">
            Evaluate candidate interview readiness, conduct 1:1 technical sessions, and score placement rubrics (BR-013).
          </p>
        </div>

        <Badge variant="purple" size="md">
          {interviews.length} Scheduled Sessions
        </Badge>
      </div>

      {/* Interviews List */}
      <div className="space-y-4">
        {interviews.map((item) => (
          <Card key={item.id} className="p-6 border-slate-200 hover:border-teal-300 transition-colors space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{item.studentName}</span>
                  <Badge variant={item.status === 'completed' ? 'success' : 'purple'} size="sm" dot>
                    {item.status === 'completed' ? 'Evaluated' : 'Scheduled'}
                  </Badge>
                  <Badge variant="neutral" size="sm">{item.interviewType}</Badge>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  Session Date: {formatDate(item.scheduledAt)}
                </p>
              </div>

              {item.meetingUrl && (
                <a href={item.meetingUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" leftIcon={<Video className="h-3.5 w-3.5" />}>
                    Open Meet Room
                  </Button>
                </a>
              )}
            </div>

            {item.feedback ? (
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Mentor Feedback Recorded:</span>
                <p className="text-slate-800 italic">"{item.feedback}"</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Interview completed or scheduled. Click evaluate to grade technical DSA, system design, and communication.
              </p>
            )}

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                className="bg-teal-600 hover:bg-teal-700"
                onClick={() => handleOpenEvaluation(item)}
                leftIcon={<Award className="h-3.5 w-3.5" />}
              >
                {item.status === 'completed' ? 'Update Evaluation' : 'Evaluate Candidate'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Rubric Evaluation Modal */}
      {evaluatingInterview && (
        <Modal
          isOpen={!!evaluatingInterview}
          onClose={() => setEvaluatingInterview(null)}
          title={`Evaluate Mock Candidate: ${evaluatingInterview.studentName}`}
          size="lg"
        >
          <form onSubmit={handleSaveEvaluation} className="space-y-5 text-xs text-slate-700">
            {/* Rating Rubrics */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase text-slate-700 block">
                Standardized Evaluation Rubric (1 - 5 Scale)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1">DSA & Problem Solving</label>
                  <select
                    value={techRating}
                    onChange={(e) => setTechRating(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value={5}>5 - Excellent (Optimal O(N))</option>
                    <option value={4}>4 - Proficient (Good Working Soln)</option>
                    <option value={3}>3 - Acceptable (Needs Hints)</option>
                    <option value={2}>2 - Marginal (Syntax Gaps)</option>
                    <option value={1}>1 - Unsatisfactory</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">System Design & Cloud</label>
                  <select
                    value={systemDesignRating}
                    onChange={(e) => setSystemDesignRating(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value={5}>5 - High Scalability Mastery</option>
                    <option value={4}>4 - Solid Microservice Design</option>
                    <option value={3}>3 - Average Design Concept</option>
                    <option value={2}>2 - Needs Revision</option>
                    <option value={1}>1 - Weak Foundations</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Communication & Articulation</label>
                  <select
                    value={communicationRating}
                    onChange={(e) => setCommunicationRating(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value={5}>5 - Professional & Crisp</option>
                    <option value={4}>4 - Clear Explanation</option>
                    <option value={3}>3 - Moderate Fluency</option>
                    <option value={2}>2 - Hesitant</option>
                    <option value={1}>1 - Needs Training</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Written Remarks */}
            <div>
              <label className="block font-semibold mb-1">Detailed Mentor Remarks & Interview Outcome *</label>
              <textarea
                rows={4}
                required
                value={writtenFeedback}
                onChange={(e) => setWrittenFeedback(e.target.value)}
                placeholder="Candidate demonstrated clean repository architecture. Recommend practicing concurrency locks before Tier-1 interview rounds..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button variant="outline" size="sm" type="button" onClick={() => setEvaluatingInterview(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                isLoading={isSubmitting}
                className="bg-teal-600 hover:bg-teal-700"
                leftIcon={<Save className="h-4 w-4" />}
              >
                Submit Interview Feedback
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
