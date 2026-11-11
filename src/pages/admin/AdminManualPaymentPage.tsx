import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Receipt, Save, AlertCircle, ShieldCheck } from 'lucide-react';
import { getStorageItem } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/appConfig';
import { adminService } from '../../services/adminService';
import { manualPaymentSchema, type ManualPaymentFormData } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { SEED_COURSES } from '../../mocks/seedData';
import { formatINR } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import type { StudentProfile } from '../../types';

export const AdminManualPaymentPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const students = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ManualPaymentFormData>({
    resolver: zodResolver(manualPaymentSchema),
    defaultValues: {
      studentId: students[0]?.id || '',
      courseId: SEED_COURSES[0].id,
      amountINR: 38000,
      paymentMethod: 'manual_cash',
      receiptNumber: `REC-MANUAL-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: 'Direct campus walk-in fee deposit verified by admissions desk.',
    },
  });

  const onSubmit = async (data: ManualPaymentFormData) => {
    if (!user) return;
    const student = students.find((s) => s.id === data.studentId);
    const course = SEED_COURSES.find((c) => c.id === data.courseId);

    const res = await adminService.recordManualPayment(
      { id: user.id, name: user.name },
      {
        studentId: data.studentId,
        studentName: student?.name || 'Student',
        courseId: data.courseId,
        courseTitle: course?.title || 'Program',
        amountINR: data.amountINR,
        paymentMethod: data.paymentMethod,
        receiptNumber: data.receiptNumber,
        notes: data.notes,
      }
    );

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Manual Payment Recorded',
        message: `Offline transaction of ${formatINR(data.amountINR)} recorded with mandatory audit log (BR-017). Course access unlocked.`,
      });
      navigate('/admin/payments');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manual Payment Entry</h1>
        <p className="text-xs text-slate-500 mt-1">
          Record offline cash, demand draft, or direct NEFT/RTGS bank transfers. In compliance with <strong>SRS Rule BR-017</strong>, every manual payment entry generates an unalterable system audit trail.
        </p>
      </div>

      <Card className="p-8 shadow-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Candidate / Student *</label>
            <select
              {...register('studentId')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email}) - {s.adminApprovalStatus.toUpperCase()}
                </option>
              ))}
            </select>
            {errors.studentId && <p className="text-rose-500 text-[11px] mt-0.5">{errors.studentId.message}</p>}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Course *</label>
            <select
              {...register('courseId')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SEED_COURSES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({formatINR(c.discountedFeeINR || c.feeINR)})
                </option>
              ))}
            </select>
            {errors.courseId && <p className="text-rose-500 text-[11px] mt-0.5">{errors.courseId.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount Paid (₹ INR) *</label>
              <input
                type="number"
                {...register('amountINR', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
              />
              {errors.amountINR && <p className="text-rose-500 text-[11px] mt-0.5">{errors.amountINR.message}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Channel *</label>
              <select
                {...register('paymentMethod')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="manual_cash">Cash Deposit (Campus Desk)</option>
                <option value="manual_bank_transfer">Direct Bank Transfer (NEFT/IMPS)</option>
                <option value="upi">Manual UPI POS Transaction</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Receipt / Bank Reference Number *</label>
            <input
              type="text"
              {...register('receiptNumber')}
              placeholder="e.g. REC-MANUAL-1049 or UTR102934812"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            {errors.receiptNumber && <p className="text-rose-500 text-[11px] mt-0.5">{errors.receiptNumber.message}</p>}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Audit Notes & Justification (Required by BR-017) *
            </label>
            <textarea
              rows={3}
              {...register('notes')}
              placeholder="Provide reason for manual recording and physical voucher details..."
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.notes && <p className="text-rose-500 text-[11px] mt-0.5">{errors.notes.message}</p>}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full py-2.5"
              isLoading={isSubmitting}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Record Payment & Unlock Course Access
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

