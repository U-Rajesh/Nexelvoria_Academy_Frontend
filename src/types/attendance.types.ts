export type AttendanceStatus = 'present' | 'absent' | 'leave';

export interface StudentAttendanceEntry {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceSession {
  id: string;
  batchId: string;
  courseId: string;
  sessionDate: string; // YYYY-MM-DD
  topicCovered: string;
  markedByUserId: string;
  markedByRole: 'teacher' | 'admin';
  records: StudentAttendanceEntry[];
  createdAt: string;
  updatedAt?: string;
  lastModifiedByUserId?: string;
  modificationAuditNote?: string;
}

export interface StudentAttendanceSummary {
  studentId: string;
  batchId: string;
  totalSessions: number;
  presentSessions: number;
  absentSessions: number;
  leaveSessions: number;
  attendancePercentage: number;
  isEligibleForCertificate: boolean; // attendancePercentage >= 75
}

