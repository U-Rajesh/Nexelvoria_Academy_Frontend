import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Clock,
  Layers,
  ShieldAlert,
  ArrowRight,
  Info,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teacherService } from '../../services/teacherService';
import type { Course, Batch } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/feedback/Modal';

export const TeacherCoursesPage: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      const teacherId = user?.id || 'user-tch-001';
      const [coursesRes, batchesRes] = await Promise.all([
        teacherService.getAssignedCourses(teacherId),
        teacherService.getAssignedBatches(teacherId),
      ]);

      if (coursesRes.success) setCourses(coursesRes.data);
      if (batchesRes.success) setBatches(batchesRes.data);
      setIsLoading(false);
    };

    loadCourses();
  }, [user]);

  const handleOpenDetail = (course: Course) => {
    setSelectedCourse(course);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin-Allocated Courses</h1>
          <p className="text-xs text-slate-500 mt-1">
            Curriculum programs officially assigned to your instructional portfolio (SRS Rule TCH-001).
          </p>
        </div>

        <Badge variant="purple" size="md">
          {courses.length} Assigned {courses.length === 1 ? 'Course' : 'Courses'}
        </Badge>
      </div>

      {/* Admin Allocation Policy Callout (TCH-001) */}
      <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-3">
        <Info className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="text-xs text-teal-900 leading-relaxed">
          <strong>Institutional Governance Note (SRS Rule TCH-001):</strong> Course assignments are strictly allocated and managed by the Academic Administration. Teachers cannot self-assign or reallocate courses. To request syllabus changes or cohort additions, submit a request to the Academic Dean.
        </div>
      </div>

      {/* Courses List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading assigned courses...</div>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 text-xs">
          <BookOpen className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-600">No Courses Allocated Yet</p>
          <p className="mt-1">Administration has not assigned any active courses to your faculty account.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses.map((course) => {
            const courseBatches = batches.filter((b) => b.courseId === course.id);
            const studentCount = courseBatches.reduce((acc, b) => acc + (b.enrolledStudentIds?.length || 40), 0);

            return (
              <Card key={course.id} className="flex flex-col justify-between overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge variant="purple" size="sm">{course.category}</Badge>
                      <Badge variant="neutral" size="sm" className="bg-slate-900/80 text-white border-slate-700">
                        {course.level}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="text-base font-bold leading-snug">{course.title}</h3>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {course.shortDescription}
                    </p>

                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Duration</span>
                        <span className="font-bold text-slate-800">{course.durationWeeks} Weeks ({course.totalHours} Hrs)</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Students</span>
                        <span className="font-bold text-slate-800">{studentCount} Enrolled</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Assigned Cohorts</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {courseBatches.map((b) => (
                            <Badge key={b.id} variant="purple" size="sm">{b.name}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between gap-3 border-t border-slate-100 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDetail(course)}
                    leftIcon={<Info className="h-3.5 w-3.5" />}
                  >
                    View Curriculum
                  </Button>

                  <div className="flex items-center gap-2">
                    <Link to="/teacher/materials">
                      <Button variant="outline" size="sm">
                        Study Materials
                      </Button>
                    </Link>
                    <Link to="/teacher/batches">
                      <Button variant="primary" size="sm" className="bg-teal-600 hover:bg-teal-700" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                        View Batches
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
      {selectedCourse && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Curriculum Overview: ${selectedCourse.title}`}
          size="lg"
        >
          <div className="space-y-5 text-xs text-slate-700">
            <div>
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-1">Course Description</h4>
              <p className="leading-relaxed text-slate-600">{selectedCourse.longDescription}</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                Modules Breakdown ({selectedCourse.modules?.length || 0} Modules)
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedCourse.modules?.map((mod, idx) => (
                  <div key={mod.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-teal-700 font-bold text-[10px]">Module {idx + 1}</span>
                      <span className="text-slate-400 font-mono text-[10px]">{mod.chapters?.length || 0} Chapters</span>
                    </div>
                    <h5 className="font-bold text-slate-900">{mod.title}</h5>
                    <p className="text-[11px] text-slate-500">{mod.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

