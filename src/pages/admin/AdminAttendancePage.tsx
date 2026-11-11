import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Clock,
  Edit,
  ShieldAlert,
  Layers,
  BookOpen,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { Modal } from '../../components/feedback/Modal';
import { Card } from '../../components/common/Card';
import type { AttendanceSession, Batch, StudentProfile } from '../../types';

export const AdminAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');

  // Audit Correction Modal State
  const [correctingRecord, setCorrectingRecord] = useState<{
    sessionId: string;
    studentId: string;
    studentName: string;
    topic: string;
    date: string;
    currentStatus: string;
  } | null>(null);
  const [newStatus, setNewStatus] = useState<'present' | 'absent' | 'leave'>('present');
  const [auditRemarks, setAuditRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    const [aRes, bRes, sRes] = await Promise.all([
      adminService.getAttendanceSessions(),
      adminService.getBatches(),
      adminService.getStudents(),
    ]);

    if (aRes.success) setSessions(aRes.data);
    if (bRes.success) setBatches(bRes.data);
    if (sRes.success) setStudents(sRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSessions = sessions.filter((s) => {
    if (selectedBatchId !== 'all' && s.batchId !== selectedBatchId) return false;
    return true;
  });

  // Flattened records for auditing
  const attendanceAuditRows: {
    sessionId: string;
    sessionDate: string;
    topicCovered: string;
    batchId: string;
    studentId: string;
    studentName: string;
    status: string;
  }[] = [];

  filteredSessions.forEach((sess) => {
    sess.records.forEach((rec) => {
      attendanceAuditRows.push({
        sessionId: sess.id,
        sessionDate: sess.sessionDate,
        topicCovered: sess.topicCovered,
        batchId: sess.batchId,
        studentId: rec.studentId,
        studentName: rec.studentName,
        status: rec.status,
      });
    });
  });

  const handleCorrectAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !correctingRecord || !auditRemarks.trim()) return;

    setIsSubmitting(true);
    const res = await adminService.correctAttendanceRecord(
      { id: user.id, name: user.name },
      correctingRecord.sessionId,
      correctingRecord.studentId,
      newStatus,
      auditRemarks
    );
    setIsSubmitting(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Attendance Record Audited',
        message: `Updated to ${newStatus.toUpperCase()} with unalterable audit log. (ADM-011)`,
      });
      setCorrectingRecord(null);
      setAuditRemarks('');
      loadData();
    }
  };

  const columns: Column<typeof attendanceAuditRows[0]>[] = [
    {
      key: 'sessionDate',
      header: 'Session Date',
      sortable: true,
      render: (r) => <span className="font-mono text-xs font-semibold">{formatDate(r.sessionDate)}</span>,
    },
    {
      key: 'studentName',
      header: 'Student Name',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{r.studentName}</span>
          <span className="text-[11px] text-slate-400 font-mono">ID: {r.studentId}</span>
        </div>
      ),
    },
    {
      key: 'topicCovered',
      header: 'Lecture Topic Covered',
      render: (r) => <span className="text-xs text-slate-700 font-medium line-clamp-1">{r.topicCovered}</span>,
    },
    {
      key: 'batchId',
      header: 'Batch Cohort',
      render: (r) => {
        const b = batches.find((x) => x.id === r.batchId);
        return <Badge variant="purple" size="sm">{b?.batchCode || r.batchId}</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Attendance Record',
      sortable: true,
      render: (r) => (
        <Badge
          variant={
            r.status === 'present'
              ? 'success'
              : r.status === 'late'
              ? 'warning'
              : 'danger'
          }
          size="sm"
          dot
        >
          {r.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Audit Action',
      render: (r) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setCorrectingRecord({
              sessionId: r.sessionId,
              studentId: r.studentId,
              studentName: r.studentName,
              topic: r.topicCovered,
              date: r.sessionDate,
              currentStatus: r.status,
            });
            setNewStatus(r.status === 'present' ? 'absent' : 'present');
          }}
          className="text-xs text-indigo-600 hover:bg-indigo-50"
          leftIcon={<Edit className="h-3.5 w-3.5" />}
        >
          Correct Status
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Oversight & Auditing (ADM-011)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor cohort attendance across all training sessions, track candidate adherence to the 75% gate (BR-011), and audit corrections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="info" size="md">
            Threshold: 75% Mandatory for Certificate (BR-011)
          </Badge>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white border border-slate-200 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter By Cohort:</span>
        </div>

        <div>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 text-slate-800"
          >
            <option value="all">All Cohort Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.batchCode})
              </option>
            ))}
          </select>
        </div>

        <span className="ml-auto text-xs font-mono text-slate-500">
          Total Lecture Sessions Conducted: {filteredSessions.length}
        </span>
      </Card>

      {/* Main Table */}
      <DataTable
        data={attendanceAuditRows}
        columns={columns}
        searchPlaceholder="Search student name, lecture topic or date..."
        pageSize={10}
      />

      {/* Attendance Audit Correction Modal */}
      {correctingRecord && (
        <Modal
          isOpen={!!correctingRecord}
          onClose={() => setCorrectingRecord(null)}
          title="Attendance Record Correction (ADM-011 Audit)"
          size="md"
        >
          <form onSubmit={handleCorrectAttendance} className="space-y-4 text-xs text-slate-700">
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-600" /> Mandatory Audit Notice
              </p>
              <p className="text-[11px] leading-relaxed">
                In compliance with institutional governance, every administrative attendance status correction is stamped with your Admin ID and stored in permanent audit logs.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-400 block">Candidate Name</span>
                <span className="font-bold text-slate-900">{correctingRecord.studentName}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Session Date</span>
                <span className="font-mono text-slate-800">{formatDate(correctingRecord.date)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[11px] text-slate-400 block">Topic Covered</span>
                <span className="font-medium text-slate-800">{correctingRecord.topic}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                New Attendance Status (Currently: {correctingRecord.currentStatus.toUpperCase()}) *
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="present">Present (Attended Lecture)</option>
                <option value="absent">Absent</option>
                <option value="leave">Authorized Leave / Medical</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Mandatory Administrative Reason / Remarks *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Explain reason for manual correction (e.g., student attended via backup link, connectivity lag resolved, medical certificate submitted)..."
                value={auditRemarks}
                onChange={(e) => setAuditRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setCorrectingRecord(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save Audit Correction
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
