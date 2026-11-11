import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  School,
  GraduationCap,
  Calendar,
  CheckCircle2,
  FileText,
  Award,
  TrendingUp,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teacherService } from '../../services/teacherService';
import type { StudentProfile, Batch } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/feedback/Modal';
import { formatDate } from '../../utils/formatters';

interface StudentRosterItem {
  student: StudentProfile;
  batchName: string;
  courseTitle: string;
}

export const TeacherStudentsPage: React.FC = () => {
  const { user } = useAuth();
  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('all');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<StudentRosterItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStudents = async () => {
      const teacherId = user?.id || 'user-tch-001';
      const [studentsRes, batchesRes] = await Promise.all([
        teacherService.getAllAuthorizedStudents(teacherId),
        teacherService.getAssignedBatches(teacherId),
      ]);

      if (studentsRes.success) setRoster(studentsRes.data);
      if (batchesRes.success) setBatches(batchesRes.data);
      setIsLoading(false);
    };

    loadStudents();
  }, [user]);

  const filteredRoster = roster.filter((item) => {
    const matchesSearch =
      item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((item.student as any).studentId || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBatch =
      selectedBatchFilter === 'all' || item.batchName.toLowerCase().includes(selectedBatchFilter.toLowerCase());

    return matchesSearch && matchesBatch;
  });

  const handleOpenStudent = (item: StudentRosterItem) => {
    setSelectedStudentDetail(item);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Authorized Student Roster</h1>
          <p className="text-xs text-slate-500 mt-1">
            Displaying students enrolled in your assigned cohorts. Strict boundary per SRS Rule TCH-002.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="purple" size="md">
            {roster.length} Authorized Students
          </Badge>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, ID or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedBatchFilter}
              onChange={(e) => setSelectedBatchFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="all">All Assigned Cohorts</option>
              {batches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Student Table */}
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading student roster...</div>
        ) : filteredRoster.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            No authorized students matched your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Student Particulars</th>
                  <th className="py-3 px-3">Student ID</th>
                  <th className="py-3 px-3">College & Degree</th>
                  <th className="py-3 px-3">Assigned Cohort</th>
                  <th className="py-3 px-3">Authorized Contact</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoster.map((item) => {
                  const s = item.student;
                  const studentId = (s as any).studentId || 'NEX-2025-0842';
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              s.avatarUrl ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                            }
                            alt={s.name}
                            className="h-8 w-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{s.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{s.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                        {studentId}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 block line-clamp-1">{s.collegeName}</span>
                        <span className="text-[10px] text-slate-500 block">{s.degreeBranch}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-teal-800 block">{item.batchName}</span>
                        <span className="text-[10px] text-slate-400">{item.courseTitle}</span>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        {s.mobile}
                      </td>

                      <td className="py-3 px-3">
                        <Badge variant="success" size="sm" dot>
                          Enrolled
                        </Badge>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenStudent(item)}
                          leftIcon={<Eye className="h-3.5 w-3.5" />}
                        >
                          Profile & Scores
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Student Academic Modal */}
      {selectedStudentDetail && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Student Academic Record: ${selectedStudentDetail.student.name}`}
          size="lg"
        >
          <div className="space-y-5 text-xs text-slate-700">
            {/* Header Particulars */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <img
                src={
                  selectedStudentDetail.student.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                }
                alt={selectedStudentDetail.student.name}
                className="h-16 w-16 rounded-2xl object-cover border border-slate-200"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{selectedStudentDetail.student.name}</h3>
                  <Badge variant="purple" size="sm">
                    {(selectedStudentDetail.student as any).studentId || 'NEX-2025-0842'}
                  </Badge>
                </div>
                <p className="text-slate-500 font-mono">{selectedStudentDetail.student.email} • {selectedStudentDetail.student.mobile}</p>
                <p className="text-slate-500">{selectedStudentDetail.student.collegeName} ({selectedStudentDetail.student.degreeBranch})</p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Attendance Rate</span>
                <span className="text-base font-black text-emerald-600">84%</span>
                <span className="text-[10px] text-slate-500 block">Above 75% threshold</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Avg. Test Score</span>
                <span className="text-base font-black text-indigo-600">88%</span>
                <span className="text-[10px] text-slate-500 block">3 Exams Evaluated</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Assignments Graded</span>
                <span className="text-base font-black text-teal-600">92/100</span>
                <span className="text-[10px] text-slate-500 block">All On-Time</span>
              </div>
            </div>

            {/* Academic Standing */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              <span className="text-xs font-bold text-emerald-900 block">Performance Standing: Good Progress</span>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Candidate is actively maintaining required 75% attendance for certificate eligibility (BR-011) and qualifying benchmark marks for the placement pool (BR-013).
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

