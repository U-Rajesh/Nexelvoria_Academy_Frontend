import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Edit,
  Layers,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatINR } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import { AdminCourseSyllabusEditorModal } from '../../components/admin/AdminCourseSyllabusEditorModal';
import type { Course, CourseStatus } from '../../types';

export const AdminCourseListPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Published' | 'Active' | 'Draft' | 'Inactive' | 'Archived'>('All');

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Syllabus Editor State
  const [syllabusCourse, setSyllabusCourse] = useState<Course | null>(null);

  // Form State: only fields the course table can store (see notice in the form).
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(16);
  const [feeINR, setFeeINR] = useState(0);
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [status, setStatus] = useState<CourseStatus>('Draft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadCourses = async () => {
    const res = await adminService.getCourses();
    if (res.success) {
      setCourses(res.data);
      setLoadError(null);
    } else {
      setLoadError(res.error || 'Courses could not be loaded.');
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleOpenCreate = () => {
    setEditingCourse(null);
    setTitle('');
    setCourseCode('');
    setShortDescription('');
    setLongDescription('');
    setDurationWeeks(16);
    setFeeINR(0);
    setLevel('Beginner');
    setStatus('Draft');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setTitle(course.title);
    setCourseCode(course.courseCode || course.slug);
    setShortDescription(course.shortDescription);
    setLongDescription(course.longDescription);
    setDurationWeeks(course.durationWeeks);
    setFeeINR(course.feeINR);
    setLevel(course.level);
    setStatus(course.status || (course.isPublished ? 'Published' : 'Draft'));
    setIsModalOpen(true);
  };

  const handleTogglePublish = async (courseId: string) => {
    if (!user) return;
    const res = await adminService.toggleCoursePublish({ id: user.id, name: user.name }, courseId);
    if (res.success) {
      showToast({ type: 'info', title: 'Course Visibility Updated', message: res.message || 'Course visibility updated.' });
      loadCourses();
    } else {
      showToast({ type: 'error', title: 'Could not change visibility', message: res.error || 'Please retry.' });
    }
  };

  const handleArchiveCourse = async (course: Course) => {
    if (!user) return;
    if (window.confirm(`Archive "${course.title}"? It will no longer accept new student enrollments.`)) {
      const res = await adminService.archiveCourse({ id: user.id, name: user.name }, course.id);
      if (res.success) {
        showToast({ type: 'warning', title: 'Course Archived', message: `${course.title} has been archived.` });
        loadCourses();
      } else {
        showToast({ type: 'error', title: 'Could not archive course', message: res.error || 'Please retry.' });
      }
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;
    const admin = { id: user.id, name: user.name };
    const code = courseCode.trim().toLowerCase();
    if (!editingCourse && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(code)) {
      showToast({
        type: 'warning',
        message: 'Course code: lowercase letters, digits and single hyphens only (it is also the public URL).',
      });
      return;
    }

    setIsSubmitting(true);
    const fields = {
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      longDescription: (longDescription || shortDescription).trim(),
      durationWeeks,
      feeINR,
      level,
    };

    const res = editingCourse
      ? await adminService.updateCourse(admin, editingCourse.id, fields)
      : await adminService.createCourse(admin, { ...fields, slug: code, courseCode: code } as Omit<Course, 'id'>);

    if (!res.success || !res.data) {
      setIsSubmitting(false);
      showToast({ type: 'error', title: 'Course not saved', message: res.error || 'Please retry.' });
      return;
    }

    // New courses start as Draft; lifecycle status has its own endpoint.
    const currentStatus = res.data.status || (res.data.isPublished ? 'Published' : 'Draft');
    let statusError: string | null = null;
    if (status !== currentStatus) {
      const st = await adminService.updateCourseStatus(admin, res.data.id, status);
      if (!st.success) statusError = st.error || 'Status was not changed.';
    }
    setIsSubmitting(false);
    setIsModalOpen(false);
    loadCourses();

    if (statusError) {
      showToast({ type: 'warning', title: 'Course saved, status unchanged', message: statusError });
    } else {
      showToast({
        type: 'success',
        title: editingCourse ? 'Course Updated' : 'Course Created',
        message: `"${fields.title}" saved.`,
      });
    }
  };

  const filteredCourses = courses.filter((c) => {
    const cStatus = c.status || (c.isPublished ? 'Published' : 'Draft');
    if (activeTab === 'All') return true;
    if (activeTab === 'Published') return cStatus === 'Published';
    if (activeTab === 'Active') return cStatus === 'Active';
    if (activeTab === 'Draft') return cStatus === 'Draft';
    if (activeTab === 'Inactive') return cStatus === 'Inactive';
    if (activeTab === 'Archived') return cStatus === 'Archived';
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Course Catalog & Curriculum (ADM-006)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Author and manage curriculum programs, modules, chapters, lessons, pricing tiers, and public catalog visibility.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/courses" target="_blank">
            <Button variant="outline" size="sm" rightIcon={<ExternalLink className="h-4 w-4" />}>
              Public Catalog
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Course
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">{loadError}</div>
      )}

      {/* Lifecycle Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {(['All', 'Published', 'Active', 'Draft', 'Inactive', 'Archived'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab} Programs (
            {courses.filter((c) => {
              const s = c.status || (c.isPublished ? 'Published' : 'Draft');
              if (tab === 'All') return true;
              if (tab === 'Published') return s === 'Published';
              if (tab === 'Active') return s === 'Active';
              if (tab === 'Draft') return s === 'Draft';
              if (tab === 'Inactive') return s === 'Inactive';
              if (tab === 'Archived') return s === 'Archived';
              return true;
            }).length}
            )
          </button>
        ))}
      </div>

      {/* Grid of Courses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCourses.map((course) => {
          const courseStatus = course.status || (course.isPublished ? 'Published' : 'Draft');
          return (
            <Card key={course.id} className="p-6 space-y-4 bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {course.courseCode && (
                      <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {course.courseCode}
                      </span>
                    )}
                    <Badge
                      variant={
                        courseStatus === 'Published' || courseStatus === 'Active'
                          ? 'success'
                          : courseStatus === 'Archived'
                          ? 'danger'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {courseStatus.toUpperCase()}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{course.title}</h3>
                  <p className="text-xs text-slate-500">
                    {course.durationWeeks} Weeks • {course.level}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-extrabold text-slate-900 block">
                    {formatINR(course.discountedFeeINR || course.feeINR)}
                  </span>
                  {course.discountedFeeINR && (
                    <span className="text-[11px] text-slate-400 line-through">
                      {formatINR(course.feeINR)}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {course.shortDescription}
              </p>

              <div className="flex flex-wrap gap-1 text-[11px]">
                {course.technologies.slice(0, 5).map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                    {t}
                  </span>
                ))}
                {course.technologies.length > 5 && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-400 font-mono">
                    +{course.technologies.length - 5} more
                  </span>
                )}
              </div>

              <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-700">
                    {course.modules.length} Modules
                  </span>
                  <span>•</span>
                  <Link
                    to={`/admin/batches?courseId=${course.id}`}
                    className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Calendar className="h-3 w-3" /> View Cohorts
                  </Link>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSyllabusCourse(course)}
                    className="text-xs text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 border-indigo-200"
                    leftIcon={<Layers className="h-3.5 w-3.5" />}
                  >
                    Curriculum Editor
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(course)}
                    className="text-xs text-slate-600 hover:text-slate-900"
                    leftIcon={<Edit className="h-3.5 w-3.5" />}
                  >
                    Edit
                  </Button>

                  {courseStatus !== 'Archived' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchiveCourse(course)}
                      className="text-xs text-slate-400 hover:text-rose-600"
                    >
                      Archive
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublish(course.id)}
                      className="text-xs text-emerald-600"
                    >
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create / Edit Course Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCourse ? `Edit Course Program: ${editingCourse.title}` : 'Create New Training Program (ADM-006)'}
          size="lg"
        >
          <form onSubmit={handleSaveCourse} className="space-y-4 text-xs text-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="crs-title" className="block font-semibold text-slate-800 mb-1">Course Title *</label>
                <input
                  id="crs-title"
                  type="text"
                  required
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div>
                <label htmlFor="crs-code" className="block font-semibold text-slate-800 mb-1">Course Code / URL *</label>
                <input
                  id="crs-code"
                  type="text"
                  required
                  maxLength={40}
                  placeholder="e.g. java-full-stack"
                  value={courseCode}
                  disabled={!!editingCourse}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-medium disabled:bg-slate-50"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {editingCourse ? 'Fixed after creation (public URL).' : 'Lowercase, digits and hyphens.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label htmlFor="crs-level" className="block font-semibold text-slate-800 mb-1">Level *</label>
                <select
                  id="crs-level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as 'Beginner' | 'Intermediate' | 'Advanced')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label htmlFor="crs-status" className="block font-semibold text-slate-800 mb-1">Lifecycle Status</label>
                <select
                  id="crs-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CourseStatus)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Draft">Draft (internal only)</option>
                  <option value="Published">Published (public catalog)</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div>
                <label htmlFor="crs-weeks" className="block font-semibold text-slate-800 mb-1">Duration (weeks) *</label>
                <input
                  id="crs-weeks"
                  type="number"
                  min={1}
                  max={104}
                  required
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="crs-fee" className="block font-semibold text-slate-800 mb-1">Fee (₹) *</label>
                <input
                  id="crs-fee"
                  type="number"
                  min={0}
                  step={1}
                  required
                  value={feeINR}
                  onChange={(e) => setFeeINR(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label htmlFor="crs-short" className="block font-semibold text-slate-800 mb-1">Short Description *</label>
              <textarea
                id="crs-short"
                required
                rows={2}
                maxLength={500}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="crs-long" className="block font-semibold text-slate-800 mb-1">Detailed Description</label>
              <textarea
                id="crs-long"
                rows={3}
                value={longDescription}
                onChange={(e) => setLongDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
              Category, thumbnail, practical hours, discounted fee, technologies, prerequisites, learning outcomes,
              placement-guarantee flag and SEO cannot be saved yet: the course table has no columns for them. They will be
              enabled once the proposed database change is approved.
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
                {editingCourse ? 'Save Changes' : 'Create Course'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Curriculum & Syllabus Authoring Modal */}
      {syllabusCourse && (
        <AdminCourseSyllabusEditorModal
          isOpen={!!syllabusCourse}
          onClose={() => setSyllabusCourse(null)}
          course={syllabusCourse}
          onSaved={() => {
            loadCourses();
          }}
        />
      )}
    </div>
  );
};
