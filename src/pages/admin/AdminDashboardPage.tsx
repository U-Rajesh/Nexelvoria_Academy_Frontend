import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  TrendingUp,
  Receipt,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Award,
  HelpCircle,
  Bell,
  GraduationCap,
  Clock,
  Layers,
  Percent,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { adminService, type DashboardStatsData } from '../../services/adminService';
import { formatINR } from '../../utils/formatters';
import { MetricCard } from '../../components/charts/MetricCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStatsData>({
    totalStudents: 2,
    activeStudents: 1,
    pendingApprovals: 1,
    totalCourses: 4,
    activeBatches: 1,
    totalTeachers: 1,
    totalRevenueINR: 38000,
    pendingFeesINR: 45000,
    certificatesIssued: 1,
    placementRate: 85,
    activePlacements: 2,
    supportTicketsCount: 1,
    systemAlertsCount: 2,
    totalEnrollments: 1,
    placementsCount: 0,
  });

  useEffect(() => {
    adminService.getDashboardStats().then((res) => {
      if (res.success) setStats(res.data);
    });
  }, []);

  const revenueData = [
    { month: 'Jun', revenue: 120000 },
    { month: 'Jul', revenue: 190000 },
    { month: 'Aug', revenue: 260000 },
    { month: 'Sep', revenue: 340000 },
    { month: 'Oct', revenue: 420000 },
    { month: 'Nov', revenue: 510000 },
  ];

  const batchAttendanceData = [
    { batch: 'Java Oct Morning', attendance: 89 },
    { batch: 'MERN Nov Evening', attendance: 92 },
    { batch: 'DevOps Weekend', attendance: 78 },
    { batch: 'GenAI Advanced', attendance: 84 },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-7 rounded-xl shadow-xs border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
              Operations Center
            </span>
            {stats.pendingApprovals > 0 && (
              <Badge variant="warning" size="sm" dot>
                {stats.pendingApprovals} Registration Awaiting Review (BR-002)
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Institute Operational Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Centralized monitoring for student admissions, faculty allocations, batch schedules, payment ledger reconciliation, and corporate placement tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/admin/students/approvals">
            <Button variant="primary" size="md" leftIcon={<Users className="h-4 w-4" />}>
              Review Approvals ({stats.pendingApprovals})
            </Button>
          </Link>
          <Link to="/admin/payments/manual-entry">
            <Button
              variant="outline"
              size="md"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              leftIcon={<Receipt className="h-4 w-4" />}
            >
              Record Payment
            </Button>
          </Link>
          <Link to="/admin/enrollments">
            <Button
              variant="outline"
              size="md"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              leftIcon={<Layers className="h-4 w-4" />}
            >
              Enroll Student
            </Button>
          </Link>
        </div>
      </div>

      {/* ADM-001: 13 Core Institute Key Performance Indicators */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Institutional Key Metrics (ADM-001)
          </h2>
          <span className="text-xs text-indigo-600 font-medium">Session: 2026-27 Active</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Students */}
          <MetricCard
            title="Total Registered Students"
            value={stats.totalStudents}
            subtitle={`${stats.activeStudents} Active (${stats.pendingApprovals} Pending)`}
            icon={<Users className="h-5 w-5" />}
            trend={{ value: 14, isPositive: true }}
          />

          {/* 2. Pending Student Approvals (BR-002) */}
          <MetricCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            subtitle="Enforce Gate (BR-002)"
            icon={<AlertCircle className="h-5 w-5" />}
            iconBgColor="bg-amber-50 text-amber-600"
          />

          {/* 3. Total Payments Collected */}
          <MetricCard
            title="Total Revenue Collected"
            value={formatINR(stats.totalRevenueINR)}
            subtitle="Verified Transactions"
            icon={<DollarSign className="h-5 w-5" />}
            iconBgColor="bg-emerald-50 text-emerald-600"
            trend={{ value: 22, isPositive: true }}
          />

          {/* 4. Active Batches */}
          <MetricCard
            title="Active Batches"
            value={stats.activeBatches}
            subtitle={`Across ${stats.totalCourses} Programs`}
            icon={<Calendar className="h-5 w-5" />}
            iconBgColor="bg-sky-50 text-sky-600"
          />

          {/* 5. Total Courses */}
          <MetricCard
            title="Total Course Catalog"
            value={stats.totalCourses}
            subtitle="Published Programs"
            icon={<BookOpen className="h-5 w-5" />}
            iconBgColor="bg-indigo-50 text-indigo-600"
          />

          {/* 6. Total Teachers */}
          <MetricCard
            title="Faculty Members"
            value={stats.totalTeachers}
            subtitle="Allocated Instructors"
            icon={<GraduationCap className="h-5 w-5" />}
            iconBgColor="bg-purple-50 text-purple-600"
          />

          {/* 7. Pending Fees */}
          <MetricCard
            title="Pending Fees"
            value={formatINR(stats.pendingFeesINR)}
            subtitle="Balance installments"
            icon={<Clock className="h-5 w-5" />}
            iconBgColor="bg-rose-50 text-rose-600"
          />

          {/* 8. Certificates Issued */}
          <MetricCard
            title="Certificates Issued"
            value={stats.certificatesIssued}
            subtitle="Complies with BR-011"
            icon={<Award className="h-5 w-5" />}
            iconBgColor="bg-teal-50 text-teal-600"
          />

          {/* 9. Placement Rate */}
          <MetricCard
            title="Placement Success Rate"
            value={`${stats.placementRate}%`}
            subtitle="Partner hiring rate"
            icon={<Percent className="h-5 w-5" />}
            iconBgColor="bg-emerald-50 text-emerald-600"
          />

          {/* 10. Active Placements */}
          <MetricCard
            title="Active Placement Drives"
            value={stats.activePlacements}
            subtitle="Corporate partners"
            icon={<Briefcase className="h-5 w-5" />}
            iconBgColor="bg-blue-50 text-blue-600"
          />

          {/* 11. Support Tickets */}
          <MetricCard
            title="Support Tickets"
            value={stats.supportTicketsCount}
            subtitle="Require resolution"
            icon={<HelpCircle className="h-5 w-5" />}
            iconBgColor="bg-amber-50 text-amber-600"
          />

          {/* 12. System Alerts */}
          <MetricCard
            title="Actionable Alerts"
            value={stats.systemAlertsCount}
            subtitle="Approvals & queries"
            icon={<ShieldAlert className="h-5 w-5" />}
            iconBgColor="bg-rose-50 text-rose-600"
          />
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Area Chart */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue Collections Trend</h3>
              <p className="text-xs text-slate-500">Gross monthly fee inflows (₹ INR)</p>
            </div>
            <Badge variant="success" size="sm">+28% YoY</Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatINR(Number(val)), 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Batch Attendance Bar Chart */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Cohort Attendance Benchmarks</h3>
              <p className="text-xs text-slate-500">Active batch attendance vs 75% threshold (BR-011)</p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600">Min 75% Gate</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batchAttendanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="batch" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Average Attendance']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="attendance" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Operational Quick Access Hub */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Operational Quick Navigation
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/admin/students/approvals"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-center"
          >
            <span className="text-2xl block mb-1">📋</span>
            <h4 className="text-xs font-bold text-slate-900">Approvals</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Gate BR-002</p>
          </Link>

          <Link
            to="/admin/enrollments"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-center"
          >
            <span className="text-2xl block mb-1">🎓</span>
            <h4 className="text-xs font-bold text-slate-900">Enrollments</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Course & batch</p>
          </Link>

          <Link
            to="/admin/batches"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-center"
          >
            <span className="text-2xl block mb-1">📅</span>
            <h4 className="text-xs font-bold text-slate-900">Batches</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Cohort timings</p>
          </Link>

          <Link
            to="/admin/teachers/allocation"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-center"
          >
            <span className="text-2xl block mb-1">👨‍🏫</span>
            <h4 className="text-xs font-bold text-slate-900">Allocations</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Faculty mapping</p>
          </Link>

          <Link
            to="/admin/tests"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-center"
          >
            <span className="text-2xl block mb-1">📝</span>
            <h4 className="text-xs font-bold text-slate-900">Retakes (BR-012)</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Admin override</p>
          </Link>

          <Link
            to="/admin/reports"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-center"
          >
            <span className="text-2xl block mb-1">📈</span>
            <h4 className="text-xs font-bold text-slate-900">Reports</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Export CSV/PDF</p>
          </Link>
        </div>
      </div>
    </div>
  );
};
