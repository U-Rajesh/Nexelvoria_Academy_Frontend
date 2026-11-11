import React, { useState, useEffect } from 'react';
import { UserCheck, CheckCircle2, XCircle, School, Mail, Phone, Calendar, ShieldAlert } from 'lucide-react';
import { getStorageItem } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/appConfig';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import type { StudentProfile } from '../../types';

export const AdminStudentApprovalsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [rejectingStudent, setRejectingStudent] = useState<StudentProfile | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadStudents = () => {
    const list = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);
    setStudents(list);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const pendingStudents = students.filter((s) => s.adminApprovalStatus === 'pending');

  const handleApprove = async (student: StudentProfile) => {
    if (!user) return;
    setIsProcessing(true);
    const res = await adminService.approveStudentRegistration(
      { id: user.id, name: user.name },
      student.id,
      'Approved: Academic credentials verified against enrollment eligibility.'
    );
    setIsProcessing(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Registration Approved',
        message: `${student.name} is now approved. Course selection and payment unlocked. (SRS Rule BR-002)`,
      });
      loadStudents();
    }
  };

  const handleRejectConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingStudent || !user || !rejectRemarks.trim()) return;

    setIsProcessing(true);
    const res = await adminService.rejectStudentRegistration(
      { id: user.id, name: user.name },
      rejectingStudent.id,
      rejectRemarks
    );
    setIsProcessing(false);
    setRejectingStudent(null);
    setRejectRemarks('');

    if (res.success) {
      showToast({
        type: 'info',
        title: 'Registration Rejected',
        message: `Student application for ${rejectingStudent.name} has been rejected.`,
      });
      loadStudents();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Registration Approvals</h1>
        <p className="text-xs text-slate-500 mt-1">
          In strict enforcement of <strong>SRS Rule BR-002</strong>, students must be reviewed and approved by an Administrator before payment can be accepted.
        </p>
      </div>

      {pendingStudents.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 bg-white">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">Approval Queue Clear</h3>
          <p className="text-xs text-slate-500 mt-1">
            There are no pending registrations awaiting review at this time.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingStudents.map((student) => (
            <Card key={student.id} className="p-6 space-y-4 border-amber-200 bg-amber-50/20 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                <div className="flex items-center gap-3">
                  <img
                    src={student.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'}
                    alt={student.name}
                    className="h-12 w-12 rounded-full object-cover border-2 border-amber-300"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{student.name}</h3>
                      <Badge variant="warning" size="sm" dot>Pending Approval (BR-002)</Badge>
                      <Badge variant="success" size="sm">Dual OTP Verified</Badge>
                    </div>
                    <p className="text-xs text-slate-500">Registered: {formatDate(student.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-600 border-rose-200 hover:bg-rose-50"
                    onClick={() => {
                      setRejectingStudent(student);
                      setRejectRemarks('');
                    }}
                    disabled={isProcessing}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(student)}
                    disabled={isProcessing}
                    leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    Approve Application
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-700">
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block">Academic Qualification</span>
                  <span className="font-semibold block">{student.collegeName}</span>
                  <span className="text-slate-500">{student.degreeBranch} (Batch {student.passingYear})</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block">Course of Interest</span>
                  <span className="font-semibold text-indigo-700 block">{student.courseInterestedIn}</span>
                  <span className="text-slate-500">DOB: {student.dateOfBirth} • {student.gender}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block">Contact Info</span>
                  <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-slate-400" /> {student.email}</span>
                  <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-slate-400" /> +91 {student.mobile}</span>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-500">
                <span>Address: {student.fullAddress}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectingStudent}
        onClose={() => setRejectingStudent(null)}
        title={`Reject Registration: ${rejectingStudent?.name}`}
        size="sm"
      >
        <form onSubmit={handleRejectConfirm} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Reason for Rejection *
            </label>
            <textarea
              rows={3}
              required
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              placeholder="e.g. Ineligible degree branch or missing academic verification documents..."
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setRejectingStudent(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" type="submit" isLoading={isProcessing}>
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

