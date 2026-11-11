import React, { useState, useEffect } from 'react';
import { CheckSquare, Calendar, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import { BUSINESS_RULES } from '../../constants/businessRules';
import { formatDate } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';
import { DataTable, type Column } from '../../components/tables/DataTable';

interface AttendanceRow {
  date: string;
  topic: string;
  status: string;
  note?: string;
}

export const StudentAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<{
    percentage: number;
    total: number;
    present: number;
    absent: number;
    leave: number;
    sessions: AttendanceRow[];
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    studentService.getStudentAttendance(user.id).then((res) => {
      if (res.success) setData(res.data);
    });
  }, [user]);

  const percentage = data ? data.percentage : 84;
  const isEligible = percentage >= BUSINESS_RULES.MIN_ATTENDANCE_FOR_CERTIFICATE;

  const columns: Column<AttendanceRow>[] = [
    {
      key: 'date',
      header: 'Session Date',
      sortable: true,
      render: (row) => <span className="font-mono text-xs">{formatDate(row.date)}</span>,
    },
    {
      key: 'topic',
      header: 'Curriculum Topic Covered',
      render: (row) => <span className="font-medium text-slate-800">{row.topic}</span>,
    },
    {
      key: 'status',
      header: 'Status (BR-010)',
      sortable: true,
      render: (row) => {
        if (row.status === 'present') return <Badge variant="success" size="sm" dot>Present</Badge>;
        if (row.status === 'leave') return <Badge variant="warning" size="sm" dot>Leave</Badge>;
        return <Badge variant="danger" size="sm" dot>Absent</Badge>;
      },
    },
    {
      key: 'note',
      header: 'Notes / Remarks',
      render: (row) => <span className="text-xs text-slate-500">{row.note || '-'}</span>,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Record</h1>
        <p className="text-xs text-slate-500 mt-1">
          Attendance is recorded daily per scheduled lecture. Maintaining at least 75% attendance is mandatory for Certificate eligibility (SRS Rule BR-011).
        </p>
      </div>

      {/* Threshold Warning or Success Alert */}
      {!isEligible ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900">
            <strong>Attendance Warning:</strong> Your current attendance is{' '}
            <span className="font-bold">{percentage}%</span>, which is below the mandatory{' '}
            <strong>75%</strong> requirement defined in <strong>Business Rule BR-011</strong>. Please attend all upcoming live sessions to maintain certificate eligibility.
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900">
            <strong>Attendance Benchmark Met:</strong> Your current attendance is{' '}
            <span className="font-bold">{percentage}%</span> ($\ge 75\%$). You satisfy the attendance criterion for graduation certificate issuance.
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-5 text-center">
          <p className="text-3xl font-extrabold text-indigo-600">{percentage}%</p>
          <p className="text-xs font-semibold uppercase text-slate-400 mt-1">Overall Percentage</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-3xl font-extrabold text-slate-900">{data?.total || 4}</p>
          <p className="text-xs font-semibold uppercase text-slate-400 mt-1">Total Classes</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-3xl font-extrabold text-emerald-600">{data?.present || 4}</p>
          <p className="text-xs font-semibold uppercase text-slate-400 mt-1">Present Days</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-3xl font-extrabold text-rose-500">{data?.absent || 0}</p>
          <p className="text-xs font-semibold uppercase text-slate-400 mt-1">Absent Days</p>
        </Card>
      </div>

      {/* Attendance History Table */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900">Session Attendance History</h3>
        <DataTable
          data={data?.sessions || []}
          columns={columns}
          searchPlaceholder="Search session topic..."
          pageSize={10}
        />
      </div>
    </div>
  );
};

