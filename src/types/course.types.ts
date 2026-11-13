export type LessonType = 'video' | 'reading' | 'pdf' | 'assignment' | 'quiz';

export interface Lesson {
  id: string;
  chapterId: string;
  title: string;
  durationMinutes: number;
  lessonType?: LessonType;
  videoUrl?: string; // S3/CloudFront or YouTube URL
  pdfUrl?: string;
  studyMaterialText?: string;
  externalLinks?: { title: string; url: string }[];
  isFreePreview: boolean; // Accessible prior to payment (BR-003)
  order: number;
  isLocked?: boolean;
  isDownloadRestricted?: boolean; // LMS-006: Study materials download permission control (Read-Only)
}

export interface Chapter {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  chapters: Chapter[];
}

export type CourseStatus = 'Draft' | 'Published' | 'Active' | 'Inactive' | 'Archived';

export interface Course {
  id: string;
  slug: string;
  courseCode?: string; // e.g. "CRS-JFS-101"
  title: string;
  shortDescription: string;
  longDescription: string;
  thumbnailUrl: string;
  durationWeeks: number;
  totalHours: number;
  feeINR: number;
  discountedFeeINR?: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'Software Development' | 'Data & AI' | 'Cloud & DevOps' | 'Cybersecurity' | 'Testing';
  technologies: string[];
  modules: CourseModule[];
  isPublished: boolean;
  status?: CourseStatus;
  hasPlacementGuarantee: boolean; // Flagged with pending terms per SRS
  prerequisites: string[];
  learningOutcomes: string[];
  eligibilityCriteria?: string[];
  syllabusPdfUrl?: string;
}

export type BatchStatus = 'upcoming' | 'ongoing' | 'completed' | 'active' | 'inactive' | 'cancelled';

export interface Batch {
  id: string;
  courseId: string;
  courseName: string;
  name: string; // e.g., "Java Full Stack - Oct 2026 Batch"
  batchCode: string; // e.g., "JFS-2026-B1"
  startDate: string;
  endDate: string;
  scheduleTiming: string; // e.g., "Mon-Fri 7:30 AM - 9:30 AM IST"
  scheduleDays?: string[]; // e.g. ["Mon", "Tue", "Wed", "Thu", "Fri"]
  scheduleTime?: string; // e.g. "07:30 - 09:30 IST"
  startTime?: string; // e.g. "07:30"
  endTime?: string; // e.g. "09:30"
  timezone?: string; // e.g. "IST"
  assignedTeacherIds: string[];
  primaryTeacherId?: string;
  assistantTeacherId?: string;
  enrolledStudentIds: string[];
  status: BatchStatus;
  maxCapacity?: number; // Pending final confirmation per SRS (TBD default 40)
  meetingUrl?: string; // Manually configured meeting link (BR-015)
}

export interface StudyMaterial {
  id: string;
  courseId: string;
  batchId?: string;
  title: string;
  description: string;
  fileType: 'pdf' | 'zip' | 'code' | 'doc';
  fileUrl: string;
  fileSizeBytes: number;
  uploadedByTeacherId: string;
  uploadedAt: string;
  isDownloadRestricted: boolean;
}

