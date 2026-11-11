import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Users,
  Clock,
  Video,
  CheckCircle2,
  ExternalLink,
  Edit,
  GraduationCap,
  Layers,
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
import type { Batch, Course, TeacherProfile } from '../../types';

export const AdminBatchListPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  // Form State
  const [courseId, setCourseId] = useState('');
  const [name, setName] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [scheduleTiming, setScheduleTiming] = useState('Mon - Fri 7:30 AM - 9:30 AM IST');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(40);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [assignedTeacherId, setAssignedTeacherId] = useState('');
  const [status, setStatus] = useState<'upcoming' | 'ongoing' | 'completed'>('ongoing');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    const [bRes, cRes, tRes] = await Promise.all([
      adminService.getBatches(),
      adminService.getCourses(),
      adminService.getTeachers(),
    ]);
    if (bRes.success) setBatches(bRes.data);
    if (cRes.success) {
      setCourses(cRes.data);
      if (cRes.data.length > 0 && !courseId) setCourseId(cRes.data[0].id);
    }
    if (tRes.success) {
      setTeachers(tRes.data);
      if (tRes.data.length > 0 && !assignedTeacherId) setAssignedTeacherId(tRes.data[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingBatch(null);
    setName('');
    setBatchCode(`BAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setMeetingUrl('https://meet.google.com/nex-batch-live');
    setStartDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || !courseId) return;

    const courseObj = courses.find((c) => c.id === courseId);
    setIsSubmitting(true);

    if (editingBatch) {
      const res = await adminService.updateBatch({ id: user.id, name: user.name }, editingBatch.id, {
        name,
        batchCode,
        scheduleTiming,
        startDate,
        endDate,
        maxCapacity,
        meetingUrl,
        assignedTeacherIds: assignedTeacherId ? [assignedTeacherId] : [],
        status,
      });
      setIsSubmitting(false);
      if (res.success) {
        showToast({ type: 'success', title: 'Batch Updated', message: res.message || 'Batch updated.' });
        setIsModalOpen(false);
        loadData();
      }
    } else {
      const res = await adminService.createBatch(
        { id: user.id, name: user.name },
        {
          courseId,
          courseName: courseObj?.title || 'Course Program',
          name,
          batchCode,
          scheduleTiming,
          startDate,
          endDate,
          maxCapacity,
          meetingUrl,
          assignedTeacherIds: assignedTeacherId ? [assignedTeacherId] : [],
          status,
        }
      );
      setIsSubmitting(false);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Batch Created',
          message: `${name} (${batchCode}) cohort created. (ADM-007)`,
        });
        setIsModalOpen(false);
        loadData();
      }
    }
  };

  const columns: Column<Batch>[] = [
    {
      key: 'name',
      header: 'Cohort Name & Code',
      sortable: true,
      render: (b) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{b.name}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="purple" size="sm">{b.batchCode}</Badge>
            <span className="text-[11px] text-slate-500 font-mono truncate max-w-[200px]">{b.courseName}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'scheduleTiming',
      header: 'Timing & Schedule',
      render: (b) => (
        <div>
          <span className="text-xs font-semibold text-slate-800 block flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-slate-400" /> {b.scheduleTiming}
          </span>
          <span className="text-[11px] text-slate-500">
            {formatDate(b.startDate)} — {formatDate(b.endDate)}
          </span>
        </div>
      ),
    },
    {
      key: 'assignedTeacherIds',
      header: 'Faculty Instructor',
      render: (b) => {
        const assignedTeachers = teachers.filter((t) => b.assignedTeacherIds.includes(t.id));
        return assignedTeachers.length > 0 ? (
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-800">
              {assignedTeachers.map((t) => t.name).join(', ')}
            </span>
          </div>
        ) : (
          <span className="text-xs text-amber-600 font-medium italic">Unallocated</span>
        );
      },
    },
    {
      key: 'maxCapacity',
      header: 'Seat Capacity',
      sortable: true,
      render: (b) => {
        const count = b.enrolledStudentIds?.length || 0;
        const capacity = b.maxCapacity ?? 40;
        const isFull = count >= capacity;
        return (
          <div>
            <div className="flex justify-between text-[11px] font-bold text-slate-700">
              <span>{count} / {capacity}</span>
              {isFull && <span className="text-rose-500 font-bold">FULL</span>}
            </div>
            <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-0.5">
              <div
                className={`h-full rounded-full ${isFull ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, (count / capacity) * 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (b) => (
        <Badge
          variant={
            b.status === 'ongoing'
              ? 'success'
              : b.status === 'upcoming'
              ? 'info'
              : 'neutral'
          }
          size="sm"
          dot
        >
          {b.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'meetingUrl',
      header: 'Live Class Link (BR-015)',
      render: (b) =>
        b.meetingUrl ? (
          <a
            href={b.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-mono"
          >
            <Video className="h-3.5 w-3.5 text-indigo-500" /> Join Meet
          </a>
        ) : (
          <span className="text-xs text-slate-400">Offline Room</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (b) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setEditingBatch(b);
            setCourseId(b.courseId);
            setName(b.name);
            setBatchCode(b.batchCode);
            setScheduleTiming(b.scheduleTiming);
            setStartDate(b.startDate);
            setEndDate(b.endDate);
            setMaxCapacity(b.maxCapacity ?? 40);
            setMeetingUrl(b.meetingUrl || '');
            setAssignedTeacherId(b.assignedTeacherIds[0] || '');
            setStatus(b.status);
            setIsModalOpen(true);
          }}
          className="text-xs text-indigo-600"
          leftIcon={<Edit className="h-3.5 w-3.5" />}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Batch & Cohort Operations (ADM-007)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Schedule recurring live cohorts, manage maximum classroom capacities, assign faculty, and configure meeting links.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Cohort Batch
        </Button>
      </div>

      {/* Main Table */}
      <DataTable
        data={batches}
        columns={columns}
        searchPlaceholder="Search by batch name, code or course..."
        pageSize={10}
      />

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingBatch ? `Edit Batch: ${editingBatch.name}` : 'Create Cohort Batch (ADM-007)'}
          size="lg"
        >
          <form onSubmit={handleSaveBatch} className="space-y-4 text-xs text-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Target Training Course *</label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Batch Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JFS-2026-M1"
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-800 mb-1">Cohort Batch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Java Full Stack - Nov 2026 Morning Fast-Track"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Schedule & Timings *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mon - Fri 7:30 AM - 9:30 AM IST"
                  value={scheduleTiming}
                  onChange={(e) => setScheduleTiming(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Seat Capacity Limit</label>
                <input
                  type="number"
                  min={10}
                  max={200}
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Start Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Assign Primary Faculty</label>
                <select
                  value={assignedTeacherId}
                  onChange={(e) => setAssignedTeacherId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="">-- No Instructor Assigned --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Cohort Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-800 mb-1">
                  Manual Meeting URL (Google Meet / Zoom per BR-015)
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xyz-abcd-efg"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                {editingBatch ? 'Save Changes' : 'Create Batch'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
