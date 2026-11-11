import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  School,
  MapPin,
  Save,
  RotateCcw,
  Lock,
  ShieldCheck,
  Calendar,
  GraduationCap,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import { Linkedin, Github } from '../../components/common/SocialIcons';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { getStorageItem, setStorageItem } from '../../utils/storage';

interface StudentProfileFormData {
  mobile: string;
  guardianPhone: string;
  fullAddress: string;
  linkedInUrl: string;
  githubUrl: string;
}

export const StudentProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const storageKey = `nex_student_profile_${user?.id || 'default'}`;

  const defaultProfileData: StudentProfileFormData = {
    mobile: user?.mobile || '9876543210',
    guardianPhone: '9848022338',
    fullAddress: 'Plot 42, Cyber Gateway Enclave, Madhapur, Hitec City, Hyderabad - 500081',
    linkedInUrl: 'https://linkedin.com/in/rohansharma-dev',
    githubUrl: 'https://github.com/rohansharma-dev',
  };

  const [formData, setFormData] = useState<StudentProfileFormData>(() =>
    getStorageItem<StudentProfileFormData>(storageKey, defaultProfileData)
  );

  const [initialData, setInitialData] = useState<StudentProfileFormData>(formData);
  const [errors, setErrors] = useState<Partial<Record<keyof StudentProfileFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Read-only system and academic registration details
  const academicDetails = {
    studentId: (user as any)?.studentId || 'NEX-2025-0842',
    legalName: user?.name || 'Rohan Sharma',
    email: user?.email || 'rohan.sharma@gmail.com',
    dob: '15 August 2002',
    college: (user as any)?.college || 'Osmania University College of Engineering',
    degree: (user as any)?.degree || 'B.Tech in Computer Science & Engineering',
    passingYear: (user as any)?.passingYear || '2025',
    cohort: 'Oct 2026 Morning Full Stack Cohort',
    admissionStatus: 'Approved & Enrolled',
    enrolledSince: 'October 2026',
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof StudentProfileFormData, string>> = {};

    // Validate phone number
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required.';
    } else if (!/^\d{10}$/.test(formData.mobile.trim().replace(/\D/g, ''))) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number.';
    }

    // Validate address
    if (!formData.fullAddress.trim() || formData.fullAddress.trim().length < 10) {
      newErrors.fullAddress = 'Please provide a complete postal address (at least 10 characters).';
    }

    // Validate LinkedIn URL
    if (formData.linkedInUrl && !formData.linkedInUrl.startsWith('https://')) {
      newErrors.linkedInUrl = 'LinkedIn URL must start with https://';
    }

    // Validate GitHub URL
    if (formData.githubUrl && !formData.githubUrl.startsWith('https://')) {
      newErrors.githubUrl = 'GitHub URL must start with https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please resolve errors in the highlighted fields before saving.',
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setStorageItem(storageKey, formData);
      setInitialData(formData);
      setIsSubmitting(false);
      showToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your permitted contact details and portfolio links have been updated successfully (STD-006).',
      });
    }, 300);
  };

  const handleReset = () => {
    setFormData(initialData);
    setErrors({});
    showToast({
      type: 'info',
      title: 'Changes Reset',
      message: 'Form reverted to previously saved details.',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your official academic enrollment records and manage permitted contact information (SRS STD-006).
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={
                  user?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                }
                alt={user?.name || 'Student'}
                className="h-20 w-20 rounded-2xl object-cover border-2 border-indigo-200 shadow-xs"
              />
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[10px]">
                ✓
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{academicDetails.legalName}</h2>
                <Badge variant="purple" size="sm" dot>
                  {academicDetails.studentId}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono">{academicDetails.email}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="success" size="sm" dot>
                  Dual OTP Verified (BR-001)
                </Badge>
                <Badge variant="neutral" size="sm">
                  {academicDetails.cohort}
                </Badge>
              </div>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Enrollment Status</span>
            <Badge variant="success" size="md">
              Active & Attending
            </Badge>
            <span className="text-[10px] text-slate-500 block font-mono">Enrolled: {academicDetails.enrolledSince}</span>
          </div>
        </div>

        {/* Read-Only Academic & Identity Data Notice (BR-002, STD-006) */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Lock className="h-4 w-4 text-slate-400" />
            <span>Official Academic Registration (Read-Only)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Student ID</span>
              <span className="font-mono font-bold text-slate-900">{academicDetails.studentId}</span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Full Legal Name</span>
              <span className="font-bold text-slate-900">{academicDetails.legalName}</span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Registered Email</span>
              <span className="font-mono text-slate-700">{academicDetails.email}</span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Date of Birth</span>
              <span className="text-slate-800">{academicDetails.dob}</span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">College / University</span>
              <span className="text-slate-800">{academicDetails.college}</span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Degree & Branch</span>
              <span className="text-slate-800">
                {academicDetails.degree} ({academicDetails.passingYear})
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">
            * Per SRS Rule STD-006, legal name, email, and academic qualifications can only be modified by the Admissions Administration upon submitting documentary proof.
          </p>
        </div>
      </Card>

      {/* Editable Permitted Fields (STD-006) */}
      <Card className="p-6 space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Permitted Profile Updates (STD-006)</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            You may update your contact number, emergency phone, residential address, and portfolio URLs.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Student Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="10-digit mobile number"
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.mobile ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20' : 'border-slate-300 focus:ring-indigo-500'
                  }`}
                />
              </div>
              {errors.mobile && <span className="text-[10px] text-rose-600 mt-1 block">{errors.mobile}</span>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emergency / Guardian Contact</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.guardianPhone}
                  onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                  placeholder="Guardian contact number"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Residential Postal Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <textarea
                rows={2}
                value={formData.fullAddress}
                onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                placeholder="House / Flat No, Street, City, State, PIN"
                className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.fullAddress ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20' : 'border-slate-300 focus:ring-indigo-500'
                }`}
              />
            </div>
            {errors.fullAddress && <span className="text-[10px] text-rose-600 mt-1 block">{errors.fullAddress}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">LinkedIn Profile</label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 text-slate-400">
                  <Linkedin className="h-4 w-4" />
                </div>
                <input
                  type="url"
                  value={formData.linkedInUrl}
                  onChange={(e) => setFormData({ ...formData, linkedInUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg font-mono focus:outline-none focus:ring-2 ${
                    errors.linkedInUrl ? 'border-rose-300 focus:ring-rose-400' : 'border-slate-300 focus:ring-indigo-500'
                  }`}
                />
              </div>
              {errors.linkedInUrl && <span className="text-[10px] text-rose-600 mt-1 block">{errors.linkedInUrl}</span>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">GitHub Portfolio</label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 text-slate-400">
                  <Github className="h-4 w-4" />
                </div>
                <input
                  type="url"
                  value={formData.githubUrl}
                  onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                  placeholder="https://github.com/username"
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg font-mono focus:outline-none focus:ring-2 ${
                    errors.githubUrl ? 'border-rose-300 focus:ring-rose-400' : 'border-slate-300 focus:ring-indigo-500'
                  }`}
                />
              </div>
              {errors.githubUrl && <span className="text-[10px] text-rose-600 mt-1 block">{errors.githubUrl}</span>}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="outline" size="md" type="button" onClick={handleReset} leftIcon={<RotateCcw className="h-4 w-4" />}>
              Cancel / Reset
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save Permitted Updates
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export const StudentChangePasswordPage: React.FC = () => {
  const { showToast } = useNotification();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.next.length < 8) {
      showToast({
        type: 'error',
        title: 'Weak Password',
        message: 'New password must contain at least 8 characters.',
      });
      return;
    }
    if (form.next !== form.confirm) {
      showToast({
        type: 'error',
        title: 'Mismatch',
        message: 'New password and confirm password do not match.',
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      showToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your account password has been changed securely.',
      });
      setForm({ current: '', next: '', confirm: '' });
    }, 400);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Change Password</h1>
        <p className="text-xs text-slate-500 mt-1">
          Keep your student portal account safe with a strong, updated password.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={form.current}
              onChange={(e) => setForm({ ...form, current: e.target.value })}
              placeholder="Enter current password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Password (Min 8 chars)</label>
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={form.next}
              onChange={(e) => setForm({ ...form, next: e.target.value })}
              placeholder="Enter new strong password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="Confirm new password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span>{showPass ? 'Hide password characters' : 'Show password characters'}</span>
            </button>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              type="submit"
              isLoading={isSubmitting}
              className="w-full"
              leftIcon={<KeyRound className="h-4 w-4" />}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
