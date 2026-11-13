import React, { useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Upload,
  FileText,
  X,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { studentRegistrationSchema, type StudentRegistrationFormData } from '../../utils/validators';
import { SEED_COURSES } from '../../mocks/seedData';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { PasswordStrengthIndicator } from '../../components/auth/PasswordStrengthIndicator';

export const RegisterPage: React.FC = () => {
  const { register: registerStudent } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCourse = searchParams.get('course') || '';

  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Resume file state
  const [resumeFile, setResumeFile] = useState<{ name: string; size: string; dataUrl?: string } | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
      termsAccepted: false,
    },
  });

  const passwordValue = watch('password');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate format
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setResumeError('Invalid file format. Please upload a PDF, DOC, or DOCX document.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setResumeError('File size exceeds 5MB limit. Please upload a smaller file.');
      return;
    }

    setResumeError(null);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setResumeFile({ name: file.name, size: sizeInMB, dataUrl });
      setValue('resumeFileName', file.name);
      setValue('resumeFileSize', sizeInMB);
      setValue('resumeDataUrl', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    setValue('resumeFileName', undefined);
    setValue('resumeFileSize', undefined);
    setValue('resumeDataUrl', undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: StudentRegistrationFormData) => {
    setFormError(null);
    const result = await registerStudent({
      ...data,
      resumeFileName: resumeFile?.name || 'Resume_Document.pdf',
      resumeFileSize: resumeFile?.size || '1.2 MB',
      resumeDataUrl: resumeFile?.dataUrl || '',
    });

    if (result.success && result.tempStudentId) {
      showToast({
        type: 'info',
        title: 'Registration Initiated',
        message: 'Please complete dual email and mobile OTP verification (SRS Rule BR-001).',
      });
      navigate(
        `/verify-otp?studentId=${result.tempStudentId}&email=${encodeURIComponent(data.email)}&mobile=${data.mobile}`
      );
    } else {
      setFormError(result.error || 'Failed to submit registration. Please verify details.');
    }
  };

  return (
    <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/90 shadow-xl space-y-8 my-4">
      {/* Header */}
      <div className="space-y-1.5 border-b border-slate-100 pb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold border border-indigo-100">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Official Candidate Enrollment</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Student Registration</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Complete the 4-part application below. Following submission, complete mandatory dual OTP verification (BR-001) for Admissions review (BR-002).
        </p>
      </div>

      {formError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 text-xs">
        {/* SECTION 1: Personal Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2">
            <div className="h-6 w-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
              1
            </div>
            <User className="h-4 w-4 text-indigo-600" />
            <span>Personal Information</span>
          </div>

          <div className="space-y-3">
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

            {/* Email & Mobile Number */}
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
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number (10 Digits) *</label>
                <input
                  type="tel"
                  {...register('mobile')}
                  placeholder="9876543210"
                  maxLength={10}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                {errors.mobile && <p className="text-rose-500 text-[11px] mt-0.5">{errors.mobile.message}</p>}
              </div>
            </div>

            {/* Password & Confirm Password with Visibility Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Create Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="Min 8 chars, mixed case, symbol"
                    className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-rose-500 text-[11px] mt-0.5">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    placeholder="Re-type password"
                    className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Toggle confirm password visibility"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-rose-500 text-[11px] mt-0.5">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Password Strength Guidance */}
            <PasswordStrengthIndicator password={passwordValue} />

            {/* Date of Birth & Gender */}
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Full Address */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Complete Postal Address *</label>
              <textarea
                rows={2}
                {...register('fullAddress')}
                placeholder="House / Flat No., Street, Area, City, State, Pincode"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.fullAddress && <p className="text-rose-500 text-[11px] mt-0.5">{errors.fullAddress.message}</p>}
            </div>
          </div>
        </div>

        {/* SECTION 2: Educational Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2">
            <div className="h-6 w-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
              2
            </div>
            <GraduationCap className="h-4 w-4 text-emerald-600" />
            <span>Educational Information</span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">College / University Name *</label>
                <input
                  type="text"
                  {...register('collegeName')}
                  placeholder="e.g. Osmania University College of Engg."
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Graduation Passing Year *</label>
                <input
                  type="text"
                  {...register('passingYear')}
                  placeholder="e.g. 2026"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                {errors.passingYear && <p className="text-rose-500 text-[11px] mt-0.5">{errors.passingYear.message}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Program Interested In *</label>
                <select
                  {...register('courseInterestedIn')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {SEED_COURSES.map((c) => (
                    <option key={c.id} value={c.title}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Professional Information & Resume Upload */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2">
            <div className="h-6 w-6 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center text-xs">
              3
            </div>
            <Briefcase className="h-4 w-4 text-sky-600" />
            <span>Professional Information & Resume</span>
          </div>

          <div className="space-y-3">
            {/* Resume Upload Box */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Upload Resume / CV (PDF, DOC, DOCX up to 5MB)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="resume-file-input"
              />

              {!resumeFile ? (
                <label
                  htmlFor="resume-file-input"
                  className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/20 cursor-pointer transition-colors text-center"
                >
                  <Upload className="h-6 w-6 text-slate-400 mb-1" />
                  <span className="font-semibold text-indigo-600">Click to upload your resume</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Supports PDF, DOC, DOCX up to 5MB</span>
                </label>
              ) : (
                <div className="flex items-center justify-between p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="h-5 w-5 text-indigo-600 shrink-0" />
                    <div className="truncate">
                      <p className="font-bold text-slate-800 text-xs truncate">{resumeFile.name}</p>
                      <p className="text-[11px] text-slate-500">{resumeFile.size}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveResume}
                    aria-label="Remove uploaded resume"
                    className="p-1 hover:bg-indigo-100 rounded text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              {resumeError && <p className="text-rose-500 text-[11px] mt-1">{resumeError}</p>}
            </div>

            {/* LinkedIn & GitHub URLs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">LinkedIn Profile URL</label>
                <input
                  type="url"
                  {...register('linkedInUrl')}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.linkedInUrl && <p className="text-rose-500 text-[11px] mt-0.5">{errors.linkedInUrl.message}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">GitHub Portfolio URL</label>
                <input
                  type="url"
                  {...register('githubUrl')}
                  placeholder="https://github.com/username"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.githubUrl && <p className="text-rose-500 text-[11px] mt-0.5">{errors.githubUrl.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Parent / Guardian Information & Consent */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2">
            <div className="h-6 w-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center text-xs">
              4
            </div>
            <Phone className="h-4 w-4 text-amber-600" />
            <span>Parent / Guardian Information & Policy Consent</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Parent / Guardian Contact Number *
              </label>
              <input
                type="tel"
                {...register('guardianContact')}
                placeholder="10-digit mobile number"
                maxLength={10}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              {errors.guardianContact && (
                <p className="text-rose-500 text-[11px] mt-0.5">{errors.guardianContact.message}</p>
              )}
            </div>

            {/* Terms and Conditions Acceptance */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  {...register('termsAccepted')}
                  className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                />
                <span className="text-[11px] leading-relaxed">
                  I agree to the{' '}
                  <Link to="/terms-and-conditions" target="_blank" className="font-semibold text-indigo-600 hover:underline">
                    Terms of Service
                  </Link>
                  ,{' '}
                  <Link to="/privacy-policy" target="_blank" className="font-semibold text-indigo-600 hover:underline">
                    Privacy Policy
                  </Link>
                  , and mandatory <strong>75% Live Attendance Policy (BR-010)</strong> required for course completion and placement services.
                </span>
              </label>
              {errors.termsAccepted && (
                <p className="text-rose-500 text-[11px] mt-1 ml-6">{errors.termsAccepted.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full py-2.5"
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Submit Application & Proceed to Dual OTP
        </Button>
      </form>

      {/* Link to Login */}
      <div className="text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
        Already registered as a student?{' '}
        <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
          Sign In to Student Portal
        </Link>
      </div>
    </div>
  );
};
