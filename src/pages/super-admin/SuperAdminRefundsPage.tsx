import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  Receipt,
  ArrowRight,
  Info,
  Clock,
  History,
  FileText,
  User,
  CreditCard,
  Building,
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatINR, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import { MetricCard } from '../../components/charts/MetricCard';
import type { RefundRequest } from '../../types';

export const SuperAdminRefundsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [approveModal, setApproveModal] = useState<RefundRequest | null>(null);
  const [approveRemarks, setApproveRemarks] = useState('');
  const [rejectModal, setRejectModal] = useState<RefundRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailsModal, setDetailsModal] = useState<RefundRequest | null>(null);

  const loadRefunds = async () => {
    setIsLoading(true);
    const res = await superAdminService.getRefundRequests();
    if (res.success) setRefunds(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadRefunds();
  }, []);

  const pendingRefunds = refunds.filter((r) => r.status === 'pending_super_admin');
  const approvedRefunds = refunds.filter((r) => r.status === 'approved');
  const rejectedRefunds = refunds.filter((r) => r.status === 'rejected');

  const pendingTotal = pendingRefunds.reduce((sum, r) => sum + r.amountINR, 0);
  const approvedTotal = approvedRefunds.reduce((sum, r) => sum + r.amountINR, 0);

  const handleConfirmApprove = async () => {
    if (!user || !approveModal) return;
    setIsProcessing(true);
    const res = await superAdminService.approveRefund(
      { id: user.id, name: user.name },
      approveModal.id,
      approveRemarks || 'Approved by Super Admin after review.'
    );
    setIsProcessing(false);

    if (res.success && res.data) {
      setRefunds((prev) => prev.map((r) => (r.id === approveModal.id ? res.data : r)));
      setApproveModal(null);
      setApproveRemarks('');
      showToast({
        type: 'success',
        title: 'Refund Authorized (BR-006)',
        message: `Refund of ${formatINR(approveModal.amountINR)} authorized for ${approveModal.studentName}. Internal financial sign-off recorded.`,
      });
    } else {
      showToast({ type: 'error', title: 'Approval Failed', message: res.error || 'Failed to approve refund.' });
    }
  };

  const handleConfirmReject = async () => {
    if (!user || !rejectModal) return;
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      showToast({ type: 'warning', message: 'A mandatory rejection justification must be provided.' });
      return;
    }

    setIsProcessing(true);
    const res = await superAdminService.rejectRefund(
      { id: user.id, name: user.name },
      rejectModal.id,
      rejectReason.trim()
    );
    setIsProcessing(false);

    if (res.success && res.data) {
      setRefunds((prev) => prev.map((r) => (r.id === rejectModal.id ? res.data : r)));
      setRejectModal(null);
      setRejectReason('');
      showToast({
        type: 'info',
        title: 'Refund Request Rejected',
        message: `Refund request for ${rejectModal.studentName} has been rejected. Mandatory justification recorded in audit log.`,
      });
    } else {
      showToast({ type: 'error', title: 'Rejection Failed', message: res.error || 'Failed to reject refund.' });
    }
  };

  const filteredRefunds = useMemo(() => {
    return refunds.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.studentName.toLowerCase().includes(q);
        const matchesCourse = r.courseTitle.toLowerCase().includes(q);
        const matchesId = r.id.toLowerCase().includes(q);
        const matchesTrans = r.transactionId.toLowerCase().includes(q);
        return matchesName || matchesCourse || matchesId || matchesTrans;
      }
      return true;
    });
  }, [refunds, statusFilter, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Refund Authorizations</h1>
            <Badge variant="danger" size="sm">
              Exclusive to Super Admin (BR-006)
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            In strict compliance with <strong>SRS Rule BR-006</strong>, tuition refunds and fee reversals are exclusively
            authorized by the Super Administrator (Institute Owner). Admins and teachers cannot authorize refunds.
          </p>
        </div>
      </div>

      {/* Financial Health Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Pending Sign-Offs"
          value={`${pendingRefunds.length} Requests`}
          subtitle={formatINR(pendingTotal)}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBgColor="bg-rose-50 text-rose-600"
        />

        <MetricCard
          title="Total Approved Refunds"
          value={formatINR(approvedTotal)}
          subtitle={`${approvedRefunds.length} Transactions Authorized`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
        />

        <MetricCard
          title="Total Rejected Requests"
          value={`${rejectedRefunds.length} Cases`}
          subtitle="Policy Non-Compliant"
          icon={<XCircle className="h-5 w-5" />}
          iconBgColor="bg-slate-100 text-slate-700"
        />

        <MetricCard
          title="Total Claim Volume"
          value={formatINR(pendingTotal + approvedTotal)}
          subtitle={`${refunds.length} Lifetime Claims`}
          icon={<Receipt className="h-5 w-5" />}
          iconBgColor="bg-indigo-50 text-indigo-600"
        />
      </div>

      {/* Gateway Real-Time Disclaimer Banner */}
      <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-rose-900/40 flex items-start gap-3 shadow-xs">
        <Info className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-white">Payment Gateway Settlement Notice (SRS Audit Rule):</p>
          <p className="text-slate-300 leading-relaxed">
            Approving a refund on this governance console records the <strong>internal administrative and accounting authorization</strong>.
            The actual banking payment reversal is executed asynchronously via the payment gateway webhook (Razorpay / Stripe payout APIs)
            or manual NEFT reversal.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, course, refund ID, transaction ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="all">All Request Statuses ({refunds.length})</option>
              <option value="pending_super_admin">Pending Super Admin Sign-off ({pendingRefunds.length})</option>
              <option value="approved">Approved &amp; Reconciled ({approvedRefunds.length})</option>
              <option value="rejected">Rejected ({rejectedRefunds.length})</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Refunds Table */}
      <Card className="overflow-hidden shadow-xs border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Claim ID &amp; Date</th>
                <th className="py-3 px-4">Candidate &amp; Course</th>
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Requested Refund</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Justification Note</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No refund requests found matching the current criteria.
                  </td>
                </tr>
              ) : (
                filteredRefunds.map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 block">{ref.id}</span>
                      <span className="text-[11px] text-slate-400">
                        {ref.requestedAt ? formatDate(ref.requestedAt) : 'Recently'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{ref.studentName}</span>
                      <span className="text-[11px] text-slate-500">{ref.courseTitle}</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                        {ref.transactionId}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-sm font-extrabold text-slate-900">
                        {formatINR(ref.amountINR)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge
                        variant={
                          ref.status === 'approved'
                            ? 'success'
                            : ref.status === 'rejected'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                        dot
                      >
                        {ref.status === 'pending_super_admin' ? 'AWAITING OWNER (BR-006)' : ref.status.toUpperCase()}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 italic">
                      "{ref.reason}"
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailsModal(ref)}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          Details
                        </Button>

                        {ref.status === 'pending_super_admin' && (
                          <>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setApproveModal(ref)}
                              leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRejectModal(ref)}
                              leftIcon={<XCircle className="h-3.5 w-3.5 text-rose-500" />}
                            >
                              Reject
                            </Button>
                          </>
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

      {/* Modal 1: Approve Refund Confirmation */}
      {approveModal && (
        <Modal
          isOpen={!!approveModal}
          onClose={() => setApproveModal(null)}
          title="Authorize Tuition Fee Refund (BR-006)"
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-950 text-sm">
                  Candidate: {approveModal.studentName}
                </span>
                <span className="text-base font-extrabold text-rose-900">
                  {formatINR(approveModal.amountINR)}
                </span>
              </div>
              <p className="text-rose-800 text-[11px]">{approveModal.courseTitle}</p>
              <p className="text-slate-600 text-[11px] italic pt-1">
                Stated Reason: "{approveModal.reason}"
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 leading-relaxed text-[11px]">
              <strong>Accounting Consequence:</strong> Approving this request will mark the ledger transaction as
              <span className="font-semibold text-rose-700"> REFUNDED</span>, unlock seat capacity in the course batch,
              and record an immutable audit entry signed by Super Admin.
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Super Admin Remarks / Authorization Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Enter justification notes (e.g. Relocation documents inspected, full concession approved)..."
                value={approveRemarks}
                onChange={(e) => setApproveRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setApproveModal(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isProcessing}
                onClick={handleConfirmApprove}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
              >
                Sign &amp; Authorize Refund
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 2: Reject Refund Confirmation (Mandatory Reason) */}
      {rejectModal && (
        <Modal
          isOpen={!!rejectModal}
          onClose={() => setRejectModal(null)}
          title="Reject Refund Request (Mandatory Justification)"
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 leading-relaxed">
              You are rejecting the refund request of <strong>{formatINR(rejectModal.amountINR)}</strong> for{' '}
              <strong>{rejectModal.studentName}</strong>. A mandatory reason must be recorded in the audit trail.
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Mandatory Rejection Justification *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Specify policy violation or grounds for rejection (e.g., Refund window exceeded, attendance criteria violated)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setRejectModal(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isProcessing}
                onClick={handleConfirmReject}
              >
                Reject Request
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 3: View Full Refund Details */}
      {detailsModal && (
        <Modal
          isOpen={!!detailsModal}
          onClose={() => setDetailsModal(null)}
          title={`Refund Claim: ${detailsModal.id}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-400 block">Candidate Name</span>
                <span className="font-bold text-slate-900">{detailsModal.studentName}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Claim Amount</span>
                <span className="text-sm font-extrabold text-slate-900">
                  {formatINR(detailsModal.amountINR)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Course Name</span>
                <span className="font-semibold text-slate-800">{detailsModal.courseTitle}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Transaction Reference</span>
                <span className="font-mono text-slate-800">{detailsModal.transactionId}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Submission Date</span>
                <span className="font-mono text-slate-800">
                  {detailsModal.requestedAt ? formatDate(detailsModal.requestedAt) : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Current Status</span>
                <Badge
                  variant={
                    detailsModal.status === 'approved'
                      ? 'success'
                      : detailsModal.status === 'rejected'
                      ? 'danger'
                      : 'warning'
                  }
                  size="sm"
                  dot
                >
                  {detailsModal.status.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-700">Student's Stated Reason</span>
              <p className="p-3 bg-slate-50 rounded-md border border-slate-200 text-slate-700 italic">
                "{detailsModal.reason}"
              </p>
            </div>

            {detailsModal.superAdminRemarks && (
              <div className="space-y-1">
                <span className="font-semibold text-slate-700">Super Admin Decision Notes</span>
                <p className="p-3 bg-rose-50/50 rounded-md border border-rose-200 text-slate-800">
                  {detailsModal.superAdminRemarks}
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setDetailsModal(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
