import type { AccountState, SessionItem, LoginHistoryItem, TwoFactorSettings } from './auth.types';

export type UserRole = 'public' | 'student' | 'teacher' | 'admin' | 'super_admin';

export type UserStatus = 'active' | 'pending' | 'suspended' | 'deactivated';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  createdAt: string;
}

export interface StudentProfile extends User {
  role: 'student';
  accountState?: AccountState;
  collegeName: string;
  degreeBranch: string;
  passingYear: string;
  courseInterestedIn: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  fullAddress: string;
  resumeUrl?: string;
  resumeFileName?: string;
  resumeFileSize?: string;
  resumeDataUrl?: string;
  linkedInUrl?: string;
  githubUrl?: string;
  guardianContact?: string;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  adminApprovalStatus: 'pending' | 'approved' | 'rejected';
  adminApprovalRemarks?: string;
  approvedAt?: string;
  enrolledCourseIds: string[];
  twoFactorEnabled?: boolean;
  twoFactorSettings?: TwoFactorSettings;
  activeSessions?: SessionItem[];
  loginHistory?: LoginHistoryItem[];
  failedLoginAttempts?: number;
  lockedUntil?: string;
  lastPasswordChange?: string;
}

export interface TeacherProfile extends User {
  role: 'teacher';
  specialization: string;
  experienceYears: number;
  bio: string;
  qualifications: string;
  assignedCourseIds: string[];
  assignedBatchIds: string[];
  rating: number;
}

export interface AdminProfile extends User {
  role: 'admin';
  department: string;
  permissions: string[]; // e.g., 'manage_students', 'manage_courses', 'manage_payments'
  lastLoginIp?: string;
}

export interface SuperAdminProfile extends User {
  role: 'super_admin';
  isPrimaryOwner: boolean;
  canOverrideFinancials: boolean;
}

