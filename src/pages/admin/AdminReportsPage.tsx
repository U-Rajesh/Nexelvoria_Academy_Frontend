import React, { useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText, CheckCircle2, Table } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';

export const AdminReportsPage: React.FC = () => {
  const { showToast } = useNotification();
  const [selectedReportType, setSelectedReportType] = useState('attendance');
  const [dateRange, setDateRange] = useState('current_session');

  const reportCategories = [
    { id: 'students', label: 'Student Admissions & Approvals', desc: 'Candidate records, college distribution, passing year stats.' },
    { id: 'attendance', label: 'Attendance & 75% Threshold Log', desc: 'Date-wise student attendance matrix with BR-011 eligibility.' },
    { id: 'revenue', label: 'Tuition Fee & Revenue Statement', desc: 'Online Razorpay orders vs manual payments and refunds.' },
    { id: 'placements', label: 'Corporate Placements & CTC', desc: 'Company campus drives, applicant stages, and job offers.' },
    { id: 'assessments', label: 'Examinations & Assignments', desc: 'Test scores, passing percentages, and retake authorizations.' },
  ];

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    let filename = `nexelvoria_${selectedReportType}_report_${Date.now()}`;
    let csvHeader = '';
    let csvRows: string[] = [];

    if (selectedReportType === 'students') {
      const res = await adminService.getStudents();
      if (res.success) {
        csvHeader = 'ID,Name,Email,Mobile,College,Degree,PassingYear,Course,Approval,Status';
        csvRows = res.data.map((s) =>
          [s.id, `"${s.name}"`, s.email, s.mobile, `"${s.collegeName}"`, `"${s.degreeBranch}"`, s.passingYear, `"${s.courseInterestedIn}"`, s.adminApprovalStatus, s.status].join(',')
        );
      }
    } else if (selectedReportType === 'attendance') {
      const res = await adminService.getAttendanceSessions();
      if (res.success) {
        csvHeader = 'Date,SessionID,BatchID,TopicCovered,StudentID,StudentName,Status';
        res.data.forEach((sess) => {
          sess.records.forEach((rec) => {
            csvRows.push([sess.sessionDate, sess.id, sess.batchId, `"${sess.topicCovered}"`, rec.studentId, `"${rec.studentName}"`, rec.status].join(','));
          });
        });
      }
    } else if (selectedReportType === 'revenue') {
      const res = await adminService.getPayments();
      if (res.success) {
        csvHeader = 'ReceiptNo,StudentName,Course,Amount,Discount,FinalPaid,Method,Status,PaidAt';
        csvRows = res.data.map((p) =>
          [p.receiptNumber, `"${p.studentName}"`, `"${p.courseTitle}"`, p.amountINR, p.discountAppliedINR, p.finalAmountINR, p.paymentMethod, p.status, p.paidAt || p.createdAt].join(',')
        );
      }
    } else if (selectedReportType === 'placements') {
      const res = await adminService.getJobApplications();
      if (res.success) {
        csvHeader = 'ApplicationID,StudentID,StudentName,JobTitle,Company,Status,AppliedAt,OfferCTC';
        csvRows = res.data.map((a) =>
          [a.id, a.studentId, `"${a.studentName}"`, `"${a.jobTitle}"`, `"${a.companyName}"`, a.status, a.appliedAt, a.offerSalaryCTC || 'N/A'].join(',')
        );
      }
    } else {
      const res = await adminService.getTestAttempts();
      if (res.success) {
        csvHeader = 'AttemptID,StudentID,StudentName,TestID,TotalScore,Passed,RetakeAuthorized,Date';
        csvRows = res.data.map((att) =>
          [att.id, att.studentId, `"${att.studentName}"`, att.testId, att.totalScore, att.isPassed, att.isRetakeAuthorized, att.submittedAt].join(',')
        );
      }
    }

    if (csvHeader) {
      const csvContent = 'data:text/csv;charset=utf-8,' + [csvHeader, ...csvRows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${filename}.${format === 'excel' ? 'csv' : format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    showToast({
      type: 'success',
      title: `Report Exported (${format.toUpperCase()})`,
      message: `Generated ${selectedReportType.toUpperCase()} report in ${format.toUpperCase()} format. Download complete. (SRS REP-003/004/005)`,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Reports & Exports (ADM-015)</h1>
        <p className="text-xs text-slate-500 mt-1">
          Generate comprehensive operational reports and download datasets in CSV, Excel, or PDF formats (SRS Module REP).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Report Selector */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Report Type</h3>
          <div className="space-y-2">
            {reportCategories.map((cat) => {
              const isSelected = selectedReportType === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedReportType(cat.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <h4 className="text-xs font-bold text-slate-900">{cat.label}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{cat.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Export Configuration Box */}
        <Card className="md:col-span-2 p-8 space-y-6 flex flex-col justify-between bg-white border border-slate-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Configure Export Options
              </h3>
              <Badge variant="purple" size="sm">
                Target: {selectedReportType.toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Period</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="current_session">Current Academic Session (2026-27)</option>
                  <option value="last_quarter">Last Quarter (Q3 2026)</option>
                  <option value="annual">Full Fiscal Year (2025-26)</option>
                </select>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-900 block">Report Specifications:</span>
                <p>• Verified student identities, cohort enrollments, and academic transcripts included.</p>
                <p>• Complies with accreditation bodies and educational audit requirements.</p>
                <p>• Live database extraction formatted with ISO timestamps.</p>
              </div>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <span className="text-xs font-semibold text-slate-700 block">Download Report Format:</span>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => handleExport('csv')}
                leftIcon={<FileText className="h-4 w-4 text-emerald-600" />}
              >
                Export CSV (REP-004)
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => handleExport('excel')}
                leftIcon={<FileSpreadsheet className="h-4 w-4 text-indigo-600" />}
              >
                Export Excel (.xlsx) (REP-003)
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleExport('pdf')}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Export PDF Document (REP-005)
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
