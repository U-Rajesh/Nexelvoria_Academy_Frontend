import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, ShieldCheck, XCircle, Search, ExternalLink, Plus } from 'lucide-react';
import { getStorageItem, setStorageItem } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/appConfig';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { Modal } from '../../components/feedback/Modal';
import type { CertificateRecord } from '../../types';

export const AdminCertificatePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [certificates, setCertificates] = useState<CertificateRecord[]>(
    getStorageItem<CertificateRecord[]>(STORAGE_KEYS.CERTIFICATES, [])
  );

  const [revokingCert, setRevokingCert] = useState<CertificateRecord | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRevokeConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokingCert || !user || !revokeReason.trim()) return;

    setIsProcessing(true);
    const res = await adminService.revokeCertificate(
      { id: user.id, name: user.name },
      revokingCert.id,
      revokeReason
    );
    setIsProcessing(false);
    setRevokingCert(null);
    setRevokeReason('');

    if (res.success && res.data) {
      setCertificates((prev) => prev.map((c) => (c.id === res.data.id ? res.data : c)));
      showToast({
        type: 'warning',
        title: 'Certificate Revoked',
        message: `Certificate ${res.data.certificateNumber} has been revoked. (SRS Rule CER-008)`,
      });
    }
  };

  const columns: Column<CertificateRecord>[] = [
    {
      key: 'certificateNumber',
      header: 'Certificate ID',
      sortable: true,
      render: (c) => <span className="font-mono text-xs font-bold text-slate-900">{c.certificateNumber}</span>,
    },
    {
      key: 'studentName',
      header: 'Student Name',
      sortable: true,
      render: (c) => <span className="font-semibold text-slate-800 text-xs">{c.studentName}</span>,
    },
    {
      key: 'courseTitle',
      header: 'Program Title',
      render: (c) => <span className="text-xs text-slate-600 line-clamp-1">{c.courseTitle}</span>,
    },
    {
      key: 'attendancePercentage',
      header: 'Attendance %',
      sortable: true,
      render: (c) => <span className="text-xs font-semibold">{c.attendancePercentage}%</span>,
    },
    {
      key: 'examScorePercentage',
      header: 'Exam Score',
      sortable: true,
      render: (c) => <span className="text-xs font-semibold">{c.examScorePercentage}%</span>,
    },
    {
      key: 'status',
      header: 'Status (CER-008)',
      sortable: true,
      render: (c) => (
        <Badge variant={c.status === 'valid' ? 'success' : 'danger'} size="sm" dot>
          {c.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c) => (
        <div className="flex items-center gap-3">
          <Link
            to={c.qrVerificationUrl}
            target="_blank"
            className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
          >
            Verify <ExternalLink className="h-3 w-3" />
          </Link>
          {c.status === 'valid' && (
            <button
              onClick={() => {
                setRevokingCert(c);
                setRevokeReason('');
              }}
              className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
            >
              Revoke
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Certificate Registry & Revocation</h1>
        <p className="text-xs text-slate-500 mt-1">
          Inspect generated certificates, audit candidate criteria (BR-011), and revoke fraudulent credentials with audited justification (SRS CER-008).
        </p>
      </div>

      <DataTable
        data={certificates}
        columns={columns}
        searchPlaceholder="Search certificate ID or student..."
        pageSize={10}
      />

      {/* Revocation Modal */}
      <Modal
        isOpen={!!revokingCert}
        onClose={() => setRevokingCert(null)}
        title={`Revoke Certificate: ${revokingCert?.certificateNumber}`}
        size="sm"
      >
        <form onSubmit={handleRevokeConfirm} className="space-y-4 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
            <strong>Warning:</strong> Revoking a certificate permanently flags the public verification URL as revoked.
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Revocation Reason (Required for Audit Trail) *
            </label>
            <textarea
              rows={3}
              required
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="e.g. Plagiarism discovered in capstone code / administrative error..."
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setRevokingCert(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" type="submit" isLoading={isProcessing}>
              Confirm Revocation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

