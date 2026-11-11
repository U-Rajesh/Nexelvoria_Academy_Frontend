export type QuestionType =
  | 'mcq'
  | 'multiple_select'
  | 'true_false'
  | 'short_answer'
  | 'coding';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  codeSnippet?: string;
  options?: QuestionOption[]; // for mcq & multiple_select
  correctAnswers?: string[]; // for mcq, multiple_select, true_false
  maxMarks: number;
  explanation?: string;
}

export interface OnlineTest {
  id: string;
  courseId: string;
  batchId?: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalMarks: number;
  passingPercentage: number; // Configurable (default 60%)
  questions: Question[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  allowRetakes: boolean;
}

export interface StudentAnswer {
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
  codeAnswer?: string;
  marksAwarded?: number;
  teacherFeedback?: string;
}

export interface TestAttempt {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  startedAt: string;
  submittedAt?: string;
  answers: StudentAnswer[];
  totalScore: number;
  isPassed: boolean;
  status: 'in_progress' | 'submitted' | 'evaluated';
  isRetakeAuthorized: boolean;
  retakeAuthorizedBy?: string; // Teacher or Admin
  retakeOverrideByAdmin?: boolean; // BR-012
  retakeRequestStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  retakeRejectedReason?: string;
  retakeRequestedAt?: string;
}

export type AssignmentSubmissionMethod = 'file_upload' | 'text' | 'zip_upload' | 'github_link';

export interface Assignment {
  id: string;
  courseId: string;
  batchId: string;
  title: string;
  instructions: string;
  attachmentUrl?: string;
  allowedSubmissionMethods: AssignmentSubmissionMethod[];
  maxMarks: number;
  dueDate: string;
  createdByTeacherId: string;
  createdAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  method: AssignmentSubmissionMethod;
  fileUrl?: string;
  fileName?: string;
  githubUrl?: string;
  textContent?: string;
  marksObtained?: number;
  status: 'submitted' | 'graded' | 'resubmit_required';
  evaluatedByUserId?: string;
  evaluatedAt?: string;
  teacherFeedback?: string;
}

