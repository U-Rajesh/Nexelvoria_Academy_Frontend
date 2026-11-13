import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Layers,
  Search,
  Plus,
  BookOpen,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Filter,
  DollarSign,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate, formatINR } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { Modal } from '../../components/feedback/Modal';
import { Card } from '../../components/common/Card';
import type { Enrollment, StudentProfile, Course, Batch, CouponDiscount } from '../../types';

export const AdminEnrollmentPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [searchParams] = useSearchParams();
  const batchIdParam = searchParams.get('batchId');

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [discounts, setDiscounts] = useState<CouponDiscount[]>([]);

  // New Enrollment Modal State
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedDiscountId, setSelectedDiscountId] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<'full' | 'installments'>('full');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    const [eRes, sRes, cRes, bRes, dRes] = await Promise.all([
      adminService.getEnrollments(),
      adminService.getStudents(),
      adminService.getCourses(),
      adminService.getBatches(),
      adminService.getDiscounts(),
    ]);

    if (eRes.success) setEnrollments(eRes.data);
    if (sRes.success) {
      setStudents(sRes.data);
      if (sRes.data.length > 0) setSelectedStudentId(sRes.data[0].id);
    }
    if (cRes.success) {
      setCourses(cRes.data);
      if (cRes.data.length > 0) setSelectedCourseId(cRes.data[0].id);
    }
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
    if (dRes.success) setDiscounts(dRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live price in modal
  const selectedCourseObj = courses.find((c) => c.id === selectedCourseId);
  const baseFee = selectedCourseObj ? selectedCourseObj.discountedFeeINR || selectedCourseObj.feeINR : 0;
  const selectedDiscountObj = discounts.find((d) => d.id === selectedDiscountId);
  let discountDeduction = 0;
  if (selectedDiscountObj) {
    if (selectedDiscountObj.discountType === 'fixed_amount') {
      discountDeduction = selectedDiscountObj.value;
    } else {
      discountDeduction = Math.round((baseFee * selectedDiscountObj.value) / 100);
    }
  }
  const netPayable = Math.max(0, baseFee - discountDeduction);

  const applicableBatches = batches.filter((b) => !selectedCourseId || b.courseId === selectedCourseId);

  const handleCreateEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedStudentId || !selectedCourseId) return;

    setIsSubmitting(true);
    const res = await adminService.createEnrollment(
      { id: user.id, name: user.name },
      {
        studentId: selectedStudentId,
        courseId: selectedCourseId,
        batchId: selectedBatchId || undefined,
        discountAmountINR: discountDeduction,
        paymentStatus: 'active',
      }
    );
    setIsSubmitting(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Enrollment Confirmed',
        message: 'Student enrolled and assigned to cohort. LMS curriculum unlocked. (ADM-005)',
      });
      setEnrollModalOpen(false);
      loadData();
    }
  };

  const handleStatusChange = async (enrollmentId: string, status: any) => {
    if (!user) return;
    const res = await adminService.updateEnrollmentStatus(
      { id: user.id, name: user.name },
      enrollmentId,
      status
    );
    if (res.success) {
      showToast({
        type: 'info',
        title: 'Enrollment Updated',
        message: `Enrollment status marked as ${status.toUpperCase()}.`,
      });
      loadData();
    }
  };

  const columns: Column<Enrollment>[] = [
    {
      key: 'studentId',
      header: 'Student',
      sortable: true,
      render: (enr) => {
        const stu = students.find((s) => s.id === enr.studentId);
        return (
          <div>
            <span className="font-bold text-slate-900 block text-xs">{stu?.name || enr.studentId}</span>
            <span className="text-[11px] text-slate-500">{stu?.email || 'Student ID: ' + enr.studentId}</span>
          </div>
        );
      },
    },
    {
      key: 'courseId',
      header: 'Enrolled Program',
      render: (enr) => {
        const crs = courses.find((c) => c.id === enr.courseId);
        return <span className="font-semibold text-slate-800 text-xs">{crs?.title || enr.courseId}</span>;
      },
    },
    {
      key: 'batchId',
      header: 'Assigned Cohort Batch',
      render: (enr) => {
        const bth = batches.find((b) => b.id === enr.batchId);
        return bth ? (
          <div>
            <Badge variant="purple" size="sm">{bth.batchCode}</Badge>
            <span className="text-[10px] text-slate-500 block mt-0.5">{bth.scheduleTiming}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-xs italic">Unallocated Cohort</span>
        );
      },
    },
    {
      key: 'progressPercentage',
      header: 'LMS Progress',
      sortable: true,
      render: (enr) => (
        <div className="w-24">
          <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-0.5">
            <span>{enr.progressPercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full"
              style={{ width: `${enr.progressPercentage}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (enr) => (
        <Badge
          variant={
            enr.status === 'active'
              ? 'success'
              : enr.status === 'completed'
              ? 'purple'
              : 'warning'
          }
          size="sm"
          dot
        >
          {enr.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'enrolledAt',
      header: 'Enrollment Date',
      sortable: true,
      render: (enr) => <span className="text-xs text-slate-500">{formatDate(enr.enrolledAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (enr) => (
        <select
          value={enr.status}
          onChange={(e) => handleStatusChange(enr.id, e.target.value)}
          className="text-xs px-2 py-1 border border-slate-200 rounded bg-white text-slate-700 focus:outline-none"
        >
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Enrollment Management (ADM-005)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enroll verified candidates into training courses, allocate cohorts, compute tuition fees & scholarships, and track learning lifecycle.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setEnrollModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Enroll Student
        </Button>
      </div>

      {/* Overview Cards */}
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
            <span className="text-xs font-semibold text-slate-500 uppercase">Active Learners</span>
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
            <span className="text-xs font-semibold text-slate-500 uppercase">Completed Candidates</span>
            <p className="text-2xl font-extrabold text-purple-600 mt-1">
              {enrollments.filter((e) => e.status === 'completed').length}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <BookOpen className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Main Table */}
      <DataTable
        data={enrollments}
        columns={columns}
        searchPlaceholder="Search enrolled students, programs or batches..."
        pageSize={10}
      />

      {/* New Enrollment Modal */}
      {enrollModalOpen && (
        <Modal
          isOpen={enrollModalOpen}
          onClose={() => setEnrollModalOpen(false)}
          title="Enroll Student into Course & Batch (ADM-005)"
          size="lg"
        >
          <form onSubmit={handleCreateEnrollment} className="space-y-4 text-xs text-slate-700">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Select Candidate / Student *</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email}) - Gate: {s.adminApprovalStatus.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Select Training Course *</label>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setSelectedBatchId('');
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} — Standard Fee: {formatINR(c.discountedFeeINR || c.feeINR)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Assign Cohort Batch</label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="">-- Direct Enrollment (Batch Assigned Later) --</option>
                {applicableBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.batchCode}) • {b.scheduleTiming} (Cap: {b.enrolledStudentIds.length}/{b.maxCapacity})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Scholarship / Coupon Code</label>
                <select
                  value={selectedDiscountId}
                  onChange={(e) => setSelectedDiscountId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="">-- No Discount Applied --</option>
                  {discounts.filter((d) => d.isActive).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} — {d.discountType === 'percentage' ? `${d.value}% Off` : `₹${d.value} Flat Off`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Payment Arrangement</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="full">Full Upfront Payment</option>
                  <option value="installments">2-Part Installment Plan</option>
                </select>
              </div>
            </div>

            {/* Financial Breakdown Box */}
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Base Tuition Fee:</span>
                <span className="font-semibold text-slate-900">{formatINR(baseFee)}</span>
              </div>
              {discountDeduction > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Scholarship / Coupon Deduction:</span>
                  <span className="font-semibold">- {formatINR(discountDeduction)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-indigo-200 flex justify-between text-sm font-bold text-indigo-950">
                <span>Net Payable:</span>
                <span>{formatINR(netPayable)}</span>
              </div>
              {paymentTerms === 'installments' && (
                <p className="text-[11px] text-indigo-700 italic mt-1">
                  Installment 1 due at admission: {formatINR(Math.round(netPayable / 2))}; Installment 2 due in 30 days.
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setEnrollModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Confirm & Enroll Student
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
