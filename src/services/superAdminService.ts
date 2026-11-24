import { apiClient } from './api';
import { fromBackendAuditLog, type BackendAuditLog } from './auditLogMapper';
import { STORAGE_KEYS } from '../constants/appConfig';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { SEED_USERS, SEED_COURSES, SEED_BATCHES, SEED_PAYMENTS, SEED_REFUNDS } from '../mocks/seedData';
import type {
  AdminProfile,
  RefundRequest,
  AuditLog,
  PaymentTransaction,
  ApiResponse,
  FinancialOverrideRequest,
  SystemConfigStatus,
  GlobalRole,
  SuperAdminDashboardStats,
} from '../types';

/**
 * Explicit development-only mock toggle.
 * Defaults to false (production mode): uses live backend APIs and returns
 * genuine empty states / error states with zero silent fallback to seed data.
 * Set VITE_USE_DEV_MOCKS=true in .env.local to enable offline mock fallbacks.
 */
const USE_DEV_MOCKS = import.meta.env.VITE_USE_DEV_MOCKS === 'true';

const sleep = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

/** Server message plus any per-field validation details. */
const decisionErrorMessage = (err: any, fallback: string): string => {
  const data = err?.response?.data;
  const details: { message?: string }[] = Array.isArray(data?.details) ? data.details : [];
  const detail = details.map((d) => d?.message).filter(Boolean).join('; ');
  const base = data?.message || err?.message || fallback;
  return detail ? `${base}: ${detail}` : base;
};

/** Shape of GET /super-admin/refunds items (NXA_Refunds). */
interface BackendRefund {
  id: string;
  refundReference?: string;
  transactionId?: string;
  requestedByUserId: string;
  requestedByName?: string;
  amount: number;
  reason: string;
  refundStatus: string;
  requestedAt: string;
  approvedAt?: string;
  approvedBySuperAdminUserId?: string;
}

/**
 * NXA_Refunds has no course link or remarks column: the course is shown as
 * unknown and decision remarks live in the audit log, not on the record.
 */
const fromBackendRefund = (r: BackendRefund): RefundRequest => {
  const status = (r.refundStatus || '').toLowerCase();
  return {
    id: r.id,
    transactionId: r.transactionId ?? r.refundReference ?? '',
    studentId: r.requestedByUserId,
    studentName: r.requestedByName || `User #${r.requestedByUserId}`,
    courseId: '',
    courseTitle: '',
    amountINR: Number(r.amount) || 0,
    reason: r.reason,
    status: (status === 'pending' ? 'pending_super_admin' : status) as RefundRequest['status'],
    requestedAt: r.requestedAt,
    ...(r.approvedAt ? { decidedAt: r.approvedAt } : {}),
    ...(r.approvedBySuperAdminUserId ? { decidedBySuperAdminId: r.approvedBySuperAdminUserId } : {}),
  };
};

/** Shape of GET /super-admin/financial-overrides items (NXA_EnrollmentOverrides + enrollment). */
interface BackendOverride {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  courseId: string;
  courseTitle?: string;
  enrollmentId: string;
  originalAmountINR: number;
  proposedAmountINR: number;
  discountOrWaiverINR: number;
  adjustmentType: string;
  reason: string;
  requestedByAdminId: string;
  requestedByAdminName?: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  decidedAt?: string;
  decidedBySuperAdminId?: string;
}

