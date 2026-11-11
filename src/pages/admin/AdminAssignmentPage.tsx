import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Award,
  Users,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { Modal } from '../../components/feedback/Modal';
import { Card } from '../../components/common/Card';
import type { Assignment, AssignmentSubmission, Course, Batch } from '../../types';

export const AdminAssignmentPage: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const loadData = async () => {
    const [aRes, sRes, cRes, bRes] = await Promise.all([
      adminService.getAssignments(),
      adminService.getAssignmentSubmissions(),
      adminService.getCourses(),
      adminService.getBatches(),
    ]);

    if (aRes.success) setAssignments(aRes.data);
    if (sRes.success) setSubmissions(sRes.data);
    if (cRes.success) setCourses(cRes.data);
    if (bRes.success) setBatches(bRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: Column<Assignment>[] = [
    {
      key: 'title',
      header: 'Assignment Title',
      sortable: true,
      render: (a) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{a.title}</span>
          <span className="text-[11px] text-slate-500 line-clamp-1">{a.instructions}</span>
        </div>
      ),
    },
    {
      key: 'courseId',
      header: 'Course Program',
      render: (a) => {
        const c = courses.find((x) => x.id === a.courseId);
        return <span className="font-semibold text-slate-800 text-xs">{c?.title || a.courseId}</span>;
      },
    },
    {
      key: 'batchId',
      header: 'Batch Cohort',
      render: (a) => {
        const b = batches.find((x) => x.id === a.batchId);
        return <Badge variant="purple" size="sm">{b?.batchCode || a.batchId}</Badge>;
      },
    },
    {
      key: 'maxMarks',
      header: 'Max Marks',
      sortable: true,
      render: (a) => <span className="text-xs font-bold text-slate-900">{a.maxMarks} Pts</span>,
    },
    {
      key: 'dueDate',
      header: 'Due Deadline',
      sortable: true,
      render: (a) => <span className="text-xs text-slate-500">{formatDate(a.dueDate)}</span>,
    },
    {
      key: 'id',
      header: 'Submissions Count',
      render: (a) => {
        const subs = submissions.filter((s) => s.assignmentId === a.id);
        const graded = subs.filter((s) => s.status === 'graded');
        return (
          <div>
            <span className="text-xs font-bold text-slate-900">{subs.length} Submissions</span>
            <span className="text-[11px] text-emerald-600 block">({graded.length} Graded)</span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (a) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedAssignment(a)}
          className="text-xs text-indigo-600 hover:bg-indigo-50"
        >
          View Submissions →
        </Button>
      ),
    },
  ];

  const currentAssignmentSubmissions = selectedAssignment
    ? submissions.filter((s) => s.assignmentId === selectedAssignment.id)
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assignment Oversight (ADM-011)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Institutional oversight for academic homework tasks, project submissions, and faculty evaluations.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        data={assignments}
        columns={columns}
        searchPlaceholder="Search assignment title, course or instructions..."
        pageSize={10}
      />

      {/* Submissions Detail Modal */}
      {selectedAssignment && (
        <Modal
          isOpen={!!selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          title={`Submissions: ${selectedAssignment.title}`}
          size="lg"
        >
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] text-slate-400 block uppercase font-semibold">Task Instructions</span>
              <p className="text-slate-700 mt-1 leading-relaxed">{selectedAssignment.instructions}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">
                Student Submissions ({currentAssignmentSubmissions.length})
              </h4>

              {currentAssignmentSubmissions.length === 0 ? (
                <p className="text-slate-400 italic p-4 text-center">No submissions recorded yet for this task.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {currentAssignmentSubmissions.map((sub) => (
                    <div key={sub.id} className="p-4 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">{sub.studentName}</span>
                          <span className="text-[11px] text-slate-400">
                            Submitted on: {formatDate(sub.submittedAt)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-indigo-700">
                            {sub.marksObtained !== undefined ? `${sub.marksObtained} / ${selectedAssignment.maxMarks}` : 'Ungraded'}
                          </span>
                          <Badge variant={sub.status === 'graded' ? 'success' : 'warning'} size="sm" className="ml-2">
                            {sub.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      {sub.githubUrl && (
                        <div className="flex items-center gap-1.5 text-indigo-600 font-mono">
                          <ExternalLink className="h-3 w-3" />
                          <a href={sub.githubUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {sub.githubUrl}
                          </a>
                        </div>
                      )}

                      {sub.teacherFeedback && (
                        <div className="p-2.5 rounded bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-900">
                          <strong>Faculty Feedback:</strong> {sub.teacherFeedback}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedAssignment(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

