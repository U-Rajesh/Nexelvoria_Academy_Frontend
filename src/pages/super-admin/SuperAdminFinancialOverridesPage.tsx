import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Search,
  Filter,
  DollarSign,
  User,
  Building,
  Receipt,
  ArrowRight,
  TrendingDown,
  Info,
  Calendar,
  Sparkles,
  HelpCircle,
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
import type { FinancialOverrideRequest } from '../../types';

export const SuperAdminFinancialOverridesPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [overrides, setOverrides] = useState<FinancialOverrideRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals
  const [approveModal, setApproveModal] = useState<FinancialOverrideRequest | null>(null);
  const [approveRemarks, setApproveRemarks] = useState('');
  const [rejectModal, setRejectModal] = useState<FinancialOverrideRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailsModal, setDetailsModal] = useState<FinancialOverrideRequest | null>(null);

  const loadOverrides = async () => {
    setIsLoading(true);
    const res = await superAdminService.getFinancialOverrides();
    if (res.success) setOverrides(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadOverrides();
  }, []);

  const pendingOverrides = overrides.filter((o) => o.status === 'pending');
  const approvedOverrides = overrides.filter((o) => o.status === 'approved');
  const rejectedOverrides = overrides.filter((o) => o.status === 'rejected');

  const pendingWaiverTotal = pendingOverrides.reduce((sum, o) => sum + o.discountOrWaiverINR, 0);
  const approvedWaiverTotal = approvedOverrides.reduce((sum, o) => sum + o.discountOrWaiverINR, 0);

  const handleConfirmApprove = async () => {
    if (!user || !approveModal) return;
    setIsProcessing(true);
    const res = await superAdminService.approveFinancialOverride(
      { id: user.id, name: user.name },
      approveModal.id,
      approveRemarks || 'Approved by Super Admin.'
    );
    setIsProcessing(false);

    if (res.success && res.data) {
      setOverrides((prev) => prev.map((o) => (o.id === approveModal.id ? res.data : o)));
      setApproveModal(null);
      setApproveRemarks('');
      showToast({
        type: 'success',
        title: 'Financial Override Approved (BR-007)',
        message: `Authorized fee concession of ${formatINR(approveModal.discountOrWaiverINR)} for ${approveModal.studentName}.`,
      });
    } else {
      showToast({ type: 'error', title: 'Approval Failed', message: res.error || 'Failed to approve override.' });
    }
  };

  const handleConfirmReject = async () => {
    if (!user || !rejectModal) return;
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      showToast({ type: 'warning', message: 'A mandatory rejection justification must be provided.' });
      return;
    }

    setIsProcessing(true);
    const res = await superAdminService.rejectFinancialOverride(
      { id: user.id, name: user.name },
      rejectModal.id,
      rejectReason.trim()
    );
    setIsProcessing(false);

    if (res.success && res.data) {
      setOverrides((prev) => prev.map((o) => (o.id === rejectModal.id ? res.data : o)));
      setRejectModal(null);
      setRejectReason('');
      showToast({
        type: 'info',
        title: 'Financial Override Rejected',
        message: `Override request for ${rejectModal.studentName} has been rejected with mandatory audit notes.`,
      });
    } else {
      showToast({ type: 'error', title: 'Rejection Failed', message: res.error || 'Failed to reject override.' });
    }
  };

  const filteredOverrides = useMemo(() => {
    return overrides.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (typeFilter !== 'all' && o.adjustmentType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = o.studentName.toLowerCase().includes(q);
        const matchesCourse = o.courseTitle.toLowerCase().includes(q);
        const matchesAdmin = o.requestedByAdminName.toLowerCase().includes(q);
        const matchesId = o.id.toLowerCase().includes(q);
        return matchesName || matchesCourse || matchesAdmin || matchesId;
      }
      return true;
    });
  }, [overrides, statusFilter, typeFilter, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Override Management</h1>
            <Badge variant="warning" size="sm">
              Super Admin Authority (BR-007)
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            In compliance with <strong>SRS Rule BR-007</strong>, extraordinary student fee waivers, merit scholarships,
            hardship concessions, and billing corrections require Super Admin sign-off.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Pending Sign-Offs"
          value={`${pendingOverrides.length} Requests`}
          subtitle={formatINR(pendingWaiverTotal)}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBgColor="bg-amber-50 text-amber-600"
        />

        <MetricCard
          title="Authorized Waivers"
          value={formatINR(approvedWaiverTotal)}
          subtitle={`${approvedOverrides.length} Concessions Enacted`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
        />

        <MetricCard
          title="Rejected Overrides"
          value={`${rejectedOverrides.length} Denied`}
          subtitle="Non-Qualifying Requests"
          icon={<XCircle className="h-5 w-5" />}
          iconBgColor="bg-slate-100 text-slate-700"
        />

        <MetricCard
          title="Approval Rate"
          value={`${
            overrides.length > 0 ? Math.round((approvedOverrides.length / overrides.length) * 100) : 0
          }%`}
          subtitle="Executive Financial Policy"
          icon={<FileCheck2 className="h-5 w-5" />}
          iconBgColor="bg-indigo-50 text-indigo-600"
        />
      </div>

      {/* Governance Banner */}
      <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-amber-900/40 flex items-start gap-3 shadow-xs">
        <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-white">Financial Integrity Guard (SRS BR-007):</p>
          <p className="text-slate-300 leading-relaxed">
            Staff Administrators can propose exceptional adjustments for deserving students or corrections, but
            <strong> no discount exceeding official coupon policy</strong> takes effect without cryptographic confirmation
            from the Super Administrator. Every approval modifies the student enrollment ledger automatically.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student, course, requesting admin, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="all">All Adjustment Types</option>
              <option value="merit_scholarship">Merit Scholarship</option>
              <option value="hardship_waiver">Hardship Waiver</option>
              <option value="corporate_grant">Corporate / Institutional Grant</option>
              <option value="special_discount">Special Director Concession</option>
              <option value="fee_correction">Billing / Ledger Correction</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="all">All Statuses ({overrides.length})</option>
              <option value="pending">Pending Super Admin Sign-off ({pendingOverrides.length})</option>
              <option value="approved">Approved &amp; Ledger Updated ({approvedOverrides.length})</option>
              <option value="rejected">Rejected ({rejectedOverrides.length})</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Overrides Table */}
      <Card className="overflow-hidden shadow-xs border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Request ID &amp; Date</th>
                <th className="py-3 px-4">Student &amp; Course</th>
                <th className="py-3 px-4">Adjustment Category</th>
                <th className="py-3 px-4">Financial Comparison</th>
                <th className="py-3 px-4">Requested By</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOverrides.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No financial override requests match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredOverrides.map((ov) => (
                  <tr key={ov.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 block">{ov.id}</span>
                      <span className="text-[11px] text-slate-400">
                        {ov.requestedAt ? formatDate(ov.requestedAt) : 'Recently'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{ov.studentName}</span>
                      <span className="text-[11px] text-slate-500">{ov.courseTitle}</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px]">
                        {ov.adjustmentType.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="line-through text-slate-400 text-[11px] block">
                          Original: {formatINR(ov.originalAmountINR)}
                        </span>
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <span>Adjusted: {formatINR(ov.proposedAmountINR)}</span>
                          <span className="text-emerald-600 text-[11px]">
                            (-{formatINR(ov.discountOrWaiverINR)})
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 block">{ov.requestedByAdminName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{ov.requestedByAdminId}</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge
                        variant={
                          ov.status === 'approved'
                            ? 'success'
                            : ov.status === 'rejected'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                        dot
                      >
                        {ov.status === 'pending' ? 'AWAITING SIGN-OFF' : ov.status.toUpperCase()}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailsModal(ov)}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          Justification
                        </Button>

                        {ov.status === 'pending' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-700"
                              onClick={() => setApproveModal(ov)}
                              leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRejectModal(ov)}
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

      {/* Modal 1: Approve Financial Override */}
      {approveModal && (
        <Modal
          isOpen={!!approveModal}
          onClose={() => setApproveModal(null)}
          title="Sign & Authorize Fee Override (BR-007)"
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 text-sm">
                  Student: {approveModal.studentName}
                </span>
                <span className="text-base font-extrabold text-amber-900">
                  Waiver: -{formatINR(approveModal.discountOrWaiverINR)}
                </span>
              </div>
              <p className="text-amber-800 text-[11px]">{approveModal.courseTitle}</p>
              <div className="pt-2 flex items-center justify-between font-mono text-[11px] text-slate-700 border-t border-amber-200/60 mt-2">
                <span>Original Fee: {formatINR(approveModal.originalAmountINR)}</span>
                <span className="font-bold text-emerald-800">
                  New Payable: {formatINR(approveModal.proposedAmountINR)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-700">Staff Admin Justification</span>
              <p className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700 italic">
                "{approveModal.reason}"
              </p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Super Admin Authorization Remarks (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Enter executive sign-off comments..."
                value={approveRemarks}
                onChange={(e) => setApproveRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setApproveModal(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700"
                isLoading={isProcessing}
                onClick={handleConfirmApprove}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
              >
                Sign &amp; Enact Override
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 2: Reject Financial Override */}
      {rejectModal && (
        <Modal
          isOpen={!!rejectModal}
          onClose={() => setRejectModal(null)}
          title="Reject Financial Override (Mandatory Justification)"
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 leading-relaxed">
              You are rejecting the proposed fee concession of{' '}
              <strong>{formatINR(rejectModal.discountOrWaiverINR)}</strong> for{' '}
              <strong>{rejectModal.studentName}</strong> submitted by {rejectModal.requestedByAdminName}.
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Mandatory Rejection Reason *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Specify reasons for rejection (e.g., Inadequate scholarship documentation, beyond allowed departmental budget)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
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

      {/* Modal 3: View Details */}
      {detailsModal && (
        <Modal
          isOpen={!!detailsModal}
          onClose={() => setDetailsModal(null)}
          title={`Financial Override Record: ${detailsModal.id}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-400 block">Candidate Name</span>
                <span className="font-bold text-slate-900">{detailsModal.studentName}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Adjustment Category</span>
                <span className="font-bold text-amber-900">
                  {detailsModal.adjustmentType.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Original Tuition Fee</span>
                <span className="font-mono text-slate-800">{formatINR(detailsModal.originalAmountINR)}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Proposed Adjusted Fee</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatINR(detailsModal.proposedAmountINR)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Net Waiver / Savings</span>
                <span className="text-sm font-extrabold text-amber-900">
                  -{formatINR(detailsModal.discountOrWaiverINR)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Submitted By</span>
                <span className="font-semibold text-slate-800">{detailsModal.requestedByAdminName}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-700">Staff Justification Notes</span>
              <p className="p-3 bg-slate-50 rounded-md border border-slate-200 text-slate-700 leading-relaxed italic">
                "{detailsModal.reason}"
              </p>
            </div>

            {detailsModal.superAdminRemarks && (
              <div className="space-y-1">
                <span className="font-semibold text-slate-700">Executive Decision Notes</span>
                <p className="p-3 bg-amber-50/50 rounded-md border border-amber-200 text-slate-800">
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

