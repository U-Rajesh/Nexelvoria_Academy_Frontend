import { STORAGE_KEYS } from '../constants/appConfig';
import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/storage';
import { SEED_USERS } from '../mocks/seedData';
import { recordAuditLog } from '../mocks/mockStorage';
import type { User, StudentProfile, ApiResponse, UserRole } from '../types';
import type { LoginFormData, StudentRegistrationFormData, DualOtpFormData } from '../utils/validators';

const sleep = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  /**
   * Log in using email or mobile + password
   */
  async login(credentials: LoginFormData): Promise<ApiResponse<{ user: User; token: string }>> {
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
  async registerStudent(data: StudentRegistrationFormData): Promise<ApiResponse<{ tempStudentId: string }>> {
    await sleep(400);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);

    // Check duplicate email
    if (students.some((s) => s.email.toLowerCase() === data.email.toLowerCase())) {
      return {
        success: false,
        data: null as any,
        error: 'An account with this email address already exists.',
      };
    }

    const newStudent: StudentProfile = {
      id: `user-stu-${Date.now()}`,
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      role: 'student',
      status: 'pending',
      collegeName: data.collegeName,
      degreeBranch: data.degreeBranch,
      passingYear: data.passingYear,
      courseInterestedIn: data.courseInterestedIn,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      fullAddress: data.fullAddress,
      linkedInUrl: data.linkedInUrl,
      githubUrl: data.githubUrl,
      guardianContact: data.guardianContact,
      isEmailVerified: false,
      isMobileVerified: false,
      adminApprovalStatus: 'pending', // BR-002: Requires Admin approval
      enrolledCourseIds: [],
      createdAt: new Date().toISOString(),
    };

    setStorageItem(STORAGE_KEYS.STUDENTS, [newStudent, ...students]);

    return {
      success: true,
      data: { tempStudentId: newStudent.id },
      message: 'Registration initiated. Please verify your Email and Mobile OTP.',
    };
  },

  /**
   * Dual OTP Verification (BR-001)
   */
  async verifyDualOtp(studentId: string, otps: DualOtpFormData): Promise<ApiResponse<StudentProfile>> {
    await sleep(350);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);
    const studentIndex = students.findIndex((s) => s.id === studentId);

    if (studentIndex === -1) {
      return {
        success: false,
        data: null as any,
        error: 'Student record not found.',
      };
    }

    // In demo mode, accept '123456' or any 6-digit number
    if (otps.emailOtp.length !== 6 || otps.mobileOtp.length !== 6) {
      return {
        success: false,
        data: null as any,
        error: 'Both Email and Mobile OTPs must be 6 digits.',
      };
    }

    students[studentIndex].isEmailVerified = true;
    students[studentIndex].isMobileVerified = true;
    setStorageItem(STORAGE_KEYS.STUDENTS, students);

    // Auto set current user
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
      message: 'Email and Mobile verified successfully. Your registration is now pending Admin approval.',
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

