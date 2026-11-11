import { STORAGE_KEYS } from '../constants/appConfig';
import { getStorageItem, setStorageItem } from '../utils/storage';
import {
  SEED_USERS,
  SEED_COURSES,
  SEED_BATCHES,
  SEED_ENROLLMENTS,
  SEED_PAYMENTS,
  SEED_ATTENDANCE_SESSIONS,
  SEED_ASSIGNMENTS,
  SEED_ASSIGNMENT_SUBMISSIONS,
  SEED_TESTS,
  SEED_TEST_ATTEMPTS,
  SEED_CERTIFICATES,
  SEED_COMPANIES,
  SEED_JOBS,
  SEED_APPLICATIONS,
  SEED_MOCK_INTERVIEWS,
  SEED_TICKETS,
  SEED_NOTIFICATIONS,
  SEED_AUDIT_LOGS,
} from './seedData';
import type {
  User,
  StudentProfile,
  TeacherProfile,
  AdminProfile,
  SuperAdminProfile,
  Course,
  Batch,
  Enrollment,
  PaymentTransaction,
  AttendanceSession,
  Assignment,
  AssignmentSubmission,
  OnlineTest,
  TestAttempt,
  CertificateRecord,
  HiringCompany,
  JobOpening,
  JobApplication,
  MockInterviewSchedule,
  SupportTicket,
  InAppNotification,
  AuditLog,
  RefundRequest,
  CouponDiscount,
} from '../types';

/**
 * Initializes localStorage with baseline mock data if keys are absent
 */
export function initializeMockDatabase(): void {
  // Students
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    setStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
      SEED_USERS.student,
      SEED_USERS.studentPending,
    ]);
  }

  // Teachers
  if (!localStorage.getItem(STORAGE_KEYS.TEACHERS)) {
    setStorageItem<TeacherProfile[]>(STORAGE_KEYS.TEACHERS, [SEED_USERS.teacher]);
  }

  // Courses
  if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
    setStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
  }

  // Batches
  if (!localStorage.getItem(STORAGE_KEYS.BATCHES)) {
    setStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);
  }

  // Enrollments
  if (!localStorage.getItem(STORAGE_KEYS.ENROLLMENTS)) {
    setStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
  }

  // Payments
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    setStorageItem<PaymentTransaction[]>(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
  }

  // Attendance
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
    setStorageItem<AttendanceSession[]>(STORAGE_KEYS.ATTENDANCE, SEED_ATTENDANCE_SESSIONS);
  }

  // Assignments
  if (!localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS)) {
    setStorageItem<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, SEED_ASSIGNMENTS);
  }

  // Submissions
  if (!localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) {
    setStorageItem<AssignmentSubmission[]>(STORAGE_KEYS.SUBMISSIONS, SEED_ASSIGNMENT_SUBMISSIONS);
  }

  // Tests
  if (!localStorage.getItem(STORAGE_KEYS.TESTS)) {
    setStorageItem<OnlineTest[]>(STORAGE_KEYS.TESTS, SEED_TESTS);
  }

  // Test Attempts
  if (!localStorage.getItem(STORAGE_KEYS.TEST_ATTEMPTS)) {
    setStorageItem<TestAttempt[]>(STORAGE_KEYS.TEST_ATTEMPTS, SEED_TEST_ATTEMPTS);
  }

  // Certificates
  if (!localStorage.getItem(STORAGE_KEYS.CERTIFICATES)) {
    setStorageItem<CertificateRecord[]>(STORAGE_KEYS.CERTIFICATES, SEED_CERTIFICATES);
  }

  // Jobs
  if (!localStorage.getItem(STORAGE_KEYS.JOBS)) {
    setStorageItem<JobOpening[]>(STORAGE_KEYS.JOBS, SEED_JOBS);
  }

  // Applications
  if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
    setStorageItem<JobApplication[]>(STORAGE_KEYS.APPLICATIONS, SEED_APPLICATIONS);
  }

  // Mock Interviews
  if (!localStorage.getItem(STORAGE_KEYS.MOCK_INTERVIEWS)) {
    setStorageItem<MockInterviewSchedule[]>(STORAGE_KEYS.MOCK_INTERVIEWS, SEED_MOCK_INTERVIEWS);
  }

  // Tickets
  if (!localStorage.getItem(STORAGE_KEYS.TICKETS)) {
    setStorageItem<SupportTicket[]>(STORAGE_KEYS.TICKETS, SEED_TICKETS);
  }

  // Notifications
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    setStorageItem<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
  }

  // Audit Logs
  if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
    setStorageItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
  }

  // Discounts
  if (!localStorage.getItem(STORAGE_KEYS.DISCOUNTS)) {
    setStorageItem<CouponDiscount[]>(STORAGE_KEYS.DISCOUNTS, [
      {
        id: 'disc-01',
        code: 'DIWALI2026',
        description: 'Festive scholarship flat reduction for early applicants',
        discountType: 'fixed_amount',
        value: 7000,
        applicableCourseIds: [],
        isActive: true,
        validUntil: '2026-12-31',
      },
      {
        id: 'disc-02',
        code: 'MERIT25',
        description: 'Merit scholarship for university toppers & 8.5+ CGPA',
        discountType: 'percentage',
        value: 25,
        applicableCourseIds: ['course-fsd-01', 'course-ds-03'],
        isActive: true,
        validUntil: '2027-03-31',
      },
      {
        id: 'disc-03',
        code: 'EARLYBIRD',
        description: 'Early bird registration discount',
        discountType: 'fixed_amount',
        value: 5000,
        applicableCourseIds: [],
        isActive: true,
        validUntil: '2026-11-30',
      },
    ]);
  }

  // Refunds
  if (!localStorage.getItem(STORAGE_KEYS.REFUNDS)) {
    setStorageItem<RefundRequest[]>(STORAGE_KEYS.REFUNDS, [
      {
        id: 'ref-001',
        transactionId: 'pay-001',
        studentId: 'user-stu-001',
        studentName: 'Rohan Sharma',
        courseId: 'course-fsd-01',
        courseTitle: 'Full Stack Java & Cloud Microservices',
        amountINR: 38000,
        reason: 'Relocating abroad for on-campus master degree program',
        status: 'pending_super_admin',
        requestedAt: '2026-11-08T11:00:00Z',
      },
    ]);
  }
}

/**
 * Audit log recording utility
 */
export function recordAuditLog(
  actor: { id: string; name: string; role: string },
  action: string,
  targetEntity: string,
  details: string
): void {
  const currentLogs = getStorageItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  const newLog: AuditLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    targetEntity,
    details,
    ipAddress: '127.0.0.1 (Frontend Demo)',
  };
  setStorageItem(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...currentLogs]);
}

