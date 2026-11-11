import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserPlus,
  ArrowLeft,
  School,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import type { Course, Batch } from '../../types';

const addStudentSchema = z.object({
  name: z.string().min(3, 'Full name must be at least 3 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number.'),
  dateOfBirth: z.string().min(1, 'Date of birth is required.'),
  gender: z.enum(['male', 'female', 'other']),
  collegeName: z.string().min(3, 'College/University name is required.'),
  degreeBranch: z.string().min(2, 'Degree and branch is required.'),
  passingYear: z.string().min(4, 'Graduation year is required.'),
  fullAddress: z.string().min(5, 'Full postal address is required.'),
  guardianContact: z.string().optional(),
  courseInterestedIn: z.string().min(1, 'Please select target program.'),
  directEnrollBatchId: z.string().optional(),
  adminApprovalStatus: z.enum(['approved', 'pending']),
  status: z.enum(['active', 'pending']),
});

type AddStudentFormData = z.infer<typeof addStudentSchema>;

export const AdminAddStudentPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => {
    adminService.getCourses().then((res) => {
      if (res.success) setCourses(res.data);
    });
    adminService.getBatches().then((res) => {
      if (res.success) setBatches(res.data);
    });
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddStudentFormData>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: {
      gender: 'male',
      adminApprovalStatus: 'approved',
      status: 'active',
      passingYear: '2026',
    },
  });

  const selectedCourseTitle = watch('courseInterestedIn');
  const selectedCourseObj = courses.find((c) => c.title === selectedCourseTitle);
  const applicableBatches = selectedCourseObj
    ? batches.filter((b) => b.courseId === selectedCourseObj.id)
    : batches;

  const onSubmit = async (data: AddStudentFormData) => {
    if (!user) return;

    const res = await adminService.addStudent(
      { id: user.id, name: user.name },
      {
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        collegeName: data.collegeName,
        degreeBranch: data.degreeBranch,
        passingYear: data.passingYear,
        fullAddress: data.fullAddress,
        guardianContact: data.guardianContact,
        courseInterestedIn: data.courseInterestedIn,
        adminApprovalStatus: data.adminApprovalStatus,
        status: data.status,
        directEnrollCourseId: selectedCourseObj?.id,
        directEnrollBatchId: data.directEnrollBatchId || undefined,
      }
    );

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Student Registered Successfully',
        message: `${data.name} has been enrolled in the institute directory. (ADM-003)`,
      });
      navigate('/admin/students');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link
            to="/admin/students"
            className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Student Directory
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add New Student (ADM-003)</h1>
          <p className="text-xs text-slate-500">
            Directly register and onboard candidates into Nexelvoria Academy database with verified academic records.
          </p>
        </div>
      </div>

      <Card className="p-6 sm:p-8 shadow-xl bg-white border border-slate-200">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-xs">
          {/* Section 1: Personal Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-600" /> Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Vikramaditya Reddy"
                  {...register('name')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                {errors.name && <p className="text-rose-500 text-[11px] mt-0.5">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="candidate@example.com"
                  {...register('email')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                {errors.email && <p className="text-rose-500 text-[11px] mt-0.5">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Contact *</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  {...register('mobile')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                {errors.mobile && <p className="text-rose-500 text-[11px] mt-0.5">{errors.mobile.message}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  {...register('dateOfBirth')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                {errors.dateOfBirth && <p className="text-rose-500 text-[11px] mt-0.5">{errors.dateOfBirth.message}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                <select
                  {...register('gender')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Guardian Contact Phone</label>
                <input
                  type="tel"
                  placeholder="Parent / Guardian phone number"
                  {...register('guardianContact')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Permanent Postal Address *</label>
                <textarea
                  rows={2}
                  placeholder="House/Flat No, Street, City, State, PIN Code"
                  {...register('fullAddress')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                {errors.fullAddress && <p className="text-rose-500 text-[11px] mt-0.5">{errors.fullAddress.message}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Academic Background */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <School className="h-4 w-4 text-indigo-600" /> Academic Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block font-semibold text-slate-700 mb-1">College / Institute Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Osmania University"
                  {...register('collegeName')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                {errors.collegeName && <p className="text-rose-500 text-[11px] mt-0.5">{errors.collegeName.message}</p>}
              </div>

              <div className="sm:col-span-1">
                <label className="block font-semibold text-slate-700 mb-1">Degree & Branch *</label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech Computer Science"
                  {...register('degreeBranch')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                {errors.degreeBranch && <p className="text-rose-500 text-[11px] mt-0.5">{errors.degreeBranch.message}</p>}
              </div>

              <div className="sm:col-span-1">
                <label className="block font-semibold text-slate-700 mb-1">Passing Out Year *</label>
                <input
                  type="text"
                  placeholder="e.g. 2026"
                  {...register('passingYear')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                {errors.passingYear && <p className="text-rose-500 text-[11px] mt-0.5">{errors.passingYear.message}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Course Program & Direct Enrollment */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-600" /> Program Track & Batch Allocation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Training Program *</label>
                <select
                  {...register('courseInterestedIn')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="">-- Choose Program --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.title}>
                      {c.title} (₹{c.discountedFeeINR || c.feeINR})
                    </option>
                  ))}
                </select>
                {errors.courseInterestedIn && (
                  <p className="text-rose-500 text-[11px] mt-0.5">{errors.courseInterestedIn.message}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign to Cohort Batch (Optional)</label>
                <select
                  {...register('directEnrollBatchId')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="">-- Assign Later / Unallocated --</option>
                  {applicableBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.batchCode}) - {b.scheduleTiming}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Approval Gate Status (BR-002) *</label>
                <select
                  {...register('adminApprovalStatus')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="approved">Approved (Allow immediate fee payment)</option>
                  <option value="pending">Pending Document Verification</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account State *</label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <Link to="/admin/students">
              <Button variant="outline" size="md">
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Confirm & Onboard Student
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

