import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Info, ShieldOff } from 'lucide-react';
import { adminService, type AdminCertificate } from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import { DataTable, type Column } from '../../components/tables/DataTable';

const MIN_REASON = 10;

/**
 * Certificate management (ADM / CER). Lists and revokes the certificates the
 * server holds. Issuing is not offered: BR-011 eligibility (attendance,
 * completion, passing marks) cannot be decided until open question Q8 and the
 * verified data sources are settled, and the server refuses issuing until then.
 */
export const AdminCertificatePage: React.FC = () => {
  const { showToast } = useNotification();
  const [certificates, setCertificates] = useState<AdminCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<AdminCertificate | null>(null);
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    const res = await adminService.getCertificates();
    setIsLoading(false);
    if (res.success) {
      setCertificates(res.data);
      setError(null);
    } else {
      setCertificates([]);
      setError(res.error || 'Certificates could not be loaded.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const confirmRevoke = async () => {
    if (!revoking || reason.trim().length < MIN_REASON) return;
    setIsSaving(true);
    const res = await adminService.revokeCertificate(revoking.id, reason.trim());
    setIsSaving(false);
    if (res.success && res.data) {
      setCertificates((prev) => prev.map((c) => (c.id === revoking.id ? res.data : c)));
      showToast({ type: 'info', title: 'Certificate revoked', message: `${revoking.certificateNumber} is now revoked.` });
      setRevoking(null);
      setReason('');
    } else {
      showToast({ type: 'error', title: 'Not revoked', message: res.error || 'Please retry.' });
    }
  };

  const columns: Column<AdminCertificate>[] = [
    {
      key: 'certificateNumber',
      header: 'Certificate',
      sortable: true,
      render: (c) => (
        <div>
          <span className="font-mono text-xs font-semibold text-slate-900 block">{c.certificateNumber}</span>
          <span className="text-[11px] text-slate-500">Issued {formatDate(c.issuedAt)}</span>
        </div>
      ),
    },
    {
      key: 'studentNameAtIssue',
      header: 'Student & course',
      sortable: true,
      render: (c) => (
        <div>
          <span className="font-semibold text-xs text-slate-900 block">{c.studentNameAtIssue}</span>
          <span className="text-[11px] text-slate-500">{c.courseNameAtIssue}</span>
        </div>
      ),
    },
    {
      key: 'attendancePercentage',
      header: 'Recorded at issue',
      render: (c) => (
        <span className="text-[11px] text-slate-600">
          Attendance {c.attendancePercentage}% · Completion {c.courseCompletionVerified ? 'verified' : 'not verified'} · Passing
          marks {c.passingMarksVerified ? 'verified' : 'not verified'}
        </span>
      ),
    },
    {
      key: 'certificateStatus',
      header: 'Status',
      sortable: true,
      render: (c) => (
        <Badge variant={c.certificateStatus === 'valid' ? 'success' : 'danger'} size="sm" dot>
          {c.certificateStatus === 'valid' ? 'Valid' : 'Revoked'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/verify-certificate?id=${encodeURIComponent(c.certificateNumber)}`}
            className="text-[11px] font-semibold text-indigo-600 hover:underline"
          >
            Public check
          </Link>
          {c.certificateStatus === 'valid' && (
            <Button
              variant="outline"
              size="sm"
              className="text-[11px] border-rose-200 text-rose-600 hover:bg-rose-50"
              onClick={() => {
                setRevoking(c);
                setReason('');
              }}
            >
              Revoke
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-xs">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Award className="h-6 w-6 text-indigo-600" /> Certificate Management
        </h1>
        <p className="text-slate-500 mt-1">Certificates recorded on the server, with public verification and revocation.</p>
      </div>

      <Card className="p-4 border-amber-200 bg-amber-50 text-amber-900 flex gap-2">
        <ShieldOff className="h-4 w-4 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Issuing new certificates is not available yet</p>
          <p>
            BR-011 requires completion, at least 75% attendance and passing marks. Course passing marks (open question Q8)
            and verified attendance and completion data are not yet available, so eligibility cannot be determined and
            the server does not issue certificates. Existing certificates can still be viewed, verified and revoked.
          </p>
        </div>
      </Card>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-3">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading certificates…</p>
      ) : certificates.length === 0 && !error ? (
        <p className="text-sm text-slate-500 flex items-center gap-2">
          <Info className="h-4 w-4" /> No certificates have been recorded.
        </p>
      ) : (
        <DataTable data={certificates} columns={columns} searchPlaceholder="Search certificate, student or course..." pageSize={15} />
      )}

      <Modal isOpen={revoking !== null} onClose={() => setRevoking(null)} title="Revoke certificate" size="md">
        <div className="space-y-3 text-xs text-slate-700">
          <p>
            Revoking <strong>{revoking?.certificateNumber}</strong> ({revoking?.studentNameAtIssue}) makes public verification
            report it as revoked. The reason is recorded.
          </p>
          <label htmlFor="revoke-reason" className="block font-semibold text-slate-700">
            Reason * <span className="font-normal text-slate-400">(at least {MIN_REASON} characters)</span>
          </label>
          <textarea
            id="revoke-reason"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setRevoking(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isSaving}
              disabled={reason.trim().length < MIN_REASON}
              onClick={confirmRevoke}
            >
              Revoke
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
