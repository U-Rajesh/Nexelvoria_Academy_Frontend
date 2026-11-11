import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Clock, Download, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { SEED_COURSES } from '../../mocks/seedData';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatINR, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import type { PaymentTransaction } from '../../types';

export const StudentFeesPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(SEED_COURSES[0]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if student has been approved by admin (BR-002: Admin approval is required before payment)
  const isApproved = (user as any)?.adminApprovalStatus === 'approved';

  useEffect(() => {
    if (!user) return;
    paymentService.getStudentPaymentHistory(user.id).then((res) => {
      if (res.success) setTransactions(res.data);
    });
  }, [user]);

  const handleInitiatePayment = async () => {
    if (!user) return;
    setIsProcessing(true);
    const res = await paymentService.processRazorpayPayment(
      { id: user.id, name: user.name },
      { id: selectedCourse.id, title: selectedCourse.title, feeINR: selectedCourse.discountedFeeINR || selectedCourse.feeINR },
      selectedMethod
    );
    setIsProcessing(false);
    setPaymentModalOpen(false);

    if (res.success && res.data) {
      setTransactions((prev) => [res.data, ...prev]);
      showToast({
        type: 'success',
        title: 'Payment Successful',
        message: 'Your payment was verified via Razorpay webhook. Full LMS course access is unlocked!',
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tuition Fees & Payments</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage enrolled course payments, download tax receipts, and view transaction records.
        </p>
      </div>

      {/* Admin Approval Gate Banner (BR-002) */}
      {!isApproved ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong>Payment Locked (SRS Rule BR-002):</strong> Admin approval is required before payment can be accepted. Your account is currently pending Admin verification. Use the Dev Role Switcher to switch to <strong>Admin (Priya Nair)</strong> to approve this application.
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 leading-relaxed">
            <strong>Account Approved by Admissions:</strong> You are eligible to complete your course payment and unlock all protected LMS lectures and study materials.
          </div>
        </div>
      )}

      {/* Active Fee Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Course Selection</span>
              <h3 className="text-base font-bold text-slate-900">{selectedCourse.title}</h3>
            </div>
            <Badge variant="purple" size="md">
              {formatINR(selectedCourse.discountedFeeINR || selectedCourse.feeINR)}
            </Badge>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <p><strong>Payment Policy:</strong> Single lump-sum payment through Razorpay (Installments not supported per BR-005).</p>
            <p><strong>Supported Methods:</strong> Instant UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking.</p>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              disabled={!isApproved}
              onClick={() => setPaymentModalOpen(true)}
              rightIcon={<CreditCard className="h-4 w-4" />}
            >
              Pay via Razorpay Gateway
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Secure Checkout</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            256-bit encrypted transactions. Receipts with unique GST and reference identifiers are issued automatically upon confirmation.
          </p>
        </Card>
      </div>

      {/* Payment History & Receipts */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Payment Transactions & Invoices</h3>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            No completed transactions found for your account.
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
                        message: `Receipt ${tx.receiptNumber} generated for ${user?.name}.`,
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
              <span className="text-slate-500 block">Payable Amount:</span>
              <span className="text-lg font-extrabold text-indigo-900">
                {formatINR(selectedCourse.discountedFeeINR || selectedCourse.feeINR)}
              </span>
            </div>
            <Badge variant="neutral" size="sm" className="bg-white">
              Lump Sum Only
            </Badge>
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

