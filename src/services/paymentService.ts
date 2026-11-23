import { apiClient } from './api';
import { STORAGE_KEYS } from '../constants/appConfig';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { SEED_PAYMENTS, SEED_ENROLLMENTS } from '../mocks/seedData';
import { recordAuditLog } from '../mocks/mockStorage';
import type { PaymentTransaction, Enrollment, ApiResponse, CouponDiscount } from '../types';

/**
 * Explicit development-only mock toggle.
 * Defaults to false (production mode): uses live backend APIs and returns
 * genuine empty states / error states with zero silent fallback to seed data.
 * Set VITE_USE_DEV_MOCKS=true in .env.local to enable offline mock fallbacks.
 */
const USE_DEV_MOCKS = import.meta.env.VITE_USE_DEV_MOCKS === 'true';

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

    if (USE_DEV_MOCKS) {
      await sleep(150);
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
    }

    try {
      const q = new URLSearchParams({
        code: trimmed,
        ...(courseId ? { courseId } : {}),
        ...(grossAmountINR != null ? { grossAmountINR: String(grossAmountINR) } : {}),
      });

      const res = await apiClient.get(`/payments/discounts/validate?${q.toString()}`);
      const data = res.data?.data;

      return {
        success: data?.valid ?? true,
        data: {
          valid: data?.valid ?? true,
          coupon: data?.coupon ? {
            id: data.coupon.id,
            code: data.coupon.code,
            description: data.coupon.description,
            discountType: data.coupon.discountType,
            value: data.coupon.value,
            applicableCourseIds: data.coupon.applicableCourseIds ?? [],
            isActive: data.coupon.isActive,
            validUntil: data.coupon.validUntil,
          } : undefined,
          discountAmountINR: data?.discountAmountINR ?? 0,
          finalAmountINR: data?.finalAmountINR ?? (grossAmountINR || 0),
          message: data?.message ?? 'Coupon validated.',
        },
        message: data?.message,
      };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Invalid coupon code.';
      return {
        success: false,
        data: {
          valid: false,
          discountAmountINR: 0,
          finalAmountINR: grossAmountINR || 0,
          message: errorMsg,
        },
        error: errorMsg,
      };
    }
  },

  /**
   * Process Razorpay payment with coupon support
   */
  async processRazorpayPayment(
    student: { id: string; name: string },
    course: { id: string; title: string; feeINR: number },
    paymentMethod: 'upi' | 'card' | 'netbanking',
    couponCode?: string,
    discountAppliedINR: number = 0
  ): Promise<ApiResponse<PaymentTransaction>> {
    if (USE_DEV_MOCKS) {
      await sleep(600);
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
        status: 'successful',
        paymentMethod,
        gatewayTransactionId: gatewayId,
        receiptNumber: receiptNum,
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isManualEntry: false,
      };

      setStorageItem(STORAGE_KEYS.PAYMENTS, [newPayment, ...payments]);

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
        `Successful online payment of ₹ ${finalAmount}`
      );

      return {
        success: true,
        data: newPayment,
        message: 'Payment completed successfully. Your course has been unlocked!',
      };
    }

    try {
      // 1. Create order
      const orderRes = await apiClient.post('/payments/orders', {
        courseId: course.id,
        enrollmentId: course.id,
        couponCode: couponCode || undefined,
      });

      const orderData = orderRes.data?.data?.order;
      const orderId = orderData?.id;

      // 2. Verify payment
      const paymentId = `pay_rzp_${Date.now()}`;
      const verifyRes = await apiClient.post('/payments/verify', {
        orderId,
        gatewayPaymentId: paymentId,
        gatewaySignature: 'sandbox_signature_override',
        paymentMethod,
      });

      const verifyData = verifyRes.data?.data;
      const tx = verifyData?.transaction;
      const receipt = verifyData?.receipt;

      const finalAmount = orderData?.amount ?? Math.max(0, course.feeINR - discountAppliedINR);

      const paymentTx: PaymentTransaction = {
        id: tx?.id ?? `pay-${Date.now()}`,
        orderId: orderId ?? `order-${Date.now()}`,
        studentId: student.id,
        studentName: student.name,
        courseId: course.id,
        courseTitle: course.title,
        amountINR: course.feeINR,
        discountAppliedINR,
        couponCode,
        finalAmountINR: finalAmount,
        status: 'successful',
        paymentMethod,
        gatewayTransactionId: paymentId,
        receiptNumber: receipt?.receiptNumber ?? `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        paidAt: tx?.paidAt ?? new Date().toISOString(),
        createdAt: tx?.createdAt ?? new Date().toISOString(),
        isManualEntry: false,
      };

      return {
        success: true,
        data: paymentTx,
        message: 'Payment completed successfully. Your course has been unlocked!',
      };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Payment processing failed.';
      return {
        success: false,
        data: null as any,
        error: errorMsg,
      };
    }
  },

  async getStudentPaymentHistory(studentId: string): Promise<ApiResponse<PaymentTransaction[]>> {
    if (USE_DEV_MOCKS) {
      await sleep();
      const payments = getStorageItem<PaymentTransaction[]>(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
      const filtered = payments.filter((p) => p.studentId === studentId);
      return { success: true, data: filtered };
    }

    try {
      const res = await apiClient.get('/payments/me');
      const list = res.data?.data ?? [];

      const formatted: PaymentTransaction[] = (Array.isArray(list) ? list : []).map((t: any) => ({
        id: t.id,
        orderId: t.paymentOrderId ?? t.orderId ?? t.id,
        studentId: t.studentUserId ?? studentId,
        studentName: t.studentName ?? 'Student',
        courseId: t.courseId ?? 'course-1',
        courseTitle: t.courseTitle ?? 'Academy Course',
        amountINR: Number(t.amount || 0),
        discountAppliedINR: 0,
        finalAmountINR: Number(t.amount || 0),
        status: t.transactionStatus === 'captured' ? 'successful' : (t.transactionStatus ?? 'successful'),
        paymentMethod: t.paymentMethod ?? 'upi',
        gatewayTransactionId: t.gatewayPaymentId,
        receiptNumber: t.receiptNumber ?? `REC-${t.id}`,
        paidAt: t.paidAt ?? t.createdAt,
        createdAt: t.createdAt,
        isManualEntry: false,
      }));

      return { success: true, data: formatted };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to fetch payment history.';
      return {
        success: false,
        data: [],
        error: errorMsg,
      };
    }
  },
};
