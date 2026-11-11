import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Trash2,
  Edit,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { teacherService } from '../../services/teacherService';
import type { OnlineTest, Course, Batch, Question } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/feedback/Modal';
import { formatDate } from '../../utils/formatters';

export const TeacherTestsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [tests, setTests] = useState<OnlineTest[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    courseId: '',
    batchId: '',
    durationMinutes: 45,
    totalMarks: 50,
    passingPercentage: 60,
    startsAt: '2026-11-10T09:00:00Z',
    endsAt: '2026-11-12T23:59:59Z',
    isActive: true,
    allowRetakes: false,
    questions: [
      {
        id: 'q-1',
        type: 'mcq' as const,
        prompt: 'Which virtual thread scheduling mechanism is employed by the HotSpot JVM in Java 21?',
        options: [
          { id: 'opt-a', text: 'ForkJoinPool using work-stealing algorithm' },
          { id: 'opt-b', text: 'Dedicated 1:1 kernel thread mapping' },
          { id: 'opt-c', text: 'Round-robin preemptive OS scheduling' },
          { id: 'opt-d', text: 'Cooperative event loop with green threads' },
        ],
        correctAnswers: ['opt-a'],
        maxMarks: 10,
        explanation: 'Virtual threads in Project Loom use carrier threads mounted on a FIFO/work-stealing ForkJoinPool.',
      },
    ] as Question[],
  });

  useEffect(() => {
    const loadData = async () => {
      const teacherId = user?.id || 'user-tch-001';
      const [testsRes, coursesRes, batchesRes] = await Promise.all([
        teacherService.getTeacherTests(teacherId),
        teacherService.getAssignedCourses(teacherId),
        teacherService.getAssignedBatches(teacherId),
      ]);

      if (testsRes.success) setTests(testsRes.data);
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

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.courseId) {
      showToast({ type: 'error', message: 'Please provide test title and select course.' });
      return;
    }

    const res = await teacherService.createOnlineTest(
      { id: user?.id || 'user-tch-001', name: user?.name || 'Dr. Vikram Rao' },
      form
    );

    if (res.success && res.data) {
      setTests([res.data, ...tests]);
      setIsCreateModalOpen(false);
      showToast({
        type: 'success',
        title: 'Examination Created',
        message: 'Online test configured and published for candidate evaluations. (TCH-008)',
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Online Examinations & Tests</h1>
          <p className="text-xs text-slate-500 mt-1">
            Author technical assessments, configure time limits, and set passing benchmarks (SRS Rule TCH-008).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/teacher/tests/evaluations">
            <Button variant="outline" size="md">
              Review Test Attempts →
            </Button>
          </Link>
          <Button
            variant="primary"
            size="md"
            className="bg-teal-600 hover:bg-teal-700"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create New Test
          </Button>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="space-y-4">
        {tests.map((test) => (
          <Card key={test.id} className="p-6 border-slate-200 hover:border-teal-300 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono uppercase bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-bold">
                  {test.durationMinutes} Minutes Window • Passing Cutoff: {test.passingPercentage}%
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{test.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={test.isActive ? 'success' : 'neutral'} size="sm" dot>
                  {test.isActive ? 'Active Exam' : 'Draft'}
                </Badge>
                <span className="text-xs font-mono font-bold text-slate-700">
                  Total Marks: {test.totalMarks}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 my-3 leading-relaxed">
              {test.description}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
                <span>Questions: {test.questions?.length || 1} Problems</span>
                <span>•</span>
                <span>Window: {formatDate(test.startsAt)} to {formatDate(test.endsAt)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Link to="/teacher/tests/evaluations">
                  <Button variant="primary" size="sm" className="bg-teal-600 hover:bg-teal-700" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                    View Student Attempts
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Test Modal (TCH-008) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Online Examination (TCH-008)"
        size="lg"
      >
        <form onSubmit={handleCreateTest} className="space-y-4 text-xs text-slate-700">
          <div>
            <label className="block font-semibold mb-1">Examination Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Microservices Distributed Sagas & Event Streaming Midterm"
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
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min="10"
                max="180"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Total Marks</label>
              <input
                type="number"
                min="10"
                max="100"
                value={form.totalMarks}
                onChange={(e) => setForm({ ...form, totalMarks: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Passing Benchmark (%)</label>
              <input
                type="number"
                min="35"
                max="90"
                value={form.passingPercentage}
                onChange={(e) => setForm({ ...form, passingPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Instructions for Students</label>
            <textarea
              rows={3}
              required
              placeholder="Outline examination conduct, calculator policy, and time constraints..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" className="bg-teal-600 hover:bg-teal-700">
              Publish Examination
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

