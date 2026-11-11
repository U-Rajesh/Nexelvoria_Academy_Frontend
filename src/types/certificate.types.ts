export interface CertificateRecord {
  id: string;
  certificateNumber: string; // e.g. "NEX-2026-FSD-0042"
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  issueDate: string;
  completionDate: string;
  attendancePercentage: number;
  examScorePercentage: number;
  status: 'valid' | 'revoked';
  qrVerificationUrl: string;
  templateId: 'standard_dark' | 'executive_gold' | 'minimal_blue';
  revokedAt?: string;
  revokedByUserId?: string;
  revocationReason?: string;
  issuedManuallyByAdminId?: string;
}

export interface CertificateEligibilityCheck {
  isCourseCompleted: boolean;
  attendancePercentage: number;
  isAttendanceEligible: boolean; // >= 75%
  isExamPassed: boolean;
  examScorePercentage: number;
  isEligibleOverall: boolean;
  missingRequirements: string[];
}

