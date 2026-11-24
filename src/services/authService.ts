import { STORAGE_KEYS } from '../constants/appConfig';
import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/storage';
import { SEED_USERS } from '../mocks/seedData';
import { recordAuditLog } from '../mocks/mockStorage';
import type {
  User,
  StudentProfile,
  ApiResponse,
  UserRole,
  AccountState,
  SessionItem,
  LoginHistoryItem,
  TwoFactorSettings,
} from '../types';
import type { LoginFormData, StudentRegistrationFormData } from '../utils/validators';
import { apiClient } from './api';
import axios from 'axios';
import {
  readErrorCode,
  readVerificationTicketFrom,
  toApiFailure,
  toApiSuccess,
  type BackendFailureBody,
  type BackendSuccessBody,
} from './apiErrors';

const sleep = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Keeps the localStorage mock reachable for the parts of the journey that
 * have no backend yet.
 *
 * Registration now calls the real API by DEFAULT. This flag exists for one
 * transitional reason: OTP verification is still mock-only (no backend OTP
 * endpoints exist, because BR-001 requires a mobile OTP while BR-014 disables
 * SMS - open-questions Q3). A developer who needs to walk the whole
 * register -> verify -> dashboard journey can set
 *
 *   VITE_USE_MOCK_AUTH=true
 *
 * in `.env.local` to get the old all-mock behaviour back. Unset, or any other
 * value, means the real endpoint. DELETE THIS FLAG once the OTP endpoints
 * exist - it must not outlive the mock it guards.
 */
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

/**
 * The account-state codes `POST /auth/login` may return with a 403.
 *
 * Returned ONLY after a correct password, which is why they are safe to
 * distinguish: a wrong password and an unknown address both produce one
 * generic 401, so a stranger learns nothing.
 */
/**
 * The demo passcode the MOCK accepts. Mock mode only.
 *
 * Deliberately a single exact value. The original mock checked
 * `otp !== '123456' && otp.length !== 6`, which accepted ANY six-character
 * string - so it was indistinguishable from working verification. That
 * defect is not restored here.
 */
export const MOCK_OTP_CODE = '123456';

/**
 * Prefix marking a mock verification ticket.
 *
 * In mock mode there is no server to sign a real ticket, so the mock encodes
 * the student id instead. The CALL SIGNATURES stay identical in both modes -
 * every caller passes a ticket - so the pages need no mode-specific branch,
 * and the id still never reaches a URL because the ticket lives in
 * sessionStorage either way.
 *
 * A real ticket is a JWT and can never collide with this prefix.
 */
const MOCK_TICKET_PREFIX = 'mock-ticket:';

const mockTicketFor = (studentId: string): string => `${MOCK_TICKET_PREFIX}${studentId}`;

/** The student id inside a mock ticket, or null if this is not one. */
const studentIdFromMockTicket = (ticket: string): string | null => {
  if (!ticket.startsWith(MOCK_TICKET_PREFIX)) {
    return null;
  }

  const id = ticket.slice(MOCK_TICKET_PREFIX.length);

  return id.length > 0 ? id : null;
};

/** Masks an address for the mock's `sentTo`, as the real endpoint does. */
const maskEmail = (email: string): string => {
  const at = email.lastIndexOf('@');

  if (at <= 0) {
    return '***';
  }

  const local = email.slice(0, at);
  const domain = email.slice(at);

  if (local.length <= 2) {
    return `***${domain}`;
  }

  return `${local[0]}***${local[local.length - 1]}${domain}`;
};

export type AccountStateCode =
  | 'ACCOUNT_PENDING'
  | 'ACCOUNT_PENDING_VERIFICATION'
  | 'ACCOUNT_PENDING_APPROVAL'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_DEACTIVATED';

/** Maps a refusal code onto the state the banner renders. */
export const ACCOUNT_STATE_BY_CODE: Record<AccountStateCode, AccountState | undefined> = {
  ACCOUNT_PENDING_VERIFICATION: 'pending_verification',
  ACCOUNT_PENDING_APPROVAL: 'pending_approval',
  ACCOUNT_LOCKED: 'locked',
  ACCOUNT_SUSPENDED: 'suspended',
  ACCOUNT_DEACTIVATED: 'deactivated',
  // Indeterminate: the backend could not establish whether the student needs
  // to verify an email or wait for an admin, so it refused generically. There
  // is no honest banner state for it - the page shows the server's message.
  ACCOUNT_PENDING: undefined,
};

/** True when `value` is one of the account-state codes we handle. */
const isAccountStateCode = (value: unknown): value is AccountStateCode =>
  typeof value === 'string' && value in ACCOUNT_STATE_BY_CODE;

