export type EnrollmentStatus =
  | 'pending_approval' // Waiting for Admin to approve student application
  | 'approved_unpaid'  // Admin approved; awaiting course payment
  | 'active'           // Payment verified; full course access granted
  | 'completed'        // Completed course modules
  | 'cancelled'
  | 'suspended';

/** An enrollment as returned to administrators, with display and fee fields. */
export interface AdminEnrollmentRow extends Enrollment {
  studentName?: string;
  studentEmail?: string;
  courseTitle?: string;
  batchCode?: string;
  enrollmentNumber: string;
  coursePrice: number;
  discountAmount: number;
  finalAmount: number;
  activatedAt?: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  batchId?: string;
  enrollmentType?: 'self' | 'admin';
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

