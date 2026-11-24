import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, BookOpen, CheckCircle2, Info, Mail, Phone, School, User } from 'lucide-react';
import {
  adminService,
  type AdminCreatedStudentResult,
  type VerificationChannelStatus,
} from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { OneTimePasswordModal } from '../../components/feedback/OneTimePasswordModal';
import { formatDateTime } from '../../utils/formatters';
import type { Course } from '../../types';

/**
 * Mirrors POST /admin/students validation. Approval and account status are
 * deliberately NOT on this form: an admin-created student always starts
 * PENDING_VERIFICATION and is approved later, after verifying email and
 * mobile (BR-001, BR-002).
 */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const addStudentSchema = z.object({
  name: z.string().trim().min(3, 'Full name must be at least 3 characters.').max(150),
  email: z.string().trim().email('Please enter a valid email address.').max(254),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number.'),
  dateOfBirth: optionalText(10),
  gender: z.enum(['', 'male', 'female', 'other']).optional(),
  collegeName: optionalText(200),
  degree: optionalText(100),
  branch: optionalText(100),
  passingYear: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (/^\d{4}$/.test(v) && Number(v) >= 1990 && Number(v) <= 2040), 'Enter a year between 1990 and 2040.'),
  interestedCourseId: optionalText(40),
  city: optionalText(100),
  state: optionalText(100),
});

type AddStudentFormInput = z.input<typeof addStudentSchema>;
type AddStudentFormData = z.output<typeof addStudentSchema>;

const REASON_TEXT: Record<string, string> = {
  cooldown_active: 'a code was sent moments ago',
  send_limit_reached: 'the send limit for this account was reached',
  delivery_failed: 'the email could not be delivered',
  verification_unavailable: 'the verification service is unavailable',
  unknown_account: 'the account could not be found by the verification service',
  already_verified: 'the email is already verified',
};

const ChannelStatus: React.FC<{ label: string; icon: React.ReactNode; channel: VerificationChannelStatus }> = ({
  label,
  icon,
  channel,
}) => (
  <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
    <div className="flex items-center gap-2 font-semibold text-slate-800">
      {icon} {label}
    </div>
    {channel.status === 'sent' ? (
      <p className="text-emerald-700">
        Code sent to <span className="font-mono">{channel.sentTo}</span>. It expires at {formatDateTime(channel.expiresAt)};
        the student can request a new code from the verification screen.
      </p>
    ) : channel.status === 'not_sent' ? (
      <p className="text-amber-700">
        No code was sent: {REASON_TEXT[channel.reason] ?? channel.reason}. The student can request one from the
        verification screen after signing in.
      </p>
    ) : channel.status === 'deferred' ? (
      <p className="text-slate-600">{channel.reason}</p>
    ) : (
      <p className="text-rose-700">{channel.reason}</p>
    )}
  </div>
);

