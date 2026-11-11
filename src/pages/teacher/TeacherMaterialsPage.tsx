import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Upload,
  FileText,
  Trash2,
  Download,
  ExternalLink,
  Plus,
  BookOpen,
  Layers,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { teacherService } from '../../services/teacherService';
import type { StudyMaterial, Course, Batch } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/feedback/Modal';
import { formatDate } from '../../utils/formatters';

export const TeacherMaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<StudyMaterial | null>(null);

  // Upload Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    courseId: '',
    batchId: '',
    fileType: 'pdf' as 'pdf' | 'zip' | 'code' | 'doc',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileSizeBytes: 3500000,
    isDownloadRestricted: false,
  });

  useEffect(() => {
    const loadData = async () => {
      const teacherId = user?.id || 'user-tch-001';
      const [matRes, coursesRes, batchesRes] = await Promise.all([
        teacherService.getStudyMaterials(teacherId),
        teacherService.getAssignedCourses(teacherId),
        teacherService.getAssignedBatches(teacherId),
      ]);

      if (matRes.success) setMaterials(matRes.data);
      if (coursesRes.success && coursesRes.data.length > 0) {
        setCourses(coursesRes.data);
        setForm((prev) => ({ ...prev, courseId: coursesRes.data[0].id }));
      }
      if (batchesRes.success && batchesRes.data.length > 0) {
        setBatches(batchesRes.data);
        setForm((prev) => ({ ...prev, batchId: batchesRes.data[0].id }));
      }
    };

    loadData();
  }, [user]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.courseId) {
      showToast({ type: 'error', message: 'Please provide material title and select course.' });
      return;
    }

    const res = await teacherService.uploadStudyMaterial(
      { id: user?.id || 'user-tch-001', name: user?.name || 'Dr. Vikram Rao' },
      form
    );

    if (res.success && res.data) {
      setMaterials([res.data, ...materials]);
      setIsUploadModalOpen(false);
      setForm({
        title: '',
        description: '',
        courseId: courses[0]?.id || '',
        batchId: batches[0]?.id || '',
        fileType: 'pdf',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileSizeBytes: 3500000,
        isDownloadRestricted: false,
      });
      showToast({
        type: 'success',
        title: 'Material Published',
        message: 'Learning asset uploaded and available to enrolled students. (TCH-004)',
      });
    }
  };

  const handleDelete = async (id: string) => {
    const res = await teacherService.deleteStudyMaterial(id);
    if (res.success) {
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      showToast({ type: 'info', message: 'Study material deleted.' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Study Materials & Notes</h1>
          <p className="text-xs text-slate-500 mt-1">
            Publish learning assets, architectural diagrams, cheatsheets, and code archives (SRS Rule TCH-004).
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          className="bg-teal-600 hover:bg-teal-700"
          onClick={() => setIsUploadModalOpen(true)}
          leftIcon={<Upload className="h-4 w-4" />}
        >
          Upload New Material
        </Button>
      </div>

      {/* Materials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((mat) => (
          <Card key={mat.id} className="p-5 flex flex-col justify-between border-slate-200 hover:border-teal-300 transition-colors shadow-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant={mat.fileType === 'pdf' ? 'purple' : mat.fileType === 'code' ? 'info' : 'neutral'} size="sm">
                  {mat.fileType.toUpperCase()}
                </Badge>
                <span className="text-[10px] text-slate-400 font-mono">
                  {(mat.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">{mat.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                  {mat.description}
                </p>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 font-mono">
                <span>Published: {formatDate(mat.uploadedAt)}</span>
                <span className="text-teal-700 font-semibold">Active Roster</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMaterial(mat)}
                leftIcon={<Eye className="h-3.5 w-3.5" />}
              >
                Preview
              </Button>

              <button
                onClick={() => handleDelete(mat.id)}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                title="Delete Material"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Learning Resource (TCH-004)"
        size="md"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs text-slate-700">
          <div>
            <label className="block font-semibold mb-1">Resource Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Docker & Kubernetes Production Deployment Manifests"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Target Course *</label>
            <select
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Target Cohort</label>
              <select
                value={form.batchId}
                onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Format</label>
              <select
                value={form.fileType}
                onChange={(e) => setForm({ ...form, fileType: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="pdf">PDF Document</option>
                <option value="code">Source Code Archive</option>
                <option value="zip">ZIP Bundle</option>
                <option value="doc">Reference Document</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Description & Topic Summary</label>
            <textarea
              rows={3}
              placeholder="Outline what this document covers and prerequisites..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" className="bg-teal-600 hover:bg-teal-700">
              Publish Material
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      {previewMaterial && (
        <Modal
          isOpen={!!previewMaterial}
          onClose={() => setPreviewMaterial(null)}
          title={`Resource: ${previewMaterial.title}`}
          size="md"
        >
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] uppercase font-bold text-teal-700">File Metadata</span>
              <p><strong>Format:</strong> {previewMaterial.fileType.toUpperCase()}</p>
              <p><strong>Size:</strong> {(previewMaterial.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB</p>
              <p><strong>Published:</strong> {formatDate(previewMaterial.uploadedAt)}</p>
              <p className="text-slate-600 mt-2">{previewMaterial.description}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewMaterial(null)}>
                Close
              </Button>
              <a href={previewMaterial.fileUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="primary" size="sm" className="bg-teal-600 hover:bg-teal-700" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                  Download / View File
                </Button>
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

