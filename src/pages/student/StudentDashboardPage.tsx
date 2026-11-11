import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Video,
  FileText,
  Award,
  AlertTriangle,
  Briefcase,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Bell,
  FileCheck2,
  Download,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import { paymentService } from '../../services/paymentService';
import type { Course, Enrollment, Batch, PaymentTransaction } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { MetricCard } from '../../components/charts/MetricCard';
import { formatINR, formatDate } from '../../utils/formatters';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<{ enrollment: Enrollment; course: Course; batch?: Batch }[]>([]);
  const [attendance, setAttendance] = useState<{ percentage: number; total: number; present: number } | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStudentData = async () => {
      if (!user) return;
      const [enrRes, attRes, payRes] = await Promise.all([
        studentService.getStudentEnrollments(user.id),
        studentService.getStudentAttendance(user.id),
        paymentService.getStudentPaymentHistory(user.id),
      ]);

      if (enrRes.success) setEnrollments(enrRes.data);
      if (attRes.success) setAttendance(attRes.data);
      if (payRes.success) setTransactions(payRes.data);
      setIsLoading(false);
    };

    loadStudentData();
  }, [user]);

  // Check if student application is still pending Admin approval (BR-002)
  const isPendingApproval = (user as any)?.adminApprovalStatus === 'pending';

  // Overall course progress
  const overallProgress =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce((acc, curr) => acc + curr.enrollment.progressPercentage, 0) / enrollments.length
        )
      : 0;

  const totalFeePaid = transactions.reduce((sum, tx) => sum + tx.finalAmountINR, 0);

  return (
    <div className="space-y-8">
      {/* 1. Student Welcome Section */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-7 shadow-xs border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
              Student Workspace
            </span>
            {isPendingApproval ? (
              <Badge variant="warning" size="sm" dot>
                Awaiting Admin Approval (BR-002)
              </Badge>
            ) : (
              <Badge variant="success" size="sm" dot>
                Enrolled & Active (ID: {(user as any)?.studentId || 'NEX-2025-0842'})
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {isPendingApproval
              ? 'Your student registration has been verified via dual OTP (BR-001) and is currently in the Admissions review queue.'
              : 'Continue where you left off in your assigned cohort. Today’s morning live lecture starts at 7:30 AM IST.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {enrollments.length > 0 && (
            <Link to={`/student/courses/${enrollments[0].course.id}/learn`}>
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Resume Learning
              </Button>
            </Link>
          )}
          <Link to="/student/live-classes">
            <Button variant="outline" size="md" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Join Live Class
            </Button>
          </Link>
        </div>
      </div>

      {/* Admin Approval Notice Banner (BR-002) */}
      {isPendingApproval && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong>Registration Status: Pending Admin Approval (SRS Rule BR-002)</strong>
            <p className="mt-0.5">
              Before full course access and payment can be completed, the Nexelvoria Admissions Admin must review your degree and passing year.
              You can test the approval workflow right now by using the bottom-right Persona Switcher to switch to <strong>Admin (Priya Nair)</strong>, navigate to <strong>Student Approvals</strong>, and click <strong>Approve</strong>!
            </p>
          </div>
        </div>
      )}

      {/* Metric Stat Cards (2. Enrolled Courses, 3. Progress, 4. Attendance, 5. Pending Assignments) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Enrolled Courses"
          value={enrollments.length}
          subtitle="Authorized Programs (STD-001)"
          icon={<BookOpen className="h-5 w-5" />}
        />
        <MetricCard
          title="Overall Progress"
          value={`${overallProgress}%`}
          subtitle="Syllabus Completion"
          icon={<TrendingUp className="h-5 w-5" />}
          iconBgColor="bg-sky-50 text-sky-600"
        />
        <MetricCard
          title="Attendance Rate"
          value={attendance ? `${attendance.percentage}%` : '84%'}
          subtitle="75% threshold needed (BR-011)"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconBgColor={
            attendance && attendance.percentage >= 75
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-amber-50 text-amber-600'
          }
        />
        <MetricCard
          title="Pending Tasks"
          value="1 Assignment"
          subtitle="Due in 4 days"
          icon={<FileText className="h-5 w-5" />}
          iconBgColor="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Main Grid: Enrolled Courses & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Enrolled Courses & Pending Assignments & Tests */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Enrolled Courses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Enrolled Programs</h3>
              <Link to="/student/courses" className="text-xs font-semibold text-indigo-600 hover:underline">
                View All Courses ({enrollments.length}) →
              </Link>
            </div>

            <div className="space-y-3">
              {enrollments.map(({ enrollment, course, batch }) => (
                <Card key={enrollment.id} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="h-16 w-24 rounded-xl object-cover shrink-0"
                    />
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {batch?.name || 'Oct 2026 Morning Cohort'}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">{course.title}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{course.durationWeeks} Weeks</span>
                        <span>•</span>
                        <span>Trainer: {(course as any).trainer?.name || 'Dr. Vikram Rao'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto flex flex-col sm:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
                      <span>{enrollment.progressPercentage}%</span>
                      <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${enrollment.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                    <Link to={`/student/courses/${course.id}/learn`} className="w-full sm:w-auto">
                      <Button variant="primary" size="sm" className="w-full">
                        Launch LMS
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* 7. Upcoming Online Tests & 5. Pending Assignments Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Upcoming Online Test Widget */}
            <Card className="p-5 space-y-3 border-amber-200/80 bg-gradient-to-br from-white to-amber-50/30">
              <div className="flex items-center justify-between">
                <Badge variant="warning" size="sm" dot>Upcoming Test</Badge>
                <span className="text-[11px] text-slate-500 font-mono">Window Open</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900">
                  Microservices Architecture Midterm
                </h4>
                <p className="text-[11px] text-slate-500">
                  30 MCQs • 45 Mins • 60% Passing Cutoff
                </p>
              </div>
              <div className="pt-1">
                <Link to="/student/tests">
                  <Button variant="primary" size="sm" className="w-full" leftIcon={<FileCheck2 className="h-3.5 w-3.5" />}>
                    Enter Test Engine
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Pending Assignment Widget */}
            <Card className="p-5 space-y-3 border-indigo-200/80 bg-gradient-to-br from-white to-indigo-50/30">
              <div className="flex items-center justify-between">
                <Badge variant="purple" size="sm">Pending Project</Badge>
                <span className="text-[11px] text-rose-600 font-semibold">Due in 4 Days</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900">
                  API Gateway Rate Limiter with Redis
                </h4>
                <p className="text-[11px] text-slate-500">
                  Submit GitHub Repo URL with Docker Compose
                </p>
              </div>
              <div className="pt-1">
                <Link to="/student/assignments">
                  <Button variant="outline" size="sm" className="w-full" leftIcon={<FileText className="h-3.5 w-3.5" />}>
                    Submit Assignment
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column (1 Col): 6. Live Class, 8. Fee Summary, 9. Notifications, 10. Shortcuts */}
        <div className="space-y-6">
          {/* 6. Today's Live Class */}
          <Card className="p-5 space-y-4 border-indigo-200 bg-gradient-to-br from-white to-indigo-50/50">
            <div className="flex items-center justify-between">
              <Badge variant="purple" size="sm" dot>Live Session Today</Badge>
              <span className="text-[11px] font-mono text-indigo-700 font-bold">7:30 AM IST</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Spring Cloud API Gateway & Resilience4j
              </h4>
              <p className="text-xs text-slate-500">Instructor: Dr. Vikram Rao</p>
            </div>
            <a
              href="https://meet.google.com/nex-java-batch"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="primary" size="sm" className="w-full" leftIcon={<Video className="h-4 w-4" />}>
                Join Google Meet Room
              </Button>
            </a>
          </Card>

          {/* 8. Fee Payment Summary */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900">Fee Status Summary</h4>
              </div>
              <Badge variant="success" size="sm" dot>Paid (Lump Sum)</Badge>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>Total Tuition Paid:</span>
                <span className="font-bold text-slate-900">{formatINR(totalFeePaid || 35000)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Outstanding Dues:</span>
                <span className="font-semibold text-emerald-600">₹0 (Nil Balance)</span>
              </div>
            </div>
            <Link to="/student/payment-history" className="block pt-1">
              <Button variant="outline" size="sm" className="w-full" leftIcon={<Download className="h-3.5 w-3.5" />}>
                Download Tax Receipt
              </Button>
            </Link>
          </Card>

          {/* 9. Recent Notifications Preview */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-900">Recent Alerts</h4>
              </div>
              <Link to="/student/notifications" className="text-[11px] font-semibold text-indigo-600 hover:underline">
                View All →
              </Link>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-indigo-600 font-bold uppercase block">Live Class</span>
                <p className="font-semibold text-slate-800 text-[11px]">Today 7:30 AM: Spring Cloud lecture</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-amber-600 font-bold uppercase block">Examination</span>
                <p className="font-semibold text-slate-800 text-[11px]">Microservices Midterm test window open</p>
              </div>
            </div>
          </Card>

          {/* 10. Quick Action Shortcuts */}
          <Card className="p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick Shortcuts</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link to="/student/syllabus" className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium">
                📑 Syllabus
              </Link>
              <Link to="/student/materials" className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium">
                📦 Materials
              </Link>
              <Link to="/student/recordings" className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium">
                🎥 Recordings
              </Link>
              <Link to="/student/performance" className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium">
                📈 Performance
              </Link>
              <Link to="/student/placements" className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium">
                💼 Placements
              </Link>
              <Link to="/student/certificates" className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium">
                🏆 Certificates
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
