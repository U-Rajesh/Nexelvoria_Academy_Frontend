import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Video,
  FileText,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Modal } from '../feedback/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import type { Course, CourseModule, Chapter, Lesson, LessonType } from '../../types';
import { teacherService } from '../../services/teacherService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface TeacherCourseEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  onSaved: () => void;
}

export const TeacherCourseEditorModal: React.FC<TeacherCourseEditorModalProps> = ({
  isOpen,
  onClose,
  course,
  onSaved,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'info' | 'curriculum'>('info');

  // Instructional Form State
  const [title, setTitle] = useState(course.title);
  const [shortDescription, setShortDescription] = useState(course.shortDescription || '');
  const [longDescription, setLongDescription] = useState(course.longDescription || '');
  const [technologies, setTechnologies] = useState(course.technologies?.join(', ') || '');
  const [prerequisites, setPrerequisites] = useState(course.prerequisites?.join(', ') || '');
  const [learningOutcomes, setLearningOutcomes] = useState(course.learningOutcomes?.join(', ') || '');

  // Curriculum State
  const [modules, setModules] = useState<CourseModule[]>(course.modules || []);
  const [activeModuleId, setActiveModuleId] = useState<string>(course.modules?.[0]?.id || '');
  const [isSaving, setIsSaving] = useState(false);

  // Module Modal / Form state
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  // Chapter Modal / Form state
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState('');
  const [chapterForm, setChapterForm] = useState({ title: '', description: '' });
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);

  // Lesson Modal / Form state
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [targetChapterId, setTargetChapterId] = useState('');
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState<{
    title: string;
    durationMinutes: number;
    lessonType: LessonType;
    videoUrl: string;
    pdfUrl: string;
    studyMaterialText: string;
    isFreePreview: boolean;
  }>({
    title: '',
    durationMinutes: 45,
    lessonType: 'video',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    pdfUrl: '',
    studyMaterialText: '',
    isFreePreview: false,
  });

  useEffect(() => {
    setTitle(course.title);
    setShortDescription(course.shortDescription || '');
    setLongDescription(course.longDescription || '');
    setTechnologies(course.technologies?.join(', ') || '');
    setPrerequisites(course.prerequisites?.join(', ') || '');
    setLearningOutcomes(course.learningOutcomes?.join(', ') || '');
    setModules(course.modules || []);
    if (course.modules?.length > 0) {
      setActiveModuleId(course.modules[0].id);
    }
  }, [course]);

  const activeModule = modules.find((m) => m.id === activeModuleId) || modules[0];

  // Save all changes
  const handleSaveAll = async () => {
    if (!user) return;
    if (!title.trim()) {
      showToast({ type: 'error', message: 'Course title is required.' });
      return;
    }

    setIsSaving(true);
    const techArray = technologies.split(',').map((t) => t.trim()).filter(Boolean);
    const prereqArray = prerequisites.split(',').map((p) => p.trim()).filter(Boolean);
    const outcomesArray = learningOutcomes.split(',').map((o) => o.trim()).filter(Boolean);

    const res = await teacherService.updateAssignedCourse(
      { id: user.id, name: user.name },
      course.id,
      {
        title: title.trim(),
        shortDescription: shortDescription.trim(),
        longDescription: longDescription.trim(),
        technologies: techArray,
        prerequisites: prereqArray,
        learningOutcomes: outcomesArray,
        modules,
      }
    );
    setIsSaving(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Assigned Course Updated',
        message: `Pedagogical updates and curriculum for "${title}" have been saved and synchronized across portals.`,
      });
      onSaved();
      onClose();
    } else {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: res.error || 'Failed to update assigned course.',
      });
    }
  };

  // Module Actions
  const handleOpenAddModule = () => {
    setEditingModuleId(null);
    setModuleForm({ title: '', description: '' });
    setModuleModalOpen(true);
  };

  const handleOpenEditModule = (mod: CourseModule) => {
    setEditingModuleId(mod.id);
    setModuleForm({ title: mod.title, description: mod.description });
    setModuleModalOpen(true);
  };

  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleForm.title.trim()) return;

    if (editingModuleId) {
      setModules((prev) =>
        prev.map((m) =>
          m.id === editingModuleId
            ? { ...m, title: moduleForm.title.trim(), description: moduleForm.description.trim() }
            : m
        )
      );
    } else {
      const newModule: CourseModule = {
        id: `mod-${Date.now()}`,
        courseId: course.id,
        title: moduleForm.title.trim(),
        description: moduleForm.description.trim(),
        order: modules.length + 1,
        chapters: [],
      };
      setModules((prev) => [...prev, newModule]);
      setActiveModuleId(newModule.id);
    }
    setModuleModalOpen(false);
  };

  const handleDeleteModule = (modId: string) => {
    if (modules.length <= 1) {
      showToast({ type: 'warning', message: 'Course must retain at least one instructional module.' });
      return;
    }
    if (window.confirm('Delete this entire module and its chapters?')) {
      const filtered = modules.filter((m) => m.id !== modId);
      setModules(filtered);
      if (activeModuleId === modId) {
        setActiveModuleId(filtered[0]?.id || '');
      }
    }
  };

  // Chapter Actions
  const handleOpenAddChapter = (modId: string) => {
    setTargetModuleId(modId);
    setEditingChapterId(null);
    setChapterForm({ title: '', description: '' });
    setChapterModalOpen(true);
  };

  const handleOpenEditChapter = (modId: string, chap: Chapter) => {
    setTargetModuleId(modId);
    setEditingChapterId(chap.id);
    setChapterForm({ title: chap.title, description: chap.description || '' });
    setChapterModalOpen(true);
  };

  const handleSaveChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterForm.title.trim()) return;

    setModules((prev) =>
      prev.map((mod) => {
        if (mod.id !== targetModuleId) return mod;
        if (editingChapterId) {
          return {
            ...mod,
            chapters: mod.chapters.map((c) =>
              c.id === editingChapterId
                ? { ...c, title: chapterForm.title.trim(), description: chapterForm.description.trim() }
                : c
            ),
          };
        } else {
          const newChap: Chapter = {
            id: `chap-${Date.now()}`,
            moduleId: targetModuleId,
            title: chapterForm.title.trim(),
            description: chapterForm.description.trim(),
            order: mod.chapters.length + 1,
            lessons: [],
          };
          return { ...mod, chapters: [...mod.chapters, newChap] };
        }
      })
    );
    setChapterModalOpen(false);
  };

  const handleDeleteChapter = (modId: string, chapId: string) => {
    if (window.confirm('Delete this chapter and all contained lessons?')) {
      setModules((prev) =>
        prev.map((mod) => {
          if (mod.id !== modId) return mod;
          return {
            ...mod,
            chapters: mod.chapters.filter((c) => c.id !== chapId),
          };
        })
      );
    }
  };

  // Lesson Actions
  const handleOpenAddLesson = (chapId: string) => {
    setTargetChapterId(chapId);
    setEditingLessonId(null);
    setLessonForm({
      title: '',
      durationMinutes: 45,
      lessonType: 'video',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      pdfUrl: '',
      studyMaterialText: '',
      isFreePreview: false,
    });
    setLessonModalOpen(true);
  };

  const handleOpenEditLesson = (chapId: string, les: Lesson) => {
    setTargetChapterId(chapId);
    setEditingLessonId(les.id);
    setLessonForm({
      title: les.title,
      durationMinutes: les.durationMinutes,
      lessonType: les.lessonType || 'video',
      videoUrl: les.videoUrl || '',
      pdfUrl: les.pdfUrl || '',
      studyMaterialText: les.studyMaterialText || '',
      isFreePreview: les.isFreePreview || false,
    });
    setLessonModalOpen(true);
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonForm.title.trim()) return;

    setModules((prev) =>
      prev.map((mod) => ({
        ...mod,
        chapters: mod.chapters.map((chap) => {
          if (chap.id !== targetChapterId) return chap;
          if (editingLessonId) {
            return {
              ...chap,
              lessons: chap.lessons.map((les) =>
                les.id === editingLessonId
                  ? {
                      ...les,
                      title: lessonForm.title.trim(),
                      durationMinutes: Number(lessonForm.durationMinutes) || 45,
                      lessonType: lessonForm.lessonType,
                      videoUrl: lessonForm.videoUrl,
                      pdfUrl: lessonForm.pdfUrl,
                      studyMaterialText: lessonForm.studyMaterialText,
                      isFreePreview: lessonForm.isFreePreview,
                    }
                  : les
              ),
            };
          } else {
            const newLes: Lesson = {
              id: `les-${Date.now()}`,
              chapterId: targetChapterId,
              title: lessonForm.title.trim(),
              durationMinutes: Number(lessonForm.durationMinutes) || 45,
              lessonType: lessonForm.lessonType,
              videoUrl: lessonForm.videoUrl,
              pdfUrl: lessonForm.pdfUrl,
              studyMaterialText: lessonForm.studyMaterialText,
              isFreePreview: lessonForm.isFreePreview,
              order: chap.lessons.length + 1,
            };
            return { ...chap, lessons: [...chap.lessons, newLes] };
          }
        }),
      }))
    );
    setLessonModalOpen(false);
  };

  const handleDeleteLesson = (chapId: string, lesId: string) => {
    if (window.confirm('Delete this lesson?')) {
      setModules((prev) =>
        prev.map((mod) => ({
          ...mod,
          chapters: mod.chapters.map((chap) => {
            if (chap.id !== chapId) return chap;
            return {
              ...chap,
              lessons: chap.lessons.filter((l) => l.id !== lesId),
            };
          }),
        }))
      );
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Faculty Course Editor: ${course.title}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Institutional Governance Notice */}
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-2.5 text-xs text-teal-900">
            <Info className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <strong>Academic Governance (SRS Rule TCH-001):</strong> As authorized faculty, you can modify the instructional descriptions, competencies, prerequisites, modules, chapters, and lessons for this course. Commercial pricing, publication status, and student cohort allocations remain locked under Academic Administration authority.
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'info'
                  ? 'border-teal-600 text-teal-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Course Information & Competencies
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('curriculum')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'curriculum'
                  ? 'border-teal-600 text-teal-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Curriculum & Lesson Builder
              <Badge variant="purple" size="sm">
                {modules.length} Modules
              </Badge>
            </button>
          </div>

          {/* TAB 1: Course Instructional Info */}
          {activeTab === 'info' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Course Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                  placeholder="e.g. Full Stack Java Cloud Architecture & Microservices"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Short Summary / Abstract (Public & Student Catalog) *
                </label>
                <textarea
                  rows={2}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                  placeholder="Concise overview summarizing target skills and outcomes..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Comprehensive Syllabus Description *
                </label>
                <textarea
                  rows={4}
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs leading-relaxed"
                  placeholder="Detailed curriculum narrative, architectural themes, and hands-on lab expectations..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Technologies Covered (Comma Separated)
                </label>
                <input
                  type="text"
                  value={technologies}
                  onChange={(e) => setTechnologies(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                  placeholder="Java 21, Spring Boot 3, Kafka, Docker, Kubernetes, AWS"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Prerequisites (Comma Separated)
                  </label>
                  <textarea
                    rows={2}
                    value={prerequisites}
                    onChange={(e) => setPrerequisites(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                    placeholder="Core Java basics, Object-Oriented Programming intuition"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Learning Outcomes (Comma Separated)
                  </label>
                  <textarea
                    rows={2}
                    value={learningOutcomes}
                    onChange={(e) => setLearningOutcomes(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                    placeholder="Deploy cloud-native microservices, Architect distributed sagas"
                  />
                </div>
              </div>

              {/* Readonly Governance Badges */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400 block uppercase font-mono text-[9px]">Course Code</span>
                  <span className="font-bold text-slate-800 font-mono">{course.courseCode || course.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-mono text-[9px]">Category</span>
                  <span className="font-bold text-slate-800">{course.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-mono text-[9px]">Duration</span>
                  <span className="font-bold text-slate-800">{course.durationWeeks} Wks ({course.totalHours} Hrs)</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-mono text-[9px]">Status</span>
                  <span className="font-bold text-emerald-700">{course.status || 'Published'}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Curriculum & Lesson Builder */}
          {activeTab === 'curriculum' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Modules &amp; Lesson Hierarchy
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  onClick={handleOpenAddModule}
                >
                  Add New Module
                </Button>
              </div>

              {/* Module Navigation Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-100">
                {modules.map((mod, idx) => (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setActiveModuleId(mod.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeModuleId === mod.id
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>M{idx + 1}:</span>
                    <span className="truncate max-w-[120px]">{mod.title}</span>
                  </button>
                ))}
              </div>

              {/* Active Module Details */}
              {activeModule ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{activeModule.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{activeModule.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Edit2 className="h-3 w-3" />}
                        onClick={() => handleOpenEditModule(activeModule)}
                      >
                        Edit Module
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-600 hover:text-rose-700"
                        leftIcon={<Trash2 className="h-3 w-3" />}
                        onClick={() => handleDeleteModule(activeModule.id)}
                      >
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Plus className="h-3 w-3" />}
                        onClick={() => handleOpenAddChapter(activeModule.id)}
                      >
                        Add Chapter
                      </Button>
                    </div>
                  </div>

                  {/* Chapters List */}
                  <div className="space-y-3">
                    {activeModule.chapters.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-300">
                        No chapters yet in this module. Click &quot;Add Chapter&quot; above to create one.
                      </div>
                    ) : (
                      activeModule.chapters.map((chap, cIdx) => (
                        <div key={chap.id} className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-mono text-teal-700 font-bold uppercase">
                                Chapter {cIdx + 1}
                              </span>
                              <h5 className="text-xs font-bold text-slate-900">{chap.title}</h5>
                              {chap.description && (
                                <p className="text-[11px] text-slate-500">{chap.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleOpenEditChapter(activeModule.id, chap)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700"
                                onClick={() => handleDeleteChapter(activeModule.id, chap.id)}
                              >
                                Delete
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                leftIcon={<Plus className="h-3 w-3" />}
                                onClick={() => handleOpenAddLesson(chap.id)}
                              >
                                Add Lesson
                              </Button>
                            </div>
                          </div>

                          {/* Lessons inside Chapter */}
                          <div className="pl-3 border-l-2 border-slate-100 space-y-1.5">
                            {chap.lessons.length === 0 ? (
                              <p className="text-[11px] text-slate-400 italic">No lessons in this chapter yet.</p>
                            ) : (
                              chap.lessons.map((les, lIdx) => (
                                <div
                                  key={les.id}
                                  className="p-2 bg-slate-50 border border-slate-150 rounded flex items-center justify-between text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-slate-400">
                                      {lIdx + 1}.
                                    </span>
                                    {les.lessonType === 'video' ? (
                                      <Video className="h-3.5 w-3.5 text-indigo-600" />
                                    ) : (
                                      <FileText className="h-3.5 w-3.5 text-teal-600" />
                                    )}
                                    <span className="font-semibold text-slate-800">{les.title}</span>
                                    <span className="text-[10px] text-slate-400">
                                      ({les.durationMinutes}m)
                                    </span>
                                    {les.isFreePreview && (
                                      <Badge variant="success" size="sm">
                                        Free Preview
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditLesson(chap.id, les)}
                                      className="p-1 text-slate-500 hover:text-teal-700 cursor-pointer"
                                      title="Edit Lesson"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteLesson(chap.id, les.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                      title="Delete Lesson"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Changes reflect immediately in the Teacher Panel, Student LMS, and Admin catalog.
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white"
                onClick={handleSaveAll}
                isLoading={isSaving}
                leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
              >
                Save Course &amp; Curriculum
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Module Add/Edit Sub-Modal */}
      <Modal
        isOpen={moduleModalOpen}
        onClose={() => setModuleModalOpen(false)}
        title={editingModuleId ? 'Edit Module' : 'Add New Module'}
        size="md"
      >
        <form onSubmit={handleSaveModule} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Module Title *</label>
            <input
              type="text"
              required
              value={moduleForm.title}
              onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="e.g. Distributed Caching & Redis Sagas"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-800 mb-1">Module Description</label>
            <textarea
              rows={2}
              value={moduleForm.description}
              onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="Brief summary of skills and architecture patterns covered..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setModuleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" className="bg-teal-600">
              Save Module
            </Button>
          </div>
        </form>
      </Modal>

      {/* Chapter Add/Edit Sub-Modal */}
      <Modal
        isOpen={chapterModalOpen}
        onClose={() => setChapterModalOpen(false)}
        title={editingChapterId ? 'Edit Chapter' : 'Add New Chapter'}
        size="md"
      >
        <form onSubmit={handleSaveChapter} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Chapter Title *</label>
            <input
              type="text"
              required
              value={chapterForm.title}
              onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="e.g. Redis Cluster Sentinel & Replication Topology"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-800 mb-1">Chapter Description</label>
            <textarea
              rows={2}
              value={chapterForm.description}
              onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="Key concepts, lab tasks, or architectural breakdown..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setChapterModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" className="bg-teal-600">
              Save Chapter
            </Button>
          </div>
        </form>
      </Modal>

      {/* Lesson Add/Edit Sub-Modal */}
      <Modal
        isOpen={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        title={editingLessonId ? 'Edit Lesson Content' : 'Add New Lesson'}
        size="lg"
      >
        <form onSubmit={handleSaveLesson} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Lesson Title *</label>
              <input
                type="text"
                required
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="e.g. Setting up Redis Sentinel Multi-Node Failover"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min="5"
                max="360"
                value={lessonForm.durationMinutes}
                onChange={(e) => setLessonForm({ ...lessonForm, durationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Lesson Media Type</label>
              <select
                value={lessonForm.lessonType}
                onChange={(e) => setLessonForm({ ...lessonForm, lessonType: e.target.value as LessonType })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="video">Video Lecture (Embed / Stream)</option>
                <option value="pdf">PDF Reading Material / Manual</option>
                <option value="notes">Lecture Notes / Code Documentation</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isFreePreview"
                checked={lessonForm.isFreePreview}
                onChange={(e) => setLessonForm({ ...lessonForm, isFreePreview: e.target.checked })}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="isFreePreview" className="text-slate-700 font-semibold cursor-pointer">
                Allow Free Preview (Available to prospective students)
              </label>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Video URL (YouTube embed or MP4 stream link)
            </label>
            <input
              type="url"
              value={lessonForm.videoUrl}
              onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              placeholder="https://www.youtube.com/embed/..."
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              PDF Reading Material URL
            </label>
            <input
              type="url"
              value={lessonForm.pdfUrl}
              onChange={(e) => setLessonForm({ ...lessonForm, pdfUrl: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              placeholder="https://example.com/materials/redis-architecture.pdf"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Lecture Notes &amp; Code Walkthrough
            </label>
            <textarea
              rows={4}
              value={lessonForm.studyMaterialText}
              onChange={(e) => setLessonForm({ ...lessonForm, studyMaterialText: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              placeholder="Detailed notes, code blocks, or step-by-step instructions for students..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setLessonModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" className="bg-teal-600">
              Save Lesson
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
