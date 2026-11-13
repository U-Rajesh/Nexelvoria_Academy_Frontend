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
import { getStorageItem, setStorageItem } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/appConfig';
import type { PaymentTransaction, StudentProfile, Course } from '../../types';

export const StudentFeesPage: React.FC = () => {
  const { user, refreshCurrentUser } = useAuth();
  const { showToast } = useNotification();

  const courses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || SEED_COURSES[0].id);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0] || SEED_COURSES[0];

  const student = user as (StudentProfile | null);
  const isApproved = student?.adminApprovalStatus === 'approved';
  const enrolledCourseIds = student?.enrolledCourseIds || [];
  const isAlreadyEnrolled = enrolledCourseIds.includes(selectedCourse.id);

  useEffect(() => {
    if (!user) return;
    paymentService.getStudentPaymentHistory(user.id).then((res) => {
      if (res.success) setTransactions(res.data);
    });
  }, [user]);

  const handleInitiatePayment = async () => {
    if (!user || !isApproved) return;
    setIsProcessing(true);

    const feeToPay = selectedCourse.discountedFeeINR || selectedCourse.feeINR;
    const res = await paymentService.processRazorpayPayment(
      { id: user.id, name: user.name },
      { id: selectedCourse.id, title: selectedCourse.title, feeINR: feeToPay },
      selectedMethod
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Tuition</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-indigo-900">
                  {formatINR(selectedCourse.discountedFeeINR || selectedCourse.feeINR)}
                </span>
                {selectedCourse.discountedFeeINR && (
                  <span className="text-xs text-slate-400 line-through">
                    {formatINR(selectedCourse.feeINR)}
                  </span>
                )}
              </div>
            </div>
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
                Pay via Razorpay Gateway ({formatINR(selectedCourse.discountedFeeINR || selectedCourse.feeINR)})
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
          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">Course:</span>
              <span className="font-bold text-slate-900">{selectedCourse.title}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Amount:</span>
              <span className="text-lg font-extrabold text-indigo-900">
                {formatINR(selectedCourse.discountedFeeINR || selectedCourse.feeINR)}
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
              Confirm & Pay {formatINR(selectedCourse.discountedFeeINR || selectedCourse.feeINR)}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
