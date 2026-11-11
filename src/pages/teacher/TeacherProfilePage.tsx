import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Award,
  BookOpen,
  Lock,
  Save,
  RotateCcw,
  KeyRound,
  Eye,
  EyeOff,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { getStorageItem, setStorageItem } from '../../utils/storage';

interface TeacherProfileFormData {
  mobile: string;
  bio: string;
  experienceYears: number;
  skills: string;
  officeHours: string;
}

export const TeacherProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const storageKey = `nex_teacher_profile_${user?.id || 'default'}`;

  // Read-only institutional records
  const institutionalData = {
    teacherId: (user as any)?.teacherId || 'TCH-2025-019',
    legalName: user?.name || 'Dr. Vikram Rao',
    email: user?.email || 'vikram.rao@nexelvoria.edu.in',
    qualifications: 'Ph.D. in Computer Science (Distributed Systems), AWS Solutions Architect Pro',
    assignedCourses: ['Full Stack Java & Cloud Microservices', 'Enterprise Cloud Architecture'],
    assignedBatches: ['Oct 2026 Morning Cohort (JFS-2026-M1)'],
    department: 'Software Engineering & Cloud Computing',
    joinedDate: 'January 2025',
    roleStatus: 'Active Lead Faculty',
  };

  const defaultFormData: TeacherProfileFormData = {
    mobile: user?.mobile || '9899001122',
    experienceYears: 14,
    bio: 'Former Principal Architect at AWS Partner network with 14+ years of industry training & distributed systems consulting.',
    skills: 'Java 21, Spring Boot 3, Microservices, Kubernetes, Kafka, Distributed Sagas, PostgreSQL, React, AWS EKS',
    officeHours: 'Mon - Fri, 2:00 PM - 4:00 PM IST',
  };

  const [formData, setFormData] = useState<TeacherProfileFormData>(() =>
    getStorageItem<TeacherProfileFormData>(storageKey, defaultFormData)
  );
  const [initialData, setInitialData] = useState<TeacherProfileFormData>(formData);
  const [errors, setErrors] = useState<Partial<Record<keyof TeacherProfileFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const errs: Partial<Record<keyof TeacherProfileFormData, string>> = {};

    if (!formData.mobile.trim()) {
      errs.mobile = 'Mobile number is required.';
    } else if (!/^\d{10}$/.test(formData.mobile.trim().replace(/\D/g, ''))) {
      errs.mobile = 'Enter a valid 10-digit contact number.';
    }

    if (!formData.bio.trim() || formData.bio.length < 20) {
      errs.bio = 'Bio should provide at least 20 characters of professional background.';
    }

    if (!formData.skills.trim()) {
      errs.skills = 'Please list at least one skill or technical expertise area.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please review highlighted fields before saving.',
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
        message: 'Your permitted contact details and bio have been updated.',
      });
    }, 300);
  };

  const handleReset = () => {
    setFormData(initialData);
    setErrors({});
    showToast({
      type: 'info',
      title: 'Changes Discarded',
      message: 'Reverted to last saved profile data.',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review institutional academic allocations and manage permitted contact and bio information.
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <img
              src={
                user?.avatarUrl ||
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
              }
              alt={institutionalData.legalName}
              className="h-20 w-20 rounded-2xl object-cover border-2 border-teal-200 shadow-xs"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{institutionalData.legalName}</h2>
                <Badge variant="purple" size="sm" dot>
                  {institutionalData.teacherId}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono">{institutionalData.email}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="success" size="sm" dot>
                  {institutionalData.roleStatus}
                </Badge>
                <Badge variant="neutral" size="sm">
                  {institutionalData.department}
                </Badge>
              </div>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Faculty Rating</span>
            <div className="flex items-center gap-1 justify-end">
              <span className="text-base font-extrabold text-amber-500">★ 4.9</span>
              <span className="text-[11px] text-slate-400 font-medium">/ 5.0 (Student Reviews)</span>
            </div>
            <span className="text-[10px] text-slate-500 block font-mono">Faculty since {institutionalData.joinedDate}</span>
          </div>
        </div>

        {/* Read-Only Academic Allocations (Admin Controlled TCH-001) */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Lock className="h-4 w-4 text-slate-400" />
            <span>Institutional Academic Allocations (Admin Controlled - TCH-001)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Faculty ID</span>
              <span className="font-mono font-bold text-slate-900">{institutionalData.teacherId}</span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Official Email</span>
              <span className="font-mono text-slate-700">{institutionalData.email}</span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Academic Qualifications</span>
              <span className="text-slate-800">{institutionalData.qualifications}</span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Allocated Courses (TCH-001)</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {institutionalData.assignedCourses.map((c) => (
                  <Badge key={c} variant="purple" size="sm">{c}</Badge>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Allocated Batches</span>
              <span className="font-bold text-teal-800">{institutionalData.assignedBatches[0]}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">
            * Per SRS Rule TCH-001, course allocations and batch assignments are administered exclusively by the Academic Dean. Teachers cannot assign courses independently.
          </p>
        </div>
      </Card>

      {/* Permitted Profile Updates */}
      <Card className="p-6 space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Permitted Profile Updates</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Update your direct contact number, professional biography, skill keywords, and office consultation timings.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Direct Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="10-digit mobile number"
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.mobile ? 'border-rose-300 focus:ring-rose-400' : 'border-slate-300 focus:ring-teal-500'
                  }`}
                />
              </div>
              {errors.mobile && <span className="text-[10px] text-rose-600 mt-1 block">{errors.mobile}</span>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Industry Experience (Years)</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.experienceYears}
                  onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Student Consultation / Office Hours</label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={formData.officeHours}
                onChange={(e) => setFormData({ ...formData, officeHours: e.target.value })}
                placeholder="e.g. Mon - Fri 2:00 PM - 4:00 PM IST"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Skills & Technology Expertise <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              placeholder="Comma-separated list of skills"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.skills ? 'border-rose-300 focus:ring-rose-400' : 'border-slate-300 focus:ring-teal-500'
              }`}
            />
            {errors.skills && <span className="text-[10px] text-rose-600 mt-1 block">{errors.skills}</span>}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Professional Biography <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Summary of engineering and academic background"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.bio ? 'border-rose-300 focus:ring-rose-400' : 'border-slate-300 focus:ring-teal-500'
              }`}
            />
            {errors.bio && <span className="text-[10px] text-rose-600 mt-1 block">{errors.bio}</span>}
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
              className="bg-teal-600 hover:bg-teal-700"
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save Permitted Profile Updates
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export const TeacherChangePasswordPage: React.FC = () => {
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
        message: 'Your faculty account password has been changed securely.',
      });
      setForm({ current: '', next: '', confirm: '' });
    }, 400);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Change Faculty Password</h1>
        <p className="text-xs text-slate-500 mt-1">
          Maintain the security of your instructor portal account.
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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span>{showPass ? 'Hide password' : 'Show password'}</span>
            </button>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              type="submit"
              isLoading={isSubmitting}
              className="w-full bg-teal-600 hover:bg-teal-700"
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

