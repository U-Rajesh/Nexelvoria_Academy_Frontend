export interface AnnouncementItem {
  id: string;
  courseId: string;
  batchId?: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'General' | 'Exam Alert' | 'Assignment Notice' | 'Class Rescheduled';
  publishedByTeacherId: string;
  publishedByTeacherName: string;
  createdAt: string;
  isActive: boolean;
}

export interface StudentDoubtReply {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'student' | 'teacher';
  message: string;
  createdAt: string;
}

export interface StudentDoubt {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  courseId: string;
  batchId: string;
  batchName?: string;
  title: string;
  description: string;
  codeSnippet?: string;
  status: 'open' | 'answered' | 'resolved';
  createdAt: string;
  replies: StudentDoubtReply[];
}

export interface RecordedClassItem {
  id: string;
  courseId: string;
  batchId: string;
  title: string;
  description: string;
  moduleName: string;
  sessionDate: string;
  durationMinutes: number;
  videoUrl: string;
  uploadedByTeacherId: string;
  uploadedByTeacherName: string;
  createdAt: string;
  isAvailableToStudents: boolean;
}

