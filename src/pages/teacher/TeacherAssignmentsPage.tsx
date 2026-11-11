import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Users,
  Edit,
  Save,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { teacherService } from '../../services/teacherService';
import type { Assignment, Course, Batch } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/feedback/Modal';
import { formatDate } from '../../utils/formatters';

export const TeacherAssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    instructions: '',
    courseId: '',
    batchId: '',
    maxMarks: 50,
    dueDate: '2026-11-20',
    attachmentUrl: '',
    allowedSubmissionMethods: ['github_link', 'file_upload'] as any[],
  });

  useEffect(() => {
    const loadData = async () => {
      const teacherId = user?.id || 'user-tch-001';
      const [asgRes, coursesRes, batchesRes] = await Promise.all([
        teacherService.getTeacherAssignments(teacherId),
        teacherService.getAssignedCourses(teacherId),
        teacherService.getAssignedBatches(teacherId),
      ]);

      if (asgRes.success) setAssignments(asgRes.data);
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

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.courseId) {
      showToast({ type: 'error', message: 'Please enter title and select course.' });
      return;
    }

    const res = await teacherService.createAssignment(
      { id: user?.id || 'user-tch-001', name: user?.name || 'Dr. Vikram Rao' },
      form
    );

    if (res.success && res.data) {
      setAssignments([res.data, ...assignments]);
      setIsCreateModalOpen(false);
      setForm({
        title: '',
        instructions: '',
        courseId: courses[0]?.id || '',
        batchId: batches[0]?.id || '',
        maxMarks: 50,
        dueDate: '2026-11-20',
        attachmentUrl: '',
        allowedSubmissionMethods: ['github_link', 'file_upload'],
      });
      showToast({
        type: 'success',
        title: 'Assignment Published',
        message: 'New assignment created and assigned to cohort. (TCH-006)',
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assignment Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create practical coding tasks, set deadlines, and configure evaluation rubrics (SRS Rule TCH-006).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/teacher/assignments/evaluations">
            <Button variant="outline" size="md">
              Evaluate Submissions →
            </Button>
          </Link>
          <Button
            variant="primary"
            size="md"
            className="bg-teal-600 hover:bg-teal-700"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create New Assignment
          </Button>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments.map((asg) => (
          <Card key={asg.id} className="p-6 border-slate-200 hover:border-teal-300 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono uppercase bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-bold">
                  Max Marks: {asg.maxMarks} Points
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{asg.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="purple" size="sm">Active</Badge>
                <span className="text-xs font-mono text-rose-600 font-semibold">
                  Due: {formatDate(asg.dueDate)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 my-3 leading-relaxed">
              {asg.instructions}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
                <span>Methods: {asg.allowedSubmissionMethods.join(', ')}</span>
                <span>•</span>
                <span>Published: {formatDate(asg.createdAt)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Link to="/teacher/assignments/evaluations">
                  <Button variant="primary" size="sm" className="bg-teal-600 hover:bg-teal-700" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                    Grade Student Submissions
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Assignment Modal (TCH-006) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Assignment (TCH-006)"
        size="lg"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs text-slate-700">
          <div>
            <label className="block font-semibold mb-1">Assignment Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed API Gateway Rate Limiter with Redis"
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
              <label className="block font-semibold mb-1">Maximum Marks (Score)</label>
              <input
                type="number"
                min="10"
                max="100"
                value={form.maxMarks}
                onChange={(e) => setForm({ ...form, maxMarks: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Submission Deadline</label>
              <input
                type="date"
                required
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Detailed Instructions & Problem Statement *</label>
            <textarea
              rows={4}
              required
              placeholder="Describe technical requirements, architectural criteria, and submission format..."
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Starter Code / Specification URL (Optional)</label>
            <input
              type="url"
              placeholder="https://github.com/nexelvoria-academy/starter-template"
              value={form.attachmentUrl}
              onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" className="bg-teal-600 hover:bg-teal-700">
              Publish Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

