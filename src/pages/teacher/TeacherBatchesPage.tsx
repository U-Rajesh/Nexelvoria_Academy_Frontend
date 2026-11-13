import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Video,
  Clock,
  ExternalLink,
  Save,
  BookOpen,
  CheckCircle2,
  Mail,
  Phone,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { SEED_BATCHES, SEED_USERS } from '../../mocks/seedData';
import { teacherService } from '../../services/teacherService';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import type { Batch } from '../../types';

export const TeacherBatchesPage: React.FC = () => {
  const [batches] = useState<Batch[]>(SEED_BATCHES);
  const [rosterBatch, setRosterBatch] = useState<Batch | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assigned Batches & Cohorts</h1>
        <p className="text-xs text-slate-500 mt-1">
          Instructors access, lecture, and assess only authorized cohorts allocated by administration (SRS Rule BR-009).
        </p>
      </div>

      <div className="space-y-4">
        {batches.map((batch) => {
          const filled = batch.enrolledStudentIds?.length || 0;
          const capacity = batch.maxCapacity || 40;
          return (
            <Card key={batch.id} className="p-6 space-y-4 border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded font-bold border border-teal-200/60">
                      {batch.batchCode}
                    </span>
                    <Badge
                      variant={
                        batch.status === 'ongoing'
                          ? 'success'
                          : batch.status === 'upcoming'
                          ? 'purple'
                          : 'neutral'
                      }
                      size="sm"
                      dot
                    >
                      {batch.status.toUpperCase()}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{batch.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-teal-600" /> {batch.courseName}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">Cohort Enrollment</span>
                  <span className="text-sm font-bold text-slate-800">
                    {filled} / {capacity} Students
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block font-medium">Session Timetable</span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" /> {batch.scheduleTiming}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Term Period</span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> {formatDate(batch.startDate)} – {formatDate(batch.endDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Live Room Status (BR-015)</span>
                  <span className="font-semibold text-teal-800 font-mono text-[11px] truncate block mt-0.5">
                    {batch.meetingUrl ? 'Google Meet Configured' : 'Offline / TBD'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100">
                {batch.meetingUrl && (
                  <a href={batch.meetingUrl} target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-teal-600 hover:bg-teal-700"
                      leftIcon={<Video className="h-3.5 w-3.5" />}
                    >
                      Launch Class Room
                    </Button>
                  </a>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRosterBatch(batch)}
                  leftIcon={<Users className="h-3.5 w-3.5" />}
                >
                  View Enrolled Students ({filled})
                </Button>

                <Link to="/teacher/live-classes">
                  <Button variant="ghost" size="sm" className="text-xs text-teal-700">
                    Configure Meeting Link
                  </Button>
                </Link>

                <Link to="/teacher/attendance">
                  <Button variant="ghost" size="sm" className="text-xs text-slate-600">
                    Mark Attendance
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Roster Modal */}
      {rosterBatch && (
        <Modal
          isOpen={!!rosterBatch}
          onClose={() => setRosterBatch(null)}
          title={`Enrolled Students: ${rosterBatch.name}`}
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Students officially enrolled in cohort <strong>{rosterBatch.batchCode}</strong>.
            </p>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {[SEED_USERS.student].map((stu) => (
                <div key={stu.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={stu.avatarUrl}
                      alt={stu.name}
                      className="h-9 w-9 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900">{stu.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">{stu.id} • {stu.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="success" size="sm">Active Learner</Badge>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{stu.collegeName}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setRosterBatch(null)}>
                Close Roster
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export const TeacherLiveClassesPage: React.FC = () => {
  const { showToast } = useNotification();
  const batch = SEED_BATCHES[0];
  const [meetingUrl, setMeetingUrl] = useState(batch.meetingUrl || 'https://meet.google.com/nex-java-batch');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await teacherService.updateMeetingUrl(batch.id, meetingUrl);
    setIsSaving(false);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Meeting URL Updated',
        message: 'Live class link updated. Enrolled students can now access this room. (SRS BR-015)',
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manual Live Class Configuration</h1>
        <p className="text-xs text-slate-500 mt-1">
          In accordance with <strong>SRS Rule BR-015</strong>, live meeting links are manually configured (e.g. Google Meet or Zoom URLs).
        </p>
      </div>

      <Card className="p-8 space-y-6">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Batch</label>
            <input
              type="text"
              disabled
              value={`${batch.name} (${batch.batchCode})`}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Manual Meeting Room URL (Google Meet / Zoom / MS Teams) *
            </label>
            <input
              type="url"
              required
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 text-xs">
            Students in this batch will see this URL on their dashboard and can launch it directly before class starts.
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full bg-teal-600 hover:bg-teal-700"
            isLoading={isSaving}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Meeting Link (BR-015)
          </Button>
        </form>
      </Card>
    </div>
  );
};
