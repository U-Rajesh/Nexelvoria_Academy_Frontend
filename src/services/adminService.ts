import { apiClient } from './api';
import { fromBackendAuditLog, type BackendAuditLog } from './auditLogMapper';
import {
  toApiFailure,
  toApiSuccess,
  type BackendFailureBody,
  type BackendSuccessBody,
} from './apiErrors';

/**
 * Whether the localStorage auth mock is active.
 *
 * ===========================================================================
 * SCOPE OF REAL API USE IN THIS FILE.
 *
 * `adminService` has 61 operations and all but THREE remain mock-backed.
 * Only the Student Approval operations were approved for wiring:
 *
 *   - getStudentsForApproval      GET   /students
 *   - approveStudentRegistration  POST  /students/:id/approve
 *   - rejectStudentRegistration   POST  /students/:id/reject
 *
 * Everything else in this file is untouched and still reads and writes
 * localStorage, so the other 24 admin pages behave exactly as before.
 * ===========================================================================
 */
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true';
const USE_DEV_MOCKS = import.meta.env.VITE_USE_DEV_MOCKS === 'true';

import { STORAGE_KEYS } from '../constants/appConfig';
import { getStorageItem, setStorageItem } from '../utils/storage';
import {
  SEED_USERS,
  SEED_COURSES,
  SEED_BATCHES,
  SEED_ENROLLMENTS,
  SEED_PAYMENTS,
  SEED_CERTIFICATES,
  SEED_APPLICATIONS,
  SEED_TICKETS,
  SEED_AUDIT_LOGS,
} from '../mocks/seedData';
import { recordAuditLog } from '../mocks/mockStorage';
import type {
  StudentProfile,
  TeacherProfile,
  Course,
  Batch,
  Enrollment,
  PaymentTransaction,
  CertificateRecord,
  JobApplication,
  SupportTicket,
  TicketCategory,
  TicketStatus,
  AuditLog,
  CouponDiscount,
  ApiResponse,
  CourseStatus,
  BatchStatus,
  CourseModule,
  AdminEnrollmentRow,
} from '../types';

const sleep = (ms: number = 150) => new Promise((resolve) => setTimeout(resolve, ms));

/** Extracts the server's error message from an axios error. */
/** Body of POST /admin/students. Identity rules match self-registration. */
export interface AdminCreateStudentInput {
  name: string;
  email: string;
  mobile: string;
  collegeName?: string;
  degree?: string;
  branch?: string;
  passingYear?: number;
  interestedCourseId?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  city?: string;
  state?: string;
}

/** Outcome of one BR-001 verification channel. */
export type VerificationChannelStatus =
  | { status: 'sent'; sentTo: string; expiresAt: string }
  | { status: 'not_sent'; reason: string }
  | { status: 'unavailable'; reason: string }
  /** Not performed at launch by approved decision (CL-001); not a failure. */
  | { status: 'deferred'; reason: string };

export interface AdminCreatedStudentResult {
  id: string;
  name: string;
  email: string;
  mobile: string;
  accountStatus: 'pending';
  approvalStatus: 'pending';
  isEmailVerified: false;
  isMobileVerified: false;
  accountState: 'pending_verification';
  createdAt: string;
  /** Shown once; never stored by the client. */
  temporaryPassword: string;
  verification: { email: VerificationChannelStatus; mobile: VerificationChannelStatus };
}

/**
 * A certificate exactly as the server stores it. Issuing is blocked until
 * BR-011 eligibility can be decided (Q8 and verified attendance/completion).
 */
export interface AdminCertificate {
  id: string;
  studentUserId: string;
  studentNameAtIssue: string;
  courseId: string;
  courseNameAtIssue: string;
  enrollmentId: string;
  certificateNumber: string;
  attendancePercentage: number;
  passingMarksVerified: boolean;
  courseCompletionVerified: boolean;
  certificateStatus: 'valid' | 'revoked';
  issuedAt: string;
  issuedByUserId: string;
  revokedAt?: string;
  revocationReason?: string;
}

/** Backend notification types (support.validation createNotificationSchema). */
export type AdminNotificationType = 'system' | 'academic' | 'payment' | 'placement' | 'announcement';
/** Backend broadcast audience: role codes (NXA_Roles.RoleCode). */
export type BroadcastAudienceRole = 'student' | 'teacher' | 'admin' | 'super_admin';

/**
 * Maps a backend support ticket (GET /support/admin/tickets, /support/tickets/:id)
 * to the frontend model. The backend returns the student name but not the email,
 * and the ticket text as `description`; replies become the conversation.
 */
const fromBackendTicket = (t: any): SupportTicket => {
  const studentId = String(t?.studentUserId ?? '');
  return {
    id: String(t?.id ?? ''),
    ticketNumber: t?.ticketNumber ?? '',
    studentId,
    studentName: t?.studentName ?? '',
    studentEmail: '',
    category: (t?.categoryName ?? String(t?.categoryId ?? '')) as TicketCategory,
    categoryName: t?.categoryName,
    subject: t?.subject ?? '',
    description: t?.description,
    status: t?.ticketStatus,
    priority: t?.priority,
    createdAt: t?.createdAt,
    updatedAt: t?.closedAt ?? t?.createdAt,
    assignedAdminId: t?.assignedToUserId,
    assignedAdminName: t?.assignedToName,
    messages: (Array.isArray(t?.replies) ? t.replies : []).map((r: any) => ({
      id: String(r.id),
      senderId: String(r.repliedByUserId),
      senderName: r.repliedByName ?? '',
      senderRole: String(r.repliedByUserId) === studentId ? 'student' : 'admin',
      message: r.replyText,
      sentAt: r.repliedAt,
      isInternal: Boolean(r.isInternal),
    })),
  };
};

const apiErrorMessage = (err: any, fallback: string): string => {
  const body = err?.response?.data;
  const details: { field?: string; message?: string }[] = Array.isArray(body?.details) ? body.details : [];
  const detailText = details.map((d) => (d.field ? `${d.field}: ${d.message}` : d.message)).filter(Boolean).join('; ');
  const base = body?.message || err?.message || fallback;
  return detailText ? `${base} (${detailText})` : base;
};

/**
 * Course fields NXA_Courses can store. Everything else on the Course model
 * (category, thumbnail, technologies, ...) has no column yet and is rejected by
 * the server, so it is never sent.
 */
const toStorableCourseBody = (c: Partial<Course>) =>
  Object.fromEntries(
    Object.entries({
      title: c.title,
      shortDescription: c.shortDescription,
      longDescription: c.longDescription,
      durationWeeks: c.durationWeeks,
      feeINR: c.feeINR,
      level: c.level,
    }).filter(([, v]) => v !== undefined)
  );

/**
 * Fetches every page of a paginated admin endpoint ({ items, total }).
 * The backend caps pageSize at 100.
 */
const fetchAllPages = async <T>(url: string, params: Record<string, unknown> = {}): Promise<T[]> => {
  const all: T[] = [];
  for (let page = 1; page <= 200; page += 1) {
    const res = await apiClient.get(url, { params: { ...params, page, pageSize: 100 } });
    const data = res.data?.data;
    const items: T[] = Array.isArray(data) ? data : data?.items ?? [];
    all.push(...items);
    const total = typeof data?.total === 'number' ? data.total : all.length;
    if (items.length === 0 || all.length >= total || Array.isArray(data)) break;
  }
  return all;
};

// ---------------------------------------------------------------------------
// Backend contract adapters (admin API <-> frontend view models)
// ---------------------------------------------------------------------------

/** GET /admin/batches item (backend BatchRecord). */
interface BackendBatch {
  id: string;
  courseId: string;
  courseName?: string;
  batchCode: string;
  batchName: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  scheduleDescription?: string;
  status: string;
  timeZoneId?: string;
  currentEnrollments?: number;
  allocatedTeacherIds?: string[];
  allocatedTeacherNames?: string[];
}

const fromBackendBatch = (b: BackendBatch): Batch => ({
  id: b.id,
  courseId: b.courseId,
  courseName: b.courseName ?? '',
  name: b.batchName,
  batchCode: b.batchCode,
  startDate: b.startDate ?? '',
  endDate: b.endDate ?? '',
  scheduleTiming: b.scheduleDescription ?? '',
  timezone: b.timeZoneId,
  assignedTeacherIds: b.allocatedTeacherIds ?? [],
  assignedTeacherNames: b.allocatedTeacherNames ?? [],
  // The list endpoint returns a count, not the student ids.
  enrolledStudentIds: [],
  enrolledCount: b.currentEnrollments ?? 0,
  status: b.status as BatchStatus,
  ...(b.capacity !== undefined ? { maxCapacity: b.capacity } : {}),
});

/** Maps editable frontend batch fields onto the backend request body. */
const toBackendBatchBody = (b: Partial<Batch>) => {
  const body: Record<string, unknown> = {
    courseId: b.courseId,
    batchCode: b.batchCode,
    batchName: b.name,
    startDate: b.startDate || undefined,
    endDate: b.endDate || undefined,
    capacity: b.maxCapacity,
    scheduleDescription: b.scheduleTiming || undefined,
  };
  return Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined && v !== ''));
};

/** GET /admin/enrollments item (backend EnrollmentAdminRecord). */
interface BackendEnrollment {
  id: string;
  studentUserId: string;
  studentName?: string;
  studentEmail?: string;
  courseId: string;
  courseTitle?: string;
  batchId?: string;
  batchCode?: string;
  enrollmentNumber: string;
  enrollmentStatus: string;
  coursePrice: number;
  discountAmount: number;
  finalAmount: number;
  currencyCode: string;
  enrollmentSource: string;
  activatedAt?: string;
  completedAt?: string;
  createdAt: string;
}

const fromBackendEnrollment = (e: BackendEnrollment): AdminEnrollmentRow => ({
  id: e.id,
  studentId: e.studentUserId,
  courseId: e.courseId,
  ...(e.batchId ? { batchId: e.batchId } : {}),
  enrollmentType: e.enrollmentSource === 'admin' ? 'admin' : 'self',
  status: e.enrollmentStatus as Enrollment['status'],
  enrolledAt: e.createdAt,
  ...(e.completedAt ? { completedAt: e.completedAt } : {}),
  // Lesson progress is not part of the admin enrollment API.
  progressPercentage: 0,
  completedLessonIds: [],
  bookmarkedLessonIds: [],
  studentName: e.studentName,
  studentEmail: e.studentEmail,
  courseTitle: e.courseTitle,
  batchCode: e.batchCode,
  enrollmentNumber: e.enrollmentNumber,
  coursePrice: e.coursePrice,
  discountAmount: e.discountAmount,
  finalAmount: e.finalAmount,
  activatedAt: e.activatedAt,
});

/** Dev-mock mode only: localStorage enrollments carry no fee fields. */
const asMockAdminRow = (e: Enrollment): AdminEnrollmentRow => ({
  ...e,
  enrollmentNumber: e.id,
  coursePrice: 0,
  discountAmount: 0,
  finalAmount: 0,
});

export interface DashboardStatsData {
  totalStudents: number;
  activeStudents: number;
  pendingApprovals: number;
  totalCourses: number;
  activeBatches: number;
  totalTeachers: number;
  /** `null` = not available (source unreadable or no approved formula). */
  totalRevenueINR: number | null;
  /** Collected since 1 April of the current Indian financial year (IST). */
  revenueFinancialYearINR?: number | null;
  /** e.g. "FY 2026-27". */
  financialYearLabel?: string;
  pendingFeesINR: number;
  certificatesIssued: number | null;
  /** D15: cohort placement rate % (unrounded) for `placementRatePeriod`; null = no completed students. */
  placementRate: number | null;
  placementRatePeriod?: { from: string; to: string };
  placementCohort?: { completedStudents: number; placedStudents: number };
  activePlacements: number | null;
  supportTicketsCount: number | null;
  /** D15: total of the open action queues. */
  systemAlertsCount: number | null;
  systemAlerts?: { pendingStudentApprovals: number; pendingRefundRequests: number; pendingFinancialOverrides: number };
  totalEnrollments: number;
  placementsCount: number | null;
}

/** D15: GET /admin/dashboard/placement-rate for an inclusive IST date range. */
export interface PlacementRateResult {
  from: string;
  to: string;
  completedStudents: number;
  placedStudents: number;
  placementRate: number | null;
}

/**
 * Institute settings exactly as GET/PUT /admin/settings store them
 * (NXA_InstituteSettings). Unset values are absent, never defaulted.
 */
