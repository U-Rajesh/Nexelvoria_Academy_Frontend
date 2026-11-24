import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layers, Plus, BookOpen, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate, formatINR } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { Modal } from '../../components/feedback/Modal';
import { Card } from '../../components/common/Card';
import type { AdminEnrollmentRow, StudentProfile, Course, Batch, EnrollmentStatus, CouponDiscount } from '../../types';

/** Statuses an administrator may set from this page. */
const SETTABLE_STATUSES: { value: EnrollmentStatus; label: string }[] = [
  { value: 'approved_unpaid', label: 'Awaiting payment' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

/**
 * The server grants access only through payment verification, a recorded
 * manual payment or a free-access override; this page may only RESUME a
 * suspended enrollment that one of those already activated (CL-001 item 8).
 */
const canResume = (enr: AdminEnrollmentRow): boolean => enr.status === 'suspended' && Boolean(enr.activatedAt);

const statusLabel = (s: string): string =>
  SETTABLE_STATUSES.find((x) => x.value === s)?.label ?? s.replace(/_/g, ' ');

const MIN_REASON = 10;

export const AdminEnrollmentPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [searchParams] = useSearchParams();
  const batchIdParam = searchParams.get('batchId');

  const [enrollments, setEnrollments] = useState<AdminEnrollmentRow[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // New enrollment form
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [discounts, setDiscounts] = useState<CouponDiscount[]>([]);
  const [selectedDiscountCode, setSelectedDiscountCode] = useState('');
  const [freeAccess, setFreeAccess] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  /** D6 / D4: shown only after the server reports a full batch or missing prerequisites. */
  const [needsCapacityReason, setNeedsCapacityReason] = useState<string | null>(null);
  const [needsPrereqReason, setNeedsPrereqReason] = useState<string | null>(null);
  const [capacityReason, setCapacityReason] = useState('');
  const [prereqReason, setPrereqReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual activation requires a justification (BR-004 / BR-017).
  const [activationTarget, setActivationTarget] = useState<AdminEnrollmentRow | null>(null);
  const [activationReason, setActivationReason] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    const [eRes, sRes, cRes, bRes, dRes] = await Promise.all([
      adminService.getEnrollments(),
      // Only approved students can be enrolled (BR-002).
      adminService.getStudents({ approvalStatus: 'approved' }),
      adminService.getCourses(),
      adminService.getBatches(),
      // Only institute-defined discounts may be applied (PAY-009 / ADM-010).
      adminService.getDiscounts(),
    ]);
    setIsLoading(false);

    const firstError = [eRes, sRes, cRes, bRes, dRes].find((r) => !r.success);
    setLoadError(firstError ? firstError.error || 'Some enrollment data could not be loaded.' : null);

    if (dRes.success) setDiscounts(dRes.data.filter((d) => d.isActive));
    if (eRes.success) setEnrollments(eRes.data);
    if (sRes.success) setStudents(sRes.data);
    if (cRes.success) setCourses(cRes.data);
    if (bRes.success) {
      setBatches(bRes.data);
      if (batchIdParam) {
        const found = bRes.data.find((b) => b.id === batchIdParam);
        if (found) {
          setSelectedBatchId(found.id);
          setSelectedCourseId(found.courseId);
          setEnrollModalOpen(true);
        }
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  // The server charges the course list price; this preview mirrors it.
  const coursePrice = selectedCourse ? selectedCourse.feeINR : 0;
  // Preview only; the server recomputes with the same formula and validates
  // that the discount is active and in date.
  const selectedDiscount = discounts.find((d) => d.code === selectedDiscountCode);
  const discount = !selectedDiscount
    ? 0
    : selectedDiscount.discountType === 'percentage'
    ? Math.round((coursePrice * selectedDiscount.value) / 100)
    : Math.min(selectedDiscount.value, coursePrice);
  const waived = freeAccess ? coursePrice : discount;
  const netPayable = Math.max(0, coursePrice - waived);

  const applicableBatches = useMemo(
    () =>
      batches.filter(
        (b) => b.courseId === selectedCourseId && b.status !== 'completed' && b.status !== 'cancelled'
      ),
    [batches, selectedCourseId]
  );

  /** A new selection may not need an override: ask again only if the server refuses again. */
  const clearOverridePrompts = () => {
    setNeedsCapacityReason(null);
    setNeedsPrereqReason(null);
  };

  const resetForm = () => {
    setSelectedStudentId('');
    setSelectedCourseId('');
    setSelectedBatchId('');
    setSelectedDiscountCode('');
    setFreeAccess(false);
    setOverrideReason('');
    setNeedsCapacityReason(null);
    setNeedsPrereqReason(null);
    setCapacityReason('');
    setPrereqReason('');
  };

  const handleCreateEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!selectedStudentId || !selectedCourseId) {
      showToast({ type: 'warning', message: 'Select a student and a course.' });
      return;
    }
    if (freeAccess && overrideReason.trim().length < MIN_REASON) {
      showToast({ type: 'warning', message: `Give a reason of at least ${MIN_REASON} characters for free access.` });
      return;
    }
    if ((needsCapacityReason && capacityReason.trim().length < MIN_REASON) || (needsPrereqReason && prereqReason.trim().length < MIN_REASON)) {
      showToast({ type: 'warning', message: `Give an override reason of at least ${MIN_REASON} characters.` });
      return;
    }

    setIsSubmitting(true);
    const res = await adminService.createEnrollment(
      { id: user.id, name: user.name },
      {
        studentId: selectedStudentId,
        courseId: selectedCourseId,
        batchId: selectedBatchId || undefined,
        // The server rejects a discount code combined with free access.
        discountCode: freeAccess ? undefined : selectedDiscountCode || undefined,
        freeAccessOverride: freeAccess,
        overrideReason: freeAccess ? overrideReason.trim() : undefined,
        capacityOverrideReason: needsCapacityReason ? capacityReason.trim() : undefined,
        prerequisiteOverrideReason: needsPrereqReason ? prereqReason.trim() : undefined,
      }
    );
    setIsSubmitting(false);

    // D6 / D4: the server refused; an override is possible only with an audited reason.
    if (!res.success && res.errorCode === 'BATCH_FULL') {
      setNeedsCapacityReason(res.error || 'This batch is full.');
      return;
    }
    if (!res.success && res.errorCode === 'PREREQUISITES_NOT_MET') {
      setNeedsPrereqReason(res.error || 'A prerequisite course is not completed.');
      return;
    }

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Enrollment created',
        message: freeAccess
          ? 'Free access granted: the fee was waived and the override was recorded in the audit log.'
          : 'Enrollment created. Course access unlocks after the student pays.',
      });
      setEnrollModalOpen(false);
      resetForm();
      loadData();
    } else {
      showToast({ type: 'error', title: 'Enrollment failed', message: res.error || 'Could not create the enrollment.' });
    }
  };

  const applyStatus = async (row: AdminEnrollmentRow, status: EnrollmentStatus, reason?: string) => {
    if (!user) return;
    const res = await adminService.updateEnrollmentStatus({ id: user.id, name: user.name }, row.id, status, reason);
    if (res.success) {
      showToast({ type: 'info', title: 'Enrollment updated', message: `Status set to ${statusLabel(status)}.` });
      loadData();
    } else {
      showToast({ type: 'error', title: 'Update failed', message: res.error || 'Could not update the enrollment.' });
    }
  };

  const handleStatusSelect = (row: AdminEnrollmentRow, status: EnrollmentStatus) => {
    if (status === row.status) return;
    if (status === 'active') {
      if (!canResume(row)) {
        showToast({
          type: 'warning',
          message: 'Access is granted by a verified payment, a recorded manual payment or a free-access override.',
        });
        return;
      }
      // Resuming a suspended enrollment needs a recorded reason (BR-017).
      setActivationTarget(row);
      setActivationReason('');
      return;
    }
    applyStatus(row, status);
  };

  const confirmActivation = async () => {
    if (!activationTarget) return;
    if (activationReason.trim().length < MIN_REASON) {
      showToast({ type: 'warning', message: `Give a reason of at least ${MIN_REASON} characters.` });
      return;
    }
    const target = activationTarget;
    setActivationTarget(null);
    await applyStatus(target, 'active', activationReason.trim());
  };

  const columns: Column<AdminEnrollmentRow>[] = [
    {
      key: 'studentName',
      header: 'Student',
      sortable: true,
      render: (enr) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{enr.studentName || `Student #${enr.studentId}`}</span>
          <span className="text-[11px] text-slate-500">{enr.studentEmail || '—'}</span>
        </div>
      ),
    },
    {
      key: 'courseTitle',
      header: 'Course',
      render: (enr) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs block">{enr.courseTitle || `Course #${enr.courseId}`}</span>
          <span className="text-[10px] text-slate-500 font-mono">{enr.enrollmentNumber}</span>
        </div>
      ),
    },
    {
      key: 'batchCode',
      header: 'Batch',
      render: (enr) =>
        enr.batchCode ? (
          <Badge variant="purple" size="sm">{enr.batchCode}</Badge>
        ) : (
          <span className="text-slate-400 text-xs italic">Not assigned</span>
        ),
    },
    {
      key: 'finalAmount',
      header: 'Fee',
      sortable: true,
      render: (enr) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-900 block">{formatINR(enr.finalAmount)}</span>
          {enr.discountAmount > 0 && (
            <span className="text-[10px] text-emerald-600">-{formatINR(enr.discountAmount)} discount</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (enr) => (
        <Badge
          variant={enr.status === 'active' ? 'success' : enr.status === 'completed' ? 'purple' : 'warning'}
          size="sm"
          dot
        >
          {statusLabel(enr.status).toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'enrolledAt',
      header: 'Created',
      sortable: true,
      render: (enr) => <span className="text-xs text-slate-500">{formatDate(enr.enrolledAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Change status',
      render: (enr) => (
        <select
          aria-label={`Change status for ${enr.studentName || enr.studentId}`}
          value={enr.status}
          onChange={(e) => handleStatusSelect(enr, e.target.value as EnrollmentStatus)}
          className="text-xs px-2 py-1 border border-slate-200 rounded bg-white text-slate-700 focus:outline-none"
        >
          {!SETTABLE_STATUSES.some((s) => s.value === enr.status) && (
            <option value={enr.status}>{statusLabel(enr.status)}</option>
          )}
          {SETTABLE_STATUSES.map((s) => (
            <option
              key={s.value}
              value={s.value}
              disabled={s.value === 'active' && enr.status !== 'active' && !canResume(enr)}
            >
              {s.value === 'active' && enr.status !== 'active' && !canResume(enr) ? 'Active (via payment or free access)' : s.label}
            </option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Enrollment Management (ADM-005)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enroll approved students into courses and batches. Course access unlocks after verified payment or an audited
            free-access override.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setEnrollModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
          Enroll Student
        </Button>
      </div>

      {loadError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">{loadError}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between bg-white border border-slate-200">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Enrollments</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{enrollments.length}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="h-5 w-5" />
          </div>
        </Card>
        <Card className="p-4 flex items-center justify-between bg-white border border-slate-200">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Active</span>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">
              {enrollments.filter((e) => e.status === 'active').length}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </Card>
        <Card className="p-4 flex items-center justify-between bg-white border border-slate-200">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Awaiting Payment</span>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">
              {enrollments.filter((e) => e.status === 'approved_unpaid').length}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading enrollments…</p>
      ) : enrollments.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          <BookOpen className="h-6 w-6 mx-auto mb-2 text-slate-400" />
          No enrollments yet.
        </Card>
      ) : (
        <DataTable data={enrollments} columns={columns} searchPlaceholder="Search enrollments..." pageSize={10} />
      )}

      {enrollModalOpen && (
        <Modal
          isOpen={enrollModalOpen}
          onClose={() => setEnrollModalOpen(false)}
          title="Enroll Student into Course & Batch (ADM-005)"
          size="lg"
        >
          <form onSubmit={handleCreateEnrollment} className="space-y-4 text-xs text-slate-700">
            <div>
              <label htmlFor="enr-student" className="block font-semibold text-slate-800 mb-1">Approved student *</label>
              <select
                id="enr-student"
                required
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  clearOverridePrompts();
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="">-- Select a student --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>
              {students.length === 0 && !isLoading && (
                <p className="text-[11px] text-slate-500 mt-1">No approved students. Approve registrations first (BR-002).</p>
              )}
            </div>

            <div>
              <label htmlFor="enr-course" className="block font-semibold text-slate-800 mb-1">Course *</label>
              <select
                id="enr-course"
                required
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setSelectedBatchId('');
                  clearOverridePrompts();
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="">-- Select a course --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} — {formatINR(c.feeINR)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="enr-batch" className="block font-semibold text-slate-800 mb-1">Batch</label>
              <select
                id="enr-batch"
                value={selectedBatchId}
                onChange={(e) => {
                  setSelectedBatchId(e.target.value);
                  clearOverridePrompts();
                }}
                disabled={!selectedCourseId}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium disabled:bg-slate-50"
              >
                <option value="">-- Assign a batch later --</option>
                {applicableBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.batchCode}) — {b.enrolledCount ?? 0}
                    {b.maxCapacity ? `/${b.maxCapacity}` : ''} enrolled
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="enr-discount" className="block font-semibold text-slate-800 mb-1">
                Discount / scholarship
              </label>
              <select
                id="enr-discount"
                value={freeAccess ? '' : selectedDiscountCode}
                disabled={freeAccess}
                onChange={(e) => setSelectedDiscountCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="">-- No discount --</option>
                {discounts.map((d) => (
                  <option key={d.id} value={d.code}>
                    {d.code} — {d.discountType === 'percentage' ? `${d.value}% off` : `${formatINR(d.value)} off`}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                {freeAccess
                  ? 'Not applicable: free access waives the full fee.'
                  : 'Only discounts defined by the institute can be applied.'}
              </p>
            </div>

            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/60 space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeAccess}
                  onChange={(e) => setFreeAccess(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                />
                <span>
                  <span className="font-semibold text-amber-900 flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5" /> Grant free access now (authorized override)
                  </span>
                  <span className="text-[11px] text-amber-800 block">
                    Creates an ACTIVE enrollment with the full fee waived. Your account, the reason and the enrollment
                    details are recorded in the audit log (BR-004, BR-007, BR-017).
                  </span>
                </span>
              </label>
              {freeAccess && (
                <textarea
                  required
                  minLength={MIN_REASON}
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Reason for granting free access (e.g. scholarship reference)"
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              )}
            </div>

            {needsCapacityReason && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                <p className="text-[11px] text-rose-800 font-semibold">{needsCapacityReason}</p>
                <textarea
                  required
                  minLength={MIN_REASON}
                  rows={2}
                  value={capacityReason}
                  onChange={(e) => setCapacityReason(e.target.value)}
                  placeholder="Reason for enrolling above the batch capacity (recorded in the audit log)"
                  className="w-full px-3 py-2 border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}
            {needsPrereqReason && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                <p className="text-[11px] text-rose-800 font-semibold">{needsPrereqReason}</p>
                <textarea
                  required
                  minLength={MIN_REASON}
                  rows={2}
                  value={prereqReason}
                  onChange={(e) => setPrereqReason(e.target.value)}
                  placeholder="Reason for enrolling without the completed prerequisite (recorded in the audit log)"
                  className="w-full px-3 py-2 border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}

            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Course price:</span>
                <span className="font-semibold text-slate-900">{formatINR(coursePrice)}</span>
              </div>
              {waived > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>{freeAccess ? 'Waived (free access):' : 'Discount:'}</span>
                  <span className="font-semibold">- {formatINR(waived)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-indigo-200 flex justify-between text-sm font-bold text-indigo-950">
                <span>{freeAccess ? 'Payable:' : 'Payable in full (no installments):'}</span>
                <span>{formatINR(netPayable)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setEnrollModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Create Enrollment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <Modal
        isOpen={activationTarget !== null}
        onClose={() => setActivationTarget(null)}
        title="Resume suspended enrollment"
        size="md"
      >
        <div className="space-y-3 text-xs text-slate-700">
          <p>
            Resuming <strong>{activationTarget?.studentName || activationTarget?.studentId}</strong> in{' '}
            <strong>{activationTarget?.courseTitle || activationTarget?.courseId}</strong> restores the access their payment
            or free-access override granted. The reason is recorded in the audit log.
          </p>
          <textarea
            aria-label="Reason for resuming the enrollment"
            rows={3}
            value={activationReason}
            onChange={(e) => setActivationReason(e.target.value)}
            placeholder="e.g. Suspension lifted after the fee query was resolved"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setActivationTarget(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={confirmActivation}>
              Resume
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
