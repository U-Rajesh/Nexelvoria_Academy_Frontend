import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import { adminService, type ManualPaymentMode } from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { formatINR } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import type { AdminEnrollmentRow } from '../../types';

const MODES: Array<{ value: ManualPaymentMode; label: string }> = [
  { value: 'cash', label: 'Cash Deposit (Campus Desk)' },
  { value: 'bank_transfer', label: 'Direct Bank Transfer (NEFT/IMPS/RTGS)' },
  { value: 'cheque', label: 'Cheque / Demand Draft' },
  { value: 'pos_card', label: 'Card (POS Terminal)' },
  { value: 'other', label: 'Other' },
];

export const AdminManualPaymentPage: React.FC = () => {
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [enrollments, setEnrollments] = useState<AdminEnrollmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [enrollmentId, setEnrollmentId] = useState('');
  const [paymentMode, setPaymentMode] = useState<ManualPaymentMode>('bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    // BR-002/BR-005: only Admin-approved enrollments awaiting their full payment can be settled offline.
    adminService.getEnrollments({ status: 'approved_unpaid' }).then((res) => {
      setIsLoading(false);
      if (res.success) {
        const awaiting = res.data.filter((e) => e.status === 'approved_unpaid');
        setEnrollments(awaiting);
        if (awaiting.length > 0) setEnrollmentId(awaiting[0]!.id);
      } else {
        setLoadError(res.error || 'Enrollments could not be loaded.');
      }
    });
  }, []);

  const selected = enrollments.find((e) => e.id === enrollmentId);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selected) return setFormError('Select an enrollment awaiting payment.');
    const ref = referenceNumber.trim();
    if (ref.length < 2 || ref.length > 100) return setFormError('The receipt / bank reference must be 2 to 100 characters.');

    setIsSubmitting(true);
    const res = await adminService.recordManualPayment({
      studentUserId: selected.studentId,
      enrollmentId: selected.id,
      amount: selected.finalAmount,
      paymentMode,
      referenceNumber: ref,
    });
    setIsSubmitting(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Manual Payment Recorded',
        message: `${formatINR(selected.finalAmount)} recorded for ${selected.studentName || 'the student'}. The enrollment is now active and the payment is in the audit history.`,
      });
      navigate('/admin/payments');
    } else {
      setFormError(res.error || 'The payment could not be recorded.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manual Payment Entry</h1>
        <p className="text-xs text-slate-500 mt-1">
          Record an offline payment for an approved enrollment. The full amount due is required (no installments). Recording the payment
          verifies it, activates the enrollment and writes the audit and financial history (BR-017).
        </p>
      </div>

      <Card className="p-8 shadow-xl">
        {isLoading ? (
          <p className="text-xs text-slate-400">Loading enrollments awaiting payment…</p>
        ) : loadError ? (
          <p className="text-xs text-rose-700">{loadError}</p>
        ) : enrollments.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No approved enrollments are awaiting payment.</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Enrollment Awaiting Payment *</label>
              <select
                value={enrollmentId}
                onChange={(e) => setEnrollmentId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {enrollments.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.studentName || `Student #${e.studentId}`} · {e.courseTitle || `Course #${e.courseId}`} · {e.enrollmentNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount Due (₹ INR)</label>
                <div className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 font-bold text-sm">
                  {selected ? formatINR(selected.finalAmount) : '—'}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Mode *</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as ManualPaymentMode)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Receipt / Bank Reference Number *</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. UTR102934812 or voucher number"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-0.5">A reference already recorded for the same payment mode is refused.</p>
            </div>

            {formError && <p className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700">{formError}</p>}

            <div className="pt-2">
              <Button type="submit" variant="primary" size="md" className="w-full py-2.5" isLoading={isSubmitting} leftIcon={<Save className="h-4 w-4" />}>
                Record Payment & Activate Enrollment
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
