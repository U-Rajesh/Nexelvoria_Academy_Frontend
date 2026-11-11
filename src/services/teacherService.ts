import { STORAGE_KEYS } from '../constants/appConfig';
import { getStorageItem, setStorageItem } from '../utils/storage';
import {
  SEED_COURSES,
  SEED_BATCHES,
  SEED_USERS,
  SEED_ATTENDANCE_SESSIONS,
  SEED_ASSIGNMENTS,
  SEED_ASSIGNMENT_SUBMISSIONS,
  SEED_TESTS,
  SEED_TEST_ATTEMPTS,
  SEED_MOCK_INTERVIEWS,
} from '../mocks/seedData';
import { recordAuditLog } from '../mocks/mockStorage';
import type {
  Batch,
  Course,
  StudentProfile,
  TeacherProfile,
  AttendanceSession,
  AttendanceStatus,
  Assignment,
  AssignmentSubmission,
  OnlineTest,
  TestAttempt,
  StudyMaterial,
  MockInterviewSchedule,
  AnnouncementItem,
  StudentDoubt,
  RecordedClassItem,
  ApiResponse,
} from '../types';

const sleep = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

// Storage key helpers for teacher features
const TEACHER_MATERIALS_KEY = 'nexelvoria_teacher_materials_db';
const TEACHER_RECORDINGS_KEY = 'nexelvoria_teacher_recordings_db';
const TEACHER_ANNOUNCEMENTS_KEY = 'nexelvoria_teacher_announcements_db';
const TEACHER_DOUBTS_KEY = 'nexelvoria_teacher_doubts_db';

