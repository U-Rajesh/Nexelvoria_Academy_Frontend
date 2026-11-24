import React, { useCallback, useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { formatDateTime } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { DataTable, type Column } from '../../components/tables/DataTable';
import type { AuditLog } from '../../types';

/** Module codes the backend writes to NXA_AuditLogs. */
const MODULES: { code: string; label: string }[] = [
  { code: 'STUDENT_MGMT', label: 'Student approvals & status' },
  { code: 'USER_MGMT', label: 'Account unlocks' },
  { code: 'COURSE_MGMT', label: 'Courses & curriculum' },
  { code: 'BATCH_MGMT', label: 'Batches' },
  { code: 'TEACHER_ALLOC', label: 'Teacher allocations' },
  { code: 'TEACHER_MGMT', label: 'Teacher accounts' },
  { code: 'ENROLLMENT_MGMT', label: 'Enrollments & overrides' },
  { code: 'ADMIN_MGMT', label: 'Admin accounts' },
  { code: 'FINANCE', label: 'Refunds & financial overrides' },
  { code: 'RBAC', label: 'Roles & permissions' },
  { code: 'INSTITUTE_SETTINGS', label: 'Institute settings & maintenance mode' },
  { code: 'SYSTEM_CONFIG', label: 'System configuration' },
  { code: 'WEBSITE_CMS', label: 'Website content' },
  { code: 'REPORTS', label: 'Report exports' },
];

export const AdminActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [moduleCode, setModuleCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const res = await adminService.getActivityLogs({
      moduleCode: moduleCode || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    setIsLoading(false);
    if (res.success) {
      setLogs(res.data);
      setError(null);
    } else {
      setLogs([]);
      setError(res.error || 'Activity logs could not be loaded.');
    }
  }, [moduleCode, startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp (IST)',
      sortable: true,
      render: (l) => <span className="font-mono text-xs">{formatDateTime(l.timestamp)}</span>,
    },
    {
      key: 'actorName',
      header: 'Actor',
      render: (l) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{l.actorName}</span>
          <span className="text-[10px] text-slate-400 font-mono uppercase">{l.actorRole}</span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      render: (l) => (
        <div>
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {l.action}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {MODULES.find((m) => m.code === l.module)?.label ?? l.module}
          </span>
        </div>
      ),
    },
    {
      key: 'targetEntity',
      header: 'Target',
      render: (l) => <span className="text-xs font-medium text-slate-800">{l.targetEntity}</span>,
    },
    {
      key: 'details',
      header: 'Change',
      render: (l) => (
        <span className="text-xs text-slate-600 break-words" title={l.details}>
          {l.details || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Activity Logs</h1>
        <p className="text-xs text-slate-500 mt-1">
          Administrative actions recorded by the server: approvals, account changes, enrollment overrides, course,
          batch and finance decisions (ADM-016). Newest first, up to 200 entries per view.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 text-xs">
        <div>
          <label htmlFor="log-module" className="block font-semibold text-slate-700 mb-1">Area</label>
          <select
            id="log-module"
            value={moduleCode}
            onChange={(e) => setModuleCode(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg bg-white"
          >
            <option value="">All areas</option>
            {MODULES.map((m) => (
              <option key={m.code} value={m.code}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="log-from" className="block font-semibold text-slate-700 mb-1">From (IST)</label>
          <input
            id="log-from"
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="log-to" className="block font-semibold text-slate-700 mb-1">To (IST)</label>
          <input
            id="log-to"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg"
          />
        </div>
        {(moduleCode || startDate || endDate) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setModuleCode('');
              setStartDate('');
              setEndDate('');
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between gap-3">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading activity logs…</p>
      ) : logs.length === 0 && !error ? (
        <p className="text-sm text-slate-500">No activity recorded for these filters.</p>
      ) : (
        <DataTable data={logs} columns={columns} searchPlaceholder="Search action, actor or target..." pageSize={20} />
      )}
    </div>
  );
};
