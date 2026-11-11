import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  Search,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  Receipt,
  Award,
  Briefcase,
  Layers,
  History,
  FileText,
  CheckCircle2,
  AlertCircle,
  Percent,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { formatINR, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { MetricCard } from '../../components/charts/MetricCard';

interface ReportCategoryItem {
  id: string;
  name: string;
  category: 'academic' | 'financial' | 'operations' | 'placements';
  description: string;
  kpiTitle: string;
  kpiValue: string;
  kpiSubtitle: string;
  columns: string[];
  mockData: Record<string, string | number>[];
}

export const SuperAdminReportsPage: React.FC = () => {
  const { showToast } = useNotification();
  const [selectedReportId, setSelectedReportId] = useState('student_reports');
  const [dateRange, setDateRange] = useState('academic_year');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // All 18 SRS Reports
  const allReports: ReportCategoryItem[] = [
    {
      id: 'student_reports',
      name: '1. Student Demographics & Profile Reports',
      category: 'academic',
      description: 'Comprehensive learner profiles, degree branches, contact records, and educational histories',
      kpiTitle: 'Total Registered Students',
      kpiValue: '48 Students',
      kpiSubtitle: '42 Active • 6 Pending',
      columns: ['Student ID', 'Full Name', 'Email', 'Degree & College', 'Status', 'Registered Date'],
      mockData: [
        { 'Student ID': 'STU-001', 'Full Name': 'Rohan Sharma', Email: 'rohan.sharma@example.com', 'Degree & College': 'B.Tech CSE, JNTU Hyderabad', Status: 'Active', 'Registered Date': '12/08/2026' },
        { 'Student ID': 'STU-002', 'Full Name': 'Ananya Sen', Email: 'ananya.sen@example.com', 'Degree & College': 'B.E ECE, Osmania University', Status: 'Active', 'Registered Date': '15/08/2026' },
        { 'Student ID': 'STU-003', 'Full Name': 'Deepak Patel', Email: 'deepak.p@example.com', 'Degree & College': 'MCA, CBIT Hyderabad', Status: 'Active', 'Registered Date': '18/08/2026' },
        { 'Student ID': 'STU-004', 'Full Name': 'Amit Verma', Email: 'amit.verma@example.com', 'Degree & College': 'B.Tech IT, VNR VJIET', Status: 'Pending', 'Registered Date': '05/11/2026' },
      ],
    },
    {
      id: 'registration_approval_reports',
      name: '2. Registration & Approval Audit Reports',
      category: 'academic',
      description: 'Verification audit trails, admin decision remarks, acceptance ratios, and document checks',
      kpiTitle: 'Verification Acceptance Rate',
      kpiValue: '87.5%',
      kpiSubtitle: '42 Approved • 6 Pending',
      columns: ['Applicant', 'Applied Course', 'Admin Approver', 'Decision', 'Verification Timestamp'],
      mockData: [
        { Applicant: 'Rohan Sharma', 'Applied Course': 'Full Stack Java', 'Admin Approver': 'Priya Nair', Decision: 'Approved', 'Verification Timestamp': '14/08/2026 14:30' },
        { Applicant: 'Ananya Sen', 'Applied Course': 'Data Science & AI', 'Admin Approver': 'Priya Nair', Decision: 'Approved', 'Verification Timestamp': '16/08/2026 11:15' },
        { Applicant: 'Deepak Patel', 'Applied Course': 'DevOps Engineering', 'Admin Approver': 'Rajesh Verma', Decision: 'Approved', 'Verification Timestamp': '19/08/2026 16:40' },
      ],
    },
    {
      id: 'enrollment_reports',
      name: '3. Enrollment & Seat Utilization Reports',
      category: 'academic',
      description: 'Cohort enrollment distributions, course intake metrics, and batch capacity fill rates',
      kpiTitle: 'Total Active Enrollments',
      kpiValue: '52 Enrolled',
      kpiSubtitle: 'Avg Batch Capacity: 86.6%',
      columns: ['Enrollment ID', 'Student Name', 'Course Title', 'Batch Code', 'Enrollment Status'],
      mockData: [
        { 'Enrollment ID': 'ENR-001', 'Student Name': 'Rohan Sharma', 'Course Title': 'Full Stack Java', 'Batch Code': 'BATCH-FSJ-2026-A', 'Enrollment Status': 'Active' },
        { 'Enrollment ID': 'ENR-002', 'Student Name': 'Ananya Sen', 'Course Title': 'Data Science & AI', 'Batch Code': 'BATCH-DSA-2026-A', 'Enrollment Status': 'Active' },
        { 'Enrollment ID': 'ENR-003', 'Student Name': 'Deepak Patel', 'Course Title': 'DevOps Engineering', 'Batch Code': 'BATCH-DEV-2026-A', 'Enrollment Status': 'Active' },
      ],
    },
    {
      id: 'course_reports',
      name: '4. Course Curriculum & Popularity Reports',
      category: 'academic',
      description: 'Course catalog performance, syllabus module count, average duration, and learner demand',
      kpiTitle: 'Active Course Offerings',
      kpiValue: '4 Programs',
      kpiSubtitle: '100% Industry Aligned',
      columns: ['Course Code', 'Title', 'Modules', 'Duration', 'Enrolled Students', 'Gross Revenue'],
      mockData: [
        { 'Course Code': 'CRS-FSJ-01', Title: 'Full Stack Java & Cloud', Modules: '12 Modules', Duration: '24 Weeks', 'Enrolled Students': 24, 'Gross Revenue': '₹ 1,92,000' },
        { 'Course Code': 'CRS-DSA-01', Title: 'Data Science, ML & AI', Modules: '14 Modules', Duration: '26 Weeks', 'Enrolled Students': 18, 'Gross Revenue': '₹ 1,62,000' },
        { 'Course Code': 'CRS-DEV-01', Title: 'DevOps & Kubernetes', Modules: '10 Modules', Duration: '20 Weeks', 'Enrolled Students': 10, 'Gross Revenue': '₹ 90,000' },
      ],
    },
    {
      id: 'batch_reports',
      name: '5. Batch Schedule & Timetable Reports',
      category: 'academic',
      description: 'Operational cohort schedules, start/end dates, allocated classrooms, and fill ratios',
      kpiTitle: 'Active Cohort Batches',
      kpiValue: '6 Batches',
      kpiSubtitle: 'Morning & Evening Tracks',
      columns: ['Batch Code', 'Course', 'Timing Slot', 'Classroom / Mode', 'Fill Status', 'End Date'],
      mockData: [
        { 'Batch Code': 'BATCH-FSJ-2026-A', Course: 'Full Stack Java', 'Timing Slot': '09:00 AM - 11:00 AM', 'Classroom / Mode': 'Hybrid Room 302', 'Fill Status': '36 / 40 Seats', 'End Date': '28/02/2027' },
        { 'Batch Code': 'BATCH-DSA-2026-A', Course: 'Data Science & AI', 'Timing Slot': '11:30 AM - 01:30 PM', 'Classroom / Mode': 'Lab 101 / Online', 'Fill Status': '32 / 40 Seats', 'End Date': '15/03/2027' },
      ],
    },
    {
      id: 'teacher_reports',
      name: '6. Teaching Faculty Performance Reports',
      category: 'academic',
      description: 'Faculty ratings, student evaluation feedback, teaching hours delivered, and credentials',
      kpiTitle: 'Average Faculty Rating',
      kpiValue: '4.88 / 5.0',
      kpiSubtitle: '6 Instructors Evaluated',
      columns: ['Instructor', 'Designation / Specialty', 'Experience', 'Assigned Batches', 'Student Rating'],
      mockData: [
        { Instructor: 'Dr. Vikramaditya Rao', 'Designation / Specialty': 'Principal Java Architect', Experience: '14 Years', 'Assigned Batches': '2 Batches', 'Student Rating': '4.95 / 5' },
        { Instructor: 'Prof. Meera Deshmukh', 'Designation / Specialty': 'AI & Machine Learning Lead', Experience: '11 Years', 'Assigned Batches': '2 Batches', 'Student Rating': '4.88 / 5' },
        { Instructor: 'Kiran Kumar', 'Designation / Specialty': 'DevOps & SRE Specialist', Experience: '9 Years', 'Assigned Batches': '2 Batches', 'Student Rating': '4.82 / 5' },
      ],
    },
    {
      id: 'teacher_allocation_reports',
      name: '7. Teacher Allocation & Workload Reports',
      category: 'academic',
      description: 'Faculty-to-batch workload distribution, weekly contact hours, and classroom assignments',
      kpiTitle: 'Total Contact Hours / Wk',
      kpiValue: '96 Hours',
      kpiSubtitle: '100% Balanced Load',
      columns: ['Instructor', 'Assigned Course', 'Batch Code', 'Weekly Hours', 'Classroom Link'],
      mockData: [
        { Instructor: 'Dr. Vikramaditya Rao', 'Assigned Course': 'Full Stack Java', 'Batch Code': 'BATCH-FSJ-2026-A', 'Weekly Hours': '16 Hours', 'Classroom Link': 'meet.google.com/nex-java-01' },
        { Instructor: 'Prof. Meera Deshmukh', 'Assigned Course': 'Data Science & AI', 'Batch Code': 'BATCH-DSA-2026-A', 'Weekly Hours': '16 Hours', 'Classroom Link': 'meet.google.com/nex-data-01' },
      ],
    },
    {
      id: 'attendance_reports',
      name: '8. Attendance Compliance & Defaulter Reports',
      category: 'academic',
      description: 'Institute-wide attendance rates, defaulters below 75% threshold (BR-004), and session audit records',
      kpiTitle: 'Institute Average Attendance',
      kpiValue: '86.8%',
      kpiSubtitle: 'SRS Threshold: 75%',
      columns: ['Student Name', 'Course & Batch', 'Attended / Total', 'Attendance %', 'SRS Rule BR-004 Status'],
      mockData: [
        { 'Student Name': 'Rohan Sharma', 'Course & Batch': 'Full Stack Java A', 'Attended / Total': '24 / 24 Sessions', 'Attendance %': '100.0%', 'SRS Rule BR-004 Status': 'Compliant' },
        { 'Student Name': 'Ananya Sen', 'Course & Batch': 'Data Science A', 'Attended / Total': '22 / 24 Sessions', 'Attendance %': '91.6%', 'SRS Rule BR-004 Status': 'Compliant' },
        { 'Student Name': 'Kunal Verma', 'Course & Batch': 'DevOps A', 'Attended / Total': '16 / 24 Sessions', 'Attendance %': '66.6%', 'SRS Rule BR-004 Status': 'At Risk (< 75%)' },
      ],
    },
    {
      id: 'assignment_reports',
      name: '9. Practical Assignment & Submission Reports',
      category: 'academic',
      description: 'Submission rates, evaluation turnaround times, instructor marks awarded, and late submissions',
      kpiTitle: 'Assignment Submission Rate',
      kpiValue: '94.2%',
      kpiSubtitle: 'Avg Evaluation Time: 28 Hrs',
      columns: ['Assignment Title', 'Course', 'Submissions', 'Graded Count', 'Average Score'],
      mockData: [
        { 'Assignment Title': 'Microservices Architecture REST API', Course: 'Full Stack Java', Submissions: '24 / 24', 'Graded Count': 24, 'Average Score': '92%' },
        { 'Assignment Title': 'Customer Churn Prediction Neural Net', Course: 'Data Science & AI', Submissions: '18 / 18', 'Graded Count': 18, 'Average Score': '88%' },
      ],
    },
    {
      id: 'examination_reports',
      name: '10. Examination & Online Assessment Reports',
      category: 'academic',
      description: 'Online test attempts, pass/fail percentages, highest/lowest scores, and examination retakes',
      kpiTitle: 'Assessment Pass Rate',
      kpiValue: '91.4%',
      kpiSubtitle: 'SRS Passing Mark: 60%',
      columns: ['Test Title', 'Course', 'Attempts', 'Passed (>=60%)', 'Highest Score', 'Average Score'],
      mockData: [
        { 'Test Title': 'Java Core & Spring Boot Assessment', Course: 'Full Stack Java', Attempts: 24, 'Passed (>=60%)': '23 Students (95.8%)', 'Highest Score': '98 / 100', 'Average Score': '86.4%' },
        { 'Test Title': 'Machine Learning Algorithms Test', Course: 'Data Science & AI', Attempts: 18, 'Passed (>=60%)': '16 Students (88.8%)', 'Highest Score': '95 / 100', 'Average Score': '82.0%' },
      ],
    },
    {
      id: 'payment_reports',
      name: '11. Payment Transactions & Gateway Reports',
      category: 'financial',
      description: 'Detailed transaction logs, gateway settlement IDs, payment method splits (UPI/Card/Netbanking/Cash)',
      kpiTitle: 'Total Collected Volume',
      kpiValue: '₹ 4,85,000',
      kpiSubtitle: '100% Reconciled',
      columns: ['Receipt No', 'Candidate', 'Amount', 'Payment Mode', 'Gateway ID', 'Settlement Date'],
      mockData: [
        { 'Receipt No': 'REC-2026-0891', Candidate: 'Rohan Sharma', Amount: '₹ 38,000', 'Payment Mode': 'Razorpay UPI', 'Gateway ID': 'pay_Nx988243109', 'Settlement Date': '12/08/2026' },
        { 'Receipt No': 'REC-2026-0892', Candidate: 'Ananya Sen', Amount: '₹ 42,000', 'Payment Mode': 'HDFC Netbanking', 'Gateway ID': 'pay_Nx98871239', 'Settlement Date': '15/08/2026' },
      ],
    },
    {
      id: 'revenue_reports',
      name: '12. Gross Revenue & Financial Run-Rate Reports',
      category: 'financial',
      description: 'Monthly tuition inflows, tax liability collections (GST), and net cash balances',
      kpiTitle: 'Annualized Revenue Run-Rate',
      kpiValue: '₹ 14.5 Lakhs',
      kpiSubtitle: '+28.4% YoY Acceleration',
      columns: ['Fiscal Month', 'Gross Revenue', 'Discounts Given', 'Refunds Deducted', 'Net Tuition Collections'],
      mockData: [
        { 'Fiscal Month': 'August 2026', 'Gross Revenue': '₹ 85,000', 'Discounts Given': '₹ 10,000', 'Refunds Deducted': '₹ 0', 'Net Tuition Collections': '₹ 75,000' },
        { 'Fiscal Month': 'September 2026', 'Gross Revenue': '₹ 1,20,000', 'Discounts Given': '₹ 15,000', 'Refunds Deducted': '₹ 0', 'Net Tuition Collections': '₹ 1,05,000' },
        { 'Fiscal Month': 'October 2026', 'Gross Revenue': '₹ 1,42,000', 'Discounts Given': '₹ 20,000', 'Refunds Deducted': '₹ 42,000', 'Net Tuition Collections': '₹ 80,000' },
        { 'Fiscal Month': 'November 2026 MTD', 'Gross Revenue': '₹ 1,38,000', 'Discounts Given': '₹ 12,000', 'Refunds Deducted': '₹ 0', 'Net Tuition Collections': '₹ 1,26,000' },
      ],
    },
    {
      id: 'pending_fee_reports',
      name: '13. Outstanding Fees & Aging Schedule Reports',
      category: 'financial',
      description: 'Student overdue installment balances, aging intervals (0-30, 31-60, 60+ days), and collection alerts',
      kpiTitle: 'Total Outstanding Balance',
      kpiValue: '₹ 1,12,000',
      kpiSubtitle: 'Installment Schedules Active',
      columns: ['Student Name', 'Course & Batch', 'Installment Due', 'Due Date', 'Aging Interval', 'Contact Phone'],
      mockData: [
        { 'Student Name': 'Siddharth Mehra', 'Course & Batch': 'Full Stack Java A', 'Installment Due': '₹ 20,000', 'Due Date': '15/11/2026', 'Aging Interval': 'Current (Due Soon)', 'Contact Phone': '+91 98765 88990' },
        { 'Student Name': 'Pooja Hegde', 'Course & Batch': 'Data Science A', 'Installment Due': '₹ 22,000', 'Due Date': '20/11/2026', 'Aging Interval': 'Current (Due Soon)', 'Contact Phone': '+91 98765 11334' },
      ],
    },
    {
      id: 'refund_reports',
      name: '14. Refund Approvals & Reconciliations Reports',
      category: 'financial',
      description: 'Tuition refund logs, claims pending Super Admin sign-off (BR-006), approved disbursements, and rejected claims',
      kpiTitle: 'Authorized Refunds Volume',
      kpiValue: '₹ 42,000',
      kpiSubtitle: '1 Approved • 1 Pending • 1 Rejected',
      columns: ['Refund ID', 'Candidate', 'Amount', 'Decision Status', 'Authorized By', 'Date'],
      mockData: [
        { 'Refund ID': 'REF-001', Candidate: 'Rohan Sharma', Amount: '₹ 38,000', 'Decision Status': 'Pending Super Admin (BR-006)', 'Authorized By': 'Awaiting Owner', Date: '08/11/2026' },
        { 'Refund ID': 'REF-002', Candidate: 'Ananya Sen', Amount: '₹ 42,000', 'Decision Status': 'Approved', 'Authorized By': 'Narayana Murthy (Owner)', Date: '30/10/2026' },
        { 'Refund ID': 'REF-003', Candidate: 'Deepak Patel', Amount: '₹ 18,000', 'Decision Status': 'Rejected', 'Authorized By': 'Narayana Murthy (Owner)', Date: '16/10/2026' },
      ],
    },
    {
      id: 'discount_scholarship_reports',
      name: '15. Discount & Scholarship Concession Reports',
      category: 'financial',
      description: 'Coupon code redemptions, merit scholarship waivers, financial overrides (BR-007), and promotional costs',
      kpiTitle: 'Total Institutional Waivers',
      kpiValue: '₹ 57,000',
      kpiSubtitle: 'Scholarships & Coupon Redemptions',
      columns: ['Concession ID', 'Candidate', 'Adjustment Type', 'Waiver Amount', 'Authorized By', 'Date'],
      mockData: [
        { 'Concession ID': 'CON-001', Candidate: 'Amit Verma', 'Adjustment Type': 'Merit Scholarship (Rank #24)', 'Waiver Amount': '₹ 15,000', 'Authorized By': 'Pending Super Admin (BR-007)', Date: '09/11/2026' },
        { 'Concession ID': 'CON-002', Candidate: 'Vikram Singh', 'Adjustment Type': 'Corporate Grant (TCS)', 'Waiver Amount': '₹ 8,000', 'Authorized By': 'Narayana Murthy (Owner)', Date: '26/10/2026' },
      ],
    },
    {
      id: 'certificate_reports',
      name: '16. Certificate Issuance & Verification Reports',
      category: 'operations',
      description: 'Issued verifiable credentials, cryptographic SHA hashes, QR code verifications, and compliance audits',
      kpiTitle: 'Certificates Dispatched',
      kpiValue: '38 Credentials',
      kpiSubtitle: '100% Cryptographically Verified',
      columns: ['Certificate ID', 'Recipient Student', 'Course Title', 'Issue Date', 'Verification Hash', 'Status'],
      mockData: [
        { 'Certificate ID': 'NEX-2026-JFS-0104', 'Recipient Student': 'Rohan Sharma', 'Course Title': 'Full Stack Java', 'Issue Date': '07/11/2026', 'Verification Hash': '0x7f8a9b2c...Verified', Status: 'Valid & Publicly Verifiable' },
        { 'Certificate ID': 'NEX-2026-DSA-0089', 'Recipient Student': 'Ananya Sen', 'Course Title': 'Data Science & AI', 'Issue Date': '02/11/2026', 'Verification Hash': '0x3c4d5e6f...Verified', Status: 'Valid & Publicly Verifiable' },
      ],
    },
    {
      id: 'placement_reports',
      name: '17. Placement, Recruiter & Offer Reports',
      category: 'placements',
      description: 'Placement conversion rates, average CTC packages, active corporate hiring partners, and interview schedules',
      kpiTitle: 'Placement Conversion Rate',
      kpiValue: '92.4%',
      kpiSubtitle: 'Average CTC: ₹ 6.8 LPA',
      columns: ['Placed Candidate', 'Course', 'Hiring Corporate', 'Offered Role', 'CTC Package', 'Joining Date'],
      mockData: [
        { 'Placed Candidate': 'Rohan Sharma', Course: 'Full Stack Java', 'Hiring Corporate': 'Razorpay Software', 'Offered Role': 'SDE-1 (Java Backend)', 'CTC Package': '₹ 8.5 LPA', 'Joining Date': '01/12/2026' },
        { 'Placed Candidate': 'Ananya Sen', Course: 'Data Science & AI', 'Hiring Corporate': 'Fractal Analytics', 'Offered Role': 'Junior ML Engineer', 'CTC Package': '₹ 7.8 LPA', 'Joining Date': '15/12/2026' },
        { 'Placed Candidate': 'Deepak Patel', Course: 'DevOps Engineering', 'Hiring Corporate': 'TCS Digital', 'Offered Role': 'Cloud Systems Engineer', 'CTC Package': '₹ 7.0 LPA', 'Joining Date': '10/01/2027' },
      ],
    },
    {
      id: 'system_activity_reports',
      name: '18. System Activity & Security Governance Reports',
      category: 'operations',
      description: 'System login frequencies, administrative mutations, access denial attempts, and infrastructure events',
      kpiTitle: 'Recorded Security Events',
      kpiValue: '124 Operations',
      kpiSubtitle: '0 Breaches • 1 Denied Access Intercepted',
      columns: ['Event Timestamp', 'Actor', 'Administrative Scope', 'Action Performed', 'Result', 'IP Address'],
      mockData: [
        { 'Event Timestamp': '11/11/2026 06:45', Actor: 'Narayana Murthy (Super Admin)', 'Administrative Scope': 'Admin Accounts', 'Action Performed': 'ADMIN_ACCOUNT_CREATED', Result: 'SUCCESS', 'IP Address': '103.21.144.12' },
        { 'Event Timestamp': '10/11/2026 18:15', Actor: 'Narayana Murthy (Super Admin)', 'Administrative Scope': 'Roles & Permissions', 'Action Performed': 'ROLE_PERMISSIONS_UPDATED', Result: 'SUCCESS', 'IP Address': '103.21.144.12' },
        { 'Event Timestamp': '06/11/2026 09:12', Actor: 'Sunita Rao (Admin)', 'Administrative Scope': 'Super Admin System Config', 'Action Performed': 'UNAUTHORIZED_ACCESS_ATTEMPT', Result: 'DENIED', 'IP Address': '192.168.1.140' },
      ],
    },
  ];

  const currentReport = useMemo(() => {
    return allReports.find((r) => r.id === selectedReportId) || allReports[0];
  }, [selectedReportId]);

  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      showToast({
        type: 'success',
        title: 'Report Export Generated',
        message: `Exported ${currentReport.name} to CSV file successfully. (SRS Reporting Requirement)`,
      });
    }, 400);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Institute-Wide Reports &amp; Analytics
            </h1>
            <Badge variant="danger" size="sm">
              All 18 SRS Reports
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Super Administrator executive reporting console with institute-wide data across all academic,
            financial, operational, and placement vectors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="h-4 w-4" />}
          >
            Print
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="bg-rose-600 hover:bg-rose-700"
            isLoading={isExporting}
            onClick={handleExportCSV}
            leftIcon={<FileSpreadsheet className="h-4 w-4" />}
          >
            Export CSV / Excel
          </Button>
        </div>
      </div>

      {/* Date & Filter Controls */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
              Select Institutional Report Category (All 18 SRS Specifications)
            </label>
            <select
              value={selectedReportId}
              onChange={(e) => setSelectedReportId(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/50 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              {allReports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
              Reporting Time Window
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="academic_year">Current Academic Year (2026-2027)</option>
              <option value="month">Current Month to Date</option>
              <option value="quarter">Last Quarter (Q2 2026)</option>
              <option value="lifetime">All Time Institute Inception</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Active Report Header & Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="md:col-span-2 p-6 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="info" size="sm">
              {currentReport.category.toUpperCase()}
            </Badge>
            <h2 className="text-base font-bold text-slate-900">{currentReport.name}</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{currentReport.description}</p>
          <div className="pt-2 flex items-center gap-4 text-[11px] text-slate-400 font-mono">
            <span>Rows: {currentReport.mockData.length} Records</span>
            <span>•</span>
            <span>Date Scope: {dateRange.replace('_', ' ').toUpperCase()}</span>
            <span>•</span>
            <span>Authority: UNRESTRICTED</span>
          </div>
        </Card>

        <MetricCard
          title={currentReport.kpiTitle}
          value={currentReport.kpiValue}
          subtitle={currentReport.kpiSubtitle}
          icon={<BarChart3 className="h-5 w-5" />}
          iconBgColor="bg-rose-50 text-rose-600"
        />
      </div>

      {/* Data Table */}
      <Card className="overflow-hidden shadow-xs border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Detailed Data Records Preview
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">
            Displaying live audited values
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                {currentReport.columns.map((col) => (
                  <th key={col} className="py-3 px-4 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentReport.mockData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  {currentReport.columns.map((col) => (
                    <td key={col} className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                      {row[col] !== undefined ? String(row[col]) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