export const teacherService = {
  /**
   * Get courses allocated to this teacher by Admin (TCH-001)
   */
  async getAssignedCourses(teacherId: string): Promise<ApiResponse<Course[]>> {
    await sleep();
    const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);
    const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);

    const assignedBatches = batches.filter((b) => b.assignedTeacherIds.includes(teacherId));
    const courseIds = Array.from(new Set(assignedBatches.map((b) => b.courseId)));

    const assignedCourses = courses.filter((c) => courseIds.includes(c.id));
    return { success: true, data: assignedCourses };
  },

  /**
   * Get batches assigned strictly to this teacher (TCH-001, BR-009)
   */
  async getAssignedBatches(teacherId: string): Promise<ApiResponse<Batch[]>> {
    await sleep();
    const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);
    const assigned = batches.filter((b) => b.assignedTeacherIds.includes(teacherId));
    return { success: true, data: assigned };
  },

  /**
   * Get enrolled students for an assigned batch (TCH-002, BR-009)
   */
  async getBatchStudents(batchId: string): Promise<ApiResponse<StudentProfile[]>> {
    await sleep();
    const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
      SEED_USERS.student,
      SEED_USERS.studentPending,
    ]);

    const batch = batches.find((b) => b.id === batchId);
    if (!batch) return { success: true, data: [] };

    const enrolled = students.filter((s) => batch.enrolledStudentIds.includes(s.id));
    return { success: true, data: enrolled };
  },

  /**
   * Get all authorized students across all assigned batches (TCH-002)
   */
  async getAllAuthorizedStudents(teacherId: string): Promise<ApiResponse<{ student: StudentProfile; batchName: string; courseTitle: string }[]>> {
    await sleep();
    const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);
    const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
    const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, [
      SEED_USERS.student,
      SEED_USERS.studentPending,
    ]);

    const assignedBatches = batches.filter((b) => b.assignedTeacherIds.includes(teacherId));
    const result: { student: StudentProfile; batchName: string; courseTitle: string }[] = [];

    assignedBatches.forEach((batch) => {
      const course = courses.find((c) => c.id === batch.courseId);
      const batchStudents = students.filter((s) => batch.enrolledStudentIds.includes(s.id));
      batchStudents.forEach((student) => {
        result.push({
          student,
          batchName: batch.name,
          courseTitle: course?.title || batch.courseName,
        });
      });
    });

    return { success: true, data: result };
  },

  /**
   * Mark attendance matrix for a session (TCH-003, BR-010: Present, Absent, Leave)
   */
  async recordAttendance(
    teacher: { id: string; name: string },
    batchId: string,
    courseId: string,
    sessionDate: string,
    topicCovered: string,
    entries: { studentId: string; studentName: string; status: AttendanceStatus; note?: string }[]
  ): Promise<ApiResponse<AttendanceSession>> {
    await sleep(300);
    const sessions = getStorageItem<AttendanceSession[]>(STORAGE_KEYS.ATTENDANCE, SEED_ATTENDANCE_SESSIONS);

    // Prevent accidental duplicate attendance records for same batch and sessionDate
    const existingIndex = sessions.findIndex((s) => s.batchId === batchId && s.sessionDate === sessionDate);
    if (existingIndex !== -1) {
      sessions[existingIndex].records = entries;
      sessions[existingIndex].topicCovered = topicCovered;
      sessions[existingIndex].markedByUserId = teacher.id;
      setStorageItem(STORAGE_KEYS.ATTENDANCE, sessions);

      recordAuditLog(
        { id: teacher.id, name: teacher.name, role: 'teacher' },
        'ATTENDANCE_UPDATED',
        `Batch: ${batchId} Date: ${sessionDate}`,
        `Updated attendance for ${entries.length} students. Present: ${entries.filter((e) => e.status === 'present').length}.`
      );

      return { success: true, data: sessions[existingIndex], message: 'Attendance record updated successfully.' };
    }

    const newSession: AttendanceSession = {
      id: `att-sess-${Date.now()}`,
      batchId,
      courseId,
      sessionDate,
      topicCovered,
      markedByUserId: teacher.id,
      markedByRole: 'teacher',
      records: entries,
      createdAt: new Date().toISOString(),
    };

    setStorageItem(STORAGE_KEYS.ATTENDANCE, [newSession, ...sessions]);

    recordAuditLog(
      { id: teacher.id, name: teacher.name, role: 'teacher' },
      'ATTENDANCE_MARKED',
      `Batch: ${batchId} Date: ${sessionDate}`,
      `Marked attendance for ${entries.length} students. Present: ${entries.filter((e) => e.status === 'present').length}.`
    );

    return { success: true, data: newSession, message: 'Attendance recorded successfully.' };
  },

  /**
   * Get attendance history for assigned batches (TCH-003)
   */
  async getAttendanceHistory(teacherId: string, batchId?: string): Promise<ApiResponse<AttendanceSession[]>> {
    await sleep();
    const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);
    const sessions = getStorageItem<AttendanceSession[]>(STORAGE_KEYS.ATTENDANCE, SEED_ATTENDANCE_SESSIONS);

    const assignedBatchIds = batches
      .filter((b) => b.assignedTeacherIds.includes(teacherId))
      .map((b) => b.id);

    let filtered = sessions.filter((s) => assignedBatchIds.includes(s.batchId));
    if (batchId && batchId !== 'all') {
      filtered = filtered.filter((s) => s.batchId === batchId);
    }

    return { success: true, data: filtered };
  },

  /**
   * Study Materials Management (TCH-004)
   */
  async getStudyMaterials(teacherId: string): Promise<ApiResponse<StudyMaterial[]>> {
    await sleep();
    const defaultMaterials: StudyMaterial[] = [
      {
        id: 'mat-1',
        courseId: 'course-fsd-01',
        batchId: 'batch-jfs-01',
        title: 'Spring Cloud Gateway & Resilience4j Architecture Blueprint',
        description: 'Comprehensive system diagrams and route configuration templates.',
        fileType: 'pdf',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileSizeBytes: 4200000,
        uploadedByTeacherId: teacherId,
        uploadedAt: '2026-10-18T10:00:00Z',
        isDownloadRestricted: false,
      },
      {
        id: 'mat-2',
        courseId: 'course-fsd-01',
        batchId: 'batch-jfs-01',
        title: 'Kafka Distributed Event Streaming Cheatsheet',
        description: 'Command line reference, partition offsets, consumer group semantics.',
        fileType: 'code',
        fileUrl: 'https://github.com/nexelvoria-academy/kafka-cheatsheet',
        fileSizeBytes: 1800000,
        uploadedByTeacherId: teacherId,
        uploadedAt: '2026-10-25T14:30:00Z',
        isDownloadRestricted: false,
      },
      {
        id: 'mat-3',
        courseId: 'course-fsd-01',
        batchId: 'batch-jfs-01',
        title: 'Docker & Kubernetes Production Deployment Manifests',
        description: 'Multi-stage dockerfiles and helm charts for microservices.',
        fileType: 'zip',
        fileUrl: 'https://example.com/k8s-manifests.zip',
        fileSizeBytes: 8900000,
        uploadedByTeacherId: teacherId,
        uploadedAt: '2026-11-02T16:00:00Z',
        isDownloadRestricted: false,
      },
    ];

    const materials = getStorageItem<StudyMaterial[]>(TEACHER_MATERIALS_KEY, defaultMaterials);
    return { success: true, data: materials };
  },

  async uploadStudyMaterial(
    teacher: { id: string; name: string },
    data: Omit<StudyMaterial, 'id' | 'uploadedByTeacherId' | 'uploadedAt'>
  ): Promise<ApiResponse<StudyMaterial>> {
    await sleep(250);
    const materials = getStorageItem<StudyMaterial[]>(TEACHER_MATERIALS_KEY, []);
    const newMaterial: StudyMaterial = {
      ...data,
      id: `mat-${Date.now()}`,
      uploadedByTeacherId: teacher.id,
      uploadedAt: new Date().toISOString(),
    };

    setStorageItem(TEACHER_MATERIALS_KEY, [newMaterial, ...materials]);
    return { success: true, data: newMaterial, message: 'Study material uploaded successfully.' };
  },

  async deleteStudyMaterial(materialId: string): Promise<ApiResponse<boolean>> {
    await sleep(200);
    const materials = getStorageItem<StudyMaterial[]>(TEACHER_MATERIALS_KEY, []);
    const filtered = materials.filter((m) => m.id !== materialId);
    setStorageItem(TEACHER_MATERIALS_KEY, filtered);
    return { success: true, data: true, message: 'Material removed.' };
  },

  /**
   * Recorded Classes Management (TCH-004)
   */
  async getRecordedClasses(teacherId: string): Promise<ApiResponse<RecordedClassItem[]>> {
    await sleep();
    const defaultRecordings: RecordedClassItem[] = [
      {
        id: 'rec-1',
        courseId: 'course-fsd-01',
        batchId: 'batch-jfs-01',
        title: 'Project Loom & Virtual Threads Implementation',
        description: 'High throughput concurrency in Java 21 with benchmarks.',
        moduleName: 'Module 1: Advanced Java 21',
        sessionDate: '2026-10-15',
        durationMinutes: 110,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        uploadedByTeacherId: teacherId,
        uploadedByTeacherName: 'Dr. Vikram Rao',
        createdAt: '2026-10-15T12:00:00Z',
        isAvailableToStudents: true,
      },
      {
        id: 'rec-2',
        courseId: 'course-fsd-01',
        batchId: 'batch-jfs-01',
        title: 'Spring Data JPA Entity Graphs & Query Optimization',
        description: 'Eliminating N+1 query bottlenecks and pagination strategies.',
        moduleName: 'Module 2: Spring Boot Microservices',
        sessionDate: '2026-10-24',
        durationMinutes: 105,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        uploadedByTeacherId: teacherId,
        uploadedByTeacherName: 'Dr. Vikram Rao',
        createdAt: '2026-10-24T12:00:00Z',
        isAvailableToStudents: true,
      },
    ];

    const recordings = getStorageItem<RecordedClassItem[]>(TEACHER_RECORDINGS_KEY, defaultRecordings);
    return { success: true, data: recordings };
  },

  async saveRecordedClass(
    teacher: { id: string; name: string },
    data: Omit<RecordedClassItem, 'id' | 'uploadedByTeacherId' | 'uploadedByTeacherName' | 'createdAt'>
  ): Promise<ApiResponse<RecordedClassItem>> {
    await sleep(250);
    const recordings = getStorageItem<RecordedClassItem[]>(TEACHER_RECORDINGS_KEY, []);
    const newRecording: RecordedClassItem = {
      ...data,
      id: `rec-${Date.now()}`,
      uploadedByTeacherId: teacher.id,
      uploadedByTeacherName: teacher.name,
      createdAt: new Date().toISOString(),
    };

    setStorageItem(TEACHER_RECORDINGS_KEY, [newRecording, ...recordings]);
    return { success: true, data: newRecording, message: 'Class recording saved and published.' };
  },

  async deleteRecordedClass(recordingId: string): Promise<ApiResponse<boolean>> {
    await sleep(200);
    const recordings = getStorageItem<RecordedClassItem[]>(TEACHER_RECORDINGS_KEY, []);
    setStorageItem(
      TEACHER_RECORDINGS_KEY,
      recordings.filter((r) => r.id !== recordingId)
    );
    return { success: true, data: true, message: 'Recording removed.' };
  },

  /**
   * Live Classes & Manual Meeting Links (TCH-005, BR-015)
   */
  async updateMeetingUrl(batchId: string, meetingUrl: string): Promise<ApiResponse<Batch>> {
    await sleep(200);
    const batches = getStorageItem<Batch[]>(STORAGE_KEYS.BATCHES, SEED_BATCHES);
    const idx = batches.findIndex((b) => b.id === batchId);
    if (idx === -1) return { success: false, data: null as any, error: 'Batch not found.' };

    batches[idx].meetingUrl = meetingUrl;
    setStorageItem(STORAGE_KEYS.BATCHES, batches);
    return { success: true, data: batches[idx], message: 'Manual meeting URL updated.' };
  },

  /**
   * Assignments Creation and Management (TCH-006)
   */
  async getTeacherAssignments(_teacherId: string): Promise<ApiResponse<Assignment[]>> {
    await sleep();
    const assignments = getStorageItem<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, SEED_ASSIGNMENTS);
    return { success: true, data: assignments };
  },

  async createAssignment(
    teacher: { id: string; name: string },
    data: Omit<Assignment, 'id' | 'createdByTeacherId' | 'createdAt'>
  ): Promise<ApiResponse<Assignment>> {
    await sleep(300);
    const assignments = getStorageItem<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, SEED_ASSIGNMENTS);
    const newAssignment: Assignment = {
      ...data,
      id: `asg-${Date.now()}`,
      createdByTeacherId: teacher.id,
      createdAt: new Date().toISOString(),
    };

    setStorageItem(STORAGE_KEYS.ASSIGNMENTS, [newAssignment, ...assignments]);
    return { success: true, data: newAssignment, message: 'Assignment created successfully.' };
  },

  /**
   * Evaluate Assignment Submissions (TCH-007)
   */
  async evaluateSubmission(
    teacher: { id: string; name: string },
    submissionId: string,
    marksObtained: number,
    feedback: string
  ): Promise<ApiResponse<AssignmentSubmission>> {
    await sleep(250);
    const submissions = getStorageItem<AssignmentSubmission[]>(STORAGE_KEYS.SUBMISSIONS, SEED_ASSIGNMENT_SUBMISSIONS);
    const subIndex = submissions.findIndex((s) => s.id === submissionId);

    if (subIndex === -1) {
      return { success: false, data: null as any, error: 'Submission not found.' };
    }

    submissions[subIndex].marksObtained = marksObtained;
    submissions[subIndex].teacherFeedback = feedback;
    submissions[subIndex].status = 'graded';
    submissions[subIndex].evaluatedByUserId = teacher.id;
    submissions[subIndex].evaluatedAt = new Date().toISOString();

    setStorageItem(STORAGE_KEYS.SUBMISSIONS, submissions);

    return {
      success: true,
      data: submissions[subIndex],
      message: 'Submission graded successfully.',
    };
  },

  /**
   * Online Tests Creation (TCH-008)
   */
  async getTeacherTests(_teacherId: string): Promise<ApiResponse<OnlineTest[]>> {
    await sleep();
    const tests = getStorageItem<OnlineTest[]>(STORAGE_KEYS.TESTS, SEED_TESTS);
    return { success: true, data: tests };
  },

  async createOnlineTest(
    teacher: { id: string; name: string },
    data: Omit<OnlineTest, 'id'>
  ): Promise<ApiResponse<OnlineTest>> {
    await sleep(300);
    const tests = getStorageItem<OnlineTest[]>(STORAGE_KEYS.TESTS, SEED_TESTS);
    const newTest: OnlineTest = {
      ...data,
      id: `test-${Date.now()}`,
    };

    setStorageItem(STORAGE_KEYS.TESTS, [newTest, ...tests]);
    return { success: true, data: newTest, message: 'Online test published successfully.' };
  },

  /**
   * Test Evaluation (TCH-009)
   */
  async getTestAttempts(_teacherId: string): Promise<ApiResponse<TestAttempt[]>> {
    await sleep();
    const attempts = getStorageItem<TestAttempt[]>(STORAGE_KEYS.TEST_ATTEMPTS, SEED_TEST_ATTEMPTS);
    return { success: true, data: attempts };
  },

  /**
   * Examination Retake Authorization & Rejection (TCH-011, BR-012)
   */
  async authorizeTestRetake(
    teacher: { id: string; name: string },
    attemptId: string
  ): Promise<ApiResponse<TestAttempt>> {
    await sleep(200);
    const attempts = getStorageItem<TestAttempt[]>(STORAGE_KEYS.TEST_ATTEMPTS, SEED_TEST_ATTEMPTS);
    const idx = attempts.findIndex((a) => a.id === attemptId);

    if (idx === -1) {
      return { success: false, data: null as any, error: 'Test attempt not found.' };
    }

    attempts[idx].isRetakeAuthorized = true;
    attempts[idx].retakeAuthorizedBy = teacher.name;
    attempts[idx].retakeRequestStatus = 'approved';
    attempts[idx].retakeRejectedReason = undefined;

    setStorageItem(STORAGE_KEYS.TEST_ATTEMPTS, attempts);

    recordAuditLog(
      { id: teacher.id, name: teacher.name, role: 'teacher' },
      'TEST_RETAKE_AUTHORIZED',
      `Attempt: ${attemptId} Student: ${attempts[idx].studentName}`,
      'Teacher authorized examination retake.'
    );

    return {
      success: true,
      data: attempts[idx],
      message: 'Examination retake authorized for student.',
    };
  },

  async rejectTestRetake(
    teacher: { id: string; name: string },
    attemptId: string,
    reason: string
  ): Promise<ApiResponse<TestAttempt>> {
    await sleep(200);
    const attempts = getStorageItem<TestAttempt[]>(STORAGE_KEYS.TEST_ATTEMPTS, SEED_TEST_ATTEMPTS);
    const idx = attempts.findIndex((a) => a.id === attemptId);

    if (idx === -1) {
      return { success: false, data: null as any, error: 'Test attempt not found.' };
    }

    attempts[idx].isRetakeAuthorized = false;
    attempts[idx].retakeRequestStatus = 'rejected';
    attempts[idx].retakeRejectedReason = reason;

    setStorageItem(STORAGE_KEYS.TEST_ATTEMPTS, attempts);

    recordAuditLog(
      { id: teacher.id, name: teacher.name, role: 'teacher' },
      'TEST_RETAKE_REJECTED',
      `Attempt: ${attemptId} Student: ${attempts[idx].studentName}`,
      `Teacher rejected retake request. Reason: ${reason}`
    );

    return {
      success: true,
      data: attempts[idx],
      message: 'Examination retake request rejected.',
    };
  },

  /**
   * Announcements & Student Communication (TCH-012)
   */
  async getTeacherAnnouncements(teacherId: string): Promise<ApiResponse<AnnouncementItem[]>> {
    await sleep();
    const defaultAnnouncements: AnnouncementItem[] = [
      {
        id: 'ann-1',
        courseId: 'course-fsd-01',
        batchId: 'batch-jfs-01',
        title: 'Project Submission Deadline: Kafka Event Saga Architecture',
        message: 'Ensure your GitHub repository includes Docker Compose and clean README with setup instructions. Submissions close Friday at 11:59 PM.',
        priority: 'high',
        category: 'Assignment Notice',
        publishedByTeacherId: teacherId,
        publishedByTeacherName: 'Dr. Vikram Rao',
        createdAt: '2026-11-08T09:30:00Z',
        isActive: true,
      },
      {
        id: 'ann-2',
        courseId: 'course-fsd-01',
        batchId: 'batch-jfs-01',
        title: 'Special Live Doubt Clearing Session on AWS EKS Cluster Deployments',
        message: 'We will be holding an additional 1-hour workshop this Saturday at 10:00 AM IST to address cluster configuration doubts.',
        priority: 'normal',
        category: 'General',
        publishedByTeacherId: teacherId,
        publishedByTeacherName: 'Dr. Vikram Rao',
        createdAt: '2026-11-05T15:00:00Z',
        isActive: true,
      },
    ];

    const announcements = getStorageItem<AnnouncementItem[]>(TEACHER_ANNOUNCEMENTS_KEY, defaultAnnouncements);
    return { success: true, data: announcements };
  },

  async createAnnouncement(
    teacher: { id: string; name: string },
    data: Omit<AnnouncementItem, 'id' | 'publishedByTeacherId' | 'publishedByTeacherName' | 'createdAt'>
  ): Promise<ApiResponse<AnnouncementItem>> {
    await sleep(250);
    const announcements = getStorageItem<AnnouncementItem[]>(TEACHER_ANNOUNCEMENTS_KEY, []);
    const newAnnouncement: AnnouncementItem = {
      ...data,
      id: `ann-${Date.now()}`,
      publishedByTeacherId: teacher.id,
      publishedByTeacherName: teacher.name,
      createdAt: new Date().toISOString(),
    };

    setStorageItem(TEACHER_ANNOUNCEMENTS_KEY, [newAnnouncement, ...announcements]);
    return { success: true, data: newAnnouncement, message: 'Announcement broadcasted to enrolled students.' };
  },

  /**
   * Student Doubts Management (TCH-012)
   */
  async getStudentDoubts(teacherId: string): Promise<ApiResponse<StudentDoubt[]>> {
    await sleep();
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
        codeSnippet: 'RateLimiterConfig config = RateLimiterConfig.custom()\n  .limitForPeriod(100)\n  .limitRefreshPeriod(Duration.ofSeconds(1))\n  .timeoutDuration(Duration.ofMillis(50))\n  .build();',
        status: 'open',
        createdAt: '2026-11-09T18:45:00Z',
        replies: [],
      },
      {
        id: 'dbt-2',
        studentId: 'user-stu-003',
        studentName: 'Karthik Varma',
        courseId: 'course-fsd-01',
        batchId: 'batch-jfs-01',
        batchName: 'Oct 2026 Morning Cohort',
        title: 'Kafka consumer rebalance during long database writes',
        description: 'When consumer is committing offset manually, heartbeat thread seems to drop if batch takes more than max.poll.interval.ms.',
        status: 'answered',
        createdAt: '2026-11-07T14:10:00Z',
        replies: [
          {
            id: 'rep-1',
            authorId: teacherId,
            authorName: 'Dr. Vikram Rao',
            authorRole: 'teacher',
            message: 'Increase max.poll.interval.ms or offload long database writes to a separate worker thread pool while sending heartbeats.',
            createdAt: '2026-11-07T16:20:00Z',
          },
        ],
      },
    ];

    const doubts = getStorageItem<StudentDoubt[]>(TEACHER_DOUBTS_KEY, defaultDoubts);
    return { success: true, data: doubts };
  },

  async replyToDoubt(
    teacher: { id: string; name: string },
    doubtId: string,
    message: string,
    newStatus: 'answered' | 'resolved' = 'answered'
  ): Promise<ApiResponse<StudentDoubt>> {
    await sleep(250);
    const doubts = getStorageItem<StudentDoubt[]>(TEACHER_DOUBTS_KEY, []);
    const idx = doubts.findIndex((d) => d.id === doubtId);
    if (idx === -1) return { success: false, data: null as any, error: 'Doubt not found.' };

    const reply = {
      id: `rep-${Date.now()}`,
      authorId: teacher.id,
      authorName: teacher.name,
      authorRole: 'teacher' as const,
      message,
      createdAt: new Date().toISOString(),
    };

    doubts[idx].replies.push(reply);
    doubts[idx].status = newStatus;
    setStorageItem(TEACHER_DOUBTS_KEY, doubts);

    return { success: true, data: doubts[idx], message: 'Reply sent to student.' };
  },

  /**
   * Mock Interviews (TCH-010)
   */
  async getMockInterviews(_teacherId: string): Promise<ApiResponse<MockInterviewSchedule[]>> {
    await sleep();
    const interviews = getStorageItem<MockInterviewSchedule[]>(STORAGE_KEYS.MOCK_INTERVIEWS, SEED_MOCK_INTERVIEWS);
    return { success: true, data: interviews };
  },

  async submitMockFeedback(
    interviewId: string,
    ratings: { technicalSkills: number; communication: number; problemSolving: number; overallRating: number },
    feedback: string
  ): Promise<ApiResponse<MockInterviewSchedule>> {
    await sleep(250);
    const interviews = getStorageItem<MockInterviewSchedule[]>(STORAGE_KEYS.MOCK_INTERVIEWS, SEED_MOCK_INTERVIEWS);
    const idx = interviews.findIndex((i) => i.id === interviewId);
    if (idx === -1) return { success: false, data: null as any, error: 'Mock interview not found.' };

    interviews[idx].status = 'completed';
    interviews[idx].feedback = feedback;
    (interviews[idx] as any).ratings = ratings;

    setStorageItem(STORAGE_KEYS.MOCK_INTERVIEWS, interviews);
    return { success: true, data: interviews[idx], message: 'Mock interview evaluation saved.' };
  },

  /**
   * Teacher Profile (Section 2)
   */
  async getTeacherProfile(_teacherId: string): Promise<ApiResponse<TeacherProfile>> {
    await sleep();
    return { success: true, data: SEED_USERS.teacher };
  },
};
