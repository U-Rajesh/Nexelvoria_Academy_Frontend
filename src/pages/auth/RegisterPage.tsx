import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { studentRegistrationSchema, type StudentRegistrationFormData } from '../../utils/validators';
import { SEED_COURSES } from '../../mocks/seedData';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';

export const RegisterPage: React.FC = () => {
  const { register: registerStudent } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCourse = searchParams.get('course') || '';

  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudentRegistrationFormData>({
    resolver: zodResolver(studentRegistrationSchema),
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      password: '',
      confirmPassword: '',
      collegeName: '',
      degreeBranch: '',
      passingYear: '2026',
      courseInterestedIn: preselectedCourse || SEED_COURSES[0].title,
      dateOfBirth: '2004-05-10',
      gender: 'male',
      fullAddress: '',
      linkedInUrl: '',
      githubUrl: '',
      guardianContact: '',
    },
  });

  const onSubmit = async (data: StudentRegistrationFormData) => {
    setFormError(null);
    const result = await registerStudent(data);

    if (result.success && result.tempStudentId) {
      showToast({
        type: 'info',
        title: 'Registration Initiated',
        message: 'Please complete dual email and mobile OTP verification.',
      });
      navigate(
        `/verify-otp?studentId=${result.tempStudentId}&email=${encodeURIComponent(data.email)}&mobile=${data.mobile}`
      );
    } else {
      setFormError(result.error || 'Failed to submit registration.');
    }
  };

  return (
    <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/90 shadow-xl space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Student Self-Registration</h2>
        <p className="text-xs text-slate-500">
          Complete the application form below. Registration requires mandatory dual OTP verification (BR-001) and Admin approval (BR-002).
        </p>
      </div>

      {formError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        {/* Full Name */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
          <input
            type="text"
            {...register('name')}
            placeholder="e.g. Rahul Sharma"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.name && <p className="text-rose-500 text-[11px] mt-0.5">{errors.name.message}</p>}
        </div>

        {/* Email & Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              {...register('email')}
              placeholder="rahul@example.com"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.email && <p className="text-rose-500 text-[11px] mt-0.5">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mobile Number (10 digits) *</label>
            <input
              type="tel"
              {...register('mobile')}
              placeholder="9876543210"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.mobile && <p className="text-rose-500 text-[11px] mt-0.5">{errors.mobile.message}</p>}
          </div>
        </div>

        {/* Password & Confirm Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Create Password *</label>
            <input
              type="password"
              {...register('password')}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.password && <p className="text-rose-500 text-[11px] mt-0.5">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Confirm Password *</label>
            <input
              type="password"
              {...register('confirmPassword')}
              placeholder="Re-enter password"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.confirmPassword && (
              <p className="text-rose-500 text-[11px] mt-0.5">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        {/* Academic Details: College & Degree */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">College / University Name *</label>
            <input
              type="text"
              {...register('collegeName')}
              placeholder="e.g. Osmania University"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.collegeName && <p className="text-rose-500 text-[11px] mt-0.5">{errors.collegeName.message}</p>}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Degree & Branch *</label>
            <input
              type="text"
              {...register('degreeBranch')}
              placeholder="e.g. B.Tech Computer Science"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.degreeBranch && <p className="text-rose-500 text-[11px] mt-0.5">{errors.degreeBranch.message}</p>}
          </div>
        </div>

        {/* Passing Year & Course Interested In */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Passing Year *</label>
            <input
              type="text"
              {...register('passingYear')}
              placeholder="e.g. 2026"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.passingYear && <p className="text-rose-500 text-[11px] mt-0.5">{errors.passingYear.message}</p>}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Course Interested In *</label>
            <select
              {...register('courseInterestedIn')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SEED_COURSES.map((c) => (
                <option key={c.id} value={c.title}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* DOB & Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Date of Birth *</label>
            <input
              type="date"
              {...register('dateOfBirth')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.dateOfBirth && <p className="text-rose-500 text-[11px] mt-0.5">{errors.dateOfBirth.message}</p>}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
            <select
              {...register('gender')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Full Address */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Full Postal Address *</label>
          <input
            type="text"
            {...register('fullAddress')}
            placeholder="Flat, Street, City, State, Pincode"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.fullAddress && <p className="text-rose-500 text-[11px] mt-0.5">{errors.fullAddress.message}</p>}
        </div>

        {/* LinkedIn & GitHub (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">LinkedIn Profile (Optional)</label>
            <input
              type="url"
              {...register('linkedInUrl')}
              placeholder="https://linkedin.com/in/..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">GitHub Profile (Optional)</label>
            <input
              type="url"
              {...register('githubUrl')}
              placeholder="https://github.com/..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full py-2.5 mt-2"
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Proceed to Dual OTP Verification
        </Button>
      </form>

      <div className="text-center text-xs text-slate-500">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
          Sign In here
        </Link>
      </div>
    </div>
  );
};

