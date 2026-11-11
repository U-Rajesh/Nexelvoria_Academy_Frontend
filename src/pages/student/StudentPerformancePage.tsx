import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileCheck2,
  Calendar,
  Clock,
  ArrowUpRight,
  BookOpen,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import type { Course, Enrollment, Batch } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { MetricCard } from '../../components/charts/MetricCard';
import { formatDate } from '../../utils/formatters';

interface TestRecord {
  id: string;
  title: string;
  date: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: 'Passed' | 'Failed';
  passingCutoff: number;
}

interface AssignmentRecord {
  id: string;
  title: string;
  module: string;
  submittedAt: string;
  marksObtained: number;
  maxMarks: number;
  status: 'Graded' | 'Pending';
  feedback: string;
}

export const StudentPerformancePage: React.FC = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<{ enrollment: Enrollment; course: Course; batch?: Batch }[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [attendance, setAttendance] = useState<{ percentage: number; total: number; present: number; absent: number; leave: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      const [enrRes, attRes] = await Promise.all([
        studentService.getStudentEnrollments(user.id),
        studentService.getStudentAttendance(user.id),
      ]);

      if (enrRes.success && enrRes.data.length > 0) {
        setEnrollments(enrRes.data);
        setSelectedCourseId(enrRes.data[0].course.id);
      }
      if (attRes.success) {
        setAttendance(attRes.data);
      }
      setIsLoading(false);
    };

    loadData();
  }, [user]);

  const currentEnrollment = enrollments.find((e) => e.course.id === selectedCourseId) || enrollments[0];

  // Scoped mock test performance data
  const testRecords: TestRecord[] = [
    {
      id: 'test-1',
      title: 'Java Core & Collections Framework Assessment',
      date: '2026-10-15',
      score: 44,
      maxScore: 50,
      percentage: 88,
      status: 'Passed',
      passingCutoff: 60,
    },
    {
      id: 'test-2',
      title: 'Spring Boot, Hibernate & JPA Module Test',
      date: '2026-10-28',
      score: 46,
      maxScore: 50,
      percentage: 92,
      status: 'Passed',
      passingCutoff: 60,
    },
    {
      id: 'test-3',
      title: 'Microservices & Distributed Architecture Midterm',
      date: '2026-11-05',
      score: 41,
      maxScore: 50,
      percentage: 82,
      status: 'Passed',
      passingCutoff: 60,
    },
  ];

  // Scoped mock assignment data
  const assignmentRecords: AssignmentRecord[] = [
    {
      id: 'asg-1',
      title: 'Multithreaded Banking Transaction Engine',
      module: 'Module 1: Advanced Core Java',
      submittedAt: '2026-10-14',
      marksObtained: 95,
      maxMarks: 100,
      status: 'Graded',
      feedback: 'Excellent synchronization logic and comprehensive unit test coverage with Mockito.',
    },
    {
      id: 'asg-2',
      title: 'RESTful E-Commerce Microservice with PostgreSQL',
      module: 'Module 2: Spring Boot & Data JPA',
      submittedAt: '2026-10-25',
      marksObtained: 90,
      maxMarks: 100,
      status: 'Graded',
      feedback: 'Clean repository patterns and entity relationships. Minor recommendation on indexing foreign keys.',
    },
    {
      id: 'asg-3',
      title: 'API Gateway Rate Limiting with Redis & Docker',
      module: 'Module 3: Cloud Microservices',
      submittedAt: '2026-11-04',
      marksObtained: 88,
      maxMarks: 100,
      status: 'Graded',
      feedback: 'Effective Token Bucket algorithm implementation. Good Docker compose orchestration setup.',
    },
  ];

  // Chart trend data
  const testTrendData = [
    { name: 'Test 1 (Core Java)', score: 88, benchmark: 60 },
    { name: 'Test 2 (Spring Boot)', score: 92, benchmark: 60 },
    { name: 'Test 3 (Microservices)', score: 82, benchmark: 60 },
  ];

  const assignmentChartData = [
    { name: 'Asg 1 (Threading)', obtained: 95, max: 100 },
    { name: 'Asg 2 (E-Commerce)', obtained: 90, max: 100 },
    { name: 'Asg 3 (API Gateway)', obtained: 88, max: 100 },
  ];

  const attendanceChartData = [
    { month: 'Sep 2026', attendance: 88, threshold: 75 },
    { month: 'Oct 2026', attendance: 85, threshold: 75 },
    { month: 'Nov 2026', attendance: 84, threshold: 75 },
  ];

  const avgTestScore = Math.round(
    testRecords.reduce((acc, t) => acc + t.percentage, 0) / (testRecords.length || 1)
  );
  const avgAssignmentScore = Math.round(
    assignmentRecords.reduce((acc, a) => acc + a.marksObtained, 0) / (assignmentRecords.length || 1)
  );
  const attendancePct = attendance?.percentage || 84;
  const isAttendanceEligible = attendancePct >= 75;

  return (
    <div className="space-y-8">
      {/* Header & Course Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Performance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track test scores, assignment evaluations, attendance analytics, and certificate eligibility.
          </p>
        </div>

        {enrollments.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Course:</span>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

      {/* High-Level Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Overall Standing"
          value="Distinction"
          subtitle="Top 10% in Cohort"
          icon={<Award className="h-5 w-5" />}
          iconBgColor="bg-amber-50 text-amber-600"
        />
        <MetricCard
          title="Avg. Test Score"
          value={`${avgTestScore}%`}
          subtitle="Cutoff: 60% Passing"
          icon={<FileCheck2 className="h-5 w-5" />}
          iconBgColor="bg-indigo-50 text-indigo-600"
        />
        <MetricCard
          title="Avg. Assignment Mark"
          value={`${avgAssignmentScore}/100`}
          subtitle="3 of 3 Submitted"
          icon={<FileText className="h-5 w-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          title="Attendance Rate"
          value={`${attendancePct}%`}
          subtitle={isAttendanceEligible ? 'Meets 75% rule (BR-011)' : 'Below 75% rule'}
          icon={<TrendingUp className="h-5 w-5" />}
          iconBgColor={isAttendanceEligible ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}
        />
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Performance Trend */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Test Score Trajectory</h3>
              <p className="text-[11px] text-slate-500">Evaluated score % against 60% passing benchmark</p>
            </div>
            <Badge variant="purple" size="sm">Online Tests</Badge>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={testTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Student Score (%)"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#4f46e5' }}
                />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  name="Pass Benchmark (60%)"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Assignment Scores Bar Chart */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Assignment Marks Distribution</h3>
              <p className="text-[11px] text-slate-500">Marks obtained vs total points per assignment</p>
            </div>
            <Badge variant="success" size="sm">Graded Work</Badge>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assignmentChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="obtained" name="Marks Obtained" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="max" name="Max Points (100)" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Online Test Results Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Online Examination Log</h3>
            <p className="text-[11px] text-slate-500">Record of all MCQ & coding tests submitted in this enrolled course</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 font-mono">
            {testRecords.length} Tests Evaluated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Examination Title</th>
                <th className="py-2.5 px-3">Date Taken</th>
                <th className="py-2.5 px-3">Score</th>
                <th className="py-2.5 px-3">Percentage</th>
                <th className="py-2.5 px-3">Passing Cutoff</th>
                <th className="py-2.5 px-3">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {testRecords.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-3 font-semibold text-slate-900">{t.title}</td>
                  <td className="py-3 px-3 text-slate-500">{formatDate(t.date)}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {t.score} / {t.maxScore}
                  </td>
                  <td className="py-3 px-3 font-bold text-indigo-600">{t.percentage}%</td>
                  <td className="py-3 px-3 text-slate-500">{t.passingCutoff}%</td>
                  <td className="py-3 px-3">
                    <Badge variant={t.status === 'Passed' ? 'success' : 'danger'} size="sm" dot>
                      {t.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Assignment Evaluations & Instructor Feedback */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Assignment Evaluations & Mentor Feedback</h3>
            <p className="text-[11px] text-slate-500">Review project scores and actionable suggestions from your trainer</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 font-mono">
            {assignmentRecords.length} Submissions Graded
          </span>
        </div>

        <div className="space-y-4">
          {assignmentRecords.map((asg) => (
            <div
              key={asg.id}
              className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-200 transition-colors space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {asg.module}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">{asg.title}</h4>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Marks Awarded</span>
                    <span className="text-sm font-extrabold text-emerald-600">
                      {asg.marksObtained} / {asg.maxMarks}
                    </span>
                  </div>
                  <Badge variant="success" size="sm" dot>Graded</Badge>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 border border-slate-100">
                <span className="text-[11px] font-semibold text-indigo-700 block mb-0.5">Trainer Feedback:</span>
                <p className="italic">"{asg.feedback}"</p>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>Submitted on {formatDate(asg.submittedAt)}</span>
                <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">
                  View Evaluated Code Artifact →
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