/** The account-state code from a login failure body, when there is one. */
const readAccountStateCode = (body: unknown): AccountStateCode | undefined => {
  const code = readErrorCode(body);

  return isAccountStateCode(code) ? code : undefined;
};

const readVerificationTicket = (body: unknown): string | undefined =>
  readVerificationTicketFrom(body);

/** A successful sign-in. No refresh token: decision D4 is still open. */
export interface LoginSuccessData {
  token: string;
  expiresIn: number;
  user: User;
}

/**
 * What `POST /auth/otp/email/verify` returns.
 *
 * Status only - no profile fields and no token, by design. See the method's
 * own comment: verifying an email is not a login.
 */
export interface EmailVerificationStatus {
  studentId: string;
  isEmailVerified: boolean;
  /** Derived server-side. Normally `pending_approval` after verification. */
  accountState?: AccountState;
  /** True while the student still needs an admin decision (BR-002). */
  awaitingAdminApproval: boolean;
}

/** What `POST /auth/otp/email/resend` returns. `sentTo` is masked. */
export interface OtpResendStatus {
  sentTo: string;
  expiresAt: string;
  resendAvailableAt: string;
}

/**
 * What the backend's `POST /auth/register` returns on success.
 *
 * TRANSITIONAL CONTRACT: `tempStudentId` is decision D2's original field and
 * is RETAINED for compatibility, but it is deprecated and must never be put
 * in a URL - it is a real internal identifier. `verificationTicket` is what
 * a client carries forward to the OTP endpoints.
 */
interface RegistrationSuccessData {
  /** @deprecated Use `verificationTicket`. Never place this in a URL. */
  tempStudentId: string;
  /** Opaque, 15-minute, purpose-scoped. Identifies the account for OTP. */
  verificationTicket: string;
  email: string;
  mobile: string;
}

/**
 * Builds the request body field by field - deliberately NOT a spread of the
 * form data.
 *
 * Two reasons, both load-bearing:
 *
 *  1. `resumeDataUrl` MUST NOT be sent. The form holds the résumé as a
 *     base64 data URL, and base64 inflates by ~33%, so a 5 MB upload (the
 *     form's own limit) becomes ~6.7 MB of JSON. The backend's body limit is
 *     1 MB (`BODY_LIMIT`), so spreading the form data would make every
 *     registration WITH a résumé fail with 413 Payload Too Large. The backend
 *     discards the data URL anyway - file storage is unresolved
 *     (open-questions Q11) - and keeps only the file's name and size.
 *
 *  2. An explicit whitelist means a field added to the form later is not
 *     silently posted to the API before anyone has agreed it should be.
 *
 * `confirmPassword` and `termsAccepted` ARE sent: the backend's
 * `registrationSchema` validates both server-side rather than trusting that
 * the browser checked them.
 */
const toRegistrationPayload = (data: StudentRegistrationFormData) => ({
  name: data.name,
  email: data.email,
  mobile: data.mobile,
  password: data.password,
  confirmPassword: data.confirmPassword,
  collegeName: data.collegeName,
  degreeBranch: data.degreeBranch,
  passingYear: data.passingYear,
  courseInterestedIn: data.courseInterestedIn,
  dateOfBirth: data.dateOfBirth,
  gender: data.gender,
  fullAddress: data.fullAddress,
  guardianContact: data.guardianContact,
  linkedInUrl: data.linkedInUrl ?? '',
  githubUrl: data.githubUrl ?? '',
  resumeFileName: data.resumeFileName ?? '',
  resumeFileSize: data.resumeFileSize ?? '',

  // Required by the backend schema, which re-checks it rather than trusting
  // the checkbox was ticked in the browser. Omitting it makes every
  // registration fail with a 422 on `termsAccepted`.
  termsAccepted: data.termsAccepted,
});

