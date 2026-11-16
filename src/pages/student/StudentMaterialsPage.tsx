import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Search,
  Eye,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import { STORAGE_KEYS } from '../../constants/appConfig';
import { useStorageSync } from '../../hooks/useStorageSync';
import type { Course, Enrollment, Batch, StudyMaterial } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import { useNotification } from '../../context/NotificationContext';

interface MaterialItem {
  id: string;
  title: string;
  type: 'pdf' | 'document' | 'code_repo' | 'cheatsheet';
  size: string;
  moduleName: string;
  courseId: string;
  courseTitle: string;
  description: string;
  downloadUrl: string;
  isDownloadRestricted?: boolean;
  previewContent?: string;
}

export const StudentMaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<{ enrollment: Enrollment; course: Course; batch?: Batch }[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMaterial, setPreviewMaterial] = useState<MaterialItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { showToast } = useNotification();

  const loadData = useCallback(async () => {
    if (!user) return;
    const [enrRes, matRes] = await Promise.all([
      studentService.getStudentEnrollments(user.id),
      studentService.getStudyMaterialsForStudent(user.id),
    ]);

    const loadedEnrollments = enrRes.success ? enrRes.data : [];
    if (enrRes.success) {
      setEnrollments(enrRes.data);
    }

    if (matRes.success) {
      const items: MaterialItem[] = matRes.data.map((m: StudyMaterial) => {
        const enr = loadedEnrollments.find((e) => e.course.id === m.courseId);
        const formatSize = (bytes?: number) => {
          if (!bytes) return '2.5 MB';
          return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        };
        return {
          id: m.id,
          title: m.title,
          type: m.fileType === 'pdf' ? 'pdf' : m.fileType === 'code' ? 'code_repo' : 'document',
          size: formatSize(m.fileSizeBytes),
          moduleName: 'Course Instructional Resource',
          courseId: m.courseId,
          courseTitle: enr?.course.title || 'Enrolled Course',
          description: m.description,
          downloadUrl: m.fileUrl || '#',
          isDownloadRestricted: m.isDownloadRestricted,
          previewContent: m.description,
        };
      });
      setMaterials(items);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useStorageSync([STORAGE_KEYS.TEACHER_MATERIALS, STORAGE_KEYS.ENROLLMENTS], loadData);

  // Filter materials based on selections
  const filteredMaterials = materials.filter((m) => {
    const matchesCourse = selectedCourseId === 'all' || m.courseId === selectedCourseId;
    const matchesQuery =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.moduleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesQuery;
  });

  const handleDownload = (mat: MaterialItem) => {
    if (mat.isDownloadRestricted) {
      showToast({
        type: 'warning',
        title: 'Download Restricted (LMS-006)',
        message: 'Direct file download is restricted by administration for this asset. Please view via the online preview viewer.',
      });
      return;
    }
    showToast({
      type: 'success',
      title: 'Download Started',
      message: `Downloading "${mat.title}" (${mat.size}).`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
        <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Learning Materials Locked</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Per SRS Rule STD-003, course materials are strictly restricted to students with authorized course enrollments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Learning Materials & Handouts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Download lecture notes, architectural reference PDFs, code templates, and interview cheat sheets (STD-003).
          </p>
        </div>

        <Badge variant="purple" size="md">
          {materials.length} Resources Available
        </Badge>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Course:</span>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-semibold text-slate-800 focus:outline-none"
          >
            <option value="all">All Enrolled Courses</option>
            {enrollments.map(({ course }) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, Kafka, Docker..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Materials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredMaterials.map((mat) => (
          <Card key={mat.id} className="p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow bg-white">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                  {mat.type.replace('_', ' ')}
                </span>
                <span className="text-slate-400 font-medium">{mat.size}</span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{mat.title}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{mat.moduleName}</p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {mat.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                {mat.courseTitle}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setPreviewMaterial(mat)}
                  leftIcon={<Eye className="h-3.5 w-3.5" />}
                >
                  Preview
                </Button>
                {mat.isDownloadRestricted ? (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 cursor-not-allowed"
                    title="Downloads restricted by administrator (LMS-006)"
                  >
                    <Lock className="h-3 w-3 text-amber-600" /> Read-Only
                  </span>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleDownload(mat)}
                    leftIcon={<Download className="h-3.5 w-3.5" />}
                  >
                    Download
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewMaterial}
        onClose={() => setPreviewMaterial(null)}
        title={previewMaterial?.title || 'Material Preview'}
        description={`${previewMaterial?.moduleName} • ${previewMaterial?.size}`}
      >
        {previewMaterial && (
          <div className="space-y-4 text-xs">
            {previewMaterial.isDownloadRestricted && (
              <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 font-semibold text-xs">
                <Lock className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Administrative Notice (LMS-006): Direct file download is restricted. Viewing in read-only mode.</span>
              </div>
            )}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed space-y-2">
              <h4 className="font-bold text-slate-900">Document Overview</h4>
              <p>{previewMaterial.description}</p>
              <h4 className="font-bold text-slate-900 pt-2">Topics & Chapter Outline</h4>
              <p>{previewMaterial.previewContent}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewMaterial(null)}>
                Close Preview
              </Button>
              {!previewMaterial.isDownloadRestricted && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleDownload(previewMaterial);
                    setPreviewMaterial(null);
                  }}
                  leftIcon={<Download className="h-3.5 w-3.5" />}
                >
                  Download Resource
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

