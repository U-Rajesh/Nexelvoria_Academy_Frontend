import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Calendar,
  Clock,
  Video,
  Plus,
  Star,
  CheckCircle2,
  FileText,
  ExternalLink,
  Users,
  GraduationCap,
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
import type { MockInterviewSchedule, StudentProfile, TeacherProfile } from '../../types';

export const AdminMockInterviewPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [interviews, setInterviews] = useState<MockInterviewSchedule[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MockInterviewSchedule | null>(null);

  // Form State
  const [studentId, setStudentId] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/nex-mock-live');
  const [interviewType, setInterviewType] = useState<'Technical' | 'HR' | 'System Design'>('Technical');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    const [mRes, sRes, tRes] = await Promise.all([
      adminService.getMockInterviews(),
      adminService.getStudents(),
      adminService.getTeachers(),
    ]);

    if (mRes.success) setInterviews(mRes.data);
    if (sRes.success) {
      setStudents(sRes.data);
      if (sRes.data.length > 0 && !studentId) setStudentId(sRes.data[0].id);
    }
    if (tRes.success) {
      setTeachers(tRes.data);
      if (tRes.data.length > 0 && !trainerId) setTrainerId(tRes.data[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !studentId || !trainerId || !scheduledAt) return;

    const studentObj = students.find((s) => s.id === studentId);
    const trainerObj = teachers.find((t) => t.id === trainerId);

    setIsSubmitting(true);
    const res = await adminService.scheduleMockInterview(
      { id: user.id, name: user.name },
      {
        studentId,
        studentName: studentObj?.name || 'Student',
        trainerId,
        trainerName: trainerObj?.name || 'Trainer',
        scheduledAt,
        meetingLink,
        interviewType,
      }
    );
    setIsSubmitting(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Mock Interview Scheduled',
        message: `${interviewType} mock interview booked for ${studentObj?.name}. (ADM-012)`,
      });
      setIsScheduleModalOpen(false);
      loadData();
    }
  };

  const columns: Column<MockInterviewSchedule>[] = [
    {
      key: 'studentName',
      header: 'Candidate Student',
      sortable: true,
      render: (m) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{m.studentName}</span>
          <span className="text-[11px] text-slate-400 font-mono">ID: {m.studentId}</span>
        </div>
      ),
    },
    {
      key: 'trainerName',
      header: 'Interviewer Panelist',
      render: (m) => (
        <div className="flex items-center gap-1.5">
          <GraduationCap className="h-4 w-4 text-indigo-600" />
          <span className="text-xs font-semibold text-slate-800">{m.trainerName}</span>
        </div>
      ),
    },
    {
      key: 'interviewType',
      header: 'Interview Domain',
      render: (m) => <Badge variant="purple" size="sm">{m.interviewType}</Badge>,
    },
    {
      key: 'scheduledAt',
      header: 'Date & Time',
      sortable: true,
      render: (m) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs block">{formatDate(m.scheduledAt)}</span>
          <span className="text-[11px] text-slate-500 font-mono">
            {new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (m) => (
        <Badge
          variant={
            m.status === 'completed'
              ? 'success'
              : m.status === 'scheduled'
              ? 'info'
              : 'neutral'
          }
          size="sm"
          dot
        >
          {m.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'meetingLink',
      header: 'Meeting Link',
      render: (m) =>
        m.meetingLink ? (
          <a
            href={m.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-mono"
          >
            <Video className="h-3 w-3" /> Join Call
          </a>
        ) : (
          <span className="text-slate-400 text-xs">Offline Room</span>
        ),
    },
    {
      key: 'actions',
      header: 'Feedback Report',
      render: (m) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedReport(m)}
          className="text-xs text-indigo-600 hover:bg-indigo-50"
          leftIcon={<FileText className="h-3.5 w-3.5" />}
        >
          {m.feedbackReport ? 'View Report' : 'Schedule Notes'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mock Interviews & Readiness (ADM-012)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Schedule rigorous 1-on-1 technical, system design, and behavioral HR mock interviews with industry expert trainers.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsScheduleModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Schedule Mock Interview
        </Button>
      </div>

      {/* Main Table */}
      <DataTable
        data={interviews}
        columns={columns}
        searchPlaceholder="Search candidate or interviewer..."
        pageSize={10}
      />

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <Modal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          title="Schedule Mock Interview (ADM-012)"
          size="md"
        >
          <form onSubmit={handleSchedule} className="space-y-4 text-xs text-slate-700">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Select Candidate Student *</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.collegeName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Select Faculty Interviewer *</label>
              <select
                value={trainerId}
                onChange={(e) => setTrainerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Interview Domain *</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="Technical">Technical Round</option>
                  <option value="System Design">System Design & Architecture</option>
                  <option value="HR">HR & Cultural Fit</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Google Meet / Video Call URL *</label>
              <input
                type="url"
                required
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium font-mono"
              />
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

      {/* Feedback Report Modal */}
      {selectedReport && (
        <Modal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={`Mock Interview Assessment: ${selectedReport.studentName}`}
          size="md"
        >
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Interviewer: {selectedReport.trainerName}</span>
                <Badge variant="purple" size="sm">{selectedReport.interviewType}</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Scheduled on: {formatDate(selectedReport.scheduledAt)}</p>
            </div>

            {selectedReport.feedbackReport ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-400 block">Technical Score</span>
                    <span className="text-base font-extrabold text-indigo-700">
                      {selectedReport.feedbackReport.technicalScoreOutOf10} / 10
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-400 block">Communication</span>
                    <span className="text-base font-extrabold text-emerald-700">
                      {selectedReport.feedbackReport.communicationScoreOutOf10} / 10
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-400 block">Problem Solving</span>
                    <span className="text-base font-extrabold text-purple-700">
                      {selectedReport.feedbackReport.problemSolvingScoreOutOf10} / 10
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-900 space-y-1">
                  <strong>Key Strengths:</strong>
                  <p className="text-[11px] leading-relaxed">{selectedReport.feedbackReport.strengths}</p>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-amber-900 space-y-1">
                  <strong>Recommended Areas for Improvement:</strong>
                  <p className="text-[11px] leading-relaxed">{selectedReport.feedbackReport.areasForImprovement}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-100 text-slate-900 font-bold flex items-center justify-between">
                  <span>Recommendation:</span>
                  <Badge variant="success" size="sm">{selectedReport.feedbackReport.recommendation}</Badge>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 border border-dashed rounded-lg">
                <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p>Interview scheduled. Detailed score report will appear after the session concludes.</p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedReport(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

