import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Plus,
  Filter,
  DollarSign,
  Printer,
  Calendar,
  Layers,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { formatINR, formatDate } from '../../utils/formatters';
import { APP_CONFIG } from '../../constants/appConfig';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import { useNotification } from '../../context/NotificationContext';
import type { PaymentTransaction } from '../../types';

export const AdminPaymentListPage: React.FC = () => {
  const { showToast } = useNotification();
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransaction | null>(null);

  const loadPayments = async () => {
    const res = await adminService.getPayments();
    if (res.success) setPayments(res.data);
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const totalRevenue = payments
    .filter((p) => p.status === 'successful')
    .reduce((sum, p) => sum + p.finalAmountINR, 0);

  const totalOffline = payments
    .filter((p) => p.isManualEntry && p.status === 'successful')
    .reduce((sum, p) => sum + p.finalAmountINR, 0);

  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (methodFilter !== 'all') {
      if (methodFilter === 'manual' && !p.isManualEntry) return false;
      if (methodFilter === 'gateway' && p.isManualEntry) return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = [
      'Receipt Number',
      'Student Name',
      'Course Title',
      'Base Amount',
      'Discount',
      'Final Amount',
      'Payment Method',
      'Status',
      'Gateway Tx ID',
      'Date',
    ];
    const rows = payments.map((p) => [
      p.receiptNumber,
      `"${p.studentName}"`,
      `"${p.courseTitle}"`,
      p.amountINR,
      p.discountAppliedINR,
      p.finalAmountINR,
      p.paymentMethod,
      p.status,
      p.gatewayTransactionId || p.orderId,
      p.paidAt || p.createdAt,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexelvoria_payments_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({
      type: 'success',
      title: 'Export Complete',
      message: 'Payment ledger exported to CSV format. (ADM-009)',
    });
  };

  const columns: Column<PaymentTransaction>[] = [
    {
      key: 'receiptNumber',
      header: 'Receipt #',
      sortable: true,
      render: (p) => <span className="font-mono text-xs font-bold text-slate-900">{p.receiptNumber}</span>,
    },
    {
      key: 'studentName',
      header: 'Student Name',
      sortable: true,
      render: (p) => <span className="font-semibold text-slate-800 text-xs">{p.studentName}</span>,
    },
    {
      key: 'courseTitle',
      header: 'Enrolled Program',
      render: (p) => <span className="text-xs text-slate-600 line-clamp-1">{p.courseTitle}</span>,
    },
    {
      key: 'finalAmountINR',
      header: 'Amount Paid',
      sortable: true,
      render: (p) => <span className="font-extrabold text-slate-900 text-xs">{formatINR(p.finalAmountINR)}</span>,
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      render: (p) => (
        <span className="text-[11px] font-mono text-slate-600 uppercase">
          {p.isManualEntry ? 'OFFLINE: ' + p.paymentMethod.replace('manual_', '') : p.paymentMethod}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (p) => (
        <Badge
          variant={
            p.status === 'successful'
              ? 'success'
              : p.status === 'refunded'
              ? 'purple'
              : 'warning'
          }
          size="sm"
          dot
        >
          {p.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'paidAt',
      header: 'Payment Date',
      sortable: true,
      render: (p) => <span className="text-xs text-slate-400">{formatDate(p.paidAt || p.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedReceipt(p)}
          className="text-xs text-indigo-600 hover:bg-indigo-50"
          leftIcon={<Receipt className="h-3.5 w-3.5" />}
        >
          Receipt
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Ledger & Receipts (ADM-009)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete transaction records from online gateways and audited manual offline cash receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<Download className="h-4 w-4" />}>
            Export CSV
          </Button>
          <Link to="/admin/payments/manual-entry">
            <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Manual Payment Entry
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Verified Revenue</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{formatINR(totalRevenue)}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Offline Walk-in Cash</span>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">{formatINR(totalOffline)}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Receipt className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Transactions Count</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{payments.length}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CreditCard className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
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
            <option value="all">All Payment Statuses</option>
            <option value="successful">Successful</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 text-slate-800"
          >
            <option value="all">All Channels</option>
            <option value="gateway">Online Payment Gateway</option>
            <option value="manual">Offline / Manual Cash / Cheque</option>
          </select>
        </div>

        <span className="ml-auto text-xs font-mono text-slate-500">
          Showing {filteredPayments.length} of {payments.length} transactions
        </span>
      </Card>

      {/* Main Table */}
      <DataTable
        data={filteredPayments}
        columns={columns}
        searchPlaceholder="Search receipt number, student name or course..."
        pageSize={10}
      />

      {/* Official Receipt Viewer Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          title={`Official Tax Receipt: ${selectedReceipt.receiptNumber}`}
          size="md"
        >
          <div className="space-y-4 text-xs text-slate-800">
            {/* Institute Header */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{APP_CONFIG.name}</h3>
                  <p className="text-[11px] text-slate-500">{APP_CONFIG.address}</p>
                  <p className="text-[11px] text-slate-500">Support: {APP_CONFIG.supportEmail}</p>
                </div>
                <Badge variant="success" size="sm">PAID & VERIFIED</Badge>
              </div>
            </div>

            {/* Receipt Metadata */}
            <div className="grid grid-cols-2 gap-3 p-3 border border-slate-200 rounded-lg">
              <div>
                <span className="text-[11px] text-slate-400 block">Receipt Number</span>
                <span className="font-mono font-bold text-slate-900">{selectedReceipt.receiptNumber}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Payment Date</span>
                <span className="font-medium text-slate-800">
                  {formatDate(selectedReceipt.paidAt || selectedReceipt.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Student Name</span>
                <span className="font-bold text-slate-900">{selectedReceipt.studentName}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Payment Mode</span>
                <span className="font-mono text-slate-800 uppercase">{selectedReceipt.paymentMethod}</span>
              </div>
            </div>

            {/* Program Breakdown */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <tr>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5 font-medium">{selectedReceipt.courseTitle}</td>
                    <td className="p-2.5 text-right font-semibold">{formatINR(selectedReceipt.amountINR)}</td>
                  </tr>
                  {selectedReceipt.discountAppliedINR > 0 && (
                    <tr className="text-emerald-600">
                      <td className="p-2.5">Discount / Scholarship ({selectedReceipt.couponCode || 'PROMO'})</td>
                      <td className="p-2.5 text-right font-semibold">- {formatINR(selectedReceipt.discountAppliedINR)}</td>
                    </tr>
                  )}
                  <tr className="font-bold bg-slate-50/50">
                    <td className="p-2.5">Total Amount Paid</td>
                    <td className="p-2.5 text-right text-indigo-700 text-sm">
                      {formatINR(selectedReceipt.finalAmountINR)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {selectedReceipt.manualNotes && (
              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-[11px] text-amber-800">
                <strong>Manual Note:</strong> {selectedReceipt.manualNotes}
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="h-4 w-4" />}
              >
                Print Receipt
              </Button>
              <Button variant="primary" size="sm" onClick={() => setSelectedReceipt(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
