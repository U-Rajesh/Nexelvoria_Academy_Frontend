import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  Award,
  CheckCircle2,
  FileCheck2,
  BookOpen,
  Mail,
  Search,
  Filter,
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
import { teacherService } from '../../services/teacherService';
import type { Batch, Course } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { MetricCard } from '../../components/charts/MetricCard';

interface StudentPerformanceData {
  id: string;
  name: string;
  studentId: string;
  attendancePct: number;
  testScorePct: number;
  assignmentScorePct: number;
  overallStanding: 'Distinction' | 'Good' | 'Needs Support';
  supportReason?: string;
}

export const TeacherPerformancePage: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Scoped mock student performance data
  const studentRecords: StudentPerformanceData[] = [
    {
      id: 'stu-1',
      name: 'Rohan Sharma',
      studentId: 'NEX-2025-0842',
      attendancePct: 84,
      testScorePct: 88,
      assignmentScorePct: 92,
      overallStanding: 'Distinction',
    },
    {
      id: 'stu-2',
      name: 'Ananya Patel',
      studentId: 'NEX-2025-0911',
      attendancePct: 92,
      testScorePct: 85,
      assignmentScorePct: 90,
      overallStanding: 'Distinction',
    },
    {
      id: 'stu-3',
      name: 'Karthik Varma',
      studentId: 'NEX-2025-1044',
      attendancePct: 68,
      testScorePct: 56,
      assignmentScorePct: 70,
      overallStanding: 'Needs Support',
      supportReason: 'Attendance (68%) below 75% threshold (BR-011); failed midterm test (56%).',
    },
    {
      id: 'stu-4',
      name: 'Sneha Reddy',
      studentId: 'NEX-2025-1102',
      attendancePct: 88,
      testScorePct: 78,
      assignmentScorePct: 84,
      overallStanding: 'Good',
    },
    {
      id: 'stu-5',
      name: 'Aditya Rao',
      studentId: 'NEX-2025-1155',
      attendancePct: 71,
      testScorePct: 62,
      assignmentScorePct: 68,
      overallStanding: 'Needs Support',
      supportReason: 'Attendance at 71% (at risk of certificate ineligibility).',
    },
  ];

  useEffect(() => {
    const loadBatches = async () => {
      const teacherId = user?.id || 'user-tch-001';
      const res = await teacherService.getAssignedBatches(teacherId);
      if (res.success) setBatches(res.data);
    };

    loadBatches();
  }, [user]);

  const supportStudents = studentRecords.filter((s) => s.overallStanding === 'Needs Support');

  const filteredStudents = studentRecords.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cohortScoreDistribution = [
    { range: '90-100%', count: 12 },
    { range: '80-89%', count: 18 },
    { range: '70-79%', count: 6 },
    { range: '60-69%', count: 2 },
    { range: '< 60% (At Risk)', count: 2 },
  ];

  const attendanceTrendData = [
    { week: 'Week 1', attendance: 92, threshold: 75 },
    { week: 'Week 2', attendance: 89, threshold: 75 },
    { week: 'Week 3', attendance: 86, threshold: 75 },
    { week: 'Week 4', attendance: 88, threshold: 75 },
    { week: 'Week 5', attendance: 84, threshold: 75 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Academic Performance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track individual progress, cohort test averages, attendance compliance, and intervention alerts (TCH-010).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="purple" size="md">
            Assigned Cohort Analytics
          </Badge>
        </div>
      </div>

      {/* High-Level Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Cohort Average Score"
          value="82.4%"
          subtitle="All Assigned Batches"
          icon={<Award className="h-5 w-5" />}
          iconBgColor="bg-teal-50 text-teal-600"
        />
        <MetricCard
          title="Avg Attendance Rate"
          value="86.2%"
          subtitle="Meets 75% threshold (BR-011)"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          title="Assignment Submission"
          value="96%"
          subtitle="On-time completion"
          icon={<FileCheck2 className="h-5 w-5" />}
          iconBgColor="bg-indigo-50 text-indigo-600"
        />
        <MetricCard
          title="Support Alerts"
          value={`${supportStudents.length} Students`}
          subtitle="Below 75% or low scores"
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBgColor="bg-rose-50 text-rose-600"
        />
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution Chart */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Score Distribution Across Roster</h3>
              <p className="text-[11px] text-slate-500">Student count grouped by examination percentage</p>
            </div>
            <Badge variant="purple" size="sm">Assessments</Badge>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cohortScoreDistribution} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="count" name="Enrolled Students" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Weekly Attendance Trend Line */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Weekly Attendance Consistency</h3>
              <p className="text-[11px] text-slate-500">Cohort attendance curve vs 75% minimum threshold</p>
            </div>
            <Badge variant="success" size="sm">Attendance</Badge>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  name="Cohort Average (%)"
                  stroke="#0d9488"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#0d9488' }}
                />
                <Line
                  type="monotone"
                  dataKey="threshold"
                  name="75% Mandatory Benchmark"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Critical Section: Students Needing Additional Support */}
      <Card className="p-6 space-y-4 border-rose-200 bg-rose-50/20">
        <div className="flex items-center gap-2 text-rose-900 pb-2 border-b border-rose-100">
          <AlertTriangle className="h-5 w-5 text-rose-600" />
          <div>
            <h3 className="text-sm font-bold">Students Requiring Academic Support (Intervention List)</h3>
            <p className="text-[11px] text-rose-700">
              Students identified below the mandatory 75% attendance rule (BR-011) or failing exam benchmarks.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {supportStudents.map((s) => (
            <div
              key={s.id}
              className="p-4 bg-white rounded-xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">{s.name}</span>
                  <Badge variant="purple" size="sm">{s.studentId}</Badge>
                  <Badge variant="danger" size="sm" dot>At Risk</Badge>
                </div>
                <p className="text-xs text-rose-900 font-medium">
                  {s.supportReason}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono">
                  <span>Attendance: {s.attendancePct}%</span>
                  <span>•</span>
                  <span>Exam Average: {s.testScorePct}%</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link to="/teacher/doubts">
                  <Button variant="outline" size="sm">
                    Open Doubts Thread
                  </Button>
                </Link>
                <Link to="/teacher/mock-interviews">
                  <Button variant="primary" size="sm" className="bg-teal-600 hover:bg-teal-700">
                    Schedule 1:1 Mentorship
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Complete Performance Table */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <span className="text-xs text-slate-500 font-mono">
            Showing {filteredStudents.length} Enrolled Candidates
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Student Candidate</th>
                <th className="py-2.5 px-3">Student ID</th>
                <th className="py-2.5 px-3">Attendance Rate</th>
                <th className="py-2.5 px-3">Test Avg (%)</th>
                <th className="py-2.5 px-3">Assignment Score</th>
                <th className="py-2.5 px-3">Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900">{s.name}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{s.studentId}</td>
                  <td className="py-3 px-3 font-bold">
                    <span className={s.attendancePct >= 75 ? 'text-emerald-600' : 'text-rose-600 font-extrabold'}>
                      {s.attendancePct}% {s.attendancePct < 75 && '⚠️'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-800">{s.testScorePct}%</td>
                  <td className="py-3 px-3 font-mono text-slate-800">{s.assignmentScorePct}/100</td>
                  <td className="py-3 px-3">
                    <Badge
                      variant={
                        s.overallStanding === 'Distinction'
                          ? 'success'
                          : s.overallStanding === 'Good'
                          ? 'purple'
                          : 'danger'
                      }
                      size="sm"
                      dot
                    >
                      {s.overallStanding}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