export interface InstituteSettings {
  instituteName?: string;
  tagline?: string;
  supportEmail?: string;
  supportPhone?: string;
  whatsappNumber?: string;
  address?: string;
  timezone?: string;
  minAttendancePercentage?: number;
  /** D1 / D9: BR-011 floor 60; stored until test scoring and certificates exist. */
  minExamPercentage?: number;
  /** D9: starting values for newly created lessons. */
  defaultLessonSequentialUnlock?: boolean;
  defaultLessonDownloadAllowed?: boolean;
  /** D7: failed sign-ins before lockout (3-10; 5 when never saved). */
  maxFailedLoginAttempts?: number;
  currencySymbol?: string;
  gstNumber?: string;
  isSmsEnabled?: boolean;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
}

/* ---------- Financial administration (/payments/admin, /admin/finance) ---------- */

/** NXA_ManualPaymentRecords.PaymentMode values the server accepts. */
export type ManualPaymentMode = 'cash' | 'bank_transfer' | 'cheque' | 'pos_card' | 'other';

/** One NXA_FinancialAuditHistory row. */
export interface FinancialHistoryEntry {
  id: string;
  entityType: string;
  entityId: string;
  actionType: string;
  oldValues?: unknown;
  newValues?: unknown;
  reason?: string;
  performedByUserId: string;
  performedByName?: string;
  performedAt: string;
}

/* ---------- Placement administration (/placements), server shapes ---------- */

/** A status change that may have been a no-op. */
export interface Changed<T> {
  record: T;
  changed: boolean;
}

export type PlacementJobStatus = 'open' | 'closed' | 'draft';
export type PlacementApplicationStatus = 'applied' | 'shortlisted' | 'rejected' | 'selected';
export type QuestionDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface PlacementCompanyInput {
  companyName: string;
  websiteUrl?: string;
  industry?: string;
  description?: string;
  address?: string;
  contactName?: string;
  contactEmail?: string;
  contactMobile?: string;
}

export interface PlacementCompany extends PlacementCompanyInput {
  id: string;
  isActive: boolean;
  createdAt: string;
}

export interface PlacementJobInput {
  jobTitle: string;
  employmentType: 'full_time' | 'internship' | 'contract';
  workLocation: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  minExperienceYears: number;
  applicationDeadline?: string | null;
  jobDescription: string;
}

export interface PlacementJob extends PlacementJobInput {
  id: string;
  companyId: string;
  companyName?: string;
  jobStatus: PlacementJobStatus;
  publishedAt?: string;
  createdAt: string;
}

export interface PlacementEligibilityCriterion {
  id: string;
  criterionType: string;
  operator: string;
  criterionValue: string;
}

export interface PlacementApplication {
  id: string;
  jobId: string;
  jobTitle?: string;
  companyId?: string;
  companyName?: string;
  studentUserId: string;
  studentName?: string;
  applicationStatus: PlacementApplicationStatus;
  coverLetter?: string;
  appliedAt: string;
  updatedAt: string;
}

export interface PlacementStatusChange {
  id: string;
  previousStatus?: string;
  newStatus: string;
  changeReason?: string;
  changedByUserId?: string;
  changedByName?: string;
  changedAt: string;
}

export interface PlacementRound {
  id: string;
  jobApplicationId: string;
  roundNumber: number;
  roundName: string;
  scheduledAt?: string;
  meetingUrl?: string;
  feedback?: string;
  /** As stored (table default); round results cannot be set yet. */
  roundStatus?: string;
}

export interface PlacementOffer {
  id: string;
  jobApplicationId: string;
  offerReference: string;
  offeredSalary?: number;
  offerDate?: string;
  joiningDate?: string;
  offerStatus?: string;
  hasLetter: boolean;
  createdAt: string;
}

export interface PlacementRecordRow {
  id: string;
  studentUserId: string;
  studentName?: string;
  companyId: string;
  companyName?: string;
  jobId: string;
  jobTitle?: string;
  jobApplicationId: string;
  offerId?: string;
  packageOffered?: number;
  joiningDate?: string;
  employmentStatus?: string;
  verificationStatus: 'verified' | 'pending';
  verifiedAt?: string;
}

export interface EmployerFeedback {
  id: string;
  companyId: string;
  companyName?: string;
  jobApplicationId?: string;
  studentUserId?: string;
  studentName?: string;
  feedbackText: string;
  submittedAt: string;
}

export interface PlacementAnalyticsData {
  companies: { total: number; active: number };
  jobs: { total: number; byStatus: Record<string, number> };
  applications: { total: number; byStatus: Record<string, number> };
  interviewRounds: number;
  offers: { total: number; averageOfferedSalary: number | null; highestOfferedSalary: number | null };
  placements: { total: number; verified: number; pending: number };
  mockInterviews: { total: number; byStatus: Record<string, number>; averageScore: number | null };
  placementsByCompany: Array<{ companyId: string; companyName?: string; placements: number }>;
}

export interface PlacementPackageRow {
  id: string;
  packageName: string;
  packageType: string;
  description?: string;
  price: number;
  isActive: boolean;
  studentCount: number;
}

export interface AdminMockInterview {
  id: string;
  studentUserId: string;
  studentName?: string;
  teacherUserId: string;
  teacherName?: string;
  scheduledAt: string;
  meetingUrl?: string;
  interviewStatus: 'scheduled' | 'completed' | 'cancelled';
  overallScore?: number;
  feedback?: string;
}

export interface AdminInterviewQuestion {
  id: string;
  category: string;
  questionText: string;
  difficultyLevel?: QuestionDifficulty;
  sampleAnswer?: string;
  isActive?: boolean;
}

/* ---------- Admin academic oversight (/admin/academics), server shapes ---------- */

/** BR-010 statuses accepted when Admin marks attendance. */
export type AcademicAttendanceStatus = 'present' | 'absent' | 'leave';

export interface AcademicSession {
  id: string;
  batchId: string;
  batchCode?: string;
  courseId: string;
  courseName?: string;
  teacherUserId: string;
  teacherName?: string;
  sessionTitle: string;
  startsAt: string;
  endsAt: string;
  meetingUrl?: string;
  /** As stored; its allowed values are not published by the server. */
  sessionStatus?: string;
}

export interface AcademicRosterEntry {
  studentUserId: string;
  studentName?: string;
  /** Absent until attendance is recorded. `status` is as stored (teacher records may hold other values). */
  record?: { id: string; status: string; remarks?: string; markedAt: string; markedByUserId: string };
}

export interface AcademicAttendanceRow extends AcademicRosterEntry {
  session: AcademicSession;
}

export interface AcademicAttendanceChange {
  id: string;
  attendanceRecordId: string;
  studentUserId: string;
  oldStatus: string;
  newStatus: string;
  changeReason: string;
  changedByUserId: string;
  changedByName?: string;
  changedAt: string;
}

export interface AcademicAssignment {
  id: string;
  courseId: string;
  courseName?: string;
  batchId?: string;
  batchCode?: string;
  title: string;
  instructions?: string;
  dueAt?: string;
  maximumMarks: number;
  status?: string;
  createdByTeacherUserId: string;
  teacherName?: string;
  submissionCount: number;
  evaluatedCount: number;
}

export interface AcademicSubmission {
  id: string;
  assignmentId: string;
  studentUserId: string;
  studentName?: string;
  submissionType: string;
  submissionStatus?: string;
  submissionVersion: number;
  submittedAt: string;
  gitHubUrl?: string;
  objectKey?: string;
  textContent?: string;
  latestEvaluation?: {
    id: string;
    marksAwarded: number;
    feedback?: string;
    evaluationVersion: number;
    evaluatedByUserId: string;
    evaluatedAt: string;
  };
}

export interface AcademicTest {
  id: string;
  courseId: string;
  courseName?: string;
  batchId?: string;
  batchCode?: string;
  title: string;
  durationMinutes: number;
  maximumMarks: number;
  passingMarks?: number;
  maxAttempts: number;
  startsAt?: string;
  endsAt?: string;
  status?: string;
  createdByTeacherUserId: string;
  attemptCount: number;
}

export interface AcademicTestAttempt {
  id: string;
  testId: string;
  studentUserId: string;
  studentName?: string;
  attemptNumber: number;
  attemptStatus?: string;
  startedAt: string;
  submittedAt?: string;
  totalMarks?: number;
}

export interface AcademicRetake {
  id: string;
  testId: string;
  studentUserId: string;
  studentName?: string;
  additionalAttempts: number;
  reason?: string;
  authorizedByUserId: string;
  authorizedAt: string;
}

/** Calls an /admin/academics endpoint; failures carry the server's message, never fake data. */
const academicsCall = async <T,>(
  request: () => Promise<{ data?: { data?: T } }>,
  empty: T,
  fallbackMessage: string
): Promise<ApiResponse<T>> => {
  try {
    const res = await request();
    return { success: true, data: (res.data?.data ?? empty) as T };
  } catch (err: any) {
    return { success: false, data: empty, error: apiErrorMessage(err, fallbackMessage) };
  }
};

