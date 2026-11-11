import { STORAGE_KEYS } from '../constants/appConfig';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { SEED_USERS, SEED_COURSES, SEED_BATCHES, SEED_PAYMENTS } from '../mocks/seedData';
import type {
  AdminProfile,
  RefundRequest,
  AuditLog,
  PaymentTransaction,
  ApiResponse,
  FinancialOverrideRequest,
  SystemConfig,
  GlobalRole,
  SuperAdminDashboardStats,
} from '../types';

const sleep = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

const SEED_ADMINS: AdminProfile[] = [
  SEED_USERS.admin,
  {
    id: 'user-adm-002',
    name: 'Rajesh Verma',
    email: 'rajesh.verma@nexelvoria.edu.in',
    mobile: '+91 98765 11223',
    role: 'admin',
    status: 'active',
    department: 'Admissions & Student Welfare',
    permissions: [
      'manage_students',
      'approve_students',
      'manual_payment_entry',
      'manage_discounts',
      'view_reports',
    ],
    createdAt: '2026-06-15T09:30:00Z',
    lastLoginIp: '192.168.1.102',
  },
  {
    id: 'user-adm-003',
    name: 'Sunita Rao',
    email: 'sunita.rao@nexelvoria.edu.in',
    mobile: '+91 98765 33445',
    role: 'admin',
    status: 'suspended',
    department: 'Examination & Assessments',
    permissions: [
      'manage_tests',
      'manage_certificates',
      'view_reports',
    ],
    createdAt: '2026-07-01T10:00:00Z',
    lastLoginIp: '192.168.1.140',
  },
];

const SEED_REFUNDS: RefundRequest[] = [
  {
    id: 'ref-001',
    transactionId: 'pay-001',
    studentId: 'user-stu-001',
    studentName: 'Rohan Sharma',
    courseId: 'course-fsd-01',
    courseTitle: 'Full Stack Java & Cloud Microservices',
    amountINR: 38000,
    reason: 'Relocating abroad for on-campus master degree program in Germany.',
    status: 'pending_super_admin',
    requestedAt: '2026-11-08T11:00:00Z',
  },
  {
    id: 'ref-002',
    transactionId: 'pay-002',
    studentId: 'user-stu-002',
    studentName: 'Ananya Sen',
    courseId: 'course-ds-01',
    courseTitle: 'Data Science, Machine Learning & AI',
    amountINR: 42000,
    reason: 'Medical condition preventing participation in intense practical batches.',
    status: 'approved',
    requestedAt: '2026-10-28T14:30:00Z',
    decidedAt: '2026-10-30T10:15:00Z',
    decidedBySuperAdminId: 'user-super-001',
    superAdminRemarks: 'Medical certificates and hospital receipts verified. Approved in full.',
  },
  {
    id: 'ref-003',
    transactionId: 'pay-003',
    studentId: 'user-stu-003',
    studentName: 'Deepak Patel',
    courseId: 'course-devops-01',
    courseTitle: 'DevOps, Docker & Kubernetes Engineering',
    amountINR: 18000,
    reason: 'Unhappy with evening class timing after 3 weeks of attendance.',
    status: 'rejected',
    requestedAt: '2026-10-15T09:00:00Z',
    decidedAt: '2026-10-16T16:45:00Z',
    decidedBySuperAdminId: 'user-super-001',
    superAdminRemarks: 'Refund request submitted beyond 7-day institute cancellation policy. Student already attended 8 sessions.',
  },
];

