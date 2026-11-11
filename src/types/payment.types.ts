export type PaymentStatus = 'pending' | 'successful' | 'failed' | 'cancelled' | 'refunded';

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'manual_cash' | 'manual_bank_transfer';

export interface PaymentTransaction {
  id: string;
  orderId: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  amountINR: number;
  discountAppliedINR: number;
  couponCode?: string;
  finalAmountINR: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  gatewayTransactionId?: string; // Razorpay payment ID
  receiptNumber: string;
  paidAt?: string;
  createdAt: string;
  isManualEntry: boolean;
  manualEnteredByAdminId?: string;
  manualNotes?: string;
}

export interface RefundRequest {
  id: string;
  transactionId: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  amountINR: number;
  reason: string;
  status: 'pending_super_admin' | 'approved' | 'rejected';
  requestedAt: string;
  decidedAt?: string;
  decidedBySuperAdminId?: string;
  superAdminRemarks?: string;
}

export interface CouponDiscount {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed_amount';
  value: number; // e.g., 20 (%) or 5000 (INR)
  applicableCourseIds: string[]; // empty for all courses
  isActive: boolean;
  validUntil: string;
}

