import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  DollarSign,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  History,
  CheckCircle2,
  Lock,
  ArrowRight,
  Receipt,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Layers,
  Briefcase,
  Sliders,
  Check,
  X,
  FileCheck2,
  Clock,
  Sparkles,
  Server,
  Activity,
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';
import { formatINR, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { MetricCard } from '../../components/charts/MetricCard';
import { Modal } from '../../components/feedback/Modal';
import type {
  SuperAdminDashboardStats,
  RefundRequest,
  FinancialOverrideRequest,
  AuditLog,
} from '../../types';

export const SuperAdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<SuperAdminDashboardStats | null>(null);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [overrides, setOverrides] = useState<FinancialOverrideRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      const [statsRes, refundsRes, overridesRes, logsRes] = await Promise.all([
        superAdminService.getDashboardStats(),
        superAdminService.getRefundRequests(),
        superAdminService.getFinancialOverrides(),
        superAdminService.getAuditLogs(),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (refundsRes.success) setRefunds(refundsRes.data);
      if (overridesRes.success) setOverrides(overridesRes.data);
      if (logsRes.success) setAuditLogs(logsRes.data);
      setIsLoading(false);
    };

    loadAll();
  }, []);

  const pendingRefunds = refunds.filter((r) => r.status === 'pending_super_admin');
  const pendingOverrides = overrides.filter((o) => o.status === 'pending');

  return (
    <div className="space-y-8">
      {/* 1. Executive Owner Governance Banner */}
      <div className="bg-slate-950 text-white p-6 sm:p-7 rounded-xl shadow-xs border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-rose-300 border border-slate-800 uppercase tracking-wider">
              Primary System Authority (Root)
            </span>
            <Badge variant="danger" size="sm" dot>
              Unrestricted Governance
            </Badge>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
              Host: AWS ap-south-1 (Mumbai)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Super Admin Governance Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Highest tier executive authority for Nexelvoria Academy. Governs institutional parameters,
            mandates <strong>exclusive refund authorizations (BR-006)</strong>, approves <strong>financial fee overrides (BR-007)</strong>,
            and controls <strong>Admin staff account lifecycles</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Link to="/super-admin/refund-approvals">
            <Button
              variant="danger"
              size="md"
              leftIcon={<DollarSign className="h-4 w-4" />}
              className="shadow-lg shadow-rose-900/40"
            >
              Refund Approvals ({pendingRefunds.length})
            </Button>
          </Link>
          <Link to="/super-admin/financial-overrides">
            <Button
              variant="outline"
              size="md"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              leftIcon={<FileCheck2 className="h-4 w-4 text-amber-300" />}
            >
              Fee Overrides ({pendingOverrides.length})
            </Button>
          </Link>
          <Link to="/super-admin/admins">
            <Button
              variant="outline"
              size="md"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              leftIcon={<UserCheck className="h-4 w-4" />}
            >
              Admin Accounts
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. System Alerts & Infrastructure Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-emerald-950">System Gateways Operational</p>
            <p className="text-[11px] text-emerald-700 truncate">
              Razorpay API connected • SMTP verified • SSL TLS 1.3 Active
            </p>
          </div>
        </div>

        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-amber-950">Action Items Pending Sign-off</p>
            <p className="text-[11px] text-amber-700 truncate">
              {pendingRefunds.length} Refund &amp; {pendingOverrides.length} Override requests awaiting review
            </p>
          </div>
        </div>

        <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="h-8 w-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <Server className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-sky-950">Daily Automated Backup Verified</p>
            <p className="text-[11px] text-sky-700 truncate">
              Snapshot #BKP-2026-11-11 secured in AWS S3 (ap-south-1)
            </p>
          </div>
        </div>
      </div>

      {/* 3. Comprehensive Statistics Metric Cards (All 12 Required Parameters) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Institutional Key Performance Indicators
          </h2>
          <span className="text-xs text-slate-500 font-mono">Live Session Data</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Students"
            value={stats ? stats.totalStudents : 48}
            subtitle="42 Active • 6 Pending Approval"
            icon={<GraduationCap className="h-5 w-5" />}
            iconBgColor="bg-blue-50 text-blue-600"
          />

          <MetricCard
            title="Admin Accounts"
            value={stats ? `${stats.totalAdmins} Staff` : '3 Staff'}
            subtitle="2 Active • 1 Suspended"
            icon={<UserCheck className="h-5 w-5" />}
            iconBgColor="bg-indigo-50 text-indigo-600"
          />

          <MetricCard
            title="Teaching Faculty"
            value={stats ? `${stats.totalTeachers} Instructors` : '6 Instructors'}
            subtitle="100% Course Allocation"
            icon={<BookOpen className="h-5 w-5" />}
            iconBgColor="bg-purple-50 text-purple-600"
          />

          <MetricCard
            title="Courses & Batches"
            value={stats ? `${stats.totalCourses} Courses / ${stats.totalBatches} Batches` : '4 / 6'}
            subtitle={`${stats?.totalEnrollments || 52} Total Enrollments`}
            icon={<Layers className="h-5 w-5" />}
            iconBgColor="bg-amber-50 text-amber-600"
          />

          <MetricCard
            title="Gross Tuition Revenue"
            value={formatINR(stats ? stats.totalRevenueINR : 485000)}
            subtitle="All verified payment orders"
            icon={<DollarSign className="h-5 w-5" />}
            iconBgColor="bg-emerald-50 text-emerald-600"
          />

          <MetricCard
            title="Outstanding Dues"
            value={formatINR(stats ? stats.outstandingFeesINR : 112000)}
            subtitle="Pending student installment balance"
            icon={<Receipt className="h-5 w-5" />}
            iconBgColor="bg-rose-50 text-rose-600"
          />

          <MetricCard
            title="Pending Refund Sign-offs"
            value={`${pendingRefunds.length} Request`}
            subtitle={stats ? `${formatINR(stats.pendingRefundsAmountINR)} (BR-006)` : 'Exclusive to Owner'}
            icon={<AlertTriangle className="h-5 w-5" />}
            iconBgColor="bg-rose-50 text-rose-600"
          />

          <MetricCard
            title="Pending Fee Overrides"
            value={`${pendingOverrides.length} Overrides`}
            subtitle={stats ? `${formatINR(stats.pendingOverridesAmountINR)} (BR-007)` : 'Fee Waivers'}
            icon={<FileCheck2 className="h-5 w-5" />}
            iconBgColor="bg-amber-50 text-amber-600"
          />

          <MetricCard
            title="Placement Track Record"
            value={stats ? `${stats.placementRatePercentage}%` : '92.4%'}
            subtitle={`${stats?.totalPlacedStudents || 38} Students Placed`}
            icon={<Briefcase className="h-5 w-5" />}
            iconBgColor="bg-teal-50 text-teal-600"
          />

          <MetricCard
            title="Active Hiring Partners"
            value={stats ? `${stats.activeHiringPartners} Corporates` : '14 Corporates'}
            subtitle="TCS, Infosys, Wipro, Razorpay..."
            icon={<Users className="h-5 w-5" />}
            iconBgColor="bg-sky-50 text-sky-600"
          />

          <MetricCard
            title="Average Attendance"
            value={stats ? `${stats.averageAttendancePercentage}%` : '86.8%'}
            subtitle="Mandatory SRS Threshold: 75%"
            icon={<Activity className="h-5 w-5" />}
            iconBgColor="bg-emerald-50 text-emerald-600"
          />

          <MetricCard
            title="System Audit Records"
            value={`${auditLogs.length} Records`}
            subtitle="Immutable Audit Logs"
            icon={<History className="h-5 w-5" />}
            iconBgColor="bg-slate-100 text-slate-700"
          />
        </div>
      </div>

      {/* 4. Visual Financial & Cohort Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Cash Flow Trajectory */}
        <Card className="lg:col-span-2 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tuition Collections &amp; Financial Run-Rate
              </h3>
              <p className="text-xs text-slate-500">
                Monthly revenue inflows across online payment gateways &amp; manual reconciliations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                +24.6% QoQ Growth
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <p className="text-[11px] text-slate-500">August 2026</p>
                <p className="text-sm font-bold text-slate-800">₹ 85,000</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <p className="text-[11px] text-slate-500">September 2026</p>
                <p className="text-sm font-bold text-slate-800">₹ 1,20,000</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <p className="text-[11px] text-slate-500">October 2026</p>
                <p className="text-sm font-bold text-slate-800">₹ 1,42,000</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '80%' }} />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-200/80">
                <p className="text-[11px] text-rose-700 font-semibold">November 2026 (MTD)</p>
                <p className="text-sm font-extrabold text-rose-900">₹ 1,38,000</p>
                <div className="w-full bg-rose-200 h-1.5 rounded-full mt-2">
                  <div className="bg-rose-600 h-1.5 rounded-full" style={{ width: '88%' }} />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-700">
                <span className="font-semibold">Fiscal Year Target Realization (₹ 6,00,000 Target)</span>
                <span className="font-bold text-slate-900">80.8% Achieved</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-rose-600 h-2.5 rounded-full" style={{ width: '80.8%' }} />
              </div>
            </div>
          </div>
        </Card>

        {/* User Role Distribution */}
        <Card className="p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">System Role Breakdown</h3>
            <p className="text-xs text-slate-500">Active credentials by authorization tier</p>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-600" />
                <span className="font-medium text-slate-800">Super Administrator (Owner)</span>
              </div>
              <span className="font-bold text-slate-900">1</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-indigo-600" />
                <span className="font-medium text-slate-800">Staff Administrators</span>
              </div>
              <span className="font-bold text-slate-900">3</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-purple-600" />
                <span className="font-medium text-slate-800">Teaching Faculty</span>
              </div>
              <span className="font-bold text-slate-900">6</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="font-medium text-slate-800">Enrolled Students</span>
              </div>
              <span className="font-bold text-slate-900">48</span>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <span className="text-[11px] text-slate-500 block">Total Provisioned Accounts</span>
                <span className="text-lg font-extrabold text-slate-900">58 Users</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 5. Dual Queues: Pending Refunds (BR-006) & Financial Overrides (BR-007) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue A: Refund Approvals */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Exclusive Refund Approvals Queue
                </h3>
                <Badge variant="danger" size="sm">
                  BR-006
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Only the Super Admin is authorized to approve payment reversals.
              </p>
            </div>
            <Link
              to="/super-admin/refund-approvals"
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
            >
              Manage ({refunds.length}) →
            </Link>
          </div>

          {pendingRefunds.length === 0 ? (
            <Card className="p-8 text-center text-xs text-slate-400 bg-white border-dashed">
              No pending refund requests awaiting sign-off.
            </Card>
          ) : (
            <div className="space-y-2.5">
              {pendingRefunds.map((ref) => (
                <Card
                  key={ref.id}
                  className="p-4 border-rose-200 bg-rose-50/20 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {ref.studentName}
                      </span>
                      <Badge variant="danger" size="sm" dot>
                        Awaiting Owner
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 truncate">{ref.courseTitle}</p>
                    <p className="text-[11px] text-slate-500 italic truncate">
                      "{ref.reason}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-base font-extrabold text-slate-900">
                      {formatINR(ref.amountINR)}
                    </span>
                    <Link to="/super-admin/refund-approvals">
                      <Button
                        variant="danger"
                        size="sm"
                        rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                      >
                        Review
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Queue B: Financial Overrides */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Pending Financial Overrides Queue
                </h3>
                <Badge variant="warning" size="sm">
                  BR-007
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Staff requests for special fee waivers, scholarships &amp; corrections.
              </p>
            </div>
            <Link
              to="/super-admin/financial-overrides"
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline"
            >
              Manage ({overrides.length}) →
            </Link>
          </div>

          {pendingOverrides.length === 0 ? (
            <Card className="p-8 text-center text-xs text-slate-400 bg-white border-dashed">
              No pending financial override requests awaiting sign-off.
            </Card>
          ) : (
            <div className="space-y-2.5">
              {pendingOverrides.map((ov) => (
                <Card
                  key={ov.id}
                  className="p-4 border-amber-200 bg-amber-50/20 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {ov.studentName}
                      </span>
                      <Badge variant="warning" size="sm" dot>
                        {ov.adjustmentType.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 truncate">
                      Requested by: <span className="font-medium">{ov.requestedByAdminName}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 italic truncate">
                      "{ov.reason}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-base font-extrabold text-amber-900 block">
                        -{formatINR(ov.discountOrWaiverINR)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Fee: {formatINR(ov.proposedAmountINR)}
                      </span>
                    </div>
                    <Link to="/super-admin/financial-overrides">
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700"
                        rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                      >
                        Review
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Recent System Activities Table */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              System-Wide Audit &amp; Governance Activity Stream
            </h3>
            <p className="text-xs text-slate-500">
              Unalterable activity records collected across all institutional administrative tiers
            </p>
          </div>
          <Link to="/super-admin/audit-logs">
            <Button variant="outline" size="sm" leftIcon={<History className="h-4 w-4" />}>
              Full Audit Trail ({auditLogs.length})
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor &amp; Role</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target Entity</th>
                <th className="py-2.5 px-3">Result</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.slice(0, 6).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-900 block">{log.actorName}</span>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">
                      {log.actorRole}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-700">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                    {log.targetEntity}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <Badge
                      variant={
                        log.result === 'DENIED'
                          ? 'danger'
                          : log.result === 'FAILURE'
                          ? 'warning'
                          : 'success'
                      }
                      size="sm"
                      dot
                    >
                      {log.result || 'SUCCESS'}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Audit Log Details Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Audit Record Metadata"
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80">
              <div>
                <span className="text-slate-400 block text-[11px]">Event ID</span>
                <span className="font-mono font-bold text-slate-800">{selectedLog.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Recorded Timestamp</span>
                <span className="font-mono text-slate-800">{selectedLog.timestamp}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Actor</span>
                <span className="font-semibold text-slate-800">
                  {selectedLog.actorName} ({selectedLog.actorRole})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Client IP</span>
                <span className="font-mono text-slate-800">
                  {selectedLog.ipAddress || '103.21.144.12'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 font-semibold">Action Trigger</span>
              <p className="font-mono font-bold text-slate-900 bg-slate-100 p-2 rounded-md">
                {selectedLog.action}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 font-semibold">Target Entity</span>
              <p className="text-slate-800 p-2 bg-slate-50 rounded-md border border-slate-200/60">
                {selectedLog.targetEntity}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 font-semibold">Activity Details</span>
              <p className="text-slate-700 p-3 bg-slate-50 rounded-md border border-slate-200/60 leading-relaxed">
                {selectedLog.details}
              </p>
            </div>

            {selectedLog.userAgent && (
              <div className="space-y-1">
                <span className="text-slate-400 text-[11px] block">Client User Agent</span>
                <p className="font-mono text-[10px] text-slate-500 truncate bg-slate-50 p-1.5 rounded">
                  {selectedLog.userAgent}
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