const SEED_FINANCIAL_OVERRIDES: FinancialOverrideRequest[] = [
  {
    id: 'fov-001',
    studentId: 'user-stu-004',
    studentName: 'Amit Verma',
    studentEmail: 'amit.verma@example.com',
    courseId: 'course-fsd-01',
    courseTitle: 'Full Stack Java & Cloud Microservices',
    enrollmentId: 'enr-004',
    originalAmountINR: 45000,
    proposedAmountINR: 30000,
    discountOrWaiverINR: 15000,
    adjustmentType: 'merit_scholarship',
    reason: 'State entrance exam rank holder (Rank #24); 96% in B.Tech Computer Science.',
    requestedByAdminId: 'user-adm-001',
    requestedByAdminName: 'Priya Nair',
    requestedAt: '2026-11-09T10:30:00Z',
    status: 'pending',
  },
  {
    id: 'fov-002',
    studentId: 'user-stu-005',
    studentName: 'Sneha Kulkarni',
    studentEmail: 'sneha.k@example.com',
    courseId: 'course-ds-01',
    courseTitle: 'Data Science, Machine Learning & AI',
    enrollmentId: 'enr-005',
    originalAmountINR: 50000,
    proposedAmountINR: 35000,
    discountOrWaiverINR: 15000,
    adjustmentType: 'hardship_waiver',
    reason: 'Parent hospitalization during admission; requested financial consideration.',
    requestedByAdminId: 'user-adm-002',
    requestedByAdminName: 'Rajesh Verma',
    requestedAt: '2026-11-10T12:00:00Z',
    status: 'pending',
  },
  {
    id: 'fov-003',
    studentId: 'user-stu-006',
    studentName: 'Vikram Singh',
    studentEmail: 'vikram.singh@example.com',
    courseId: 'course-devops-01',
    courseTitle: 'DevOps, Docker & Kubernetes Engineering',
    enrollmentId: 'enr-006',
    originalAmountINR: 40000,
    proposedAmountINR: 32000,
    discountOrWaiverINR: 8000,
    adjustmentType: 'corporate_grant',
    reason: 'TCS institutional referral batch corporate concession voucher applied.',
    requestedByAdminId: 'user-adm-001',
    requestedByAdminName: 'Priya Nair',
    requestedAt: '2026-10-25T15:20:00Z',
    status: 'approved',
    decidedAt: '2026-10-26T09:40:00Z',
    decidedBySuperAdminId: 'user-super-001',
    superAdminRemarks: 'Corporate employee ID and HR referral verified. Concession approved.',
  },
];

const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  institute: {
    name: 'Nexelvoria Academy',
    code: 'NEX-ACAD-2024',
    affiliation: 'ISO 9001:2015 & NSDC Accredited Institute',
    supportEmail: 'admissions@nexelvoria.edu.in',
    supportPhone: '+91 98765 43210',
    whatsappNumber: '+91 98765 43210',
    address: 'Nexelvoria Tech Tower, Financial District, Hyderabad, Telangana 500032',
    website: 'https://nexelvoria.edu.in',
    gstNumber: '36AAACN1234F1Z5',
    currency: 'INR (₹)',
    timezone: 'Asia/Kolkata (IST)',
  },
  branding: {
    logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=180&q=80',
    faviconUrl: '/favicon.ico',
    primaryColor: '#e11d48',
    secondaryColor: '#0f172a',
    tagline: 'Bridging Talent with Industry Excellence',
    motto: 'Transforming learners into high-impact software leaders',
  },
  academic: {
    currentAcademicYear: '2026-2027',
    activeTerm: 'Fall Cohort',
    isRegistrationOpen: true,
    isCatalogPublic: true,
    maxBatchCapacity: 40,
    minAttendancePercentage: 75,
    assignmentGracePeriodDays: 2,
    passPercentage: 60,
  },
  paymentGateway: {
    provider: 'razorpay',
    keyId: 'rzp_live_89aB12cdEF34gh',
    keySecretMasked: '••••••••••••••••••••••••••••••••',
    webhookSecretMasked: '••••••••••••••••••••••••••••••••',
    isLiveMode: true,
    autoReconcile: true,
  },
  emailSms: {
    smtpHost: 'smtp.sendgrid.net',
    smtpPort: 587,
    smtpUser: 'apikey',
    smtpPasswordMasked: '••••••••••••••••••••••••••••••••',
    senderName: 'Nexelvoria Academy Academic Office',
    senderEmail: 'notifications@nexelvoria.edu.in',
    isSmsEnabled: false, // BR-014 Enforced
    smsProvider: 'Twilio / MSG91 (Disabled BR-014)',
    smsApiKeyMasked: '••••••••••••••••••••••••••••••••',
  },
  notifications: {
    emailOnAdmission: true,
    emailOnPayment: true,
    emailOnExamResult: true,
    smsOnClassReminder: false,
    pushAnnouncements: true,
  },
  security: {
    sessionTimeoutMinutes: 60,
    enforceTwoFactor: true,
    maxFailedLogins: 5,
    passwordExpiryDays: 90,
    requireSpecialChars: true,
  },
  maintenance: {
    isMaintenanceMode: false,
    message: 'Nexelvoria Academy LMS is undergoing scheduled maintenance. Services will resume shortly.',
    allowedIps: '192.168.1.1, 10.0.0.1, 127.0.0.1',
  },
  preferences: {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-Hour (AM/PM)',
    numberFormat: 'inr_lakhs',
    defaultLanguage: 'English (IN)',
  },
};

