import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Shield,
  UserCheck,
  GraduationCap,
  BookOpen,
  Plus,
  Save,
  RotateCcw,
  Check,
  X,
  AlertTriangle,
  History,
  Lock,
  Layers,
  Search,
  CheckCircle2,
  Sliders,
  Info,
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import type { GlobalRole } from '../../types';

interface SystemModuleConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  actions: { key: string; label: string; actionType: 'View' | 'Create' | 'Edit' | 'Delete' | 'Approve' | 'Manage' }[];
}

export const SuperAdminRolesPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [roles, setRoles] = useState<GlobalRole[]>([]);
  const [selectedRoleSlug, setSelectedRoleSlug] = useState<string>('admin');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Active role permissions state
  const [activePermissions, setActivePermissions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Create Role Modal
  const [createRoleModal, setCreateRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleSlug, setNewRoleSlug] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');

  // Comprehensive System Modules across LMS
  const systemModules: SystemModuleConfig[] = [
    {
      id: 'mod_students',
      name: 'Student Profiles & Approvals',
      category: 'Academics & Operations',
      description: 'Manage candidate onboarding, degree document inspections, and student roster profiles',
      actions: [
        { key: 'students_view', label: 'View Student Directory', actionType: 'View' },
        { key: 'students_create', label: 'Direct Registration / Intake', actionType: 'Create' },
        { key: 'students_edit', label: 'Modify Profile Credentials', actionType: 'Edit' },
        { key: 'students_approve', label: 'Approve Registration (BR-002)', actionType: 'Approve' },
        { key: 'students_delete', label: 'Expel / Remove Student', actionType: 'Delete' },
      ],
    },
    {
      id: 'mod_courses',
      name: 'Curriculum & Courses',
      category: 'Academics & Operations',
      description: 'Course catalog, syllabus topics, duration hours, and curriculum revisions',
      actions: [
        { key: 'courses_view', label: 'View Course Catalog', actionType: 'View' },
        { key: 'courses_create', label: 'Create New Course', actionType: 'Create' },
        { key: 'courses_edit', label: 'Edit Modules & Syllabus', actionType: 'Edit' },
        { key: 'courses_delete', label: 'Archive / Delete Course', actionType: 'Delete' },
      ],
    },
    {
      id: 'mod_batches',
      name: 'Batches & Scheduling',
      category: 'Academics & Operations',
      description: 'Cohort dates, classroom capacity limits, timetable scheduling, and intake allocations',
      actions: [
        { key: 'batches_view', label: 'View Cohort Batches', actionType: 'View' },
        { key: 'batches_create', label: 'Launch New Batch', actionType: 'Create' },
        { key: 'batches_edit', label: 'Modify Timetable / Dates', actionType: 'Edit' },
        { key: 'batches_manage', label: 'Allocate Faculty Instructors', actionType: 'Manage' },
      ],
    },
    {
      id: 'mod_financials',
      name: 'Tuition Fees & Payments',
      category: 'Financial Management',
      description: 'Payment ledgers, manual cash receipts, discount vouchers, and student installment tracking',
      actions: [
        { key: 'payments_view', label: 'Inspect Payment Ledgers', actionType: 'View' },
        { key: 'payments_create', label: 'Manual Offline Entry (BR-017)', actionType: 'Create' },
        { key: 'discounts_manage', label: 'Manage Discount Coupons', actionType: 'Manage' },
        { key: 'refunds_view', label: 'View Refund Requests', actionType: 'View' },
      ],
    },
    {
      id: 'mod_assessments',
      name: 'Assignments & Examinations',
      category: 'Academics & Operations',
      description: 'Practical exercises, coding assignments, online multiple-choice tests, and gradebooks',
      actions: [
        { key: 'assignments_view', label: 'View Assignments', actionType: 'View' },
        { key: 'assignments_evaluate', label: 'Evaluate & Award Marks', actionType: 'Edit' },
        { key: 'tests_create', label: 'Create Online Tests', actionType: 'Create' },
        { key: 'tests_evaluate', label: 'Grade Attempts & Release', actionType: 'Approve' },
      ],
    },
    {
      id: 'mod_certificates',
      name: 'Certificates & Credentials',
      category: 'Academic Compliance',
      description: 'Issue verifiable completion credentials with QR cryptographic validation (BR-004)',
      actions: [
        { key: 'certificates_view', label: 'View Certificate Records', actionType: 'View' },
        { key: 'certificates_create', label: 'Issue New Certificate', actionType: 'Create' },
        { key: 'certificates_manage', label: 'Revoke Invalid Certificate', actionType: 'Manage' },
      ],
    },
    {
      id: 'mod_placements',
      name: 'Placements & Corporate Relations',
      category: 'Career Management',
      description: 'Hiring partner companies, student job opening drives, and mock interview scoring',
      actions: [
        { key: 'placements_view', label: 'View Job Opportunities', actionType: 'View' },
        { key: 'placements_create', label: 'Post Corporate Openings', actionType: 'Create' },
        { key: 'placements_manage', label: 'Schedule Mock Interviews', actionType: 'Manage' },
      ],
    },
    {
      id: 'mod_reports',
      name: 'Operational Reports & Exports',
      category: 'Reporting & Analytics',
      description: 'Export student attendance, examination results, and payment logs to CSV/Excel',
      actions: [
        { key: 'reports_view', label: 'View Department Reports', actionType: 'View' },
        { key: 'reports_export', label: 'Export Data (CSV/Excel)', actionType: 'Manage' },
      ],
    },
  ];

  const loadRoles = async () => {
    setIsLoading(true);
    const res = await superAdminService.getGlobalRoles();
    if (res.success) {
      setRoles(res.data);
      const current = res.data.find((r) => r.slug === selectedRoleSlug) || res.data[0];
      if (current) {
        setSelectedRoleSlug(current.slug);
        setActivePermissions(current.permissions || []);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const selectedRole = roles.find((r) => r.slug === selectedRoleSlug);

  const handleSelectRole = (slug: string) => {
    setSelectedRoleSlug(slug);
    const r = roles.find((x) => x.slug === slug);
    if (r) {
      setActivePermissions(r.permissions || []);
    }
  };

  const togglePermission = (key: string) => {
    if (selectedRoleSlug === 'super_admin') {
      showToast({
        type: 'warning',
        title: 'Super Admin Protected',
        message: 'Super Administrator root permissions are immutable to prevent administrative lockout.',
      });
      return;
    }

    setActivePermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSavePermissions = async () => {
    if (!user || !selectedRole) return;
    setIsSaving(true);
    const res = await superAdminService.updateRolePermissions(
      { id: user.id, name: user.name },
      selectedRole.slug,
      activePermissions
    );
    setIsSaving(false);

    if (res.success && res.data) {
      setRoles((prev) => prev.map((r) => (r.slug === selectedRole.slug ? res.data : r)));
      showToast({
        type: 'success',
        title: 'Role Permissions Saved',
        message: `Updated global capability matrix for "${selectedRole.name}". Unalterable audit log recorded.`,
      });
    } else {
      showToast({ type: 'error', title: 'Save Failed', message: res.error || 'Failed to update role permissions.' });
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newRoleName.trim() || !newRoleSlug.trim()) {
      showToast({ type: 'warning', message: 'Role name and identifier slug are required.' });
      return;
    }

    const res = await superAdminService.createGlobalRole(
      { id: user.id, name: user.name },
      {
        name: newRoleName.trim(),
        slug: newRoleSlug.trim(),
        description: newRoleDescription.trim() || 'Custom administrative role',
        permissions: ['students_view', 'courses_view', 'batches_view'],
      }
    );

    if (res.success && res.data) {
      setRoles((prev) => [...prev, res.data]);
      setCreateRoleModal(false);
      setNewRoleName('');
      setNewRoleSlug('');
      setNewRoleDescription('');
      handleSelectRole(res.data.slug);
      showToast({
        type: 'success',
        title: 'Custom Role Created',
        message: `Role "${res.data.name}" provisioned. Configure granular permissions below.`,
      });
    } else {
      showToast({ type: 'error', title: 'Role Creation Failed', message: res.error || 'Failed to create role.' });
    }
  };

  const getActionBadgeColor = (type: string) => {
    switch (type) {
      case 'View':
        return 'info';
      case 'Create':
        return 'success';
      case 'Edit':
        return 'warning';
      case 'Delete':
        return 'danger';
      case 'Approve':
        return 'purple';
      case 'Manage':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const filteredModules = systemModules.filter((m) => {
    if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = m.name.toLowerCase().includes(q);
      const matchesDesc = m.description.toLowerCase().includes(q);
      const matchesAction = m.actions.some((a) => a.label.toLowerCase().includes(q));
      return matchesName || matchesDesc || matchesAction;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Global Roles &amp; Permissions Management
            </h1>
            <Badge variant="danger" size="sm">
              Super Admin Authority
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure system-wide authorization policies across Super Administrator, Administrator, Faculty, and Custom Roles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateRoleModal(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Custom Role
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="bg-rose-600 hover:bg-rose-700"
            isLoading={isSaving}
            onClick={handleSavePermissions}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Role Permissions
          </Button>
        </div>
      </div>

      {/* Security Architectural Notice */}
      <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-rose-900/40 flex items-start gap-3 shadow-xs">
        <Shield className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-white">Privilege Escalation Prevention Architecture:</p>
          <p className="text-slate-300 leading-relaxed">
            Standard Administrators accessing the Admin Dashboard are restricted exclusively to managing Teacher permissions.
            They cannot elevate their own roles, view other Admin scopes, or access this Super Admin console.
            Super Administrator root permissions are immutable to prevent system lockouts.
          </p>
        </div>
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {roles.map((r) => {
          const isSelected = selectedRoleSlug === r.slug;
          return (
            <button
              key={r.id}
              onClick={() => handleSelectRole(r.slug)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-rose-50/60 border-rose-400 ring-2 ring-rose-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {r.slug === 'super_admin' ? (
                    <Shield className="h-4 w-4" />
                  ) : r.slug === 'admin' ? (
                    <UserCheck className="h-4 w-4" />
                  ) : r.slug === 'teacher' ? (
                    <BookOpen className="h-4 w-4" />
                  ) : (
                    <GraduationCap className="h-4 w-4" />
                  )}
                </div>
                {r.isSystemRole && (
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    System
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-xs truncate">{r.name}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{r.userCount} Active Users</p>
            </button>
          );
        })}
      </div>

      {/* Selected Role Meta Header */}
      {selectedRole && (
        <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70 border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Configuring: {selectedRole.name}
              </h2>
              <Badge variant={selectedRole.slug === 'super_admin' ? 'danger' : 'info'} size="sm">
                Slug: {selectedRole.slug}
              </Badge>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">{selectedRole.description}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono shadow-xs">
              {activePermissions.length} Actions Active
            </span>
          </div>
        </Card>
      )}

      {/* Search & Category Filter */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search modules or permission actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="all">All Module Categories</option>
              <option value="Academics & Operations">Academics &amp; Operations</option>
              <option value="Financial Management">Financial Management</option>
              <option value="Academic Compliance">Academic Compliance</option>
              <option value="Career Management">Career Management</option>
              <option value="Reporting & Analytics">Reporting &amp; Analytics</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Module Permission Matrix Cards */}
      <div className="space-y-4">
        {filteredModules.map((mod) => (
          <Card key={mod.id} className="p-5 space-y-4 border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{mod.name}</h3>
                  <Badge variant="neutral" size="sm">
                    {mod.category}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const keys = mod.actions.map((a) => a.key);
                    setActivePermissions((prev) => Array.from(new Set([...prev, ...keys])));
                  }}
                  className="text-slate-600 hover:text-slate-900 text-[11px]"
                >
                  Enable All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const keys = mod.actions.map((a) => a.key);
                    setActivePermissions((prev) => prev.filter((k) => !keys.includes(k)));
                  }}
                  className="text-rose-600 hover:text-rose-700 text-[11px]"
                >
                  Disable All
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {mod.actions.map((action) => {
                const isEnabled =
                  selectedRoleSlug === 'super_admin' || activePermissions.includes(action.key);
                return (
                  <div
                    key={action.key}
                    onClick={() => togglePermission(action.key)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                      isEnabled
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-slate-50/50 border-slate-200/80 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getActionBadgeColor(action.actionType) as any} size="sm">
                          {action.actionType}
                        </Badge>
                        <span className="font-semibold text-slate-800 text-xs truncate">
                          {action.label}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 block truncate">
                        {action.key}
                      </span>
                    </div>

                    {/* iOS style toggle */}
                    <div
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-rose-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {/* Modal: Create Custom Role */}
      {createRoleModal && (
        <Modal
          isOpen={createRoleModal}
          onClose={() => setCreateRoleModal(false)}
          title="Create Custom System Role"
          size="md"
        >
          <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Role Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Academic Counselor / Quality Auditor"
                value={newRoleName}
                onChange={(e) => {
                  setNewRoleName(e.target.value);
                  if (!newRoleSlug) {
                    setNewRoleSlug(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                  }
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Unique Role Slug / Identifier *</label>
              <input
                type="text"
                required
                placeholder="e.g. academic_counselor"
                value={newRoleSlug}
                onChange={(e) => setNewRoleSlug(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Role Scope Description</label>
              <textarea
                rows={3}
                placeholder="Describe responsibility boundary and authorized modules..."
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setCreateRoleModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" className="bg-rose-600 hover:bg-rose-700" type="submit">
                Provision Role
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

