import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, BookOpen, ArrowRight, Filter, Award, MessageSquare, CheckCircle, Sparkles } from 'lucide-react';
import { SEED_COURSES } from '../../mocks/seedData';
import { getStorageItem } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/appConfig';
import type { Course } from '../../types';
import { formatINR } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import { SEO } from '../../components/common/SEO';
import { useNotification } from '../../context/NotificationContext';
import { cmsService } from '../../services/cmsService';
import { analytics } from '../../utils/analytics';

export const CoursesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [enquiryModalCourse, setEnquiryModalCourse] = useState<string | null>(null);
  const [enquiryForm, setEnquiryForm] = useState({ name: '', email: '', phone: '', message: '' });

  const { showToast } = useNotification();

  const categories = ['All', 'Software Development', 'Data & AI', 'Cloud & DevOps'];
  const levels = ['All', 'Beginner to Advanced', 'Intermediate', 'Advanced'];

  const allCourses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);

  const filteredCourses = allCourses.filter((course) => {
    const courseStatus = course.status || (course.isPublished ? 'Published' : 'Draft');
    // Only Published or Active courses are visible to the public (excludes Draft, Inactive, and Archived)
    const isPublic = courseStatus === 'Published' || courseStatus === 'Active';
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel;
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.technologies.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return isPublic && matchesCategory && matchesLevel && matchesSearch;
  });

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryModalCourse) return;

    cmsService.submitEnquiry({
      type: 'course_admission',
      name: enquiryForm.name,
      email: enquiryForm.email,
      phone: enquiryForm.phone,
      courseOfInterest: enquiryModalCourse,
      message: enquiryForm.message,
    });
    analytics.trackEvent('submit_course_card_enquiry', 'Course', enquiryModalCourse);

    showToast({
      type: 'success',
      title: 'Enquiry Received',
      message: `Thank you ${enquiryForm.name}! Our admissions advisor for ${enquiryModalCourse} will call you shortly.`,
    });
    setEnquiryModalCourse(null);
    setEnquiryForm({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <SEO
        title="Training Courses & Certifications"
        description="Browse industry-led software engineering courses: Full Stack Java, MERN, Cloud DevOps, and Generative AI with LMS and placement guarantee."
        keywords={['Software Engineering Courses', 'Java Full Stack Course', 'DevOps Certification', 'AI Engineering']}
      />

      {/* Title */}
      <div className="space-y-3">
        <Badge variant="purple" size="md">Career Tracks & Curricula</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Explore Technical Training Programs
        </h1>
        <p className="text-slate-500 text-sm max-w-2xl">
          Structured curricula engineered with real-world architectural patterns, production deployment pipelines, and placement support.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Java, React, Docker, AI..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Secondary Level Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Proficiency Level:</span>
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                selectedLevel === lvl
                  ? 'bg-slate-800 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}
          <span className="ml-auto text-slate-400 text-[11px]">
            Showing <strong>{filteredCourses.length}</strong> of {SEED_COURSES.length} courses
          </span>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200/90 p-8 space-y-3">
          <p className="text-base font-bold text-slate-800">No courses match your criteria</p>
          <p className="text-xs text-slate-500">Try adjusting your search terms or category filters.</p>
          <Button variant="outline" size="sm" onClick={() => { setSelectedCategory('All'); setSelectedLevel('All'); setSearchQuery(''); }}>
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-200 bg-white">
              <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  {course.courseCode && (
                    <span className="text-[10px] font-mono font-bold bg-slate-900/80 text-white px-2 py-0.5 rounded shadow-xs">
                      {course.courseCode}
                    </span>
                  )}
                  <Badge variant="neutral" size="sm">{course.category}</Badge>
                </div>
                {course.hasPlacementGuarantee && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="success" size="sm">Placement Guarantee*</Badge>
                  </div>
                )}
              </div>

              <CardContent className="flex-1 flex flex-col justify-between p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-indigo-500" /> {course.durationWeeks} Weeks
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5 text-indigo-500" /> {course.totalHours} Hours
                    </span>
                    <span className="text-slate-400 text-[11px]">({course.level})</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {course.shortDescription}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {course.technologies.slice(0, 5).map((tech) => (
                    <span key={tech} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-lg font-bold text-slate-900">
                        {formatINR(course.discountedFeeINR || course.feeINR)}
                      </span>
                      {course.discountedFeeINR && (
                        <span className="text-xs text-slate-400 line-through ml-2">
                          {formatINR(course.feeINR)}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-emerald-600 font-semibold">Lump-sum • Live Cohort</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setEnquiryModalCourse(course.title)}
                    >
                      Quick Enquiry
                    </Button>
                    <Link to={`/courses/${course.slug}`} className="w-full">
                      <Button variant="primary" size="sm" className="w-full text-xs">
                        Syllabus & Info
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Course Enquiry Modal (PUB-018) */}
      <Modal
        isOpen={!!enquiryModalCourse}
        onClose={() => setEnquiryModalCourse(null)}
        title={`Enquire: ${enquiryModalCourse}`}
        description="Receive detailed syllabus PDFs, upcoming batch schedules, and fee details via email and phone."
      >
        <form onSubmit={handleEnquirySubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Your Full Name *</label>
            <input
              type="text"
              required
              value={enquiryForm.name}
              onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
              placeholder="e.g. Ananya Roy"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={enquiryForm.email}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                placeholder="ananya@example.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                pattern="[6-9][0-9]{9}"
                value={enquiryForm.phone}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                placeholder="10-digit number"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Specific Questions (Optional)</label>
            <textarea
              rows={2}
              value={enquiryForm.message}
              onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
              placeholder="Batch timing preferences or questions..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setEnquiryModalCourse(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Submit Enquiry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
