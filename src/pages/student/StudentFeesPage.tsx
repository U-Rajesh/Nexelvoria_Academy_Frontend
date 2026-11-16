import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Download,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  BookOpen,
  Sparkles,
  Lock,
  Layers,
  Tag,
  Check,
  X,
} from 'lucide-react';
import { SEED_COURSES } from '../../mocks/seedData';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatINR, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import { useStorageSync } from '../../hooks/useStorageSync';
import { getStorageItem, setStorageItem } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/appConfig';
import type { PaymentTransaction, StudentProfile, Course, CouponDiscount } from '../../types';

export const StudentFeesPage: React.FC = () => {
  const { user, refreshCurrentUser } = useAuth();
  const { showToast } = useNotification();

  const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || SEED_COURSES[0].id);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);

  // Coupon & Scholarship Discount State (PAY-009, ADM-010)
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponDiscount | null>(null);
  const [discountAmountINR, setDiscountAmountINR] = useState(0);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0] || SEED_COURSES[0];

  const student = user as (StudentProfile | null);
  const isApproved = student?.adminApprovalStatus === 'approved';
  const enrolledCourseIds = student?.enrolledCourseIds || [];
  const isAlreadyEnrolled = enrolledCourseIds.includes(selectedCourse.id);

  const loadPaymentData = React.useCallback(() => {
    if (!user) return;
    paymentService.getStudentPaymentHistory(user.id).then((res) => {
      if (res.success) setTransactions(res.data);
    });
  }, [user]);

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  useStorageSync([STORAGE_KEYS.PAYMENTS, STORAGE_KEYS.ENROLLMENTS, STORAGE_KEYS.DISCOUNTS], loadPaymentData);

  // Re-verify coupon when course selection changes
  useEffect(() => {
    if (appliedCoupon && selectedCourse) {
      if (appliedCoupon.applicableCourseIds && appliedCoupon.applicableCourseIds.length > 0) {
        if (!appliedCoupon.applicableCourseIds.includes(selectedCourse.id)) {
          setAppliedCoupon(null);
          setDiscountAmountINR(0);
          setCouponError('Previously applied coupon is not valid for this newly selected course.');
        }
      }
    }
  }, [selectedCourseId, appliedCoupon, selectedCourse]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError(null);
    const grossFee = selectedCourse.discountedFeeINR || selectedCourse.feeINR;
    const res = await paymentService.validateCoupon(couponCode, selectedCourse.id, grossFee);
    setIsValidatingCoupon(false);

    if (res.success && res.data.valid) {
      setAppliedCoupon(res.data.coupon || null);
      setDiscountAmountINR(res.data.discountAmountINR);
      showToast({
        type: 'success',
        title: 'Coupon Applied (PAY-009)',
        message: res.data.message,
      });
    } else {
      setAppliedCoupon(null);
      setDiscountAmountINR(0);
      setCouponError(res.error || res.data.message);
      showToast({
        type: 'error',
        title: 'Invalid Coupon',
        message: res.error || res.data.message,
      });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmountINR(0);
    setCouponCode('');
    setCouponError(null);
  };

  const handleInitiatePayment = async () => {
    if (!user || !isApproved) return;
    setIsProcessing(true);

    const grossFee = selectedCourse.discountedFeeINR || selectedCourse.feeINR;
    const res = await paymentService.processRazorpayPayment(
      { id: user.id, name: user.name },
      { id: selectedCourse.id, title: selectedCourse.title, feeINR: grossFee },
      selectedMethod,
      appliedCoupon?.code,
      discountAmountINR
    );
    setIsProcessing(false);
    setPaymentModalOpen(false);

    if (res.success && res.data) {
      // Add course to student's enrolled courses in storage
      const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);
      const idx = students.findIndex((s) => s.id === user.id);
      if (idx !== -1) {
        if (!students[idx].enrolledCourseIds) {
          students[idx].enrolledCourseIds = [];
        }
        if (!students[idx].enrolledCourseIds.includes(selectedCourse.id)) {
          students[idx].enrolledCourseIds.push(selectedCourse.id);
        }
        setStorageItem(STORAGE_KEYS.STUDENTS, students);

        // Update enrollment status to active
        const enrollments = getStorageItem<any[]>(STORAGE_KEYS.ENROLLMENTS, []);
        const enrIdx = enrollments.findIndex((e) => e.studentId === user.id && e.courseId === selectedCourse.id);
        if (enrIdx !== -1) {
          enrollments[enrIdx].status = 'active';
          setStorageItem(STORAGE_KEYS.ENROLLMENTS, enrollments);
        } else {
          enrollments.push({
            id: `enr-${Date.now()}`,
            studentId: user.id,
            courseId: selectedCourse.id,
            status: 'active',
            enrolledAt: new Date().toISOString(),
            progressPercentage: 0,
            completedLessonIds: [],
            bookmarkedLessonIds: [],
          });
          setStorageItem(STORAGE_KEYS.ENROLLMENTS, enrollments);
        }

        const currentStored = getStorageItem<StudentProfile | null>(STORAGE_KEYS.CURRENT_USER, null);
        if (currentStored && currentStored.id === user.id) {
          if (!currentStored.enrolledCourseIds) currentStored.enrolledCourseIds = [];
          if (!currentStored.enrolledCourseIds.includes(selectedCourse.id)) {
            currentStored.enrolledCourseIds.push(selectedCourse.id);
          }
          setStorageItem(STORAGE_KEYS.CURRENT_USER, currentStored);
        }
        refreshCurrentUser();
      }

      setTransactions((prev) => [res.data, ...prev]);
      showToast({
        type: 'success',
        title: 'Payment Successful',
        message: `Enrolled in ${selectedCourse.title}! Course lessons and LMS viewer are now fully unlocked.`,
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tuition Fees & Payments</h1>
        <p className="text-xs text-slate-500 mt-1">
          Select courses, manage enrollment tuition fees, access tax invoices, and review payment history.
        </p>
      </div>

      {/* Admin Approval Gate Notice (BR-002) */}
      {!isApproved ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong>Admissions Approval Required (SRS Rule BR-002):</strong> Course fee payment is restricted until your application has been vetted and approved by Institute Admissions.
            <div className="mt-1 text-slate-600">
              Current status: <span className="font-semibold text-amber-800">{student?.adminApprovalStatus || 'Pending'}</span>. You can test instant approval by switching to <strong>Admin (Priya Nair)</strong> in the top Dev Switcher.
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 leading-relaxed">
            <strong>Admissions Verification Complete (BR-002):</strong> Your academic application is approved. You can choose any program below to complete payment and unlock the full LMS curriculum.
          </div>
        </div>
      )}

      {/* Active Course & Fee Selection Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 space-y-5">
          <div className="space-y-3 pb-4 border-b border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Choose Course to Enroll / Pay
            </label>
            <div className="relative">
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} — {formatINR(c.discountedFeeINR || c.feeINR)} ({c.durationWeeks} Weeks)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Course Breakdown */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Selected Program Track
              </span>
              <h3 className="text-base font-bold text-slate-900">{selectedCourse.title}</h3>
              <p className="text-xs text-slate-500">
                Duration: {selectedCourse.durationWeeks} Weeks • {selectedCourse.modules.length} Modules • Full Placement Support
              </p>
            </div>

            <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Payable Tuition</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-indigo-900">
                  {formatINR(Math.max(0, (selectedCourse.discountedFeeINR || selectedCourse.feeINR) - discountAmountINR))}
                </span>
                {(selectedCourse.discountedFeeINR || discountAmountINR > 0) && (
                  <span className="text-xs text-slate-400 line-through">
                    {formatINR(selectedCourse.feeINR)}
                  </span>
                )}
              </div>
              {discountAmountINR > 0 && (
                <span className="text-[11px] font-semibold text-emerald-600 block">
                  Savings of {formatINR(discountAmountINR)} applied
                </span>
              )}
            </div>
          </div>

          {/* Coupon & Scholarship Section (CRD 3.8: PAY-009, 3.4: ADM-010) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Tag className="h-4 w-4 text-indigo-600" />
              <span>Promotional Coupon or Merit Scholarship Code (PAY-009)</span>
            </div>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {appliedCoupon.code}
                    </span>
                    <Badge variant="success" size="sm">Applied</Badge>
                  </div>
                  <p className="text-[11px] text-emerald-700">{appliedCoupon.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-900">- {formatINR(discountAmountINR)}</span>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    title="Remove Coupon"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError(null);
                    }}
                    placeholder="e.g. DIWALI2026, MERIT25"
                    className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    isLoading={isValidatingCoupon}
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim()}
                  >
                    Apply
                  </Button>
                </div>
                {couponError && (
                  <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
            <p>
              • <strong>Payment Rule (BR-005):</strong> Lump-sum tuition payment via Razorpay. Installments are not supported.
            </p>
            <p>
              • <strong>Immediate Activation:</strong> Webhook automatically verifies payment and unlocks the LMS lesson player.
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex items-center gap-3">
            {isAlreadyEnrolled ? (
              <div className="flex items-center gap-3">
                <Badge variant="success" size="md" dot>
                  Already Enrolled & Active
                </Badge>
                <Link to={`/student/courses/${selectedCourse.id}/learn`}>
                  <Button variant="primary" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Open Course in LMS Viewer
                  </Button>
                </Link>
              </div>
            ) : (
              <Button
                variant="primary"
                size="md"
                disabled={!isApproved}
                onClick={() => setPaymentModalOpen(true)}
                rightIcon={<CreditCard className="h-4 w-4" />}
              >
                Pay via Razorpay Gateway ({formatINR(Math.max(0, (selectedCourse.discountedFeeINR || selectedCourse.feeINR) - discountAmountINR))})
              </Button>
            )}
          </div>
        </Card>

        {/* Security & Guarantee Info */}
        <Card className="p-6 space-y-4 bg-slate-900 text-white flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">PCI-DSS Compliant</span>
            </div>
            <h4 className="text-base font-bold text-white">Bank-Grade Secure Checkout</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              All transactions are processed through 256-bit encrypted Razorpay gateways. Instant digital tax invoices with unique GSTIN identifiers are issued upon completion.
            </p>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Need Fee Assistance?</span>
            <p>Contact Admissions at <strong>admissions@nexelvoria.edu.in</strong> or speak with your assigned academic counselor.</p>
          </div>
        </Card>
      </div>

      {/* Payment History & Receipts */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Payment Transactions & Invoices</h3>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            No completed transactions found for your account. Complete a course payment above to generate your tax invoice.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{tx.receiptNumber}</span>
                    <Badge variant="success" size="sm" dot>Successful</Badge>
                    {tx.isManualEntry && <Badge variant="warning" size="sm">Manual Entry</Badge>}
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{tx.courseTitle}</p>
                  <p className="text-[11px] text-slate-400">
                    Paid via {tx.paymentMethod.toUpperCase()} • {formatDate(tx.paidAt)}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-base font-extrabold text-slate-900">{formatINR(tx.finalAmountINR)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      showToast({
                        type: 'info',
                        title: 'Invoice Downloaded',
                        message: `Tax Receipt ${tx.receiptNumber} downloaded for ${user?.name}.`,
                      });
                    }}
                    leftIcon={<Download className="h-3.5 w-3.5" />}
                  >
                    Receipt PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Razorpay Simulation Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Razorpay Payment Gateway (Simulated)"
        size="md"
      >
        <div className="space-y-5">
          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Course:</span>
                <span className="font-bold text-slate-900">{selectedCourse.title}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Base Tuition:</span>
                <span className="font-semibold text-slate-700">
                  {formatINR(selectedCourse.discountedFeeINR || selectedCourse.feeINR)}
                </span>
              </div>
            </div>

            {appliedCoupon && (
              <div className="flex items-center justify-between pt-2 border-t border-indigo-200/60 text-emerald-800">
                <span className="flex items-center gap-1 font-medium">
                  <Tag className="h-3.5 w-3.5 text-emerald-600" />
                  Coupon Discount ({appliedCoupon.code}):
                </span>
                <span className="font-bold">- {formatINR(discountAmountINR)}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-indigo-200/60 font-bold">
              <span className="text-slate-900">Final Net Payable:</span>
              <span className="text-lg font-black text-indigo-900">
                {formatINR(Math.max(0, (selectedCourse.discountedFeeINR || selectedCourse.feeINR) - discountAmountINR))}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Select Payment Method</label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('upi')}
                className={`w-full p-3 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer ${
                  selectedMethod === 'upi'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <span>Instant UPI (Google Pay / PhonePe / Paytm / BHIM)</span>
                {selectedMethod === 'upi' && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('card')}
                className={`w-full p-3 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer ${
                  selectedMethod === 'card'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <span>Credit / Debit Card (Visa, Mastercard, RuPay)</span>
                {selectedMethod === 'card' && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('netbanking')}
                className={`w-full p-3 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer ${
                  selectedMethod === 'netbanking'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <span>Net Banking (SBI, HDFC, ICICI, Axis)</span>
                {selectedMethod === 'netbanking' && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isProcessing}
              onClick={handleInitiatePayment}
            >
              Confirm & Pay {formatINR(Math.max(0, (selectedCourse.discountedFeeINR || selectedCourse.feeINR) - discountAmountINR))}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
