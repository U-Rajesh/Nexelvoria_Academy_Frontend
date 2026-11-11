/**
 * Direct mapping of Business Rules BR-001 through BR-018 from SRS v1.0
 */
export const BUSINESS_RULES = {
  // BR-001: Students must verify both email and mobile OTP
  DUAL_OTP_REQUIRED: true,

  // BR-002: Admin approval required before course payment
  ADMIN_APPROVAL_BEFORE_PAYMENT: true,

  // BR-003: Unpaid students receive preview access only
  PREVIEW_ONLY_FOR_UNPAID: true,

  // BR-005: Installment payments are not supported (lump sum only)
  INSTALLMENT_PAYMENT_SUPPORTED: false,

  // BR-006: Refund approval restricted to Super Admin
  REFUND_APPROVAL_SUPER_ADMIN_ONLY: true,

  // BR-010: Attendance statuses strictly Present, Absent, and Leave
  ATTENDANCE_STATUSES: ['present', 'absent', 'leave'] as const,

  // BR-011: Certificate threshold criteria
  MIN_ATTENDANCE_FOR_CERTIFICATE: 75, // in percentage
  MIN_EXAM_SCORE_FOR_CERTIFICATE: 60, // in percentage

  // BR-013: Placement portal access restricted to paid/enrolled students
  RESTRICT_PLACEMENT_TO_PAID: true,

  // BR-014: SMS disabled at launch
  SMS_SERVICE_ENABLED: false,

  // BR-015: Meeting links are manually configured (e.g. Google Meet, Zoom)
  MANUAL_MEETING_LINKS: true,

  // Configurable Placeholders / Pending items per SRS Section 13
  TBD_ITEMS: {
    BATCH_CAPACITY_PENDING: 'Batch capacity limits pending administrative confirmation',
    REFUND_WINDOW_DAYS_PENDING: 'Refund eligibility window pending policy confirmation',
    PLACEMENT_GUARANTEE_TERMS_PENDING: 'Placement guarantee legal agreement pending execution',
    COURSE_PASSING_MARKS_OVERRIDE_PENDING: 'Course-specific passing thresholds pending academic board review',
  },
};

