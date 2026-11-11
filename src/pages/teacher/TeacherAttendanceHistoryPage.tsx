import React, { useState, useEffect } from 'react';
import {
  History,
  Calendar,
  Filter,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { teacherService } from '../../services/teacherService';
import type { AttendanceSession, Batch } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../utils/formatters';

export const TeacherAttendanceHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<AttendanceSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const teacherId = user?.id || 'user-tch-001';
      const [historyRes, batchesRes] = await Promise.all([
        teacherService.getAttendanceHistory(teacherId),
        teacherService.getAssignedBatches(teacherId),
      ]);

      if (historyRes.success) setSessions(historyRes.data);
      if (batchesRes.success) setBatches(batchesRes.data);
      setIsLoading(false);
    };

    loadData();
  }, [user]);

  const filteredSessions = sessions.filter(
    (s) => selectedBatch === 'all' || s.batchId === selectedBatch
  );

  const handleExportCSV = () => {
    window.print();
    showToast({
      type: 'info',
      title: 'Export Generated',
      message: 'Print preview generated for batch attendance audit records.',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Session History</h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical logs of classroom sessions and student attendance matrices (SRS Rule TCH-003, BR-010).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Printer className="h-4 w-4" />}
          >
            Export Attendance Log
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="font-semibold text-slate-700">Filter by Batch:</span>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="all">All Assigned Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-slate-500 font-mono text-[11px]">
            {filteredSessions.length} Recorded Sessions
          </div>
        </div>

        {/* Sessions Table */}
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading attendance history...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            No attendance sessions recorded for the selected batch.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Session Date</th>
                  <th className="py-3 px-3">Curriculum Topic Covered</th>
                  <th className="py-3 px-3">Present</th>
                  <th className="py-3 px-3">Absent</th>
                  <th className="py-3 px-3">Authorized Leave</th>
                  <th className="py-3 px-3">Attendance %</th>
                  <th className="py-3 px-3 text-right">Roster Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.map((s) => {
                  const presentCount = s.records.filter((r) => r.status === 'present').length;
                  const absentCount = s.records.filter((r) => r.status === 'absent').length;
                  const leaveCount = s.records.filter((r) => r.status === 'leave').length;
                  const total = s.records.length || 1;
                  const pct = Math.round((presentCount / total) * 100);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900 font-mono">
                        {formatDate(s.sessionDate)}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 block">{s.topicCovered}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {s.id}</span>
                      </td>

                      <td className="py-3 px-3 font-bold text-emerald-600">
                        {presentCount}
                      </td>

                      <td className="py-3 px-3 font-bold text-rose-600">
                        {absentCount}
                      </td>

                      <td className="py-3 px-3 font-bold text-amber-600">
                        {leaveCount}
                      </td>

                      <td className="py-3 px-3 font-extrabold text-teal-700">
                        {pct}%
                      </td>

                      <td className="py-3 px-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSessionDetail(s)}
                        >
                          View Students ({s.records.length})
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Session Breakdown Modal */}
      {selectedSessionDetail && (
        <Card className="p-6 space-y-4 border-teal-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Session Roster: {formatDate(selectedSessionDetail.sessionDate)}
              </h3>
              <p className="text-xs text-slate-500">{selectedSessionDetail.topicCovered}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedSessionDetail(null)}>
              Close Roster
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {selectedSessionDetail.records.map((r, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-900 block">{r.studentName}</span>
                  {r.note && <span className="text-[10px] text-slate-400 italic block">{r.note}</span>}
                </div>
                <Badge
                  variant={
                    r.status === 'present'
                      ? 'success'
                      : r.status === 'absent'
                      ? 'danger'
                      : 'warning'
                  }
                  size="sm"
                  dot
                >
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

