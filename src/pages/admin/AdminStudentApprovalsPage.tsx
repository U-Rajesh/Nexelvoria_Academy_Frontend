import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  School,
  Mail,
  Phone,
  Calendar,
  FileText,
  Download,
  Eye,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  User,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
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
import { Linkedin, Github } from '../../components/common/SocialIcons';
import type { StudentProfile } from '../../types';

export const AdminStudentApprovalsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [rejectingStudent, setRejectingStudent] = useState<StudentProfile | null>(null);
  const [previewingResumeStudent, setPreviewingResumeStudent] = useState<StudentProfile | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  const loadStudents = () => {
    const list = getStorageItem<StudentProfile[]>(STORAGE_KEYS.STUDENTS, []);
    setStudents(list);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const pendingStudents = students.filter(
    (s) => s.adminApprovalStatus === 'pending' || s.accountState === 'pending_approval'
  );
  const displayStudents = activeTab === 'pending' ? pendingStudents : students;

  const handleApprove = async (student: StudentProfile) => {
    if (!user) return;
    setIsProcessing(true);
    const res = await adminService.approveStudentRegistration(
      { id: user.id, name: user.name },
      student.id,
      'Approved: Academic credentials & resume verified against enrollment requirements (BR-002).'
    );
    setIsProcessing(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Registration Approved',
        message: `${student.name} is now approved. Course selection and fee payment unlocked. (SRS Rule BR-002)`,
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Registration Approvals</h1>
          <p className="text-xs text-slate-500 mt-1">
            In strict enforcement of <strong>SRS Rule BR-002</strong>, all candidate applications and resumes must be vetted by Admissions before payment is accepted.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs self-start">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'pending'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Review ({pendingStudents.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Candidates ({students.length})
          </button>
        </div>
      </div>

      {/* Main List */}
      {displayStudents.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 bg-white">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">
            {activeTab === 'pending' ? 'Approval Queue Clear' : 'No Students Registered'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === 'pending'
              ? 'There are no pending registrations awaiting review at this time.'
              : 'Registered candidate records will appear here.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayStudents.map((student) => {
            const isPending =
              student.adminApprovalStatus === 'pending' || student.accountState === 'pending_approval';
            const isApproved = student.adminApprovalStatus === 'approved';
            const isRejected = student.adminApprovalStatus === 'rejected';

            return (
              <Card
                key={student.id}
                className={`p-5 sm:p-6 space-y-4 transition-all ${
                  isPending
                    ? 'border-amber-200 bg-amber-50/25 shadow-sm'
                    : isRejected
                    ? 'border-rose-200 bg-rose-50/20'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={
                        student.avatarUrl ||
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
                      }
                      alt={student.name}
                      className="h-12 w-12 rounded-xl object-cover border-2 border-indigo-100 shadow-xs"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">{student.name}</h2>
                        {isPending && (
                          <Badge variant="warning" size="sm" dot>
                            Awaiting Approval (BR-002)
                          </Badge>
                        )}
                        {isApproved && (
                          <Badge variant="success" size="sm" dot>
                            Approved & Active
                          </Badge>
                        )}
                        {isRejected && (
                          <Badge variant="danger" size="sm" dot>
                            Registration Rejected
                          </Badge>
                        )}
                        {student.isEmailVerified && student.isMobileVerified ? (
                          <Badge variant="info" size="sm">
                            Dual OTP Verified (BR-001)
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Unverified OTP
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Registered on {formatDate(student.createdAt)} • ID:{' '}
                        <span className="font-mono text-slate-700">{student.id}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Resume Inspection Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewingResumeStudent(student)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Inspect Resume</span>
                    </button>

                    {isPending && (
                      <>
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
                          Approve Candidate
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Grid of Registration Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {/* Academic Background */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Academic Education
                    </span>
                    <p className="font-semibold text-slate-900 truncate" title={student.collegeName}>
                      {student.collegeName || 'Osmania University'}
                    </p>
                    <p className="text-slate-500">
                      {student.degreeBranch || 'B.Tech CSE'} (Graduation: {student.passingYear || '2025'})
                    </p>
                  </div>

                  {/* Course of Interest */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Target Course & Details
                    </span>
                    <p className="font-semibold text-indigo-700 truncate" title={student.courseInterestedIn}>
                      {student.courseInterestedIn || 'Full Stack Development'}
                    </p>
                    <p className="text-slate-500">
                      DOB: {student.dateOfBirth || '2002-08-15'} • Gender: {student.gender || 'Prefer not to say'}
                    </p>
                  </div>

                  {/* Student & Guardian Contacts */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Candidate Contacts
                    </span>
                    <p className="flex items-center gap-1.5 text-slate-700 truncate">
                      <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">{student.email}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-700">
                      <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>+91 {student.mobile}</span>
                    </p>
                    {student.guardianContact && (
                      <p className="text-[11px] text-slate-500">
                        Guardian: <strong>+91 {student.guardianContact}</strong>
                      </p>
                    )}
                  </div>

                  {/* Resume & Portfolio Links */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Uploaded Documents & Links
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        <FileText className="h-3 w-3 text-indigo-500" />
                        <span className="truncate max-w-[110px]" title={student.resumeFileName || 'Student_CV.pdf'}>
                          {student.resumeFileName || 'Student_CV.pdf'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">({student.resumeFileSize || '1.5 MB'})</span>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      {student.linkedInUrl && (
                        <a
                          href={student.linkedInUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 hover:text-indigo-600 transition-colors"
                          title="LinkedIn Profile"
                        >
                          <Linkedin className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {student.githubUrl && (
                        <a
                          href={student.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 hover:text-slate-900 transition-colors"
                          title="GitHub Portfolio"
                        >
                          <Github className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Postal Address */}
                {student.fullAddress && (
                  <div className="pt-2 border-t border-slate-100/70 flex items-start gap-1.5 text-[11px] text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{student.fullAddress}</span>
                  </div>
                )}

                {/* Rejection Remarks if rejected */}
                {isRejected && student.adminApprovalRemarks && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <span className="font-semibold">Rejection Remarks:</span> {student.adminApprovalRemarks}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Resume Inspection Modal */}
      <Modal
        isOpen={!!previewingResumeStudent}
        onClose={() => setPreviewingResumeStudent(null)}
        title={`Candidate Resume: ${previewingResumeStudent?.name}`}
        size="md"
      >
        {previewingResumeStudent && (
          <div className="space-y-4 text-xs">
            {/* Meta Header */}
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                  PDF
                </div>
                <div>
                  <p className="font-bold text-slate-900">
                    {previewingResumeStudent.resumeFileName || 'Resume_Document.pdf'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Size: {previewingResumeStudent.resumeFileSize || '1.8 MB'} • Uploaded during registration
                  </p>
                </div>
              </div>

              <a
                href={previewingResumeStudent.resumeDataUrl || '#'}
                download={previewingResumeStudent.resumeFileName || 'Candidate_Resume.pdf'}
                onClick={(e) => {
                  if (!previewingResumeStudent.resumeDataUrl) {
                    e.preventDefault();
                    showToast({
                      type: 'info',
                      title: 'Simulated File Download',
                      message: `Initiating secure download for ${previewingResumeStudent.name}'s resume document.`,
                    });
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </a>
            </div>

            {/* Document Preview Frame (Simulated Paper Document) */}
            <div className="p-5 bg-white border border-slate-300 rounded-xl shadow-inner space-y-4 max-h-[380px] overflow-y-auto">
              <div className="text-center border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900">{previewingResumeStudent.name}</h3>
                <p className="text-[11px] text-slate-600">
                  {previewingStudentContact(previewingResumeStudent)}
                </p>
              </div>

              {/* Education section */}
              <div className="space-y-1">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-indigo-700 border-b border-slate-100 pb-1">
                  Education & Academic Credentials
                </h4>
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>{previewingResumeStudent.collegeName || 'Osmania University College of Engineering'}</span>
                  <span>{previewingResumeStudent.passingYear || '2025'}</span>
                </div>
                <p className="text-slate-600">{previewingResumeStudent.degreeBranch || 'B.Tech in Computer Science'}</p>
              </div>

              {/* Course Objective */}
              <div className="space-y-1">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-indigo-700 border-b border-slate-100 pb-1">
                  Target Course & Specialization
                </h4>
                <p className="text-slate-700">
                  Seeking intensive career advancement in{' '}
                  <strong>{previewingResumeStudent.courseInterestedIn || 'Full Stack Software Development'}</strong>.
                </p>
              </div>

              {/* Skills summary */}
              <div className="space-y-1">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-indigo-700 border-b border-slate-100 pb-1">
                  Technical Foundation
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  JavaScript, TypeScript, React, Python, Data Structures & Algorithms, Git, REST APIs, SQL Databases.
                </p>
              </div>

              {/* Verification status stamp */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Dual OTP Verified Candidate (BR-001)
                </span>
                <span className="font-mono">Nexelvoria Admissions Registry</span>
              </div>
            </div>

            {/* Quick Action Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setPreviewingResumeStudent(null)}>
                Close Preview
              </Button>
              {previewingResumeStudent.adminApprovalStatus === 'pending' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleApprove(previewingResumeStudent);
                    setPreviewingResumeStudent(null);
                  }}
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Approve Application
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Remarks Modal */}
      <Modal
        isOpen={!!rejectingStudent}
        onClose={() => setRejectingStudent(null)}
        title={`Reject Registration: ${rejectingStudent?.name}`}
        size="sm"
      >
        <form onSubmit={handleRejectConfirm} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason for Rejection *</label>
            <textarea
              rows={3}
              required
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              placeholder="e.g. Ineligible degree branch or missing academic verification documents..."
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
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

function previewingStudentContact(s: StudentProfile): string {
  const parts = [s.email, `+91 ${s.mobile}`];
  if (s.fullAddress) parts.push(s.fullAddress.split(',')[0]);
  return parts.join(' • ');
}