const SEED_GLOBAL_ROLES: GlobalRole[] = [
  {
    id: 'role-super-admin',
    name: 'Super Administrator',
    slug: 'super_admin',
    description: 'System Owner with root authority, financial overrides, refund approvals, and admin account management.',
    isSystemRole: true,
    userCount: 1,
    permissions: ['all_permissions', 'manage_admins', 'approve_refunds', 'financial_overrides', 'system_config'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2026-11-10T00:00:00Z',
  },
  {
    id: 'role-admin',
    name: 'Administrator',
    slug: 'admin',
    description: 'Academic and operational administrators managing students, courses, batches, manual payments, and LMS content.',
    isSystemRole: true,
    userCount: 2,
    permissions: ['manage_students', 'approve_students', 'manage_courses', 'manage_batches', 'manage_teachers', 'manual_payments', 'view_reports'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2026-11-10T00:00:00Z',
  },
  {
    id: 'role-teacher',
    name: 'Teaching Faculty',
    slug: 'teacher',
    description: 'Instructors and faculty members managing attendance, course materials, assignments, evaluations, and doubts.',
    isSystemRole: true,
    userCount: 6,
    permissions: ['view_assigned_courses', 'mark_attendance', 'upload_materials', 'evaluate_assignments', 'create_tests'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2026-11-10T00:00:00Z',
  },
  {
    id: 'role-student',
    name: 'Student Learner',
    slug: 'student',
    description: 'Enrolled students accessing course syllabus, live classes, assignments, tests, receipts, and certificates.',
    isSystemRole: true,
    userCount: 42,
    permissions: ['view_enrolled_courses', 'attend_live_classes', 'submit_assignments', 'take_tests', 'download_certificates'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2026-11-10T00:00:00Z',
  },
  {
    id: 'role-placement-officer',
    name: 'Placement & Corporate Relations Officer',
    slug: 'placement_officer',
    description: 'Specialized role for coordinating company partnerships, mock interviews, and student job drives.',
    isSystemRole: false,
    userCount: 1,
    permissions: ['manage_placements', 'schedule_mock_interviews', 'view_student_resumes', 'export_placement_reports'],
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-11-05T00:00:00Z',
  },
];

const SEED_RICH_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    timestamp: '2026-11-11T06:45:12Z',
    actorId: 'user-super-001',
    actorName: 'Narayana Murthy (Primary Owner)',
    actorRole: 'super_admin',
    action: 'ADMIN_ACCOUNT_CREATED',
    module: 'admins',
    targetEntity: 'Admin: Rajesh Verma (user-adm-002)',
    details: 'Provisioned new Administrator credentials for Admissions department with 5 granular operational permissions.',
    ipAddress: '103.21.144.12',
    result: 'SUCCESS',
    userAgent: 'Chrome 131.0 / macOS 15.1',
  },
  {
    id: 'log-002',
    timestamp: '2026-11-10T18:15:30Z',
    actorId: 'user-super-001',
    actorName: 'Narayana Murthy (Primary Owner)',
    actorRole: 'super_admin',
    action: 'ROLE_PERMISSIONS_UPDATED',
    module: 'roles_permissions',
    targetEntity: 'Role: teacher (Teaching Faculty)',
    details: 'Saved granular 48-action permission matrix across 22 teaching faculty modules. Isolation verified.',
    ipAddress: '103.21.144.12',
    result: 'SUCCESS',
    userAgent: 'Chrome 131.0 / macOS 15.1',
  },
  {
    id: 'log-003',
    timestamp: '2026-11-10T14:22:05Z',
    actorId: 'user-adm-001',
    actorName: 'Priya Nair',
    actorRole: 'admin',
    action: 'FINANCIAL_OVERRIDE_REQUESTED',
    module: 'financial_overrides',
    targetEntity: 'Override: fov-001 (Amit Verma)',
    details: 'Submitted Merit Scholarship request for ₹15,000 fee waiver based on state entrance rank #24.',
    ipAddress: '192.168.1.45',
    result: 'SUCCESS',
    userAgent: 'Chrome 130.0 / Windows 11',
  },
  {
    id: 'log-004',
    timestamp: '2026-11-08T11:05:00Z',
    actorId: 'user-stu-001',
    actorName: 'Rohan Sharma',
    actorRole: 'student',
    action: 'REFUND_REQUEST_SUBMITTED',
    module: 'refunds',
    targetEntity: 'Refund: ref-001 (₹38,000)',
    details: 'Submitted tuition refund request citing overseas university relocation.',
    ipAddress: '49.207.211.89',
    result: 'SUCCESS',
    userAgent: 'Firefox 132.0 / Windows 11',
  },
  {
    id: 'log-005',
    timestamp: '2026-11-06T09:12:44Z',
    actorId: 'user-adm-003',
    actorName: 'Sunita Rao',
    actorRole: 'admin',
    action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
    module: 'super_admin_portal',
    targetEntity: 'Route: /super-admin/system-config',
    details: 'Denied access attempt to Super Admin System Configuration by standard administrator. Route guard intercepted.',
    ipAddress: '192.168.1.140',
    result: 'DENIED',
    userAgent: 'Edge 130.0 / Windows 10',
  },
  {
    id: 'log-006',
    timestamp: '2026-11-05T12:00:00Z',
    actorId: 'system',
    actorName: 'Razorpay Auto-Reconcile Webhook',
    actorRole: 'system',
    action: 'PAYMENT_RECONCILED',
    module: 'payments',
    targetEntity: 'Order: ORD-2026-0892',
    details: 'Payment webhook verified signature pay_Nx98871239. Auto-reconciled ledger status to Successful.',
    ipAddress: '52.66.182.201',
    result: 'SUCCESS',
    userAgent: 'Razorpay-Webhook-Worker/2.4',
  },
  {
    id: 'log-007',
    timestamp: '2026-11-04T16:40:19Z',
    actorId: 'user-super-001',
    actorName: 'Narayana Murthy (Primary Owner)',
    actorRole: 'super_admin',
    action: 'MAINTENANCE_WINDOW_SCHEDULED',
    module: 'system_config',
    targetEntity: 'System Maintenance Window',
    details: 'Configured scheduled maintenance window for database index optimization on 2026-11-15 02:00 IST.',
    ipAddress: '103.21.144.12',
    result: 'SUCCESS',
    userAgent: 'Chrome 131.0 / macOS 15.1',
  },
];

export const superAdminService = {
  /**
   * 1. Dashboard Overview Stats & Aggregations
   */
  async getDashboardStats(): Promise<ApiResponse<SuperAdminDashboardStats>> {
    await sleep(200);
    const admins = getStorageItem<AdminProfile[]>(STORAGE_KEYS.ADMINS, SEED_ADMINS);
    const refunds = getStorageItem<RefundRequest[]>(STORAGE_KEYS.REFUNDS, SEED_REFUNDS);
    const overrides = getStorageItem<FinancialOverrideRequest[]>(STORAGE_KEYS.FINANCIAL_OVERRIDES, SEED_FINANCIAL_OVERRIDES);
    const payments = getStorageItem<PaymentTransaction[]>(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);

    const pendingRefunds = refunds.filter((r) => r.status === 'pending_super_admin');
    const pendingRefundsAmount = pendingRefunds.reduce((sum, r) => sum + r.amountINR, 0);

    const pendingOverrides = overrides.filter((o) => o.status === 'pending');
    const pendingOverridesAmount = pendingOverrides.reduce((sum, o) => sum + o.discountOrWaiverINR, 0);

    const successfulPayments = payments.filter((p) => p.status === 'successful');
    const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.finalAmountINR, 0);

    const stats: SuperAdminDashboardStats = {
      totalStudents: 48,
      totalAdmins: admins.length,
      totalTeachers: 6,
      totalCourses: SEED_COURSES.length,
      totalBatches: SEED_BATCHES.length,
      totalEnrollments: 52,
      totalRevenueINR: totalRevenue || 485000,
      outstandingFeesINR: 112000,
      pendingRefundsCount: pendingRefunds.length,
      pendingRefundsAmountINR: pendingRefundsAmount,
      pendingOverridesCount: pendingOverrides.length,
      pendingOverridesAmountINR: pendingOverridesAmount,
      placementRatePercentage: 92.4,
      totalPlacedStudents: 38,
      activeHiringPartners: 14,
      averageAttendancePercentage: 86.8,
    };

    return { success: true, data: stats };
  },

  /**
   * 2. Admin Account Management
   */
  async getAdmins(): Promise<ApiResponse<AdminProfile[]>> {
    await sleep(150);
    const admins = getStorageItem<AdminProfile[]>(STORAGE_KEYS.ADMINS, SEED_ADMINS);
    return { success: true, data: admins };
  },

  async createAdmin(
    superAdmin: { id: string; name: string },
    data: { name: string; email: string; mobile: string; department: string; permissions: string[] }
  ): Promise<ApiResponse<AdminProfile>> {
    await sleep(300);
    const admins = getStorageItem<AdminProfile[]>(STORAGE_KEYS.ADMINS, SEED_ADMINS);

    // Validate email uniqueness
    const exists = admins.some((a) => a.email.toLowerCase() === data.email.toLowerCase());
    if (exists) {
      return { success: false, data: null as any, error: 'An admin account with this email address already exists.' };
    }

    const newAdmin: AdminProfile = {
      id: `user-adm-${Date.now()}`,
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      role: 'admin',
      status: 'active',
      department: data.department,
      permissions: data.permissions,
      createdAt: new Date().toISOString(),
      lastLoginIp: 'Not logged in yet',
    };

    const updated = [newAdmin, ...admins];
    setStorageItem(STORAGE_KEYS.ADMINS, updated);

    this.recordSystemAuditLog(
      superAdmin,
      'ADMIN_ACCOUNT_CREATED',
      'admins',
      `Admin: ${newAdmin.name} (${newAdmin.email})`,
      `Created admin for department "${newAdmin.department}" with ${data.permissions.length} active permissions.`,
      'SUCCESS'
    );

    return { success: true, data: newAdmin, message: 'Admin account created successfully.' };
  },

  async updateAdmin(
    superAdmin: { id: string; name: string },
    adminId: string,
    updates: Partial<AdminProfile>
  ): Promise<ApiResponse<AdminProfile>> {
    await sleep(250);
    const admins = getStorageItem<AdminProfile[]>(STORAGE_KEYS.ADMINS, SEED_ADMINS);
    const idx = admins.findIndex((a) => a.id === adminId);
    if (idx === -1) return { success: false, data: null as any, error: 'Admin account not found.' };

    admins[idx] = { ...admins[idx], ...updates };
    setStorageItem(STORAGE_KEYS.ADMINS, admins);

    this.recordSystemAuditLog(
      superAdmin,
      'ADMIN_ACCOUNT_UPDATED',
      'admins',
      `Admin: ${admins[idx].name} (${admins[idx].id})`,
      `Updated admin profile details and permissions.`,
      'SUCCESS'
    );

    return { success: true, data: admins[idx], message: 'Admin details updated successfully.' };
  },

  async toggleAdminStatus(
    superAdmin: { id: string; name: string },
    adminId: string,
    newStatus: 'active' | 'suspended' | 'deactivated',
    reason?: string
  ): Promise<ApiResponse<AdminProfile>> {
    await sleep(250);
    const admins = getStorageItem<AdminProfile[]>(STORAGE_KEYS.ADMINS, SEED_ADMINS);
    const idx = admins.findIndex((a) => a.id === adminId);
    if (idx === -1) return { success: false, data: null as any, error: 'Admin account not found.' };

    const oldStatus = admins[idx].status;
    admins[idx].status = newStatus;
    setStorageItem(STORAGE_KEYS.ADMINS, admins);

    this.recordSystemAuditLog(
      superAdmin,
      `ADMIN_ACCOUNT_${newStatus.toUpperCase()}`,
      'admins',
      `Admin: ${admins[idx].name} (${admins[idx].id})`,
      `Status changed from ${oldStatus} to ${newStatus}. Reason: ${reason || 'Administrative action'}`,
      'SUCCESS'
    );

    return {
      success: true,
      data: admins[idx],
      message: `Admin account has been ${newStatus}.`,
    };
  },

  async resetAdminPassword(
    superAdmin: { id: string; name: string },
    adminId: string
  ): Promise<ApiResponse<{ temporaryPassword: string; resetLink: string }>> {
    await sleep(300);
    const admins = getStorageItem<AdminProfile[]>(STORAGE_KEYS.ADMINS, SEED_ADMINS);
    const admin = admins.find((a) => a.id === adminId);
    if (!admin) return { success: false, data: null as any, error: 'Admin account not found.' };

    const temporaryPassword = `NexPass#${Math.floor(1000 + Math.random() * 9000)}!${admin.name.slice(0, 3)}`;
    const resetLink = `https://nexelvoria.edu.in/reset-password?token=sec_${Date.now()}`;

    this.recordSystemAuditLog(
      superAdmin,
      'ADMIN_PASSWORD_RESET_DISPATCHED',
      'security',
      `Admin: ${admin.name} (${admin.email})`,
      `Super Admin issued credential reset. Temporary password generated.`,
      'SUCCESS'
    );

    return {
      success: true,
      data: { temporaryPassword, resetLink },
      message: 'Temporary password generated successfully.',
    };
  },

  /**
   * 3. System Configuration
   */
  async getSystemConfig(): Promise<ApiResponse<SystemConfig>> {
    await sleep(100);
    const config = getStorageItem<SystemConfig>(STORAGE_KEYS.SYSTEM_CONFIG, DEFAULT_SYSTEM_CONFIG);
    return { success: true, data: config };
  },

  async updateSystemConfig(
    superAdmin: { id: string; name: string },
    updates: Partial<SystemConfig>
  ): Promise<ApiResponse<SystemConfig>> {
    await sleep(350);
    const current = getStorageItem<SystemConfig>(STORAGE_KEYS.SYSTEM_CONFIG, DEFAULT_SYSTEM_CONFIG);
    const merged: SystemConfig = {
      ...current,
      ...updates,
      institute: { ...current.institute, ...updates.institute },
      branding: { ...current.branding, ...updates.branding },
      academic: { ...current.academic, ...updates.academic },
      paymentGateway: { ...current.paymentGateway, ...updates.paymentGateway },
      emailSms: { ...current.emailSms, ...updates.emailSms },
      notifications: { ...current.notifications, ...updates.notifications },
      security: { ...current.security, ...updates.security },
      maintenance: { ...current.maintenance, ...updates.maintenance },
      preferences: { ...current.preferences, ...updates.preferences },
    };

    setStorageItem(STORAGE_KEYS.SYSTEM_CONFIG, merged);

    this.recordSystemAuditLog(
      superAdmin,
      'SYSTEM_CONFIG_UPDATED',
      'system_config',
      'Global System Configuration',
      'Modified system parameters, security policies, and institutional settings.',
      'SUCCESS'
    );

    return { success: true, data: merged, message: 'System configuration updated successfully.' };
  },

  async testEmailConfiguration(
    superAdmin: { id: string; name: string },
    recipientEmail: string
  ): Promise<ApiResponse<{ sentTo: string; timestamp: string }>> {
    await sleep(500);
    this.recordSystemAuditLog(
      superAdmin,
      'TEST_EMAIL_DISPATCHED',
      'system_config',
      `Email Test to ${recipientEmail}`,
      'Verified SMTP server connectivity and handshake.',
      'SUCCESS'
    );
    return {
      success: true,
      data: { sentTo: recipientEmail, timestamp: new Date().toISOString() },
      message: `Test email sent to ${recipientEmail}. SMTP handshake verified.`,
    };
  },

  /**
   * 4. Refund Approvals (BR-006)
   */
  async getRefundRequests(): Promise<ApiResponse<RefundRequest[]>> {
    await sleep(150);
    const refunds = getStorageItem<RefundRequest[]>(STORAGE_KEYS.REFUNDS, SEED_REFUNDS);
    return { success: true, data: refunds };
  },

  async approveRefund(
    superAdmin: { id: string; name: string },
    refundId: string,
    remarks?: string
  ): Promise<ApiResponse<RefundRequest>> {
    await sleep(350);
    const refunds = getStorageItem<RefundRequest[]>(STORAGE_KEYS.REFUNDS, SEED_REFUNDS);
    const payments = getStorageItem<PaymentTransaction[]>(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
    const idx = refunds.findIndex((r) => r.id === refundId);

    if (idx === -1) return { success: false, data: null as any, error: 'Refund request not found.' };

    refunds[idx].status = 'approved';
    refunds[idx].decidedAt = new Date().toISOString();
    refunds[idx].decidedBySuperAdminId = superAdmin.id;
    refunds[idx].superAdminRemarks = remarks || 'Approved by Super Admin after compliance verification.';
    setStorageItem(STORAGE_KEYS.REFUNDS, refunds);

    // Update payment record to refunded
    const pIdx = payments.findIndex((p) => p.id === refunds[idx].transactionId);
    if (pIdx >= 0) {
      payments[pIdx].status = 'refunded';
      setStorageItem(STORAGE_KEYS.PAYMENTS, payments);
    }

    this.recordSystemAuditLog(
      superAdmin,
      'REFUND_APPROVED',
      'refunds',
      `Refund: ${refundId} | Student: ${refunds[idx].studentName}`,
      `Authorized tuition refund of ₹${refunds[idx].amountINR.toLocaleString('en-IN')}. Note: ${refunds[idx].superAdminRemarks}`,
      'SUCCESS'
    );

    return {
      success: true,
      data: refunds[idx],
      message: 'Refund approved. Internal financial authorization recorded. Gateway disbursement pending integration.',
    };
  },

  async rejectRefund(
    superAdmin: { id: string; name: string },
    refundId: string,
    mandatoryReason: string
  ): Promise<ApiResponse<RefundRequest>> {
    await sleep(350);
    if (!mandatoryReason || mandatoryReason.trim().length < 5) {
      return { success: false, data: null as any, error: 'A valid mandatory rejection reason must be provided.' };
    }

    const refunds = getStorageItem<RefundRequest[]>(STORAGE_KEYS.REFUNDS, SEED_REFUNDS);
    const idx = refunds.findIndex((r) => r.id === refundId);
    if (idx === -1) return { success: false, data: null as any, error: 'Refund request not found.' };

    refunds[idx].status = 'rejected';
    refunds[idx].decidedAt = new Date().toISOString();
    refunds[idx].decidedBySuperAdminId = superAdmin.id;
    refunds[idx].superAdminRemarks = mandatoryReason;
    setStorageItem(STORAGE_KEYS.REFUNDS, refunds);

    this.recordSystemAuditLog(
      superAdmin,
      'REFUND_REJECTED',
      'refunds',
      `Refund: ${refundId} | Student: ${refunds[idx].studentName}`,
      `Rejected refund of ₹${refunds[idx].amountINR.toLocaleString('en-IN')}. Reason: ${mandatoryReason}`,
      'SUCCESS'
    );

    return {
      success: true,
      data: refunds[idx],
      message: 'Refund request rejected. Mandatory justification recorded in audit log.',
    };
  },

  /**
   * 5. Financial Override Management (BR-007)
   */
  async getFinancialOverrides(): Promise<ApiResponse<FinancialOverrideRequest[]>> {
    await sleep(150);
    const overrides = getStorageItem<FinancialOverrideRequest[]>(
      STORAGE_KEYS.FINANCIAL_OVERRIDES,
      SEED_FINANCIAL_OVERRIDES
    );
    return { success: true, data: overrides };
  },

  async approveFinancialOverride(
    superAdmin: { id: string; name: string },
    overrideId: string,
    remarks?: string
  ): Promise<ApiResponse<FinancialOverrideRequest>> {
    await sleep(350);
    const overrides = getStorageItem<FinancialOverrideRequest[]>(
      STORAGE_KEYS.FINANCIAL_OVERRIDES,
      SEED_FINANCIAL_OVERRIDES
    );
    const idx = overrides.findIndex((o) => o.id === overrideId);
    if (idx === -1) return { success: false, data: null as any, error: 'Financial override request not found.' };

    overrides[idx].status = 'approved';
    overrides[idx].decidedAt = new Date().toISOString();
    overrides[idx].decidedBySuperAdminId = superAdmin.id;
    overrides[idx].superAdminRemarks = remarks || 'Authorized by Super Admin.';
    setStorageItem(STORAGE_KEYS.FINANCIAL_OVERRIDES, overrides);

    this.recordSystemAuditLog(
      superAdmin,
      'FINANCIAL_OVERRIDE_APPROVED',
      'financial_overrides',
      `Override: ${overrideId} | Student: ${overrides[idx].studentName}`,
      `Authorized fee waiver/adjustment of ₹${overrides[idx].discountOrWaiverINR.toLocaleString('en-IN')} (Original: ₹${overrides[idx].originalAmountINR} -> Adjusted: ₹${overrides[idx].proposedAmountINR}). Remarks: ${overrides[idx].superAdminRemarks}`,
      'SUCCESS'
    );

    return {
      success: true,
      data: overrides[idx],
      message: 'Financial override approved. Fee ledger updated accordingly.',
    };
  },

  async rejectFinancialOverride(
    superAdmin: { id: string; name: string },
    overrideId: string,
    mandatoryReason: string
  ): Promise<ApiResponse<FinancialOverrideRequest>> {
    await sleep(350);
    if (!mandatoryReason || mandatoryReason.trim().length < 5) {
      return { success: false, data: null as any, error: 'A valid mandatory rejection reason must be provided.' };
    }

    const overrides = getStorageItem<FinancialOverrideRequest[]>(
      STORAGE_KEYS.FINANCIAL_OVERRIDES,
      SEED_FINANCIAL_OVERRIDES
    );
    const idx = overrides.findIndex((o) => o.id === overrideId);
    if (idx === -1) return { success: false, data: null as any, error: 'Financial override request not found.' };

    overrides[idx].status = 'rejected';
    overrides[idx].decidedAt = new Date().toISOString();
    overrides[idx].decidedBySuperAdminId = superAdmin.id;
    overrides[idx].superAdminRemarks = mandatoryReason;
    setStorageItem(STORAGE_KEYS.FINANCIAL_OVERRIDES, overrides);

    this.recordSystemAuditLog(
      superAdmin,
      'FINANCIAL_OVERRIDE_REJECTED',
      'financial_overrides',
      `Override: ${overrideId} | Student: ${overrides[idx].studentName}`,
      `Rejected proposed fee waiver of ₹${overrides[idx].discountOrWaiverINR.toLocaleString('en-IN')}. Reason: ${mandatoryReason}`,
      'SUCCESS'
    );

    return {
      success: true,
      data: overrides[idx],
      message: 'Financial override rejected. Mandatory justification recorded in audit log.',
    };
  },

  /**
   * 6. Global Roles and Permissions Management
   */
  async getGlobalRoles(): Promise<ApiResponse<GlobalRole[]>> {
    await sleep(150);
    const roles = getStorageItem<GlobalRole[]>(STORAGE_KEYS.GLOBAL_ROLES, SEED_GLOBAL_ROLES);
    return { success: true, data: roles };
  },

  async createGlobalRole(
    superAdmin: { id: string; name: string },
    data: { name: string; slug: string; description: string; permissions: string[] }
  ): Promise<ApiResponse<GlobalRole>> {
    await sleep(300);
    const roles = getStorageItem<GlobalRole[]>(STORAGE_KEYS.GLOBAL_ROLES, SEED_GLOBAL_ROLES);
    const slug = data.slug.toLowerCase().replace(/\s+/g, '_');

    if (roles.some((r) => r.slug === slug)) {
      return { success: false, data: null as any, error: 'A role with this identifier already exists.' };
    }

    const newRole: GlobalRole = {
      id: `role-${Date.now()}`,
      name: data.name,
      slug,
      description: data.description,
      isSystemRole: false,
      userCount: 0,
      permissions: data.permissions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setStorageItem(STORAGE_KEYS.GLOBAL_ROLES, [...roles, newRole]);

    this.recordSystemAuditLog(
      superAdmin,
      'GLOBAL_ROLE_CREATED',
      'roles_permissions',
      `Role: ${newRole.name} (${newRole.slug})`,
      `Created custom role with ${data.permissions.length} initial permissions.`,
      'SUCCESS'
    );

    return { success: true, data: newRole, message: 'Custom role created successfully.' };
  },

  async updateRolePermissions(
    superAdmin: { id: string; name: string },
    roleSlug: string,
    permissions: string[]
  ): Promise<ApiResponse<GlobalRole>> {
    await sleep(350);
    const roles = getStorageItem<GlobalRole[]>(STORAGE_KEYS.GLOBAL_ROLES, SEED_GLOBAL_ROLES);
    const idx = roles.findIndex((r) => r.slug === roleSlug);
    if (idx === -1) return { success: false, data: null as any, error: 'Role not found.' };

    if (roleSlug === 'super_admin') {
      return {
        success: false,
        data: null as any,
        error: 'Super Administrator root permissions cannot be revoked to safeguard administrative lockout.',
      };
    }

    roles[idx].permissions = permissions;
    roles[idx].updatedAt = new Date().toISOString();
    setStorageItem(STORAGE_KEYS.GLOBAL_ROLES, roles);

    this.recordSystemAuditLog(
      superAdmin,
      'ROLE_PERMISSIONS_UPDATED',
      'roles_permissions',
      `Role: ${roles[idx].name} (${roles[idx].slug})`,
      `Updated permission matrix (${permissions.length} actions enabled).`,
      'SUCCESS'
    );

    return { success: true, data: roles[idx], message: `Permissions for ${roles[idx].name} updated successfully.` };
  },

  /**
   * 7. System Audit Logs
   */
  async getAuditLogs(): Promise<ApiResponse<AuditLog[]>> {
    await sleep(150);
    const logs = getStorageItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_RICH_AUDIT_LOGS);
    return { success: true, data: logs };
  },

  recordSystemAuditLog(
    actor: { id: string; name: string; role?: string },
    action: string,
    module: string,
    targetEntity: string,
    details: string,
    result: 'SUCCESS' | 'FAILURE' | 'DENIED' = 'SUCCESS',
    ipAddress: string = '103.21.144.12'
  ): void {
    const current = getStorageItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_RICH_AUDIT_LOGS);
    const newEntry: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role || 'super_admin',
      action,
      module,
      targetEntity,
      details,
      ipAddress,
      result,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Nexelvoria-Console/2.0',
    };
    setStorageItem(STORAGE_KEYS.AUDIT_LOGS, [newEntry, ...current]);
  },
};