const fromBackendOverride = (o: BackendOverride): FinancialOverrideRequest => ({
  id: o.id,
  studentId: o.studentId,
  studentName: o.studentName || (o.studentId ? `User #${o.studentId}` : 'Unknown student'),
  studentEmail: o.studentEmail ?? '',
  courseId: o.courseId,
  courseTitle: o.courseTitle ?? '',
  enrollmentId: o.enrollmentId,
  originalAmountINR: Number(o.originalAmountINR) || 0,
  proposedAmountINR: Number(o.proposedAmountINR) || 0,
  discountOrWaiverINR: Number(o.discountOrWaiverINR) || 0,
  adjustmentType: o.adjustmentType as FinancialOverrideRequest['adjustmentType'],
  reason: o.reason,
  requestedByAdminId: o.requestedByAdminId,
  // NXA_EnrollmentOverrides has no requested-by column.
  requestedByAdminName: o.requestedByAdminName || '',
  requestedAt: o.requestedAt,
  status: o.status,
  ...(o.decidedAt ? { decidedAt: o.decidedAt } : {}),
  ...(o.decidedBySuperAdminId ? { decidedBySuperAdminId: o.decidedBySuperAdminId } : {}),
});

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
    if (USE_DEV_MOCKS) {
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
    }

    try {
      // Super admins may read /admin routes (role inheritance); together the
      // two endpoints cover the institute-wide figures.
      const [saRes, adminRes, refundsRes] = await Promise.all([
        apiClient.get('/super-admin/stats'),
        apiClient.get('/admin/stats'),
        apiClient.get('/super-admin/refunds', { params: { status: 'pending' } }),
      ]);
      const sa = saRes.data?.data ?? {};
      const ad = adminRes.data?.data ?? {};
      const refunds: { amount?: number }[] = refundsRes.data?.data ?? [];

      const stats: SuperAdminDashboardStats = {
        totalStudents: ad.totalStudents ?? 0,
        totalAdmins: sa.totalAdminAccounts ?? 0,
        totalTeachers: ad.totalTeachers ?? 0,
        totalCourses: ad.totalCourses ?? 0,
        totalBatches: ad.activeBatches ?? 0,
        totalEnrollments: ad.totalEnrollments ?? 0,
        totalRevenueINR: ad.totalRevenueINR ?? null,
        revenueYearToDateINR: sa.totalRevenueYTD ?? null,
        ...(typeof sa.financialYearLabel === 'string' ? { financialYearLabel: sa.financialYearLabel } : {}),
        revenueThisMonthINR: sa.revenueThisMonth ?? null,
        outstandingFeesINR: ad.pendingFeesINR ?? 0,
        pendingRefundsCount: sa.pendingRefundRequests ?? null,
        pendingRefundsAmountINR: Array.isArray(refunds)
          ? refunds.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
          : null,
        pendingOverridesCount: sa.pendingFinancialOverrides ?? null,
        // Override amounts need the verified NXA_EnrollmentOverrides definition.
        pendingOverridesAmountINR: null,
        placementRatePercentage: ad.placementRate ?? null,
        totalPlacedStudents: ad.placementsCount ?? null,
        activeHiringPartners: null,
        averageAttendancePercentage: null,
      };
      return { success: true, data: stats };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to fetch super admin dashboard statistics.';
      return { success: false, data: null as any, error: message };
    }
  },

  /**
   * 2. Admin Account Management
   */
  async getAdmins(): Promise<ApiResponse<AdminProfile[]>> {
    if (USE_DEV_MOCKS) {
      await sleep(150);
      const admins = getStorageItem<AdminProfile[]>(STORAGE_KEYS.ADMINS, SEED_ADMINS);
      return { success: true, data: admins };
    }

    try {
      const res = await apiClient.get('/super-admin/admins');
      const items = res.data?.data?.items ?? res.data?.data ?? [];
      return { success: true, data: Array.isArray(items) ? items : [] };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to fetch admin accounts.';
      return { success: false, data: [], error: message };
    }
  },

  async createAdmin(
    superAdmin: { id: string; name: string },
    data: { name: string; email: string; mobile: string; department: string; permissions?: string[] }
  ): Promise<ApiResponse<AdminProfile & { temporaryPassword?: string }>> {
    if (USE_DEV_MOCKS) {
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
        permissions: data.permissions ?? [],
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
        `Created admin for department "${newAdmin.department}".`,
        'SUCCESS'
      );

      return { success: true, data: newAdmin, message: 'Admin account created successfully.' };
    }

    try {
      // Permissions are not sent: there is no persisted permission model yet.
      const { name, email, mobile, department } = data;
      const res = await apiClient.post('/super-admin/admins', { name, email, mobile, department });
      return { success: true, data: res.data?.data, message: res.data?.message || 'Admin account created successfully.' };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to create admin account.';
      return { success: false, data: null as any, error: message };
    }
  },

  async updateAdmin(
    superAdmin: { id: string; name: string },
    adminId: string,
    updates: Partial<AdminProfile>
  ): Promise<ApiResponse<AdminProfile>> {
    if (USE_DEV_MOCKS) {
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
    }

    try {
      const res = await apiClient.put(`/super-admin/admins/${encodeURIComponent(adminId)}`, updates);
      return { success: true, data: res.data?.data, message: res.data?.message || 'Admin details updated successfully.' };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to update admin account.';
      return { success: false, data: null as any, error: message };
    }
  },

  async toggleAdminStatus(
    superAdmin: { id: string; name: string },
    adminId: string,
    newStatus: 'active' | 'suspended' | 'deactivated',
    reason?: string
  ): Promise<ApiResponse<AdminProfile>> {
    if (USE_DEV_MOCKS) {
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
    }

    try {
      const res = await apiClient.patch(`/super-admin/admins/${encodeURIComponent(adminId)}/status`, {
        status: newStatus,
        reason,
      });
      return {
        success: true,
        data: res.data?.data,
        message: res.data?.message || `Admin account has been ${newStatus}.`,
      };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to update admin status.';
      return { success: false, data: null as any, error: message };
    }
  },

  async resetAdminPassword(
    superAdmin: { id: string; name: string },
    adminId: string
  ): Promise<ApiResponse<{ temporaryPassword: string }>> {
    if (USE_DEV_MOCKS) {
      await sleep(300);
      const admins = getStorageItem<AdminProfile[]>(STORAGE_KEYS.ADMINS, SEED_ADMINS);
      const admin = admins.find((a) => a.id === adminId);
      if (!admin) return { success: false, data: null as any, error: 'Admin account not found.' };

      const temporaryPassword = `NexPass#${Math.floor(1000 + Math.random() * 9000)}!${admin.name.slice(0, 3)}`;

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
        data: { temporaryPassword },
        message: 'Temporary password generated successfully.',
      };
    }

    try {
      const res = await apiClient.post(`/super-admin/admins/${encodeURIComponent(adminId)}/reset-password`);
      return {
        success: true,
        data: res.data?.data,
        message: res.data?.message || 'Temporary password generated successfully.',
      };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to reset admin password.';
      return { success: false, data: null as any, error: message };
    }
  },

  /**
   * 3. System Configuration
   */
  /** Platform configuration as the server runs it (read-only; no secrets). */
  async getSystemConfig(): Promise<ApiResponse<SystemConfigStatus>> {
    try {
      const res = await apiClient.get('/super-admin/system-config');
      return { success: true, data: res.data?.data };
    } catch (err: any) {
      return { success: false, data: null as any, error: decisionErrorMessage(err, 'Failed to fetch system configuration.') };
    }
  },

  /**
   * Sends a real message through the server's SMTP settings. A failure or an
   * unconfigured server is reported as such - never as a successful send.
   */
  /** CFG-20 maintenance mode, as saved on the server. */
  async getMaintenance(): Promise<ApiResponse<{ enabled: boolean; message: string } | null>> {
    try {
      const res = await apiClient.get('/super-admin/maintenance');
      return { success: true, data: res.data?.data ?? null };
    } catch (err: any) {
      return { success: false, data: null, error: decisionErrorMessage(err, 'Maintenance status could not be loaded.') };
    }
  },

  async setMaintenance(enabled: boolean, message?: string): Promise<ApiResponse<{ enabled: boolean; message: string } | null>> {
    try {
      const res = await apiClient.put('/super-admin/maintenance', { enabled, ...(message ? { message } : {}) });
      return { success: true, data: res.data?.data ?? null, message: res.data?.message };
    } catch (err: any) {
      return { success: false, data: null, error: decisionErrorMessage(err, 'Maintenance mode could not be changed.') };
    }
  },

  async testEmailConfiguration(
    recipientEmail: string
  ): Promise<ApiResponse<{ sentTo: string; messageId: string; sentAt: string }>> {
    try {
      const res = await apiClient.post('/super-admin/system-config/test-email', { recipientEmail });
      return { success: true, data: res.data?.data, message: res.data?.message };
    } catch (err: any) {
      return { success: false, data: null as any, error: decisionErrorMessage(err, 'The test email could not be sent.') };
    }
  },

  /**
   * 4. Refund Approvals (BR-006)
   */
  async getRefundRequests(): Promise<ApiResponse<RefundRequest[]>> {
    if (USE_DEV_MOCKS) {
      await sleep(150);
      const refunds = getStorageItem<RefundRequest[]>(STORAGE_KEYS.REFUNDS, SEED_REFUNDS);
      return { success: true, data: refunds };
    }

    try {
      const res = await apiClient.get('/super-admin/refunds');
      const items: BackendRefund[] = res.data?.data?.items ?? res.data?.data ?? [];
      return { success: true, data: Array.isArray(items) ? items.map(fromBackendRefund) : [] };
    } catch (err: any) {
      const message = decisionErrorMessage(err, 'Failed to fetch refund requests.');
      return { success: false, data: [], error: message };
    }
  },

  /** GET /admin/finance/refunds/:id (Super Admin): NXA_FinancialAuditHistory rows for the refund. */
  async getRefundHistory(refundId: string): Promise<
    ApiResponse<Array<{ id: string; actionType: string; reason?: string; performedByUserId: string; performedByName?: string; performedAt: string }>>
  > {
    try {
      const res = await apiClient.get(`/admin/finance/refunds/${encodeURIComponent(refundId)}`);
      const history = res.data?.data?.history;
      return { success: true, data: Array.isArray(history) ? history : [] };
    } catch (err: any) {
      return { success: false, data: [], error: decisionErrorMessage(err, 'Refund history could not be loaded.') };
    }
  },

  async approveRefund(
    superAdmin: { id: string; name: string },
    refundId: string,
    remarks?: string
  ): Promise<ApiResponse<RefundRequest>> {
    if (USE_DEV_MOCKS) {
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
    }

    try {
      const res = await apiClient.post(
        `/super-admin/refunds/${encodeURIComponent(refundId)}/approve`,
        remarks?.trim() ? { remarks: remarks.trim() } : {}
      );
      return {
        success: true,
        data: fromBackendRefund(res.data?.data),
        message: res.data?.message || 'Refund approved.',
      };
    } catch (err: any) {
      const message = decisionErrorMessage(err, 'Failed to approve refund.');
      return { success: false, data: null as any, error: message };
    }
  },

  async rejectRefund(
    superAdmin: { id: string; name: string },
    refundId: string,
    mandatoryReason: string
  ): Promise<ApiResponse<RefundRequest>> {
    if (USE_DEV_MOCKS) {
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
    }

    try {
      const res = await apiClient.post(`/super-admin/refunds/${encodeURIComponent(refundId)}/reject`, {
        mandatoryReason: mandatoryReason.trim(),
      });
      return {
        success: true,
        data: fromBackendRefund(res.data?.data),
        message: res.data?.message || 'Refund request rejected.',
      };
    } catch (err: any) {
      const message = decisionErrorMessage(err, 'Failed to reject refund.');
      return { success: false, data: null as any, error: message };
    }
  },

  /**
   * 5. Financial Override Management (BR-007)
   */
  async getFinancialOverrides(): Promise<ApiResponse<FinancialOverrideRequest[]>> {
    if (USE_DEV_MOCKS) {
      await sleep(150);
      const overrides = getStorageItem<FinancialOverrideRequest[]>(
        STORAGE_KEYS.FINANCIAL_OVERRIDES,
        SEED_FINANCIAL_OVERRIDES
      );
      return { success: true, data: overrides };
    }

    try {
      const res = await apiClient.get('/super-admin/financial-overrides');
      const items: BackendOverride[] = res.data?.data?.items ?? res.data?.data ?? [];
      return { success: true, data: Array.isArray(items) ? items.map(fromBackendOverride) : [] };
    } catch (err: any) {
      const message = decisionErrorMessage(err, 'Failed to fetch financial overrides.');
      return { success: false, data: [], error: message };
    }
  },

  async approveFinancialOverride(
    superAdmin: { id: string; name: string },
    overrideId: string,
    remarks?: string
  ): Promise<ApiResponse<FinancialOverrideRequest>> {
    if (USE_DEV_MOCKS) {
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
    }

    try {
      const res = await apiClient.post(
        `/super-admin/financial-overrides/${encodeURIComponent(overrideId)}/approve`,
        remarks?.trim() ? { remarks: remarks.trim() } : {}
      );
      return {
        success: true,
        data: fromBackendOverride(res.data?.data),
        message: res.data?.message || 'Financial override approved.',
      };
    } catch (err: any) {
      const message = decisionErrorMessage(err, 'Failed to approve financial override.');
      return { success: false, data: null as any, error: message };
    }
  },

  async rejectFinancialOverride(
    superAdmin: { id: string; name: string },
    overrideId: string,
    mandatoryReason: string
  ): Promise<ApiResponse<FinancialOverrideRequest>> {
    if (USE_DEV_MOCKS) {
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
    }

    try {
      const res = await apiClient.post(`/super-admin/financial-overrides/${encodeURIComponent(overrideId)}/reject`, {
        mandatoryReason: mandatoryReason.trim(),
      });
      return {
        success: true,
        data: fromBackendOverride(res.data?.data),
        message: res.data?.message || 'Financial override rejected.',
      };
    } catch (err: any) {
      const message = decisionErrorMessage(err, 'Failed to reject financial override.');
      return { success: false, data: null as any, error: message };
    }
  },

  /**
   * 6. Global Roles and Permissions Management
   */
  /**
   * Roles from NXA_Roles. Creating roles and editing permissions are not
   * offered until the verified permission catalog exists.
   */
  async getGlobalRoles(): Promise<ApiResponse<GlobalRole[]>> {
    try {
      const res = await apiClient.get('/super-admin/roles');
      const items: Array<{
        id: string;
        roleCode: string;
        roleName: string;
        description?: string;
        isSystemRole: boolean;
        isActive: boolean;
        permissions?: string[];
        createdAt: string;
      }> = res.data?.data ?? [];
      return {
        success: true,
        data: Array.isArray(items)
          ? items.map((r) => ({
              id: r.id,
              name: r.roleName,
              slug: r.roleCode,
              description: r.description ?? '',
              isSystemRole: Boolean(r.isSystemRole),
              isActive: Boolean(r.isActive),
              permissions: Array.isArray(r.permissions) ? r.permissions : [],
              createdAt: r.createdAt,
            }))
          : [],
      };
    } catch (err: any) {
      return { success: false, data: [], error: decisionErrorMessage(err, 'Failed to fetch roles.') };
    }
  },

  /**
   * 7. System Audit Logs
   */
  async getAuditLogs(): Promise<ApiResponse<AuditLog[]>> {
    if (USE_DEV_MOCKS) {
      await sleep(150);
      const logs = getStorageItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_RICH_AUDIT_LOGS);
      return { success: true, data: logs };
    }

    try {
      const res = await apiClient.get('/super-admin/audit-logs');
      const items: BackendAuditLog[] = res.data?.data?.items ?? res.data?.data ?? [];
      return { success: true, data: Array.isArray(items) ? items.map(fromBackendAuditLog) : [] };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to fetch audit logs.';
      return { success: false, data: [], error: message };
    }
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
