export interface Lesson {
  id: string;
  chapterId: string;
  title: string;
  durationMinutes: number;
  videoUrl?: string; // S3/CloudFront or YouTube URL
  pdfUrl?: string;
  studyMaterialText?: string;
  externalLinks?: { title: string; url: string }[];
  isFreePreview: boolean; // Accessible prior to payment (BR-003)
  order: number;
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

export interface Course {
  id: string;
  slug: string;
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
  hasPlacementGuarantee: boolean; // Flagged with pending terms per SRS
  prerequisites: string[];
  learningOutcomes: string[];
  syllabusPdfUrl?: string;
}

export interface Batch {
  id: string;
  courseId: string;
  courseName: string;
  name: string; // e.g., "Java Full Stack - Oct 2026 Batch"
  batchCode: string; // e.g., "JFS-2026-B1"
  startDate: string;
  endDate: string;
  scheduleTiming: string; // e.g., "Mon-Fri 7:30 AM - 9:30 AM IST"
  assignedTeacherIds: string[];
  enrolledStudentIds: string[];
  status: 'upcoming' | 'ongoing' | 'completed';
  maxCapacity?: number; // Pending final confirmation per SRS
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

