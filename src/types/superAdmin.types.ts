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

export interface SystemConfig {
  institute: {
    name: string;
    code: string;
    affiliation: string;
    supportEmail: string;
    supportPhone: string;
    whatsappNumber: string;
    address: string;
    website: string;
    gstNumber: string;
    currency: string;
    timezone: string;
  };
  branding: {
    logoUrl: string;
    faviconUrl: string;
    primaryColor: string;
    secondaryColor: string;
    tagline: string;
    motto: string;
  };
  academic: {
    currentAcademicYear: string;
    activeTerm: string;
    isRegistrationOpen: boolean;
    isCatalogPublic: boolean;
    maxBatchCapacity: number;
    minAttendancePercentage: number;
    assignmentGracePeriodDays: number;
    passPercentage: number;
  };
  paymentGateway: {
    provider: 'razorpay' | 'stripe' | 'cashfree';
    keyId: string;
    keySecretMasked: string;
    webhookSecretMasked: string;
    isLiveMode: boolean;
    autoReconcile: boolean;
  };
  emailSms: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPasswordMasked: string;
    senderName: string;
    senderEmail: string;
    isSmsEnabled: boolean;
    smsProvider: string;
    smsApiKeyMasked: string;
  };
  notifications: {
    emailOnAdmission: boolean;
    emailOnPayment: boolean;
    emailOnExamResult: boolean;
    smsOnClassReminder: boolean;
    pushAnnouncements: boolean;
  };
  security: {
    sessionTimeoutMinutes: number;
    enforceTwoFactor: boolean;
    maxFailedLogins: number;
    passwordExpiryDays: number;
    requireSpecialChars: boolean;
  };
  maintenance: {
    isMaintenanceMode: boolean;
    message: string;
    allowedIps: string;
  };
  preferences: {
    dateFormat: string;
    timeFormat: string;
    numberFormat: 'inr_lakhs' | 'international';
    defaultLanguage: string;
  };
}

export interface GlobalRole {
  id: string;
  name: string;
  slug: string;
  description: string;
  isSystemRole: boolean;
  userCount: number;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SuperAdminDashboardStats {
  totalStudents: number;
  totalAdmins: number;
  totalTeachers: number;
  totalCourses: number;
  totalBatches: number;
  totalEnrollments: number;
  totalRevenueINR: number;
  outstandingFeesINR: number;
  pendingRefundsCount: number;
  pendingRefundsAmountINR: number;
  pendingOverridesCount: number;
  pendingOverridesAmountINR: number;
  placementRatePercentage: number;
  totalPlacedStudents: number;
  activeHiringPartners: number;
  averageAttendancePercentage: number;
}

