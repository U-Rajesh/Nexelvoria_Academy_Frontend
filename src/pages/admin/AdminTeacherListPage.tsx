import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  Plus,
  Star,
  BookOpen,
  Calendar,
  Layers,
  Mail,
  Phone,
  Award,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { Modal } from '../../components/feedback/Modal';
import { OneTimePasswordModal } from '../../components/feedback/OneTimePasswordModal';
import { Card } from '../../components/common/Card';
import type { TeacherProfile } from '../../types';

export const AdminTeacherListPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experienceYears, setExperienceYears] = useState(8);
  const [qualifications, setQualifications] = useState('');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Shown once, held only in memory; never persisted or logged.
  const [oneTimePassword, setOneTimePassword] = useState<{ name: string; email: string; password: string } | null>(null);

  // Edit / status
  const [editing, setEditing] = useState<TeacherProfile | null>(null);
  const [editForm, setEditForm] = useState({ name: '', specialization: '', experienceYears: '0', qualifications: '', bio: '' });
  const [statusTarget, setStatusTarget] = useState<TeacherProfile | null>(null);
  const [statusReason, setStatusReason] = useState('');

  const openEdit = (t: TeacherProfile) => {
    setEditing(t);
    setEditForm({
      name: t.name,
      specialization: t.specialization ?? '',
      experienceYears: String(t.experienceYears ?? 0),
      qualifications: t.qualifications ?? '',
      bio: t.bio ?? '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setIsSubmitting(true);
    const res = await adminService.updateTeacher(editing.id, {
      name: editForm.name.trim(),
      specialization: editForm.specialization.trim() || null,
      experienceYears: Number(editForm.experienceYears || 0),
      qualifications: editForm.qualifications.trim() || null,
      bio: editForm.bio.trim() || null,
    });
    setIsSubmitting(false);
    if (res.success) {
      showToast({ type: 'success', title: 'Faculty Updated', message: res.message || `${editForm.name} saved.` });
      setEditing(null);
      loadTeachers();
    } else {
      showToast({ type: 'error', title: 'Not updated', message: res.error || 'Please try again.' });
    }
  };

  const handleStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTarget) return;
    const next = statusTarget.status === 'active' ? 'deactivated' : 'active';
    setIsSubmitting(true);
    const res = await adminService.setTeacherStatus(statusTarget.id, next, statusReason.trim() || undefined);
    setIsSubmitting(false);
    if (res.success) {
      showToast({ type: 'success', title: 'Faculty Status', message: res.message || `Status set to ${next}.` });
      setStatusTarget(null);
      setStatusReason('');
      loadTeachers();
    } else {
      showToast({ type: 'error', title: 'Status not changed', message: res.error || 'Please try again.' });
    }
  };

  const loadTeachers = async () => {
    const res = await adminService.getTeachers();
    if (res.success) {
      setTeachers(res.data);
      setLoadError(null);
    } else {
      setLoadError(res.error || 'Failed to load faculty.');
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || !email.trim()) return;

    const normalizedMobile = mobile.replace(/\s+/g, '').replace(/^\+91/, '');
    if (!/^[6-9]\d{9}$/.test(normalizedMobile)) {
      showToast({ type: 'warning', message: 'Enter a valid 10-digit Indian mobile number.' });
      return;
    }

    setIsSubmitting(true);
    const res = await adminService.addTeacher(
      { id: user.id, name: user.name },
      {
        name: name.trim(),
        email: email.trim(),
        mobile: normalizedMobile,
        specialization,
        experienceYears,
        qualifications,
        bio,
      }
    );
    setIsSubmitting(false);

    if (res.success && res.data) {
      const { temporaryPassword, ...created } = res.data;
      showToast({
        type: 'success',
        title: 'Faculty Member Onboarded',
        message: `${created.name} has been added to the faculty directory.`,
      });
      setIsModalOpen(false);
      loadTeachers();
      setName('');
      setEmail('');
      setMobile('');
      setSpecialization('');
      setQualifications('');
      setBio('');
      if (temporaryPassword) {
        setOneTimePassword({ name: created.name, email: created.email, password: temporaryPassword });
      }
    } else {
      showToast({ type: 'error', title: 'Could not add faculty member', message: res.error || 'Please try again.' });
    }
  };

  const columns: Column<TeacherProfile>[] = [
    {
      key: 'name',
      header: 'Faculty Member',
      sortable: true,
      render: (t) => (
        <div className="flex items-center gap-2.5">
          {t.avatarUrl ? (
            <img src={t.avatarUrl} className="h-8 w-8 rounded-full object-cover border border-slate-200" alt={t.name} />
          ) : (
            <span className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-slate-200">
              {t.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <span className="font-bold text-slate-900 block text-xs">{t.name}</span>
            <span className="text-[11px] text-slate-500 font-mono">{t.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'specialization',
      header: 'Specialization & Expertise',
      render: (t) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs block">{t.specialization}</span>
          <span className="text-[11px] text-slate-500">{t.experienceYears} Years Exp. • {t.qualifications}</span>
        </div>
      ),
    },
    {
      key: 'assignedBatchIds',
      header: 'Allocated Cohorts',
      render: (t) => (
        <div className="flex items-center gap-1.5">
          <Badge variant="purple" size="sm">
            {t.assignedBatchIds.length} Active Batches
          </Badge>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Student Rating',
      sortable: true,
      render: (t) => (
        <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          {/* 0 means no rating source yet, not a score. */}
          <span>{t.rating > 0 ? t.rating.toFixed(1) : <span className="text-slate-400 font-normal">Not rated</span>}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (t) => (
        <Badge variant={t.status === 'active' ? 'success' : 'neutral'} size="sm" dot>
          {t.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (t) => (
        <div className="flex flex-wrap items-center gap-1">
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => openEdit(t)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`text-xs ${t.status === 'active' ? 'text-rose-600' : 'text-emerald-700'}`}
            onClick={() => {
              setStatusTarget(t);
              setStatusReason('');
            }}
          >
            {t.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
          <Link to="/admin/teachers/allocation">
            <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:bg-indigo-50">
              Allocate Batches →
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Teacher & Faculty Directory (ADM-008)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage teaching faculty, track expertise, experience, and academic teaching allocations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/teachers/allocation">
            <Button variant="outline" size="sm" leftIcon={<Layers className="h-4 w-4" />}>
              Batch Allocations
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Faculty Member
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">{loadError}</div>
      )}

      <OneTimePasswordModal
        password={oneTimePassword?.password ?? null}
        title="Teacher account created"
        accountName={oneTimePassword?.name ?? ''}
        accountEmail={oneTimePassword?.email}
        onClose={() => setOneTimePassword(null)}
      />

      {/* Main Table */}
      <DataTable
        data={teachers}
        columns={columns}
        searchPlaceholder="Search faculty by name, email or specialization..."
        pageSize={10}
      />

      {/* Edit Teacher Modal */}
      {editing && (
        <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={`Edit Faculty: ${editing.name}`} size="md">
          <form onSubmit={handleSaveEdit} className="space-y-3 text-xs text-slate-700">
            <p className="text-[11px] text-slate-500">Email ({editing.email}) and mobile are sign-in identifiers and cannot be changed here.</p>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Full Name *</label>
              <input required minLength={2} maxLength={150} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Specialization</label>
                <input maxLength={200} value={editForm.specialization} onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Experience (years)</label>
                <input type="number" min={0} max={100} step="0.5" value={editForm.experienceYears} onChange={(e) => setEditForm({ ...editForm, experienceYears: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Qualifications</label>
              <input maxLength={200} value={editForm.qualifications} onChange={(e) => setEditForm({ ...editForm, qualifications: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Bio</label>
              <textarea rows={3} maxLength={4000} value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Activate / Deactivate Modal */}
      {statusTarget && (
        <Modal
          isOpen={!!statusTarget}
          onClose={() => setStatusTarget(null)}
          title={`${statusTarget.status === 'active' ? 'Deactivate' : 'Activate'} ${statusTarget.name}`}
          size="md"
        >
          <form onSubmit={handleStatus} className="space-y-3 text-xs text-slate-700">
            <p>
              {statusTarget.status === 'active'
                ? 'The teacher will be signed out of every session immediately and cannot sign in until reactivated. Allocations and records are kept.'
                : 'The teacher will be able to sign in again.'}
            </p>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Reason (optional, kept in the audit log)</label>
              <input minLength={5} maxLength={500} value={statusReason} onChange={(e) => setStatusReason(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setStatusTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                {statusTarget.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Teacher Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Onboard Faculty Member (ADM-008)"
          size="lg"
        >
          <form onSubmit={handleCreateTeacher} className="space-y-4 text-xs text-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Full Name & Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Anand Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Official Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="anand.sharma@nexelvoria.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Mobile Phone Contact</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Industry Experience (Years)</label>
                <input
                  type="number"
                  min={1}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-800 mb-1">Technical Specialization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems, Spring Boot 3, AWS Solutions Architecture"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-800 mb-1">Educational Qualifications & Certifications</label>
                <input
                  type="text"
                  placeholder="e.g. M.Tech in CS (IIT Delhi), AWS Certified Solutions Architect Professional"
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-800 mb-1">Professional Biography</label>
                <textarea
                  rows={2}
                  placeholder="Background, former employers, and areas of research."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save Faculty Record
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