export const adminService = {
  /**
   * 1. Dashboard Overview Statistics (ADM-001)
   */
  async getPlacementRate(from: string, to: string): Promise<ApiResponse<PlacementRateResult | null>> {
    return academicsCall(() => apiClient.get('/admin/dashboard/placement-rate', { params: { from, to } }), null, 'The placement rate could not be calculated.');
  },

  async getDashboardStats(): Promise<ApiResponse<DashboardStatsData>> {
    if (USE_DEV_MOCKS) {
      await sleep();
      const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
        SEED_USERS.student,
        SEED_USERS.studentPending,
      ]);
      const teachers = getStorageItem<TeacherProfile[]>(STORAGE_KEYS.TEACHERS, [SEED_USERS.teacher]);
      const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
      const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);
      const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
      const payments = getStorageItem<PaymentTransaction[]>(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
      const certificates = getStorageItem<CertificateRecord[]>(STORAGE_KEYS.CERTIFICATES, SEED_CERTIFICATES);
      const applications = getStorageItem<JobApplication[]>(STORAGE_KEYS.APPLICATIONS, SEED_APPLICATIONS);
      const tickets = getStorageItem<SupportTicket[]>(STORAGE_KEYS.TICKETS, SEED_TICKETS);

      const totalStudents = students.length;
      const activeStudents = students.filter((s) => s.status === 'active').length;
      const pendingApprovals = students.filter((s) => s.adminApprovalStatus === 'pending').length;
      const totalCourses = courses.length;
      const activeBatches = batches.filter((b) => b.status === 'ongoing').length;
      const totalTeachers = teachers.length;

      const totalRevenueINR = payments
        .filter((p) => p.status === 'successful')
        .reduce((sum, p) => sum + p.finalAmountINR, 0);

      // Approximate pending fees for enrolled students without full payment
      const pendingFeesINR = 45000;

      const certificatesIssued = certificates.filter((c) => c.status === 'valid').length;
      const placementsCount = applications.filter((a) => a.status === 'offered').length;
      const placementRate = totalStudents > 0 ? Math.round((placementsCount / Math.max(1, activeStudents)) * 100) : 85;
      const activePlacements = applications.filter((a) => a.status !== 'rejected').length;
      const supportTicketsCount = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
      const systemAlertsCount = pendingApprovals + (supportTicketsCount > 0 ? 1 : 0);

      return {
        success: true,
        data: {
          totalStudents,
          activeStudents,
          pendingApprovals,
          totalCourses,
          activeBatches,
          totalTeachers,
          totalRevenueINR,
          pendingFeesINR,
          certificatesIssued,
          placementRate,
          activePlacements,
          supportTicketsCount,
          systemAlertsCount,
          totalEnrollments: enrollments.length,
          placementsCount,
        },
      };
    }

    try {
      const res = await apiClient.get('/admin/stats');
      return { success: true, data: res.data?.data };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to fetch dashboard statistics.';
      return {
        success: false,
        data: {
          totalStudents: 0,
          activeStudents: 0,
          pendingApprovals: 0,
          totalCourses: 0,
          activeBatches: 0,
          totalTeachers: 0,
          totalRevenueINR: 0,
          pendingFeesINR: 0,
          certificatesIssued: 0,
          placementRate: 0,
          activePlacements: 0,
          supportTicketsCount: 0,
          systemAlertsCount: 0,
          totalEnrollments: 0,
          placementsCount: 0,
        },
        error: message,
      };
    }
  },

  /**
   * 2. Student Management & Approvals (ADM-002, ADM-003, ADM-004)
   */
  async getStudents(filter: { approvalStatus?: string; search?: string } = {}): Promise<ApiResponse<StudentProfile[]>> {
    if (USE_DEV_MOCKS) {
      await sleep();
      const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
        SEED_USERS.student,
        SEED_USERS.studentPending,
      ]);
      return { success: true, data: students };
    }

    try {
      // GET /students (admin): paginated, server-side search/filter.
      const students = await fetchAllPages<StudentProfile>('/students', filter);
      return { success: true, data: students };
    } catch (err: any) {
      return { success: false, data: [], error: apiErrorMessage(err, 'Failed to fetch students.') };
    }
  },

  /**
   * The student list backing the APPROVAL QUEUE. Live in real mode.
   *
   *   GET /api/v1/students?approvalStatus=pending
   *
   * Separate from `getStudents` on purpose: that method is shared by other
   * admin pages which remain mock-backed, and Decision B scoped this change
   * to the approval operations alone.
   *
   * The backend returns `PaginatedResult`, so the items are unwrapped here
   * to keep the page's existing array-shaped contract.
   */
  async getStudentsForApproval(
    approvalStatus?: 'pending' | 'approved' | 'rejected'
  ): Promise<ApiResponse<StudentProfile[]>> {
    if (!USE_MOCK_AUTH) {
      const fallback = 'The student list could not be loaded. Please try again.';

      try {
        const response = await apiClient.get<
          | BackendSuccessBody<{ items: StudentProfile[]; total: number }>
          | BackendFailureBody
        >('/students', {
          params: {
            pageSize: 100,
            ...(approvalStatus === undefined ? {} : { approvalStatus }),
          },
        });

        const page = toApiSuccess<{ items: StudentProfile[]; total: number }>(
          response.data,
          fallback
        );

        return page.success && page.data
          ? { success: true, data: page.data.items }
          : { success: false, data: [], error: page.error ?? fallback };
      } catch (err) {
        const failed = toApiFailure<StudentProfile[]>(err, fallback);

        return { ...failed, data: [] };
      }
    }

    return adminService.getStudents();
  },

  /**
   * How many registrations are awaiting a decision.
   *
   * ===========================================================================
   * SAME SOURCE AS THE APPROVAL PAGE, deliberately.
   *
   * The admin sidebar badge used to come from `getDashboardStats()`, which
   * counts localStorage seed data. Once the approval page started reading the
   * real backend the two disagreed: the sidebar said "1 Pending" from the
   * mock while the page showed 0 from the API. A badge that contradicts the
   * screen it links to is worse than no badge.
   *
   * Asks for `pageSize=1` and reads `total`: the count is all that is needed,
   * so there is no reason to transfer a hundred records for it.
   * ===========================================================================
   */
  async getPendingApprovalCount(): Promise<ApiResponse<number>> {
    if (!USE_MOCK_AUTH) {
      const fallback = 'The pending approval count could not be loaded.';

      try {
        const response = await apiClient.get<
          BackendSuccessBody<{ total: number }> | BackendFailureBody
        >('/students', { params: { approvalStatus: 'pending', pageSize: 1 } });

        const page = toApiSuccess<{ total: number }>(response.data, fallback);

        return page.success && page.data
          ? { success: true, data: page.data.total }
          : { success: false, data: 0, error: page.error ?? fallback };
      } catch (err) {
        return { ...toApiFailure<number>(err, fallback), data: 0 };
      }
    }

    // Mock mode keeps the original behaviour, counting seeded students.
    const stats = await adminService.getDashboardStats();

    return stats.success
      ? { success: true, data: stats.data.pendingApprovals }
      : { success: false, data: 0, error: stats.error };
  },

  /**
   * ADM-003: POST /admin/students. The server creates the account as
   * PENDING_VERIFICATION (never active or approved), generates a one-time
   * temporary password, and issues the email OTP. Mobile OTP is reported as
   * unavailable until an SMS provider exists. There is no offline fallback:
   * creating an account locally would be a fake success.
   */
  async createStudent(input: AdminCreateStudentInput): Promise<ApiResponse<AdminCreatedStudentResult>> {
    try {
      const res = await apiClient.post('/admin/students', input);
      return { success: true, data: res.data?.data, message: res.data?.message };
    } catch (err: any) {
      return { success: false, data: null as any, error: apiErrorMessage(err, 'The student account could not be created.') };
    }
  },

  async updateStudentStatus(
    admin: { id: string; name: string },
    studentId: string,
    status: 'active' | 'suspended' | 'deactivated'
  ): Promise<ApiResponse<StudentProfile>> {
    if (!USE_DEV_MOCKS) {
      try {
        // PATCH /students/:id/status (admin). The server revokes the student's
        // sessions on suspension/deactivation and records the change.
        const res = await apiClient.patch(`/students/${encodeURIComponent(studentId)}/status`, { status });
        return { success: true, data: res.data?.data, message: res.data?.message || `Student marked as ${status}.` };
      } catch (err: any) {
        return { success: false, data: null as any, error: apiErrorMessage(err, 'Failed to update student status.') };
      }
    }
    await sleep(200);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);
    const idx = students.findIndex((s) => s.id === studentId);
    if (idx === -1) return { success: false, data: null as any, error: 'Student not found.' };

    students[idx].status = status as any;
    if (status === 'suspended') {
      students[idx].accountState = 'suspended';
    } else if (status === 'active') {
      students[idx].accountState = students[idx].adminApprovalStatus === 'approved' ? 'approved' : 'pending_approval';
      students[idx].failedLoginAttempts = 0;
    }
    setStorageItem(STORAGE_KEYS.STUDENTS, students);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'STUDENT_STATUS_UPDATED',
      `Student: ${students[idx].name} (${studentId})`,
      `Account status updated to: ${status.toUpperCase()}`
    );

    return { success: true, data: students[idx], message: `Student marked as ${status}.` };
  },

  async unlockStudentAccount(
    admin: { id: string; name: string },
    studentId: string
  ): Promise<ApiResponse<StudentProfile>> {
    if (USE_DEV_MOCKS) {
      await sleep(200);
      const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);
      const idx = students.findIndex((s) => s.id === studentId);
      if (idx === -1) return { success: false, data: null as any, error: 'Student not found.' };

      students[idx].failedLoginAttempts = 0;
      students[idx].accountState = students[idx].adminApprovalStatus === 'approved' ? 'approved' : 'pending_approval';
      setStorageItem(STORAGE_KEYS.STUDENTS, students);

      recordAuditLog(
        { id: admin.id, name: admin.name, role: 'admin' },
        'ACCOUNT_UNLOCKED_BY_ADMIN',
        `Student: ${students[idx].name} (${studentId})`,
        'Account lockout cleared and login attempts reset.'
      );

      return { success: true, data: students[idx], message: `Account unlocked for ${students[idx].name}.` };
    }

    try {
      const res = await apiClient.post(`/admin/students/${encodeURIComponent(studentId)}/unlock`);
      return { success: true, data: res.data?.data, message: res.data?.message || 'Account unlocked successfully.' };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to unlock account.';
      return { success: false, data: null as any, error: message };
    }
  },

  /**
   * Approves a pending registration (BR-002). LIVE BACKEND CALL in real mode.
   *
   *   POST /api/v1/students/:studentId/approve
   *
   * `admin` is kept in the signature so the mock path and every existing
   * caller still work, but IT IS IGNORED by the real endpoint: the deciding
   * administrator is read from the session token server-side, never from the
   * request body. A client that could name the approver could forge the
   * audit trail.
   *
   * THIS DOES NOT ACTIVATE THE ACCOUNT. BR-002 gates payment, not sign-in,
   * so the student remains `pending` until an administrator activates them
   * separately via `updateStudentStatus`.
   */
  async approveStudentRegistration(
    admin: { id: string; name: string },
    studentId: string,
    remarks?: string
  ): Promise<ApiResponse<StudentProfile>> {
    if (!USE_MOCK_AUTH) {
      const fallback = 'The approval could not be recorded. Please try again.';

      try {
        const response = await apiClient.post<
          BackendSuccessBody<StudentProfile> | BackendFailureBody
        >(`/students/${encodeURIComponent(studentId)}/approve`, {
          ...(remarks === undefined ? {} : { remarks }),
        });

        return toApiSuccess<StudentProfile>(response.data, fallback);
      } catch (err) {
        return toApiFailure<StudentProfile>(err, fallback);
      }
    }

    await sleep(250);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);
    const idx = students.findIndex((s) => s.id === studentId);
    if (idx === -1) return { success: false, data: null as any, error: 'Student not found.' };

    students[idx].adminApprovalStatus = 'approved';
    students[idx].accountState = 'approved';
    students[idx].status = 'active';
    students[idx].adminApprovalRemarks = remarks || 'Approved by Administrator.';
    students[idx].approvedAt = new Date().toISOString();
    setStorageItem(STORAGE_KEYS.STUDENTS, students);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'STUDENT_REGISTRATION_APPROVED',
      `Student: ${students[idx].name} (${studentId})`,
      remarks || 'Admin approved student application. Account eligible to select courses and initiate payment (BR-002).'
    );

    return {
      success: true,
      data: students[idx],
      message: 'Student approved successfully. Student can now proceed to payment.',
    };
  },

  /**
   * Rejects a pending registration. LIVE BACKEND CALL in real mode.
   *
   *   POST /api/v1/students/:studentId/reject
   *
   * `remarks` are MANDATORY server-side and must carry real content - the
   * backend trims and requires at least 5 characters, so a blank string is a
   * 422. A rejection a student cannot see a reason for is a support ticket.
   */
  async rejectStudentRegistration(
    admin: { id: string; name: string },
    studentId: string,
    remarks: string
  ): Promise<ApiResponse<StudentProfile>> {
    if (!USE_MOCK_AUTH) {
      const fallback = 'The rejection could not be recorded. Please try again.';

      try {
        const response = await apiClient.post<
          BackendSuccessBody<StudentProfile> | BackendFailureBody
        >(`/students/${encodeURIComponent(studentId)}/reject`, { remarks });

        return toApiSuccess<StudentProfile>(response.data, fallback);
      } catch (err) {
        return toApiFailure<StudentProfile>(err, fallback);
      }
    }

    await sleep(250);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);
    const idx = students.findIndex((s) => s.id === studentId);
    if (idx === -1) return { success: false, data: null as any, error: 'Student not found.' };

    students[idx].adminApprovalStatus = 'rejected';
    students[idx].accountState = 'rejected';
    students[idx].adminApprovalRemarks = remarks;
    setStorageItem(STORAGE_KEYS.STUDENTS, students);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'STUDENT_REGISTRATION_REJECTED',
      `Student: ${students[idx].name} (${studentId})`,
      `Rejection reason: ${remarks}`
    );

    return { success: true, data: students[idx], message: 'Student registration rejected.' };
  },

  /**
   * 3. Enrollment Management (ADM-005)
   */
  async getEnrollments(
    filter: { studentId?: string; courseId?: string; batchId?: string; status?: string } = {}
  ): Promise<ApiResponse<AdminEnrollmentRow[]>> {
    if (USE_DEV_MOCKS) {
      await sleep();
      const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
      return {
        success: true,
        data: enrollments.map(asMockAdminRow),
      };
    }

    try {
      const res = await apiClient.get('/admin/enrollments', { params: filter });
      const items: BackendEnrollment[] = res.data?.data?.items ?? res.data?.data ?? [];
      return { success: true, data: Array.isArray(items) ? items.map(fromBackendEnrollment) : [] };
    } catch (err: any) {
      return { success: false, data: [], error: apiErrorMessage(err, 'Failed to fetch enrollments.') };
    }
  },

  /**
   * POST /admin/enrollments. The server takes the price from the course and
   * creates APPROVED_UNPAID (student pays) unless `freeAccessOverride` is set,
   * which creates an ACTIVE enrollment and requires an audited reason.
   */
  async createEnrollment(
    admin: { id: string; name: string },
    data: {
      studentId: string;
      courseId: string;
      batchId?: string;
      discountCode?: string;
      freeAccessOverride?: boolean;
      overrideReason?: string;
      /** D6: required to exceed a full batch (audited by the server). */
      capacityOverrideReason?: string;
      /** D4: required when a prerequisite course is not completed (audited by the server). */
      prerequisiteOverrideReason?: string;
      /** Dev-mock only. */
      paymentStatus?: 'active' | 'pending_approval' | 'approved_unpaid';
    }
  ): Promise<ApiResponse<AdminEnrollmentRow>> {
    if (USE_DEV_MOCKS) {
      await sleep(300);
      const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
      const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);

      // Check existing
      let enr = enrollments.find((e) => e.studentId === data.studentId && e.courseId === data.courseId);
      if (enr) {
        enr.batchId = data.batchId || enr.batchId;
        enr.status = data.paymentStatus || 'active';
        setStorageItem(STORAGE_KEYS.ENROLLMENTS, enrollments);
        return { success: true, data: asMockAdminRow(enr), message: 'Existing enrollment updated.' };
      }

      const newEnr: Enrollment = {
        id: `enr-${Date.now()}`,
        studentId: data.studentId,
        courseId: data.courseId,
        batchId: data.batchId,
        status: data.paymentStatus || 'active',
        enrolledAt: new Date().toISOString(),
        progressPercentage: 0,
        completedLessonIds: [],
        bookmarkedLessonIds: [],
      };

      setStorageItem(STORAGE_KEYS.ENROLLMENTS, [newEnr, ...enrollments]);

      // Update student's enrolled courses list
      const stuIdx = students.findIndex((s) => s.id === data.studentId);
      if (stuIdx !== -1) {
        if (!students[stuIdx].enrolledCourseIds.includes(data.courseId)) {
          students[stuIdx].enrolledCourseIds.push(data.courseId);
          setStorageItem(STORAGE_KEYS.STUDENTS, students);
        }
      }

      recordAuditLog(
        { id: admin.id, name: admin.name, role: 'admin' },
        'STUDENT_ENROLLED',
        `Student ID: ${data.studentId} Course: ${data.courseId}`,
        `Enrolled into Course: ${data.courseId}, Batch: ${data.batchId || 'Default'}. Discount code: ${data.discountCode || "none"}.`
      );

      return { success: true, data: asMockAdminRow(newEnr), message: 'Student successfully enrolled.' };
    }

    try {
      const res = await apiClient.post('/admin/enrollments', {
        studentUserId: data.studentId,
        courseId: data.courseId,
        ...(data.batchId ? { batchId: data.batchId } : {}),
        ...(data.discountCode ? { discountCode: data.discountCode } : {}),
        ...(data.freeAccessOverride ? { freeAccessOverride: true, overrideReason: data.overrideReason } : {}),
        ...(data.capacityOverrideReason ? { capacityOverrideReason: data.capacityOverrideReason } : {}),
        ...(data.prerequisiteOverrideReason ? { prerequisiteOverrideReason: data.prerequisiteOverrideReason } : {}),
      });
      return {
        success: true,
        data: fromBackendEnrollment(res.data?.data),
        message: res.data?.message || 'Student successfully enrolled.',
      };
    } catch (err: any) {
      const errorCode = err?.response?.data?.error;
      return {
        success: false,
        data: null as any,
        error: apiErrorMessage(err, 'Failed to create enrollment.'),
        ...(typeof errorCode === 'string' ? { errorCode } : {}),
      };
    }
  },

  /**
   * PATCH /admin/enrollments/:id/status. Activating manually bypasses payment
   * verification, so the server requires and audits a `reason`.
   */
  async updateEnrollmentStatus(
    admin: { id: string; name: string },
    enrollmentId: string,
    status: 'active' | 'completed' | 'cancelled' | 'suspended' | 'pending_approval' | 'approved_unpaid',
    reason?: string
  ): Promise<ApiResponse<AdminEnrollmentRow | Enrollment>> {
    if (USE_DEV_MOCKS) {
      await sleep(200);
      const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
      const idx = enrollments.findIndex((e) => e.id === enrollmentId);
      if (idx === -1) return { success: false, data: null as any, error: 'Enrollment not found.' };

      enrollments[idx].status = status;
      setStorageItem(STORAGE_KEYS.ENROLLMENTS, enrollments);

      recordAuditLog(
        { id: admin.id, name: admin.name, role: 'admin' },
        'ENROLLMENT_STATUS_CHANGED',
        `Enrollment ID: ${enrollmentId}`,
        `Status changed to: ${status.toUpperCase()}`
      );

      return { success: true, data: enrollments[idx], message: `Enrollment status updated to ${status}.` };
    }

    try {
      const res = await apiClient.patch(`/admin/enrollments/${encodeURIComponent(enrollmentId)}/status`, {
        status,
        ...(reason ? { reason } : {}),
      });
      return {
        success: true,
        data: fromBackendEnrollment(res.data?.data),
        message: res.data?.message || 'Enrollment status updated.',
      };
    } catch (err: any) {
      return { success: false, data: null as any, error: apiErrorMessage(err, 'Failed to update enrollment status.') };
    }
  },

  /**
   * 4. Course Management (ADM-006)
   */
  async getCourses(): Promise<ApiResponse<Course[]>> {
    if (USE_DEV_MOCKS) {
      await sleep();
      const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
      return { success: true, data: courses };
    }

    try {
      // GET /courses/manage (admin): every course including drafts.
      const courses = await fetchAllPages<Course>('/courses/manage');
      return { success: true, data: courses };
    } catch (err: any) {
      return { success: false, data: [], error: apiErrorMessage(err, 'Failed to fetch courses.') };
    }
  },

  async createCourse(admin: { id: string; name: string }, courseData: Omit<Course, 'id'>): Promise<ApiResponse<Course>> {
    if (!USE_DEV_MOCKS) {
      try {
        // POST /courses (admin). The course code is also the public slug.
        const code = (courseData.courseCode || courseData.slug || '').trim().toLowerCase();
        const res = await apiClient.post('/courses', { slug: code, courseCode: code, ...toStorableCourseBody(courseData) });
        return { success: true, data: res.data?.data, message: res.data?.message || 'Course created.' };
      } catch (err: any) {
        return { success: false, data: null as any, error: apiErrorMessage(err, 'Failed to create course.') };
      }
    }
    await sleep(300);
    const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
    const newCourse: Course = {
      ...courseData,
      id: `course-${Date.now().toString().slice(-4)}`,
    };
    setStorageItem(STORAGE_KEYS.COURSES, [newCourse, ...courses]);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'COURSE_CREATED',
      `Course: ${newCourse.title} (${newCourse.id})`,
      `Created new course catalog item. Fee: ₹${newCourse.feeINR}.`
    );

    return { success: true, data: newCourse, message: 'New course created successfully.' };
  },

  async updateCourse(admin: { id: string; name: string }, courseId: string, updates: Partial<Course>): Promise<ApiResponse<Course>> {
    if (!USE_DEV_MOCKS) {
      try {
        const res = await apiClient.patch(`/courses/${encodeURIComponent(courseId)}`, toStorableCourseBody(updates));
        return { success: true, data: res.data?.data, message: res.data?.message || 'Course updated.' };
      } catch (err: any) {
        return { success: false, data: null as any, error: apiErrorMessage(err, 'Failed to update course.') };
      }
    }
    await sleep(250);
    const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
    const idx = courses.findIndex((c) => c.id === courseId);
    if (idx === -1) return { success: false, data: null as any, error: 'Course not found.' };

    courses[idx] = { ...courses[idx], ...updates };
    setStorageItem(STORAGE_KEYS.COURSES, courses);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'COURSE_UPDATED',
      `Course: ${courses[idx].title} (${courseId})`,
      'Updated course details, fees or syllabus parameters.'
    );

    return { success: true, data: courses[idx], message: 'Course updated successfully.' };
  },

  async toggleCoursePublish(admin: { id: string; name: string }, courseId: string): Promise<ApiResponse<Course>> {
    if (!USE_DEV_MOCKS) {
      try {
        const res = await apiClient.patch(`/courses/${encodeURIComponent(courseId)}/publish`);
        return { success: true, data: res.data?.data, message: res.data?.message || 'Course visibility updated.' };
      } catch (err: any) {
        return { success: false, data: null as any, error: apiErrorMessage(err, 'Failed to change course visibility.') };
      }
    }
    await sleep(200);
    const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
    const idx = courses.findIndex((c) => c.id === courseId);
    if (idx === -1) return { success: false, data: null as any, error: 'Course not found.' };

    courses[idx].isPublished = !courses[idx].isPublished;
    courses[idx].status = courses[idx].isPublished ? 'Published' : 'Draft';
    setStorageItem(STORAGE_KEYS.COURSES, courses);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'COURSE_VISIBILITY_TOGGLED',
      `Course: ${courses[idx].title}`,
      `Published status set to: ${courses[idx].isPublished}`
    );

    return { success: true, data: courses[idx], message: `Course ${courses[idx].isPublished ? 'published' : 'unpublished'}.` };
  },

  async updateCourseStatus(
    admin: { id: string; name: string },
    courseId: string,
    status: CourseStatus
  ): Promise<ApiResponse<Course>> {
    if (!USE_DEV_MOCKS) {
      try {
        const res = await apiClient.patch(`/courses/${encodeURIComponent(courseId)}/status`, { status });
        return { success: true, data: res.data?.data, message: res.data?.message || `Course status set to ${status}.` };
      } catch (err: any) {
        return { success: false, data: null as any, error: apiErrorMessage(err, 'Failed to change course status.') };
      }
    }
    await sleep(200);
    const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
    const idx = courses.findIndex((c) => c.id === courseId);
    if (idx === -1) return { success: false, data: null as any, error: 'Course not found.' };

    courses[idx].status = status;
    courses[idx].isPublished = status === 'Published' || status === 'Active';
    setStorageItem(STORAGE_KEYS.COURSES, courses);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'COURSE_STATUS_UPDATED',
      `Course: ${courses[idx].title} (${courseId})`,
      `Lifecycle status transitioned to: ${status}`
    );

    return { success: true, data: courses[idx], message: `Course status set to ${status}.` };
  },

  /** GET /courses/manage/:id - full course including its curriculum tree. */
  async getCourseById(courseId: string): Promise<ApiResponse<Course>> {
    if (USE_DEV_MOCKS) {
      await sleep(100);
      const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
      const course = courses.find((c) => c.id === courseId);
      return course ? { success: true, data: course } : { success: false, data: null as any, error: 'Course not found.' };
    }
    try {
      const res = await apiClient.get(`/courses/manage/${encodeURIComponent(courseId)}`);
      return { success: true, data: res.data?.data };
    } catch (err: any) {
      return { success: false, data: null as any, error: apiErrorMessage(err, 'Failed to load course.') };
    }
  },

  async updateCourseCurriculum(
    admin: { id: string; name: string },
    courseId: string,
    modules: CourseModule[]
  ): Promise<ApiResponse<Course>> {
    if (!USE_DEV_MOCKS) {
      try {
        // PUT /courses/:id/curriculum. Existing ids are preserved server-side;
        // new items carry client ids and are inserted.
        const res = await apiClient.put(`/courses/${encodeURIComponent(courseId)}/curriculum`, { modules });
        return { success: true, data: res.data?.data, message: res.data?.message || 'Curriculum saved.' };
      } catch (err: any) {
        return { success: false, data: null as any, error: apiErrorMessage(err, 'Failed to save curriculum.') };
      }
    }
    await sleep(250);
    const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
    const idx = courses.findIndex((c) => c.id === courseId);
    if (idx === -1) return { success: false, data: null as any, error: 'Course not found.' };

    courses[idx].modules = modules;
    setStorageItem(STORAGE_KEYS.COURSES, courses);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'CURRICULUM_UPDATED',
      `Course: ${courses[idx].title} (${courseId})`,
      `Syllabus updated: ${modules.length} modules configured.`
    );

    return { success: true, data: courses[idx], message: 'Curriculum syllabus updated successfully.' };
  },

  async archiveCourse(
    admin: { id: string; name: string },
    courseId: string
  ): Promise<ApiResponse<Course>> {
    return this.updateCourseStatus(admin, courseId, 'Archived');
  },

  /**
   * 5. Batch Management (ADM-007)
   */
  async getBatches(): Promise<ApiResponse<Batch[]>> {
    if (USE_DEV_MOCKS) {
      await sleep();
      const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);
      return { success: true, data: batches };
    }

    try {
      const res = await apiClient.get('/admin/batches');
      const items: BackendBatch[] = res.data?.data?.items ?? res.data?.data ?? [];
      return { success: true, data: Array.isArray(items) ? items.map(fromBackendBatch) : [] };
    } catch (err: any) {
      return { success: false, data: [], error: apiErrorMessage(err, 'Failed to fetch batches.') };
    }
  },

  async getBatchById(batchId: string): Promise<ApiResponse<Batch>> {
    if (USE_DEV_MOCKS) {
      await sleep(100);
      const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);
      const batch = batches.find((b) => b.id === batchId);
      if (!batch) return { success: false, data: null as any, error: 'Batch not found.' };
      return { success: true, data: batch };
    }

    try {
      const res = await apiClient.get(`/admin/batches/${encodeURIComponent(batchId)}`);
      return { success: true, data: fromBackendBatch(res.data?.data) };
    } catch (err: any) {
      return { success: false, data: null as any, error: apiErrorMessage(err, 'Batch not found.') };
    }
  },

  async getBatchStudents(batchId: string): Promise<ApiResponse<{ student: StudentProfile; enrollment: Enrollment }[]>> {
    if (USE_DEV_MOCKS) {
      await sleep(150);
      const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
      const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [SEED_USERS.student]);

      const batchEnrollments = enrollments.filter((e) => e.batchId === batchId);
      const roster = batchEnrollments
        .map((enr) => {
          const student = students.find((s) => s.id === enr.studentId);
          if (!student) return null;
          return { student, enrollment: enr };
        })
        .filter(Boolean) as { student: StudentProfile; enrollment: Enrollment }[];

      return { success: true, data: roster };
    }

    try {
      // The roster endpoint returns students; their enrollment in this batch
      // comes from the enrollment list filtered by batch.
      const [studentsRes, enrollmentsRes] = await Promise.all([
        apiClient.get(`/admin/batches/${encodeURIComponent(batchId)}/students`),
        apiClient.get('/admin/enrollments', { params: { batchId } }),
      ]);
      const students: StudentProfile[] = studentsRes.data?.data ?? [];
      const enrollments: BackendEnrollment[] = enrollmentsRes.data?.data ?? [];
      const roster = students
        .map((student) => {
          const enr = enrollments.find((e) => e.studentUserId === student.id);
          return enr ? { student, enrollment: fromBackendEnrollment(enr) } : null;
        })
        .filter(Boolean) as { student: StudentProfile; enrollment: Enrollment }[];
      return { success: true, data: roster };
    } catch (err: any) {
      return { success: false, data: [], error: apiErrorMessage(err, 'Failed to fetch batch students.') };
    }
  },

  async createBatch(admin: { id: string; name: string }, batchData: Omit<Batch, 'id' | 'enrolledStudentIds'>): Promise<ApiResponse<Batch>> {
    if (USE_DEV_MOCKS) {
      await sleep(250);
      const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);
      const newBatch: Batch = {
        ...batchData,
        id: `batch-${Date.now().toString().slice(-4)}`,
        enrolledStudentIds: [],
      };
      setStorageItem(STORAGE_KEYS.BATCHES, [newBatch, ...batches]);

      recordAuditLog(
        { id: admin.id, name: admin.name, role: 'admin' },
        'BATCH_CREATED',
        `Batch: ${newBatch.name} (${newBatch.batchCode})`,
        `Created cohort for Course: ${newBatch.courseName}. Capacity: ${newBatch.maxCapacity}. Meeting: ${newBatch.meetingUrl || 'TBD'}.`
      );

      return { success: true, data: newBatch, message: 'New batch cohort created successfully.' };
    }

    try {
      const res = await apiClient.post('/admin/batches', toBackendBatchBody(batchData));
      return {
        success: true,
        data: fromBackendBatch(res.data?.data),
        message: res.data?.message || 'New batch cohort created successfully.',
      };
    } catch (err: any) {
      return { success: false, data: null as any, error: apiErrorMessage(err, 'Failed to create batch cohort.') };
    }
  },

  async updateBatch(admin: { id: string; name: string }, batchId: string, updates: Partial<Batch>): Promise<ApiResponse<Batch>> {
    if (USE_DEV_MOCKS) {
      await sleep(200);
      const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);
      const idx = batches.findIndex((b) => b.id === batchId);
      if (idx === -1) return { success: false, data: null as any, error: 'Batch not found.' };

      batches[idx] = { ...batches[idx], ...updates };
      setStorageItem(STORAGE_KEYS.BATCHES, batches);

      recordAuditLog(
        { id: admin.id, name: admin.name, role: 'admin' },
        'BATCH_UPDATED',
        `Batch: ${batches[idx].name} (${batchId})`,
        'Updated batch cohort details, timing or faculty assignment.'
      );

      return { success: true, data: batches[idx], message: 'Batch cohort updated.' };
    }

    try {
      // courseId and batchCode are not editable after creation.
      const { courseId: _c, batchCode: _b, ...editable } = toBackendBatchBody(updates);
      const res = await apiClient.put(`/admin/batches/${encodeURIComponent(batchId)}`, editable);
      return { success: true, data: fromBackendBatch(res.data?.data), message: res.data?.message || 'Batch cohort updated.' };
    } catch (err: any) {
      return { success: false, data: null as any, error: apiErrorMessage(err, 'Failed to update batch.') };
    }
  },

  async updateBatchStatus(
    admin: { id: string; name: string },
    batchId: string,
    status: BatchStatus
  ): Promise<ApiResponse<Batch>> {
    if (USE_DEV_MOCKS) {
      return this.updateBatch(admin, batchId, { status });
    }

    try {
      const res = await apiClient.patch(`/admin/batches/${encodeURIComponent(batchId)}/status`, { status });
      return { success: true, data: fromBackendBatch(res.data?.data), message: res.data?.message || 'Batch status updated.' };
    } catch (err: any) {
      return { success: false, data: null as any, error: apiErrorMessage(err, 'Failed to update batch status.') };
    }
  },

  /**
   * 6. Teacher Management & Allocation (ADM-008)
   */
  async getTeachers(): Promise<ApiResponse<TeacherProfile[]>> {
    if (USE_DEV_MOCKS) {
      await sleep();
      const teachers = getStorageItem<TeacherProfile[]>(STORAGE_KEYS.TEACHERS, [SEED_USERS.teacher]);
      return { success: true, data: teachers };
    }

    try {
      const res = await apiClient.get('/admin/teachers');
      const items = res.data?.data?.items ?? res.data?.data ?? [];
      return { success: true, data: Array.isArray(items) ? items : [] };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to fetch teachers.';
      return { success: false, data: [], error: message };
    }
  },

  /**
   * PUT /admin/teachers/:id - name and profile fields (email and mobile are
   * sign-in identifiers and are not edited here). Audited server-side.
   */
  async updateTeacher(
    teacherId: string,
    changes: { name?: string; specialization?: string | null; experienceYears?: number; qualifications?: string | null; bio?: string | null }
  ): Promise<ApiResponse<{ record: TeacherProfile; changed: boolean } | null>> {
    try {
      const res = await apiClient.put(`/admin/teachers/${encodeURIComponent(teacherId)}`, changes);
      return { success: true, data: res.data?.data ?? null, message: res.data?.message };
    } catch (err: any) {
      return { success: false, data: null, error: apiErrorMessage(err, 'The teacher could not be updated.') };
    }
  },

  /** PATCH /admin/teachers/:id/status - activate or deactivate; deactivation signs the teacher out. */
  async setTeacherStatus(
    teacherId: string,
    status: 'active' | 'deactivated',
    reason?: string
  ): Promise<ApiResponse<{ record: TeacherProfile; changed: boolean } | null>> {
    try {
      const res = await apiClient.patch(`/admin/teachers/${encodeURIComponent(teacherId)}/status`, { status, ...(reason ? { reason } : {}) });
      return { success: true, data: res.data?.data ?? null, message: res.data?.message };
    } catch (err: any) {
      return { success: false, data: null, error: apiErrorMessage(err, 'The teacher status could not be changed.') };
    }
  },

  async addTeacher(
    admin: { id: string; name: string },
    teacherData: Omit<TeacherProfile, 'id' | 'createdAt' | 'role' | 'status' | 'assignedCourseIds' | 'assignedBatchIds' | 'rating'>
  ): Promise<ApiResponse<TeacherProfile & { temporaryPassword?: string }>> {
    if (USE_DEV_MOCKS) {
      await sleep(250);
      const teachers = getStorageItem<TeacherProfile[]>(STORAGE_KEYS.TEACHERS, [SEED_USERS.teacher]);
      const newId = `user-tch-${Date.now().toString().slice(-4)}`;

      const newTeacher: TeacherProfile = {
        ...teacherData,
        id: newId,
        createdAt: new Date().toISOString(),
        role: 'teacher',
        status: 'active',
        assignedCourseIds: [],
        assignedBatchIds: [],
        rating: 5.0,
        avatarUrl: teacherData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      };

      setStorageItem(STORAGE_KEYS.TEACHERS, [newTeacher, ...teachers]);

      recordAuditLog(
        { id: admin.id, name: admin.name, role: 'admin' },
        'TEACHER_ADDED',
        `Teacher: ${newTeacher.name} (${newId})`,
        `Specialization: ${newTeacher.specialization}. Experience: ${newTeacher.experienceYears} Years.`
      );

      return { success: true, data: newTeacher, message: 'Faculty member onboarded successfully.' };
    }

    try {
      const res = await apiClient.post('/admin/teachers', teacherData);
      return { success: true, data: res.data?.data, message: res.data?.message || 'Faculty member onboarded successfully.' };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to add faculty member.';
      return { success: false, data: null as any, error: message };
    }
  },

  async allocateTeacher(
    admin: { id: string; name: string },
    teacherId: string,
    courseId: string,
    batchId: string
  ): Promise<ApiResponse<{ teacher: TeacherProfile; batch: Batch }>> {
    if (USE_DEV_MOCKS) {
      await sleep(250);
      const teachers = getStorageItem<TeacherProfile[]>(STORAGE_KEYS.TEACHERS, [SEED_USERS.teacher]);
      const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);

      const tIdx = teachers.findIndex((t) => t.id === teacherId);
      const bIdx = batches.findIndex((b) => b.id === batchId);

      if (tIdx === -1 || bIdx === -1) {
        return { success: false, data: null as any, error: 'Teacher or Batch record not found.' };
      }

      if (!teachers[tIdx].assignedCourseIds.includes(courseId)) {
        teachers[tIdx].assignedCourseIds.push(courseId);
      }
      if (!teachers[tIdx].assignedBatchIds.includes(batchId)) {
        teachers[tIdx].assignedBatchIds.push(batchId);
      }

      if (!batches[bIdx].assignedTeacherIds.includes(teacherId)) {
        batches[bIdx].assignedTeacherIds.push(teacherId);
      }

      setStorageItem(STORAGE_KEYS.TEACHERS, teachers);
      setStorageItem(STORAGE_KEYS.BATCHES, batches);

      recordAuditLog(
        { id: admin.id, name: admin.name, role: 'admin' },
        'TEACHER_ALLOCATED_TO_BATCH',
        `Teacher: ${teachers[tIdx].name} -> Batch: ${batches[bIdx].name}`,
        `Assigned instructor to Course: ${courseId}, Batch: ${batchId}.`
      );

      return {
        success: true,
        data: { teacher: teachers[tIdx], batch: batches[bIdx] },
        message: `${teachers[tIdx].name} successfully allocated to ${batches[bIdx].name}.`,
      };
    }

    try {
      // Approved decision: the (course, batch, teacher) triple; the server
      // verifies the batch belongs to the course.
      const res = await apiClient.post(`/admin/batches/${encodeURIComponent(batchId)}/allocations`, {
        teacherUserId: teacherId,
        courseId,
      });
      return {
        success: true,
        data: res.data?.data,
        message: res.data?.message || 'Teacher successfully allocated to batch cohort.',
      };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to allocate teacher to batch.';
      return { success: false, data: null as any, error: message };
    }
  },

  async unallocateTeacher(
    admin: { id: string; name: string },
    teacherId: string,
    batchId: string
  ): Promise<ApiResponse<boolean>> {
    if (USE_DEV_MOCKS) {
      await sleep(200);
      const teachers = getStorageItem<TeacherProfile[]>(STORAGE_KEYS.TEACHERS, [SEED_USERS.teacher]);
      const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);

      const tIdx = teachers.findIndex((t) => t.id === teacherId);
      const bIdx = batches.findIndex((b) => b.id === batchId);

      if (tIdx !== -1) {
        teachers[tIdx].assignedBatchIds = teachers[tIdx].assignedBatchIds.filter((b) => b !== batchId);
        setStorageItem(STORAGE_KEYS.TEACHERS, teachers);
      }

      if (bIdx !== -1) {
        batches[bIdx].assignedTeacherIds = batches[bIdx].assignedTeacherIds.filter((t) => t !== teacherId);
        setStorageItem(STORAGE_KEYS.BATCHES, batches);
      }

      recordAuditLog(
        { id: admin.id, name: admin.name, role: 'admin' },
        'TEACHER_UNALLOCATED_FROM_BATCH',
        `Teacher ID: ${teacherId} Batch ID: ${batchId}`,
        'Instructor assignment removed from cohort.'
      );

      return { success: true, data: true, message: 'Teacher assignment removed.' };
    }

    try {
      await apiClient.delete(`/admin/batches/${encodeURIComponent(batchId)}/allocations/${encodeURIComponent(teacherId)}`);
      return { success: true, data: true, message: 'Teacher assignment removed.' };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to unallocate teacher.';
      return { success: false, data: false, error: message };
    }
  },

  /**
   * 7. Payments & Discounts (ADM-009, ADM-010, PAY-008/009/013). Live:
   * /payments/admin/* and /admin/finance/*.
   */
  /**
   * Gateway transactions (GET /payments/admin/all) plus Admin-recorded offline
   * payments (GET /payments/admin/manual), newest first. Transactions do not
   * store the discount, so `discountAppliedINR` is 0 and never displayed.
   */
  async getPayments(): Promise<ApiResponse<PaymentTransaction[]>> {
    try {
      const [txRes, manualRes] = await Promise.all([apiClient.get('/payments/admin/all'), apiClient.get('/payments/admin/manual')]);
      const txs: any[] = Array.isArray(txRes.data?.data) ? txRes.data.data : [];
      const manual: any[] = Array.isArray(manualRes.data?.data) ? manualRes.data.data : [];
      const online: PaymentTransaction[] = txs.map((t) => ({
        id: `tx-${t.id}`,
        orderId: String(t.paymentOrderId ?? ''),
        studentId: String(t.studentUserId ?? ''),
        studentName: t.studentName || `Student #${t.studentUserId ?? '?'}`,
        courseId: String(t.courseId ?? ''),
        courseTitle: t.courseTitle || '',
        amountINR: Number(t.amount),
        discountAppliedINR: 0,
        finalAmountINR: Number(t.amount),
        status: t.transactionStatus as PaymentTransaction['status'],
        paymentMethod: t.paymentMethod as PaymentTransaction['paymentMethod'],
        gatewayTransactionId: t.gatewayPaymentId || undefined,
        receiptNumber: t.receiptNumber || '—',
        paidAt: t.paidAt,
        createdAt: t.createdAt,
        isManualEntry: false,
      }));
      const offline: PaymentTransaction[] = manual.map((m) => ({
        id: `manual-${m.id}`,
        orderId: `manual-${m.id}`,
        studentId: String(m.studentUserId),
        studentName: m.studentName || `Student #${m.studentUserId}`,
        courseId: String(m.courseId ?? ''),
        courseTitle: m.courseTitle || '',
        amountINR: Number(m.amount),
        discountAppliedINR: 0,
        finalAmountINR: Number(m.amount),
        // The recording Admin verifies the payment; any other stored value is shown as pending.
        status: String(m.verificationStatus).toLowerCase() === 'verified' ? 'successful' : 'pending',
        paymentMethod: `manual_${m.paymentMode}` as PaymentTransaction['paymentMethod'],
        receiptNumber: m.referenceNumber || '—',
        paidAt: m.verifiedAt,
        createdAt: m.createdAt,
        isManualEntry: true,
        manualEnteredByAdminId: String(m.enteredByUserId),
      }));
      const all = [...online, ...offline].sort((a, b) => (b.paidAt || b.createdAt).localeCompare(a.paidAt || a.createdAt));
      return { success: true, data: all };
    } catch (err: any) {
      return { success: false, data: [], error: apiErrorMessage(err, 'Payments could not be loaded.') };
    }
  },

  /**
   * POST /payments/admin/manual. The enrollment must be APPROVED_UNPAID and the
   * amount its full FinalAmount (BR-005). The server activates the enrollment
   * and writes audit + financial history in one transaction.
   */
  async recordManualPayment(input: {
    studentUserId: string;
    enrollmentId: string;
    amount: number;
    paymentMode: ManualPaymentMode;
    referenceNumber: string;
  }): Promise<ApiResponse<{ id: string } | null>> {
    try {
      const res = await apiClient.post('/payments/admin/manual', input);
      return { success: true, data: res.data?.data ?? null, message: res.data?.message };
    } catch (err: any) {
      return { success: false, data: null, error: apiErrorMessage(err, 'The payment could not be recorded.') };
    }
  },

  async getDiscounts(): Promise<ApiResponse<CouponDiscount[]>> {
    try {
      // GET /payments/admin/discounts: NXA_Coupons joined to NXA_Discounts.
      const res = await apiClient.get('/payments/admin/discounts');
      const items: CouponDiscount[] = res.data?.data ?? [];
      return { success: true, data: Array.isArray(items) ? items : [] };
    } catch (err: any) {
      return { success: false, data: [], error: apiErrorMessage(err, 'Failed to fetch discounts.') };
    }
  },

  /** POST /payments/admin/discounts. Course-restricted coupons cannot be stored (no mapping table). */
  async createDiscount(input: {
    code: string;
    description: string;
    discountType: 'percentage' | 'fixed_amount';
    value: number;
    validUntil?: string;
    usageLimit?: number;
    perUserLimit?: number;
  }): Promise<ApiResponse<CouponDiscount | null>> {
    try {
      const res = await apiClient.post('/payments/admin/discounts', { ...input, applicableCourseIds: [], isActive: true });
      return { success: true, data: res.data?.data ?? null, message: res.data?.message };
    } catch (err: any) {
      return { success: false, data: null, error: apiErrorMessage(err, 'The coupon could not be created.') };
    }
  },

  /** PATCH /admin/finance/coupons/:id/status. Coupons are never deleted; redemptions are kept. */
  async setCouponActive(
    couponId: string,
    isActive: boolean,
    reason?: string
  ): Promise<ApiResponse<{ changed: boolean } | null>> {
    try {
      const res = await apiClient.patch(`/admin/finance/coupons/${encodeURIComponent(couponId)}/status`, {
        isActive,
        ...(reason ? { reason } : {}),
      });
      return { success: true, data: { changed: Boolean(res.data?.data?.changed) }, message: res.data?.message };
    } catch (err: any) {
      return { success: false, data: null, error: apiErrorMessage(err, 'The coupon status could not be changed.') };
    }
  },

  /** GET /admin/finance/history (PAY-013). Refund history is Super Admin only. */
  async getFinancialHistory(
    entityType: 'Coupon' | 'ManualPayment' | 'CouponRedemption' | 'EnrollmentOverride' | 'Scholarship',
    entityId: string
  ): Promise<ApiResponse<FinancialHistoryEntry[]>> {
    try {
      const res = await apiClient.get('/admin/finance/history', { params: { entityType, entityId } });
      return { success: true, data: Array.isArray(res.data?.data) ? res.data.data : [] };
    } catch (err: any) {
      return { success: false, data: [], error: apiErrorMessage(err, 'History could not be loaded.') };
    }
  },

  /**
   * 8. Academic oversight (ADM-011, ATT-001/002/005/009, ASM-005/011, BR-010/012)
   * Live: /admin/academics. Ids are numeric strings from the server.
   */
  /** ATT-010 (D2): per-student attendance % for a batch, computed by the server. */
  async getAttendanceSummary(batchId: string): Promise<ApiResponse<AttendanceSummary | null>> {
    return academicsCall(() => apiClient.get('/admin/academics/attendance/summary', { params: { batchId } }), null, 'The attendance summary could not be loaded.');
  },

  async getClassSessions(filter: { batchId?: string } = {}): Promise<ApiResponse<AcademicSession[]>> {
    return academicsCall(() => apiClient.get('/admin/academics/class-sessions', { params: filter }), [], 'Class sessions could not be loaded.');
  },

  async createClassSession(input: {
    batchId: string;
    teacherUserId: string;
    sessionTitle: string;
    startsAt: string;
    endsAt: string;
    meetingUrl?: string;
  }): Promise<ApiResponse<AcademicSession | null>> {
    return academicsCall(() => apiClient.post('/admin/academics/class-sessions', input), null, 'The session could not be scheduled.');
  },

  async updateClassSession(
    sessionId: string,
    changes: { teacherUserId?: string; sessionTitle?: string; startsAt?: string; endsAt?: string; meetingUrl?: string }
  ): Promise<ApiResponse<AcademicSession | null>> {
    return academicsCall(
      () => apiClient.patch(`/admin/academics/class-sessions/${encodeURIComponent(sessionId)}`, changes),
      null,
      'The session could not be updated.'
    );
  },

  async getSessionAttendance(sessionId: string): Promise<ApiResponse<{ session: AcademicSession; roster: AcademicRosterEntry[] } | null>> {
    return academicsCall(
      () => apiClient.get(`/admin/academics/class-sessions/${encodeURIComponent(sessionId)}/attendance`),
      null,
      'Attendance could not be loaded.'
    );
  },

  /** New records are created; a changed status is a correction and needs `reason` (kept in the change history). */
  async markSessionAttendance(
    sessionId: string,
    records: Array<{ studentUserId: string; status: AcademicAttendanceStatus; remarks?: string }>,
    reason?: string
  ): Promise<ApiResponse<{ created: number; corrected: number; unchanged: number } | null>> {
    return academicsCall(
      () =>
        apiClient.put(`/admin/academics/class-sessions/${encodeURIComponent(sessionId)}/attendance`, {
          records,
          ...(reason ? { reason } : {}),
        }),
      null,
      'Attendance could not be saved.'
    );
  },

  async getAttendanceHistory(sessionId: string): Promise<ApiResponse<AcademicAttendanceChange[]>> {
    return academicsCall(
      () => apiClient.get(`/admin/academics/class-sessions/${encodeURIComponent(sessionId)}/attendance/history`),
      [],
      'Attendance history could not be loaded.'
    );
  },

  /** Attendance rows for every session (optionally of one batch): one row per rostered student. */
  async getAttendanceReportRows(batchId?: string): Promise<ApiResponse<AcademicAttendanceRow[]>> {
    const sessions = await this.getClassSessions(batchId ? { batchId } : {});
    if (!sessions.success) return { success: false, data: [], error: sessions.error };
    const rosters = await Promise.all(sessions.data.map((s) => this.getSessionAttendance(s.id)));
    const failed = rosters.find((r) => !r.success);
    if (failed) return { success: false, data: [], error: failed.error };
    const rows: AcademicAttendanceRow[] = [];
    rosters.forEach((r) => {
      if (!r.data) return;
      const { session, roster } = r.data;
      roster.forEach((entry) => rows.push({ session, ...entry }));
    });
    return { success: true, data: rows };
  },

  async getAcademicAssignments(filter: { courseId?: string; batchId?: string } = {}): Promise<ApiResponse<AcademicAssignment[]>> {
    return academicsCall(() => apiClient.get('/admin/academics/assignments', { params: filter }), [], 'Assignments could not be loaded.');
  },

  async getAssignmentSubmissions(assignmentId: string): Promise<ApiResponse<AcademicSubmission[]>> {
    return academicsCall(
      () => apiClient.get(`/admin/academics/assignments/${encodeURIComponent(assignmentId)}/submissions`),
      [],
      'Submissions could not be loaded.'
    );
  },

  /** Adds a new evaluation version; earlier evaluations are kept. */
  async evaluateSubmission(
    submissionId: string,
    input: { marksAwarded: number; feedback?: string }
  ): Promise<ApiResponse<AcademicSubmission | null>> {
    return academicsCall(
      () => apiClient.post(`/admin/academics/assignment-submissions/${encodeURIComponent(submissionId)}/evaluations`, input),
      null,
      'The evaluation could not be saved.'
    );
  },

  /** ASM-012: every evaluation version of a submission, newest first. */
  async getEvaluationHistory(submissionId: string): Promise<ApiResponse<EvaluationVersion[]>> {
    return academicsCall(
      () => apiClient.get(`/admin/academics/assignment-submissions/${encodeURIComponent(submissionId)}/evaluations`),
      [],
      'The evaluation history could not be loaded.'
    );
  },

  async getAcademicTests(filter: { courseId?: string; batchId?: string } = {}): Promise<ApiResponse<AcademicTest[]>> {
    return academicsCall(() => apiClient.get('/admin/academics/tests', { params: filter }), [], 'Tests could not be loaded.');
  },

  async getTestAttempts(testId: string): Promise<ApiResponse<AcademicTestAttempt[]>> {
    return academicsCall(
      () => apiClient.get(`/admin/academics/tests/${encodeURIComponent(testId)}/attempts`),
      [],
      'Test attempts could not be loaded.'
    );
  },

  async getRetakeAuthorizations(testId: string): Promise<ApiResponse<AcademicRetake[]>> {
    return academicsCall(
      () => apiClient.get(`/admin/academics/tests/${encodeURIComponent(testId)}/retake-authorizations`),
      [],
      'Retake authorizations could not be loaded.'
    );
  },

  /** BR-012: Admin override recorded in NXA_RetakeAuthorizations (audited server-side). */
  async authorizeTestRetake(
    testId: string,
    input: { studentUserId: string; additionalAttempts: number; reason: string }
  ): Promise<ApiResponse<AcademicRetake | null>> {
    return academicsCall(
      () => apiClient.post(`/admin/academics/tests/${encodeURIComponent(testId)}/retake-authorizations`, input),
      null,
      'The retake could not be authorized.'
    );
  },

  /** Every attempt of every test (for report export). */
  async getAllTestAttempts(): Promise<ApiResponse<Array<AcademicTestAttempt & { testTitle: string }>>> {
    const tests = await this.getAcademicTests();
    if (!tests.success) return { success: false, data: [], error: tests.error };
    const lists = await Promise.all(tests.data.map((t) => this.getTestAttempts(t.id)));
    const failed = lists.find((l) => !l.success);
    if (failed) return { success: false, data: [], error: failed.error };
    return {
      success: true,
      data: lists.flatMap((l, i) => l.data.map((a) => ({ ...a, testTitle: tests.data[i]!.title }))),
    };
  },

  /**
   * 10. Certificates (ADM-012)
   */
  /** All certificates, from GET /certificates/admin/all (server records only). */
  async getCertificates(): Promise<ApiResponse<AdminCertificate[]>> {
    try {
      const res = await apiClient.get('/certificates/admin/all');
      const list = res.data?.data;
      return { success: true, data: Array.isArray(list) ? list : [] };
    } catch (err: any) {
      return { success: false, data: [], error: apiErrorMessage(err, 'Certificates could not be loaded.') };
    }
  },

  /** POST /certificates/:id/revoke - recorded by the server (CER-008). */
  async revokeCertificate(certificateId: string, reason: string): Promise<ApiResponse<AdminCertificate>> {
    try {
      const res = await apiClient.post(`/certificates/${encodeURIComponent(certificateId)}/revoke`, { reason });
      return { success: true, data: res.data?.data, message: res.data?.message || 'Certificate revoked.' };
    } catch (err: any) {
      return { success: false, data: null as any, error: apiErrorMessage(err, 'The certificate could not be revoked.') };
    }
  },

  /**
   * 11. Placement Administration (ADM-012, PLC-001..PLC-015). Live: /placements.
   * Status vocabulary (D1): jobs open/closed/draft; applications
   * applied/shortlisted/rejected/selected; interview progress = rounds.
   */
  async getPlacementCompanies(): Promise<ApiResponse<PlacementCompany[]>> {
    return academicsCall(() => apiClient.get('/placements/companies'), [], 'Companies could not be loaded.');
  },

  async createPlacementCompany(input: PlacementCompanyInput & { hiringStatus?: 'active' | 'inactive' }): Promise<ApiResponse<PlacementCompany | null>> {
    return academicsCall(() => apiClient.post('/placements/companies', input), null, 'The company could not be created.');
  },

  /** Edits columns only; send null to clear an optional field. */
  async updatePlacementCompany(id: string, changes: Partial<Record<keyof PlacementCompanyInput, string | null>>): Promise<ApiResponse<Changed<PlacementCompany> | null>> {
    return academicsCall(() => apiClient.patch(`/placements/companies/${encodeURIComponent(id)}`, changes), null, 'The company could not be updated.');
  },

  /** Companies are never deleted (D2); deactivation keeps their jobs and records. */
  async setPlacementCompanyActive(id: string, isActive: boolean, reason?: string): Promise<ApiResponse<Changed<PlacementCompany> | null>> {
    return academicsCall(
      () => apiClient.patch(`/placements/companies/${encodeURIComponent(id)}/status`, { isActive, ...(reason ? { reason } : {}) }),
      null,
      'The company status could not be changed.'
    );
  },

  async getPlacementJobs(): Promise<ApiResponse<PlacementJob[]>> {
    // Admin listing: every status (the public /placements/jobs shows open jobs only).
    return academicsCall(() => apiClient.get('/placements/admin/jobs'), [], 'Jobs could not be loaded.');
  },

  async createPlacementJob(input: PlacementJobInput & { companyId: string; jobStatus: PlacementJobStatus }): Promise<ApiResponse<PlacementJob | null>> {
    return academicsCall(() => apiClient.post('/placements/jobs', input), null, 'The job could not be created.');
  },

  async updatePlacementJob(id: string, changes: Partial<PlacementJobInput>): Promise<ApiResponse<Changed<PlacementJob> | null>> {
    return academicsCall(() => apiClient.patch(`/placements/jobs/${encodeURIComponent(id)}`, changes), null, 'The job could not be updated.');
  },

  async setPlacementJobStatus(id: string, status: PlacementJobStatus): Promise<ApiResponse<(PlacementJob & { changed: boolean }) | null>> {
    return academicsCall(() => apiClient.patch(`/placements/jobs/${encodeURIComponent(id)}/status`, { status }), null, 'The job status could not be changed.');
  },

  /** In-app placement alert to students with an active enrollment (BR-013). Once per job. */
  async announcePlacementJob(id: string): Promise<ApiResponse<{ jobId: string; recipientCount: number } | null>> {
    return academicsCall(() => apiClient.post(`/placements/jobs/${encodeURIComponent(id)}/announce`, {}), null, 'The placement alert could not be sent.');
  },

  /** Read-only: criteria cannot be edited until their vocabulary is approved (PLC-003/PLC-015). */
  async getJobEligibility(id: string): Promise<ApiResponse<PlacementEligibilityCriterion[]>> {
    return academicsCall(() => apiClient.get(`/placements/jobs/${encodeURIComponent(id)}/eligibility`), [], 'Eligibility criteria could not be loaded.');
  },

  async getPlacementApplications(filter: { jobId?: string; companyId?: string; status?: PlacementApplicationStatus } = {}): Promise<ApiResponse<PlacementApplication[]>> {
    return academicsCall(() => apiClient.get('/placements/applications', { params: filter }), [], 'Applications could not be loaded.');
  },

  async updatePlacementApplicationStatus(id: string, status: PlacementApplicationStatus, reason?: string): Promise<ApiResponse<PlacementApplication | null>> {
    return academicsCall(
      () => apiClient.patch(`/placements/applications/${encodeURIComponent(id)}/status`, { status, ...(reason ? { reason } : {}) }),
      null,
      'The application status could not be changed.'
    );
  },

  async getApplicationHistory(id: string): Promise<ApiResponse<PlacementStatusChange[]>> {
    return academicsCall(() => apiClient.get(`/placements/applications/${encodeURIComponent(id)}/history`), [], 'History could not be loaded.');
  },

  async getInterviewRounds(applicationId: string): Promise<ApiResponse<PlacementRound[]>> {
    return academicsCall(() => apiClient.get(`/placements/applications/${encodeURIComponent(applicationId)}/rounds`), [], 'Interview rounds could not be loaded.');
  },

  async createInterviewRound(
    applicationId: string,
    input: { roundName: string; roundNumber?: number; scheduledAt?: string; meetingUrl?: string }
  ): Promise<ApiResponse<PlacementRound | null>> {
    return academicsCall(() => apiClient.post(`/placements/applications/${encodeURIComponent(applicationId)}/rounds`, input), null, 'The interview round could not be added.');
  },

  async updateInterviewRound(
    roundId: string,
    changes: { roundName?: string; scheduledAt?: string | null; meetingUrl?: string | null; feedback?: string | null }
  ): Promise<ApiResponse<Changed<PlacementRound> | null>> {
    return academicsCall(() => apiClient.patch(`/placements/rounds/${encodeURIComponent(roundId)}`, changes), null, 'The interview round could not be updated.');
  },

  async getApplicationOffers(applicationId: string): Promise<ApiResponse<PlacementOffer[]>> {
    return academicsCall(() => apiClient.get(`/placements/applications/${encodeURIComponent(applicationId)}/offers`), [], 'Offers could not be loaded.');
  },

  /** The offer letter file cannot be stored yet (no file storage). */
  async createPlacementOffer(
    applicationId: string,
    input: { offerReference: string; offeredSalary?: number; offerDate?: string; joiningDate?: string }
  ): Promise<ApiResponse<PlacementOffer | null>> {
    return academicsCall(() => apiClient.post(`/placements/applications/${encodeURIComponent(applicationId)}/offers`, input), null, 'The offer could not be recorded.');
  },

  async getPlacementRecords(): Promise<ApiResponse<PlacementRecordRow[]>> {
    return academicsCall(() => apiClient.get('/placements/records'), [], 'Placement records could not be loaded.');
  },

  async createPlacementRecord(input: { jobApplicationId: string; offerId?: string; joiningDate?: string }): Promise<ApiResponse<PlacementRecordRow | null>> {
    return academicsCall(() => apiClient.post('/placements/records', { ...input, verificationStatus: 'pending' }), null, 'The placement record could not be created.');
  },

  async verifyPlacementRecord(id: string): Promise<ApiResponse<PlacementRecordRow | null>> {
    return academicsCall(() => apiClient.patch(`/placements/records/${encodeURIComponent(id)}/verify`, {}), null, 'The placement record could not be verified.');
  },

  async getEmployerFeedback(companyId?: string): Promise<ApiResponse<EmployerFeedback[]>> {
    return academicsCall(() => apiClient.get('/placements/feedback', { params: companyId ? { companyId } : {} }), [], 'Employer feedback could not be loaded.');
  },

  async createEmployerFeedback(companyId: string, input: { feedbackText: string; jobApplicationId?: string }): Promise<ApiResponse<EmployerFeedback | null>> {
    return academicsCall(() => apiClient.post(`/placements/companies/${encodeURIComponent(companyId)}/feedback`, input), null, 'The feedback could not be recorded.');
  },

  async getPlacementAnalytics(): Promise<ApiResponse<PlacementAnalyticsData | null>> {
    return academicsCall(() => apiClient.get('/placements/analytics'), null, 'Placement analytics could not be loaded.');
  },

  async getPlacementPackages(): Promise<ApiResponse<PlacementPackageRow[]>> {
    return academicsCall(() => apiClient.get('/placements/packages'), [], 'Placement packages could not be loaded.');
  },

  async getMockInterviews(): Promise<ApiResponse<AdminMockInterview[]>> {
    return academicsCall(() => apiClient.get('/placements/mock-interviews/all'), [], 'Mock interviews could not be loaded.');
  },

  /** The interviewer must be a teacher and the candidate an eligible student (server-checked). */
  async scheduleMockInterview(input: { studentUserId: string; teacherUserId: string; scheduledAt: string; meetingUrl?: string }): Promise<ApiResponse<AdminMockInterview | null>> {
    return academicsCall(() => apiClient.post('/placements/mock-interviews/schedule', input), null, 'The mock interview could not be scheduled.');
  },

  /** Only a scheduled interview can be evaluated or cancelled; results are never overwritten. */
  async evaluateMockInterview(
    id: string,
    input: { overallScore: number; feedback: string; status: 'completed' | 'cancelled' }
  ): Promise<ApiResponse<AdminMockInterview | null>> {
    return academicsCall(() => apiClient.post(`/placements/mock-interviews/${encodeURIComponent(id)}/evaluate`, input), null, 'The evaluation could not be saved.');
  },

  async getInterviewQuestions(includeInactive = true): Promise<ApiResponse<AdminInterviewQuestion[]>> {
    return academicsCall(() => apiClient.get('/placements/questions', { params: includeInactive ? { includeInactive: 'true' } : {} }), [], 'Questions could not be loaded.');
  },

  async addInterviewQuestion(input: { category: string; questionText: string; difficultyLevel: QuestionDifficulty; sampleAnswer?: string }): Promise<ApiResponse<AdminInterviewQuestion | null>> {
    return academicsCall(() => apiClient.post('/placements/questions', input), null, 'The question could not be added.');
  },

  async updateInterviewQuestion(
    id: string,
    changes: { category?: string; questionText?: string; difficultyLevel?: QuestionDifficulty; sampleAnswer?: string | null }
  ): Promise<ApiResponse<Changed<AdminInterviewQuestion> | null>> {
    return academicsCall(() => apiClient.patch(`/placements/questions/${encodeURIComponent(id)}`, changes), null, 'The question could not be updated.');
  },

  async setInterviewQuestionActive(id: string, isActive: boolean): Promise<ApiResponse<Changed<AdminInterviewQuestion> | null>> {
    return academicsCall(() => apiClient.patch(`/placements/questions/${encodeURIComponent(id)}/status`, { isActive }), null, 'The question status could not be changed.');
  },

  /**
   * 12. Notifications & Broadcast Alerts (ADM-013) - live backend only.
   *
   *   POST /support/notifications/send       one recipient (numeric user id)
   *   POST /support/notifications/broadcast  audience = backend role codes;
   *                                          returns the real recipient count
   *
   * The backend delivers in-app notifications only (no email / WhatsApp
   * provider is configured), and it does not list sent notifications. The
   * broadcast history shown to Admins is the audit trail of BROADCAST_NOTIFICATION
   * records (module COMMUNICATION).
   */
  async sendNotification(data: {
    recipientUserId: string;
    title: string;
    messageBody: string;
    notificationType: AdminNotificationType;
    priority?: 'low' | 'normal' | 'high';
  }): Promise<ApiResponse<{ id: string; recipientUserId: string }>> {
    try {
      const res = await apiClient.post('/support/notifications/send', {
        recipientUserId: data.recipientUserId,
        title: data.title.trim(),
        messageBody: data.messageBody,
        notificationType: data.notificationType,
        priority: data.priority ?? 'normal',
      });
      const n = res.data?.data;
      if (!n?.id) return { success: false, data: null as any, error: 'The server did not confirm the notification.' };
      return { success: true, data: { id: String(n.id), recipientUserId: String(n.recipientUserId) }, message: res.data?.message };
    } catch (err: any) {
      return { success: false, data: null as any, error: apiErrorMessage(err, 'The notification could not be sent.') };
    }
  },

  async broadcastNotification(data: {
    audience: BroadcastAudienceRole[];
    title: string;
    messageBody: string;
    notificationType: AdminNotificationType;
    priority?: 'low' | 'normal' | 'high';
  }): Promise<ApiResponse<{ recipientCount: number }>> {
    try {
      const res = await apiClient.post('/support/notifications/broadcast', {
        audience: data.audience,
        title: data.title.trim(),
        messageBody: data.messageBody,
        notificationType: data.notificationType,
        priority: data.priority ?? 'normal',
      });
      const count = res.data?.data?.recipientCount;
      if (typeof count !== 'number') {
        return { success: false, data: null as any, error: 'The server did not confirm the broadcast.' };
      }
      return { success: true, data: { recipientCount: count }, message: res.data?.message };
    } catch (err: any) {
      return { success: false, data: null as any, error: apiErrorMessage(err, 'The broadcast could not be sent.') };
    }
  },

  /** Broadcasts as recorded in the activity log (the only server-side send history). */
  async getBroadcastHistory(): Promise<ApiResponse<AuditLog[]>> {
    const res = await this.getActivityLogs({ moduleCode: 'COMMUNICATION' });
    if (!res.success) return res;
    return { success: true, data: res.data.filter((l) => l.action === 'BROADCAST_NOTIFICATION') };
  },

  /**
   * 13. Support Ticket Management (ADM-016) - live backend only.
   *
   *   GET   /support/admin/tickets               list (no conversation)
   *   GET   /support/tickets/:id                 one ticket with replies (internal notes included for staff)
   *   POST  /support/tickets/:id/replies         reply (staff reply moves an open ticket to in_progress)
   *   PATCH /support/admin/tickets/:id/status    status and/or assignee (Admin / Super Admin only)
   */
  async getTickets(filter: { status?: TicketStatus } = {}): Promise<ApiResponse<SupportTicket[]>> {
    try {
      const res = await apiClient.get('/support/admin/tickets', { params: filter.status ? { status: filter.status } : {} });
      const items = res.data?.data ?? [];
      return { success: true, data: Array.isArray(items) ? items.map(fromBackendTicket) : [] };
    } catch (err: any) {
      return { success: false, data: [], error: apiErrorMessage(err, 'Support tickets could not be loaded.') };
    }
  },

  async getTicket(ticketId: string): Promise<ApiResponse<SupportTicket>> {
    try {
      const res = await apiClient.get(`/support/tickets/${encodeURIComponent(ticketId)}`);
      return { success: true, data: fromBackendTicket(res.data?.data) };
    } catch (err: any) {
      return { success: false, data: null as any, error: apiErrorMessage(err, 'The ticket could not be loaded.') };
    }
  },

  async replyTicket(ticketId: string, replyText: string, isInternal = false): Promise<ApiResponse<{ id: string }>> {
    try {
      const res = await apiClient.post(`/support/tickets/${encodeURIComponent(ticketId)}/replies`, { replyText, isInternal });
      const id = res.data?.data?.id;
      if (!id) return { success: false, data: null as any, error: 'The server did not confirm the reply.' };
      return { success: true, data: { id: String(id) } };
    } catch (err: any) {
      return { success: false, data: null as any, error: apiErrorMessage(err, 'The reply could not be posted.') };
    }
  },

  async updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    assignedToUserId?: string
  ): Promise<ApiResponse<SupportTicket>> {
    try {
      const res = await apiClient.patch(`/support/admin/tickets/${encodeURIComponent(ticketId)}/status`, {
        status,
        ...(assignedToUserId ? { assignedToUserId } : {}),
      });
      return { success: true, data: fromBackendTicket(res.data?.data) };
    } catch (err: any) {
      return { success: false, data: null as any, error: apiErrorMessage(err, 'The ticket could not be updated.') };
    }
  },

  /**
   * 14. Activity Logs (ADM-016)
   */
  /**
   * GET /admin/activity-logs (NXA_AuditLogs, newest first, max 200 per call).
   * Dates are YYYY-MM-DD in the institute time zone (IST).
   */
  async getActivityLogs(
    filter: { moduleCode?: string; startDate?: string; endDate?: string } = {}
  ): Promise<ApiResponse<AuditLog[]>> {
    if (USE_DEV_MOCKS) {
      await sleep();
      const logs = getStorageItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
      return { success: true, data: logs };
    }

    try {
      const params: Record<string, string> = {};
      if (filter.moduleCode) params.moduleCode = filter.moduleCode;
      // Whole IST days -> UTC instants.
      if (filter.startDate) params.startDate = new Date(`${filter.startDate}T00:00:00+05:30`).toISOString();
      if (filter.endDate) params.endDate = new Date(`${filter.endDate}T23:59:59.999+05:30`).toISOString();
      const res = await apiClient.get('/admin/activity-logs', { params });
      const items: BackendAuditLog[] = res.data?.data?.items ?? res.data?.data ?? [];
      return { success: true, data: Array.isArray(items) ? items.map(fromBackendAuditLog) : [] };
    } catch (err: any) {
      return { success: false, data: [], error: apiErrorMessage(err, 'Failed to fetch activity logs.') };
    }
  },

  /**
   * 16. Institute Settings (ADM-016)
   */
  async getInstituteSettings(): Promise<ApiResponse<InstituteSettings>> {
    try {
      const res = await apiClient.get('/admin/settings');
      return { success: true, data: res.data?.data ?? {} };
    } catch (err: any) {
      return { success: false, data: {}, error: apiErrorMessage(err, 'Failed to fetch institute settings.') };
    }
  },

  /** Sends only the changed fields; the server audits old and new values. */
  async saveInstituteSettings(changes: Partial<InstituteSettings>): Promise<ApiResponse<InstituteSettings>> {
    try {
      const res = await apiClient.put('/admin/settings', changes);
      return { success: true, data: res.data?.data ?? {}, message: res.data?.message || 'Institute settings saved.' };
    } catch (err: any) {
      return { success: false, data: {}, error: apiErrorMessage(err, 'Failed to save institute settings.') };
    }
  },

  /** Every setting with who may change it and whether it is applied or blocked (and why). */
  async getSettingsCatalog(): Promise<ApiResponse<SettingDefinition[]>> {
    try {
      const res = await apiClient.get('/admin/settings/catalog');
      return { success: true, data: res.data?.data ?? [] };
    } catch (err: any) {
      return { success: false, data: [], error: apiErrorMessage(err, 'The settings catalog could not be loaded.') };
    }
  },

  // ---- SUP-005 ticket status history
  async getTicketHistory(ticketId: string): Promise<ApiResponse<TicketStatusChange[]>> {
    return academicsCall(() => apiClient.get(`/support/admin/tickets/${encodeURIComponent(ticketId)}/history`), [], 'The ticket history could not be loaded.');
  },

  // ---- SUP-006 ticket categories (deactivate instead of delete)
  async getSupportCategories(): Promise<ApiResponse<SupportCategoryAdmin[]>> {
    return academicsCall(() => apiClient.get('/support/admin/categories'), [], 'Categories could not be loaded.');
  },
  async createSupportCategory(name: string): Promise<ApiResponse<SupportCategoryAdmin | null>> {
    return academicsCall(() => apiClient.post('/support/admin/categories', { name }), null, 'The category could not be created.');
  },
  async updateSupportCategory(id: string, changes: { name?: string; isActive?: boolean }): Promise<ApiResponse<SupportCategoryAdmin | null>> {
    return academicsCall(() => apiClient.patch(`/support/admin/categories/${encodeURIComponent(id)}`, changes), null, 'The category could not be updated.');
  },

  // ---- COM-008 notification history across recipients
  async getNotificationHistory(filter: NotificationHistoryQuery): Promise<ApiResponse<NotificationHistoryPage | null>> {
    const params = Object.fromEntries(Object.entries(filter).filter(([, v]) => v !== undefined && v !== ''));
    return academicsCall(() => apiClient.get('/support/admin/notifications', { params }), null, 'Notification history could not be loaded.');
  },
};

