import React, { useState, useEffect, useCallback } from 'react';
import { Save, CheckCircle2, Calendar } from 'lucide-react';
import { SEED_BATCHES, SEED_USERS } from '../../mocks/seedData';
import { teacherService } from '../../services/teacherService';
import { STORAGE_KEYS } from '../../constants/appConfig';
import { useStorageSync } from '../../hooks/useStorageSync';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import type { AttendanceStatus, Batch, StudentProfile } from '../../types';

const USE_DEV_MOCKS = import.meta.env.VITE_USE_DEV_MOCKS === 'true';

export const TeacherAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [batches, setBatches] = useState<Batch[]>(USE_DEV_MOCKS ? SEED_BATCHES : []);
  const [selectedBatchId, setSelectedBatchId] = useState(USE_DEV_MOCKS ? (SEED_BATCHES[0]?.id || '') : '');
  const [sessionDate, setSessionDate] = useState('2026-11-09');
  const [topicCovered, setTopicCovered] = useState('Kafka Event-Driven Sagas & Distributed Transactions');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Student list for selected batch
  const [studentEntries, setStudentEntries] = useState<{
    studentId: string;
    studentName: string;
    college?: string;
    status: AttendanceStatus;
    note?: string;
  }[]>([]);

  const loadBatches = useCallback(async () => {
    const teacherId = user?.id || 'user-tch-001';
    const res = await teacherService.getAssignedBatches(teacherId);
    if (res.success) {
      setBatches(res.data);
      if (res.data.length > 0) {
        if (!selectedBatchId || !res.data.some((b) => b.id === selectedBatchId)) {
          setSelectedBatchId(res.data[0].id);
        }
      } else {
        setSelectedBatchId('');
      }
    }
  }, [user, selectedBatchId]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  useStorageSync([STORAGE_KEYS.BATCHES, STORAGE_KEYS.TEACHERS], loadBatches);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedBatchId) {
        setStudentEntries([]);
        return;
      }
      const res = await teacherService.getBatchStudents(selectedBatchId);
      if (res.success && res.data.length > 0) {
        setStudentEntries(
          res.data.map((stu: StudentProfile) => ({
            studentId: stu.id,
            studentName: stu.name,
            college: stu.collegeName || 'Engineering College',
            status: 'present' as AttendanceStatus,
            note: '',
          }))
        );
      } else if (USE_DEV_MOCKS) {
        // Fallback baseline students if batch has empty enrollments in demo
        setStudentEntries([
          {
            studentId: SEED_USERS.student.id,
            studentName: SEED_USERS.student.name,
            college: SEED_USERS.student.collegeName,
            status: 'present' as AttendanceStatus,
            note: '',
          },
        ]);
      } else {
        setStudentEntries([]);
      }
    };

    loadStudents();
  }, [selectedBatchId]);

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

    const currentBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];
    setIsSubmitting(true);
    const res = await teacherService.recordAttendance(
      { id: user.id, name: user.name },
      selectedBatchId,
      currentBatch?.courseId || 'course-fsd-01',
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

      {batches.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 text-xs">
          <Calendar className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-600">No Batches Assigned Yet</p>
          <p className="mt-1">Administration has not assigned any active cohorts to your faculty account.</p>
        </Card>
      ) : (
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
                {batches.map((b) => (
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
                {studentEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      No students enrolled in this cohort yet.
                    </td>
                  </tr>
                ) : (
                  studentEntries.map((student) => (
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
                )))}
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
      )}
    </div>
  );
};

