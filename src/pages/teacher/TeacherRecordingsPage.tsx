import React, { useState, useEffect } from 'react';
import {
  PlayCircle,
  Plus,
  Video,
  Clock,
  Calendar,
  Trash2,
  ExternalLink,
  Layers,
  Eye,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { teacherService } from '../../services/teacherService';
import type { RecordedClassItem, Course, Batch } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/feedback/Modal';
import { formatDate } from '../../utils/formatters';

export const TeacherRecordingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [recordings, setRecordings] = useState<RecordedClassItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewRecording, setPreviewRecording] = useState<RecordedClassItem | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    courseId: '',
    batchId: '',
    moduleName: 'Module 1: Advanced Java 21',
    sessionDate: '2026-11-09',
    durationMinutes: 90,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    isAvailableToStudents: true,
  });

  useEffect(() => {
    const loadData = async () => {
      const teacherId = user?.id || 'user-tch-001';
      const [recRes, coursesRes, batchesRes] = await Promise.all([
        teacherService.getRecordedClasses(teacherId),
        teacherService.getAssignedCourses(teacherId),
        teacherService.getAssignedBatches(teacherId),
      ]);

      if (recRes.success) setRecordings(recRes.data);
      if (coursesRes.success && coursesRes.data.length > 0) {
        setCourses(coursesRes.data);
        setForm((prev) => ({ ...prev, courseId: coursesRes.data[0].id }));
      }
      if (batchesRes.success && batchesRes.data.length > 0) {
        setBatches(batchesRes.data);
        setForm((prev) => ({ ...prev, batchId: batchesRes.data[0].id }));
      }
    };

    loadData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.videoUrl.trim()) {
      showToast({ type: 'error', message: 'Please provide session title and video embed URL.' });
      return;
    }

    const res = await teacherService.saveRecordedClass(
      { id: user?.id || 'user-tch-001', name: user?.name || 'Dr. Vikram Rao' },
      form
    );

    if (res.success && res.data) {
      setRecordings([res.data, ...recordings]);
      setIsAddModalOpen(false);
      setForm({
        title: '',
        description: '',
        courseId: courses[0]?.id || '',
        batchId: batches[0]?.id || '',
        moduleName: 'Module 1: Advanced Java 21',
        sessionDate: '2026-11-09',
        durationMinutes: 90,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        isAvailableToStudents: true,
      });
      showToast({
        type: 'success',
        title: 'Recording Published',
        message: 'Class lecture video has been published for enrolled batch students.',
      });
    }
  };

  const handleDelete = async (id: string) => {
    const res = await teacherService.deleteRecordedClass(id);
    if (res.success) {
      setRecordings((prev) => prev.filter((r) => r.id !== id));
      showToast({ type: 'info', message: 'Class recording removed.' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recorded Class Archive</h1>
          <p className="text-xs text-slate-500 mt-1">
            Publish and manage recorded lectures for enrolled students to revisit past classroom sessions.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          className="bg-teal-600 hover:bg-teal-700"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Recorded Lecture
        </Button>
      </div>

      {/* Recordings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recordings.map((rec) => (
          <Card key={rec.id} className="p-5 flex flex-col justify-between border-slate-200 hover:border-teal-300 transition-colors shadow-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-bold">
                  {rec.moduleName}
                </span>
                <Badge variant={rec.isAvailableToStudents ? 'success' : 'neutral'} size="sm" dot>
                  {rec.isAvailableToStudents ? 'Published' : 'Hidden'}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">{rec.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                  {rec.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-2 border-t border-slate-100 font-mono">
                <div>Date: {formatDate(rec.sessionDate)}</div>
                <div className="text-right">Duration: {rec.durationMinutes} Mins</div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewRecording(rec)}
                leftIcon={<PlayCircle className="h-3.5 w-3.5" />}
              >
                Watch Stream
              </Button>

              <button
                onClick={() => handleDelete(rec.id)}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                title="Remove recording"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Recording Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Recorded Class Session"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-700">
          <div>
            <label className="block font-semibold mb-1">Session Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Spring Security 6 & OAuth2 Resource Server"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Target Course</label>
              <select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Target Batch</label>
              <select
                value={form.batchId}
                onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Session Date</label>
              <input
                type="date"
                value={form.sessionDate}
                onChange={(e) => setForm({ ...form, sessionDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min="15"
                max="300"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Curriculum Module Tag</label>
            <input
              type="text"
              value={form.moduleName}
              onChange={(e) => setForm({ ...form, moduleName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Stream / Embed URL *</label>
            <input
              type="url"
              required
              placeholder="https://www.youtube.com/embed/..."
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Session Description</label>
            <textarea
              rows={2}
              placeholder="Summary of topics covered..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" className="bg-teal-600 hover:bg-teal-700">
              Save Recording
            </Button>
          </div>
        </form>
      </Modal>

      {/* Video Player Modal */}
      {previewRecording && (
        <Modal
          isOpen={!!previewRecording}
          onClose={() => setPreviewRecording(null)}
          title={`Lecture Stream: ${previewRecording.title}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden shadow-inner">
              <iframe
                src={previewRecording.videoUrl}
                title={previewRecording.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-900 block">{previewRecording.moduleName}</span>
              <p>{previewRecording.description}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

