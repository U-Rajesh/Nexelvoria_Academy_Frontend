import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  PlayCircle,
  FileText,
  Lock,
  ChevronDown,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import type { Course, Enrollment, Batch } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';

export const StudentSyllabusPage: React.FC = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<{ enrollment: Enrollment; course: Course; batch?: Batch }[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [openModuleId, setOpenModuleId] = useState<string>('mod-1');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEnrollments = async () => {
      if (!user) return;
      const res = await studentService.getStudentEnrollments(user.id);
      if (res.success && res.data.length > 0) {
        setEnrollments(res.data);
        setSelectedCourseId(res.data[0].course.id);
        if (res.data[0].course.modules.length > 0) {
          setOpenModuleId(res.data[0].course.modules[0].id);
        }
      }
      setIsLoading(false);
    };

    loadEnrollments();
  }, [user]);

  const activeEnrollmentData = enrollments.find((e) => e.course.id === selectedCourseId);
  const activeCourse = activeEnrollmentData?.course;
  const activeEnrollment = activeEnrollmentData?.enrollment;
  const completedLessonSet = new Set(activeEnrollment?.completedLessonIds || []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  // STD-003: Restrict to authorized enrollments
  if (enrollments.length === 0 || !activeCourse || !activeEnrollment) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
        <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">No Authorized Enrollments Found</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          You currently have no active course enrollments to view syllabus. Please browse our courses catalog and complete enrollment.
        </p>
        <Link to="/courses">
          <Button variant="primary" size="sm">Browse Courses</Button>
        </Link>
      </div>
    );
  }

  // Calculate statistics
  let totalLessons = 0;
  activeCourse.modules.forEach((m) => m.chapters.forEach((ch) => (totalLessons += ch.lessons.length)));
  const completedLessonsCount = completedLessonSet.size;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Course Syllabus & Curriculum</h1>
          <p className="text-xs text-slate-500 mt-1">
            Detailed breakdown of modules, chapters, and topics with progress tracking (STD-004).
          </p>
        </div>

        {/* Course Switcher (STD-001 Multiple Courses Support) */}
        {enrollments.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Active Course:</span>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                const target = enrollments.find((en) => en.course.id === e.target.value);
                if (target && target.course.modules.length > 0) {
                  setOpenModuleId(target.course.modules[0].id);
                }
              }}
              className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-semibold text-slate-800"
            >
              {enrollments.map(({ course }) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Progress & Overview Card */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white border-0 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {activeCourse.category}
              </span>
              <span className="text-xs text-slate-300">Cohort: {activeEnrollmentData.batch?.name || 'Assigned Cohort'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold">{activeCourse.title}</h2>
            <div className="flex items-center gap-4 text-xs text-slate-300 pt-1">
              <span>{activeCourse.durationWeeks} Weeks</span>
              <span>•</span>
              <span>{activeCourse.totalHours} Practical Hours</span>
              <span>•</span>
              <span>{activeCourse.modules.length} Core Modules</span>
            </div>
          </div>

          <div className="w-full sm:w-56 bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Curriculum Progress</span>
              <span className="font-bold text-emerald-400">{activeEnrollment.progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${activeEnrollment.progressPercentage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              {completedLessonsCount} of {totalLessons} lessons completed
            </p>
          </div>
        </div>
      </Card>

      {/* Modules and Chapters Accordion */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Modules Breakdown</h3>
          <Link to={`/student/courses/${activeCourse.id}/learn`}>
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Open in LMS Player
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {activeCourse.modules.map((mod, modIdx) => {
            const isOpen = openModuleId === mod.id;
            let modTotal = 0;
            let modCompleted = 0;
            mod.chapters.forEach((ch) => {
              ch.lessons.forEach((l) => {
                modTotal++;
                if (completedLessonSet.has(l.id)) modCompleted++;
              });
            });
            const modPercentage = modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0;

            return (
              <div
                key={mod.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs transition-colors"
              >
                <button
                  onClick={() => setOpenModuleId(isOpen ? '' : mod.id)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/80 cursor-pointer"
                >
                  <div className="space-y-1.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        Module 0{modIdx + 1}
                      </span>
                      {modPercentage === 100 ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          Completed ✓
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          {modCompleted} of {modTotal} lessons done ({modPercentage}%)
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{mod.title}</h4>
                    <p className="text-xs text-slate-500">{mod.description}</p>
                  </div>

                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-5">
                    {mod.chapters.map((chap) => (
                      <div key={chap.id} className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-indigo-500" />
                          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            {chap.title}
                          </h5>
                        </div>

                        <div className="space-y-1.5 pl-5 border-l-2 border-indigo-200">
                          {chap.lessons.map((lesson) => {
                            const isDone = completedLessonSet.has(lesson.id);
                            return (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between text-xs py-1.5 text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100"
                              >
                                <div className="flex items-center gap-2.5">
                                  {isDone ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                                  )}
                                  <span className={isDone ? 'line-through text-slate-400' : 'font-medium'}>
                                    {lesson.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {lesson.durationMinutes}m
                                  </span>
                                  <Link to={`/student/courses/${activeCourse.id}/learn`}>
                                    <Button variant="ghost" size="sm" className="text-xs py-0.5 px-2">
                                      Launch →
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

