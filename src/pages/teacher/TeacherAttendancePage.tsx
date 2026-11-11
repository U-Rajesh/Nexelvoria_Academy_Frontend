import React, { useState } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import { SEED_BATCHES, SEED_USERS } from '../../mocks/seedData';
import { teacherService } from '../../services/teacherService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import type { AttendanceStatus } from '../../types';

export const TeacherAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [selectedBatchId, setSelectedBatchId] = useState(SEED_BATCHES[0].id);
  const [sessionDate, setSessionDate] = useState('2026-11-09');
  const [topicCovered, setTopicCovered] = useState('Kafka Event-Driven Sagas & Distributed Transactions');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Student list for selected batch
  const [studentEntries, setStudentEntries] = useState([
    {
      studentId: SEED_USERS.student.id,
      studentName: SEED_USERS.student.name,
      college: SEED_USERS.student.collegeName,
      status: 'present' as AttendanceStatus,
      note: '',
    },
    {
      studentId: 'user-stu-003',
      studentName: 'Karthik Varma',
      college: 'Chaitanya Bharathi Institute of Technology',
      status: 'present' as AttendanceStatus,
      note: '',
    },
    {
      studentId: 'user-stu-004',
      studentName: 'Sneha Reddy',
      college: 'VNR Vignana Jyothi Institute',
      status: 'leave' as AttendanceStatus,
      note: 'Authorized medical leave',
    },
  ]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudentEntries((prev) =>
      prev.map((entry) => (entry.studentId === studentId ? { ...entry, status } : entry))
    );
  };

  const handleMarkAllPresent = () => {
    setStudentEntries((prev) => prev.map((entry) => ({ ...entry, status: 'present' as const })));
  };

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    const res = await teacherService.recordAttendance(
      { id: user.id, name: user.name },
      selectedBatchId,
      SEED_BATCHES[0].courseId,
      sessionDate,
      topicCovered,
      studentEntries
    );
    setIsSubmitting(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Attendance Saved',
        message: `Attendance matrix for ${sessionDate} successfully saved with audit record.`,
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Management</h1>
        <p className="text-xs text-slate-500 mt-1">
          Mark attendance per scheduled lecture. Allowed statuses strictly follow <strong>SRS Rule BR-010: Present, Absent, Leave</strong>.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <form onSubmit={handleSubmitAttendance} className="space-y-6">
          {/* Header Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-100 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Batch</label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                {SEED_BATCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.batchCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Session Date</label>
              <input
                type="date"
                required
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Curriculum Topic Covered</label>
              <input
                type="text"
                required
                value={topicCovered}
                onChange={(e) => setTopicCovered(e.target.value)}
                placeholder="e.g. Virtual threads and lock contention"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Quick Bulk Action */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              Enrolled Student Roster ({studentEntries.length} Students)
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMarkAllPresent}
              leftIcon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
            >
              Mark All Present
            </Button>
          </div>

          {/* 3-Way Attendance Matrix Table (Present, Absent, Leave) */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Student Name & College</th>
                  <th className="px-5 py-3.5 text-center">Present (BR-010)</th>
                  <th className="px-5 py-3.5 text-center">Absent (BR-010)</th>
                  <th className="px-5 py-3.5 text-center">Leave (BR-010)</th>
                  <th className="px-5 py-3.5">Remarks / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {studentEntries.map((student) => (
                  <tr key={student.studentId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-900 block">{student.studentName}</span>
                      <span className="text-[11px] text-slate-400">{student.college}</span>
                    </td>

                    {/* Present Radio */}
                    <td className="px-5 py-3.5 text-center">
                      <label className="inline-flex items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-emerald-50">
                        <input
                          type="radio"
                          name={`att_${student.studentId}`}
                          checked={student.status === 'present'}
                          onChange={() => handleStatusChange(student.studentId, 'present')}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </label>
                    </td>

                    {/* Absent Radio */}
                    <td className="px-5 py-3.5 text-center">
                      <label className="inline-flex items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-rose-50">
                        <input
                          type="radio"
                          name={`att_${student.studentId}`}
                          checked={student.status === 'absent'}
                          onChange={() => handleStatusChange(student.studentId, 'absent')}
                          className="h-4 w-4 text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                      </label>
                    </td>

                    {/* Leave Radio */}
                    <td className="px-5 py-3.5 text-center">
                      <label className="inline-flex items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-amber-50">
                        <input
                          type="radio"
                          name={`att_${student.studentId}`}
                          checked={student.status === 'leave'}
                          onChange={() => handleStatusChange(student.studentId, 'leave')}
                          className="h-4 w-4 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                      </label>
                    </td>

                    <td className="px-5 py-3.5">
                      <input
                        type="text"
                        value={student.note}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStudentEntries((prev) =>
                            prev.map((s) => (s.studentId === student.studentId ? { ...s, note: val } : s))
                          );
                        }}
                        placeholder="Optional note..."
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              Attendance modifications are recorded in the system audit logs (SRS ATT-009).
            </span>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="bg-teal-600 hover:bg-teal-700"
              isLoading={isSubmitting}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save Attendance Record
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

