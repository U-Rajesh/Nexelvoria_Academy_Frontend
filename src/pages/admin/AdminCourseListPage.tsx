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

  // Form State
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<
    'Software Development' | 'Data & AI' | 'Cloud & DevOps' | 'Cybersecurity' | 'Testing'
  >('Software Development');
  const [shortDescription, setShortDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(16);
  const [totalHours, setTotalHours] = useState(160);
  const [feeINR, setFeeINR] = useState(45000);
  const [discountedFeeINR, setDiscountedFeeINR] = useState(38000);
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [technologies, setTechnologies] = useState('Java, Spring Boot, Microservices, Docker');
  const [prerequisites, setPrerequisites] = useState('Basic programming intuition');
  const [learningOutcomes, setLearningOutcomes] = useState('Enterprise Architecture, Production Deployment');
  const [status, setStatus] = useState<CourseStatus>('Published');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCourses = async () => {
    const res = await adminService.getCourses();
    if (res.success) setCourses(res.data);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleOpenCreate = () => {
    setEditingCourse(null);
    setTitle('');
    setCourseCode(`CRS-${Math.floor(100 + Math.random() * 900)}`);
    setSlug('');
    setCategory('Software Development');
    setShortDescription('');
    setLongDescription('');
    setDurationWeeks(16);
    setTotalHours(160);
    setFeeINR(45000);
    setDiscountedFeeINR(38000);
    setLevel('Intermediate');
    setTechnologies('Java, Spring Boot, Microservices, Docker');
    setPrerequisites('Basic programming intuition');
    setLearningOutcomes('Enterprise Architecture, Production Deployment');
    setStatus('Published');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setTitle(course.title);
    setCourseCode(course.courseCode || `CRS-${course.id.slice(-3).toUpperCase()}`);
    setSlug(course.slug);
    setCategory(course.category);
    setShortDescription(course.shortDescription);
    setLongDescription(course.longDescription || course.shortDescription);
    setDurationWeeks(course.durationWeeks);
    setTotalHours(course.totalHours);
    setFeeINR(course.feeINR);
    setDiscountedFeeINR(course.discountedFeeINR || course.feeINR);
    setLevel(course.level);
    setTechnologies(course.technologies.join(', '));
    setPrerequisites(course.prerequisites?.join(', ') || '');
    setLearningOutcomes(course.learningOutcomes?.join(', ') || '');
    setStatus(course.status || (course.isPublished ? 'Published' : 'Draft'));
    setIsModalOpen(true);
  };

  const handleTogglePublish = async (courseId: string) => {
    if (!user) return;
    const res = await adminService.toggleCoursePublish({ id: user.id, name: user.name }, courseId);
    if (res.success) {
      showToast({
        type: 'info',
        title: 'Course Visibility Updated',
        message: res.message || 'Course visibility updated.',
      });
      loadCourses();
    }
  };

  const handleArchiveCourse = async (course: Course) => {
    if (!user) return;
    if (window.confirm(`Archive "${course.title}"? It will no longer accept new student enrollments.`)) {
      const res = await adminService.archiveCourse({ id: user.id, name: user.name }, course.id);
      if (res.success) {
        showToast({
          type: 'warning',
          title: 'Course Archived',
          message: `${course.title} has been moved to the archived catalog.`,
        });
        loadCourses();
      }
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setIsSubmitting(true);
    const techArray = technologies.split(',').map((t) => t.trim()).filter(Boolean);
    const prereqArray = prerequisites.split(',').map((p) => p.trim()).filter(Boolean);
    const outcomesArray = learningOutcomes.split(',').map((o) => o.trim()).filter(Boolean);

    if (editingCourse) {
      const res = await adminService.updateCourse({ id: user.id, name: user.name }, editingCourse.id, {
        title,
        courseCode,
        slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        shortDescription,
        longDescription: longDescription || shortDescription,
        durationWeeks,
        totalHours,
        feeINR,
        discountedFeeINR,
        level,
        category,
        technologies: techArray,
        prerequisites: prereqArray,
        learningOutcomes: outcomesArray,
        isPublished: status === 'Published' || status === 'Active',
        status,
      });
      setIsSubmitting(false);

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Course Updated',
          message: `Program details for "${title}" have been updated successfully.`,
        });
        setIsModalOpen(false);
        loadCourses();
      }
    } else {
      const res = await adminService.createCourse(
        { id: user.id, name: user.name },
        {
          courseCode,
          slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title,
          shortDescription,
          longDescription: longDescription || shortDescription,
          thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
          durationWeeks,
          totalHours,
          feeINR,
          discountedFeeINR,
          level,
          category,
          technologies: techArray,
          isPublished: status === 'Published' || status === 'Active',
          status,
          hasPlacementGuarantee: true,
          prerequisites: prereqArray,
          learningOutcomes: outcomesArray,
          modules: [],
        }
      );
      setIsSubmitting(false);

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Course Program Created',
          message: `${title} is now available in the curriculum catalog. (ADM-006)`,
        });
        setIsModalOpen(false);
        loadCourses();
      }
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
                    <Badge variant="purple" size="sm">{course.category}</Badge>
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
                    {course.durationWeeks} Weeks • {course.totalHours} Practical Hours • {course.level}
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
                <label className="block font-semibold text-slate-800 mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artificial Intelligence & Deep Learning"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Course Code</label>
                <input
                  type="text"
                  placeholder="e.g. CRS-AID-301"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Software Development">Software Development</option>
                  <option value="Data & AI">Data & AI</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Testing">Testing</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Level *</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Lifecycle Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CourseStatus)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Published">Published (Public Catalog)</option>
                  <option value="Draft">Draft (Internal Only)</option>
                  <option value="Active">Active (Ongoing Sessions)</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Duration (Weeks)</label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  required
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Practical Hours</label>
                <input
                  type="number"
                  min={10}
                  max={600}
                  required
                  value={totalHours}
                  onChange={(e) => setTotalHours(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Fee (INR ₹)</label>
                <input
                  type="number"
                  min={0}
                  step={500}
                  required
                  value={feeINR}
                  onChange={(e) => setFeeINR(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Discounted (INR ₹)</label>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={discountedFeeINR}
                  onChange={(e) => setDiscountedFeeINR(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Short Description (Catalog Blurb) *</label>
              <textarea
                required
                rows={2}
                placeholder="High-level overview visible on course cards..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Detailed Long Description</label>
              <textarea
                rows={3}
                placeholder="In-depth program scope, target audience, and architecture topics..."
                value={longDescription}
                onChange={(e) => setLongDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Technologies & Tools Covered (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="Python, PyTorch, Docker, Kubernetes, LangChain"
                value={technologies}
                onChange={(e) => setTechnologies(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Prerequisites (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="Basic programming intuition, Math fundamentals"
                  value={prerequisites}
                  onChange={(e) => setPrerequisites(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Learning Outcomes (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="Microservice architecture, Cloud deployment"
                  value={learningOutcomes}
                  onChange={(e) => setLearningOutcomes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
                {editingCourse ? 'Save Changes' : 'Publish Course'}
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
