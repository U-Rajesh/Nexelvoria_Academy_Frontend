import { STORAGE_KEYS } from '../constants/appConfig';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { SEED_PAYMENTS, SEED_ENROLLMENTS } from '../mocks/seedData';
import { recordAuditLog } from '../mocks/mockStorage';
import type { PaymentTransaction, Enrollment, ApiResponse } from '../types';

const sleep = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const paymentService = {
  /**
   * Simulate Razorpay order creation and payment success
   */
  async processRazorpayPayment(
    student: { id: string; name: string },
    course: { id: string; title: string; feeINR: number },
    paymentMethod: 'upi' | 'card' | 'netbanking'
  ): Promise<ApiResponse<PaymentTransaction>> {
    await sleep(600); // simulate gateway processing latency

    const payments = getStorageItem<PaymentTransaction[]>(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
    const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);

    const receiptNum = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const gatewayId = `pay_rzp_${Date.now()}`;

    const newPayment: PaymentTransaction = {
      id: `pay-${Date.now()}`,
      orderId: `order_rzp_${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      courseId: course.id,
      courseTitle: course.title,
      amountINR: course.feeINR,
      discountAppliedINR: 0,
      finalAmountINR: course.feeINR,
      status: 'successful', // Verified payment activates course access (BR-004)
      paymentMethod,
      gatewayTransactionId: gatewayId,
      receiptNumber: receiptNum,
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isManualEntry: false,
    };

    setStorageItem(STORAGE_KEYS.PAYMENTS, [newPayment, ...payments]);

    // Activate enrollment
    let enr = enrollments.find((e) => e.studentId === student.id && e.courseId === course.id);
    if (enr) {
      enr.status = 'active';
    } else {
      enr = {
        id: `enr-${Date.now()}`,
        studentId: student.id,
        courseId: course.id,
        status: 'active',
        enrolledAt: new Date().toISOString(),
        progressPercentage: 0,
        completedLessonIds: [],
        bookmarkedLessonIds: [],
      };
      enrollments.push(enr);
    }
    setStorageItem(STORAGE_KEYS.ENROLLMENTS, enrollments);

    recordAuditLog(
      { id: student.id, name: student.name, role: 'student' },
      'PAYMENT_SUCCESS_ONLINE',
      `Payment: ${receiptNum} Course: ${course.title}`,
      `Successful online payment of ₹ ${course.feeINR} via ${paymentMethod.toUpperCase()}. Enrollment activated.`
    );

    return {
      success: true,
      data: newPayment,
      message: 'Payment completed successfully. Your course has been unlocked!',
    };
  },

  async getStudentPaymentHistory(studentId: string): Promise<ApiResponse<PaymentTransaction[]>> {
    await sleep();
    const payments = getStorageItem<PaymentTransaction[]>(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
    const filtered = payments.filter((p) => p.studentId === studentId);
    return { success: true, data: filtered };
  },
};

