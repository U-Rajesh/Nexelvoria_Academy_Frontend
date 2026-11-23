import { apiClient } from './api';
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
  SEED_MOCK_INTERVIEWS,
  SEED_INTERVIEW_QUESTIONS,
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
  MockInterviewSchedule,
  InterviewQuestion,
  SupportTicket,
  TicketCategory,
  TicketPriority,
  StudentDoubt,
  InAppNotification,
  ApiResponse,
  StudentProfile,
} from '../types';

const sleep = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Explicit development-only mock toggle.
 * Defaults to false (production mode): uses live backend APIs and returns
 * genuine empty states / error states with zero silent fallback to seed data.
 * Set VITE_USE_DEV_MOCKS=true in .env.local to enable offline mock fallbacks.
 */
const USE_DEV_MOCKS = import.meta.env.VITE_USE_DEV_MOCKS === 'true';

export const studentService = {
  /**
   * Enrolled courses with active progress
   */
  async getStudentEnrollments(studentId: string): Promise<ApiResponse<{ enrollment: Enrollment; course: Course; batch?: Batch }[]>> {
    if (USE_DEV_MOCKS) {
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
    }

    try {
      const res = await apiClient.get('/enrollments/me');
      const items = res.data?.data ?? [];
      const mapped = Array.isArray(items)
        ? items.map((item: any) => ({
            enrollment: item.enrollment ?? item,
            course: item.course ?? {
              id: item.courseId ?? item.enrollment?.courseId,
              title: item.courseTitle ?? 'Enrolled Course',
              code: item.courseCode,
            },
            batch: item.batch,
          }))
        : [];
      return { success: true, data: mapped };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to fetch student enrollments.';
      return { success: false, data: [], message };
    }
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
    if (USE_DEV_MOCKS) {
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
    }

    try {
      const res = await apiClient.post('/enrollments', { courseId, batchId });
      return {
        success: true,
        data: res.data?.data,
        message: res.data?.message || 'Enrollment requested successfully.',
      };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to submit enrollment request.';
      return { success: false, data: undefined as any, message };
    }
  },

  /**
   * Mark lesson complete and calculate course progress
   */
  async completeLesson(studentId: string, courseId: string, lessonId: string): Promise<ApiResponse<number>> {
    if (USE_DEV_MOCKS) {
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
    }

    try {
      const res = await apiClient.post(`/teachers/lms/lessons/${encodeURIComponent(lessonId)}/progress`, {
        isCompleted: true,
        progressPercent: 100,
      });
      return { success: true, data: res.data?.data?.progressPercent ?? 100 };
    } catch (err: any) {
      return {
        success: false,
        data: 0,
        message: err?.response?.data?.message || err?.message || 'Failed to update lesson progress.',
      };
    }
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
    if (USE_DEV_MOCKS) {
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
    }

    try {
      const res = await apiClient.get('/teachers/attendance/my');
      const data = res.data?.data ?? { percentage: 100, total: 0, present: 0, absent: 0, leave: 0, sessions: [] };
      return { success: true, data };
    } catch (err: any) {
      return {
        success: false,
        data: { percentage: 0, total: 0, present: 0, absent: 0, leave: 0, sessions: [] },
        message: err?.response?.data?.message || err?.message || 'Failed to fetch student attendance.',
      };
    }
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
    if (USE_DEV_MOCKS) {
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
    }

    try {
      const payload = {
        submissionType: data.method === 'github_link' ? 'github' : data.method === 'text_entry' ? 'text' : 'file',
        githubUrl: data.githubUrl,
        textContent: data.textContent,
        objectKey: data.fileName,
      };
      const res = await apiClient.post(`/teachers/assignments/${encodeURIComponent(assignmentId)}/submit`, payload);
      const returned = res.data?.data;
      const newSub: AssignmentSubmission = {
        id: returned?.submissionId ? String(returned.submissionId) : `sub-${Date.now()}`,
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
      return { success: true, data: newSub, message: res.data?.message || 'Assignment submitted successfully.' };
    } catch (err: any) {
      return {
        success: false,
        data: null as any,
        error: err?.response?.data?.message || err?.message || 'Failed to submit assignment.',
      };
    }
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
    if (USE_DEV_MOCKS) {
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
    }

    try {
      const res = await apiClient.post(`/placements/jobs/${jobId}/apply`, {
        coverLetter: `Application by ${studentName}`,
      });
      const data = res.data?.data;
      return {
        success: true,
        data: {
          id: data.id,
          jobId: data.jobId,
          jobTitle: data.jobTitle || 'Job Opening',
          companyName: data.companyName || 'Hiring Partner',
          studentId,
          studentName,
          appliedAt: data.appliedAt || new Date().toISOString(),
          status: data.applicationStatus || 'applied',
        },
        message: 'Application submitted successfully.',
      };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to submit application.';
      return { success: false, data: null as any, error: errorMsg };
    }
  },

  /**
   * Get study materials authorized for student (uploaded by teachers or part of enrolled courses)
   */
  async getStudyMaterialsForStudent(studentId: string): Promise<ApiResponse<StudyMaterial[]>> {
    if (USE_DEV_MOCKS) {
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
    }

    try {
      const res = await apiClient.get('/teachers/materials');
      const items = res.data?.data ?? [];
      return {
        success: true,
        data: Array.isArray(items) ? items : [],
      };
    } catch (err: any) {
      return {
        success: false,
        data: [],
        message: err?.response?.data?.message || err?.message || 'Failed to fetch study materials.',
      };
    }
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
    if (USE_DEV_MOCKS) {
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
    }

    try {
      const res = await apiClient.get('/teachers/assignments');
      const items = res.data?.data ?? [];
      return {
        success: true,
        data: { assignments: Array.isArray(items) ? items : [], submissions: [] },
      };
    } catch (err: any) {
      return {
        success: false,
        data: { assignments: [], submissions: [] },
        message: err?.response?.data?.message || err?.message || 'Failed to fetch assignments.',
      };
    }
  },

  /**
   * Get tests and attempts for enrolled student
   */
  async getStudentOnlineTests(studentId: string): Promise<ApiResponse<{ tests: OnlineTest[]; attempts: TestAttempt[] }>> {
    if (USE_DEV_MOCKS) {
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
    }

    try {
      const res = await apiClient.get('/teachers/tests');
      const items = res.data?.data ?? [];
      return {
        success: true,
        data: { tests: Array.isArray(items) ? items : [], attempts: [] },
      };
    } catch (err: any) {
      return {
        success: false,
        data: { tests: [], attempts: [] },
        message: err?.response?.data?.message || err?.message || 'Failed to fetch online tests.',
      };
    }
  },

  /**
   * Support Tickets for Student (CRD 3.14: SUP-001 to SUP-006)
   */
  async getStudentTickets(studentId: string): Promise<ApiResponse<SupportTicket[]>> {
    if (USE_DEV_MOCKS) {
      await sleep(150);
      const tickets = getStorageItem<SupportTicket[]>(STORAGE_KEYS.TICKETS, SEED_TICKETS);
      const filtered = tickets.filter((t) => t.studentId === studentId);
      return { success: true, data: filtered };
    }

    try {
      const res = await apiClient.get('/support/tickets/my');
      const list = res.data?.data ?? [];
      const formatted: SupportTicket[] = (Array.isArray(list) ? list : []).map((t: any) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        studentId: t.studentUserId ?? studentId,
        studentName: t.studentName ?? 'Student',
        studentEmail: 'student@nexelvoria.com',
        category: t.categoryId as TicketCategory,
        subject: t.subject,
        status: t.ticketStatus as any,
        priority: (t.priority ?? 'medium') as TicketPriority,
        createdAt: t.createdAt,
        updatedAt: t.createdAt,
        messages: (t.replies ?? []).map((r: any) => ({
          id: r.id,
          senderId: r.repliedByUserId,
          senderName: r.repliedByName ?? 'User',
          senderRole: r.repliedByUserId === studentId ? 'student' : 'admin',
          message: r.replyText,
          sentAt: r.repliedAt,
        })),
      }));
      return { success: true, data: formatted };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to fetch support tickets.';
      return { success: false, data: [], error: errorMsg };
    }
  },

  /**
   * Create a new Support Ticket (CRD 3.14: SUP-001)
   */
  async createTicket(
    student: { id: string; name: string; email: string },
    data: { category: TicketCategory; subject: string; message: string; priority?: TicketPriority }
  ): Promise<ApiResponse<SupportTicket>> {
    if (USE_DEV_MOCKS) {
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
    }

    try {
      const res = await apiClient.post('/support/tickets', {
        categoryId: data.category,
        subject: data.subject,
        description: data.message,
        priority: data.priority || 'medium',
      });
      const t = res.data?.data;
      return {
        success: true,
        data: {
          id: t.id,
          ticketNumber: t.ticketNumber,
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          category: data.category,
          subject: t.subject,
          status: 'open',
          priority: data.priority || 'medium',
          createdAt: t.createdAt,
          updatedAt: t.createdAt,
          messages: [
            {
              id: `msg-${Date.now()}`,
              senderId: student.id,
              senderName: student.name,
              senderRole: 'student',
              message: data.message,
              sentAt: t.createdAt,
            },
          ],
        },
        message: 'Support ticket created successfully.',
      };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to create support ticket.';
      return { success: false, data: null as any, error: errorMsg };
    }
  },

  /**
   * Student reply to existing Support Ticket (CRD 3.14: SUP-004)
   */
  async replyTicket(
    student: { id: string; name: string },
    ticketId: string,
    message: string
  ): Promise<ApiResponse<SupportTicket>> {
    if (USE_DEV_MOCKS) {
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
    }

    try {
      await apiClient.post(`/support/tickets/${ticketId}/replies`, {
        replyText: message,
      });
      const tktRes = await this.getStudentTickets(student.id);
      const found = (tktRes.data ?? []).find((x) => x.id === ticketId);
      return {
        success: true,
        data: found as any,
        message: 'Reply sent.',
      };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to send reply.';
      return { success: false, data: null as any, error: errorMsg };
    }
  },

  /**
   * Placement Job Openings (CRD 3.12: PLC-001, BR-013)
   */
  async getJobOpenings(): Promise<ApiResponse<JobOpening[]>> {
    if (USE_DEV_MOCKS) {
      await sleep(150);
      const jobs = getStorageItem<JobOpening[]>(STORAGE_KEYS.JOBS, SEED_JOBS);
      return { success: true, data: jobs.filter((j) => j.isActive) };
    }

    try {
      const res = await apiClient.get('/placements/jobs');
      const list = res.data?.data ?? [];
      const formatted: JobOpening[] = (Array.isArray(list) ? list : []).map((j: any) => ({
        id: j.id,
        companyId: j.companyId || 'comp-default',
        companyName: j.companyName || 'Partner Company',
        companyLogoUrl: j.companyLogoUrl || '',
        title: j.jobTitle || 'Software Engineer',
        roleType: (j.employmentType === 'full_time' ? 'Full-time' : j.employmentType === 'internship' ? 'Internship' : 'Full-time') as any,
        location: j.workLocation || 'Bengaluru, India',
        workMode: (j.workMode || 'Hybrid') as any,
        salaryPackageCTC: `${((j.salaryMin || 600000) / 100000).toFixed(0)} - ${((j.salaryMax || 1000000) / 100000).toFixed(0)} LPA`,
        experienceRequired: `${j.minExperienceYears || 0} years`,
        skillsRequired: ['Java', 'SQL', 'TypeScript'],
        jobDescription: j.jobDescription || 'Develop clean backend and frontend features.',
        eligibilityCriteria: {
          minAttendancePercentage: 75,
          minExamScorePercentage: 70,
          eligibleCourseIds: [],
          eligiblePassingYears: ['2025', '2026'],
        },
        openingsCount: j.openingsCount || 5,
        deadline: j.applicationDeadline || '2026-12-31',
        isActive: j.jobStatus === 'open',
        postedAt: j.createdAt || new Date().toISOString(),
      }));
      return { success: true, data: formatted };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to fetch job openings.';
      return { success: false, data: [], error: errorMsg };
    }
  },

  /**
   * Student Job Applications (CRD 3.12: PLC-007, BR-013)
   */
  async getJobApplicationsForStudent(studentId: string): Promise<ApiResponse<JobApplication[]>> {
    if (USE_DEV_MOCKS) {
      await sleep(150);
      const applications = getStorageItem<JobApplication[]>(STORAGE_KEYS.APPLICATIONS, SEED_APPLICATIONS);
      const studentApps = applications.filter((a) => a.studentId === studentId);
      return { success: true, data: studentApps };
    }

    try {
      const res = await apiClient.get('/placements/applications/my');
      const list = res.data?.data ?? [];
      const formatted: JobApplication[] = (Array.isArray(list) ? list : []).map((a: any) => ({
        id: a.id,
        jobId: a.jobId,
        jobTitle: a.jobTitle || 'Job Role',
        companyName: a.companyName || 'Hiring Partner',
        studentId,
        studentName: 'Student',
        appliedAt: a.appliedAt,
        status: a.applicationStatus as any,
      }));
      return { success: true, data: formatted };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to fetch job applications.';
      return { success: false, data: [], error: errorMsg };
    }
  },

  /**
   * Mock Interviews for Student
   */
  async getMockInterviewsForStudent(studentId: string): Promise<ApiResponse<MockInterviewSchedule[]>> {
    if (USE_DEV_MOCKS) {
      await sleep(150);
      const items = getStorageItem<MockInterviewSchedule[]>(STORAGE_KEYS.MOCK_INTERVIEWS, SEED_MOCK_INTERVIEWS);
      return { success: true, data: items.filter((m) => m.studentId === studentId || !m.studentId) };
    }

    try {
      const res = await apiClient.get('/placements/mock-interviews/my');
      const list = res.data?.data ?? [];
      const formatted: MockInterviewSchedule[] = (Array.isArray(list) ? list : []).map((m: any) => ({
        id: m.id,
        studentId: m.studentUserId ?? studentId,
        studentName: m.studentName ?? 'Student',
        trainerId: m.teacherUserId ?? 'trainer-01',
        trainerName: m.teacherName ?? 'Technical Interviewer',
        scheduledAt: m.scheduledAt,
        meetingLink: m.meetingUrl || 'https://meet.google.com/nex-mock-interview',
        meetingUrl: m.meetingUrl,
        interviewType: (m.interviewType || 'Technical') as any,
        status: (m.interviewStatus === 'completed' ? 'completed' : m.interviewStatus === 'cancelled' ? 'cancelled' : 'scheduled') as any,
        feedback: m.feedback,
        ...(m.overallScore !== undefined
          ? {
              feedbackReport: {
                technicalScoreOutOf10: m.overallScore,
                communicationScoreOutOf10: 8,
                problemSolvingScoreOutOf10: m.overallScore,
                strengths: m.feedback || 'Good fundamentals',
                areasForImprovement: 'System design optimization',
                recommendation: m.overallScore >= 7 ? 'Ready for Placements' : 'Needs More Practice',
              },
            }
          : {}),
      }));
      return { success: true, data: formatted };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to fetch mock interviews.';
      return { success: false, data: [], error: errorMsg };
    }
  },

  /**
   * Curated Question Bank
   */
  async getInterviewQuestions(category?: string): Promise<ApiResponse<InterviewQuestion[]>> {
    if (USE_DEV_MOCKS) {
      await sleep(150);
      return { success: true, data: SEED_INTERVIEW_QUESTIONS };
    }

    try {
      const q = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
      const res = await apiClient.get(`/placements/questions${q}`);
      const list = res.data?.data ?? [];
      const formatted: InterviewQuestion[] = (Array.isArray(list) ? list : []).map((x: any) => ({
        id: x.id,
        category: (x.category || 'Java & Spring Boot') as any,
        difficulty: (x.difficultyLevel ? x.difficultyLevel.charAt(0).toUpperCase() + x.difficultyLevel.slice(1).toLowerCase() : 'Medium') as any,
        title: x.title || (x.questionText ? x.questionText.slice(0, 40) : 'Technical Question'),
        question: x.questionText,
        modelAnswer: x.sampleAnswer ?? '',
        evaluationRubric: [
          {
            criteria: 'Conceptual clarity',
            weightage: '50%',
            goodResponseIndicator: 'Explains trade-offs and underlying principles',
          },
          {
            criteria: 'Code/Implementation',
            weightage: '50%',
            goodResponseIndicator: 'Provides optimal, clean solution',
          },
        ],
        tags: [x.category || 'Interview'],
      }));
      return { success: true, data: formatted };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to fetch interview questions.';
      return { success: false, data: [], error: errorMsg };
    }
  },

  /**
   * Course Doubts for LMS Viewer (CRD 3.7: LMS-008, 3.5: TCH area 16)
   */
  async getCourseDoubts(courseId: string): Promise<ApiResponse<StudentDoubt[]>> {
    if (USE_DEV_MOCKS) {
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
    }

    try {
      const res = await apiClient.get('/teachers/doubts', { params: { courseId } });
      const items = res.data?.data ?? [];
      return {
        success: true,
        data: Array.isArray(items) ? items : [],
      };
    } catch (err: any) {
      return {
        success: false,
        data: [],
        message: err?.response?.data?.message || err?.message || 'Failed to fetch course doubts.',
      };
    }
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
    if (USE_DEV_MOCKS) {
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
    }

    try {
      const payload = {
        lessonId: (data as any).lessonId || 'les-general',
        doubtText: `${data.title}\n\n${data.description}${data.codeSnippet ? `\n\n\`\`\`\n${data.codeSnippet}\n\`\`\`` : ''}`,
      };
      const res = await apiClient.post('/teachers/doubts', payload);
      const returned = res.data?.data;
      const newDoubt: StudentDoubt = {
        id: returned?.doubtId ? String(returned.doubtId) : `dbt-${Date.now()}`,
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
      return {
        success: true,
        data: newDoubt,
        message: res.data?.message || 'Doubt submitted successfully.',
      };
    } catch (err: any) {
      return {
        success: false,
        data: null as any,
        error: err?.response?.data?.message || err?.message || 'Failed to submit doubt.',
      };
    }
  },

  /**
   * Get In-App Notifications for Student (CRD 3.13: COM-001 to COM-010)
   * Merges personal notifications with institutional broadcasts from Admin
   */
  async getNotificationsForStudent(studentId: string): Promise<ApiResponse<InAppNotification[]>> {
    if (USE_DEV_MOCKS) {
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
    }

    try {
      const res = await apiClient.get('/support/notifications/my');
      const list = res.data?.data ?? [];
      const formatted: InAppNotification[] = (Array.isArray(list) ? list : []).map((n: any) => ({
        id: n.id,
        userId: n.recipientUserId ?? studentId,
        title: n.title,
        message: n.messageBody,
        category: 'system' as const,
        isRead: Boolean(n.readAt),
        createdAt: n.createdAt,
        linkUrl: n.relatedEntityId ? `/student/tickets` : undefined,
      }));
      return { success: true, data: formatted };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to fetch notifications.';
      return { success: false, data: [], error: errorMsg };
    }
  },

  /**
   * Get authenticated student profile (CRD STD-006)
   */
  async getStudentProfile(): Promise<ApiResponse<StudentProfile | null>> {
    if (USE_DEV_MOCKS) {
      const current = getStorageItem<any>(STORAGE_KEYS.CURRENT_USER, null);
      return { success: !!current, data: current };
    }

    try {
      const res = await apiClient.get('/students/me');
      if (res.data?.data) {
        return { success: true, data: res.data.data };
      }
      return { success: false, data: null, message: 'Student profile not found.' };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to fetch student profile.';
      return { success: false, data: null, message };
    }
  },

  /**
   * Update authenticated student profile (CRD STD-006)
   */
  async updateStudentProfile(data: Partial<StudentProfile>): Promise<ApiResponse<StudentProfile>> {
    if (USE_DEV_MOCKS) {
      const current = getStorageItem<any>(STORAGE_KEYS.CURRENT_USER, null);
      const updated = { ...current, ...data };
      setStorageItem(STORAGE_KEYS.CURRENT_USER, updated);
      return { success: true, data: updated, message: 'Profile updated in local storage.' };
    }

    try {
      const res = await apiClient.put('/students/me', data);
      return {
        success: true,
        data: res.data?.data,
        message: res.data?.message || 'Profile updated successfully.',
      };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to update student profile.';
      return { success: false, data: undefined as any, message };
    }
  },
};

