import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { formatINR } from '../../utils/formatters';
import { reportsService, type DashboardAnalytics } from '../../services/reportsService';

const inputCls = 'px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500';
const monthLabel = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleString('en-IN', { month: 'short', year: '2-digit', timeZone: 'UTC' });

const StatusList: React.FC<{ title: string; items: Array<{ status: string; count: number }> }> = ({ title, items }) => (
  <Card className="p-5 space-y-3">
    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
    {items.length === 0 ? (
      <p className="text-xs text-slate-400 italic">No records in this period.</p>
    ) : (
      <ul className="space-y-1.5 text-xs">
        {items.map((i) => (
          <li key={i.status} className="flex justify-between">
            <span className="text-slate-600 capitalize">{(i.status || 'unspecified').replace(/_/g, ' ')}</span>
            <span className="font-bold text-slate-900 tabular-nums">{i.count}</span>
          </li>
        ))}
      </ul>
    )}
  </Card>
);

/**
 * Dashboard charts (REP-001) from GET /admin/reports/analytics. Every series
 * is computed by the server from recorded data; revenue uses the same rule as
 * the KPI cards (successful gateway + verified manual payments). Attendance is
 * shown as counts per status: no attendance-percentage formula is approved.
 */
export const DashboardAnalyticsPanel: React.FC<{ showAccounts?: boolean }> = ({ showAccounts = false }) => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<{ from?: string; to?: string }>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await reportsService.getAnalytics(range);
    setLoading(false);
    if (res.success && res.data) {
      setData(res.data);
      setError(null);
    } else setError(res.error || 'Dashboard analytics could not be loaded.');
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    if (from && to && from > to) return setError('The start date must not be after the end date.');
    setRange({ ...(from ? { from } : {}), ...(to ? { to } : {}) });
  };

  const months = (data?.months ?? []).map((m) => ({ ...m, label: monthLabel(m.month) }));
  const hasActivity = months.some((m) => m.revenueCollected || m.registrations || m.enrollments);
  const statusKeys = [...new Set((data?.attendanceByBatch ?? []).flatMap((b) => Object.keys(b.byStatus)))];
  const roleTotals = (data?.accountsByRole ?? []).reduce<Record<string, Record<string, number>>>((acc, r) => {
    acc[r.role] = { ...(acc[r.role] ?? {}), [r.status]: r.count };
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <form onSubmit={apply} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">From</label>
          <input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">To</label>
          <input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button type="submit" variant="primary" size="sm">
          Apply
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={load} isLoading={loading} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
          Refresh
        </Button>
        {data && <span className="text-[11px] text-slate-500">Period: {data.from} to {data.to} (IST)</span>}
      </form>

      {error && (
        <Card className="p-4 border border-rose-200 bg-rose-50 text-xs text-rose-800 flex items-center justify-between gap-2">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={load}>
            Retry
          </Button>
        </Card>
      )}
      {loading && !data && <p className="text-xs text-slate-400">Loading analytics…</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5 space-y-2">
              <h3 className="text-sm font-bold text-slate-900">Revenue Collected per Month</h3>
              <p className="text-[11px] text-slate-500">Successful gateway payments plus verified manual payments. Refunds are reported separately.</p>
              {hasActivity ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={months}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip formatter={(v) => formatINR(Number(v))} />
                    <Bar dataKey="revenueCollected" name="Revenue" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-400 italic py-8 text-center">No payments, registrations or enrollments in this period.</p>
              )}
            </Card>
            <Card className="p-5 space-y-2">
              <h3 className="text-sm font-bold text-slate-900">Registrations and Enrollments per Month</h3>
              <p className="text-[11px] text-slate-500">Student registrations and enrollments created in each month (IST).</p>
              {hasActivity ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={months}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" fontSize={11} />
                    <YAxis allowDecimals={false} fontSize={11} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="registrations" name="Registrations" stroke="#0ea5e9" />
                    <Line type="monotone" dataKey="enrollments" name="Enrollments" stroke="#10b981" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-400 italic py-8 text-center">No registrations or enrollments in this period.</p>
              )}
            </Card>
          </div>

          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Attendance by Batch</h3>
            <p className="text-[11px] text-slate-500">Marked attendance per status for sessions in this period. No percentage is shown: the attendance formula is not yet approved.</p>
            {data.attendanceByBatch.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No attendance marked in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Batch</th>
                      {statusKeys.map((s) => (
                        <th key={s} className="px-3 py-2 text-right capitalize">
                          {s.replace(/_/g, ' ')}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-right">Marked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.attendanceByBatch.map((b) => (
                      <tr key={b.batchCode}>
                        <td className="px-3 py-2">
                          <span className="font-semibold">{b.batchCode}</span> <span className="text-slate-500">{b.batchName}</span>
                        </td>
                        {statusKeys.map((s) => (
                          <td key={s} className="px-3 py-2 text-right tabular-nums">
                            {b.byStatus[s] ?? 0}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right font-bold tabular-nums">{b.marked}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatusList title="Enrollments by Status" items={data.enrollmentsByStatus} />
            <StatusList title="Assessment Attempts by Status" items={data.assessmentsByStatus} />
            <StatusList title="Placement Applications by Status" items={data.placementApplicationsByStatus} />
          </div>

          {showAccounts && (
            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Accounts by Role</h3>
              <p className="text-[11px] text-slate-500">Current accounts (not limited by the period), by role and account status.</p>
              {Object.keys(roleTotals).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No accounts.</p>
              ) : (
                <ul className="space-y-1.5 text-xs">
                  {Object.entries(roleTotals).map(([role, byStatus]) => (
                    <li key={role} className="flex justify-between gap-2">
                      <span className="font-semibold text-slate-800 capitalize">{role.replace(/_/g, ' ')}</span>
                      <span className="text-slate-600">
                        {Object.entries(byStatus)
                          .map(([s, n]) => `${n} ${s}`)
                          .join(' · ')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
};
