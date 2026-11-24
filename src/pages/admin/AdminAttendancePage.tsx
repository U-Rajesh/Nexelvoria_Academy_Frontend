import React, { useState, useEffect, useCallback } from 'react';
import { Filter, Edit, ShieldAlert, CalendarPlus, History } from 'lucide-react';
import {
  adminService,
  type AcademicAttendanceChange,
  type AcademicAttendanceRow,
  type AcademicAttendanceStatus,
  type AcademicSession,
  type AttendanceSummary,
} from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { Modal } from '../../components/feedback/Modal';
import { Card } from '../../components/common/Card';
import type { Batch } from '../../types';

type Row = {
  id: string;
  sessionId: string;
  sessionStart: string;
  sessionTitle: string;
  batchLabel: string;
  studentId: string;
  studentName: string;
  status: string; // as stored, lower-case; '' when not yet marked
};

const toRow = (r: AcademicAttendanceRow): Row => ({
  id: `${r.session.id}-${r.studentUserId}`,
  sessionId: r.session.id,
  sessionStart: r.session.startsAt,
  sessionTitle: r.session.sessionTitle,
  batchLabel: r.session.batchCode || r.session.batchId,
  studentId: r.studentUserId,
  studentName: r.studentName || `Student #${r.studentUserId}`,
  status: r.record?.status ?? '',
});

const formatDateTime = (iso: string) => new Date(iso).toLocaleString();

