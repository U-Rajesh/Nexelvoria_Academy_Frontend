export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string; // e.g. "STUDENT_APPROVED", "MANUAL_PAYMENT_ENTRY", "REFUND_APPROVED"
  targetEntity: string; // e.g. "Student: STU-001", "Payment: ORD-992"
  details: string;
  ipAddress?: string;
  module?: string;
  result?: 'SUCCESS' | 'FAILURE' | 'DENIED';
  userAgent?: string;
}

export interface InAppNotification {
  id: string;
  userId: string; // 'all' or specific user id
  targetRole?: 'student' | 'teacher' | 'admin' | 'all';
  title: string;
  message: string;
  category: 'announcement' | 'assignment' | 'exam' | 'payment' | 'placement' | 'system';
  isRead: boolean;
  createdAt: string;
  linkUrl?: string;
}

export interface InstituteSettings {
  instituteName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  whatsappNumber: string;
  address: string;
  timezone: string; // 'Asia/Kolkata'
  minAttendancePercentage: number; // 75
  isSmsEnabled: boolean; // false as per BR-014
  currencySymbol: string; // '₹'
  gstNumber?: string;
}

