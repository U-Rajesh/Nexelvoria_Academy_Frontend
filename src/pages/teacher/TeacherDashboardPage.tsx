import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  CheckSquare,
  FileCheck2,
  Calendar,
  Clock,
  Video,
  ArrowRight,
  TrendingUp,
  FileText,
  Award,
  HelpCircle,
  Bell,
  Upload,
  PlusCircle,
  ExternalLink,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teacherService } from '../../services/teacherService';
import type { Batch, Course, AssignmentSubmission, StudentDoubt, AnnouncementItem } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { MetricCard } from '../../components/charts/MetricCard';

export const TeacherDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [assignedBatches, setAssignedBatches] = useState<Batch[]>([]);
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([]);
  const [pendingDoubts, setPendingDoubts] = useState<StudentDoubt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      const teacherId = user?.id || 'user-tch-001';
      const [batchesRes, coursesRes, doubtsRes] = await Promise.all([
        teacherService.getAssignedBatches(teacherId),
        teacherService.getAssignedCourses(teacherId),
        teacherService.getStudentDoubts(teacherId),
      ]);

      if (batchesRes.success) setAssignedBatches(batchesRes.data);
      if (coursesRes.success) setAssignedCourses(coursesRes.data);
      if (doubtsRes.success) setPendingDoubts(doubtsRes.data.filter((d) => d.status === 'open'));
      setIsLoading(false);
    };

    loadDashboardData();
  }, [user]);

  const activeBatch = assignedBatches[0];
  const totalStudents = assignedBatches.reduce((acc, b) => acc + (b.enrolledStudentIds?.length || 40), 0);

  return (
    <div className="space-y-8">
      {/* 1. Welcome Message & Teacher Profile Summary */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-7 shadow-xs border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-teal-300 border border-slate-700 uppercase tracking-wider">
              Faculty & Academic Operations
            </span>
            <Badge variant="success" size="sm" dot>
              Active Instructor (ID: TCH-2025-019)
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Dr. Vikram Rao'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Lead Enterprise Solutions Architect & Faculty. Managing <strong>{assignedCourses.length} assigned courses</strong> and <strong>{assignedBatches.length} active cohorts</strong>.
          </p>
        </div>

        {/* Quick Launch Class */}
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/teacher/attendance">
            <Button
              variant="primary"
              size="md"
              className="bg-teal-600 hover:bg-teal-700 shadow-sm"
              leftIcon={<CheckSquare className="h-4 w-4" />}
            >
              Mark Session Attendance
            </Button>
          </Link>
          {activeBatch?.meetingUrl && (
            <a href={activeBatch.meetingUrl} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="md"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                leftIcon={<Video className="h-4 w-4" />}
                rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
              >
                Join Live Lecture
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* 2. Core Metrics: Courses, Batches, Students, Pending Evaluations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Assigned Courses"
          value={assignedCourses.length || 1}
          subtitle="Admin Allocated (TCH-001)"
          icon={<BookOpen className="h-5 w-5" />}
          iconBgColor="bg-teal-50 text-teal-600"
        />
        <MetricCard
          title="Active Batches"
          value={assignedBatches.length || 1}
          subtitle="Assigned Cohorts (BR-009)"
          icon={<Users className="h-5 w-5" />}
          iconBgColor="bg-indigo-50 text-indigo-600"
        />
        <MetricCard
          title="Total Mentored Students"
          value={`${totalStudents} Students`}
          subtitle="Authorized Roster"
          icon={<Users className="h-5 w-5" />}
          iconBgColor="bg-purple-50 text-purple-600"
        />
        <MetricCard
          title="Pending Evaluations"
          value="2 Pending"
          subtitle="1 Assignment • 1 Test"
          icon={<FileCheck2 className="h-5 w-5" />}
          iconBgColor="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Main Grid: Today's Classes, Pending Evaluations & Doubts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Today's Schedule & Cohort Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's & Upcoming Live Classes (TCH-005) */}
          <Card className="p-6 space-y-4 border-teal-200/80 bg-gradient-to-br from-white to-teal-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="purple" size="sm" dot>Today's Live Lecture</Badge>
                <span className="text-[11px] font-mono font-bold text-teal-800">7:30 AM - 9:30 AM IST</span>
              </div>
              <span className="text-xs font-semibold text-teal-700 font-mono">Google Meet Connected</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Spring Cloud API Gateway & Resilience4j Circuit Breakers
              </h3>
              <p className="text-xs text-slate-600">
                Cohort: <strong>Java Full Stack - Oct 2026 Morning Cohort</strong> (40 Students)
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">Manual Meeting Room URL (BR-015)</span>
                <span className="font-mono text-indigo-700 font-semibold">{activeBatch?.meetingUrl || 'https://meet.google.com/nex-java-batch'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/teacher/live-classes">
                  <Button variant="outline" size="sm">Edit Link</Button>
                </Link>
                <a href={activeBatch?.meetingUrl || 'https://meet.google.com/nex-java-batch'} target="_blank" rel="noopener noreferrer">
                  <Button variant="primary" size="sm" className="bg-teal-600 hover:bg-teal-700" leftIcon={<Video className="h-3.5 w-3.5" />}>
                    Launch Session
                  </Button>
                </a>
              </div>
            </div>
          </Card>

          {/* Pending Tasks & Evaluations Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pending Assignment Evaluations */}
            <Card className="p-5 space-y-3 border-indigo-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  <span>Assignment Submissions</span>
                </div>
                <Badge variant="purple" size="sm">1 Needs Grading</Badge>
              </div>
              <p className="text-xs text-slate-600">
                Rohan Sharma submitted <strong>Multithreaded Banking Engine</strong> (GitHub repo).
              </p>
              <div className="pt-1">
                <Link to="/teacher/assignments/evaluations">
                  <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                    Evaluate Code Submission
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Pending Examination Retake Requests (TCH-011) */}
            <Card className="p-5 space-y-3 border-amber-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Award className="h-4 w-4 text-amber-600" />
                  <span>Exam Retake Requests</span>
                </div>
                <Badge variant="warning" size="sm" dot>1 Pending (BR-012)</Badge>
              </div>
              <p className="text-xs text-slate-600">
                Karthik Varma requested retake for <strong>Java 21 Enterprise Assessment</strong> (Previous score: 28/50).
              </p>
              <div className="pt-1">
                <Link to="/teacher/tests/retakes">
                  <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                    Review Retake Request
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Unanswered Student Doubts (TCH-012) */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Unanswered Student Doubts ({pendingDoubts.length})</h3>
              </div>
              <Link to="/teacher/doubts" className="text-xs font-semibold text-teal-600 hover:underline">
                View All Doubts →
              </Link>
            </div>

            {pendingDoubts.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No pending student questions at this time.</p>
            ) : (
              <div className="space-y-3">
                {pendingDoubts.map((d) => (
                  <div key={d.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{d.studentName}</span>
                        <Badge variant="purple" size="sm">{d.batchName}</Badge>
                      </div>
                      <h4 className="font-semibold text-slate-800">{d.title}</h4>
                      <p className="text-slate-500 line-clamp-1">{d.description}</p>
                    </div>
                    <Link to="/teacher/doubts" className="shrink-0">
                      <Button variant="primary" size="sm" className="bg-teal-600 hover:bg-teal-700">
                        Answer
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1 Col): Notifications & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions Shortcuts */}
          <Card className="p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick Faculty Actions</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link to="/teacher/materials" className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium">
                📦 Upload Notes
              </Link>
              <Link to="/teacher/recordings" className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium">
                🎥 Add Recording
              </Link>
              <Link to="/teacher/assignments" className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium">
                📝 New Assignment
              </Link>
              <Link to="/teacher/tests" className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium">
                ⏱️ Create Test
              </Link>
              <Link to="/teacher/announcements" className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium">
                📢 Broadcast Alert
              </Link>
              <Link to="/teacher/reports" className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium">
                📊 Batch Reports
              </Link>
            </div>
          </Card>

          {/* Recent Notifications Feed */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-teal-600" />
                <h4 className="text-xs font-bold text-slate-900">Recent Notifications</h4>
              </div>
              <Link to="/teacher/notifications" className="text-[11px] font-semibold text-teal-600 hover:underline">
                View All →
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-teal-50/50 border border-teal-100 space-y-0.5">
                <span className="text-[10px] text-teal-700 font-bold uppercase block">Live Class Reminder</span>
                <p className="font-semibold text-slate-800 text-[11px]">Morning lecture starts in 25 mins on Google Meet.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-indigo-600 font-bold uppercase block">New Submission</span>
                <p className="font-semibold text-slate-800 text-[11px]">Rohan Sharma uploaded capstone project code.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-amber-600 font-bold uppercase block">Retake Requested</span>
                <p className="font-semibold text-slate-800 text-[11px]">Candidate Karthik Varma requested re-examination.</p>
              </div>
            </div>
          </Card>

          {/* Cohort Timetable Glance */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-500" />
                <h4 className="text-xs font-bold text-slate-900">Weekly Schedule Glance</h4>
              </div>
              <Link to="/teacher/timetable" className="text-[11px] font-semibold text-teal-600 hover:underline">
                Full Timetable →
              </Link>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-medium">Mon - Fri:</span>
                <span className="font-mono font-bold text-slate-800">7:30 AM - 9:30 AM</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-medium">Saturday:</span>
                <span className="font-mono text-slate-800">10:00 AM Doubt Clearing</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-medium">Sunday:</span>
                <span className="text-slate-400 italic">Faculty Holiday</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
