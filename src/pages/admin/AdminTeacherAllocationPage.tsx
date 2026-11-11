import React, { useState, useEffect } from 'react';
import {
  Layers,
  GraduationCap,
  Calendar,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import type { TeacherProfile, Course, Batch } from '../../types';

export const AdminTeacherAllocationPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Allocation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    const [tRes, cRes, bRes] = await Promise.all([
      adminService.getTeachers(),
      adminService.getCourses(),
      adminService.getBatches(),
    ]);

    if (tRes.success) {
      setTeachers(tRes.data);
      if (tRes.data.length > 0 && !selectedTeacherId) setSelectedTeacherId(tRes.data[0].id);
    }
    if (cRes.success) {
      setCourses(cRes.data);
      if (cRes.data.length > 0 && !selectedCourseId) setSelectedCourseId(cRes.data[0].id);
    }
    if (bRes.success) {
      setBatches(bRes.data);
      if (bRes.data.length > 0 && !selectedBatchId) setSelectedBatchId(bRes.data[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const applicableBatches = batches.filter((b) => !selectedCourseId || b.courseId === selectedCourseId);

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTeacherId || !selectedCourseId || !selectedBatchId) return;

    setIsSubmitting(true);
    const res = await adminService.allocateTeacher(
      { id: user.id, name: user.name },
      selectedTeacherId,
      selectedCourseId,
      selectedBatchId
    );
    setIsSubmitting(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Faculty Allocated',
        message: res.message || 'Faculty allocated successfully.',
      });
      setIsModalOpen(false);
      loadData();
    }
  };

  const handleUnallocate = async (teacherId: string, batchId: string) => {
    if (!user) return;
    const res = await adminService.unallocateTeacher(
      { id: user.id, name: user.name },
      teacherId,
      batchId
    );
    if (res.success) {
      showToast({
        type: 'info',
        title: 'Allocation Removed',
        message: 'Faculty assignment unlinked from cohort.',
      });
      loadData();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty & Batch Allocation (ADM-008)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Map qualified instructors to specific training courses and cohort batches. Manage instructor workloads and timetables.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Assign Faculty to Cohort
        </Button>
      </div>

      {/* Teacher Workload Matrix */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
          Faculty Active Workload & Cohort Assignments
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {teachers.map((teacher) => {
            const assignedBatches = batches.filter((b) =>
              teacher.assignedBatchIds.includes(b.id) || b.assignedTeacherIds.includes(teacher.id)
            );
            const totalStudentsSupervised = assignedBatches.reduce(
              (sum, b) => sum + (b.enrolledStudentIds?.length || 0),
              0
            );

            return (
              <Card key={teacher.id} className="p-6 bg-white border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={teacher.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'}
                      className="h-10 w-10 rounded-full object-cover border border-slate-200"
                      alt={teacher.name}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{teacher.name}</h4>
                      <p className="text-xs text-slate-500">{teacher.specialization}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                      <span>{assignedBatches.length} Cohorts</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Users className="h-4 w-4 text-emerald-600" />
                      <span>{totalStudentsSupervised} Students</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Batches List */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Assigned Cohorts</span>
                  {assignedBatches.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No batches currently assigned.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {assignedBatches.map((batch) => (
                        <div
                          key={batch.id}
                          className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{batch.name}</span>
                              <Badge variant="purple" size="sm">{batch.batchCode}</Badge>
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {batch.scheduleTiming}
                            </span>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnallocate(teacher.id, batch.id)}
                            className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            leftIcon={<Trash2 className="h-3 w-3" />}
                          >
                            Unassign
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Allocation Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Allocate Faculty to Cohort Batch (ADM-008)"
          size="md"
        >
          <form onSubmit={handleAllocate} className="space-y-4 text-xs text-slate-700">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Select Faculty Instructor *</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Select Course Program *</label>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  const firstBatch = batches.find((b) => b.courseId === e.target.value);
                  if (firstBatch) setSelectedBatchId(firstBatch.id);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Select Target Cohort Batch *</label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {applicableBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.batchCode}) - {b.scheduleTiming}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Confirm Allocation
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
