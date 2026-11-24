import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  ShieldCheck,
  Save,
  Search,
  Eye,
  Edit2,
  Power,
  RotateCcw,
  Check,
  AlertTriangle,
  Building,
  KeyRound,
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import { OneTimePasswordModal } from '../../components/feedback/OneTimePasswordModal';
import type { AdminProfile, LoginHistoryItem } from '../../types';
import { authService } from '../../services/authService';

/**
 * Department codes are stored in NXA_AdminProfiles.AdminLevel (20 chars), so
 * short codes are persisted and readable labels are shown.
 */
const DEPARTMENTS = [
  { code: 'ACADEMIC_OPS', label: 'Academic Operations' },
  { code: 'ADMISSIONS', label: 'Admissions & Student Welfare' },
  { code: 'EXAMINATIONS', label: 'Examination & Assessments' },
  { code: 'PLACEMENTS', label: 'Placements & Corporate' },
  { code: 'FINANCE', label: 'Finance & Accounting' },
] as const;

const departmentLabel = (code: string | undefined): string =>
  DEPARTMENTS.find((d) => d.code === code)?.label ?? code ?? '—';

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
  const [viewHistory, setViewHistory] = useState<LoginHistoryItem[] | null>(null);
  const [viewHistoryError, setViewHistoryError] = useState<string | null>(null);

  // Load the selected admin's sign-in history when their profile opens.
  useEffect(() => {
    if (!viewAdmin) return;
    let cancelled = false;
    setViewHistory(null);
    setViewHistoryError(null);
    authService.getUserLoginHistory(viewAdmin.id).then((res) => {
      if (cancelled) return;
      if (res.success) setViewHistory(res.data);
      else setViewHistoryError(res.error || 'Login history could not be loaded.');
    });
    return () => {
      cancelled = true;
    };
  }, [viewAdmin]);
  const [editAdmin, setEditAdmin] = useState<AdminProfile | null>(null);
  const [statusModal, setStatusModal] = useState<{
    admin: AdminProfile;
    newStatus: 'active' | 'suspended' | 'deactivated';
  } | null>(null);
  const [statusReason, setStatusReason] = useState('');
  // One-time temporary password (create / reset). Held only in memory while
  // the dialog is open; never persisted, logged or put in a toast.
  const [oneTimePassword, setOneTimePassword] = useState<{
    title: string;
    name: string;
    email: string;
    password: string;
    sessionsRevoked: boolean;
  } | null>(null);

  // Create Form state
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createMobile, setCreateMobile] = useState('');
  const [createDepartment, setCreateDepartment] = useState<string>(DEPARTMENTS[0].code);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Form state
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editDepartment, setEditDepartment] = useState('');

  const loadAdmins = async () => {
    setIsLoading(true);
    const res = await superAdminService.getAdmins();
    if (res.success) setAdmins(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!createName.trim() || !createEmail.trim()) {
      showToast({ type: 'warning', message: 'Name and email are required fields.' });
      return;
    }
    const mobile = createMobile.replace(/\s+/g, '').replace(/^\+91/, '');
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      showToast({ type: 'warning', message: 'Enter a valid 10-digit Indian mobile number.' });
      return;
    }

    setIsSubmitting(true);
    const res = await superAdminService.createAdmin(
      { id: user.id, name: user.name },
      {
        name: createName.trim(),
        email: createEmail.trim(),
        mobile,
        department: createDepartment,
      }
    );
    setIsSubmitting(false);

    if (res.success && res.data) {
      const { temporaryPassword, ...created } = res.data;
      setAdmins((prev) => [created, ...prev]);
      setCreateModalOpen(false);
      setCreateName('');
      setCreateEmail('');
      setCreateMobile('');
      showToast({ type: 'success', title: 'Admin Created', message: `Admin account created for ${created.name}.` });
      if (temporaryPassword) {
        setOneTimePassword({
          title: 'Admin account created',
          name: created.name,
          email: created.email,
          password: temporaryPassword,
          sessionsRevoked: false,
        });
      }
    } else {
      showToast({ type: 'error', title: 'Creation Failed', message: res.error || 'Failed to create admin.' });
    }
  };

  const handleOpenEdit = (adm: AdminProfile) => {
    setEditAdmin(adm);
    setEditName(adm.name);
    setEditMobile(adm.mobile || '');
    setEditDepartment(adm.department || DEPARTMENTS[0].code);
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
      }
    );
    setIsSubmitting(false);

    if (res.success && res.data) {
      setAdmins((prev) => prev.map((a) => (a.id === editAdmin.id ? res.data : a)));
      setEditAdmin(null);
      showToast({
        type: 'success',
        title: 'Admin Updated',
        message: `Updated profile details for ${res.data.name}.`,
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
    if (res.success && res.data?.temporaryPassword) {
      setOneTimePassword({
        title: 'Password reset',
        name: adm.name,
        email: adm.email,
        password: res.data.temporaryPassword,
        sessionsRevoked: true,
      });
    } else {
      showToast({ type: 'error', title: 'Password Reset Failed', message: res.error || 'Could not reset the password.' });
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
        const matchesDept = departmentLabel(a.department).toLowerCase().includes(q);
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
              {DEPARTMENTS.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.label}
                </option>
              ))}
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
                <th className="py-3 px-4">Role</th>
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
                        {departmentLabel(adm.department)}
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
                        {adm.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      <span>{adm.lastLoginIp || '—'}</span>
                      <span className="block text-[10px] text-slate-400">
                        {adm.createdAt ? formatDate(adm.createdAt) : '—'}
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

                        {/* The server resets only `admin` accounts and never the caller's own. */}
                        {adm.role === 'admin' && adm.id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTriggerPasswordReset(adm)}
                            title="Generate Temporary Password"
                          >
                            <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
                          </Button>
                        )}

                        {adm.id === user?.id ? null : adm.status === 'active' ? (
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
                  {DEPARTMENTS.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fine-grained permissions: not yet persisted or enforced server-side. */}
            <div className="border-t border-slate-100 pt-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <KeyRound className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  Module-level permissions (BR-018) will be assignable here once the approved permission catalog is
                  configured. Until then, every admin account has the standard Admin role access enforced by the server.
                </span>
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
                <p className="text-slate-500">{departmentLabel(viewAdmin.department)}</p>
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
                <span className="font-mono text-slate-800">{viewAdmin.createdAt ? formatDate(viewAdmin.createdAt) : '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-[11px] text-slate-400 block">Last Active IP</span>
                <span className="font-mono text-slate-800">{viewAdmin.lastLoginIp || 'Not recorded'}</span>
              </div>
            </div>

            {/* AUTH-008: sign-in history (Super Admin only, from NXA_LoginHistory) */}
            <div className="space-y-1 text-xs">
              <span className="font-semibold text-slate-800 block">Recent Sign-In Activity</span>
              {viewHistory === null ? (
                <p className="text-slate-400">Loading…</p>
              ) : viewHistoryError ? (
                <p className="text-rose-700">{viewHistoryError}</p>
              ) : viewHistory.length === 0 ? (
                <p className="text-slate-400 italic">No sign-in activity recorded.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                  {viewHistory.map((h) => (
                    <div key={h.id} className="p-2 flex justify-between gap-2">
                      <span className="font-mono text-slate-600">{new Date(h.timestamp).toLocaleString()}</span>
                      <span className="text-slate-500">{h.ipAddress || '—'}</span>
                      <Badge variant={h.status === 'success' ? 'success' : 'danger'} size="sm">
                        {h.status === 'success' ? 'SIGNED IN' : `FAILED${h.failureReason ? `: ${h.failureReason}` : ''}`}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
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
                  {DEPARTMENTS.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fine-grained permissions: not yet persisted or enforced server-side. */}
            <div className="border-t border-slate-100 pt-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <KeyRound className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  Module-level permissions (BR-018) will be assignable here once the approved permission catalog is
                  configured. Until then, every admin account has the standard Admin role access enforced by the server.
                </span>
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

      <OneTimePasswordModal
        password={oneTimePassword?.password ?? null}
        title={oneTimePassword?.title ?? ''}
        accountName={oneTimePassword?.name ?? ''}
        accountEmail={oneTimePassword?.email}
        sessionsRevoked={oneTimePassword?.sessionsRevoked}
        onClose={() => setOneTimePassword(null)}
      />
    </div>
  );
};
