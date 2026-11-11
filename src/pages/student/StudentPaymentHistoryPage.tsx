import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Download,
  Printer,
  CheckCircle2,
  FileText,
  Search,
  ShieldCheck,
  Building2,
  GraduationCap,
  Calendar,
  X,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { paymentService } from '../../services/paymentService';
import type { PaymentTransaction } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/feedback/Modal';
import { formatINR, formatDate } from '../../utils/formatters';

export const StudentPaymentHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransaction | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    paymentService.getStudentPaymentHistory(user.id).then((res) => {
      if (res.success) setTransactions(res.data);
    });
  }, [user]);

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPaid = transactions.reduce((sum, tx) => sum + tx.finalAmountINR, 0);

  const handleOpenReceipt = (tx: PaymentTransaction) => {
    setSelectedReceipt(tx);
    setIsReceiptModalOpen(true);
  };

  const handlePrintReceipt = () => {
    window.print();
    showToast({
      type: 'info',
      title: 'Receipt Ready',
      message: 'Print preview generated for your official fee receipt.',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment History & Receipts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Access verified transaction statements and download official GST fee receipts (SRS STD-007).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="success" size="md" dot>
            All Dues Cleared (Lump-sum BR-005)
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Fees Paid</span>
          <div className="text-2xl font-extrabold text-slate-900">{formatINR(totalPaid)}</div>
          <span className="text-[11px] text-emerald-600 font-medium">100% Settled via Razorpay</span>
        </Card>

        <Card className="p-5 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Outstanding Balance</span>
          <div className="text-2xl font-extrabold text-emerald-600">{formatINR(0)}</div>
          <span className="text-[11px] text-slate-400 font-medium">Nil outstanding balance</span>
        </Card>

        <Card className="p-5 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tax Invoices Issued</span>
          <div className="text-2xl font-extrabold text-slate-900">{transactions.length}</div>
          <span className="text-[11px] text-indigo-600 font-medium">Valid for corporate / education claim</span>
        </Card>
      </div>

      {/* Transactions Table & Filters */}
      <Card className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by receipt # or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            No transaction records matched your search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Receipt / Ref #</th>
                  <th className="py-3 px-3">Course Enrolled</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Payment Method</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Receipt Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3">
                      <span className="font-mono font-bold text-slate-900 block">{tx.receiptNumber}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Gateway ID: {tx.id}</span>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-800">{tx.courseTitle}</td>
                    <td className="py-3.5 px-3 text-slate-500">{formatDate(tx.paidAt)}</td>
                    <td className="py-3.5 px-3 uppercase font-mono text-[11px] text-slate-700">
                      {tx.paymentMethod}
                    </td>
                    <td className="py-3.5 px-3 font-extrabold text-slate-900">{formatINR(tx.finalAmountINR)}</td>
                    <td className="py-3.5 px-3">
                      <Badge variant="success" size="sm" dot>
                        Verified
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReceipt(tx)}
                        leftIcon={<Download className="h-3.5 w-3.5" />}
                      >
                        Official Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Official Printable Fee Receipt Modal (STD-007) */}
      {selectedReceipt && (
        <Modal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          title="Official Fee Payment Receipt (STD-007)"
          size="lg"
        >
          <div className="space-y-6 text-slate-800">
            {/* Printable Receipt Paper Container */}
            <div id="printable-receipt" className="p-6 bg-white border border-slate-200 rounded-xl space-y-6 shadow-xs">
              {/* Receipt Header */}
              <div className="flex items-start justify-between border-b-2 border-indigo-600 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight text-slate-900">NEXELVORIA ACADEMY</h2>
                      <span className="text-[10px] text-indigo-600 font-bold tracking-widest block uppercase">
                        Center for Advanced Engineering & Technology
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 max-w-sm">
                    Plot 120, Knowledge Corridor, Hitec City, Hyderabad - 500081, India
                    <br />
                    GSTIN: 36AAACN1234F1Z8 • Contact: billing@nexelvoria.com
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    TAX INVOICE / RECEIPT
                  </span>
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-400 block font-mono">Receipt No:</span>
                    <span className="text-sm font-black font-mono text-slate-900">{selectedReceipt.receiptNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Issue Date:</span>
                    <span className="text-xs font-semibold text-slate-700">{formatDate(selectedReceipt.paidAt)}</span>
                  </div>
                </div>
              </div>

              {/* Student Details & Bill To */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Billed To (Student):</span>
                  <h4 className="font-bold text-slate-900 mt-0.5">{user?.name || selectedReceipt.studentName}</h4>
                  <p className="text-slate-500 font-mono text-[11px] mt-0.5">Student ID: {(user as any)?.studentId || 'NEX-2025-0842'}</p>
                  <p className="text-slate-500 text-[11px]">{user?.email}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Payment Particulars:</span>
                  <p className="text-slate-700 font-semibold mt-0.5">Mode: {selectedReceipt.paymentMethod.toUpperCase()}</p>
                  <p className="text-slate-500 font-mono text-[11px]">Txn Ref: {selectedReceipt.id}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold text-[11px]">Paid in Full (Lump-sum)</span>
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-center">Batch Ref</th>
                    <th className="py-2 text-right">Taxable Amount</th>
                    <th className="py-2 text-right">GST (18%)</th>
                    <th className="py-2 text-right">Total (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 font-semibold text-slate-900">
                      {selectedReceipt.courseTitle}
                      <span className="text-[10px] text-slate-500 block font-normal">
                        Full Course Tuition, Dedicated Mentorship, LMS Access & Placement Support
                      </span>
                    </td>
                    <td className="py-3 text-center text-slate-600 font-mono text-[11px]">OCT2026-COHORT</td>
                    <td className="py-3 text-right font-mono text-slate-700">
                      {formatINR(Math.round(selectedReceipt.finalAmountINR / 1.18))}
                    </td>
                    <td className="py-3 text-right font-mono text-slate-700">
                      {formatINR(selectedReceipt.finalAmountINR - Math.round(selectedReceipt.finalAmountINR / 1.18))}
                    </td>
                    <td className="py-3 text-right font-extrabold font-mono text-slate-900">
                      {formatINR(selectedReceipt.finalAmountINR)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 font-bold">
                    <td colSpan={4} className="py-3 text-right text-slate-700">
                      Grand Total Amount Paid:
                    </td>
                    <td className="py-3 text-right text-indigo-700 font-mono text-sm">
                      {formatINR(selectedReceipt.finalAmountINR)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Authorized Seal & Footnote */}
              <div className="pt-4 border-t border-slate-200 flex items-end justify-between text-[10px] text-slate-500">
                <div className="space-y-0.5 max-w-xs">
                  <p className="font-semibold text-slate-700">Terms & Conditions:</p>
                  <p>1. Fees once paid are subject to the institute refund policy (REF-001).</p>
                  <p>2. This is a computer-generated official receipt and requires no physical signature.</p>
                </div>

                <div className="text-center space-y-1">
                  <div className="h-10 w-24 mx-auto border-b border-slate-300 flex items-center justify-center italic text-slate-400 font-serif">
                    Nexelvoria
                  </div>
                  <span className="text-[9px] uppercase font-bold text-slate-600 block">
                    Authorized Signatory
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsReceiptModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handlePrintReceipt}
                leftIcon={<Printer className="h-4 w-4" />}
              >
                Print / Save PDF (STD-007)
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

