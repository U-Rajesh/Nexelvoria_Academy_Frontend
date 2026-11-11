import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  ArrowRight,
  PlayCircle,
  CheckCircle,
  User,
  Layers,
  FileText,
  Video,
  Info,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import type { Course, Enrollment, Batch } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import { formatDate } from '../../utils/formatters';

export const StudentCoursesPage: React.FC = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<{ enrollment: Enrollment; course: Course; batch?: Batch }[]>([]);
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<{ enrollment: Enrollment; course: Course; batch?: Batch } | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    studentService.getStudentEnrollments(user.id).then((res) => {
      if (res.success) {
        setEnrollments(res.data);
      }
      setIsLoading(false);
    });
  }, [user]);

  const handleOpenCourseDetail = (item: { enrollment: Enrollment; course: Course; batch?: Batch }) => {
    setSelectedCourseDetail(item);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Enrolled Courses</h1>
          <p className="text-xs text-slate-500 mt-1">
            Access your authorized training programs, continue learning, and track curriculum progress (STD-001, STD-003).
          </p>
        </div>

        <Badge variant="purple" size="md">
          {enrollments.length} Active {enrollments.length === 1 ? 'Program' : 'Programs'}
        </Badge>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading your enrolled courses...</div>
      ) : enrollments.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 text-xs">
          <BookOpen className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-600">No Authorized Course Enrollments</p>
          <p className="mt-1">You are not currently enrolled in any course batches. Please contact admissions.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {enrollments.map((item) => {
            const { enrollment, course, batch } = item;
            return (
              <Card key={enrollment.id} className="flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-shadow border-slate-200/90">
                <div>
                  {/* Thumbnail Banner */}
                  <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <Badge variant="purple" size="sm">
                        {course.category}
                      </Badge>
                      <Badge variant="neutral" size="sm" className="bg-slate-900/80 text-white border-slate-700">
                        {course.level}
                      </Badge>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="text-[10px] font-mono uppercase bg-indigo-600/90 text-white px-2 py-0.5 rounded tracking-wider">
                        Cohort: {batch?.name || 'Assigned Cohort'}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1 leading-snug line-clamp-1">
                        {course.title}
                      </h3>
                    </div>
                  </div>

                  {/* Course Body Details */}
                  <div className="p-5 space-y-4">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {course.shortDescription}
                    </p>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Lead Trainer</span>
                        <span className="font-semibold text-slate-800 line-clamp-1">
                          {(course as any).trainer?.name || 'Dr. Vikram Rao'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Program Duration</span>
                        <span className="font-semibold text-slate-800">
                          {course.durationWeeks} Weeks ({course.totalHours} Hrs)
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Batch Timings</span>
                        <span className="font-semibold text-slate-800 line-clamp-1">
                          {batch?.scheduleTiming || 'Mon - Fri 7:30 AM IST'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Status</span>
                        <Badge variant="success" size="sm" dot>
                          {enrollment.status === 'active' ? 'Active & Ongoing' : enrollment.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span className="font-medium">Curriculum Completion</span>
                        <span className="font-extrabold text-indigo-600">{enrollment.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${enrollment.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-5 pt-0 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <Link
                      to="/student/syllabus"
                      className="p-2 text-center rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium border border-slate-200/60"
                    >
                      📑 Syllabus
                    </Link>
                    <Link
                      to="/student/materials"
                      className="p-2 text-center rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium border border-slate-200/60"
                    >
                      📦 Materials
                    </Link>
                    <Link
                      to="/student/recordings"
                      className="p-2 text-center rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium border border-slate-200/60"
                    >
                      🎥 Recordings
                    </Link>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => handleOpenCourseDetail(item)}
                      className="flex-1"
                      leftIcon={<Info className="h-4 w-4" />}
                    >
                      Course Details
                    </Button>

                    <Link to={`/student/courses/${course.id}/learn`} className="flex-1">
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full"
                        rightIcon={<ArrowRight className="h-4 w-4" />}
                      >
                        Continue Learning
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Course Detail Modal */}
      {selectedCourseDetail && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={selectedCourseDetail.course.title}
          size="lg"
        >
          <div className="space-y-6 text-slate-800 text-xs">
            {/* Modal Hero */}
            <div className="flex flex-col sm:flex-row gap-4 items-start pb-4 border-b border-slate-100">
              <img
                src={selectedCourseDetail.course.thumbnailUrl}
                alt={selectedCourseDetail.course.title}
                className="w-full sm:w-44 h-28 object-cover rounded-xl"
              />
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="purple" size="sm">{selectedCourseDetail.course.category}</Badge>
                  <Badge variant="neutral" size="sm">{selectedCourseDetail.course.level}</Badge>
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {selectedCourseDetail.course.title}
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  {selectedCourseDetail.course.shortDescription}
                </p>
              </div>
            </div>

            {/* Trainer & Schedule Particulars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Mentor & Lead Trainer</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {(selectedCourseDetail.course as any).trainer?.name || 'Dr. Vikram Rao'}
                </p>
                <p className="text-slate-500 text-[11px]">
                  {(selectedCourseDetail.course as any).trainer?.title || 'Principal Solutions Architect'}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Assigned Batch & Cohort</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {selectedCourseDetail.batch?.name || 'Oct 2026 Morning Cohort'}
                </p>
                <p className="text-slate-500 text-[11px]">
                  {selectedCourseDetail.batch?.scheduleTiming || 'Mon - Fri 7:30 AM IST'}
                </p>
              </div>
            </div>

            {/* Curriculum Modules Outline */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Syllabus Modules ({selectedCourseDetail.course.modules?.length || 0} Modules)
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedCourseDetail.course.modules?.map((mod, idx) => (
                  <div key={mod.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-600 font-bold block">
                        Module {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800">{mod.title}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {mod.chapters?.length || 0} Chapters
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
              <Link to={`/student/courses/${selectedCourseDetail.course.id}/learn`}>
                <Button variant="primary" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Continue Learning in LMS
                </Button>
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
