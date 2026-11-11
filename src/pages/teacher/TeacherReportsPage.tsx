import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  Users,
  CheckCircle2,
  FileText,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { teacherService } from '../../services/teacherService';
import type { Batch, Course } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

type ReportType =
  | 'batch_attendance'
  | 'student_attendance'
  | 'assignment_evaluation'
  | 'test_performance'
  | 'course_progress'
  | 'at_risk_students';

export const TeacherReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('all');
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('batch_attendance');

  useEffect(() => {
    const loadBatches = async () => {
      const teacherId = user?.id || 'user-tch-001';
      const res = await teacherService.getAssignedBatches(teacherId);
      if (res.success) setBatches(res.data);
    };

    loadBatches();
  }, [user]);

  const handlePrint = () => {
    window.print();
    showToast({
      type: 'info',
      title: 'Print Preview Ready',
      message: 'Generating official academic audit report sheet. (TCH-013)',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Batch Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate and export authorized performance and compliance reports for your cohorts (SRS Rule TCH-013).
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          onClick={handlePrint}
          leftIcon={<Printer className="h-4 w-4" />}
        >
          Print / Save PDF (TCH-013)
        </Button>
      </div>

      {/* Report Controls & Selector */}
      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Report Category</label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value as ReportType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium"
            >
              <option value="batch_attendance">1. Batch Attendance Summary Report</option>
              <option value="student_attendance">2. Student-wise 75% Compliance Report (BR-011)</option>
              <option value="assignment_evaluation">3. Assignment Grading & Feedback Report</option>
              <option value="test_performance">4. Examination Performance & Scores Report</option>
              <option value="course_progress">5. Curriculum Completion & Syllabus Progress</option>
              <option value="at_risk_students">6. Students Requiring Academic Support (Intervention)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Assigned Cohort (TCH-001)</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="all">All Authorized Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Rendered Printable Report Container */}
      <div id="printable-report" className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-6">
        {/* Report Institutional Header */}
        <div className="flex items-start justify-between border-b-2 border-teal-600 pb-4">
          <div>
            <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
              Nexelvoria Academy – Faculty Academic Report
            </h2>
            <p className="text-[11px] text-slate-500">
              Assigned Faculty: <strong>Dr. Vikram Rao</strong> (TCH-2025-019) • Cohort: Oct 2026 Morning Cohort
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-400 font-mono">
            Generated: {new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}
          </div>
        </div>

        {/* Dynamic Report Content based on selection */}
        {selectedReportType === 'batch_attendance' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Batch Attendance Summary (SRS BR-010, BR-011)</h3>
            <div className="grid grid-cols-4 gap-4 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border">
                <span className="text-[10px] text-slate-400 block font-semibold">Total Sessions</span>
                <span className="text-base font-bold text-slate-900">24 Lectures</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border">
                <span className="text-[10px] text-slate-400 block font-semibold">Avg. Attendance</span>
                <span className="text-base font-bold text-teal-700">86.2%</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border">
                <span className="text-[10px] text-slate-400 block font-semibold">Compliant Students</span>
                <span className="text-base font-bold text-emerald-600">38 (95%)</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border">
                <span className="text-[10px] text-slate-400 block font-semibold">At Risk (&lt;75%)</span>
                <span className="text-base font-bold text-rose-600">2 Students</span>
              </div>
            </div>
          </div>
        )}

        {selectedReportType === 'student_attendance' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Student 75% Attendance Compliance (BR-011)</h3>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b text-[10px] uppercase font-bold text-slate-500">
                <tr>
                  <th className="py-2 px-3">Student Name</th>
                  <th className="py-2 px-3">Student ID</th>
                  <th className="py-2 px-3">Sessions Attended</th>
                  <th className="py-2 px-3">Percentage</th>
                  <th className="py-2 px-3">Certificate Eligibility Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 px-3 font-semibold">Rohan Sharma</td>
                  <td className="py-2 px-3 font-mono">NEX-2025-0842</td>
                  <td className="py-2 px-3">21 / 24</td>
                  <td className="py-2 px-3 font-bold text-emerald-600">87.5%</td>
                  <td className="py-2 px-3 font-semibold text-emerald-700">Eligible (Meets $\ge 75\%$)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">Karthik Varma</td>
                  <td className="py-2 px-3 font-mono">NEX-2025-1044</td>
                  <td className="py-2 px-3">16 / 24</td>
                  <td className="py-2 px-3 font-bold text-rose-600">66.6%</td>
                  <td className="py-2 px-3 font-semibold text-rose-700">Ineligible (Below 75% Cutoff)</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {selectedReportType === 'test_performance' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Examination Assessment Outcomes (60% Cutoff)</h3>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b text-[10px] uppercase font-bold text-slate-500">
                <tr>
                  <th className="py-2 px-3">Candidate</th>
                  <th className="py-2 px-3">Test Title</th>
                  <th className="py-2 px-3">Score Obtained</th>
                  <th className="py-2 px-3">Percentage</th>
                  <th className="py-2 px-3">Benchmark Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 px-3 font-semibold">Rohan Sharma</td>
                  <td className="py-2 px-3">Java 21 Enterprise Assessment</td>
                  <td className="py-2 px-3 font-mono">44 / 50</td>
                  <td className="py-2 px-3 font-bold text-teal-700">88%</td>
                  <td className="py-2 px-3 text-emerald-600 font-bold">Passed (Distinction)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">Karthik Varma</td>
                  <td className="py-2 px-3">Java 21 Enterprise Assessment</td>
                  <td className="py-2 px-3 font-mono">28 / 50</td>
                  <td className="py-2 px-3 font-bold text-rose-600">56%</td>
                  <td className="py-2 px-3 text-rose-600 font-bold">Failed (Retake Requested)</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {selectedReportType === 'assignment_evaluation' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Project & Assignment Evaluation Summary</h3>
            <p className="text-xs text-slate-600">
              All 40 candidates in Oct 2026 Morning Cohort have submitted Module 1 and Module 2 assignments. Overall average mark: 88.4 / 100.
            </p>
          </div>
        )}

        {selectedReportType === 'course_progress' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Curriculum Syllabus Progress Breakdown</h3>
            <div className="p-4 bg-slate-50 rounded-xl border space-y-2 text-xs">
              <div className="flex justify-between font-bold">
                <span>Module 1: Advanced Java 21 & OOP</span>
                <span className="text-teal-700">100% Completed</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Module 2: Spring Boot 3 & JPA Microservices</span>
                <span className="text-teal-700">100% Completed</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Module 3: Spring Cloud API Gateway & Resilience4j</span>
                <span className="text-indigo-600">70% In Progress</span>
              </div>
            </div>
          </div>
        )}

        {selectedReportType === 'at_risk_students' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-rose-900">Candidates Requiring Academic Intervention</h3>
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-1">
              <strong>Karthik Varma (NEX-2025-1044):</strong> Current attendance 66.6% and score 56%. Recommended action: mandatory weekend doubt clearing and re-test authorization once attendance improves.
            </div>
          </div>
        )}

        {/* Footer Disclaimer */}
        <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
          <span>This is an official Nexelvoria Academy faculty audit document. Generated per SRS TCH-013.</span>
          <span>Confidential • Authorized Faculty Use Only</span>
        </div>
      </div>
    </div>
  );
};

