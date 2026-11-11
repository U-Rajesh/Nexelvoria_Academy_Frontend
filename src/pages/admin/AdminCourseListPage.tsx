import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Clock,
  Users,
  ArrowRight,
  Eye,
  Edit,
  CheckCircle2,
  XCircle,
  Sparkles,
  Tag,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatINR } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import type { Course } from '../../types';

export const AdminCourseListPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);

  // Form State
  const [title, setTitle] = useState('');
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCourses = async () => {
    const res = await adminService.getCourses();
    if (res.success) setCourses(res.data);
  };

  useEffect(() => {
    loadCourses();
  }, []);

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

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setIsSubmitting(true);
    const techArray = technologies.split(',').map((t) => t.trim()).filter(Boolean);

    const res = await adminService.createCourse(
      { id: user.id, name: user.name },
      {
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
        isPublished: true,
        hasPlacementGuarantee: true,
        prerequisites: ['Basic programming intuition'],
        learningOutcomes: ['Enterprise Architecture', 'Production Deployment', 'Industry Standards'],
        modules: [],
      }
    );
    setIsSubmitting(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Course Program Created',
        message: `${title} is now in the course catalog. (ADM-006)`,
      });
      setIsCreateModalOpen(false);
      loadCourses();
      // Reset form
      setTitle('');
      setSlug('');
      setShortDescription('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Course Catalog & Curriculum (ADM-006)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage course curriculum, modules, chapters, pricing tiers, and public catalog visibility.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/courses" target="_blank">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Public Catalog
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Course
          </Button>
        </div>
      </div>

      {/* Grid of Courses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="p-6 space-y-4 bg-white border border-slate-200">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="purple" size="sm">{course.category}</Badge>
                  <Badge variant={course.isPublished ? 'success' : 'neutral'} size="sm">
                    {course.isPublished ? 'PUBLISHED' : 'DRAFT'}
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{course.title}</h3>
                <p className="text-xs text-slate-500">
                  {course.durationWeeks} Weeks • {course.totalHours} Practical Hours • {course.level}
                </p>
              </div>

              <div className="text-right">
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

            <div className="pt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
              <span>{course.modules.length} Modules in Curriculum</span>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewCourse(course)}
                  className="text-xs text-indigo-600 hover:bg-indigo-50"
                  leftIcon={<Eye className="h-3.5 w-3.5" />}
                >
                  Curriculum
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTogglePublish(course.id)}
                  className="text-xs text-slate-700"
                >
                  {course.isPublished ? 'Unpublish' : 'Publish'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Course Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Training Program (ADM-006)"
          size="lg"
        >
          <form onSubmit={handleCreateCourse} className="space-y-4 text-xs text-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
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
                <label className="block font-semibold text-slate-800 mb-1">URL Slug (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ai-deep-learning-mastery"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="Software Development">Software Development</option>
                  <option value="Data & AI">Data & AI</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Testing">Testing</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Difficulty Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Duration (Weeks)</label>
                <input
                  type="number"
                  min={4}
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Practical Hours</label>
                <input
                  type="number"
                  min={20}
                  value={totalHours}
                  onChange={(e) => setTotalHours(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Standard Tuition Fee (₹ INR) *</label>
                <input
                  type="number"
                  required
                  min={5000}
                  value={feeINR}
                  onChange={(e) => setFeeINR(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Discounted Offer Fee (₹ INR)</label>
                <input
                  type="number"
                  min={0}
                  value={discountedFeeINR}
                  onChange={(e) => setDiscountedFeeINR(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Technologies & Tools (Comma separated)</label>
              <input
                type="text"
                placeholder="Python, PyTorch, LangChain, PostgreSQL, AWS"
                value={technologies}
                onChange={(e) => setTechnologies(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Short Description</label>
              <textarea
                rows={2}
                placeholder="Brief summary displayed on cards and catalogs"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save & Add to Catalog
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Curriculum Preview Modal */}
      {previewCourse && (
        <Modal
          isOpen={!!previewCourse}
          onClose={() => setPreviewCourse(null)}
          title={`Curriculum Overview: ${previewCourse.title}`}
          size="lg"
        >
          <div className="space-y-4 text-xs text-slate-700">
            <p className="text-slate-600 leading-relaxed">{previewCourse.longDescription}</p>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span>Duration: <strong>{previewCourse.durationWeeks} Weeks</strong></span>
              <span>Hours: <strong>{previewCourse.totalHours} hrs</strong></span>
              <span>Fee: <strong>{formatINR(previewCourse.discountedFeeINR || previewCourse.feeINR)}</strong></span>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Course Modules</h4>
              {previewCourse.modules.length === 0 ? (
                <p className="text-slate-400 italic">No structured modules yet. Modules can be added dynamically.</p>
              ) : (
                previewCourse.modules.map((mod, idx) => (
                  <div key={mod.id} className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                    <span className="font-bold text-indigo-700">Module {idx + 1}: {mod.title}</span>
                    <p className="text-slate-500 text-[11px]">{mod.description}</p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setPreviewCourse(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
