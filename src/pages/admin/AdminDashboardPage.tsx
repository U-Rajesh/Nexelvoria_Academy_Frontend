import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  DollarSign,
  AlertCircle,
  Briefcase,
  Receipt,
  ShieldAlert,
  Calendar,
  Award,
  HelpCircle,
  GraduationCap,
  Clock,
  Layers,
  Percent,
} from 'lucide-react';
import { adminService, type DashboardStatsData, type PlacementRateResult } from '../../services/adminService';
import { formatINR } from '../../utils/formatters';
import { MetricCard } from '../../components/charts/MetricCard';
import { DashboardAnalyticsPanel } from '../../components/reports/DashboardAnalyticsPanel';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // D15: placement rate for a period the Admin chooses.
  const [rateFrom, setRateFrom] = useState('');
  const [rateTo, setRateTo] = useState('');
  const [rateResult, setRateResult] = useState<PlacementRateResult | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);
  const loadPlacementRate = async () => {
    if (!rateFrom || !rateTo) return;
    const res = await adminService.getPlacementRate(rateFrom, rateTo);
    setRateResult(res.success ? res.data : null);
    setRateError(res.success ? null : res.error || 'The placement rate could not be calculated.');
  };

  const loadStats = React.useCallback(() => {
    adminService.getDashboardStats().then((res) => {
      if (res.success && res.data) {
        setStats(res.data);
        setLoadError(null);
      } else {
        setLoadError(res.error || 'Dashboard statistics could not be loaded.');
      }
    });
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (!stats) {
    return (
      <div className="p-8 text-sm text-slate-600">
        {loadError ? (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
            <p className="font-semibold">Dashboard unavailable</p>
            <p>{loadError}</p>
            <Button variant="outline" size="sm" onClick={loadStats}>
              Retry
            </Button>
          </div>
        ) : (
          'Loading dashboard…'
        )}
      </div>
    );
  }

  /** `null` from the API means "not available", never zero. */
  const show = (v: number | null, fmt: (n: number) => string | number = (n) => n): string | number =>
    v === null ? 'N/A' : fmt(v);

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
          {stats.financialYearLabel && <span className="text-xs text-indigo-600 font-medium">{stats.financialYearLabel}</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Students */}
          <MetricCard
            title="Total Registered Students"
            value={stats.totalStudents}
            subtitle={`${stats.activeStudents} Active (${stats.pendingApprovals} Pending)`}
            icon={<Users className="h-5 w-5" />}
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
            value={show(stats.totalRevenueINR, formatINR)}
            subtitle={`${stats.financialYearLabel ?? 'Financial year'} to date: ${show(stats.revenueFinancialYearINR ?? null, formatINR)}`}
            icon={<DollarSign className="h-5 w-5" />}
            iconBgColor="bg-emerald-50 text-emerald-600"
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
            subtitle="Approved enrollments awaiting payment"
            icon={<Clock className="h-5 w-5" />}
            iconBgColor="bg-rose-50 text-rose-600"
          />

          {/* 8. Certificates Issued */}
          <MetricCard
            title="Certificates Issued"
            value={show(stats.certificatesIssued)}
            subtitle="Complies with BR-011"
            icon={<Award className="h-5 w-5" />}
            iconBgColor="bg-teal-50 text-teal-600"
          />

          {/* 9. Placement Rate */}
          <MetricCard
            title="Placement Success Rate"
            value={show(stats.placementRate, (n) => `${n.toFixed(1)}%`)}
            subtitle={
              stats.placementCohort
                ? stats.placementCohort.completedStudents === 0
                  ? 'No course completions this financial year'
                  : `${stats.placementCohort.placedStudents} of ${stats.placementCohort.completedStudents} students who completed a course (${stats.financialYearLabel ?? 'this FY'})`
                : 'Not available'
            }
            icon={<Percent className="h-5 w-5" />}
            iconBgColor="bg-emerald-50 text-emerald-600"
          />

          {/* 10. Active Placements */}
          <MetricCard
            title="Active Placement Drives"
            value={show(stats.activePlacements)}
            subtitle="Open job postings"
            icon={<Briefcase className="h-5 w-5" />}
            iconBgColor="bg-blue-50 text-blue-600"
          />

          {/* 11. Support Tickets */}
          <MetricCard
            title="Support Tickets"
            value={show(stats.supportTicketsCount)}
            subtitle="Require resolution"
            icon={<HelpCircle className="h-5 w-5" />}
            iconBgColor="bg-amber-50 text-amber-600"
          />

          {/* 12. System Alerts */}
          <MetricCard
            title="Actionable Alerts"
            value={show(stats.systemAlertsCount)}
            subtitle={
              stats.systemAlerts
                ? `${stats.systemAlerts.pendingStudentApprovals} approvals · ${stats.systemAlerts.pendingRefundRequests} refunds · ${stats.systemAlerts.pendingFinancialOverrides} overrides pending`
                : 'Not available'
            }
            icon={<ShieldAlert className="h-5 w-5" />}
            iconBgColor="bg-rose-50 text-rose-600"
          />
        </div>
      </div>

      {/* D15: placement rate for a chosen period (cohort of course completions) */}
      <Card className="p-4 border border-slate-200 bg-white space-y-3 text-xs">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Placement Rate for a Period</h2>
        <p className="text-slate-500">
          Students who completed a course in the period, and how many of them have a placement record. Each student counts once.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-slate-700">From</span>
            <input type="date" value={rateFrom} onChange={(e) => setRateFrom(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-slate-700">To</span>
            <input type="date" value={rateTo} onChange={(e) => setRateTo(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg" />
          </label>
          <Button variant="outline" size="sm" onClick={loadPlacementRate} disabled={!rateFrom || !rateTo}>
            Calculate
          </Button>
        </div>
        {rateError && <p className="text-rose-700">{rateError}</p>}
        {rateResult && (
          <p className="text-slate-800">
            {rateResult.placementRate === null
              ? 'No student completed a course in this period.'
              : `${rateResult.placementRate.toFixed(1)}% — ${rateResult.placedStudents} of ${rateResult.completedStudents} students (${rateResult.from} to ${rateResult.to}, IST).`}
          </p>
        )}
      </Card>

      {/* REP-001: charts from recorded data (GET /admin/reports/analytics) */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Trends and Operational Summaries</h2>
        <DashboardAnalyticsPanel />
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
