export type FinancialOverrideStatus = 'pending' | 'approved' | 'rejected';

export type FinancialAdjustmentType =
  | 'merit_scholarship'
  | 'hardship_waiver'
  | 'special_discount'
  | 'fee_correction'
  | 'corporate_grant';

export interface FinancialOverrideRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  enrollmentId: string;
  originalAmountINR: number;
  proposedAmountINR: number;
  discountOrWaiverINR: number;
  adjustmentType: FinancialAdjustmentType;
  reason: string;
  requestedByAdminId: string;
  requestedByAdminName: string;
  requestedAt: string;
  status: FinancialOverrideStatus;
  decidedAt?: string;
  decidedBySuperAdminId?: string;
  superAdminRemarks?: string;
}

/** GET /super-admin/system-config: what the server actually runs with. No secrets. */
export interface SystemConfigStatus {
  source: 'server_environment';
  editable: false;
  email: {
    delivery: 'smtp' | 'development_log' | 'not_configured';
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    from?: string;
    configurationError?: string;
  };
  sms: { configured: false; note: string };
  /** Presence only: no secret value is ever returned, and nothing claims a provider was verified. */
  integrations: {
    paymentGateway: { provider: 'razorpay'; webhookSecretConfigured: boolean; checkoutIntegrated: false; verified: false; note: string };
    fileStorage: { configured: false; note: string };
    whatsapp: { configured: false; note: string };
    backups: { configured: false; note: string };
  };
  security: {
    maxFailedLoginAttempts: number;
    passwordMinLength: number;
    accessTokenTtlMinutes: number;
    refreshTokenTtlDays: number;
    rememberMeRefreshTokenTtlDays: number;
  };
  otp: { channel: 'email'; ttlMinutes: number; maxVerifyAttempts: number; resendCooldownSeconds: number };
  reporting: { timezone: string; financialYear: string; financialYearStartsAt: string };
  environment: string;
}

/** A row of NXA_Roles as returned by GET /super-admin/roles. */
export interface GlobalRole {
  id: string;
  name: string;
  /** RoleCode. */
  slug: string;
  description: string;
  isSystemRole: boolean;
  isActive: boolean;
  /** Empty until the permission catalog is verified; never invented. */
  permissions: string[];
  createdAt: string;
}

/** `null` means "not available": no data source or no approved formula yet. */
export interface SuperAdminDashboardStats {
  totalStudents: number;
  totalAdmins: number;
  totalTeachers: number;
  totalCourses: number;
  totalBatches: number;
  totalEnrollments: number;
  totalRevenueINR: number | null;
  /** Collected since 1 April of the current Indian financial year (IST). */
  revenueYearToDateINR?: number | null;
  /** e.g. "FY 2026-27"; absent when the server did not report it. */
  financialYearLabel?: string;
  /** Collected since the 1st of this month. */
  revenueThisMonthINR?: number | null;
  outstandingFeesINR: number;
  pendingRefundsCount: number | null;
  pendingRefundsAmountINR: number | null;
  pendingOverridesCount: number | null;
  pendingOverridesAmountINR: number | null;
  placementRatePercentage: number | null;
  totalPlacedStudents: number | null;
  activeHiringPartners: number | null;
  averageAttendancePercentage: number | null;
}

