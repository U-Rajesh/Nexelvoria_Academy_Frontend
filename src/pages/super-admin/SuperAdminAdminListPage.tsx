import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  Plus,
  ShieldCheck,
  Mail,
  Phone,
  Lock,
  Save,
  Search,
  Filter,
  Eye,
  Edit2,
  Power,
  RotateCcw,
  Copy,
  Check,
  AlertTriangle,
  History,
  Building,
  KeyRound,
  Trash2,
  X,
  UserX,
  Calendar,
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import type { AdminProfile } from '../../types';

export const SuperAdminAdminListPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewAdmin, setViewAdmin] = useState<AdminProfile | null>(null);
  const [editAdmin, setEditAdmin] = useState<AdminProfile | null>(null);
  const [statusModal, setStatusModal] = useState<{
    admin: AdminProfile;
    newStatus: 'active' | 'suspended' | 'deactivated';
  } | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    admin: AdminProfile;
    tempPass: string;
    resetLink: string;
    copied: boolean;
  } | null>(null);

  // Create Form state
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createMobile, setCreateMobile] = useState('');
  const [createDepartment, setCreateDepartment] = useState('Academic Operations');
  const [createPermissions, setCreatePermissions] = useState<string[]>([
    'manage_students',
    'approve_students',
    'manage_courses',
    'manage_batches',
    'manual_payment_entry',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Form state
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  const availableAdminPermissions = [
    { id: 'manage_students', label: 'Manage Student Profiles', desc: 'View, edit, search enrolled students' },
    { id: 'approve_students', label: 'Approve Registrations (BR-002)', desc: 'Verify certificates & accept candidates' },
    { id: 'manage_courses', label: 'Course Management', desc: 'Create, edit & manage syllabus curriculum' },
    { id: 'manage_batches', label: 'Batch Operations', desc: 'Schedule batches, dates, and classroom capacities' },
    { id: 'manage_teachers', label: 'Teacher Allocation', desc: 'Allocate instructors to specific batches' },
    { id: 'manage_payments', label: 'Financial Ledgers', desc: 'Inspect student payment ledgers and receipts' },
    { id: 'manual_payment_entry', label: 'Manual Payment Entry (BR-017)', desc: 'Record cash & direct bank deposits' },
    { id: 'manage_discounts', label: 'Coupons & Scholarships', desc: 'Create discount codes and fee concessions' },
    { id: 'manage_tests', label: 'Examination Management', desc: 'Schedule institute online assessments' },
    { id: 'manage_certificates', label: 'Certificates Issuance', desc: 'Generate and verify student certificates' },
    { id: 'manage_placements', label: 'Placement Drives', desc: 'Manage recruiters, jobs, and mock interviews' },
    { id: 'view_reports', label: 'Institute Reports', desc: 'Generate operational CSV/Excel data exports' },
  ];

  const loadAdmins = async () => {
    setIsLoading(true);
    const res = await superAdminService.getAdmins();
    if (res.success) setAdmins(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const toggleCreatePermission = (permId: string) => {
    setCreatePermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const toggleEditPermission = (permId: string) => {
    setEditPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!createName.trim() || !createEmail.trim()) {
      showToast({ type: 'warning', message: 'Name and email are required fields.' });
      return;
    }

    setIsSubmitting(true);
    const res = await superAdminService.createAdmin(
      { id: user.id, name: user.name },
      {
        name: createName.trim(),
        email: createEmail.trim(),
        mobile: createMobile.trim() || '+91 98765 00000',
        department: createDepartment,
        permissions: createPermissions,
      }
    );
    setIsSubmitting(false);

    if (res.success && res.data) {
      setAdmins((prev) => [res.data, ...prev]);
      setCreateModalOpen(false);
      setCreateName('');
      setCreateEmail('');
      setCreateMobile('');
      showToast({
        type: 'success',
        title: 'Admin Created',
        message: `Admin account created for ${res.data.name} with ${createPermissions.length} permissions assigned. (SRS BR-018)`,
      });
    } else {
      showToast({ type: 'error', title: 'Creation Failed', message: res.error || 'Failed to create admin.' });
    }
  };

  const handleOpenEdit = (adm: AdminProfile) => {
    setEditAdmin(adm);
    setEditName(adm.name);
    setEditMobile(adm.mobile || '');
    setEditDepartment(adm.department || 'Academic Operations');
    setEditPermissions(adm.permissions || []);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editAdmin) return;

    setIsSubmitting(true);
    const res = await superAdminService.updateAdmin(
      { id: user.id, name: user.name },
      editAdmin.id,
      {
        name: editName,
        mobile: editMobile,
        department: editDepartment,
        permissions: editPermissions,
      }
    );
    setIsSubmitting(false);

    if (res.success && res.data) {
      setAdmins((prev) => prev.map((a) => (a.id === editAdmin.id ? res.data : a)));
      setEditAdmin(null);
      showToast({
        type: 'success',
        title: 'Admin Updated',
        message: `Updated profile details and permissions for ${res.data.name}.`,
      });
    } else {
      showToast({ type: 'error', title: 'Update Failed', message: res.error || 'Failed to update admin.' });
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!user || !statusModal) return;

    setIsSubmitting(true);
    const res = await superAdminService.toggleAdminStatus(
      { id: user.id, name: user.name },
      statusModal.admin.id,
      statusModal.newStatus,
      statusReason
    );
    setIsSubmitting(false);

    if (res.success && res.data) {
      setAdmins((prev) => prev.map((a) => (a.id === statusModal.admin.id ? res.data : a)));
      setStatusModal(null);
      setStatusReason('');
      showToast({
        type: 'success',
        title: 'Status Updated',
        message: res.message || `Admin status changed to ${statusModal.newStatus}.`,
      });
    } else {
      showToast({ type: 'error', title: 'Status Update Failed', message: res.error || 'Could not update status.' });
    }
  };

  const handleTriggerPasswordReset = async (adm: AdminProfile) => {
    if (!user) return;
    const res = await superAdminService.resetAdminPassword({ id: user.id, name: user.name }, adm.id);
    if (res.success && res.data) {
      setResetPasswordModal({
        admin: adm,
        tempPass: res.data.temporaryPassword,
        resetLink: res.data.resetLink,
        copied: false,
      });
      showToast({
        type: 'success',
        title: 'Temporary Password Issued',
        message: `New credentials generated for ${adm.name}. Action logged to audit trail.`,
      });
    }
  };

  // Filtered admins list
  const filteredAdmins = useMemo(() => {
    return admins.filter((a) => {
      if (departmentFilter !== 'all' && a.department !== departmentFilter) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = a.name.toLowerCase().includes(q);
        const matchesEmail = a.email.toLowerCase().includes(q);
        const matchesDept = a.department.toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesDept;
      }
      return true;
    });
  }, [admins, departmentFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Admin Account Management
            </h1>
            <Badge variant="danger" size="sm">
              Super Admin Exclusive
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create, configure, suspend, or revoke Staff Administrator credentials and custom permission matrices (SRS Rule BR-018).
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          className="bg-rose-600 hover:bg-rose-700 shadow-sm"
          onClick={() => setCreateModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Admin Account
        </Button>
      </div>

      {/* Security Governance Notice */}
      <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-rose-900/40 flex items-start gap-3 shadow-xs">
        <ShieldCheck className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-white">Privileged Account Governance Enforced:</p>
          <p className="text-slate-300 leading-relaxed">
            Standard Administrator accounts cannot view, provision, or alter permissions for other Administrators.
            Only the <strong>Super Administrator</strong> possesses the root cryptographic authority to assign operational scopes,
            suspend credentials, or execute password overrides.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="all">All Departments</option>
              <option value="Academic Operations">Academic Operations</option>
              <option value="Admissions & Student Welfare">Admissions &amp; Student Welfare</option>
              <option value="Examination & Assessments">Examination &amp; Assessments</option>
              <option value="Placements & Corporate">Placements &amp; Corporate</option>
              <option value="Finance & Accounting">Finance &amp; Accounting</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="suspended">Suspended Accounts</option>
              <option value="deactivated">Deactivated Accounts</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Admin Accounts Table */}
      <Card className="overflow-hidden shadow-xs border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Permissions Assigned</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No administrator accounts match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {adm.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{adm.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{adm.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        {adm.department}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-slate-800 block">{adm.email}</span>
                      <span className="text-slate-400 text-[11px]">{adm.mobile}</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge
                        variant={
                          adm.status === 'active'
                            ? 'success'
                            : adm.status === 'suspended'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                        dot
                      >
                        {adm.status.toUpperCase()}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        <KeyRound className="h-3 w-3 text-slate-500" />
                        {adm.permissions?.length || 0} Modules
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      <span>{adm.lastLoginIp || '192.168.1.101'}</span>
                      <span className="block text-[10px] text-slate-400">
                        {adm.createdAt ? formatDate(adm.createdAt) : 'Recently'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewAdmin(adm)}
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-600" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(adm)}
                          title="Edit Permissions"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-indigo-600" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTriggerPasswordReset(adm)}
                          title="Generate Temporary Password"
                        >
                          <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
                        </Button>

                        {adm.status === 'active' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setStatusModal({ admin: adm, newStatus: 'suspended' })}
                            title="Suspend Account"
                          >
                            <Power className="h-3.5 w-3.5 text-rose-600" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setStatusModal({ admin: adm, newStatus: 'active' })}
                            title="Activate Account"
                          >
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal 1: Create Admin Account */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create New Administrator Account"
          size="lg"
        >
          <form onSubmit={handleCreateAdmin} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Staff Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sangeeta Roy"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Official Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="sangeeta.roy@nexelvoria.edu.in"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mobile Contact Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 44332"
                  value={createMobile}
                  onChange={(e) => setCreateMobile(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assigned Department</label>
                <select
                  value={createDepartment}
                  onChange={(e) => setCreateDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="Academic Operations">Academic Operations</option>
                  <option value="Admissions & Student Welfare">Admissions &amp; Student Welfare</option>
                  <option value="Examination & Assessments">Examination &amp; Assessments</option>
                  <option value="Placements & Corporate">Placements &amp; Corporate</option>
                  <option value="Finance & Accounting">Finance &amp; Accounting</option>
                </select>
              </div>
            </div>

            {/* Granular Permission Toggles */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">Admin Permission Matrix</h4>
                  <p className="text-slate-500 text-[11px]">
                    Select operational capabilities granted to this administrative staff member.
                  </p>
                </div>
                <span className="font-semibold text-rose-600 font-mono">
                  {createPermissions.length} of {availableAdminPermissions.length} Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                {availableAdminPermissions.map((perm) => {
                  const isChecked = createPermissions.includes(perm.id);
                  return (
                    <label
                      key={perm.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-rose-50/50 border-rose-200 text-slate-900'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCreatePermission(perm.id)}
                        className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                      />
                      <div className="min-w-0">
                        <span className="font-semibold block text-xs">{perm.label}</span>
                        <span className="text-[10px] text-slate-500 leading-tight block">
                          {perm.desc}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700"
                isLoading={isSubmitting}
                type="submit"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Provision Admin Account
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 2: View Admin Details */}
      {viewAdmin && (
        <Modal
          isOpen={!!viewAdmin}
          onClose={() => setViewAdmin(null)}
          title={`Admin Profile: ${viewAdmin.name}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="h-12 w-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-base">
                {viewAdmin.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{viewAdmin.name}</h3>
                <p className="text-slate-500">{viewAdmin.department}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={viewAdmin.status === 'active' ? 'success' : 'warning'} size="sm" dot>
                    {viewAdmin.status.toUpperCase()}
                  </Badge>
                  <span className="font-mono text-[10px] text-slate-400">ID: {viewAdmin.id}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-[11px] text-slate-400 block">Email Address</span>
                <span className="font-semibold text-slate-800 break-all">{viewAdmin.email}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-[11px] text-slate-400 block">Mobile Contact</span>
                <span className="font-semibold text-slate-800">{viewAdmin.mobile || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-[11px] text-slate-400 block">Account Created</span>
                <span className="font-mono text-slate-800">{viewAdmin.createdAt ? formatDate(viewAdmin.createdAt) : '2026-06-15'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-[11px] text-slate-400 block">Last Active IP</span>
                <span className="font-mono text-slate-800">{viewAdmin.lastLoginIp || '192.168.1.102'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900">Active Permissions ({viewAdmin.permissions?.length || 0})</h4>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                {viewAdmin.permissions?.map((p) => (
                  <span
                    key={p}
                    className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setViewAdmin(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 3: Edit Admin Profile */}
      {editAdmin && (
        <Modal
          isOpen={!!editAdmin}
          onClose={() => setEditAdmin(null)}
          title={`Edit Administrator: ${editAdmin.name}`}
          size="lg"
        >
          <form onSubmit={handleSaveEdit} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Staff Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mobile Contact</label>
                <input
                  type="tel"
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Assigned Department</label>
                <select
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="Academic Operations">Academic Operations</option>
                  <option value="Admissions & Student Welfare">Admissions &amp; Student Welfare</option>
                  <option value="Examination & Assessments">Examination &amp; Assessments</option>
                  <option value="Placements & Corporate">Placements &amp; Corporate</option>
                  <option value="Finance & Accounting">Finance &amp; Accounting</option>
                </select>
              </div>
            </div>

            {/* Permission Toggles */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">Modify Permissions</h4>
                  <p className="text-slate-500 text-[11px]">Update the module-level capabilities for this account.</p>
                </div>
                <span className="font-semibold text-indigo-600 font-mono">
                  {editPermissions.length} Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                {availableAdminPermissions.map((perm) => {
                  const isChecked = editPermissions.includes(perm.id);
                  return (
                    <label
                      key={perm.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-indigo-50/50 border-indigo-200 text-slate-900'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleEditPermission(perm.id)}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="min-w-0">
                        <span className="font-semibold block text-xs">{perm.label}</span>
                        <span className="text-[10px] text-slate-500 leading-tight block">
                          {perm.desc}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setEditAdmin(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
                isLoading={isSubmitting}
                type="submit"
                leftIcon={<Save className="h-4 w-4" />}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 4: Account Status Toggle (Suspend / Activate / Deactivate) */}
      {statusModal && (
        <Modal
          isOpen={!!statusModal}
          onClose={() => setStatusModal(null)}
          title={`Confirm Account Status: ${statusModal.newStatus.toUpperCase()}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-amber-900 leading-relaxed">
                You are changing the account status of <strong>{statusModal.admin.name}</strong> to{' '}
                <span className="uppercase font-bold">{statusModal.newStatus}</span>.
                {statusModal.newStatus === 'suspended' &&
                  ' The administrator will be immediately logged out and unable to access administrative routes.'}
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Reason for Status Change (Audit Record)
              </label>
              <textarea
                rows={3}
                placeholder="Provide justification notes for compliance audit logging..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setStatusModal(null)}>
                Cancel
              </Button>
              <Button
                variant={statusModal.newStatus === 'active' ? 'primary' : 'danger'}
                size="sm"
                isLoading={isSubmitting}
                onClick={handleConfirmStatusChange}
              >
                Confirm {statusModal.newStatus.toUpperCase()}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 5: Password Reset Dispatched */}
      {resetPasswordModal && (
        <Modal
          isOpen={!!resetPasswordModal}
          onClose={() => setResetPasswordModal(null)}
          title="Administrative Credential Reset"
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5">
              <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-emerald-950 leading-relaxed">
                A secure one-time temporary password has been generated for{' '}
                <strong>{resetPasswordModal.admin.name}</strong>. Provide this to the administrator. They
                will be prompted to set a new password upon login.
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 font-semibold">Temporary Password</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={resetPasswordModal.tempPass}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(resetPasswordModal.tempPass);
                    setResetPasswordModal({ ...resetPasswordModal, copied: true });
                    showToast({ type: 'info', message: 'Temporary password copied to clipboard.' });
                  }}
                  leftIcon={resetPasswordModal.copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                >
                  {resetPasswordModal.copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 font-semibold">Reset Link Dispatch</span>
              <input
                type="text"
                readOnly
                value={resetPasswordModal.resetLink}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setResetPasswordModal(null)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
