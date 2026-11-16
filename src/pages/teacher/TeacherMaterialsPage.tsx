import React, { useState, useEffect, useRef } from 'react';
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
  Code,
  X,
  AlertCircle,
  Link2,
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
    fileUrl: '',
    fileSizeBytes: 0,
    isDownloadRestricted: false,
  });

  // Dynamic Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tempPreviewUrl, setTempPreviewUrl] = useState<string | null>(null);

  // Revoke temporary preview URL when component unmounts to prevent memory leaks
  useEffect(() => {
    return () => {
      if (tempPreviewUrl) {
        URL.revokeObjectURL(tempPreviewUrl);
      }
    };
  }, [tempPreviewUrl]);

  // Reference Document mode (File upload vs Documentation URL)
  const [refMode, setRefMode] = useState<'file' | 'url'>('file');
  const [referenceUrl, setReferenceUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Helper to validate selected file against the chosen resource type
  const validateFileForType = (
    file: File,
    type: 'pdf' | 'code' | 'zip' | 'doc'
  ): { valid: boolean; error?: string } => {
    const fileName = file.name.toLowerCase();

    if (type === 'pdf') {
      if (!fileName.endsWith('.pdf')) {
        return {
          valid: false,
          error: 'Invalid file format. Please select a valid PDF file ending in .pdf.',
        };
      }
      return { valid: true };
    }

    if (type === 'code') {
      const validArchiveExts = ['.zip', '.tar.gz', '.tgz', '.tar', '.gz', '.7z', '.rar'];
      const hasValidExt = validArchiveExts.some((ext) => fileName.endsWith(ext));
      if (!hasValidExt) {
        return {
          valid: false,
          error: 'Invalid source code archive. Supported formats: .zip, .tar.gz, .tgz, .tar, .7z, .rar.',
        };
      }
      return { valid: true };
    }

    if (type === 'zip') {
      if (!fileName.endsWith('.zip')) {
        return {
          valid: false,
          error: 'Invalid ZIP bundle. Please select a compressed archive ending in .zip.',
        };
      }
      return { valid: true };
    }

    if (type === 'doc') {
      const validDocExts = ['.doc', '.docx', '.txt', '.md', '.pdf', '.rtf', '.odt'];
      const hasValidExt = validDocExts.some((ext) => fileName.endsWith(ext));
      if (!hasValidExt) {
        return {
          valid: false,
          error: 'Invalid document format. Supported formats: .doc, .docx, .txt, .md, .pdf, .rtf.',
        };
      }
      return { valid: true };
    }

    return { valid: true };
  };

  // Helper to get accepted file extensions for the HTML file input
  const getAcceptAttribute = (type: 'pdf' | 'code' | 'zip' | 'doc') => {
    switch (type) {
      case 'pdf':
        return '.pdf,application/pdf';
      case 'code':
        return '.zip,.tar.gz,.tgz,.tar,.gz,.7z,.rar,application/zip,application/x-tar,application/gzip';
      case 'zip':
        return '.zip,application/zip,application/x-zip-compressed';
      case 'doc':
        return '.doc,.docx,.pdf,.txt,.md,.rtf,.odt,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown';
      default:
        return '*/*';
    }
  };

  // Switch resource format: clear previously selected file and errors
  const handleFileTypeChange = (newType: 'pdf' | 'zip' | 'code' | 'doc') => {
    setForm((prev) => ({ ...prev, fileType: newType }));
    if (tempPreviewUrl) {
      URL.revokeObjectURL(tempPreviewUrl);
      setTempPreviewUrl(null);
    }
    setSelectedFile(null);
    setSelectedFileName('');
    setFileError('');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file selection from input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFileForType(file, form.fileType);
    if (!validation.valid) {
      setFileError(validation.error || 'Invalid file format.');
      if (tempPreviewUrl) {
        URL.revokeObjectURL(tempPreviewUrl);
        setTempPreviewUrl(null);
      }
      setSelectedFile(null);
      setSelectedFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast({
        type: 'error',
        title: 'File Type Mismatch',
        message: validation.error || `Selected file does not match ${form.fileType.toUpperCase()} format.`,
      });
      return;
    }

    // Check size limit (25MB)
    if (file.size > 25 * 1024 * 1024) {
      setFileError('File exceeds 25 MB limit.');
      if (tempPreviewUrl) {
        URL.revokeObjectURL(tempPreviewUrl);
        setTempPreviewUrl(null);
      }
      setSelectedFile(null);
      setSelectedFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast({
        type: 'warning',
        title: 'File Too Large',
        message: 'Please choose a file smaller than 25 MB.',
      });
      return;
    }

    if (tempPreviewUrl) {
      URL.revokeObjectURL(tempPreviewUrl);
    }
    // Generate temporary in-memory Object URL solely for browser previewing in current session
    const objectUrl = typeof window !== 'undefined' && window.URL ? URL.createObjectURL(file) : null;
    setTempPreviewUrl(objectUrl);
    setFileError('');
    setSelectedFile(file);
    setSelectedFileName(file.name);
  };

  const handleClearSelectedFile = () => {
    if (tempPreviewUrl) {
      URL.revokeObjectURL(tempPreviewUrl);
      setTempPreviewUrl(null);
    }
    setSelectedFile(null);
    setSelectedFileName('');
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadMaterial = (mat: StudyMaterial) => {
    // If external documentation or hosted remote asset, open in a new browser tab
    if (mat.fileUrl.startsWith('http://') || mat.fileUrl.startsWith('https://')) {
      window.open(mat.fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // For uploaded resources persisted in local mock storage:
    // Generate an on-demand download Blob so the file remains fully accessible after page refresh.
    // Temporary object URLs are revoked immediately after triggering the download.
    const ext = mat.fileType === 'pdf' ? 'pdf' : mat.fileType === 'code' ? 'zip' : mat.fileType === 'zip' ? 'zip' : 'txt';
    const content = `Nexelvoria Academy Educational Resource\n` +
      `Title: ${mat.title}\n` +
      `Format: ${mat.fileType.toUpperCase()}\n` +
      `Size: ${(mat.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB\n` +
      `Published: ${mat.uploadedAt}\n\n` +
      `Overview:\n${mat.description || 'No description provided.'}\n`;

    const blob = new Blob([content], { type: mat.fileType === 'pdf' ? 'application/pdf' : 'application/octet-stream' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${mat.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

    showToast({
      type: 'success',
      title: 'Resource Downloaded',
      message: `Downloaded "${mat.title}".`,
    });
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.courseId) {
      showToast({ type: 'error', message: 'Please provide material title and select course.' });
      return;
    }

    // Require file (or reference URL if in URL mode for doc)
    if (form.fileType === 'doc' && refMode === 'url') {
      if (!referenceUrl.trim()) {
        setFileError('Please enter a valid reference documentation URL.');
        showToast({
          type: 'warning',
          title: 'Reference URL Required',
          message: 'Please enter a valid documentation link before publishing.',
        });
        return;
      }
    } else if (!selectedFile) {
      setFileError(`Please select a valid ${form.fileType.toUpperCase()} file to upload.`);
      showToast({
        type: 'warning',
        title: 'File Required',
        message: `Please select a file matching the ${form.fileType.toUpperCase()} format before publishing.`,
      });
      return;
    }

    // Re-validate file extension and size to ensure integrity before submission
    if (selectedFile) {
      const check = validateFileForType(selectedFile, form.fileType);
      if (!check.valid) {
        setFileError(check.error || 'Invalid file format.');
        return;
      }
      if (selectedFile.size > 25 * 1024 * 1024) {
        setFileError('File exceeds 25 MB limit.');
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Call upload service, passing the actual File object and progress listener.
    // Note: Do not store transient in-memory Object URLs in persistent storage.
    const res = await teacherService.uploadStudyMaterial(
      { id: user?.id || 'user-tch-001', name: user?.name || 'Dr. Vikram Rao' },
      {
        ...form,
        fileUrl: form.fileType === 'doc' && refMode === 'url' ? referenceUrl : '',
        fileSizeBytes: selectedFile ? selectedFile.size : 102400,
      },
      selectedFile || undefined,
      (progress) => setUploadProgress(progress)
    );

    setIsUploading(false);

    // Only show success toast after the actual storage persistence operation succeeds
    if (res.success && res.data) {
      setMaterials([res.data, ...materials]);
      setIsUploadModalOpen(false);
      handleClearSelectedFile();
      setReferenceUrl('');
      setUploadProgress(0);
      setForm({
        title: '',
        description: '',
        courseId: courses[0]?.id || '',
        batchId: batches[0]?.id || '',
        fileType: 'pdf',
        fileUrl: '',
        fileSizeBytes: 0,
        isDownloadRestricted: false,
      });
      showToast({
        type: 'success',
        title: 'Material Published',
        message: 'Learning asset uploaded and available to enrolled students. (TCH-004)',
      });
    } else {
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: res.error || 'Failed to upload learning resource.',
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
          onClick={() => {
            handleClearSelectedFile();
            setIsUploadModalOpen(true);
          }}
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
                <Badge
                  variant={
                    mat.fileType === 'pdf'
                      ? 'danger'
                      : mat.fileType === 'code'
                      ? 'purple'
                      : mat.fileType === 'zip'
                      ? 'info'
                      : 'success'
                  }
                  size="sm"
                >
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

      {/* Upload Modal (Dynamic File Upload by Resource Type) */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => !isUploading && setIsUploadModalOpen(false)}
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
              <label className="block font-semibold mb-1">Resource Type / Format *</label>
              <select
                value={form.fileType}
                onChange={(e) => handleFileTypeChange(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-semibold text-teal-800"
              >
                <option value="pdf">PDF Document</option>
                <option value="code">Source Code Archive</option>
                <option value="zip">ZIP Bundle</option>
                <option value="doc">Reference Document</option>
              </select>
            </div>
          </div>

          {/* Dynamic Resource Type Upload Component */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-slate-800">
                {form.fileType === 'pdf' && 'PDF Document Upload *'}
                {form.fileType === 'code' && 'Source Code Archive Upload *'}
                {form.fileType === 'zip' && 'ZIP Bundle Upload *'}
                {form.fileType === 'doc' && 'Reference Document / Documentation Link *'}
              </label>

              {form.fileType === 'doc' && (
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setRefMode('file');
                      setFileError('');
                    }}
                    className={`px-2 py-0.5 rounded font-medium transition-colors ${
                      refMode === 'file' ? 'bg-white text-teal-700 shadow-xs font-bold' : 'text-slate-600'
                    }`}
                  >
                    Document File
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRefMode('url');
                      setFileError('');
                    }}
                    className={`px-2 py-0.5 rounded font-medium transition-colors ${
                      refMode === 'url' ? 'bg-white text-teal-700 shadow-xs font-bold' : 'text-slate-600'
                    }`}
                  >
                    Web Reference URL
                  </button>
                </div>
              )}
            </div>

            {/* File Dropzone */}
            {(form.fileType !== 'doc' || refMode === 'file') && (
              <div
                className={`p-5 border-2 border-dashed rounded-xl text-center transition-all ${
                  fileError
                    ? 'border-rose-400 bg-rose-50/20'
                    : selectedFile
                    ? 'border-teal-500 bg-teal-50/20'
                    : 'border-slate-300 hover:border-teal-400 bg-slate-50/60'
                }`}
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-teal-700">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-bold text-xs truncate max-w-[280px]">{selectedFileName}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Type: {form.fileType.toUpperCase()}
                    </p>
                    <button
                      type="button"
                      onClick={handleClearSelectedFile}
                      className="text-[11px] text-rose-600 hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <X className="h-3 w-3" /> Remove & Choose Different File
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {form.fileType === 'pdf' && <FileText className="h-8 w-8 text-rose-500 mx-auto" />}
                    {form.fileType === 'code' && <Code className="h-8 w-8 text-indigo-500 mx-auto" />}
                    {form.fileType === 'zip' && <Layers className="h-8 w-8 text-sky-500 mx-auto" />}
                    {form.fileType === 'doc' && <BookOpen className="h-8 w-8 text-emerald-500 mx-auto" />}

                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {form.fileType === 'pdf' && 'Select PDF Document (.pdf)'}
                        {form.fileType === 'code' && 'Select Source Code Archive (.zip, .tar.gz, .tgz, .tar)'}
                        {form.fileType === 'zip' && 'Select Compressed ZIP Bundle (.zip)'}
                        {form.fileType === 'doc' && 'Select Reference Document (.doc, .docx, .pdf, .txt, .md)'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Maximum upload size: 25 MB</p>
                    </div>

                    <label className="inline-block cursor-pointer pt-1">
                      <span className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs inline-flex items-center gap-1.5 transition-colors">
                        <Upload className="h-3.5 w-3.5 text-teal-600" /> Browse File
                      </span>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept={getAcceptAttribute(form.fileType)}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Reference URL Input */}
            {form.fileType === 'doc' && refMode === 'url' && (
              <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Documentation Reference Link *
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="url"
                    required
                    placeholder="https://docs.oracle.com/en/java/javase/21/docs/api/"
                    value={referenceUrl}
                    onChange={(e) => {
                      setReferenceUrl(e.target.value);
                      if (fileError) setFileError('');
                    }}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Provide verified link to vendor documentation, RFC standards, or public whitepapers.
                </p>
              </div>
            )}

            {/* File Error Message */}
            {fileError && (
              <p className="text-[11px] text-rose-500 flex items-center gap-1 font-medium mt-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {fileError}
              </p>
            )}

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-1 pt-2">
                <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold">
                  <span>Uploading asset (Simulated)...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-teal-600 h-1.5 rounded-full transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold mb-1">Description & Topic Summary</label>
            <textarea
              rows={2}
              placeholder="Outline what this document covers and prerequisites..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={isUploading}
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={isUploading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isUploading ? `Publishing (${uploadProgress}%)` : 'Publish Material'}
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
              <Button
                variant="primary"
                size="sm"
                className="bg-teal-600 hover:bg-teal-700"
                rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
                onClick={() => handleDownloadMaterial(previewMaterial)}
              >
                Download / View File
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
