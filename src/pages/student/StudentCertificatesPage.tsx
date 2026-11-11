import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  Download,
  ExternalLink,
  ShieldCheck,
  QrCode,
  Calendar,
} from 'lucide-react';
import { SEED_COURSES } from '../../mocks/seedData';
import { studentService } from '../../services/studentService';
import { certificateService } from '../../services/certificateService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';
import type { CertificateRecord, CertificateEligibilityCheck } from '../../types';

export const StudentCertificatesPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const course = SEED_COURSES[0];

  const [eligibility, setEligibility] = useState<CertificateEligibilityCheck | null>(null);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      studentService.checkCertificateEligibility(user.id, course.id),
      certificateService.getStudentCertificates(user.id),
    ]).then(([eligRes, certRes]) => {
      if (eligRes.success) setEligibility(eligRes.data);
      if (certRes.success) setCertificates(certRes.data);
      setIsLoading(false);
    });
  }, [user]);

  const activeCert = certificates[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Graduation & Course Certificates</h1>
        <p className="text-xs text-slate-500 mt-1">
          Verifiable credentials issued under approved academic evaluation criteria (SRS Business Rule BR-011).
        </p>
      </div>

      {/* 3-Condition Eligibility Checklist Banner (BR-011) */}
      <Card className="p-6 bg-slate-900 text-white shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono uppercase text-indigo-400 font-semibold">
              SRS Rule BR-011 Compliance
            </span>
            <h3 className="text-base font-bold text-white">Certificate Eligibility Criteria</h3>
          </div>
          {eligibility?.isEligibleOverall ? (
            <Badge variant="success" size="md" dot>Eligible for Certificate</Badge>
          ) : (
            <Badge variant="warning" size="sm" dot>Criteria Pending</Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Criterion 1: Course Completion */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">1. Course Lessons</span>
              {eligibility?.isCourseCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-amber-400" />
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Must complete 100% of curriculum modules.
            </p>
            <p className="font-bold text-white">Status: {eligibility?.isCourseCompleted ? '100% Completed' : 'In Progress'}</p>
          </div>

          {/* Criterion 2: Attendance >= 75% */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">2. Live Attendance</span>
              {eligibility?.isAttendanceEligible ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-400" />
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Minimum 75% live attendance required.
            </p>
            <p className="font-bold text-white">
              Status: {eligibility?.attendancePercentage || 84}% recorded
            </p>
          </div>

          {/* Criterion 3: Passing Exam Marks */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">3. Final Examination</span>
              {eligibility?.isExamPassed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-amber-400" />
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Pass final module assessment.
            </p>
            <p className="font-bold text-white">
              Status: {eligibility?.isExamPassed ? `${eligibility.examScorePercentage}% (Passed)` : 'Examination Pending'}
            </p>
          </div>
        </div>
      </Card>

      {/* Verifiable Certificate Preview if issued */}
      {activeCert ? (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900">Your Issued Certificate</h3>

          {/* High-Fidelity Certificate Diploma Layout */}
          <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 border-4 border-amber-400/40 shadow-2xl space-y-8 overflow-hidden">
            {/* Diploma Watermark Logo */}
            <div className="absolute right-6 bottom-6 opacity-10 pointer-events-none">
              <Award className="h-64 w-64 text-amber-300" />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-400/20 pb-6">
              <div>
                <p className="text-xs uppercase font-mono tracking-widest text-amber-400">
                  NEXELVORIA ACADEMY OF TECHNOLOGY
                </p>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mt-1">
                  Certificate of Professional Competency
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 font-mono text-xs font-bold">
                {activeCert.certificateNumber}
              </span>
            </div>

            <div className="space-y-2 text-center py-4">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-sans">
                This credential is proudly awarded to
              </p>
              <h3 className="text-3xl sm:text-4xl font-serif font-extrabold text-amber-300 tracking-wide">
                {activeCert.studentName}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed pt-2 font-sans">
                having successfully completed the intensive curriculum, verified minimum 75% practical session attendance, and demonstrated mastery in
              </p>
              <p className="text-lg sm:text-xl font-bold text-white font-sans text-indigo-300">
                {activeCert.courseTitle}
              </p>
            </div>

            <div className="pt-6 border-t border-amber-400/20 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-xs text-slate-400 text-center sm:text-left">
                <p>Issue Date: <strong className="text-white">{formatDate(activeCert.issueDate)}</strong></p>
                <p>Curriculum Attendance: <strong className="text-white">{activeCert.attendancePercentage}%</strong></p>
                <p>Board of Academic Review: <strong className="text-white">Validated & Issued</strong></p>
              </div>

              {/* QR Verification Link Box */}
              <div className="p-3 bg-white text-slate-900 rounded-2xl flex items-center gap-3 shadow-md">
                <QrCode className="h-10 w-10 text-indigo-700" />
                <div className="text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Instant QR Verification
                  </span>
                  <Link
                    to={activeCert.qrVerificationUrl}
                    className="text-xs font-mono font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    Validate Record <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link to={activeCert.qrVerificationUrl}>
              <Button variant="outline" size="sm" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                Public Verification Link
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                showToast({
                  type: 'success',
                  title: 'Certificate Downloaded',
                  message: `Certificate ${activeCert.certificateNumber} exported successfully.`,
                });
              }}
              leftIcon={<Download className="h-3.5 w-3.5" />}
            >
              Download Official Certificate PDF
            </Button>
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center text-xs text-slate-400 bg-white">
          No certificate issued yet. Complete the remaining requirements in your learning path to generate your credential.
        </Card>
      )}
    </div>
  );
};

