export type AccountState =
  | 'pending_verification'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'suspended'
  /**
   * Deactivated by staff.
   *
   * Added during the Student Login integration. The backend derives
   * `accountState` from `status` + `isEmailVerified` + `adminApprovalStatus`,
   * and `UserStatus` has a `deactivated` value this union could not express -
   * so a deactivated student previously came back with no `accountState` at
   * all and the admin badge was simply blank for them.
   */
  | 'deactivated'
  | 'locked';

export interface SessionItem {
  id: string;
  device: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface LoginHistoryItem {
  id: string;
  timestamp: string;
  device: string;
  browser: string;
  ipAddress: string;
  location: string;
  status: 'success' | 'failed';
  failureReason?: string;
}

export interface TwoFactorSettings {
  enabled: boolean;
  method: 'authenticator' | 'sms' | 'email';
  secretKey?: string;
  backupCodes?: string[];
  lastConfiguredAt?: string;
}

export interface AccountSecurityState {
  failedLoginAttempts: number;
  isLocked: boolean;
  lockedUntil?: string;
  lastPasswordChange: string;
  twoFactorEnabled: boolean;
  activeSessionsCount: number;
}

export interface PasswordResetState {
  identifier: string;
  otpVerified: boolean;
  step: 'identifier' | 'otp' | 'new_password' | 'completed';
}

