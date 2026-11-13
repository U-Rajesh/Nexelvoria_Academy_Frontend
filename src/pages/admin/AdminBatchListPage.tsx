import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Clock,
  Video,
  Edit,
  GraduationCap,
  Eye,
  Filter,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { Modal } from '../../components/feedback/Modal';
import type { Batch, Course, TeacherProfile, BatchStatus } from '../../types';

export const AdminBatchListPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const courseFilterParam = searchParams.get('courseId') || '';

  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [activeStatusTab, setActiveStatusTab] = useState<'All' | BatchStatus>('All');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>(courseFilterParam);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  // Form State
  const [courseId, setCourseId] = useState('');
  const [name, setName] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [scheduleTiming, setScheduleTiming] = useState('Mon - Fri 7:30 AM - 9:30 AM IST');
  const [startTime, setStartTime] = useState('07:30');
  const [endTime, setEndTime] = useState('09:30');
  const [timezone, setTimezone] = useState('IST');
  const [scheduleDays, setScheduleDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(40);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [assignedTeacherId, setAssignedTeacherId] = useState('');
  const [assistantTeacherId, setAssistantTeacherId] = useState('');
  const [status, setStatus] = useState<BatchStatus>('ongoing');
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

  useEffect(() => {
    if (courseFilterParam) {
      setSelectedCourseFilter(courseFilterParam);
    }
  }, [courseFilterParam]);

  const handleOpenCreate = () => {
    setEditingBatch(null);
    setName('');
    setBatchCode(`BAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setScheduleTiming('Mon - Fri 7:30 AM - 9:30 AM IST');
    setStartTime('07:30');
    setEndTime('09:30');
    setTimezone('IST');
    setScheduleDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    setMeetingUrl('https://meet.google.com/nex-batch-live');
    setStartDate(new Date().toISOString().split('T')[0]);
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6);
    setEndDate(futureDate.toISOString().split('T')[0]);
    setStatus('ongoing');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Batch) => {
    setEditingBatch(b);
    setCourseId(b.courseId);
    setName(b.name);
    setBatchCode(b.batchCode);
    setScheduleTiming(b.scheduleTiming);
    setStartTime(b.startTime || '07:30');
    setEndTime(b.endTime || '09:30');
    setTimezone(b.timezone || 'IST');
    setScheduleDays(b.scheduleDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    setStartDate(b.startDate);
    setEndDate(b.endDate);
    setMaxCapacity(b.maxCapacity ?? 40);
    setMeetingUrl(b.meetingUrl || '');
    setAssignedTeacherId(b.assignedTeacherIds[0] || '');
    setAssistantTeacherId(b.assignedTeacherIds[1] || '');
    setStatus(b.status);
    setIsModalOpen(true);
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || !courseId) return;

    const courseObj = courses.find((c) => c.id === courseId);
    setIsSubmitting(true);

    const teacherIds: string[] = [];
    if (assignedTeacherId) teacherIds.push(assignedTeacherId);
    if (assistantTeacherId && assistantTeacherId !== assignedTeacherId) teacherIds.push(assistantTeacherId);

    const formattedTiming = scheduleTiming.trim()
      ? scheduleTiming
      : `${scheduleDays.join('-')} ${startTime} - ${endTime} ${timezone}`;

    if (editingBatch) {
      const res = await adminService.updateBatch({ id: user.id, name: user.name }, editingBatch.id, {
        name,
        batchCode,
        scheduleTiming: formattedTiming,
        startTime,
        endTime,
        timezone,
        scheduleDays,
        startDate,
        endDate,
        maxCapacity,
        meetingUrl,
        assignedTeacherIds: teacherIds,
        primaryTeacherId: assignedTeacherId,
        assistantTeacherId: assistantTeacherId || undefined,
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
          scheduleTiming: formattedTiming,
          startTime,
          endTime,
          timezone,
          scheduleDays,
          startDate,
          endDate,
          maxCapacity,
          meetingUrl,
          assignedTeacherIds: teacherIds,
          primaryTeacherId: assignedTeacherId,
          assistantTeacherId: assistantTeacherId || undefined,
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

  const filteredBatches = batches.filter((b) => {
    const matchesCourse = selectedCourseFilter ? b.courseId === selectedCourseFilter : true;
    const matchesStatus = activeStatusTab === 'All' ? true : b.status === activeStatusTab;
    return matchesCourse && matchesStatus;
  });

  const columns: Column<Batch>[] = [
    {
      key: 'name',
      header: 'Cohort Name & Code',
      sortable: true,
      render: (b) => (
        <div>
          <Link
            to={`/admin/batches/${b.id}`}
            className="font-bold text-slate-900 block text-xs hover:text-indigo-600 transition-colors"
          >
            {b.name}
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
              {b.batchCode}
            </span>
            <span className="text-[11px] text-slate-500 truncate max-w-[200px]">{b.courseName}</span>
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
      header: 'Assigned Instructors',
      render: (b) => {
        const assignedTeachers = teachers.filter((t) => b.assignedTeacherIds?.includes(t.id));
        return assignedTeachers.length > 0 ? (
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-indigo-600 shrink-0" />
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
          <div className="min-w-[90px]">
            <div className="flex justify-between text-[11px] font-bold text-slate-700">
              <span>{count} / {capacity}</span>
              {isFull && <span className="text-rose-500 text-[10px]">FULL</span>}
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-0.5">
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
            b.status === 'ongoing' || b.status === 'active'
              ? 'success'
              : b.status === 'upcoming'
              ? 'purple'
              : b.status === 'completed'
              ? 'neutral'
              : b.status === 'inactive'
              ? 'warning'
              : 'danger'
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
      header: 'Live Meeting (BR-015)',
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
        <div className="flex items-center gap-1.5">
          <Link to={`/admin/batches/${b.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-indigo-600 h-7 px-2"
              leftIcon={<Eye className="h-3 w-3" />}
            >
              Details
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEdit(b)}
            className="text-xs text-slate-600 h-7 px-2"
            leftIcon={<Edit className="h-3 w-3" />}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Batch & Cohort Operations (ADM-007)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Schedule recurring live cohorts, monitor maximum capacities, allocate teaching faculty, and manage live meeting links.
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

      {/* Filter Bar: Status Tabs + Course Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(['All', 'ongoing', 'upcoming', 'active', 'inactive', 'completed', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveStatusTab(tab)}
              className={`pb-2 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 capitalize whitespace-nowrap ${
                activeStatusTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab === 'All' ? 'All Cohorts' : tab}
            </button>
          ))}
        </div>

        {/* Filter by Course */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={selectedCourseFilter}
            onChange={(e) => {
              setSelectedCourseFilter(e.target.value);
              setSearchParams(e.target.value ? { courseId: e.target.value } : {});
            }}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Course Programs</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.courseCode ? `[${c.courseCode}] ` : ''}{c.title}
              </option>
            ))}
          </select>
          {selectedCourseFilter && (
            <button
              onClick={() => {
                setSelectedCourseFilter('');
                setSearchParams({});
              }}
              className="text-xs text-rose-600 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        data={filteredBatches}
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode ? `[${c.courseCode}] ` : ''}{c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Batch / Cohort Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Java Full Stack - Nov 2026 Batch"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Batch Code Identifier *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JFS-2026-B1"
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Seat Capacity (TBD per SRS)</label>
                <input
                  type="number"
                  min={5}
                  max={200}
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Operational Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BatchStatus)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Lead Instructor *</label>
                <select
                  value={assignedTeacherId}
                  onChange={(e) => setAssignedTeacherId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Unallocated</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Assistant / Supporting Faculty</label>
                <select
                  value={assistantTeacherId}
                  onChange={(e) => setAssistantTeacherId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">None (Single Instructor)</option>
                  {teachers
                    .filter((t) => t.id !== assignedTeacherId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.specialization})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Structured Schedule Configuration (CRS-010) */}
            <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Class Schedule & Timetable (CRS-010)
              </label>

              {/* Days of Week */}
              <div>
                <span className="text-xs font-medium text-slate-600 block mb-1.5">Active Session Days:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const).map((day) => {
                    const isSelected = scheduleDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => {
                          const updated = isSelected
                            ? scheduleDays.filter((d) => d !== day)
                            : [...scheduleDays, day];
                          setScheduleDays(updated);
                          setScheduleTiming(`${updated.join('-')} ${startTime} - ${endTime} ${timezone}`);
                        }}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Timing & Timezone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      setScheduleTiming(`${scheduleDays.join('-')} ${e.target.value} - ${endTime} ${timezone}`);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      setScheduleTiming(`${scheduleDays.join('-')} ${startTime} - ${e.target.value} ${timezone}`);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => {
                      setTimezone(e.target.value);
                      setScheduleTiming(`${scheduleDays.join('-')} ${startTime} - ${endTime} ${e.target.value}`);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="IST">IST (UTC +5:30)</option>
                    <option value="UTC">UTC (GMT)</option>
                    <option value="EST">EST (UTC -5:00)</option>
                    <option value="PST">PST (UTC -8:00)</option>
                  </select>
                </div>
              </div>

              {/* Display String (Editable override) */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Schedule Display String
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mon - Fri 7:30 AM - 9:30 AM IST"
                  value={scheduleTiming}
                  onChange={(e) => setScheduleTiming(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Commencement Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Concurrence / End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Manual Live Meeting Link (Google Meet / Zoom URL - BR-015)
              </label>
              <input
                type="url"
                placeholder="https://meet.google.com/abc-defg-hij"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Per rule BR-015, instructors and students launch live lectures via this manual link.
              </p>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
                {editingBatch ? 'Save Batch Changes' : 'Schedule Cohort'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
