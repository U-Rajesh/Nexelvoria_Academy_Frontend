export type EnrollmentStatus =
  | 'pending_approval' // Waiting for Admin to approve student application
  | 'approved_unpaid'  // Admin approved; awaiting course payment
  | 'active'           // Payment verified; full course access granted
  | 'completed'        // Completed course modules
  | 'cancelled'
  | 'suspended';

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  batchId?: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt?: string;
  progressPercentage: number;
  completedLessonIds: string[];
  bookmarkedLessonIds: string[];
  isAuthorizedFreeAccess?: boolean; // Granted via financial override
  overrideReason?: string;
  overrideApprovedBy?: string;
}

