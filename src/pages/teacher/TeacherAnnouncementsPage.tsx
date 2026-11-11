import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Send,
  Calendar,
  Clock,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { teacherService } from '../../services/teacherService';
import type { AnnouncementItem, Course, Batch } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/feedback/Modal';
import { formatDate } from '../../utils/formatters';

export const TeacherAnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    message: '',
    courseId: '',
    batchId: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    category: 'General' as 'General' | 'Exam Alert' | 'Assignment Notice' | 'Class Rescheduled',
    isActive: true,
  });

  useEffect(() => {
    const loadData = async () => {
      const teacherId = user?.id || 'user-tch-001';
      const [annRes, coursesRes, batchesRes] = await Promise.all([
        teacherService.getTeacherAnnouncements(teacherId),
        teacherService.getAssignedCourses(teacherId),
        teacherService.getAssignedBatches(teacherId),
      ]);

      if (annRes.success) setAnnouncements(annRes.data);
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

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      showToast({ type: 'error', message: 'Please provide title and message content.' });
      return;
    }

    const res = await teacherService.createAnnouncement(
      { id: user?.id || 'user-tch-001', name: user?.name || 'Dr. Vikram Rao' },
      form
    );

    if (res.success && res.data) {
      setAnnouncements([res.data, ...announcements]);
      setIsModalOpen(false);
      setForm({
        title: '',
        message: '',
        courseId: courses[0]?.id || '',
        batchId: batches[0]?.id || '',
        priority: 'normal',
        category: 'General',
        isActive: true,
      });
      showToast({
        type: 'success',
        title: 'Announcement Broadcasted',
        message: 'Notification sent to enrolled cohort students. (TCH-012)',
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cohort Announcements & Broadcasts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Communicate essential class schedule changes, project notices, and exam alerts to your students (SRS Rule TCH-012).
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          className="bg-teal-600 hover:bg-teal-700"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Announcement
        </Button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((ann) => (
          <Card key={ann.id} className="p-6 border-slate-200 hover:border-teal-300 transition-colors space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    ann.priority === 'urgent'
                      ? 'danger'
                      : ann.priority === 'high'
                      ? 'warning'
                      : 'purple'
                  }
                  size="sm"
                  dot
                >
                  {ann.category}
                </Badge>
                <h3 className="text-sm font-bold text-slate-900">{ann.title}</h3>
              </div>

              <span className="text-[11px] font-mono text-slate-400">
                {formatDate(ann.createdAt)}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {ann.message}
            </p>

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Published by: {ann.publishedByTeacherName}</span>
              <span className="text-teal-700 font-semibold">Enrolled Students Alerted</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Announcement Modal (TCH-012) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Broadcast Announcement (TCH-012)"
        size="md"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs text-slate-700">
          <div>
            <label className="block font-semibold mb-1">Announcement Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Schedule Update: AWS Workshop moved to 10:00 AM"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="General">General Notice</option>
                <option value="Assignment Notice">Assignment Notice</option>
                <option value="Exam Alert">Exam Alert</option>
                <option value="Class Rescheduled">Class Rescheduled</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Target Cohort</label>
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

          <div>
            <label className="block font-semibold mb-1">Broadcast Message *</label>
            <textarea
              rows={4}
              required
              placeholder="Enter announcement text to broadcast to students..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" className="bg-teal-600 hover:bg-teal-700">
              Publish & Send
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

