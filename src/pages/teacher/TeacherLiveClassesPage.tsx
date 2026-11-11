import React, { useState, useEffect } from 'react';
import {
  Video,
  Calendar,
  Clock,
  ExternalLink,
  Edit,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { teacherService } from '../../services/teacherService';
import type { Batch, Course } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/feedback/Modal';
import { formatDate } from '../../utils/formatters';

interface LiveSessionItem {
  id: string;
  batchId: string;
  batchName: string;
  courseTitle: string;
  title: string;
  date: string;
  timeWindow: string;
  meetingUrl: string;
  status: 'live' | 'upcoming' | 'completed';
}

export const TeacherLiveClassesPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBatchForUrl, setSelectedBatchForUrl] = useState<Batch | null>(null);
  const [meetingUrlInput, setMeetingUrlInput] = useState('');
  const [isSavingUrl, setIsSavingUrl] = useState(false);

  // Live session schedule list
  const [sessions, setSessions] = useState<LiveSessionItem[]>([
    {
      id: 'sess-1',
      batchId: 'batch-jfs-01',
      batchName: 'Oct 2026 Morning Cohort',
      courseTitle: 'Full Stack Java & Cloud Microservices',
      title: 'Spring Cloud API Gateway & Resilience4j Circuit Breakers',
      date: 'Today (Monday)',
      timeWindow: '7:30 AM - 9:30 AM IST',
      meetingUrl: 'https://meet.google.com/nex-java-batch',
      status: 'live',
    },
    {
      id: 'sess-2',
      batchId: 'batch-jfs-01',
      batchName: 'Oct 2026 Morning Cohort',
      courseTitle: 'Full Stack Java & Cloud Microservices',
      title: 'Distributed Tracing with Micrometer, Zipkin & OpenTelemetry',
      date: 'Tomorrow (Tuesday)',
      timeWindow: '7:30 AM - 9:30 AM IST',
      meetingUrl: 'https://meet.google.com/nex-java-batch',
      status: 'upcoming',
    },
    {
      id: 'sess-3',
      batchId: 'batch-jfs-01',
      batchName: 'Oct 2026 Morning Cohort',
      courseTitle: 'Full Stack Java & Cloud Microservices',
      title: 'Docker Multi-stage Builds & Kubernetes Cluster Deployment',
      date: 'Wednesday',
      timeWindow: '7:30 AM - 9:30 AM IST',
      meetingUrl: 'https://meet.google.com/nex-java-batch',
      status: 'upcoming',
    },
    {
      id: 'sess-4',
      batchId: 'batch-jfs-01',
      batchName: 'Oct 2026 Morning Cohort',
      courseTitle: 'Full Stack Java & Cloud Microservices',
      title: 'Enterprise Spring Data JPA Optimization & Virtual Threads',
      date: 'Last Friday',
      timeWindow: '7:30 AM - 9:30 AM IST',
      meetingUrl: 'https://meet.google.com/nex-java-batch',
      status: 'completed',
    },
  ]);

  useEffect(() => {
    const loadBatches = async () => {
      const teacherId = user?.id || 'user-tch-001';
      const res = await teacherService.getAssignedBatches(teacherId);
      if (res.success) setBatches(res.data);
    };

    loadBatches();
  }, [user]);

  const handleOpenEditMeetingUrl = (batch: Batch) => {
    setSelectedBatchForUrl(batch);
    setMeetingUrlInput(batch.meetingUrl || 'https://meet.google.com/nex-java-batch');
    setIsEditModalOpen(true);
  };

  const handleSaveMeetingUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchForUrl) return;

    setIsSavingUrl(true);
    const res = await teacherService.updateMeetingUrl(selectedBatchForUrl.id, meetingUrlInput);
    setIsSavingUrl(false);

    if (res.success && res.data) {
      setBatches((prev) => prev.map((b) => (b.id === res.data.id ? res.data : b)));
      setSessions((prev) =>
        prev.map((s) => (s.batchId === res.data.id ? { ...s, meetingUrl: meetingUrlInput } : s))
      );
      setIsEditModalOpen(false);
      showToast({
        type: 'success',
        title: 'Meeting Link Updated (TCH-005, BR-015)',
        message: 'Enrolled students now see the new meeting room link on their dashboard.',
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Live Classes & Meeting Links</h1>
          <p className="text-xs text-slate-500 mt-1">
            Schedule live classroom sessions and configure manual meeting links (SRS Rule TCH-005, BR-015).
          </p>
        </div>

        <Badge variant="purple" size="md">
          {batches.length} Assigned Cohort Rooms
        </Badge>
      </div>

      {/* Manual Meeting Links Configuration Table (TCH-005) */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Assigned Cohort Meeting Rooms (BR-015)</h3>
            <p className="text-xs text-slate-500">
              Teachers manually configure Google Meet, Zoom, or Teams links for each assigned batch.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {batches.map((batch) => (
            <div key={batch.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">{batch.name}</span>
                  <Badge variant="purple" size="sm">{batch.batchCode}</Badge>
                </div>
                <p className="text-xs text-slate-500">{batch.courseName}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Active Meeting URL:</span>
                  <span className="font-mono text-xs font-bold text-indigo-700">
                    {batch.meetingUrl || 'Not configured'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditMeetingUrl(batch)}
                  leftIcon={<Edit className="h-3.5 w-3.5" />}
                >
                  Configure Link
                </Button>
                {batch.meetingUrl && (
                  <a href={batch.meetingUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="primary" size="sm" className="bg-teal-600 hover:bg-teal-700" leftIcon={<Video className="h-3.5 w-3.5" />}>
                      Join Room
                    </Button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Scheduled Classes Timeline */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Session Schedule</h3>
            <p className="text-xs text-slate-500">Upcoming and recently concluded live interactive lectures</p>
          </div>
        </div>

        <div className="space-y-3">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className={`p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                sess.status === 'live'
                  ? 'bg-teal-50/40 border-teal-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={sess.status === 'live' ? 'purple' : sess.status === 'upcoming' ? 'info' : 'neutral'}
                    size="sm"
                    dot={sess.status === 'live'}
                  >
                    {sess.status === 'live' ? 'Live Today' : sess.status === 'upcoming' ? 'Scheduled' : 'Concluded'}
                  </Badge>
                  <span className="font-mono text-[11px] text-slate-500">{sess.date} • {sess.timeWindow}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{sess.title}</h4>
                <p className="text-[11px] text-slate-500">{sess.batchName} ({sess.courseTitle})</p>
              </div>

              <div className="flex items-center gap-2">
                <a href={sess.meetingUrl} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant={sess.status === 'live' ? 'primary' : 'outline'}
                    size="sm"
                    className={sess.status === 'live' ? 'bg-teal-600 hover:bg-teal-700' : ''}
                    leftIcon={<Video className="h-3.5 w-3.5" />}
                    rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
                  >
                    {sess.status === 'live' ? 'Enter Classroom' : 'Open Link'}
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Edit Meeting URL Modal (TCH-005) */}
      {selectedBatchForUrl && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Configure Manual Meeting Link (TCH-005, BR-015)`}
          size="md"
        >
          <form onSubmit={handleSaveMeetingUrl} className="space-y-4 text-xs text-slate-700">
            <div>
              <label className="block font-semibold mb-1">Target Batch</label>
              <input
                type="text"
                disabled
                value={selectedBatchForUrl.name}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Manual Meeting URL (Google Meet / Zoom / MS Teams) *</label>
              <input
                type="url"
                required
                placeholder="https://meet.google.com/xxx-yyyy-zzz"
                value={meetingUrlInput}
                onChange={(e) => setMeetingUrlInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Per SRS Rule BR-015, this meeting link is displayed to enrolled students on their live classes portal.
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                isLoading={isSavingUrl}
                className="bg-teal-600 hover:bg-teal-700"
                leftIcon={<Save className="h-4 w-4" />}
              >
                Save & Update Meeting Link
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

