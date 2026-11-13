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
import type { LoginFormData, StudentRegistrationFormData, DualOtpFormData } from '../utils/validators';

const sleep = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  /**
   * Log in using email or mobile + password with account security & status handling
   */
  async login(credentials: LoginFormData): Promise<
    ApiResponse<{ user: User; token: string }> & { accountState?: AccountState; studentId?: string }
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
          accountState: 'locked',
          error: 'Account is temporarily locked due to 5 consecutive failed login attempts. Please reset your password.',
        };
      }

      if (student.accountState === 'suspended' || student.status === 'suspended') {
        return {
          success: false,
          data: null as any,
          accountState: 'suspended',
          error: 'Your account access has been suspended by Institute Administration. Please contact student support.',
        };
      }

      if (student.accountState === 'rejected' || student.adminApprovalStatus === 'rejected') {
        return {
          success: false,
          data: null as any,
          accountState: 'rejected',
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
            accountState: 'locked',
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
      if (!student.isEmailVerified || !student.isMobileVerified) {
        student.accountState = 'pending_verification';
        setStorageItem(STORAGE_KEYS.STUDENTS, students);
        return {
          success: false,
          data: null as any,
          accountState: 'pending_verification',
          studentId: student.id,
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
        data: { user: student, token },
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
      data: { user: found, token },
      message: 'Login successful.',
    };
  },

  /**
   * Student Self-Registration (BR-001 prerequisite)
   */
  async registerStudent(data: StudentRegistrationFormData): Promise<ApiResponse<{ tempStudentId: string; email: string; mobile: string }>> {
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
        email: newStudent.email,
        mobile: newStudent.mobile,
      },
      message: 'Registration initiated. Please complete dual email and mobile OTP verification.',
    };
  },

  /**
   * Separate Email OTP Verification
   */
  async verifyEmailOtp(studentId: string, otp: string): Promise<ApiResponse<StudentProfile>> {
    await sleep(300);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
      SEED_USERS.student,
      SEED_USERS.studentPending,
    ]);
    const idx = students.findIndex((s) => s.id === studentId || s.email === studentId);

    if (idx === -1) {
      return { success: false, data: null as any, error: 'Student registration record not found.' };
    }

    if (otp !== '123456' && otp.length !== 6) {
      return { success: false, data: null as any, error: 'Invalid 6-digit email OTP. (Demo code: 123456)' };
    }

    students[idx].isEmailVerified = true;

    if (students[idx].isMobileVerified) {
      students[idx].accountState = 'pending_approval';
      students[idx].status = 'pending';
    }

    setStorageItem(STORAGE_KEYS.STUDENTS, students);
    setStorageItem(STORAGE_KEYS.CURRENT_USER, students[idx]);

    recordAuditLog(
      { id: students[idx].id, name: students[idx].name, role: 'student' },
      'EMAIL_OTP_VERIFIED',
      `Student: ${students[idx].name}`,
      `Email ${students[idx].email} verified.`
    );

    return { success: true, data: students[idx], message: 'Email address verified successfully!' };
  },

  /**
   * Separate Mobile OTP Verification
   */
  async verifyMobileOtp(studentId: string, otp: string): Promise<ApiResponse<StudentProfile>> {
    await sleep(300);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
      SEED_USERS.student,
      SEED_USERS.studentPending,
    ]);
    const idx = students.findIndex((s) => s.id === studentId || s.mobile === studentId);

    if (idx === -1) {
      return { success: false, data: null as any, error: 'Student registration record not found.' };
    }

    if (otp !== '123456' && otp.length !== 6) {
      return { success: false, data: null as any, error: 'Invalid 6-digit mobile SMS OTP. (Demo code: 123456)' };
    }

    students[idx].isMobileVerified = true;

    if (students[idx].isEmailVerified) {
      students[idx].accountState = 'pending_approval';
      students[idx].status = 'pending';
    }

    setStorageItem(STORAGE_KEYS.STUDENTS, students);
    setStorageItem(STORAGE_KEYS.CURRENT_USER, students[idx]);

    recordAuditLog(
      { id: students[idx].id, name: students[idx].name, role: 'student' },
      'MOBILE_OTP_VERIFIED',
      `Student: ${students[idx].name}`,
      `Mobile +91 ${students[idx].mobile} verified.`
    );

    return { success: true, data: students[idx], message: 'Mobile number verified successfully!' };
  },

  /**
   * Resend OTP methods
   */
  async resendEmailOtp(studentId: string): Promise<ApiResponse<{ sentTo: string }>> {
    await sleep(250);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
      SEED_USERS.student,
      SEED_USERS.studentPending,
    ]);
    const student = students.find((s) => s.id === studentId || s.email === studentId);
    return {
      success: true,
      data: { sentTo: student?.email || 'registered email' },
      message: 'New 6-digit verification code dispatched to your email. (Demo: 123456)',
    };
  },

  async resendMobileOtp(studentId: string): Promise<ApiResponse<{ sentTo: string }>> {
    await sleep(250);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
      SEED_USERS.student,
      SEED_USERS.studentPending,
    ]);
    const student = students.find((s) => s.id === studentId || s.mobile === studentId);
    return {
      success: true,
      data: { sentTo: student?.mobile || 'registered mobile' },
      message: 'New 6-digit SMS OTP dispatched to your mobile. (Demo: 123456)',
    };
  },

  /**
   * Dual OTP Verification (BR-001) for backwards compatibility
   */
  async verifyDualOtp(studentId: string, otps: DualOtpFormData): Promise<ApiResponse<StudentProfile>> {
    await sleep(350);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
      SEED_USERS.student,
      SEED_USERS.studentPending,
    ]);
    const studentIndex = students.findIndex((s) => s.id === studentId);

    if (studentIndex === -1) {
      return {
        success: false,
        data: null as any,
        error: 'Student record not found.',
      };
    }

    if (otps.emailOtp.length !== 6 || otps.mobileOtp.length !== 6) {
      return {
        success: false,
        data: null as any,
        error: 'Both Email and Mobile OTPs must be 6 digits.',
      };
    }

    students[studentIndex].isEmailVerified = true;
    students[studentIndex].isMobileVerified = true;
    students[studentIndex].accountState = 'pending_approval';
    students[studentIndex].status = 'pending';
    setStorageItem(STORAGE_KEYS.STUDENTS, students);

    // Set current user
    setStorageItem(STORAGE_KEYS.CURRENT_USER, students[studentIndex]);
    setStorageItem(STORAGE_KEYS.AUTH_TOKEN, `jwt_mock_${students[studentIndex].id}`);

    recordAuditLog(
      { id: students[studentIndex].id, name: students[studentIndex].name, role: 'student' },
      'STUDENT_OTP_VERIFIED',
      `Student: ${students[studentIndex].name}`,
      'Email and Mobile numbers verified via dual OTP.'
    );

    return {
      success: true,
      data: students[studentIndex],
      message: 'Email and Mobile verified successfully. Your registration is now pending Admin approval (BR-002).',
    };
  },

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
  switchRole(role: UserRole): User | null {
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
