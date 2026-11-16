import { STORAGE_KEYS } from '../constants/appConfig';
import { getStorageItem, setStorageItem } from '../utils/storage';
import {
  SEED_COURSES,
  SEED_BATCHES,
  SEED_ENROLLMENTS,
  SEED_ATTENDANCE_SESSIONS,
  SEED_ASSIGNMENTS,
  SEED_ASSIGNMENT_SUBMISSIONS,
  SEED_TESTS,
  SEED_TEST_ATTEMPTS,
  SEED_JOBS,
  SEED_APPLICATIONS,
  SEED_TICKETS,
} from '../mocks/seedData';
import { BUSINESS_RULES } from '../constants/businessRules';
import type {
  Course,
  Batch,
  Enrollment,
  EnrollmentStatus,
  AttendanceSession,
  Assignment,
  AssignmentSubmission,
  OnlineTest,
  TestAttempt,
  StudyMaterial,
  RecordedClassItem,
  CertificateEligibilityCheck,
  JobOpening,
  JobApplication,
  SupportTicket,
  TicketCategory,
  TicketPriority,
  StudentDoubt,
  InAppNotification,
  ApiResponse,
  StudentProfile,
} from '../types';

const sleep = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const studentService = {
  /**
   * Enrolled courses with active progress
   */
  async getStudentEnrollments(studentId: string): Promise<ApiResponse<{ enrollment: Enrollment; course: Course; batch?: Batch }[]>> {
    await sleep();
    const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
    const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
    const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);

    const studentEnrollments = enrollments.filter((e) => e.studentId === studentId);
    const enriched = studentEnrollments
      .map((enr) => {
        const course = courses.find((c) => c.id === enr.courseId);
        if (!course) return null;
        const batch = batches.find((b) => b.id === enr.batchId);
        return { enrollment: enr, course, batch };
      })
      .filter(Boolean) as { enrollment: Enrollment; course: Course; batch?: Batch }[];

    return { success: true, data: enriched };
  },

  /**
   * Get active/upcoming cohorts for a course
   */
  async getBatchesForCourse(courseId: string): Promise<ApiResponse<Batch[]>> {
    await sleep(100);
    const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);
    const filtered = batches.filter((b) => b.courseId === courseId && (b.status === 'upcoming' || b.status === 'ongoing'));
    return { success: true, data: filtered };
  },

  /**
   * Request student self-enrollment into a selected course batch (BR-002, BR-005)
   */
  async requestSelfEnrollment(
    studentId: string,
    courseId: string,
    batchId?: string
  ): Promise<ApiResponse<Enrollment>> {
    await sleep(250);
    const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);
    const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);

    const existingIdx = enrollments.findIndex((e) => e.studentId === studentId && e.courseId === courseId);
    if (existingIdx !== -1) {
      if (batchId && enrollments[existingIdx].batchId !== batchId) {
        enrollments[existingIdx].batchId = batchId;
        setStorageItem(STORAGE_KEYS.ENROLLMENTS, enrollments);
      }
      return { success: true, data: enrollments[existingIdx], message: 'Enrollment already exists for this program.' };
    }

    const student = students.find((s) => s.id === studentId);
    // If student is not yet approved by admissions admin (BR-002), enrollment remains pending approval
    const initialStatus: EnrollmentStatus = student?.adminApprovalStatus === 'approved' ? 'approved_unpaid' : 'pending_approval';

    const newEnr: Enrollment = {
      id: `enr-${Date.now()}`,
      studentId,
      courseId,
      batchId,
      enrollmentType: 'self',
      status: initialStatus, // Requires admin approval (BR-002) and payment (BR-005)
      enrolledAt: new Date().toISOString(),
      progressPercentage: 0,
      completedLessonIds: [],
      bookmarkedLessonIds: [],
    };

    setStorageItem(STORAGE_KEYS.ENROLLMENTS, [newEnr, ...enrollments]);

    // Update batch roster
    if (batchId) {
      const bIdx = batches.findIndex((b) => b.id === batchId);
      if (bIdx !== -1 && !batches[bIdx].enrolledStudentIds.includes(studentId)) {
        batches[bIdx].enrolledStudentIds.push(studentId);
        setStorageItem(STORAGE_KEYS.BATCHES, batches);
      }
    }

    // Update student enrolledCourseIds
    const stuIdx = students.findIndex((s) => s.id === studentId);
    if (stuIdx !== -1) {
      if (!students[stuIdx].enrolledCourseIds.includes(courseId)) {
        students[stuIdx].enrolledCourseIds.push(courseId);
        setStorageItem(STORAGE_KEYS.STUDENTS, students);
      }
    }

    return {
      success: true,
      data: newEnr,
      message: 'Course self-enrollment initiated. Please complete the one-time tuition payment to unlock lessons.',
    };
  },

  /**
   * Mark lesson complete and calculate course progress
   */
  async completeLesson(studentId: string, courseId: string, lessonId: string): Promise<ApiResponse<number>> {
    await sleep(150);
    const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
    const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
    const course = courses.find((c) => c.id === courseId);

    const enrIndex = enrollments.findIndex((e) => e.studentId === studentId && e.courseId === courseId);
    if (enrIndex === -1 || !course) {
      return { success: false, data: 0, error: 'Enrollment not found.' };
    }

    const currentCompleted = new Set(enrollments[enrIndex].completedLessonIds || []);
    currentCompleted.add(lessonId);
    enrollments[enrIndex].completedLessonIds = Array.from(currentCompleted);

    // Calculate total lessons in course
    let totalLessons = 0;
    course.modules.forEach((m) => m.chapters.forEach((ch) => (totalLessons += ch.lessons.length)));

    const newProgress = totalLessons > 0 ? Math.min(100, Math.round((currentCompleted.size / totalLessons) * 100)) : 100;
    enrollments[enrIndex].progressPercentage = newProgress;

    setStorageItem(STORAGE_KEYS.ENROLLMENTS, enrollments);
    return { success: true, data: newProgress };
  },

  /**
   * Toggle bookmark lesson
   */
  async toggleBookmarkLesson(studentId: string, courseId: string, lessonId: string): Promise<ApiResponse<boolean>> {
    const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
    const enrIndex = enrollments.findIndex((e) => e.studentId === studentId && e.courseId === courseId);
    if (enrIndex === -1) return { success: false, data: false };

    const bookmarks = new Set(enrollments[enrIndex].bookmarkedLessonIds || []);
    let isBookmarked: boolean;
    if (bookmarks.has(lessonId)) {
      bookmarks.delete(lessonId);
      isBookmarked = false;
    } else {
      bookmarks.add(lessonId);
      isBookmarked = true;
    }

    enrollments[enrIndex].bookmarkedLessonIds = Array.from(bookmarks);
    setStorageItem(STORAGE_KEYS.ENROLLMENTS, enrollments);
    return { success: true, data: isBookmarked };
  },

  /**
   * Student attendance summary and session logs
   */
  async getStudentAttendance(studentId: string): Promise<ApiResponse<{
    percentage: number;
    total: number;
    present: number;
    absent: number;
    leave: number;
    sessions: { date: string; topic: string; status: string; note?: string }[];
  }>> {
    await sleep();
    const sessions = getStorageItem<AttendanceSession[]>(STORAGE_KEYS.ATTENDANCE, SEED_ATTENDANCE_SESSIONS);

    const studentRecords: { date: string; topic: string; status: string; note?: string }[] = [];
    let present = 0;
    let absent = 0;
    let leave = 0;

    sessions.forEach((s) => {
      const rec = s.records.find((r) => r.studentId === studentId);
      if (rec) {
        studentRecords.push({
          date: s.sessionDate,
          topic: s.topicCovered,
          status: rec.status,
          note: rec.note,
        });
        if (rec.status === 'present') present++;
        else if (rec.status === 'absent') absent++;
        else if (rec.status === 'leave') leave++;
      }
    });

    const total = studentRecords.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 100;

    return {
      success: true,
      data: {
        percentage,
        total,
        present,
        absent,
        leave,
        sessions: studentRecords,
      },
    };
  },

  /**
   * Certificate Eligibility Check based on BR-011:
   * 1. Course completion (100%)
   * 2. Attendance >= 75%
   * 3. Passing marks in the examination
   */
  async checkCertificateEligibility(studentId: string, courseId: string): Promise<ApiResponse<CertificateEligibilityCheck>> {
    await sleep();
    const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
    const tests = getStorageItem<OnlineTest[]>(STORAGE_KEYS.TESTS, SEED_TESTS);
    const attempts = getStorageItem<TestAttempt[]>(STORAGE_KEYS.TEST_ATTEMPTS, SEED_TEST_ATTEMPTS);
    const attendanceRes = await studentService.getStudentAttendance(studentId);

    const enrollment = enrollments.find((e) => e.studentId === studentId && e.courseId === courseId);
    const isCourseCompleted = !!enrollment && enrollment.progressPercentage >= 100;
    const attendancePct = attendanceRes.data.percentage;
    const isAttendanceEligible = attendancePct >= BUSINESS_RULES.MIN_ATTENDANCE_FOR_CERTIFICATE;

    const courseTest = tests.find((t) => t.courseId === courseId);
    const testAttempt = courseTest ? attempts.find((a) => a.testId === courseTest.id && a.studentId === studentId) : null;
    const isExamPassed = !!testAttempt && testAttempt.isPassed;
    const examScore = testAttempt ? Math.round((testAttempt.totalScore / (courseTest?.totalMarks || 50)) * 100) : 0;

    const missing: string[] = [];
    if (!isCourseCompleted) missing.push(`Complete all course lessons (Current progress: ${enrollment?.progressPercentage || 0}%)`);
    if (!isAttendanceEligible) missing.push(`Maintain minimum 75% attendance (Current: ${attendancePct}%)`);
    if (!isExamPassed) missing.push('Pass the course competency examination');

    const check: CertificateEligibilityCheck = {
      isCourseCompleted,
      attendancePercentage: attendancePct,
      isAttendanceEligible,
      isExamPassed,
      examScorePercentage: examScore,
      isEligibleOverall: isCourseCompleted && isAttendanceEligible && isExamPassed,
      missingRequirements: missing,
    };

    return { success: true, data: check };
  },

  /**
   * Submit an assignment
   */
  async submitAssignment(
    studentId: string,
    studentName: string,
    assignmentId: string,
    data: { method: any; githubUrl?: string; textContent?: string; fileName?: string }
  ): Promise<ApiResponse<AssignmentSubmission>> {
    await sleep(300);
    const submissions = getStorageItem<AssignmentSubmission[]>(STORAGE_KEYS.SUBMISSIONS, SEED_ASSIGNMENT_SUBMISSIONS);

    const newSub: AssignmentSubmission = {
      id: `sub-${Date.now()}`,
      assignmentId,
      studentId,
      studentName,
      submittedAt: new Date().toISOString(),
      method: data.method,
      githubUrl: data.githubUrl,
      textContent: data.textContent,
      fileName: data.fileName,
      status: 'submitted',
    };

    setStorageItem(STORAGE_KEYS.SUBMISSIONS, [newSub, ...submissions]);
    return { success: true, data: newSub, message: 'Assignment submitted successfully.' };
  },

  /**
   * Submit exam attempt
   */
  async submitTestAttempt(
    studentId: string,
    studentName: string,
    testId: string,
    answers: { questionId: string; selectedOptionIds?: string[]; textAnswer?: string; codeAnswer?: string }[]
  ): Promise<ApiResponse<TestAttempt>> {
    await sleep(400);
    const tests = getStorageItem<OnlineTest[]>(STORAGE_KEYS.TESTS, SEED_TESTS);
    const test = tests.find((t) => t.id === testId);
    const attempts = getStorageItem<TestAttempt[]>(STORAGE_KEYS.TEST_ATTEMPTS, SEED_TEST_ATTEMPTS);

    if (!test) return { success: false, data: null as any, error: 'Test not found.' };

    let totalScore = 0;
    const scoredAnswers = answers.map((ans) => {
      const q = test.questions.find((question) => question.id === ans.questionId);
      let marks = 0;
      if (q && q.correctAnswers) {
        const isMatch =
          ans.selectedOptionIds &&
          ans.selectedOptionIds.length === q.correctAnswers.length &&
          ans.selectedOptionIds.every((opt) => q.correctAnswers?.includes(opt));
        if (isMatch) marks = q.maxMarks;
      } else {
        // Subjective / Coding questions await teacher manual grading
        marks = 0;
      }
      totalScore += marks;
      return { ...ans, marksAwarded: marks };
    });

    const isPassed = totalScore >= Math.round((test.totalMarks * test.passingPercentage) / 100);

    const attempt: TestAttempt = {
      id: `att-${Date.now()}`,
      testId,
      studentId,
      studentName,
      startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      submittedAt: new Date().toISOString(),
      answers: scoredAnswers,
      totalScore,
      isPassed,
      status: 'submitted',
      isRetakeAuthorized: false,
    };

    setStorageItem(STORAGE_KEYS.TEST_ATTEMPTS, [attempt, ...attempts]);
    return { success: true, data: attempt, message: 'Examination submitted successfully.' };
  },

  /**
   * Apply for a job opening (BR-013)
   */
  async applyForJob(studentId: string, studentName: string, jobId: string): Promise<ApiResponse<JobApplication>> {
    await sleep(250);
    const jobs = getStorageItem<JobOpening[]>(STORAGE_KEYS.JOBS, SEED_JOBS);
    const applications = getStorageItem<JobApplication[]>(STORAGE_KEYS.APPLICATIONS, SEED_APPLICATIONS);

    const job = jobs.find((j) => j.id === jobId);
    if (!job) return { success: false, data: null as any, error: 'Job opening not found.' };

    const newApp: JobApplication = {
      id: `app-${Date.now()}`,
      jobId,
      jobTitle: job.title,
      companyName: job.companyName,
      studentId,
      studentName,
      appliedAt: new Date().toISOString(),
      status: 'applied',
    };

    setStorageItem(STORAGE_KEYS.APPLICATIONS, [newApp, ...applications]);
    return { success: true, data: newApp, message: 'Application submitted successfully.' };
  },

  /**
   * Get study materials authorized for student (uploaded by teachers or part of enrolled courses)
   */
  async getStudyMaterialsForStudent(studentId: string): Promise<ApiResponse<StudyMaterial[]>> {
    await sleep(150);
    const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
    const studentEnrs = enrollments.filter((e) => e.studentId === studentId);
    const enrolledCourseIds = studentEnrs.map((e) => e.courseId);
    const enrolledBatchIds = studentEnrs.map((e) => e.batchId);

    const uploaded = getStorageItem<StudyMaterial[]>(STORAGE_KEYS.TEACHER_MATERIALS, []);
    const baseline: StudyMaterial[] = [
      {
        id: 'mat-1',
        courseId: 'course-fsd-01',
        batchId: 'batch-jfs-01',
        title: 'Spring Cloud Gateway & Resilience4j Architecture Blueprint',
        description: 'Comprehensive system diagrams and route configuration templates.',
        fileType: 'pdf',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileSizeBytes: 4200000,
        uploadedByTeacherId: 'user-tch-001',
        uploadedAt: '2026-10-18T10:00:00Z',
        isDownloadRestricted: false,
      },
      {
        id: 'mat-2',
        courseId: 'course-fsd-01',
        batchId: 'batch-jfs-01',
        title: 'Kafka Distributed Event Streaming Cheatsheet',
        description: 'Partition strategies, producer idempotency, and consumer group offset management.',
        fileType: 'pdf',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileSizeBytes: 2100000,
        uploadedByTeacherId: 'user-tch-001',
        uploadedAt: '2026-10-22T14:30:00Z',
        isDownloadRestricted: false,
      },
    ];

    const all = [...uploaded, ...baseline.filter((b) => !uploaded.some((u) => u.id === b.id))];
    const filtered = all.filter(
      (m) =>
        enrolledCourseIds.includes(m.courseId) ||
        (m.batchId && enrolledBatchIds.includes(m.batchId))
    );
    return { success: true, data: filtered };
  },

  /**
   * Get recorded lecture sessions for enrolled student
   */
  async getStudentRecordedClasses(studentId: string): Promise<ApiResponse<RecordedClassItem[]>> {
    await sleep(150);
    const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
    const studentEnrs = enrollments.filter((e) => e.studentId === studentId);
    const enrolledCourseIds = studentEnrs.map((e) => e.courseId);
    const enrolledBatchIds = studentEnrs.map((e) => e.batchId);

    const uploaded = getStorageItem<RecordedClassItem[]>(STORAGE_KEYS.TEACHER_RECORDINGS, []);
    const baseline: RecordedClassItem[] = [
      {
        id: 'rec-01',
        courseId: 'course-fsd-01',
        batchId: 'batch-jfs-01',
        title: 'Kafka Event-Driven Architecture Deep Dive',
        description: 'Live coding producer acknowledgements, consumer groups, and idempotency.',
        moduleName: 'Module 1: Advanced Java & Microservices',
        sessionDate: '2026-11-09',
        durationMinutes: 90,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        uploadedByTeacherId: 'user-tch-001',
        uploadedByTeacherName: 'Dr. Vikram Rao',
        createdAt: '2026-11-09T10:00:00Z',
        isAvailableToStudents: true,
      },
    ];

    const all = [...uploaded, ...baseline.filter((b) => !uploaded.some((u) => u.id === b.id))];
    const filtered = all.filter(
      (r) =>
        enrolledCourseIds.includes(r.courseId) ||
        (r.batchId && enrolledBatchIds.includes(r.batchId))
    );
    return { success: true, data: filtered };
  },

  /**
   * Get assignments and submissions for enrolled student
   */
  async getStudentAssignments(studentId: string): Promise<ApiResponse<{ assignments: Assignment[]; submissions: AssignmentSubmission[] }>> {
    await sleep(150);
    const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
    const studentEnrs = enrollments.filter((e) => e.studentId === studentId);
    const enrolledCourseIds = studentEnrs.map((e) => e.courseId);
    const enrolledBatchIds = studentEnrs.map((e) => e.batchId);

    const allAssignments = getStorageItem<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, SEED_ASSIGNMENTS);
    const allSubmissions = getStorageItem<AssignmentSubmission[]>(STORAGE_KEYS.SUBMISSIONS, SEED_ASSIGNMENT_SUBMISSIONS);

    const filteredAssignments = allAssignments.filter(
      (a) =>
        enrolledCourseIds.includes(a.courseId) ||
        (a.batchId && enrolledBatchIds.includes(a.batchId))
    );
    const mySubmissions = allSubmissions.filter((s) => s.studentId === studentId);

    return { success: true, data: { assignments: filteredAssignments, submissions: mySubmissions } };
  },

  /**
   * Get tests and attempts for enrolled student
   */
  async getStudentOnlineTests(studentId: string): Promise<ApiResponse<{ tests: OnlineTest[]; attempts: TestAttempt[] }>> {
    await sleep(150);
    const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);
    const studentEnrs = enrollments.filter((e) => e.studentId === studentId);
    const enrolledCourseIds = studentEnrs.map((e) => e.courseId);
    const enrolledBatchIds = studentEnrs.map((e) => e.batchId);

    const allTests = getStorageItem<OnlineTest[]>(STORAGE_KEYS.TESTS, SEED_TESTS);
    const allAttempts = getStorageItem<TestAttempt[]>(STORAGE_KEYS.TEST_ATTEMPTS, SEED_TEST_ATTEMPTS);

    const filteredTests = allTests.filter(
      (t) =>
        enrolledCourseIds.includes(t.courseId) ||
        (t.batchId && enrolledBatchIds.includes(t.batchId))
    );
    const myAttempts = allAttempts.filter((a) => a.studentId === studentId);

    return { success: true, data: { tests: filteredTests, attempts: myAttempts } };
  },

  /**
   * Support Tickets for Student (CRD 3.14: SUP-001 to SUP-006)
   */
  async getStudentTickets(studentId: string): Promise<ApiResponse<SupportTicket[]>> {
    await sleep(150);
    const tickets = getStorageItem<SupportTicket[]>(STORAGE_KEYS.TICKETS, SEED_TICKETS);
    const filtered = tickets.filter((t) => t.studentId === studentId);
    return { success: true, data: filtered };
  },

  /**
   * Create a new Support Ticket (CRD 3.14: SUP-001)
   */
  async createTicket(
    student: { id: string; name: string; email: string },
    data: { category: TicketCategory; subject: string; message: string; priority?: TicketPriority }
  ): Promise<ApiResponse<SupportTicket>> {
    await sleep(250);
    const tickets = getStorageItem<SupportTicket[]>(STORAGE_KEYS.TICKETS, SEED_TICKETS);
    const now = new Date().toISOString();
    const newTicket: SupportTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      category: data.category,
      subject: data.subject,
      status: 'open',
      priority: data.priority || 'medium',
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderId: student.id,
          senderName: student.name,
          senderRole: 'student',
          message: data.message,
          sentAt: now,
        },
      ],
    };

    const updated = [newTicket, ...tickets];
    setStorageItem(STORAGE_KEYS.TICKETS, updated);
    return { success: true, data: newTicket, message: 'Support ticket created successfully.' };
  },

  /**
   * Student reply to existing Support Ticket (CRD 3.14: SUP-004)
   */
  async replyTicket(
    student: { id: string; name: string },
    ticketId: string,
    message: string
  ): Promise<ApiResponse<SupportTicket>> {
    await sleep(200);
    const tickets = getStorageItem<SupportTicket[]>(STORAGE_KEYS.TICKETS, SEED_TICKETS);
    const idx = tickets.findIndex((t) => t.id === ticketId);
    if (idx === -1) return { success: false, data: null as any, error: 'Ticket not found.' };

    const now = new Date().toISOString();
    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: student.id,
      senderName: student.name,
      senderRole: 'student' as const,
      message,
      sentAt: now,
    };

    tickets[idx].messages = [...tickets[idx].messages, newMsg];
    tickets[idx].updatedAt = now;
    if (tickets[idx].status === 'resolved' || tickets[idx].status === 'closed') {
      tickets[idx].status = 'open';
    }

    setStorageItem(STORAGE_KEYS.TICKETS, tickets);
    return { success: true, data: tickets[idx], message: 'Reply sent.' };
  },

  /**
   * Placement Job Openings (CRD 3.12: PLC-001, BR-013)
   */
  async getJobOpenings(): Promise<ApiResponse<JobOpening[]>> {
    await sleep(150);
    const jobs = getStorageItem<JobOpening[]>(STORAGE_KEYS.JOBS, SEED_JOBS);
    return { success: true, data: jobs.filter((j) => j.isActive) };
  },

  /**
   * Student Job Applications (CRD 3.12: PLC-007, BR-013)
   */
  async getJobApplicationsForStudent(studentId: string): Promise<ApiResponse<JobApplication[]>> {
    await sleep(150);
    const applications = getStorageItem<JobApplication[]>(STORAGE_KEYS.APPLICATIONS, SEED_APPLICATIONS);
    const studentApps = applications.filter((a) => a.studentId === studentId);
    return { success: true, data: studentApps };
  },

  /**
   * Course Doubts for LMS Viewer (CRD 3.7: LMS-008, 3.5: TCH area 16)
   */
  async getCourseDoubts(courseId: string): Promise<ApiResponse<StudentDoubt[]>> {
    await sleep(150);
    const defaultDoubts: StudentDoubt[] = [
      {
        id: 'dbt-1',
        studentId: 'user-stu-001',
        studentName: 'Rohan Sharma',
        studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        courseId: 'course-fsd-01',
        batchId: 'batch-jfs-01',
        batchName: 'Oct 2026 Morning Cohort',
        title: 'How does Resilience4j RateLimiter behave under high thread contention?',
        description: 'When testing with JMeter at 500 concurrent users, I noticed RequestNotPermitted exceptions even before limitForPeriod was hit. Could this be related to timeoutDuration?',
        codeSnippet: '@RateLimiter(name = "backendA", fallbackMethod = "fallback")\npublic String doSomething() {\n    return restTemplate.getForObject(...);\n}',
        status: 'open',
        createdAt: '2026-11-09T14:20:00Z',
        replies: [],
      },
    ];
    const doubts = getStorageItem<StudentDoubt[]>(STORAGE_KEYS.TEACHER_DOUBTS, defaultDoubts);
    const filtered = doubts.filter((d) => !d.courseId || d.courseId === courseId);
    return { success: true, data: filtered };
  },

  /**
   * Post a new Doubt during Lesson (CRD 3.7: LMS-008)
   */
  async postLessonDoubt(
    student: { id: string; name: string; avatar?: string },
    data: {
      courseId: string;
      batchId?: string;
      batchName?: string;
      title: string;
      description: string;
      codeSnippet?: string;
    }
  ): Promise<ApiResponse<StudentDoubt>> {
    await sleep(250);
    const defaultDoubts: StudentDoubt[] = [
      {
        id: 'dbt-1',
        studentId: 'user-stu-001',
        studentName: 'Rohan Sharma',
        studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        courseId: 'course-fsd-01',
        batchId: 'batch-jfs-01',
        batchName: 'Oct 2026 Morning Cohort',
        title: 'How does Resilience4j RateLimiter behave under high thread contention?',
        description: 'When testing with JMeter at 500 concurrent users, I noticed RequestNotPermitted exceptions even before limitForPeriod was hit. Could this be related to timeoutDuration?',
        codeSnippet: '@RateLimiter(name = "backendA", fallbackMethod = "fallback")\npublic String doSomething() {\n    return restTemplate.getForObject(...);\n}',
        status: 'open',
        createdAt: '2026-11-09T14:20:00Z',
        replies: [],
      },
    ];
    const doubts = getStorageItem<StudentDoubt[]>(STORAGE_KEYS.TEACHER_DOUBTS, defaultDoubts);
    const newDoubt: StudentDoubt = {
      id: `dbt-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      studentAvatar: student.avatar,
      courseId: data.courseId,
      batchId: data.batchId || 'batch-all',
      batchName: data.batchName || 'General',
      title: data.title,
      description: data.description,
      codeSnippet: data.codeSnippet,
      status: 'open',
      createdAt: new Date().toISOString(),
      replies: [],
    };

    const updated = [newDoubt, ...doubts];
    setStorageItem(STORAGE_KEYS.TEACHER_DOUBTS, updated);
    return { success: true, data: newDoubt, message: 'Doubt submitted successfully.' };
  },

  /**
   * Get In-App Notifications for Student (CRD 3.13: COM-001 to COM-010)
   * Merges personal notifications with institutional broadcasts from Admin
   */
  async getNotificationsForStudent(studentId: string): Promise<ApiResponse<InAppNotification[]>> {
    await sleep(150);
    const broadcasts = getStorageItem<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const studentBroadcasts = broadcasts.filter(
      (n) =>
        n.userId === 'all' ||
        n.userId === studentId ||
        n.userId === 'students' ||
        n.targetRole === 'all' ||
        n.targetRole === 'student'
    );
    return { success: true, data: studentBroadcasts };
  },
};

