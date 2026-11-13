import { STORAGE_KEYS, APP_CONFIG } from '../constants/appConfig';
import { getStorageItem, setStorageItem } from '../utils/storage';
import {
  SEED_USERS,
  SEED_COURSES,
  SEED_BATCHES,
  SEED_ENROLLMENTS,
  SEED_PAYMENTS,
  SEED_CERTIFICATES,
  SEED_COMPANIES,
  SEED_JOBS,
  SEED_APPLICATIONS,
  SEED_MOCK_INTERVIEWS,
  SEED_ATTENDANCE_SESSIONS,
  SEED_ASSIGNMENTS,
  SEED_ASSIGNMENT_SUBMISSIONS,
  SEED_TESTS,
  SEED_TEST_ATTEMPTS,
  SEED_TICKETS,
  SEED_NOTIFICATIONS,
  SEED_AUDIT_LOGS,
} from '../mocks/seedData';
import { recordAuditLog } from '../mocks/mockStorage';
import type {
  StudentProfile,
  TeacherProfile,
  Course,
  Batch,
  Enrollment,
  PaymentTransaction,
  CertificateRecord,
  AttendanceSession,
  Assignment,
  AssignmentSubmission,
  OnlineTest,
  TestAttempt,
  HiringCompany,
  JobOpening,
  JobApplication,
  MockInterviewSchedule,
  SupportTicket,
  InAppNotification,
  AuditLog,
  CouponDiscount,
  ApiResponse,
  CourseStatus,
  BatchStatus,
  CourseModule,
} from '../types';

