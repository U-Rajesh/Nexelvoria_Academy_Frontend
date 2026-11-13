import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  CreditCard,
  ShieldAlert,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { Modal } from '../feedback/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import type { Course, Batch, StudentProfile } from '../../types';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatINR, formatDate } from '../../utils/formatters';

interface CourseEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
}

export const CourseEnrollmentModal: React.FC<CourseEnrollmentModalProps> = ({
  isOpen,
  onClose,
  course,
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const student = user as (StudentProfile | null);
  const isApproved = student?.adminApprovalStatus === 'approved';
  const isEnrolled = student?.enrolledCourseIds?.includes(course.id);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    studentService.getBatchesForCourse(course.id).then((res) => {
      if (res.success) {
        setBatches(res.data);
        if (res.data.length > 0) {
          setSelectedBatchId(res.data[0].id);
        }
      }
      setIsLoading(false);
    });
  }, [isOpen, course.id]);

  const handleConfirmEnrollment = async () => {
    if (!isAuthenticated || !user) {
      onClose();
      navigate(`/register?course=${encodeURIComponent(course.title)}`);
      return;
    }

    if (!isApproved) {
      showToast({
        type: 'warning',
        title: 'Account Verification Pending',
        message: 'Your registration is currently awaiting administrator approval (Rule BR-002). You will be notified once eligible for course payment.',
      });
      return;
    }

    setIsSubmitting(true);
    const res = await studentService.requestSelfEnrollment(user.id, course.id, selectedBatchId);
    setIsSubmitting(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Enrollment Initiated',
        message: res.message || 'Course enrollment registered. Please complete tuition payment.',
      });
      onClose();
      // Redirect to fees & payment page
      navigate('/student/fees');
    } else {
      showToast({
        type: 'error',
        title: 'Enrollment Error',
        message: res.error || 'Failed to process enrollment.',
      });
    }
  };

  const finalFee = course.discountedFeeINR || course.feeINR;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Course Admission: ${course.title}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Course Summary Banner */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                {course.courseCode || 'CRS-PROG'}
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{course.title}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Tuition Fee</span>
              <div className="flex items-baseline gap-1.5 justify-end">
                <span className="text-xl font-extrabold text-slate-900">{formatINR(finalFee)}</span>
                {course.discountedFeeINR && (
                  <span className="text-xs text-slate-400 line-through">{formatINR(course.feeINR)}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 border-t border-slate-200/60">
            <span><strong>Duration:</strong> {course.durationWeeks} Weeks</span>
            <span>•</span>
            <span><strong>Hours:</strong> {course.totalHours} Hrs</span>
            <span>•</span>
            <span><strong>Level:</strong> {course.level}</span>
          </div>
        </div>

        {/* BR-005 Lump-Sum Fee Policy Notice */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
          <div className="leading-relaxed">
            <strong>SRS Rule BR-005 – One-Time Payment:</strong> Installment plans are not supported. Full course tuition is processed as a single lump-sum transaction prior to LMS content activation.
          </div>
        </div>

        {/* Batch Selection Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Select Your Preferred Cohort / Batch *
            </label>
            <span className="text-[11px] text-slate-400">
              {batches.length} Available {batches.length === 1 ? 'Cohort' : 'Cohorts'}
            </span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading available cohorts...</div>
          ) : batches.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
              <p className="text-xs font-semibold text-slate-700">No Upcoming Batches Scheduled Currently</p>
              <p className="text-[11px] text-slate-400">
                Please contact our admissions office or submit an enquiry to receive batch notifications.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {batches.map((batch) => {
                const isSelected = selectedBatchId === batch.id;
                const capacity = batch.maxCapacity || 40;
                const filled = batch.enrolledStudentIds?.length || 0;
                return (
                  <div
                    key={batch.id}
                    onClick={() => setSelectedBatchId(batch.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-400 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="batchSelect"
                            checked={isSelected}
                            onChange={() => setSelectedBatchId(batch.id)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-xs font-bold text-slate-900">{batch.name}</span>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {batch.batchCode}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pl-5">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" /> {batch.scheduleTiming}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-400" /> Starts {formatDate(batch.startDate)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <Badge variant={batch.status === 'ongoing' ? 'success' : 'purple'} size="sm">
                          {batch.status.toUpperCase()}
                        </Badge>
                        <span className="block text-[10px] text-slate-400 mt-1">
                          {filled}/{capacity} Seats
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* User Authentication Status Callout */}
        {!isAuthenticated ? (
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
            <span className="text-indigo-900">
              New to Nexelvoria? You will be routed to create your student registration.
            </span>
            <Link to={`/login?redirect=/courses/${course.slug}`}>
              <span className="font-bold text-indigo-700 hover:underline">Already registered? Log in</span>
            </Link>
          </div>
        ) : !isApproved ? (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
            <Lock className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
            <div>
              <strong>Admission Status: Awaiting Admin Approval (BR-002)</strong>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Your profile registration is currently under review by the academy. Once an administrator approves your profile, course fee payment will be activated.
              </p>
            </div>
          </div>
        ) : isEnrolled ? (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>You are already enrolled in this curriculum program. Visit your student dashboard to learn.</span>
          </div>
        ) : null}

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          {isEnrolled ? (
            <Link to="/student/courses">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Go to My Courses
              </Button>
            </Link>
          ) : (
            <Button
              variant="primary"
              size="sm"
              disabled={batches.length === 0}
              isLoading={isSubmitting}
              onClick={handleConfirmEnrollment}
              rightIcon={<CreditCard className="h-4 w-4" />}
            >
              {!isAuthenticated
                ? 'Proceed to Registration'
                : !isApproved
                ? 'Awaiting Approval'
                : 'Confirm & Proceed to Payment'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
