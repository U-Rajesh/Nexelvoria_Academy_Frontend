import React, { useState } from 'react';
import {
  Layers,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Video,
  FileText,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../feedback/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import type { Course, CourseModule, Chapter, Lesson, LessonType } from '../../types';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface AdminCourseSyllabusEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  onSaved: () => void;
}

export const AdminCourseSyllabusEditorModal: React.FC<AdminCourseSyllabusEditorModalProps> = ({
  isOpen,
  onClose,
  course,
  onSaved,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [modules, setModules] = useState<CourseModule[]>(course.modules || []);
  const [activeModuleId, setActiveModuleId] = useState<string>(course.modules[0]?.id || '');
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

  const activeModule = modules.find((m) => m.id === activeModuleId) || modules[0];

  // Save full curriculum
  const handleSaveCurriculum = async () => {
    if (!user) return;
    setIsSaving(true);
    const res = await adminService.updateCourseCurriculum(
      { id: user.id, name: user.name },
      course.id,
      modules
    );
    setIsSaving(false);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Curriculum Updated',
        message: `Syllabus for "${course.title}" saved successfully with ${modules.length} modules.`,
      });
      onSaved();
      onClose();
    } else {
      showToast({
        type: 'error',
        title: 'Error Saving Curriculum',
        message: res.error || 'Failed to update course syllabus.',
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
            ? { ...m, title: moduleForm.title, description: moduleForm.description }
            : m
        )
      );
    } else {
      const newModule: CourseModule = {
        id: `mod-${Date.now()}`,
        courseId: course.id,
        title: moduleForm.title,
        description: moduleForm.description,
        order: modules.length + 1,
        chapters: [],
      };
      setModules((prev) => [...prev, newModule]);
      setActiveModuleId(newModule.id);
    }
    setModuleModalOpen(false);
  };

  const handleDeleteModule = (modId: string) => {
    if (window.confirm('Delete this module and all its chapters & lessons?')) {
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
            chapters: mod.chapters.map((ch) =>
              ch.id === editingChapterId
                ? { ...ch, title: chapterForm.title, description: chapterForm.description }
                : ch
            ),
          };
        } else {
          const newChap: Chapter = {
            id: `chap-${Date.now()}`,
            moduleId: mod.id,
            title: chapterForm.title,
            description: chapterForm.description,
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
          return { ...mod, chapters: mod.chapters.filter((ch) => ch.id !== chapId) };
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
      durationMinutes: les.durationMinutes || 45,
      lessonType: les.lessonType || 'video',
      videoUrl: les.videoUrl || '',
      pdfUrl: les.pdfUrl || '',
      studyMaterialText: les.studyMaterialText || '',
      isFreePreview: !!les.isFreePreview,
    });
    setLessonModalOpen(true);
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonForm.title.trim()) return;

    setModules((prev) =>
      prev.map((mod) => ({
        ...mod,
        chapters: mod.chapters.map((ch) => {
          if (ch.id !== targetChapterId) return ch;
          if (editingLessonId) {
            return {
              ...ch,
              lessons: ch.lessons.map((les) =>
                les.id === editingLessonId
                  ? {
                      ...les,
                      title: lessonForm.title,
                      durationMinutes: Number(lessonForm.durationMinutes),
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
              chapterId: ch.id,
              title: lessonForm.title,
              durationMinutes: Number(lessonForm.durationMinutes),
              lessonType: lessonForm.lessonType,
              videoUrl: lessonForm.videoUrl,
              pdfUrl: lessonForm.pdfUrl,
              studyMaterialText: lessonForm.studyMaterialText,
              isFreePreview: lessonForm.isFreePreview,
              order: ch.lessons.length + 1,
            };
            return { ...ch, lessons: [...ch.lessons, newLes] };
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
          chapters: mod.chapters.map((ch) => {
            if (ch.id !== chapId) return ch;
            return { ...ch, lessons: ch.lessons.filter((l) => l.id !== lesId) };
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
        title={`Curriculum & Syllabus Authoring: ${course.title}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {course.courseCode || 'CRS-PROG'} • {course.title}
                </h4>
                <p className="text-xs text-slate-500">
                  Hierarchy: Course $\to$ Batch $\to$ Module $\to$ Chapter $\to$ Lesson. Free previews enable pre-payment preview (BR-003).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAddModule}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
              >
                Add Module
              </Button>
            </div>
          </div>

          {/* Module Selector & Navigation */}
          {modules.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
              <BookOpen className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No Curriculum Modules Configured</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Create the first structured module to begin organizing chapters and lessons for this course.
              </p>
              <Button variant="primary" size="sm" onClick={handleOpenAddModule} leftIcon={<Plus className="h-3.5 w-3.5" />}>
                Create Module 01
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Modules Sidebar */}
              <div className="space-y-2 border-r border-slate-200 pr-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Modules ({modules.length})
                  </span>
                  <button
                    onClick={handleOpenAddModule}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[460px] overflow-y-auto">
                  {modules.map((mod, idx) => {
                    const isSelected = mod.id === activeModule?.id;
                    const totalLessons = mod.chapters.reduce((acc, c) => acc + c.lessons.length, 0);
                    return (
                      <div
                        key={mod.id}
                        onClick={() => setActiveModuleId(mod.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-semibold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                            Module 0{idx + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModule(mod);
                              }}
                              className="p-1 hover:text-indigo-600 rounded"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteModule(mod.id);
                              }}
                              className="p-1 hover:text-rose-600 rounded"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs mt-1 line-clamp-1">{mod.title}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {mod.chapters.length} Chapters • {totalLessons} Lessons
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Module Chapters & Lessons Detail */}
              <div className="md:col-span-2 space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {activeModule && (
                  <>
                    <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{activeModule.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{activeModule.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAddChapter(activeModule.id)}
                        leftIcon={<Plus className="h-3.5 w-3.5" />}
                      >
                        Add Chapter
                      </Button>
                    </div>

                    {activeModule.chapters.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                        <p className="text-xs font-semibold text-slate-600">No chapters in this module yet</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAddChapter(activeModule.id)}
                          leftIcon={<Plus className="h-3.5 w-3.5" />}
                        >
                          Add Chapter
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeModule.chapters.map((chap, chapIdx) => (
                          <div
                            key={chap.id}
                            className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                  Chapter {chapIdx + 1}
                                </span>
                                <h5 className="text-xs font-bold text-slate-800">{chap.title}</h5>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-[11px] h-7 px-2 text-indigo-600"
                                  onClick={() => handleOpenAddLesson(chap.id)}
                                  leftIcon={<Plus className="h-3 w-3" />}
                                >
                                  Add Lesson
                                </Button>
                                <button
                                  onClick={() => handleOpenEditChapter(activeModule.id, chap)}
                                  className="p-1 text-slate-400 hover:text-indigo-600"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteChapter(activeModule.id, chap.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Lessons List */}
                            {chap.lessons.length === 0 ? (
                              <p className="text-[11px] text-slate-400 italic py-1">
                                No lessons added to this chapter yet.
                              </p>
                            ) : (
                              <div className="space-y-1.5 pl-2 border-l-2 border-slate-100">
                                {chap.lessons.map((les) => (
                                  <div
                                    key={les.id}
                                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors text-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      {les.lessonType === 'video' ? (
                                        <Video className="h-3.5 w-3.5 text-indigo-500" />
                                      ) : les.lessonType === 'reading' ? (
                                        <FileText className="h-3.5 w-3.5 text-emerald-500" />
                                      ) : (
                                        <BookOpen className="h-3.5 w-3.5 text-amber-500" />
                                      )}
                                      <span className="font-medium text-slate-800">{les.title}</span>
                                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {les.durationMinutes}m
                                      </span>
                                      {les.isFreePreview && (
                                        <Badge variant="success" size="sm">
                                          Free Preview (BR-003)
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleOpenEditLesson(chap.id, les)}
                                        className="p-1 text-slate-400 hover:text-indigo-600"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteLesson(chap.id, les.id)}
                                        className="p-1 text-slate-400 hover:text-rose-600"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Total Modules: <strong>{modules.length}</strong>
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveCurriculum}
                isLoading={isSaving}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
              >
                Save All Syllabus Changes
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* 1. Add / Edit Module Modal */}
      <Modal
        isOpen={moduleModalOpen}
        onClose={() => setModuleModalOpen(false)}
        title={editingModuleId ? 'Edit Course Module' : 'Add New Module'}
        size="md"
      >
        <form onSubmit={handleSaveModule} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Module Title *
            </label>
            <input
              type="text"
              required
              value={moduleForm.title}
              onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
              placeholder="e.g. Module 3: Microservices & Distributed Architecture"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Learning Focus
            </label>
            <textarea
              rows={3}
              value={moduleForm.description}
              onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
              placeholder="Summary of skills and competencies taught in this module..."
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setModuleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingModuleId ? 'Update Module' : 'Create Module'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Add / Edit Chapter Modal */}
      <Modal
        isOpen={chapterModalOpen}
        onClose={() => setChapterModalOpen(false)}
        title={editingChapterId ? 'Edit Chapter' : 'Add New Chapter'}
        size="md"
      >
        <form onSubmit={handleSaveChapter} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chapter Title *
            </label>
            <input
              type="text"
              required
              value={chapterForm.title}
              onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
              placeholder="e.g. Chapter 1: Service Discovery & Eureka Server"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chapter Scope (Optional)
            </label>
            <input
              type="text"
              value={chapterForm.description}
              onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
              placeholder="Brief context..."
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setChapterModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingChapterId ? 'Update Chapter' : 'Add Chapter'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Add / Edit Lesson Modal */}
      <Modal
        isOpen={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        title={editingLessonId ? 'Edit Lesson' : 'Add New Lesson'}
        size="lg"
      >
        <form onSubmit={handleSaveLesson} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lesson Title *
              </label>
              <input
                type="text"
                required
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                placeholder="e.g. Lesson 3.1: Resiliency with Circuit Breakers"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration (Mins) *
              </label>
              <input
                type="number"
                min={5}
                max={300}
                required
                value={lessonForm.durationMinutes}
                onChange={(e) => setLessonForm({ ...lessonForm, durationMinutes: Number(e.target.value) })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lesson Content Type
              </label>
              <select
                value={lessonForm.lessonType}
                onChange={(e) => setLessonForm({ ...lessonForm, lessonType: e.target.value as LessonType })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="video">Recorded Video Lecture</option>
                <option value="reading">Article / Markdown Reading</option>
                <option value="pdf">PDF Lab Manual</option>
                <option value="assignment">Practical Assignment</option>
                <option value="quiz">Interactive Quiz</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Video Player URL (YouTube/S3)
              </label>
              <input
                type="url"
                value={lessonForm.videoUrl}
                onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/embed/..."
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reference PDF / Lab Notes URL
            </label>
            <input
              type="url"
              value={lessonForm.pdfUrl}
              onChange={(e) => setLessonForm({ ...lessonForm, pdfUrl: e.target.value })}
              placeholder="https://example.com/handouts/lab-01.pdf"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lecture Notes & Key Takeaways
            </label>
            <textarea
              rows={3}
              value={lessonForm.studyMaterialText}
              onChange={(e) => setLessonForm({ ...lessonForm, studyMaterialText: e.target.value })}
              placeholder="Structured study notes for students..."
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* BR-003 Free Preview Flag */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <input
              type="checkbox"
              id="isFreePreview"
              checked={lessonForm.isFreePreview}
              onChange={(e) => setLessonForm({ ...lessonForm, isFreePreview: e.target.checked })}
              className="h-4 w-4 mt-0.5 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
            />
            <label htmlFor="isFreePreview" className="text-xs text-emerald-950 cursor-pointer">
              <strong>Allow Free Preview (SRS Rule BR-003):</strong> Unpaid prospective students can stream this lesson directly on the public course page prior to completing admission fees.
            </label>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setLessonModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingLessonId ? 'Update Lesson' : 'Save Lesson'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
