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

  const loadTeachers = async () => {
    const res = await adminService.getTeachers();
    if (res.success) setTeachers(res.data);
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    const res = await adminService.addTeacher(
      { id: user.id, name: user.name },
      {
        name,
        email,
        mobile,
        specialization,
        experienceYears,
        qualifications,
        bio,
      }
    );
    setIsSubmitting(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Faculty Member Onboarded',
        message: `${name} has been added to the faculty directory. (ADM-008)`,
      });
      setIsModalOpen(false);
      loadTeachers();
      setName('');
      setEmail('');
      setMobile('');
      setSpecialization('');
    }
  };

  const columns: Column<TeacherProfile>[] = [
    {
      key: 'name',
      header: 'Faculty Member',
      sortable: true,
      render: (t) => (
        <div className="flex items-center gap-2.5">
          <img
            src={t.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'}
            className="h-8 w-8 rounded-full object-cover border border-slate-200"
            alt={t.name}
          />
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
          <span>{t.rating.toFixed(1)}</span>
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
        <Link to="/admin/teachers/allocation">
          <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:bg-indigo-50">
            Allocate Batches →
          </Button>
        </Link>
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

      {/* Main Table */}
      <DataTable
        data={teachers}
        columns={columns}
        searchPlaceholder="Search faculty by name, email or specialization..."
        pageSize={10}
      />

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