export const AdminAddStudentPage: React.FC = () => {
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [created, setCreated] = useState<AdminCreatedStudentResult | null>(null);
  const [oneTimePassword, setOneTimePassword] = useState<string | null>(null);

  useEffect(() => {
    adminService.getCourses().then((res) => {
      if (res.success) setCourses(res.data);
    });
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddStudentFormInput, unknown, AddStudentFormData>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: { gender: '' },
  });

  const onSubmit = async (data: AddStudentFormData) => {
    const res = await adminService.createStudent({
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      ...(data.collegeName ? { collegeName: data.collegeName } : {}),
      ...(data.degree ? { degree: data.degree } : {}),
      ...(data.branch ? { branch: data.branch } : {}),
      ...(data.passingYear ? { passingYear: Number(data.passingYear) } : {}),
      ...(data.interestedCourseId ? { interestedCourseId: data.interestedCourseId } : {}),
      ...(data.dateOfBirth ? { dateOfBirth: data.dateOfBirth } : {}),
      ...(data.gender ? { gender: data.gender } : {}),
      ...(data.city ? { city: data.city } : {}),
      ...(data.state ? { state: data.state } : {}),
    });

    if (!res.success || !res.data) {
      showToast({ type: 'error', title: 'Student not created', message: res.error || 'Please retry.' });
      return;
    }

    // The password lives only in component state for the modal, never in storage.
    const { temporaryPassword, ...account } = res.data;
    setCreated({ ...account, temporaryPassword: '' });
    setOneTimePassword(temporaryPassword);
    reset();
  };

  const inputClass =
    'w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium';
  const fieldError = (msg?: string) => (msg ? <p className="text-rose-500 text-[11px] mt-0.5">{msg}</p> : null);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-1">
        <Link to="/admin/students" className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Student Directory
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add New Student (ADM-003)</h1>
        <p className="text-xs text-slate-500">
          Creates the student account on the server. The account starts as <strong>pending verification</strong>: the
          student must verify their email, and an admin approves them afterwards (mobile verification is deferred at
          launch; the number is stored unverified). Only approved
          students can enroll.
        </p>
      </div>

      {created && (
        <Card className="p-6 bg-emerald-50/40 border border-emerald-200 space-y-4 text-xs">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900 text-sm">
                {created.name} was created and is pending verification.
              </p>
              <p className="text-slate-600">
                Student ID <span className="font-mono">{created.id}</span> • {created.email} • +91 {created.mobile}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ChannelStatus label="Email verification" icon={<Mail className="h-4 w-4 text-indigo-600" />} channel={created.verification.email} />
            <ChannelStatus label="Mobile verification" icon={<Phone className="h-4 w-4 text-indigo-600" />} channel={created.verification.mobile} />
          </div>

          <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-700 flex gap-2">
            <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
            <p>
              Next steps for the student: sign in with their email or mobile and the temporary password, then enter the
              email code on the verification screen. Approval stays blocked until the email is verified.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={() => navigate('/admin/students')}>
              Go to Student Directory
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCreated(null)}>
              Add another student
            </Button>
          </div>
        </Card>
      )}

      {!created && (
        <Card className="p-6 sm:p-8 shadow-xl bg-white border border-slate-200">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-xs" noValidate>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-600" /> Identity
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="st-name" className="block font-semibold text-slate-700 mb-1">Full legal name *</label>
                  <input id="st-name" type="text" autoComplete="off" {...register('name')} className={inputClass} />
                  {fieldError(errors.name?.message)}
                </div>
                <div>
                  <label htmlFor="st-email" className="block font-semibold text-slate-700 mb-1">Email address *</label>
                  <input id="st-email" type="email" autoComplete="off" {...register('email')} className={inputClass} />
                  {fieldError(errors.email?.message)}
                </div>
                <div>
                  <label htmlFor="st-mobile" className="block font-semibold text-slate-700 mb-1">Mobile number *</label>
                  <input id="st-mobile" type="tel" inputMode="numeric" placeholder="10 digits" {...register('mobile')} className={inputClass} />
                  {fieldError(errors.mobile?.message)}
                </div>
                <div>
                  <label htmlFor="st-dob" className="block font-semibold text-slate-700 mb-1">Date of birth</label>
                  <input id="st-dob" type="date" {...register('dateOfBirth')} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="st-gender" className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select id="st-gender" {...register('gender')} className={inputClass}>
                    <option value="">Not specified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="st-city" className="block font-semibold text-slate-700 mb-1">City</label>
                  <input id="st-city" type="text" {...register('city')} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="st-state" className="block font-semibold text-slate-700 mb-1">State</label>
                  <input id="st-state" type="text" {...register('state')} className={inputClass} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                <School className="h-4 w-4 text-indigo-600" /> Academic background
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="st-college" className="block font-semibold text-slate-700 mb-1">College / university</label>
                  <input id="st-college" type="text" {...register('collegeName')} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="st-degree" className="block font-semibold text-slate-700 mb-1">Degree</label>
                  <input id="st-degree" type="text" placeholder="e.g. B.Tech" {...register('degree')} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="st-branch" className="block font-semibold text-slate-700 mb-1">Branch</label>
                  <input id="st-branch" type="text" placeholder="e.g. Computer Science" {...register('branch')} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="st-year" className="block font-semibold text-slate-700 mb-1">Passing year</label>
                  <input id="st-year" type="text" inputMode="numeric" placeholder="e.g. 2026" {...register('passingYear')} className={inputClass} />
                  {fieldError(errors.passingYear?.message)}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-600" /> Interest
              </h3>
              <div>
                <label htmlFor="st-course" className="block font-semibold text-slate-700 mb-1">Interested course</label>
                <select id="st-course" {...register('interestedCourseId')} className={inputClass}>
                  <option value="">Not specified</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Recorded as interest only. Enrollment is done from Enrollment Management once the student is approved.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Link to="/admin/students">
                <Button variant="outline" size="md" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" variant="primary" size="md" isLoading={isSubmitting} leftIcon={<CheckCircle2 className="h-4 w-4" />}>
                Create student account
              </Button>
            </div>
          </form>
        </Card>
      )}

      <OneTimePasswordModal
        password={oneTimePassword}
        accountName={created?.name ?? ''}
        accountEmail={created?.email}
        title="Student account created"
        onClose={() => setOneTimePassword(null)}
      />
    </div>
  );
};
