import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Save,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { teacherService } from '../../services/teacherService';
import type { TestAttempt, OnlineTest } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/feedback/Modal';
import { formatDate } from '../../utils/formatters';

export const TeacherTestEvaluationPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<TestAttempt | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manualMarks, setManualMarks] = useState<number>(42);
  const [feedback, setFeedback] = useState<string>('Strong conceptual understanding of Project Loom and Carrier threads.');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAttempts = async () => {
      const teacherId = user?.id || 'user-tch-001';
      const res = await teacherService.getTestAttempts(teacherId);
      if (res.success) setAttempts(res.data);
      setIsLoading(false);
    };

    loadAttempts();
  }, [user]);

  const handleOpenEvaluation = (attempt: TestAttempt) => {
    setSelectedAttempt(attempt);
    setManualMarks(attempt.totalScore);
    setIsModalOpen(true);
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttempt) return;

    setAttempts((prev) =>
      prev.map((a) =>
        a.id === selectedAttempt.id
          ? {
              ...a,
              totalScore: manualMarks,
              isPassed: manualMarks >= 30,
              status: 'evaluated',
            }
          : a
      )
    );
    setIsModalOpen(false);
    showToast({
      type: 'success',
      title: 'Test Evaluated (TCH-009)',
      message: `Score for ${selectedAttempt.studentName} updated to ${manualMarks}/50.`,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Test Attempts & Evaluations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review submitted test papers, verify objective scores, and grade subjective questions (SRS Rule TCH-009).
          </p>
        </div>

        <Badge variant="purple" size="md">
          {attempts.length} Candidate Submissions
        </Badge>
      </div>

      {/* Attempts Table */}
      <Card className="p-6 space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading test attempts...</div>
        ) : attempts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            No test submissions found for your assigned courses.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Examination</th>
                  <th className="py-3 px-3">Submitted At</th>
                  <th className="py-3 px-3">Total Score</th>
                  <th className="py-3 px-3">Outcome</th>
                  <th className="py-3 px-3">Evaluation Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-slate-900">
                      {att.studentName}
                    </td>

                    <td className="py-3.5 px-3 font-medium text-slate-800">
                      Java 21 Enterprise & Spring Boot Assessment
                    </td>

                    <td className="py-3.5 px-3 text-slate-500 font-mono">
                      {att.submittedAt ? formatDate(att.submittedAt) : 'In Progress'}
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                      {att.totalScore} / 50
                    </td>

                    <td className="py-3.5 px-3">
                      <Badge variant={att.isPassed ? 'success' : 'danger'} size="sm" dot>
                        {att.isPassed ? 'Passed' : 'Failed'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-3">
                      <Badge variant={att.status === 'evaluated' ? 'success' : 'warning'} size="sm">
                        {att.status === 'evaluated' ? 'Evaluated' : 'Needs Review'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEvaluation(att)}
                        leftIcon={<Eye className="h-3.5 w-3.5" />}
                      >
                        Review Paper
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Evaluation Modal */}
      {selectedAttempt && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Evaluate Paper: ${selectedAttempt.studentName}`}
          size="lg"
        >
          <form onSubmit={handleSaveEvaluation} className="space-y-5 text-xs text-slate-700">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-sm">{selectedAttempt.studentName}</span>
                <span className="text-slate-500 font-mono text-[11px]">Attempt ID: {selectedAttempt.id}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Passing Cutoff</span>
                <span className="font-bold text-slate-800">60% (30 / 50 Marks)</span>
              </div>
            </div>

            {/* Answer Review Section */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Candidate Answers</h4>
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                <p className="font-semibold text-slate-800">
                  Q1: Explain how Virtual Threads reduce context switching overhead compared to platform threads.
                </p>
                <div className="p-2.5 bg-slate-50 rounded-lg text-slate-700 font-mono text-[11px]">
                  Virtual threads are mounted onto carrier threads (ForkJoinPool worker threads). When a blocking I/O operation occurs, the virtual thread unmounts its stack from the carrier thread, freeing the OS thread to execute other virtual tasks.
                </div>
              </div>
            </div>

            {/* Scoring & Feedback */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Total Marks Awarded (out of 50) *</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  required
                  value={manualMarks}
                  onChange={(e) => setManualMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Pass / Fail Assessment</label>
                <div className="pt-2">
                  <Badge variant={manualMarks >= 30 ? 'success' : 'danger'} size="md" dot>
                    {manualMarks >= 30 ? 'Meets Passing Cutoff' : 'Below Passing Benchmark'}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Teacher Feedback & Suggestions</label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Constructive feedback on code optimization or concepts..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" className="bg-teal-600 hover:bg-teal-700" leftIcon={<Save className="h-4 w-4" />}>
                Save & Publish Score
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