export const authService = {
  /**
   * Log in using email or mobile + password with account security & status handling
   */
  /**
   * Sign in - LIVE BACKEND CALL.
   *
   *   POST /api/v1/auth/login
   *
   * Replaces the localStorage mock (kept below as `loginMock`, reachable only
   * through VITE_USE_MOCK_AUTH).
   *
   * THREE THINGS THE REAL ENDPOINT DOES DIFFERENTLY, all deliberate:
   *
   *  1. A wrong password and an unknown address return the SAME 401. The
   *     mock distinguished them, which told an attacker which addresses are
   *     registered.
   *  2. A refused-but-authenticated account returns 403 with an
   *     `ACCOUNT_*` code, so the page can show the right screen. The mock
   *     returned a free-text error.
   *  3. No refresh token is issued (decision D4 is open), so a session ends
   *     when the access token expires - roughly 15 minutes.
   *
   * On success the access token is stored under the SAME key the axios
   * interceptor reads, so every later request is authenticated.
   */
  async login(credentials: LoginFormData): Promise<
    ApiResponse<LoginSuccessData> & {
      /** Present on a 403. Drives which banner the login page shows. */
      code?: AccountStateCode;
      accountState?: AccountState;
      /** Present only with ACCOUNT_PENDING_VERIFICATION. */
      verificationTicket?: string;
    }
  > {
    if (USE_MOCK_AUTH) {
      return authService.loginMock(credentials);
    }

    const fallback = 'Authentication failed. Please verify your credentials.';

    try {
      const response = await apiClient.post<
        BackendSuccessBody<LoginSuccessData> | BackendFailureBody
      >('/auth/login', {
        identifier: credentials.identifier,
        password: credentials.password,
        ...(credentials.rememberMe === undefined ? {} : { rememberMe: credentials.rememberMe }),
      });

      const result = toApiSuccess<LoginSuccessData>(response.data, fallback);

      if (result.success && result.data) {
        // The key the axios request interceptor reads.
        setStorageItem(STORAGE_KEYS.AUTH_TOKEN, result.data.token);
        setStorageItem(STORAGE_KEYS.CURRENT_USER, result.data.user);
      }

      return result;
    } catch (err) {
      const failure = toApiFailure<LoginSuccessData>(err, fallback);
      const body = axios.isAxiosError(err) ? err.response?.data : undefined;
      const code = readAccountStateCode(body);
      const ticket = readVerificationTicket(body);

      return {
        ...failure,
        ...(code === undefined ? {} : { code }),
        ...(code === undefined ? {} : { accountState: ACCOUNT_STATE_BY_CODE[code] }),
        ...(ticket === undefined ? {} : { verificationTicket: ticket }),
      };
    }
  },

  /**
   * DEPRECATED localStorage sign-in - the pre-integration mock.
   *
   * Reachable only through VITE_USE_MOCK_AUTH, alongside the other mock auth
   * paths. Delete it together with the flag once the whole auth surface is
   * real.
   */
  async loginMock(credentials: LoginFormData): Promise<
    ApiResponse<LoginSuccessData> & {
      code?: AccountStateCode;
      verificationTicket?: string;
    }
  > {
    await sleep();
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
      SEED_USERS.student,
      SEED_USERS.studentPending,
    ]);

    // Check pre-configured seed users
    const allUsers: User[] = [
      ...students,
      SEED_USERS.teacher,
      SEED_USERS.admin,
      SEED_USERS.superAdmin,
    ];

    const studentIdx = students.findIndex(
      (s) =>
        s.email.toLowerCase() === credentials.identifier.toLowerCase() ||
        s.mobile === credentials.identifier
    );

    const found = allUsers.find(
      (u) =>
        u.email.toLowerCase() === credentials.identifier.toLowerCase() ||
        u.mobile === credentials.identifier
    );

    if (!found) {
      return {
        success: false,
        data: null as any,
        error: 'Invalid credentials. User not found with provided email or mobile number.',
      };
    }

    // Check if account is currently locked due to failed attempts
    if (found.role === 'student' && studentIdx !== -1) {
      const student = students[studentIdx];
      if (student.accountState === 'locked' || (student.failedLoginAttempts && student.failedLoginAttempts >= 5)) {
        return {
          success: false,
          data: null as any,
          code: 'ACCOUNT_LOCKED',
          error: 'Account is temporarily locked due to 5 consecutive failed login attempts. Please reset your password.',
        };
      }

      if (student.accountState === 'suspended' || student.status === 'suspended') {
        return {
          success: false,
          data: null as any,
          code: 'ACCOUNT_SUSPENDED',
          error: 'Your account access has been suspended by Institute Administration. Please contact student support.',
        };
      }

      if (student.accountState === 'rejected' || student.adminApprovalStatus === 'rejected') {
        return {
          success: false,
          data: null as any,
          code: 'ACCOUNT_PENDING',
          error: `Your enrollment application was not approved. ${student.adminApprovalRemarks ? `Reason: ${student.adminApprovalRemarks}` : ''}`,
        };
      }

      // Check password validation
      const isPasswordMatch = credentials.password === 'Password@123' || credentials.password.length >= 8;
      if (!isPasswordMatch) {
        const failedCount = (student.failedLoginAttempts || 0) + 1;
        student.failedLoginAttempts = failedCount;

        // Record failed login attempt
        const failedLog: LoginHistoryItem = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          device: 'Web Browser',
          browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Browser',
          ipAddress: '157.48.12.90',
          location: 'Hyderabad, India',
          status: 'failed',
          failureReason: 'Invalid password',
        };
        student.loginHistory = [failedLog, ...(student.loginHistory || [])];

        if (failedCount >= 5) {
          student.accountState = 'locked';
          setStorageItem(STORAGE_KEYS.STUDENTS, students);
          return {
            success: false,
            data: null as any,
            code: 'ACCOUNT_LOCKED',
            error: 'Account locked: 5 consecutive failed login attempts recorded. Please unlock via Forgot Password.',
          };
        }

        setStorageItem(STORAGE_KEYS.STUDENTS, students);
        return {
          success: false,
          data: null as any,
          error: `Incorrect password. Warning: ${5 - failedCount} attempts remaining before account lockout.`,
        };
      }

      // If password matches, reset failed attempts
      student.failedLoginAttempts = 0;

      // Check if unverified
      // EMAIL ONLY, matching the real backend.
      //
      // This gate used to require `isMobileVerified` too. That made the mock
      // journey impossible to finish once mobile OTP was descoped (BR-014)
      // and the verification screen became email-only: a student could
      // verify everything the UI offered and still be refused. The mock now
      // gates on the same single fact the real service does.
      if (!student.isEmailVerified) {
        student.accountState = 'pending_verification';
        setStorageItem(STORAGE_KEYS.STUDENTS, students);
        return {
          success: false,
          data: null as any,
          code: 'ACCOUNT_PENDING_VERIFICATION',
          // No `studentId`: ids no longer travel to the client, and the mock
          // must not reintroduce a field the real contract removed. The mock
          // OTP path resolves the student from localStorage instead.
          error: 'Dual OTP verification incomplete. Please verify your email and mobile number to proceed.',
        };
      }

      // Record successful login history
      const successLog: LoginHistoryItem = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        device: 'Current Session (Web Browser)',
        browser: 'Chrome 131.0',
        ipAddress: '157.48.12.90',
        location: 'Hyderabad, India',
        status: 'success',
      };
      student.loginHistory = [successLog, ...(student.loginHistory || []).slice(0, 19)];

      // Ensure active session
      if (!student.activeSessions || student.activeSessions.length === 0) {
        student.activeSessions = [
          {
            id: `sess-${Date.now()}`,
            device: 'Windows Desktop (Workstation)',
            browser: 'Chrome 131.0',
            os: 'Windows 11',
            ipAddress: '157.48.12.90',
            location: 'Hyderabad, India',
            lastActive: 'Just now',
            isCurrent: true,
          },
        ];
      }

      setStorageItem(STORAGE_KEYS.STUDENTS, students);
      setStorageItem(STORAGE_KEYS.CURRENT_USER, student);
      const token = `jwt_mock_${student.id}_${Date.now()}`;
      setStorageItem(STORAGE_KEYS.AUTH_TOKEN, token);

      return {
        success: true,
        data: { token, expiresIn: 15 * 60, user: student },
        message: 'Login successful.',
      };
    }

    if (found.status === 'suspended' || found.status === 'deactivated') {
      return {
        success: false,
        data: null as any,
        error: 'Your account is suspended or deactivated. Please contact administration.',
      };
    }

    const token = `jwt_mock_${found.id}_${Date.now()}`;
    setStorageItem(STORAGE_KEYS.CURRENT_USER, found);
    setStorageItem(STORAGE_KEYS.AUTH_TOKEN, token);

    return {
      success: true,
      data: { token, expiresIn: 15 * 60, user: found },
      message: 'Login successful.',
    };
  },

  /**
   * Student Self-Registration - LIVE BACKEND CALL.
   *
   *   POST /api/v1/auth/register
   *
   * Replaces the localStorage mock (kept below as `registerStudentMock`, and
   * reachable only via VITE_USE_MOCK_AUTH). The form, its zod schema and the
   * page's error banner are UNCHANGED - this method still returns the same
   * `ApiResponse<{ tempStudentId, email, mobile }>` the page already consumes,
   * so `RegisterPage` and `AuthContext` needed no edit.
   *
   * WHAT THE BACKEND DOES NOT DO, and must not be inferred from a success:
   * no OTP challenge is issued (no OTP endpoint exists - Q3), and the résumé
   * file is not stored (Q11). The account is left `pending`.
   *
   * Error handling is delegated to `toApiFailure`, which covers the server
   * being unreachable, a timeout, a 409 duplicate, a 422 with field issues
   * and a 429 rate limit. Nothing throws out of here.
   */
  async registerStudent(
    data: StudentRegistrationFormData
  ): Promise<ApiResponse<RegistrationSuccessData>> {
    if (USE_MOCK_AUTH) {
      return authService.registerStudentMock(data);
    }

    const fallback = 'Failed to submit registration. Please verify details.';

    try {
      const response = await apiClient.post<
        BackendSuccessBody<RegistrationSuccessData> | BackendFailureBody
      >('/auth/register', toRegistrationPayload(data));

      return toApiSuccess<RegistrationSuccessData>(response.data, fallback);
    } catch (err) {
      return toApiFailure<RegistrationSuccessData>(err, fallback);
    }
  },

  /**
   * DEPRECATED localStorage registration - the pre-integration mock.
   *
   * Retained ONLY so the register -> verify-OTP -> dashboard journey still
   * works while the OTP endpoints do not exist (Q3). Reachable solely through
   * VITE_USE_MOCK_AUTH=true. Delete this method, the flag and the seeded
   * localStorage write together once OTP verification is real.
   */
  async registerStudentMock(
    data: StudentRegistrationFormData
  ): Promise<ApiResponse<RegistrationSuccessData>> {
    await sleep(400);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
      SEED_USERS.student,
      SEED_USERS.studentPending,
    ]);

    // Check duplicate email or mobile
    if (students.some((s) => s.email.toLowerCase() === data.email.toLowerCase())) {
      return {
        success: false,
        data: null as any,
        error: 'An account with this email address already exists. Please sign in or use another email.',
      };
    }

    if (students.some((s) => s.mobile === data.mobile)) {
      return {
        success: false,
        data: null as any,
        error: 'An account with this mobile number already exists. Please sign in or use another mobile number.',
      };
    }

    const newStudent: StudentProfile = {
      id: `user-stu-${Date.now()}`,
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      role: 'student',
      status: 'pending',
      accountState: 'pending_verification',
      collegeName: data.collegeName,
      degreeBranch: data.degreeBranch,
      passingYear: data.passingYear,
      courseInterestedIn: data.courseInterestedIn,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      fullAddress: data.fullAddress,
      linkedInUrl: data.linkedInUrl || '',
      githubUrl: data.githubUrl || '',
      guardianContact: data.guardianContact,
      resumeFileName: data.resumeFileName || 'Student_CV.pdf',
      resumeFileSize: data.resumeFileSize || '1.5 MB',
      resumeDataUrl: data.resumeDataUrl || '',
      isEmailVerified: false,
      isMobileVerified: false,
      adminApprovalStatus: 'pending', // BR-002: Requires Admin approval
      enrolledCourseIds: [],
      createdAt: new Date().toISOString(),
      failedLoginAttempts: 0,
      twoFactorEnabled: false,
      activeSessions: [
        {
          id: `sess-${Date.now()}`,
          device: 'Current Registration Session',
          browser: 'Web Browser',
          os: 'Desktop',
          ipAddress: '157.48.12.90',
          location: 'Hyderabad, India',
          lastActive: 'Just now',
          isCurrent: true,
        },
      ],
      loginHistory: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          device: 'Web Registration Portal',
          browser: 'Browser Client',
          ipAddress: '157.48.12.90',
          location: 'Hyderabad, India',
          status: 'success',
        },
      ],
    };

    setStorageItem(STORAGE_KEYS.STUDENTS, [newStudent, ...students]);

    return {
      success: true,
      data: {
        tempStudentId: newStudent.id,
        /**
         * A MOCK ticket, which the mock OTP methods accept.
         *
         * It encodes the student id rather than being signed - there is no
         * server in mock mode to sign anything. The real methods would
         * reject it, and the mock methods reject a real JWT, so the two
         * modes cannot be crossed by accident.
         */
        verificationTicket: mockTicketFor(newStudent.id),
        email: newStudent.email,
        mobile: newStudent.mobile,
      },
      message: 'Registration initiated. Please complete email OTP verification.',
    };
  },

  /**
   * Email OTP verification - LIVE BACKEND CALL.
   *
   *   POST /api/v1/auth/otp/email/verify
   *
   * Replaces a mock that accepted "123456" OR any six-character string, and
   * which returned the whole `StudentProfile` so that `AuthContext` could
   * call `setUser(...)` with it. That made a six-digit code sufficient to
   * become a student without a password.
   *
   * THE REAL ENDPOINT ISSUES NO TOKEN AND RETURNS NO PROFILE. It reports the
   * account's status only, so a verified student must still sign in - and
   * `login` applies its own gates. The return type changed accordingly, from
   * `ApiResponse<StudentProfile>` to `ApiResponse<EmailVerificationStatus>`.
   */
  async verifyEmailOtp(
    ticket: string,
    otp: string
  ): Promise<ApiResponse<EmailVerificationStatus>> {
    if (USE_MOCK_AUTH) {
      return authService.verifyEmailOtpMock(ticket, otp);
    }

    const fallback = 'That code could not be verified. Please try again.';

    try {
      const response = await apiClient.post<
        BackendSuccessBody<EmailVerificationStatus> | BackendFailureBody
      >('/auth/otp/email/verify', { ticket, otp });

      return toApiSuccess<EmailVerificationStatus>(response.data, fallback);
    } catch (err) {
      return toApiFailure<EmailVerificationStatus>(err, fallback);
    }
  },

  /**
   * Resend the email OTP - LIVE BACKEND CALL.
   *
   *   POST /api/v1/auth/otp/email/resend
   *
   * `sentTo` comes back MASKED ("a***v@example.com"): the endpoint is public,
   * so it never echoes a full address. `resendAvailableAt` is the server's
   * cooldown, which the page uses to drive its countdown instead of assuming
   * 60 seconds.
   */
  async resendEmailOtp(ticket: string): Promise<ApiResponse<OtpResendStatus>> {
    if (USE_MOCK_AUTH) {
      return authService.resendEmailOtpMock(ticket);
    }

    const fallback = 'The code could not be resent. Please try again shortly.';

    try {
      const response = await apiClient.post<
        BackendSuccessBody<OtpResendStatus> | BackendFailureBody
      >('/auth/otp/email/resend', { ticket });

      return toApiSuccess<OtpResendStatus>(response.data, fallback);
    } catch (err) {
      return toApiFailure<OtpResendStatus>(err, fallback);
    }
  },


  /**
   * MOCK email OTP verification. Reachable only via VITE_USE_MOCK_AUTH.
   *
   * ==========================================================================
   * RESTORED, BUT NOT AS IT WAS.
   *
   * The original mock accepted `'123456'` OR any six-character string, which
   * made it impossible to tell from real verification - exactly the confusion
   * that had to be removed. This one accepts ONE exact code and nothing else.
   *
   * It also mirrors the REAL contract rather than the old mock's: it returns
   * the same `EmailVerificationStatus` (status only, no profile, no token),
   * and it marks the EMAIL channel only. Mobile OTP is descoped (BR-014), so
   * nothing here waits on a mobile step that no longer has a UI.
   * ==========================================================================
   */
  async verifyEmailOtpMock(
    ticket: string,
    otp: string
  ): Promise<ApiResponse<EmailVerificationStatus>> {
    await sleep(300);

    const studentId = studentIdFromMockTicket(ticket);

    if (studentId === null) {
      return {
        success: false,
        data: null as any,
        error:
          'That verification session is not valid in mock mode. Register again to start a new one.',
      };
    }

    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
      SEED_USERS.student,
      SEED_USERS.studentPending,
    ]);
    const idx = students.findIndex((s) => s.id === studentId);

    if (idx === -1) {
      return {
        success: false,
        data: null as any,
        error: 'We could not find that registration. Please register again.',
      };
    }

    const student = students[idx];

    if (student.isEmailVerified) {
      return {
        success: false,
        data: null as any,
        error: 'This email address is already verified. Please sign in.',
      };
    }

    // ONE exact code. No length-based shortcut.
    if (otp !== MOCK_OTP_CODE) {
      return {
        success: false,
        data: null as any,
        error: `That code is not correct. (Mock mode demo code: ${MOCK_OTP_CODE})`,
      };
    }

    student.isEmailVerified = true;
    student.accountState = 'pending_approval';
    setStorageItem(STORAGE_KEYS.STUDENTS, students);

    return {
      success: true,
      data: {
        studentId: student.id,
        isEmailVerified: true,
        accountState: 'pending_approval',
        awaitingAdminApproval: student.adminApprovalStatus === 'pending',
      },
      message: 'Email verified. Your registration is now awaiting admin approval.',
    };
  },

  /**
   * MOCK resend. Reachable only via VITE_USE_MOCK_AUTH.
   *
   * Reports the same `OtpResendStatus` the real endpoint does, including a
   * MASKED address and a 60-second cooldown, so the page's countdown behaves
   * identically in both modes. No cooldown is actually enforced - there is no
   * store for it - which is one more reason this must never be mistaken for
   * the real thing.
   */
  async resendEmailOtpMock(ticket: string): Promise<ApiResponse<OtpResendStatus>> {
    await sleep(300);

    const studentId = studentIdFromMockTicket(ticket);

    if (studentId === null) {
      return {
        success: false,
        data: null as any,
        error:
          'That verification session is not valid in mock mode. Register again to start a new one.',
      };
    }

    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
      SEED_USERS.student,
      SEED_USERS.studentPending,
    ]);
    const student = students.find((s) => s.id === studentId);

    if (student === undefined) {
      return {
        success: false,
        data: null as any,
        error: 'We could not find that registration. Please register again.',
      };
    }

    if (student.isEmailVerified) {
      return {
        success: false,
        data: null as any,
        error: 'This email address is already verified. Please sign in.',
      };
    }

    const now = Date.now();

    return {
      success: true,
      data: {
        sentTo: maskEmail(student.email),
        expiresAt: new Date(now + 10 * 60 * 1000).toISOString(),
        resendAvailableAt: new Date(now + 60 * 1000).toISOString(),
      },
      message: `A new 6-digit code has been sent. (Mock mode demo code: ${MOCK_OTP_CODE})`,
    };
  },

  // ---------------------------------------------------------------------------
  // MOBILE AND DUAL OTP ARE REMOVED, NOT REFACTORED.
  //
  // `verifyMobileOtp`, `resendMobileOtp` and `verifyDualOtp` used to live
  // here as mocks. They are gone because mobile OTP is DESCOPED: BR-001 asked
  // for dual verification, BR-014 disables SMS, and email-only was confirmed
  // as the approved scope. No SMS provider exists.
  //
  // They were deleted rather than left in place because a mock that accepts
  // any six characters is indistinguishable, from the UI's point of view,
  // from verification that works - which is exactly the confusion requirement
  // 9 ("remove mock OTP acceptance from the real registration flow") exists
  // to prevent. The backend mounts no mobile or dual-OTP route either.
  //
  // If BR-014 is ever reversed, add them back against the real endpoints
  // listed in docs/api-contracts.md section 4 (#4, #5, #7).
  // ---------------------------------------------------------------------------

  /**
   * Forgot Password Workflow
   */
  async requestPasswordReset(identifier: string): Promise<ApiResponse<{ maskedTarget: string; identifier: string }>> {
    await sleep(300);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
      SEED_USERS.student,
      SEED_USERS.studentPending,
    ]);

    const student = students.find(
      (s) => s.email.toLowerCase() === identifier.toLowerCase() || s.mobile === identifier
    );

    if (!student) {
      return {
        success: false,
        data: null as any,
        error: 'No active student account found with the provided email or mobile number.',
      };
    }

    const masked = student.email.replace(/(.{2})(.*)(?=@)/, (_gp1, h1, h2) => h1 + '*'.repeat(h2.length));

    return {
      success: true,
      data: {
        maskedTarget: masked,
        identifier: student.email,
      },
      message: 'Verification code sent for password recovery. (Demo Code: 123456)',
    };
  },

  async verifyResetOtp(identifier: string, otp: string): Promise<ApiResponse<boolean>> {
    await sleep(250);
    if (otp !== '123456' && otp.length !== 6) {
      return {
        success: false,
        data: false,
        error: 'Invalid recovery code. Please check and retry. (Demo Code: 123456)',
      };
    }

    return {
      success: true,
      data: true,
      message: 'Code verified successfully. You may now enter your new password.',
    };
  },

  async resetPassword(identifier: string, _newPassword: string): Promise<ApiResponse<boolean>> {
    await sleep(400);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
      SEED_USERS.student,
      SEED_USERS.studentPending,
    ]);

    const idx = students.findIndex(
      (s) => s.email.toLowerCase() === identifier.toLowerCase() || s.mobile === identifier
    );

    if (idx === -1) {
      return { success: false, data: false, error: 'Student account could not be located.' };
    }

    // Reset password & unlock account if locked
    students[idx].failedLoginAttempts = 0;
    if (students[idx].accountState === 'locked') {
      students[idx].accountState = students[idx].adminApprovalStatus === 'approved' ? 'approved' : 'pending_approval';
    }
    students[idx].lastPasswordChange = new Date().toISOString();

    setStorageItem(STORAGE_KEYS.STUDENTS, students);

    recordAuditLog(
      { id: students[idx].id, name: students[idx].name, role: 'student' },
      'PASSWORD_RESET',
      `Student: ${students[idx].name}`,
      'Password successfully reset via recovery OTP flow.'
    );

    return {
      success: true,
      data: true,
      message: 'Password reset successfully! You can now sign in with your new password.',
    };
  },

  /**
   * Account Security: Session Management
   */
  async getActiveSessions(userId: string): Promise<ApiResponse<SessionItem[]>> {
    await sleep(150);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
      SEED_USERS.student,
      SEED_USERS.studentPending,
    ]);
    const student = students.find((s) => s.id === userId);

    const defaultSessions: SessionItem[] = [
      {
        id: 'sess-current',
        device: 'Current Browser Session',
        browser: 'Chrome 131.0',
        os: 'Windows 11',
        ipAddress: '157.48.12.90',
        location: 'Hyderabad, India',
        lastActive: 'Active Now',
        isCurrent: true,
      },
      {
        id: 'sess-mobile',
        device: 'Apple iPhone 15 Pro',
        browser: 'Mobile Safari 18.1',
        os: 'iOS 18.1',
        ipAddress: '49.37.152.11',
        location: 'Secunderabad, India',
        lastActive: '2 hours ago',
        isCurrent: false,
      },
    ];

    const list = student?.activeSessions || defaultSessions;
    return { success: true, data: list };
  },

  async terminateSession(userId: string, sessionId: string): Promise<ApiResponse<SessionItem[]>> {
    await sleep(250);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
      SEED_USERS.student,
      SEED_USERS.studentPending,
    ]);
    const idx = students.findIndex((s) => s.id === userId);

    if (idx !== -1 && students[idx].activeSessions) {
      students[idx].activeSessions = students[idx].activeSessions!.filter((s) => s.id !== sessionId);
      setStorageItem(STORAGE_KEYS.STUDENTS, students);
      return { success: true, data: students[idx].activeSessions! };
    }

    return { success: true, data: [] };
  },

  async terminateOtherSessions(userId: string): Promise<ApiResponse<SessionItem[]>> {
    await sleep(300);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
      SEED_USERS.student,
      SEED_USERS.studentPending,
    ]);
    const idx = students.findIndex((s) => s.id === userId);

    if (idx !== -1 && students[idx].activeSessions) {
      students[idx].activeSessions = students[idx].activeSessions!.filter((s) => s.isCurrent);
      setStorageItem(STORAGE_KEYS.STUDENTS, students);
      return { success: true, data: students[idx].activeSessions! };
    }

    return { success: true, data: [] };
  },

  /**
   * Account Security: Login History
   */
  async getLoginHistory(userId: string): Promise<ApiResponse<LoginHistoryItem[]>> {
    await sleep(150);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
      SEED_USERS.student,
      SEED_USERS.studentPending,
    ]);
    const student = students.find((s) => s.id === userId);
    return { success: true, data: student?.loginHistory || [] };
  },

  /**
   * Account Security: 2FA Settings
   */
  async toggleTwoFactor(userId: string, enabled: boolean, _code?: string): Promise<ApiResponse<TwoFactorSettings>> {
    await sleep(300);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
      SEED_USERS.student,
      SEED_USERS.studentPending,
    ]);
    const idx = students.findIndex((s) => s.id === userId);

    const settings: TwoFactorSettings = {
      enabled,
      method: 'authenticator',
      secretKey: 'NEX-SEC-9921-AF88-LMS',
      backupCodes: ['8942-1102', '3391-7784', '5021-9943', '6172-8841'],
      lastConfiguredAt: new Date().toISOString(),
    };

    if (idx !== -1) {
      students[idx].twoFactorEnabled = enabled;
      students[idx].twoFactorSettings = settings;
      setStorageItem(STORAGE_KEYS.STUDENTS, students);
    }

    return {
      success: true,
      data: settings,
      message: enabled ? 'Two-Factor Authentication activated successfully.' : 'Two-Factor Authentication disabled.',
    };
  },

  /**
   * Get currently authenticated user from storage
   */
  getCurrentUser(): User | null {
    return getStorageItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  },

  /**
   * Developer helper to switch role instantly
   */
  /**
   * DEVELOPMENT-ONLY role switching, gated behind VITE_USE_MOCK_AUTH.
   *
   * =========================================================================
   * WHY THE GATE IS NOT OPTIONAL.
   *
   * This writes `jwt_mock_<id>` into STORAGE_KEYS.AUTH_TOKEN - the very key
   * the axios request interceptor reads. With real authentication live, one
   * click would REPLACE A VALID ACCESS TOKEN with a string the backend
   * rejects, and every subsequent request would 401 for no visible reason.
   *
   * It also has no backend equivalent and never will: the API deliberately
   * refuses client-side role switching (open-questions Q23), because a
   * client that can change its own role is an authorization hole.
   *
   * In real API mode this is a no-op that returns the current user
   * unchanged, so nothing is corrupted and nothing silently appears to work.
   * =========================================================================
   */
  switchRole(role: UserRole): User | null {
    if (!USE_MOCK_AUTH) {
      console.warn(
        '[auth] switchRole is disabled: it only exists for the localStorage mock and would ' +
          'overwrite a real access token. Set VITE_USE_MOCK_AUTH=true to use it.',
      );

      return authService.getCurrentUser();
    }

    if (role === 'public') {
      removeStorageItem(STORAGE_KEYS.CURRENT_USER);
      removeStorageItem(STORAGE_KEYS.AUTH_TOKEN);
      return null;
    }

    let targetUser: User;
    if (role === 'student') targetUser = SEED_USERS.student;
    else if (role === 'teacher') targetUser = SEED_USERS.teacher;
    else if (role === 'admin') targetUser = SEED_USERS.admin;
    else targetUser = SEED_USERS.superAdmin;

    setStorageItem(STORAGE_KEYS.CURRENT_USER, targetUser);
    setStorageItem(STORAGE_KEYS.AUTH_TOKEN, `jwt_mock_${targetUser.id}`);
    return targetUser;
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    removeStorageItem(STORAGE_KEYS.CURRENT_USER);
    removeStorageItem(STORAGE_KEYS.AUTH_TOKEN);
  },
};
