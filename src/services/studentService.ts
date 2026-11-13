import { STORAGE_KEYS } from '../constants/appConfig';
import { getStorageItem, setStorageItem } from '../utils/storage';
import {
  SEED_COURSES,
  SEED_BATCHES,
  SEED_ENROLLMENTS,
  SEED_ATTENDANCE_SESSIONS,
  SEED_ASSIGNMENT_SUBMISSIONS,
  SEED_TESTS,
  SEED_TEST_ATTEMPTS,
  SEED_JOBS,
  SEED_APPLICATIONS,
} from '../mocks/seedData';
import { BUSINESS_RULES } from '../constants/businessRules';
import type {
  Course,
  Batch,
  Enrollment,
  EnrollmentStatus,
  AttendanceSession,
  AssignmentSubmission,
  OnlineTest,
  TestAttempt,
  CertificateEligibilityCheck,
  JobOpening,
  JobApplication,
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
};