const sleep = (ms: number = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export interface DashboardStatsData {
  totalStudents: number;
  activeStudents: number;
  pendingApprovals: number;
  totalCourses: number;
  activeBatches: number;
  totalTeachers: number;
  totalRevenueINR: number;
  pendingFeesINR: number;
  certificatesIssued: number;
  placementRate: number;
  activePlacements: number;
  supportTicketsCount: number;
  systemAlertsCount: number;
  totalEnrollments: number;
  placementsCount: number;
}

export interface InstituteSettings {
  instituteName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  whatsappNumber: string;
  address: string;
  academicSession: string;
  minAttendancePercentage: number;
  minExamPassPercentage: number;
  defaultMaxBatchCapacity: number;
  paymentGatewayMode: 'test' | 'live';
  currency: string;
  receiptPrefix: string;
}

export const adminService = {
  /**
   * 1. Dashboard Overview Statistics (ADM-001)
   */
  async getDashboardStats(): Promise<ApiResponse<DashboardStatsData>> {
    await sleep();
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
      SEED_USERS.student,
      SEED_USERS.studentPending,
    ]);
    const teachers = getStorageItem<TeacherProfile[]>(STORAGE_KEYS.TEACHERS, [SEED_USERS.teacher]);
    const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
    const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);
    const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
    const payments = getStorageItem<PaymentTransaction[]>(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
    const certificates = getStorageItem<CertificateRecord[]>(STORAGE_KEYS.CERTIFICATES, SEED_CERTIFICATES);
    const applications = getStorageItem<JobApplication[]>(STORAGE_KEYS.APPLICATIONS, SEED_APPLICATIONS);
    const tickets = getStorageItem<SupportTicket[]>(STORAGE_KEYS.TICKETS, SEED_TICKETS);

    const totalStudents = students.length;
    const activeStudents = students.filter((s) => s.status === 'active').length;
    const pendingApprovals = students.filter((s) => s.adminApprovalStatus === 'pending').length;
    const totalCourses = courses.length;
    const activeBatches = batches.filter((b) => b.status === 'ongoing').length;
    const totalTeachers = teachers.length;

    const totalRevenueINR = payments
      .filter((p) => p.status === 'successful')
      .reduce((sum, p) => sum + p.finalAmountINR, 0);

    // Approximate pending fees for enrolled students without full payment
    const pendingFeesINR = 45000;

    const certificatesIssued = certificates.filter((c) => c.status === 'valid').length;
    const placementsCount = applications.filter((a) => a.status === 'offered').length;
    const placementRate = totalStudents > 0 ? Math.round((placementsCount / Math.max(1, activeStudents)) * 100) : 85;
    const activePlacements = applications.filter((a) => a.status !== 'rejected').length;
    const supportTicketsCount = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
    const systemAlertsCount = pendingApprovals + (supportTicketsCount > 0 ? 1 : 0);

    return {
      success: true,
      data: {
        totalStudents,
        activeStudents,
        pendingApprovals,
        totalCourses,
        activeBatches,
        totalTeachers,
        totalRevenueINR,
        pendingFeesINR,
        certificatesIssued,
        placementRate,
        activePlacements,
        supportTicketsCount,
        systemAlertsCount,
        totalEnrollments: enrollments.length,
        placementsCount,
      },
    };
  },

  /**
   * 2. Student Management & Approvals (ADM-002, ADM-003, ADM-004)
   */
  async getStudents(): Promise<ApiResponse<StudentProfile[]>> {
    await sleep();
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
      SEED_USERS.student,
      SEED_USERS.studentPending,
    ]);
    return { success: true, data: students };
  },

  async addStudent(
    admin: { id: string; name: string },
    data: Omit<StudentProfile, 'id' | 'createdAt' | 'isEmailVerified' | 'isMobileVerified' | 'enrolledCourseIds' | 'role'> & {
      directEnrollCourseId?: string;
      directEnrollBatchId?: string;
    }
  ): Promise<ApiResponse<StudentProfile>> {
    await sleep(250);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);
    const newId = `user-stu-${Date.now().toString().slice(-4)}`;

    const newStudent: StudentProfile = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
      isMobileVerified: true,
      role: 'student',
      status: data.status || 'active',
      adminApprovalStatus: data.adminApprovalStatus || 'approved',
      approvedAt: data.adminApprovalStatus === 'approved' ? new Date().toISOString() : undefined,
      enrolledCourseIds: data.directEnrollCourseId ? [data.directEnrollCourseId] : [],
    };

    const updated = [newStudent, ...students];
    setStorageItem(STORAGE_KEYS.STUDENTS, updated);

    // If batch & course assigned, create enrollment directly
    if (data.directEnrollCourseId) {
      const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
      const newEnrollment: Enrollment = {
        id: `enr-${Date.now()}`,
        studentId: newId,
        courseId: data.directEnrollCourseId,
        batchId: data.directEnrollBatchId,
        status: 'active',
        enrolledAt: new Date().toISOString(),
        progressPercentage: 0,
        completedLessonIds: [],
        bookmarkedLessonIds: [],
      };
      setStorageItem(STORAGE_KEYS.ENROLLMENTS, [newEnrollment, ...enrollments]);
    }

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'ADMIN_ADD_STUDENT',
      `Student: ${newStudent.name} (${newId})`,
      `Direct student creation by Administrator. Approval status: ${newStudent.adminApprovalStatus}.`
    );

    return { success: true, data: newStudent, message: 'Student registered successfully.' };
  },

  async updateStudentStatus(
    admin: { id: string; name: string },
    studentId: string,
    status: 'active' | 'suspended' | 'deactivated'
  ): Promise<ApiResponse<StudentProfile>> {
    await sleep(200);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);
    const idx = students.findIndex((s) => s.id === studentId);
    if (idx === -1) return { success: false, data: null as any, error: 'Student not found.' };

    students[idx].status = status as any;
    if (status === 'suspended') {
      students[idx].accountState = 'suspended';
    } else if (status === 'active') {
      students[idx].accountState = students[idx].adminApprovalStatus === 'approved' ? 'approved' : 'pending_approval';
      students[idx].failedLoginAttempts = 0;
    }
    setStorageItem(STORAGE_KEYS.STUDENTS, students);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'STUDENT_STATUS_UPDATED',
      `Student: ${students[idx].name} (${studentId})`,
      `Account status updated to: ${status.toUpperCase()}`
    );

    return { success: true, data: students[idx], message: `Student marked as ${status}.` };
  },

  async unlockStudentAccount(
    admin: { id: string; name: string },
    studentId: string
  ): Promise<ApiResponse<StudentProfile>> {
    await sleep(200);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);
    const idx = students.findIndex((s) => s.id === studentId);
    if (idx === -1) return { success: false, data: null as any, error: 'Student not found.' };

    students[idx].failedLoginAttempts = 0;
    students[idx].accountState = students[idx].adminApprovalStatus === 'approved' ? 'approved' : 'pending_approval';
    setStorageItem(STORAGE_KEYS.STUDENTS, students);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'ACCOUNT_UNLOCKED_BY_ADMIN',
      `Student: ${students[idx].name} (${studentId})`,
      'Account lockout cleared and login attempts reset.'
    );

    return { success: true, data: students[idx], message: `Account unlocked for ${students[idx].name}.` };
  },

  async approveStudentRegistration(
    admin: { id: string; name: string },
    studentId: string,
    remarks?: string
  ): Promise<ApiResponse<StudentProfile>> {
    await sleep(250);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);
    const idx = students.findIndex((s) => s.id === studentId);
    if (idx === -1) return { success: false, data: null as any, error: 'Student not found.' };

    students[idx].adminApprovalStatus = 'approved';
    students[idx].accountState = 'approved';
    students[idx].status = 'active';
    students[idx].adminApprovalRemarks = remarks || 'Approved by Administrator.';
    students[idx].approvedAt = new Date().toISOString();
    setStorageItem(STORAGE_KEYS.STUDENTS, students);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'STUDENT_REGISTRATION_APPROVED',
      `Student: ${students[idx].name} (${studentId})`,
      remarks || 'Admin approved student application. Account eligible to select courses and initiate payment (BR-002).'
    );

    return {
      success: true,
      data: students[idx],
      message: 'Student approved successfully. Student can now proceed to payment.',
    };
  },

  async rejectStudentRegistration(
    admin: { id: string; name: string },
    studentId: string,
    remarks: string
  ): Promise<ApiResponse<StudentProfile>> {
    await sleep(250);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);
    const idx = students.findIndex((s) => s.id === studentId);
    if (idx === -1) return { success: false, data: null as any, error: 'Student not found.' };

    students[idx].adminApprovalStatus = 'rejected';
    students[idx].accountState = 'rejected';
    students[idx].adminApprovalRemarks = remarks;
    setStorageItem(STORAGE_KEYS.STUDENTS, students);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'STUDENT_REGISTRATION_REJECTED',
      `Student: ${students[idx].name} (${studentId})`,
      `Rejection reason: ${remarks}`
    );

    return { success: true, data: students[idx], message: 'Student registration rejected.' };
  },

  /**
   * 3. Enrollment Management (ADM-005)
   */
  async getEnrollments(): Promise<ApiResponse<Enrollment[]>> {
    await sleep();
    const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
    return { success: true, data: enrollments };
  },

  async createEnrollment(
    admin: { id: string; name: string },
    data: {
      studentId: string;
      courseId: string;
      batchId?: string;
      discountAmountINR?: number;
      paymentMode?: string;
      paymentStatus?: 'active' | 'pending_approval' | 'approved_unpaid';
    }
  ): Promise<ApiResponse<Enrollment>> {
    await sleep(300);
    const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);

    // Check existing
    let enr = enrollments.find((e) => e.studentId === data.studentId && e.courseId === data.courseId);
    if (enr) {
      enr.batchId = data.batchId || enr.batchId;
      enr.status = data.paymentStatus || 'active';
      setStorageItem(STORAGE_KEYS.ENROLLMENTS, enrollments);
      return { success: true, data: enr, message: 'Existing enrollment updated.' };
    }

    const newEnr: Enrollment = {
      id: `enr-${Date.now()}`,
      studentId: data.studentId,
      courseId: data.courseId,
      batchId: data.batchId,
      status: data.paymentStatus || 'active',
      enrolledAt: new Date().toISOString(),
      progressPercentage: 0,
      completedLessonIds: [],
      bookmarkedLessonIds: [],
    };

    setStorageItem(STORAGE_KEYS.ENROLLMENTS, [newEnr, ...enrollments]);

    // Update student's enrolled courses list
    const stuIdx = students.findIndex((s) => s.id === data.studentId);
    if (stuIdx !== -1) {
      if (!students[stuIdx].enrolledCourseIds.includes(data.courseId)) {
        students[stuIdx].enrolledCourseIds.push(data.courseId);
        setStorageItem(STORAGE_KEYS.STUDENTS, students);
      }
    }

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'STUDENT_ENROLLED',
      `Student ID: ${data.studentId} Course: ${data.courseId}`,
      `Enrolled into Course: ${data.courseId}, Batch: ${data.batchId || 'Default'}. Discount Applied: ₹${data.discountAmountINR || 0}.`
    );

    return { success: true, data: newEnr, message: 'Student successfully enrolled.' };
  },

  async updateEnrollmentStatus(
    admin: { id: string; name: string },
    enrollmentId: string,
    status: 'active' | 'completed' | 'cancelled' | 'suspended' | 'pending_approval' | 'approved_unpaid'
  ): Promise<ApiResponse<Enrollment>> {
    await sleep(200);
    const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
    const idx = enrollments.findIndex((e) => e.id === enrollmentId);
    if (idx === -1) return { success: false, data: null as any, error: 'Enrollment not found.' };

    enrollments[idx].status = status;
    setStorageItem(STORAGE_KEYS.ENROLLMENTS, enrollments);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'ENROLLMENT_STATUS_CHANGED',
      `Enrollment ID: ${enrollmentId}`,
      `Status changed to: ${status.toUpperCase()}`
    );

    return { success: true, data: enrollments[idx], message: `Enrollment status updated to ${status}.` };
  },

  /**
   * 4. Course Management (ADM-006)
   */
  async getCourses(): Promise<ApiResponse<Course[]>> {
    await sleep();
    const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
    return { success: true, data: courses };
  },

  async createCourse(admin: { id: string; name: string }, courseData: Omit<Course, 'id'>): Promise<ApiResponse<Course>> {
    await sleep(300);
    const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
    const newCourse: Course = {
      ...courseData,
      id: `course-${Date.now().toString().slice(-4)}`,
    };
    setStorageItem(STORAGE_KEYS.COURSES, [newCourse, ...courses]);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'COURSE_CREATED',
      `Course: ${newCourse.title} (${newCourse.id})`,
      `Created new course catalog item. Fee: ₹${newCourse.feeINR}.`
    );

    return { success: true, data: newCourse, message: 'New course created successfully.' };
  },

  async updateCourse(admin: { id: string; name: string }, courseId: string, updates: Partial<Course>): Promise<ApiResponse<Course>> {
    await sleep(250);
    const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
    const idx = courses.findIndex((c) => c.id === courseId);
    if (idx === -1) return { success: false, data: null as any, error: 'Course not found.' };

    courses[idx] = { ...courses[idx], ...updates };
    setStorageItem(STORAGE_KEYS.COURSES, courses);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'COURSE_UPDATED',
      `Course: ${courses[idx].title} (${courseId})`,
      'Updated course details, fees or syllabus parameters.'
    );

    return { success: true, data: courses[idx], message: 'Course updated successfully.' };
  },

  async toggleCoursePublish(admin: { id: string; name: string }, courseId: string): Promise<ApiResponse<Course>> {
    await sleep(200);
    const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
    const idx = courses.findIndex((c) => c.id === courseId);
    if (idx === -1) return { success: false, data: null as any, error: 'Course not found.' };

    courses[idx].isPublished = !courses[idx].isPublished;
    courses[idx].status = courses[idx].isPublished ? 'Published' : 'Draft';
    setStorageItem(STORAGE_KEYS.COURSES, courses);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'COURSE_VISIBILITY_TOGGLED',
      `Course: ${courses[idx].title}`,
      `Published status set to: ${courses[idx].isPublished}`
    );

    return { success: true, data: courses[idx], message: `Course ${courses[idx].isPublished ? 'published' : 'unpublished'}.` };
  },

  async updateCourseStatus(
    admin: { id: string; name: string },
    courseId: string,
    status: CourseStatus
  ): Promise<ApiResponse<Course>> {
    await sleep(200);
    const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
    const idx = courses.findIndex((c) => c.id === courseId);
    if (idx === -1) return { success: false, data: null as any, error: 'Course not found.' };

    courses[idx].status = status;
    courses[idx].isPublished = status === 'Published' || status === 'Active';
    setStorageItem(STORAGE_KEYS.COURSES, courses);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'COURSE_STATUS_UPDATED',
      `Course: ${courses[idx].title} (${courseId})`,
      `Lifecycle status transitioned to: ${status}`
    );

    return { success: true, data: courses[idx], message: `Course status set to ${status}.` };
  },

  async updateCourseCurriculum(
    admin: { id: string; name: string },
    courseId: string,
    modules: CourseModule[]
  ): Promise<ApiResponse<Course>> {
    await sleep(250);
    const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
    const idx = courses.findIndex((c) => c.id === courseId);
    if (idx === -1) return { success: false, data: null as any, error: 'Course not found.' };

    courses[idx].modules = modules;
    setStorageItem(STORAGE_KEYS.COURSES, courses);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'CURRICULUM_UPDATED',
      `Course: ${courses[idx].title} (${courseId})`,
      `Syllabus updated: ${modules.length} modules configured.`
    );

    return { success: true, data: courses[idx], message: 'Curriculum syllabus updated successfully.' };
  },

  async archiveCourse(
    admin: { id: string; name: string },
    courseId: string
  ): Promise<ApiResponse<Course>> {
    return this.updateCourseStatus(admin, courseId, 'Archived');
  },

  /**
   * 5. Batch Management (ADM-007)
   */
  async getBatches(): Promise<ApiResponse<Batch[]>> {
    await sleep();
    const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);
    return { success: true, data: batches };
  },

  async getBatchById(batchId: string): Promise<ApiResponse<Batch>> {
    await sleep(100);
    const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) return { success: false, data: null as any, error: 'Batch not found.' };
    return { success: true, data: batch };
  },

  async getBatchStudents(batchId: string): Promise<ApiResponse<{ student: StudentProfile; enrollment: Enrollment }[]>> {
    await sleep(150);
    const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [SEED_USERS.student]);

    const batchEnrollments = enrollments.filter((e) => e.batchId === batchId);
    const roster = batchEnrollments
      .map((enr) => {
        const student = students.find((s) => s.id === enr.studentId);
        if (!student) return null;
        return { student, enrollment: enr };
      })
      .filter(Boolean) as { student: StudentProfile; enrollment: Enrollment }[];

    return { success: true, data: roster };
  },

  async createBatch(admin: { id: string; name: string }, batchData: Omit<Batch, 'id' | 'enrolledStudentIds'>): Promise<ApiResponse<Batch>> {
    await sleep(250);
    const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);
    const newBatch: Batch = {
      ...batchData,
      id: `batch-${Date.now().toString().slice(-4)}`,
      enrolledStudentIds: [],
    };
    setStorageItem(STORAGE_KEYS.BATCHES, [newBatch, ...batches]);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'BATCH_CREATED',
      `Batch: ${newBatch.name} (${newBatch.batchCode})`,
      `Created cohort for Course: ${newBatch.courseName}. Capacity: ${newBatch.maxCapacity}. Meeting: ${newBatch.meetingUrl || 'TBD'}.`
    );

    return { success: true, data: newBatch, message: 'New batch cohort created successfully.' };
  },

  async updateBatch(admin: { id: string; name: string }, batchId: string, updates: Partial<Batch>): Promise<ApiResponse<Batch>> {
    await sleep(200);
    const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);
    const idx = batches.findIndex((b) => b.id === batchId);
    if (idx === -1) return { success: false, data: null as any, error: 'Batch not found.' };

    batches[idx] = { ...batches[idx], ...updates };
    setStorageItem(STORAGE_KEYS.BATCHES, batches);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'BATCH_UPDATED',
      `Batch: ${batches[idx].name} (${batchId})`,
      'Updated batch cohort details, timing or faculty assignment.'
    );

    return { success: true, data: batches[idx], message: 'Batch cohort updated.' };
  },

  async updateBatchStatus(
    admin: { id: string; name: string },
    batchId: string,
    status: BatchStatus
  ): Promise<ApiResponse<Batch>> {
    return this.updateBatch(admin, batchId, { status });
  },

  /**
   * 6. Teacher Management & Allocation (ADM-008)
   */
  async getTeachers(): Promise<ApiResponse<TeacherProfile[]>> {
    await sleep();
    const teachers = getStorageItem<TeacherProfile[]>(STORAGE_KEYS.TEACHERS, [SEED_USERS.teacher]);
    return { success: true, data: teachers };
  },

  async addTeacher(admin: { id: string; name: string }, teacherData: Omit<TeacherProfile, 'id' | 'createdAt' | 'role' | 'status' | 'assignedCourseIds' | 'assignedBatchIds' | 'rating'>): Promise<ApiResponse<TeacherProfile>> {
    await sleep(250);
    const teachers = getStorageItem<TeacherProfile[]>(STORAGE_KEYS.TEACHERS, [SEED_USERS.teacher]);
    const newId = `user-tch-${Date.now().toString().slice(-4)}`;

    const newTeacher: TeacherProfile = {
      ...teacherData,
      id: newId,
      createdAt: new Date().toISOString(),
      role: 'teacher',
      status: 'active',
      assignedCourseIds: [],
      assignedBatchIds: [],
      rating: 5.0,
      avatarUrl: teacherData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    };

    setStorageItem(STORAGE_KEYS.TEACHERS, [newTeacher, ...teachers]);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'TEACHER_ADDED',
      `Teacher: ${newTeacher.name} (${newId})`,
      `Specialization: ${newTeacher.specialization}. Experience: ${newTeacher.experienceYears} Years.`
    );

    return { success: true, data: newTeacher, message: 'Faculty member onboarded successfully.' };
  },

  async allocateTeacher(
    admin: { id: string; name: string },
    teacherId: string,
    courseId: string,
    batchId: string
  ): Promise<ApiResponse<{ teacher: TeacherProfile; batch: Batch }>> {
    await sleep(250);
    const teachers = getStorageItem<TeacherProfile[]>(STORAGE_KEYS.TEACHERS, [SEED_USERS.teacher]);
    const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);

    const tIdx = teachers.findIndex((t) => t.id === teacherId);
    const bIdx = batches.findIndex((b) => b.id === batchId);

    if (tIdx === -1 || bIdx === -1) {
      return { success: false, data: null as any, error: 'Teacher or Batch record not found.' };
    }

    if (!teachers[tIdx].assignedCourseIds.includes(courseId)) {
      teachers[tIdx].assignedCourseIds.push(courseId);
    }
    if (!teachers[tIdx].assignedBatchIds.includes(batchId)) {
      teachers[tIdx].assignedBatchIds.push(batchId);
    }

    if (!batches[bIdx].assignedTeacherIds.includes(teacherId)) {
      batches[bIdx].assignedTeacherIds.push(teacherId);
    }

    setStorageItem(STORAGE_KEYS.TEACHERS, teachers);
    setStorageItem(STORAGE_KEYS.BATCHES, batches);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'TEACHER_ALLOCATED_TO_BATCH',
      `Teacher: ${teachers[tIdx].name} -> Batch: ${batches[bIdx].name}`,
      `Assigned instructor to Course: ${courseId}, Batch: ${batchId}.`
    );

    return {
      success: true,
      data: { teacher: teachers[tIdx], batch: batches[bIdx] },
      message: `${teachers[tIdx].name} successfully allocated to ${batches[bIdx].name}.`,
    };
  },

  async unallocateTeacher(
    admin: { id: string; name: string },
    teacherId: string,
    batchId: string
  ): Promise<ApiResponse<boolean>> {
    await sleep(200);
    const teachers = getStorageItem<TeacherProfile[]>(STORAGE_KEYS.TEACHERS, [SEED_USERS.teacher]);
    const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);

    const tIdx = teachers.findIndex((t) => t.id === teacherId);
    const bIdx = batches.findIndex((b) => b.id === batchId);

    if (tIdx !== -1) {
      teachers[tIdx].assignedBatchIds = teachers[tIdx].assignedBatchIds.filter((b) => b !== batchId);
      setStorageItem(STORAGE_KEYS.TEACHERS, teachers);
    }

    if (bIdx !== -1) {
      batches[bIdx].assignedTeacherIds = batches[bIdx].assignedTeacherIds.filter((t) => t !== teacherId);
      setStorageItem(STORAGE_KEYS.BATCHES, batches);
    }

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'TEACHER_UNALLOCATED_FROM_BATCH',
      `Teacher ID: ${teacherId} Batch ID: ${batchId}`,
      'Instructor assignment removed from cohort.'
    );

    return { success: true, data: true, message: 'Teacher assignment removed.' };
  },

  /**
   * 7. Payments & Discounts (ADM-009, ADM-010)
   */
  async getPayments(): Promise<ApiResponse<PaymentTransaction[]>> {
    await sleep();
    const payments = getStorageItem<PaymentTransaction[]>(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
    return { success: true, data: payments };
  },

  async recordManualPayment(
    admin: { id: string; name: string },
    data: {
      studentId: string;
      studentName: string;
      courseId: string;
      courseTitle: string;
      amountINR: number;
      paymentMethod: any;
      receiptNumber: string;
      notes: string;
    }
  ): Promise<ApiResponse<PaymentTransaction>> {
    await sleep(300);
    const payments = getStorageItem<PaymentTransaction[]>(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
    const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);

    const newTx: PaymentTransaction = {
      id: `pay-${Date.now()}`,
      orderId: `manual_${Date.now()}`,
      studentId: data.studentId,
      studentName: data.studentName,
      courseId: data.courseId,
      courseTitle: data.courseTitle,
      amountINR: data.amountINR,
      discountAppliedINR: 0,
      finalAmountINR: data.amountINR,
      status: 'successful',
      paymentMethod: data.paymentMethod,
      receiptNumber: data.receiptNumber,
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isManualEntry: true,
      manualEnteredByAdminId: admin.id,
      manualNotes: data.notes,
    };

    setStorageItem(STORAGE_KEYS.PAYMENTS, [newTx, ...payments]);

    // Activate enrollment
    let enr = enrollments.find((e) => e.studentId === data.studentId && e.courseId === data.courseId);
    if (enr) {
      enr.status = 'active';
    } else {
      enr = {
        id: `enr-${Date.now()}`,
        studentId: data.studentId,
        courseId: data.courseId,
        status: 'active',
        enrolledAt: new Date().toISOString(),
        progressPercentage: 0,
        completedLessonIds: [],
        bookmarkedLessonIds: [],
      };
      enrollments.push(enr);
    }
    setStorageItem(STORAGE_KEYS.ENROLLMENTS, enrollments);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'MANUAL_PAYMENT_ENTRY',
      `Payment: ${data.receiptNumber} Student: ${data.studentName}`,
      `Recorded manual ${data.paymentMethod} payment of ₹ ${data.amountINR}. Notes: ${data.notes}. Enrollment activated (BR-017).`
    );

    return {
      success: true,
      data: newTx,
      message: 'Manual payment recorded and course access activated.',
    };
  },

  async getDiscounts(): Promise<ApiResponse<CouponDiscount[]>> {
    await sleep();
    const discounts = getStorageItem<CouponDiscount[]>(STORAGE_KEYS.DISCOUNTS, [
      {
        id: 'disc-01',
        code: 'DIWALI2026',
        description: 'Festive scholarship flat reduction for early applicants',
        discountType: 'fixed_amount',
        value: 7000,
        applicableCourseIds: [],
        isActive: true,
        validUntil: '2026-12-31',
      },
      {
        id: 'disc-02',
        code: 'MERIT25',
        description: 'Merit scholarship for university toppers & 8.5+ CGPA',
        discountType: 'percentage',
        value: 25,
        applicableCourseIds: ['course-fsd-01', 'course-ds-03'],
        isActive: true,
        validUntil: '2027-03-31',
      },
    ]);
    return { success: true, data: discounts };
  },

  async createDiscount(
    admin: { id: string; name: string },
    data: Omit<CouponDiscount, 'id'>
  ): Promise<ApiResponse<CouponDiscount>> {
    await sleep(200);
    const discounts = (await this.getDiscounts()).data;
    const newDiscount: CouponDiscount = {
      ...data,
      id: `disc-${Date.now().toString().slice(-4)}`,
    };
    const updated = [newDiscount, ...discounts];
    setStorageItem(STORAGE_KEYS.DISCOUNTS, updated);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'DISCOUNT_COUPON_CREATED',
      `Coupon: ${newDiscount.code}`,
      `Created coupon code of value ${newDiscount.value} (${newDiscount.discountType}). Valid until ${newDiscount.validUntil}.`
    );

    return { success: true, data: newDiscount, message: 'Discount coupon created.' };
  },

  async toggleDiscount(admin: { id: string; name: string }, discountId: string): Promise<ApiResponse<CouponDiscount>> {
    await sleep(150);
    const discounts = (await this.getDiscounts()).data;
    const idx = discounts.findIndex((d) => d.id === discountId);
    if (idx === -1) return { success: false, data: null as any, error: 'Discount not found.' };

    discounts[idx].isActive = !discounts[idx].isActive;
    setStorageItem(STORAGE_KEYS.DISCOUNTS, discounts);

    return { success: true, data: discounts[idx], message: `Coupon is now ${discounts[idx].isActive ? 'Active' : 'Inactive'}.` };
  },

  async deleteDiscount(admin: { id: string; name: string }, discountId: string): Promise<ApiResponse<boolean>> {
    await sleep(150);
    const discounts = (await this.getDiscounts()).data;
    const updated = discounts.filter((d) => d.id !== discountId);
    setStorageItem(STORAGE_KEYS.DISCOUNTS, updated);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'DISCOUNT_COUPON_DELETED',
      `Discount ID: ${discountId}`,
      'Removed coupon from promotional ledger.'
    );

    return { success: true, data: true, message: 'Coupon deleted.' };
  },

  /**
   * 8. Attendance Management (ADM-011)
   */
  async getAttendanceSessions(): Promise<ApiResponse<AttendanceSession[]>> {
    await sleep();
    const sessions = getStorageItem<AttendanceSession[]>(STORAGE_KEYS.ATTENDANCE, SEED_ATTENDANCE_SESSIONS);
    return { success: true, data: sessions };
  },

  async correctAttendanceRecord(
    admin: { id: string; name: string },
    sessionId: string,
    studentId: string,
    newStatus: 'present' | 'absent' | 'leave',
    auditRemarks: string
  ): Promise<ApiResponse<AttendanceSession>> {
    await sleep(250);
    const sessions = getStorageItem<AttendanceSession[]>(STORAGE_KEYS.ATTENDANCE, SEED_ATTENDANCE_SESSIONS);
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) return { success: false, data: null as any, error: 'Session not found.' };

    const recIdx = sessions[idx].records.findIndex((r) => r.studentId === studentId);
    if (recIdx === -1) return { success: false, data: null as any, error: 'Student record not found in this session.' };

    const oldStatus = sessions[idx].records[recIdx].status;
    sessions[idx].records[recIdx].status = newStatus;
    setStorageItem(STORAGE_KEYS.ATTENDANCE, sessions);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'ATTENDANCE_RECORD_CORRECTED',
      `Session: ${sessions[idx].topicCovered} (${sessions[idx].sessionDate}) - Student: ${sessions[idx].records[recIdx].studentName}`,
      `Changed status from ${oldStatus.toUpperCase()} to ${newStatus.toUpperCase()}. Reason: ${auditRemarks}`
    );

    return { success: true, data: sessions[idx], message: 'Attendance record audited and updated.' };
  },

  /**
   * 9. Assignments & Tests (ADM-011)
   */
  async getAssignments(): Promise<ApiResponse<Assignment[]>> {
    await sleep();
    const assignments = getStorageItem<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, SEED_ASSIGNMENTS);
    return { success: true, data: assignments };
  },

  async getAssignmentSubmissions(): Promise<ApiResponse<AssignmentSubmission[]>> {
    await sleep();
    const subs = getStorageItem<AssignmentSubmission[]>(STORAGE_KEYS.SUBMISSIONS, SEED_ASSIGNMENT_SUBMISSIONS);
    return { success: true, data: subs };
  },

  async getTests(): Promise<ApiResponse<OnlineTest[]>> {
    await sleep();
    const tests = getStorageItem<OnlineTest[]>(STORAGE_KEYS.TESTS, SEED_TESTS);
    return { success: true, data: tests };
  },

  async getTestAttempts(): Promise<ApiResponse<TestAttempt[]>> {
    await sleep();
    const attempts = getStorageItem<TestAttempt[]>(STORAGE_KEYS.TEST_ATTEMPTS, SEED_TEST_ATTEMPTS);
    return { success: true, data: attempts };
  },

  async authorizeTestRetake(
    admin: { id: string; name: string },
    attemptId: string,
    reason: string
  ): Promise<ApiResponse<TestAttempt>> {
    await sleep(250);
    const attempts = getStorageItem<TestAttempt[]>(STORAGE_KEYS.TEST_ATTEMPTS, SEED_TEST_ATTEMPTS);
    const idx = attempts.findIndex((a) => a.id === attemptId);
    if (idx === -1) return { success: false, data: null as any, error: 'Test attempt not found.' };

    attempts[idx].isRetakeAuthorized = true;
    attempts[idx].retakeAuthorizedBy = admin.id;
    attempts[idx].retakeOverrideByAdmin = true;
    attempts[idx].retakeRequestStatus = 'approved';
    setStorageItem(STORAGE_KEYS.TEST_ATTEMPTS, attempts);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'EXAM_RETAKE_AUTHORIZED_ADMIN',
      `Attempt: ${attemptId} Student: ${attempts[idx].studentName}`,
      `Admin authorized retake override (SRS BR-012). Reason: ${reason}`
    );

    return {
      success: true,
      data: attempts[idx],
      message: 'Student granted authorized exam retake override.',
    };
  },

  /**
   * 10. Certificates (ADM-012)
   */
  async getCertificates(): Promise<ApiResponse<CertificateRecord[]>> {
    await sleep();
    const certificates = getStorageItem<CertificateRecord[]>(STORAGE_KEYS.CERTIFICATES, SEED_CERTIFICATES);
    return { success: true, data: certificates };
  },

  async issueCertificate(
    admin: { id: string; name: string },
    data: {
      studentId: string;
      studentName: string;
      courseId: string;
      courseTitle: string;
      attendancePercentage: number;
      examScorePercentage: number;
      templateId?: 'standard_dark' | 'executive_gold' | 'minimal_blue';
    }
  ): Promise<ApiResponse<CertificateRecord>> {
    await sleep(300);
    const certificates = getStorageItem<CertificateRecord[]>(STORAGE_KEYS.CERTIFICATES, SEED_CERTIFICATES);
    const certNumber = `NEX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCert: CertificateRecord = {
      id: `cert-${Date.now()}`,
      certificateNumber: certNumber,
      studentId: data.studentId,
      studentName: data.studentName,
      courseId: data.courseId,
      courseTitle: data.courseTitle,
      issueDate: new Date().toISOString().split('T')[0],
      completionDate: new Date().toISOString().split('T')[0],
      attendancePercentage: data.attendancePercentage,
      examScorePercentage: data.examScorePercentage,
      status: 'valid',
      qrVerificationUrl: `/verify-certificate?id=${certNumber}`,
      templateId: data.templateId || 'standard_dark',
      issuedManuallyByAdminId: admin.id,
    };

    setStorageItem(STORAGE_KEYS.CERTIFICATES, [newCert, ...certificates]);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'CERTIFICATE_ISSUED_MANUAL',
      `Certificate: ${certNumber} (${data.studentName})`,
      `Admin manual issuance verified. Template: ${data.templateId || 'standard_dark'}. Attendance: ${data.attendancePercentage}%, Exam: ${data.examScorePercentage}% (BR-011).`
    );

    return { success: true, data: newCert, message: `Certificate ${certNumber} successfully issued.` };
  },

  async revokeCertificate(
    admin: { id: string; name: string },
    certificateId: string,
    reason: string
  ): Promise<ApiResponse<CertificateRecord>> {
    await sleep(250);
    const certificates = getStorageItem<CertificateRecord[]>(STORAGE_KEYS.CERTIFICATES, SEED_CERTIFICATES);
    const idx = certificates.findIndex((c) => c.id === certificateId);
    if (idx === -1) return { success: false, data: null as any, error: 'Certificate not found.' };

    certificates[idx].status = 'revoked';
    certificates[idx].revokedAt = new Date().toISOString();
    certificates[idx].revokedByUserId = admin.id;
    certificates[idx].revocationReason = reason;
    setStorageItem(STORAGE_KEYS.CERTIFICATES, certificates);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'CERTIFICATE_REVOKED',
      `Certificate: ${certificates[idx].certificateNumber}`,
      `Revocation reason: ${reason} (CER-008).`
    );

    return { success: true, data: certificates[idx], message: 'Certificate has been revoked.' };
  },

  /**
   * 11. Placement & Mock Interviews (ADM-012)
   */
  async getHiringCompanies(): Promise<ApiResponse<HiringCompany[]>> {
    await sleep();
    const companies = getStorageItem<HiringCompany[]>(STORAGE_KEYS.JOBS, SEED_COMPANIES as any);
    return { success: true, data: companies };
  },

  async getJobOpenings(): Promise<ApiResponse<JobOpening[]>> {
    await sleep();
    const jobs = getStorageItem<JobOpening[]>(STORAGE_KEYS.JOBS, SEED_JOBS);
    return { success: true, data: jobs };
  },

  async createJobOpening(
    admin: { id: string; name: string },
    jobData: Omit<JobOpening, 'id' | 'postedAt' | 'isActive'>
  ): Promise<ApiResponse<JobOpening>> {
    await sleep(250);
    const jobs = getStorageItem<JobOpening[]>(STORAGE_KEYS.JOBS, SEED_JOBS);
    const newJob: JobOpening = {
      ...jobData,
      id: `job-${Date.now().toString().slice(-4)}`,
      postedAt: new Date().toISOString().split('T')[0],
      isActive: true,
    };
    setStorageItem(STORAGE_KEYS.JOBS, [newJob, ...jobs]);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'JOB_OPENING_CREATED',
      `Job: ${newJob.title} at ${newJob.companyName}`,
      `Package: ${newJob.salaryPackageCTC}. Openings: ${newJob.openingsCount}.`
    );

    return { success: true, data: newJob, message: 'Campus placement drive posted.' };
  },

  async getJobApplications(): Promise<ApiResponse<JobApplication[]>> {
    await sleep();
    const apps = getStorageItem<JobApplication[]>(STORAGE_KEYS.APPLICATIONS, SEED_APPLICATIONS);
    return { success: true, data: apps };
  },

  async updateJobApplicationStatus(
    admin: { id: string; name: string },
    applicationId: string,
    status: any,
    currentRoundNotes?: string,
    offerSalaryCTC?: string
  ): Promise<ApiResponse<JobApplication>> {
    await sleep(200);
    const apps = getStorageItem<JobApplication[]>(STORAGE_KEYS.APPLICATIONS, SEED_APPLICATIONS);
    const idx = apps.findIndex((a) => a.id === applicationId);
    if (idx === -1) return { success: false, data: null as any, error: 'Application not found.' };

    apps[idx].status = status;
    if (currentRoundNotes) apps[idx].currentRoundNotes = currentRoundNotes;
    if (offerSalaryCTC) apps[idx].offerSalaryCTC = offerSalaryCTC;
    setStorageItem(STORAGE_KEYS.APPLICATIONS, apps);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'JOB_APPLICATION_STAGE_UPDATED',
      `Candidate: ${apps[idx].studentName} - Job: ${apps[idx].jobTitle}`,
      `Status changed to: ${status}. Notes: ${currentRoundNotes || 'None'}.`
    );

    return { success: true, data: apps[idx], message: 'Candidate recruitment status updated.' };
  },

  async getMockInterviews(): Promise<ApiResponse<MockInterviewSchedule[]>> {
    await sleep();
    const mocks = getStorageItem<MockInterviewSchedule[]>(STORAGE_KEYS.MOCK_INTERVIEWS, SEED_MOCK_INTERVIEWS);
    return { success: true, data: mocks };
  },

  async scheduleMockInterview(
    admin: { id: string; name: string },
    data: Omit<MockInterviewSchedule, 'id' | 'status'>
  ): Promise<ApiResponse<MockInterviewSchedule>> {
    await sleep(250);
    const mocks = getStorageItem<MockInterviewSchedule[]>(STORAGE_KEYS.MOCK_INTERVIEWS, SEED_MOCK_INTERVIEWS);
    const newMock: MockInterviewSchedule = {
      ...data,
      id: `mock-${Date.now().toString().slice(-4)}`,
      status: 'scheduled',
    };
    setStorageItem(STORAGE_KEYS.MOCK_INTERVIEWS, [newMock, ...mocks]);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'MOCK_INTERVIEW_SCHEDULED',
      `Student: ${data.studentName} with Trainer: ${data.trainerName}`,
      `Interview Type: ${data.interviewType} on ${data.scheduledAt}. Meeting Link: ${data.meetingLink}.`
    );

    return { success: true, data: newMock, message: 'Mock interview scheduled.' };
  },

  /**
   * 12. Notifications & Broadcast Alerts (ADM-013)
   */
  async getNotifications(): Promise<ApiResponse<InAppNotification[]>> {
    await sleep();
    const notifs = getStorageItem<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    return { success: true, data: notifs };
  },

  async sendBroadcastNotification(
    admin: { id: string; name: string },
    data: {
      targetGroup: 'all' | 'students' | 'teachers' | string;
      title: string;
      message: string;
      category: 'academic' | 'exam' | 'placement' | 'general' | 'fee';
      linkUrl?: string;
    }
  ): Promise<ApiResponse<InAppNotification>> {
    await sleep(250);
    const notifs = getStorageItem<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    const newNotif: InAppNotification = {
      id: `notif-${Date.now()}`,
      userId: data.targetGroup,
      title: data.title,
      message: data.message,
      category: data.category as any,
      isRead: false,
      createdAt: new Date().toISOString(),
      linkUrl: data.linkUrl,
    };

    setStorageItem(STORAGE_KEYS.NOTIFICATIONS, [newNotif, ...notifs]);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'BROADCAST_ALERT_SENT',
      `Audience: ${data.targetGroup.toUpperCase()} - Title: ${data.title}`,
      `Category: ${data.category}. Message: ${data.message.slice(0, 100)}...`
    );

    return { success: true, data: newNotif, message: 'Broadcast announcement dispatched.' };
  },

  /**
   * 13. Support Ticket Management (ADM-016)
   */
  async getTickets(): Promise<ApiResponse<SupportTicket[]>> {
    await sleep();
    const tickets = getStorageItem<SupportTicket[]>(STORAGE_KEYS.TICKETS, SEED_TICKETS);
    return { success: true, data: tickets };
  },

  async replyTicket(
    admin: { id: string; name: string },
    ticketId: string,
    message: string,
    newStatus: 'open' | 'in_progress' | 'resolved' | 'closed'
  ): Promise<ApiResponse<SupportTicket>> {
    await sleep(250);
    const tickets = getStorageItem<SupportTicket[]>(STORAGE_KEYS.TICKETS, SEED_TICKETS);
    const idx = tickets.findIndex((t) => t.id === ticketId);
    if (idx === -1) return { success: false, data: null as any, error: 'Ticket not found.' };

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: admin.id,
      senderName: admin.name,
      senderRole: 'admin' as const,
      message,
      sentAt: new Date().toISOString(),
    };

    tickets[idx].messages.push(newMsg);
    tickets[idx].status = newStatus;
    tickets[idx].updatedAt = new Date().toISOString();
    tickets[idx].assignedAdminId = admin.id;

    setStorageItem(STORAGE_KEYS.TICKETS, tickets);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'SUPPORT_TICKET_REPLIED',
      `Ticket: ${tickets[idx].ticketNumber} (${tickets[idx].studentName})`,
      `Status: ${newStatus.toUpperCase()}. Response sent by Admin.`
    );

    return { success: true, data: tickets[idx], message: 'Reply posted to support ticket.' };
  },

  /**
   * 14. Activity Logs (ADM-016)
   */
  async getActivityLogs(): Promise<ApiResponse<AuditLog[]>> {
    await sleep();
    const logs = getStorageItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    return { success: true, data: logs };
  },

  /**
   * 15. Role & Permission Management (ADM-016)
   */
  async getRolesPermissions(): Promise<ApiResponse<Record<string, string[]>>> {
    await sleep();
    const defaultMatrix: Record<string, string[]> = {
      super_admin: [
        'manage_all',
        'approve_students',
        'manage_courses',
        'manage_batches',
        'manage_teachers',
        'manage_payments',
        'manual_payment_entry',
        'override_financials',
        'manage_certificates',
        'revoke_certificates',
        'manage_placements',
        'view_reports',
        'manage_website',
        'system_settings',
      ],
      admin: [
        'approve_students',
        'manage_students',
        'manage_courses',
        'manage_batches',
        'manage_teachers',
        'manage_payments',
        'manual_payment_entry',
        'manage_certificates',
        'revoke_certificates',
        'manage_placements',
        'view_reports',
        'manage_website',
        'manage_support',
      ],
      teacher: [
        'teacher_profile_view',
        'teacher_profile_edit',
        'my_courses_view',
        'my_batches_view',
        'my_batches_edit',
        'student_list_view',
        'attendance_view',
        'attendance_create',
        'attendance_edit',
        'attendance_history_view',
        'materials_view',
        'materials_create',
        'materials_edit',
        'recordings_view',
        'recordings_create',
        'recordings_edit',
        'live_classes_view',
        'live_classes_create',
        'live_classes_edit',
        'live_classes_manage',
        'assignments_view',
        'assignments_create',
        'assignments_edit',
        'assignment_eval_view',
        'assignment_eval_edit',
        'tests_view',
        'tests_create',
        'tests_edit',
        'test_eval_view',
        'test_eval_edit',
        'performance_view',
        'announcements_view',
        'announcements_create',
        'doubts_view',
        'doubts_create',
        'doubts_edit',
        'timetable_view',
        'timetable_edit',
        'mock_interviews_view',
        'mock_interviews_manage',
        'mock_interviews_edit',
        'reports_view',
        'reports_create',
        'notifications_view',
        'retakes_view',
        'retakes_approve',
        'password_edit',
      ],
      student: [
        'view_enrolled_courses',
        'submit_assignments',
        'take_tests',
        'view_attendance',
        'apply_jobs',
        'book_mock_interview',
        'raise_ticket',
      ],
    };

    const matrix = getStorageItem<Record<string, string[]>>(STORAGE_KEYS.ROLES_PERMISSIONS, defaultMatrix);
    return { success: true, data: matrix };
  },

  async updateRolePermissions(
    admin: { id: string; name: string },
    role: string,
    permissions: string[]
  ): Promise<ApiResponse<Record<string, string[]>>> {
    await sleep(250);
    const current = (await this.getRolesPermissions()).data;
    current[role] = permissions;
    setStorageItem(STORAGE_KEYS.ROLES_PERMISSIONS, current);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'ROLE_PERMISSIONS_UPDATED',
      `Role: ${role.toUpperCase()}`,
      `Updated active permissions list (${permissions.length} grants active).`
    );

    return { success: true, data: current, message: `Permissions updated for role ${role}.` };
  },

  /**
   * 16. Institute Settings (ADM-016)
   */
  async getInstituteSettings(): Promise<ApiResponse<InstituteSettings>> {
    await sleep();
    const defaultSettings: InstituteSettings = {
      instituteName: APP_CONFIG.name,
      tagline: APP_CONFIG.tagline,
      supportEmail: APP_CONFIG.supportEmail,
      supportPhone: APP_CONFIG.supportPhone,
      whatsappNumber: APP_CONFIG.whatsappNumber,
      address: APP_CONFIG.address,
      academicSession: '2026-27 Cohort',
      minAttendancePercentage: 75,
      minExamPassPercentage: 60,
      defaultMaxBatchCapacity: 40,
      paymentGatewayMode: 'test',
      currency: 'INR (₹)',
      receiptPrefix: 'REC-NEX',
    };

    const settings = getStorageItem<InstituteSettings>(STORAGE_KEYS.SETTINGS, defaultSettings);
    return { success: true, data: settings };
  },

  async saveInstituteSettings(
    admin: { id: string; name: string },
    settings: InstituteSettings
  ): Promise<ApiResponse<InstituteSettings>> {
    await sleep(250);
    setStorageItem(STORAGE_KEYS.SETTINGS, settings);

    recordAuditLog(
      { id: admin.id, name: admin.name, role: 'admin' },
      'INSTITUTE_SETTINGS_SAVED',
      'System Configuration',
      `Academic Session: ${settings.academicSession}, Attendance Threshold: ${settings.minAttendancePercentage}%, Exam Gate: ${settings.minExamPassPercentage}%.`
    );

    return { success: true, data: settings, message: 'Institute operational settings saved.' };
  },
};
