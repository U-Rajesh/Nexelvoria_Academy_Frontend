import { STORAGE_KEYS } from '../constants/appConfig';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { SEED_PAYMENTS, SEED_ENROLLMENTS } from '../mocks/seedData';
import { recordAuditLog } from '../mocks/mockStorage';
import type { PaymentTransaction, Enrollment, ApiResponse, CouponDiscount } from '../types';

const sleep = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const paymentService = {
  /**
   * Validate discount or coupon code against promotional ledger (CRD 3.8: PAY-009, 3.4: ADM-010)
   */
  async validateCoupon(
    code: string,
    courseId?: string,
    grossAmountINR?: number
  ): Promise<ApiResponse<{
    valid: boolean;
    coupon?: CouponDiscount;
    discountAmountINR: number;
    finalAmountINR: number;
    message: string;
  }>> {
    await sleep(150);
    const trimmed = (code || '').trim().toUpperCase();
    if (!trimmed) {
      return {
        success: false,
        data: {
          valid: false,
          discountAmountINR: 0,
          finalAmountINR: grossAmountINR || 0,
          message: 'Please enter a coupon code.',
        },
        error: 'Please enter a coupon code.',
      };
    }

    const defaultDiscounts: CouponDiscount[] = [
      {
        id: 'disc-01',
        code: 'DIWALI2026',
        description: 'Festive scholarship flat reduction for early applicants',
        discountType: 'fixed_amount',
        value: 7000,
        applicableCourseIds: [],
        isActive: true,
        validUntil: '2026-12-31',
      },
      {
        id: 'disc-02',
        code: 'MERIT25',
        description: 'Academic excellence 25% tuition fee waiver',
        discountType: 'percentage',
        value: 25,
        applicableCourseIds: [],
        isActive: true,
        validUntil: '2026-12-31',
      },
    ];

    const discounts = getStorageItem<CouponDiscount[]>(STORAGE_KEYS.DISCOUNTS, defaultDiscounts);
    const coupon = discounts.find((d) => d.code.toUpperCase() === trimmed);

    if (!coupon) {
      return {
        success: false,
        data: {
          valid: false,
          discountAmountINR: 0,
          finalAmountINR: grossAmountINR || 0,
          message: 'Invalid coupon code.',
        },
        error: 'Invalid coupon code.',
      };
    }

    if (!coupon.isActive) {
      return {
        success: false,
        data: {
          valid: false,
          coupon,
          discountAmountINR: 0,
          finalAmountINR: grossAmountINR || 0,
          message: 'This coupon code is no longer active.',
        },
        error: 'This coupon code is no longer active.',
      };
    }

    const today = new Date().toISOString().slice(0, 10);
    if (coupon.validUntil && coupon.validUntil < today) {
      return {
        success: false,
        data: {
          valid: false,
          coupon,
          discountAmountINR: 0,
          finalAmountINR: grossAmountINR || 0,
          message: 'This coupon code has expired.',
        },
        error: 'This coupon code has expired.',
      };
    }

    if (courseId && coupon.applicableCourseIds && coupon.applicableCourseIds.length > 0) {
      if (!coupon.applicableCourseIds.includes(courseId)) {
        return {
          success: false,
          data: {
            valid: false,
            coupon,
            discountAmountINR: 0,
            finalAmountINR: grossAmountINR || 0,
            message: 'This coupon code is not applicable to the selected course.',
          },
          error: 'This coupon code is not applicable to the selected course.',
        };
      }
    }

    const baseAmount = grossAmountINR || 0;
    let discountAmountINR = 0;
    if (coupon.discountType === 'percentage') {
      discountAmountINR = Math.round((baseAmount * coupon.value) / 100);
    } else {
      discountAmountINR = Math.min(coupon.value, baseAmount);
    }
    const finalAmountINR = Math.max(0, baseAmount - discountAmountINR);

    return {
      success: true,
      data: {
        valid: true,
        coupon,
        discountAmountINR,
        finalAmountINR,
        message: `Coupon applied: ${coupon.description} (Savings: ₹ ${discountAmountINR.toLocaleString('en-IN')})`,
      },
      message: 'Coupon code applied successfully.',
    };
  },

  /**
   * Simulate Razorpay order creation and payment success with coupon support (CRD 3.8: PAY-001 to PAY-009)
   */
  async processRazorpayPayment(
    student: { id: string; name: string },
    course: { id: string; title: string; feeINR: number },
    paymentMethod: 'upi' | 'card' | 'netbanking',
    couponCode?: string,
    discountAppliedINR: number = 0
  ): Promise<ApiResponse<PaymentTransaction>> {
    await sleep(600); // simulate gateway processing latency

    const payments = getStorageItem<PaymentTransaction[]>(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
    const enrollments = getStorageItem<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, SEED_ENROLLMENTS);

    const receiptNum = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const gatewayId = `pay_rzp_${Date.now()}`;
    const finalAmount = Math.max(0, course.feeINR - (discountAppliedINR || 0));

    const newPayment: PaymentTransaction = {
      id: `pay-${Date.now()}`,
      orderId: `order_rzp_${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      courseId: course.id,
      courseTitle: course.title,
      amountINR: course.feeINR,
      discountAppliedINR: discountAppliedINR || 0,
      couponCode: couponCode ? couponCode.trim().toUpperCase() : undefined,
      finalAmountINR: finalAmount,
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
      `Successful online payment of ₹ ${finalAmount}${couponCode ? ` (Coupon: ${couponCode}, Disc: ₹ ${discountAppliedINR})` : ''} via ${paymentMethod.toUpperCase()}. Enrollment activated.`
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