export interface EvaluationVersion {
  id: string;
  evaluationVersion: number;
  marksAwarded: number;
  feedback?: string;
  evaluatedByUserId: string;
  evaluatedByName?: string;
  evaluatedAt: string;
}

export interface TicketStatusChange {
  id: string;
  previousStatus?: string;
  newStatus: string;
  changedByUserId?: string;
  changedByName?: string;
  changeReason?: string;
  changedAt: string;
}

export interface SupportCategoryAdmin {
  id: string;
  name: string;
  isActive: boolean;
}

export interface NotificationHistoryQuery {
  recipientUserId?: string;
  notificationType?: string;
  from?: string;
  to?: string;
  search?: string;
  page: number;
  pageSize: number;
}

export interface NotificationHistoryPage {
  rows: Array<{
    id: string;
    recipientUserId: string;
    recipientName?: string;
    notificationType: string;
    title: string;
    messageBody: string;
    priority: string;
    readAt?: string;
    createdAt: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** ATT-010: the server applies D2 (Present ÷ marked sessions; Leave not attended; unmarked not counted). */
export interface AttendanceSummaryRow {
  studentUserId: string;
  studentName?: string;
  present: number;
  absent: number;
  leave: number;
  /** Records with a status outside Present / Absent / Leave; not part of the percentage. */
  other: number;
  markedSessions?: number;
  /** null when nothing is marked. */
  attendancePercentage?: number | null;
  attendancePercentageDisplay?: string | null;
  belowMinimum?: boolean | null;
}

export interface AttendanceSummary {
  batchId: string;
  heldSessions: number;
  minimumAttendancePercentage?: number;
  students: AttendanceSummaryRow[];
}

export interface SettingDefinition {
  key: string;
  label: string;
  group: 'institute' | 'academic' | 'courses' | 'payments' | 'notifications' | 'security' | 'system';
  type: 'text' | 'email' | 'phone' | 'number' | 'boolean';
  editableBy: 'admin' | 'super_admin';
  /** stored: saved and validated, but its consumers are not available yet (see note). */
  status: 'applied' | 'profile' | 'stored' | 'blocked';
  note: string;
  min?: number;
  max?: number;
  /** Value in force when never saved. */
  defaultValue?: number | boolean;
}
