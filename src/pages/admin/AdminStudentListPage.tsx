import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  UserPlus,
  Download,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  School,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ExternalLink,
  Lock,
  Unlock,
  FileText,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { Modal } from '../../components/feedback/Modal';
import { Card } from '../../components/common/Card';
import type { StudentProfile } from '../../types';

export const AdminStudentListPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [accountStateFilter, setAccountStateFilter] = useState<string>('all');

  const loadStudents = async () => {
    const res = await adminService.getStudents();
    if (res.success) setStudents(res.data);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleStatusToggle = async (student: StudentProfile) => {
    if (!user) return;
    const nextStatus = student.status === 'active' ? 'suspended' : 'active';
    const res = await adminService.updateStudentStatus({ id: user.id, name: user.name }, student.id, nextStatus);

    if (res.success) {
      showToast({
        type: 'info',
        title: 'Status Updated',
        message: `${student.name}'s account is now ${nextStatus.toUpperCase()}.`,
      });
      loadStudents();
      if (selectedStudent && selectedStudent.id === student.id) {
        setSelectedStudent(res.data);
      }
    }
  };

  const handleUnlockAccount = async (student: StudentProfile) => {
    if (!user) return;
    const res = await adminService.unlockStudentAccount({ id: user.id, name: user.name }, student.id);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Account Unlocked',
        message: `Account lockout cleared for ${student.name}.`,
      });
      loadStudents();
      if (selectedStudent && selectedStudent.id === student.id) {
        setSelectedStudent(res.data);
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Mobile', 'College', 'Degree', 'Passing Year', 'Course', 'Approval', 'State', 'Status'];
    const rows = students.map((s) => [
      s.id,
      `"${s.name}"`,
      s.email,
      s.mobile,
      `"${s.collegeName || ''}"`,
      `"${s.degreeBranch || ''}"`,
      s.passingYear || '',
      `"${s.courseInterestedIn || ''}"`,
      s.adminApprovalStatus,
      s.accountState || s.status,
      s.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexelvoria_students_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({
      type: 'success',
      title: 'Export Complete',
      message: 'Student directory exported to CSV format.',
    });
  };

  const filteredStudents = students.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (approvalFilter !== 'all' && s.adminApprovalStatus !== approvalFilter) return false;
    if (accountStateFilter !== 'all' && s.accountState !== accountStateFilter) return false;
    return true;
  });

  const columns: Column<StudentProfile>[] = [
    {
      key: 'name',
      header: 'Student Name',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <img
            src={s.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
            className="h-8 w-8 rounded-full object-cover border border-slate-200"
            alt={s.name}
          />
          <div>
            <span className="font-bold text-slate-900 block text-xs">{s.name}</span>
            <span className="text-[11px] text-slate-500 font-mono">{s.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'collegeName',
      header: 'College & Degree',
      render: (s) => (
        <div>
          <span className="font-semibold text-slate-800 block text-xs truncate max-w-[200px]">{s.collegeName || 'N/A'}</span>
          <span className="text-[11px] text-slate-500">{s.degreeBranch || ''} ({s.passingYear || ''})</span>
        </div>
      ),
    },
    {
      key: 'courseInterestedIn',
      header: 'Target Track',
      render: (s) => (
        <span className="text-xs font-medium text-indigo-700 block truncate max-w-[180px]">
          {s.courseInterestedIn || 'Full Stack Track'}
        </span>
      ),
    },
    {
      key: 'adminApprovalStatus',
      header: 'Approval Gate (BR-002)',
      sortable: true,
      render: (s) => (
        <Badge
          variant={
            s.adminApprovalStatus === 'approved'
              ? 'success'
              : s.adminApprovalStatus === 'rejected'
              ? 'danger'
              : 'warning'
          }
          size="sm"
          dot
        >
          {s.adminApprovalStatus.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'accountState',
      header: 'Account State',
      sortable: true,
      render: (s) => {
        const state = s.accountState || (s.status === 'active' ? 'approved' : 'pending_approval');
        let variant: 'success' | 'danger' | 'warning' | 'neutral' | 'info' = 'neutral';
        if (state === 'approved') variant = 'success';
        else if (state === 'locked' || state === 'suspended' || state === 'rejected') variant = 'danger';
        else if (state === 'pending_approval' || state === 'pending_verification') variant = 'warning';

        return (
          <Badge variant={variant} size="sm">
            {state.toUpperCase().replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (s) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedStudent(s)}
            className="text-xs text-indigo-600 hover:bg-indigo-50"
            leftIcon={<Eye className="h-3.5 w-3.5" />}
          >
            Details
          </Button>

          {s.accountState === 'locked' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUnlockAccount(s)}
              className="text-[11px] border-amber-300 text-amber-700 hover:bg-amber-50"
              leftIcon={<Unlock className="h-3 w-3" />}
            >
              Unlock
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusToggle(s)}
              className={`text-[11px] ${
                s.status === 'active'
                  ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              {s.status === 'active' ? 'Suspend' : 'Activate'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Directory (ADM-002)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, inspect academic credentials, manage 6-level account states, and export candidate records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Export CSV
          </Button>
          <Link to="/admin/students/add">
            <Button variant="primary" size="sm" leftIcon={<UserPlus className="h-4 w-4" />}>
              Add Student
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white border border-slate-200 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter By:</span>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 text-slate-800"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
            <option value="pending">Pending Only</option>
          </select>
        </div>

        <div>
          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 text-slate-800"
          >
            <option value="all">All Approvals (BR-002)</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Review</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div>
          <select
            value={accountStateFilter}
            onChange={(e) => setAccountStateFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 text-slate-800"
          >
            <option value="all">All Account States</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
            <option value="locked">Locked</option>
          </select>
        </div>

        <span className="ml-auto text-xs font-mono text-slate-500">
          Showing {filteredStudents.length} of {students.length} candidates
        </span>
      </Card>

      {/* Main Table */}
      <DataTable
        data={filteredStudents}
        columns={columns}
        searchPlaceholder="Search student name, email, college or target track..."
        pageSize={10}
      />

      {/* Student Details Modal */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title={`Candidate Dossier: ${selectedStudent.name}`}
          size="lg"
        >
          <div className="space-y-6 text-xs text-slate-700">
            {/* Header Profile Info */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <img
                src={selectedStudent.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                className="h-16 w-16 rounded-full object-cover border border-slate-300"
                alt={selectedStudent.name}
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{selectedStudent.name}</h3>
                  <Badge
                    variant={
                      selectedStudent.adminApprovalStatus === 'approved'
                        ? 'success'
                        : selectedStudent.adminApprovalStatus === 'rejected'
                        ? 'danger'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {selectedStudent.adminApprovalStatus.toUpperCase()} (BR-002)
                  </Badge>
                  <Badge
                    variant={
                      selectedStudent.accountState === 'locked' || selectedStudent.status === 'suspended'
                        ? 'danger'
                        : selectedStudent.status === 'active'
                        ? 'success'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {(selectedStudent.accountState || selectedStudent.status).toUpperCase()}
                  </Badge>
                </div>
                <p className="text-slate-500 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> {selectedStudent.email} • <Phone className="h-3.5 w-3.5 ml-2" /> +91 {selectedStudent.mobile}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">Student ID: {selectedStudent.id}</p>
              </div>
            </div>

            {/* Academic Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <School className="h-4 w-4 text-indigo-600" /> Academic Background
                </h4>
                <div>
                  <span className="text-slate-400 block text-[11px]">College / University:</span>
                  <span className="font-semibold text-slate-800">{selectedStudent.collegeName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Degree & Specialization:</span>
                  <span className="font-semibold text-slate-800">{selectedStudent.degreeBranch || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Graduation Passing Year:</span>
                  <span className="font-semibold text-slate-800">{selectedStudent.passingYear || 'N/A'}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-indigo-600" /> Personal & Residential
                </h4>
                <div>
                  <span className="text-slate-400 block text-[11px]">Date of Birth:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedStudent.dateOfBirth || 'N/A'} ({selectedStudent.gender || 'N/A'})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Permanent Address:</span>
                  <span className="font-semibold text-slate-800">{selectedStudent.fullAddress || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Guardian Contact:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedStudent.guardianContact ? `+91 ${selectedStudent.guardianContact}` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Documents & Portfolios */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-indigo-600" /> Resume & Documents
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Resume File:</span>
                <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {selectedStudent.resumeFileName || 'Candidate_CV.pdf'}
                </span>
                <span className="text-slate-400">({selectedStudent.resumeFileSize || '1.5 MB'})</span>
              </div>

              {selectedStudent.linkedInUrl && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <ExternalLink className="h-3.5 w-3.5 text-indigo-600" />
                  <a
                    href={selectedStudent.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2">
                {selectedStudent.accountState === 'locked' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUnlockAccount(selectedStudent)}
                    leftIcon={<Unlock className="h-3.5 w-3.5" />}
                  >
                    Clear Lockout & Unlock
                  </Button>
                )}
                <Button
                  variant={selectedStudent.status === 'active' ? 'danger' : 'primary'}
                  size="sm"
                  onClick={() => handleStatusToggle(selectedStudent)}
                >
                  {selectedStudent.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={() => setSelectedStudent(null)}>
                Close Dossier
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