export const AdminAttendancePage: React.FC = () => {
  const { showToast } = useNotification();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Mark / correct modal
  const [editing, setEditing] = useState<Row | null>(null);
  const [newStatus, setNewStatus] = useState<AcademicAttendanceStatus>('present');
  const [auditRemarks, setAuditRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Schedule modal
  const [scheduling, setScheduling] = useState(false);
  const [form, setForm] = useState({ teacherUserId: '', sessionTitle: '', startsAt: '', endsAt: '', meetingUrl: '' });

  // History modal
  const [historyFor, setHistoryFor] = useState<AcademicSession | null>(null);
  const [history, setHistory] = useState<AcademicAttendanceChange[]>([]);

  useEffect(() => {
    adminService.getBatches().then((res) => {
      if (res.success) {
        setBatches(res.data);
        if (res.data.length > 0) setSelectedBatchId((cur) => cur || res.data[0]!.id);
      } else {
        setLoadError(res.error || 'Batches could not be loaded.');
      }
    });
  }, []);

  const loadBatchData = useCallback(async () => {
    if (!selectedBatchId) return;
    const [sRes, rRes, sumRes] = await Promise.all([
      adminService.getClassSessions({ batchId: selectedBatchId }),
      adminService.getAttendanceReportRows(selectedBatchId),
      adminService.getAttendanceSummary(selectedBatchId),
    ]);
    if (!sRes.success || !rRes.success) {
      setLoadError(sRes.error || rRes.error || 'Attendance could not be loaded.');
      return;
    }
    setLoadError(null);
    setSessions(sRes.data);
    setRows(rRes.data.map(toRow));
    setSummary(sumRes.success ? sumRes.data : null);
  }, [selectedBatchId]);

  useEffect(() => {
    loadBatchData();
  }, [loadBatchData]);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  const isCorrection = !!editing?.status;

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (isCorrection && auditRemarks.trim().length < 5) return;

    setIsSubmitting(true);
    const res = await adminService.markSessionAttendance(
      editing.sessionId,
      [{ studentUserId: editing.studentId, status: newStatus }],
      isCorrection ? auditRemarks.trim() : undefined
    );
    setIsSubmitting(false);

    if (res.success && res.data) {
      const { created, corrected } = res.data;
      showToast({
        type: 'success',
        title: corrected ? 'Attendance Corrected' : created ? 'Attendance Recorded' : 'No Change',
        message: corrected
          ? `Changed to ${newStatus.toUpperCase()}; the reason is kept in the attendance change history.`
          : created
          ? `Recorded as ${newStatus.toUpperCase()}.`
          : 'The status was already recorded.',
      });
      setEditing(null);
      setAuditRemarks('');
      loadBatchData();
    } else {
      showToast({ type: 'error', title: 'Attendance not saved', message: res.error || 'Please retry.' });
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) return;
    setIsSubmitting(true);
    const res = await adminService.createClassSession({
      batchId: selectedBatchId,
      teacherUserId: form.teacherUserId,
      sessionTitle: form.sessionTitle.trim(),
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
      ...(form.meetingUrl.trim() ? { meetingUrl: form.meetingUrl.trim() } : {}),
    });
    setIsSubmitting(false);
    if (res.success) {
      showToast({ type: 'success', title: 'Session Scheduled', message: `${form.sessionTitle.trim()} was added to the batch schedule.` });
      setScheduling(false);
      setForm({ teacherUserId: '', sessionTitle: '', startsAt: '', endsAt: '', meetingUrl: '' });
      loadBatchData();
    } else {
      showToast({ type: 'error', title: 'Session not scheduled', message: res.error || 'Please retry.' });
    }
  };

  const openHistory = async (s: AcademicSession) => {
    setHistoryFor(s);
    setHistory([]);
    const res = await adminService.getAttendanceHistory(s.id);
    if (res.success) setHistory(res.data);
    else showToast({ type: 'error', title: 'History unavailable', message: res.error || 'Please retry.' });
  };

  const columns: Column<Row>[] = [
    {
      key: 'sessionStart',
      header: 'Session Date',
      sortable: true,
      render: (r) => <span className="font-mono text-xs font-semibold">{formatDate(r.sessionStart)}</span>,
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
      key: 'sessionTitle',
      header: 'Session',
      render: (r) => <span className="text-xs text-slate-700 font-medium line-clamp-1">{r.sessionTitle}</span>,
    },
    {
      key: 'batchLabel',
      header: 'Batch Cohort',
      render: (r) => <Badge variant="purple" size="sm">{r.batchLabel}</Badge>,
    },
    {
      key: 'status',
      header: 'Attendance Record',
      sortable: true,
      render: (r) =>
        r.status ? (
          <Badge variant={r.status === 'present' ? 'success' : r.status === 'leave' ? 'warning' : 'danger'} size="sm" dot>
            {r.status.toUpperCase()}
          </Badge>
        ) : (
          <Badge variant="neutral" size="sm">NOT MARKED</Badge>
        ),
    },
    {
      key: 'actions',
      header: 'Audit Action',
      render: (r) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={new Date(r.sessionStart) > new Date()}
          onClick={() => {
            setEditing(r);
            setAuditRemarks('');
            setNewStatus(r.status === 'present' ? 'absent' : 'present');
          }}
          className="text-xs text-indigo-600 hover:bg-indigo-50"
          leftIcon={<Edit className="h-3.5 w-3.5" />}
        >
          {r.status ? 'Correct Status' : 'Mark'}
        </Button>
      ),
    },
  ];

  const sessionColumns: Column<AcademicSession>[] = [
    { key: 'startsAt', header: 'Starts', sortable: true, render: (s) => <span className="font-mono text-xs">{formatDateTime(s.startsAt)}</span> },
    { key: 'endsAt', header: 'Ends', render: (s) => <span className="font-mono text-xs">{formatDateTime(s.endsAt)}</span> },
    { key: 'sessionTitle', header: 'Session', render: (s) => <span className="text-xs font-semibold text-slate-800">{s.sessionTitle}</span> },
    { key: 'teacherName', header: 'Teacher', render: (s) => <span className="text-xs">{s.teacherName || `Teacher #${s.teacherUserId}`}</span> },
    {
      key: 'actions',
      header: 'Changes',
      render: (s) => (
        <Button variant="ghost" size="sm" onClick={() => openHistory(s)} className="text-xs text-indigo-600 hover:bg-indigo-50" leftIcon={<History className="h-3.5 w-3.5" />}>
          History
        </Button>
      ),
    },
  ];

  const teacherOptions = (selectedBatch?.assignedTeacherIds ?? []).map((id, i) => ({
    id,
    name: selectedBatch?.assignedTeacherNames?.[i] || `Teacher #${id}`,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Oversight & Auditing (ADM-011)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Schedule batch sessions, record attendance and audit corrections. Every correction keeps the old status, the new status and your reason.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" disabled={!selectedBatchId} onClick={() => setScheduling(true)} leftIcon={<CalendarPlus className="h-4 w-4" />}>
            Schedule Session
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white border border-slate-200 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Batch:</span>
        </div>

        <div>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 text-slate-800"
          >
            {batches.length === 0 && <option value="">No batches</option>}
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.batchCode})
              </option>
            ))}
          </select>
        </div>

        <span className="ml-auto text-xs font-mono text-slate-500">Scheduled Sessions: {sessions.length}</span>
      </Card>

      {loadError && (
        <Card className="p-4 border border-rose-200 bg-rose-50 text-xs text-rose-800">{loadError}</Card>
      )}

      {/* Sessions */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">Class Sessions</h3>
        <DataTable data={sessions} columns={sessionColumns} searchPlaceholder="Search session title or teacher..." pageSize={5} />
      </div>

      {/* ATT-010 / ATT-007: attendance % per student (server-computed, D2) */}
      {summary && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">Attendance % per Student</h3>
          <p className="text-[11px] text-slate-500">
            Present ÷ marked sessions. Leave counts as not attended; unmarked sessions are not counted. Minimum in force:{' '}
            <span className="font-bold text-slate-700">{summary.minimumAttendancePercentage ?? 75}%</span>.
          </p>
          <Card className="overflow-x-auto border border-slate-200 bg-white">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left">Student</th>
                  <th className="px-3 py-2 text-right">Present</th>
                  <th className="px-3 py-2 text-right">Absent</th>
                  <th className="px-3 py-2 text-right">Leave</th>
                  <th className="px-3 py-2 text-right">Marked</th>
                  <th className="px-3 py-2 text-right">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.students.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-3 text-slate-400">No students attend this batch.</td>
                  </tr>
                )}
                {summary.students.map((s) => (
                  <tr key={s.studentUserId}>
                    <td className="px-3 py-2 font-semibold text-slate-800">
                      {s.studentName || s.studentUserId}
                      {s.other > 0 && <span className="ml-2 text-[10px] text-amber-700">{s.other} record(s) with another status</span>}
                    </td>
                    <td className="px-3 py-2 text-right">{s.present}</td>
                    <td className="px-3 py-2 text-right">{s.absent}</td>
                    <td className="px-3 py-2 text-right">{s.leave}</td>
                    <td className="px-3 py-2 text-right">{s.markedSessions ?? s.present + s.absent + s.leave}</td>
                    <td className="px-3 py-2 text-right">
                      {s.attendancePercentageDisplay == null ? (
                        <span className="text-slate-400">Not marked</span>
                      ) : (
                        <Badge variant={s.belowMinimum ? 'danger' : 'success'} size="sm">
                          {s.attendancePercentageDisplay}%{s.belowMinimum ? ' · below minimum' : ''}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Attendance records */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">Attendance Records</h3>
        <DataTable data={rows} columns={columns} searchPlaceholder="Search student name, session or date..." pageSize={10} />
      </div>

      {/* Mark / Correct Modal */}
      {editing && (
        <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={isCorrection ? 'Attendance Record Correction (ADM-011 Audit)' : 'Record Attendance'} size="md">
          <form onSubmit={handleSaveAttendance} className="space-y-4 text-xs text-slate-700">
            {isCorrection && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-amber-600" /> Mandatory Audit Notice
                </p>
                <p className="text-[11px] leading-relaxed">
                  The correction is stored with your user ID, the time, the previous status and your reason in the attendance change history.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-400 block">Candidate Name</span>
                <span className="font-bold text-slate-900">{editing.studentName}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Session Date</span>
                <span className="font-mono text-slate-800">{formatDate(editing.sessionStart)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[11px] text-slate-400 block">Session</span>
                <span className="font-medium text-slate-800">{editing.sessionTitle}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                {isCorrection ? `New Attendance Status (Currently: ${editing.status.toUpperCase()}) *` : 'Attendance Status *'}
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as AcademicAttendanceStatus)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="leave">Leave</option>
              </select>
            </div>

            {isCorrection && (
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Mandatory Correction Reason (min 5 characters) *</label>
                <textarea
                  required
                  minLength={5}
                  maxLength={500}
                  rows={3}
                  placeholder="Explain why the recorded status is being corrected..."
                  value={auditRemarks}
                  onChange={(e) => setAuditRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                {isCorrection ? 'Save Audit Correction' : 'Save Attendance'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Schedule Modal */}
      {scheduling && (
        <Modal isOpen={scheduling} onClose={() => setScheduling(false)} title={`Schedule Session: ${selectedBatch?.batchCode ?? ''}`} size="md">
          <form onSubmit={handleSchedule} className="space-y-4 text-xs text-slate-700">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Teacher (allocated to this batch) *</label>
              <select
                required
                value={form.teacherUserId}
                onChange={(e) => setForm({ ...form, teacherUserId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a teacher</option>
                {teacherOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {teacherOptions.length === 0 && <p className="text-[11px] text-rose-600 mt-1">No teacher is allocated to this batch.</p>}
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Session Title *</label>
              <input
                required
                minLength={3}
                maxLength={200}
                value={form.sessionTitle}
                onChange={(e) => setForm({ ...form, sessionTitle: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Starts *</label>
                <input
                  required
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Ends *</label>
                <input
                  required
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Meeting URL</label>
              <input
                type="url"
                maxLength={1000}
                value={form.meetingUrl}
                onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setScheduling(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} disabled={teacherOptions.length === 0}>
                Schedule
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* History Modal */}
      {historyFor && (
        <Modal isOpen={!!historyFor} onClose={() => setHistoryFor(null)} title={`Attendance Changes: ${historyFor.sessionTitle}`} size="lg">
          <div className="space-y-2 text-xs text-slate-700">
            {history.length === 0 ? (
              <p className="text-slate-400 italic p-4 text-center">No corrections recorded for this session.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {history.map((h) => (
                  <div key={h.id} className="p-3 bg-white space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Student #{h.studentUserId}</span>
                      <span className="font-mono text-slate-500">{formatDateTime(h.changedAt)}</span>
                    </div>
                    <div>
                      {h.oldStatus.toUpperCase()} → {h.newStatus.toUpperCase()} by {h.changedByName || `User #${h.changedByUserId}`}
                    </div>
                    <div className="text-slate-500">Reason: {h.changeReason}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setHistoryFor(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
