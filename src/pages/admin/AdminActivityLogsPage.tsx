import React, { useState } from 'react';
import { History, Shield, Search } from 'lucide-react';
import { getStorageItem } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/appConfig';
import { formatDateTime } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import type { AuditLog } from '../../types';

export const AdminActivityLogsPage: React.FC = () => {
  const [logs] = useState<AuditLog[]>(
    getStorageItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, [])
  );

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
      header: 'Action Type',
      sortable: true,
      render: (l) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          {l.action}
        </span>
      ),
    },
    {
      key: 'targetEntity',
      header: 'Target Entity',
      render: (l) => <span className="text-xs font-medium text-slate-800">{l.targetEntity}</span>,
    },
    {
      key: 'details',
      header: 'Audit Details',
      render: (l) => <span className="text-xs text-slate-500 line-clamp-1">{l.details}</span>,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Activity Logs</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review administrative activities, approval decisions, manual transactions, and certificate actions (SRS ADM-016).
        </p>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        searchPlaceholder="Search audit action, student or actor..."
        pageSize={10}
      />
    </div>
  );
};

