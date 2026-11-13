import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Clock,
  Video,
  AlertCircle,
  ExternalLink,
  Edit,
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Mail,
  Phone,
  Plus,
  Save,
  Radio,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate, formatINR } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import { DataTable, type Column } from '../../components/tables/DataTable';
import type { Batch, Course, StudentProfile, Enrollment, TeacherProfile, BatchStatus } from '../../types';

export const AdminBatchDetailPage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [roster, setRoster] = useState<{ student: StudentProfile; enrollment: Enrollment }[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'instructors' | 'curriculum'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Edit Meeting URL State (BR-015)
  const [isEditingMeeting, setIsEditingMeeting] = useState(false);
  const [meetingUrlInput, setMeetingUrlInput] = useState('');

  // Status Change Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<BatchStatus>('ongoing');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadBatchDetails = async () => {
    if (!batchId) return;
    setIsLoading(true);

    const [bRes, cRes, tRes, rRes] = await Promise.all([
      adminService.getBatchById(batchId),
      adminService.getCourses(),
      adminService.getTeachers(),
      adminService.getBatchStudents(batchId),
    ]);

    if (bRes.success && bRes.data) {
      setBatch(bRes.data);
      setMeetingUrlInput(bRes.data.meetingUrl || '');
      setSelectedStatus(bRes.data.status);

      if (cRes.success) {
        const foundCourse = cRes.data.find((c) => c.id === bRes.data.courseId);
        setCourse(foundCourse || null);
      }
    }
    if (tRes.success) setTeachers(tRes.data);
    if (rRes.success) setRoster(rRes.data);

    setIsLoading(false);
  };

  useEffect(() => {
    loadBatchDetails();
  }, [batchId]);

  const handleSaveMeetingUrl = async () => {
    if (!user || !batch) return;
    const res = await adminService.updateBatch({ id: user.id, name: user.name }, batch.id, {
      meetingUrl: meetingUrlInput.trim(),
    });
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Meeting Link Updated (BR-015)',
        message: 'Live class link updated. Teachers and students now see the new link.',
      });
      setIsEditingMeeting(false);
      loadBatchDetails();
    }
  };

  const handleUpdateStatus = async () => {
    if (!user || !batch) return;
    setIsUpdatingStatus(true);
    const res = await adminService.updateBatchStatus({ id: user.id, name: user.name }, batch.id, selectedStatus);
    setIsUpdatingStatus(false);
    if (res.success) {
      showToast({
        type: 'info',
        title: 'Batch Status Updated',
        message: `Batch status changed to ${selectedStatus.toUpperCase()}.`,
      });
      setStatusModalOpen(false);
      loadBatchDetails();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Batch Cohort Not Found</h2>
        <p className="text-xs text-slate-500">The requested batch cohort does not exist or has been removed.</p>
        <Link to="/admin/batches">
          <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Batches
          </Button>
        </Link>
      </div>
    );
  }

  const assignedInstructors = teachers.filter((t) => batch.assignedTeacherIds?.includes(t.id));
  const capacity = batch.maxCapacity || 40;
  const enrolledCount = roster.length || batch.enrolledStudentIds?.length || 0;
  const isFull = enrolledCount >= capacity;

  const getStatusBadgeVariant = (s: string) => {
    switch (s) {
      case 'ongoing':
      case 'active':
        return 'success';
      case 'upcoming':
        return 'purple';
      case 'completed':
        return 'neutral';
      case 'inactive':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const studentColumns: Column<{ student: StudentProfile; enrollment: Enrollment }>[] = [
    {
      key: 'student',
      header: 'Student Name & ID',
      render: (row) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-slate-900">{row.student.name}</span>
          <span className="block text-[10px] font-mono text-slate-400">{row.student.id}</span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => (
        <div className="text-xs text-slate-600 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 text-slate-400" />
            <span className="truncate max-w-[140px]">{row.student.email}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 text-slate-400" />
            <span>{row.student.mobile}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'college',
      header: 'College / Degree',
      render: (row) => (
        <div className="text-xs text-slate-600">
          <span className="font-medium text-slate-800">{row.student.collegeName || 'N/A'}</span>
          <span className="block text-[11px] text-slate-400">{row.student.degreeBranch || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'enrolledAt',
      header: 'Enrolled On',
      render: (row) => (
        <span className="text-xs text-slate-600">{formatDate(row.enrollment.enrolledAt)}</span>
      ),
    },
    {
      key: 'progress',
      header: 'LMS Progress',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full"
              style={{ width: `${row.enrollment.progressPercentage || 0}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-700">
            {row.enrollment.progressPercentage || 0}%
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Enrollment Status',
      render: (row) => (
        <Badge
          variant={
            row.enrollment.status === 'active'
              ? 'success'
              : row.enrollment.status === 'approved_unpaid'
              ? 'warning'
              : 'neutral'
          }
          size="sm"
        >
          {row.enrollment.status.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button & Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/batches"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to All Batches
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusModalOpen(true)}
            leftIcon={<Edit className="h-3.5 w-3.5" />}
          >
            Change Status ({batch.status.toUpperCase()})
          </Button>
          <Link to={`/admin/enrollments?batchId=${batch.id}`}>
            <Button variant="primary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
              Enroll Student
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Cohort Card */}
      <Card className="p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                {batch.batchCode}
              </span>
              <Badge variant={getStatusBadgeVariant(batch.status)} size="md" dot>
                {batch.status.toUpperCase()}
              </Badge>
              {isFull && <Badge variant="warning" size="sm">AT CAPACITY</Badge>}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{batch.name}</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-indigo-500" /> Linked Course: <strong>{batch.courseName}</strong>
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="text-center px-3 border-r border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Enrolled Students</span>
              <span className="text-lg font-extrabold text-slate-900">
                {enrolledCount} <span className="text-xs font-normal text-slate-400">/ {capacity}</span>
              </span>
            </div>
            <div className="text-center px-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Faculty Assigned</span>
              <span className="text-lg font-extrabold text-slate-900">{assignedInstructors.length}</span>
            </div>
          </div>
        </div>

        {/* Live Meeting Link Banner (BR-015) */}
        <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
              <strong className="text-indigo-950 font-bold">Manual Live Meeting Room (SRS Rule BR-015)</strong>
            </div>
            {isEditingMeeting ? (
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="url"
                  value={meetingUrlInput}
                  onChange={(e) => setMeetingUrlInput(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-72 text-xs px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <Button variant="primary" size="sm" onClick={handleSaveMeetingUrl} leftIcon={<Save className="h-3.5 w-3.5" />}>
                  Save Link
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsEditingMeeting(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <p className="text-indigo-800 font-mono text-[11px] truncate max-w-md">
                {batch.meetingUrl || 'No meeting room configured yet.'}
              </p>
            )}
          </div>

          {!isEditingMeeting && (
            <div className="flex items-center gap-2 shrink-0">
              {batch.meetingUrl && (
                <a href={batch.meetingUrl} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700"
                    leftIcon={<Video className="h-3.5 w-3.5" />}
                  >
                    Launch Meeting
                  </Button>
                </a>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingMeeting(true)}
                leftIcon={<Edit className="h-3.5 w-3.5" />}
              >
                Edit Link
              </Button>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pt-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Schedule & Cohort Overview
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`pb-3 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'students'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Enrolled Students</span>
            <Badge variant="purple" size="sm">{roster.length}</Badge>
          </button>
          <button
            onClick={() => setActiveTab('instructors')}
            className={`pb-3 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'instructors'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Assigned Faculty</span>
            <Badge variant="neutral" size="sm">{assignedInstructors.length}</Badge>
          </button>
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`pb-3 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
              activeTab === 'curriculum'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Curriculum Structure
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Schedule & Timing</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400">Class Timetable:</span>
                  <span className="font-semibold text-slate-800">{batch.scheduleTiming}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400">Term Start Date:</span>
                  <span className="font-semibold text-slate-800">{formatDate(batch.startDate)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400">Term End Date:</span>
                  <span className="font-semibold text-slate-800">{formatDate(batch.endDate)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Max Seat Capacity:</span>
                  <span className="font-semibold text-slate-800">{capacity} Students (TBD per SRS)</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Associated Course Information</h4>
              {course ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-400">Program Code:</span>
                    <span className="font-mono font-bold text-indigo-600">{course.courseCode || course.id}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-400">Tuition Fee:</span>
                    <span className="font-semibold text-slate-800">{formatINR(course.discountedFeeINR || course.feeINR)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-400">Program Length:</span>
                    <span className="font-semibold text-slate-800">{course.durationWeeks} Weeks ({course.totalHours} Hours)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Difficulty Level:</span>
                    <span className="font-semibold text-slate-800">{course.level}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No linked course found.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Enrolled Students Roster */}
        {activeTab === 'students' && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Enrolled Cohort Roster</h4>
                <p className="text-xs text-slate-500">
                  Students officially admitted to this batch cohort. Tracks LMS completion and fee status.
                </p>
              </div>
              <Link to={`/admin/enrollments?batchId=${batch.id}`}>
                <Button variant="primary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
                  Enroll Student
                </Button>
              </Link>
            </div>

            <DataTable
              data={roster}
              columns={studentColumns}
              emptyMessage="No students currently enrolled in this batch."
            />
          </div>
        )}

        {/* Tab 3: Assigned Faculty */}
        {activeTab === 'instructors' && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Assigned Teaching Faculty</h4>
                <p className="text-xs text-slate-500">
                  Instructors authorized to conduct lectures, take attendance, and evaluate assessments for this batch.
                </p>
              </div>
              <Link to="/admin/teachers/allocation">
                <Button variant="outline" size="sm">Manage Faculty Workload</Button>
              </Link>
            </div>

            {assignedInstructors.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                <Users className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No Faculty Assigned to this Batch</p>
                <Link to="/admin/teachers/allocation">
                  <Button variant="primary" size="sm">Allocate Teacher</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignedInstructors.map((tch, idx) => (
                  <div key={tch.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                    <img
                      src={tch.avatarUrl}
                      alt={tch.name}
                      className="h-12 w-12 rounded-full object-cover border border-slate-300"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-slate-900">{tch.name}</h5>
                        {idx === 0 && <Badge variant="purple" size="sm">Lead Instructor</Badge>}
                      </div>
                      <p className="text-[11px] text-slate-500">{tch.specialization}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-1">
                        <span>{tch.email}</span>
                        <span>•</span>
                        <span>{tch.mobile}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Curriculum Structure */}
        {activeTab === 'curriculum' && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">Course Curriculum & Syllabus</h4>
              {course && (
                <Link to={`/courses/${course.slug}`} target="_blank">
                  <Button variant="outline" size="sm" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                    View Public Course Page
                  </Button>
                </Link>
              )}
            </div>

            {course && course.modules && course.modules.length > 0 ? (
              <div className="space-y-3">
                {course.modules.map((mod, modIdx) => (
                  <div key={mod.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        Module 0{modIdx + 1}
                      </span>
                      <span className="text-xs text-slate-400">
                        {mod.chapters.reduce((acc, c) => acc + c.lessons.length, 0)} Lessons
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-800">{mod.title}</h5>
                    <p className="text-[11px] text-slate-500">{mod.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No syllabus modules defined for this course.</p>
            )}
          </div>
        )}
      </Card>

      {/* Status Transition Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Batch Operational Status"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Transition the operational state of cohort <strong>{batch.name}</strong> ({batch.batchCode}):
          </p>

          <div className="space-y-2">
            {[
              { id: 'upcoming', label: 'Upcoming', desc: 'Enrollment active, classes commence in the future.' },
              { id: 'ongoing', label: 'Ongoing', desc: 'Active term with daily lectures and attendance tracking.' },
              { id: 'active', label: 'Active', desc: 'Cohort is actively operational with assigned faculty.' },
              { id: 'inactive', label: 'Inactive', desc: 'Cohort temporarily halted or on academic break.' },
              { id: 'completed', label: 'Completed', desc: 'All lectures, tests and assessments concluded.' },
              { id: 'cancelled', label: 'Cancelled', desc: 'Cohort cancelled or merged into another batch.' },
            ].map((opt) => (
              <div
                key={opt.id}
                onClick={() => setSelectedStatus(opt.id as BatchStatus)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedStatus === opt.id
                    ? 'bg-indigo-50 border-indigo-300 font-semibold text-indigo-950'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="batchStatus"
                    checked={selectedStatus === opt.id}
                    onChange={() => setSelectedStatus(opt.id as BatchStatus)}
                    className="text-indigo-600"
                  />
                  <span className="text-xs">{opt.label}</span>
                </div>
                <p className="text-[11px] text-slate-400 pl-5 mt-0.5">{opt.desc}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isUpdatingStatus}
              onClick={handleUpdateStatus}
            >
              Update Status
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
