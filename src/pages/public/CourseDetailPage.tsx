import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  BookOpen,
  CheckCircle,
  PlayCircle,
  Download,
  Award,
  ChevronDown,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { SEED_COURSES } from '../../mocks/seedData';
import { getStorageItem } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/appConfig';
import type { Course } from '../../types';
import { formatINR } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import { SEO } from '../../components/common/SEO';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { cmsService } from '../../services/cmsService';
import { analytics } from '../../utils/analytics';
import { CourseEnrollmentModal } from '../../components/course/CourseEnrollmentModal';

export const CourseDetailPage: React.FC = () => {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [activeModuleId, setActiveModuleId] = useState<string>('mod-1');
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({ name: '', email: '', phone: '', message: '' });

  const allCourses = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
  const course = allCourses.find((c) => c.slug === courseSlug || c.id === courseSlug);

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Course Not Found</h2>
        <p className="text-sm text-slate-500">The requested training program does not exist or has been archived.</p>
        <Link to="/courses">
          <Button variant="primary">Browse All Courses</Button>
        </Link>
      </div>
    );
  }

  const handleEnrollClick = () => {
    analytics.trackEvent('click_enroll_now', 'Course', course.title);
    setEnrollmentModalOpen(true);
  };

  const handleDownloadSyllabus = () => {
    analytics.trackEvent('download_syllabus', 'Course', course.title);
    showToast({
      type: 'success',
      title: 'Syllabus Downloaded',
      message: `Complete curriculum outline for "${course.title}" has been saved to your downloads.`,
    });
  };

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cmsService.submitEnquiry({
      type: 'course_admission',
      name: enquiryForm.name,
      email: enquiryForm.email,
      phone: enquiryForm.phone,
      courseOfInterest: course.title,
      message: enquiryForm.message,
    });
    analytics.trackEvent('submit_course_detail_enquiry', 'Course', course.title);

    showToast({
      type: 'success',
      title: 'Enquiry Received',
      message: `Thank you ${enquiryForm.name}! Our admissions advisor will contact you regarding ${course.title}.`,
    });
    setEnquiryModalOpen(false);
    setEnquiryForm({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="space-y-14 pb-20">
      <SEO
        title={`${course.title} – Syllabus & Placement Guarantee`}
        description={course.shortDescription}
        keywords={[course.title, ...course.technologies, 'Syllabus', 'Placement Guarantee', 'Nexelvoria']}
      />

      {/* Course Header Banner */}
      <section className="bg-slate-900 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
          <div className="lg:col-span-2 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="purple" size="md">{course.category}</Badge>
              <Badge variant="neutral" size="md">{course.level}</Badge>
              {course.hasPlacementGuarantee && (
                <Badge variant="success" size="md">Placement Guarantee*</Badge>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              {course.title}
            </h1>

            <p className="text-base text-slate-300 leading-relaxed max-w-2xl">
              {course.longDescription}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300 pt-2">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-indigo-400" /> {course.durationWeeks} Weeks Intensive
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-indigo-400" /> {course.totalHours} Practical Hours
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-emerald-400" /> ISO Verifiable Certificate (BR-011)
              </span>
            </div>
          </div>

          {/* Pricing & Enrollment Box */}
          <div className="bg-white rounded-xl p-6 text-slate-900 shadow-xl border border-slate-100 space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Program Fee</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {formatINR(course.discountedFeeINR || course.feeINR)}
                </span>
                {course.discountedFeeINR && (
                  <span className="text-sm text-slate-400 line-through">
                    {formatINR(course.feeINR)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Inclusive of all taxes, LMS sandbox access & placement services.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
              <span>
                <strong>SRS Rule BR-005:</strong> Installment payments are not supported. Full course fee is processed as a one-time lump-sum transaction.
              </span>
            </div>

            <div className="space-y-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleEnrollClick}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Enroll / Register Now
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={handleDownloadSyllabus}
                  leftIcon={<Download className="h-3.5 w-3.5" />}
                >
                  Syllabus PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setEnquiryModalOpen(true)}
                  leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
                >
                  Enquire
                </Button>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 text-center space-y-1">
              <p>Admissions Open • Cohort Size Strictly Capped</p>
              <p>Next Batch Commences: 1st of Next Month</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Syllabus & Learning Outcomes */}
        <div className="lg:col-span-2 space-y-10">
          {/* Tech Stack Chips */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">Technologies & Tools Covered</h2>
            <div className="flex flex-wrap gap-2">
              {course.technologies.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-white border border-slate-200 text-slate-800 rounded-lg text-xs font-mono font-semibold shadow-xs"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Curriculum Syllabus Accordion (CRS-008, CRS-009) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Curriculum Syllabus Breakdown</h2>
                <p className="text-xs text-slate-500">
                  Step-by-step module, chapter, and lesson progression with hands-on projects.
                </p>
              </div>
              <Badge variant="purple" size="sm">{course.modules.length} Modules</Badge>
            </div>

            <div className="space-y-3">
              {course.modules.map((mod, modIdx) => {
                const isOpen = activeModuleId === mod.id;
                return (
                  <div
                    key={mod.id}
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs transition-colors"
                  >
                    <button
                      onClick={() => setActiveModuleId(isOpen ? '' : mod.id)}
                      className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/80 cursor-pointer"
                    >
                      <div className="space-y-1 pr-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          Module 0{modIdx + 1}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">{mod.title}</h3>
                        <p className="text-xs text-slate-500">{mod.description}</p>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-slate-400 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-4">
                        {mod.chapters.map((chap) => (
                          <div key={chap.id} className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                              {chap.title}
                            </h4>

                            <div className="space-y-1 pl-4 border-l-2 border-slate-200">
                              {chap.lessons.map((lesson) => (
                                <div
                                  key={lesson.id}
                                  className="flex items-center justify-between text-xs py-1.5 text-slate-600"
                                >
                                  <span className="flex items-center gap-2">
                                    <CheckCircle className="h-3.5 w-3.5 text-slate-300" />
                                    {lesson.title}
                                  </span>

                                  {lesson.isFreePreview && lesson.videoUrl ? (
                                    <button
                                      onClick={() => setPreviewVideoUrl(lesson.videoUrl || null)}
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                                    >
                                      <PlayCircle className="h-3 w-3" /> Free Preview
                                    </button>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                      <Lock className="h-3 w-3 text-slate-300" /> Protected
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Placement Guarantee & Career Assistance Information */}
          {course.hasPlacementGuarantee && (
            <Card className="p-6 border-emerald-200 bg-emerald-50/30 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-emerald-950">
                  Placement Guarantee Terms (SRS Section 3.12 / BR-013)
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Eligible students who maintain at least <strong>75% recorded live attendance</strong> (BR-010),
                complete all assignment submissions, and achieve passing marks in the comprehensive online competency examination
                are guaranteed placement support with our 120+ partnered product firms and IT service enterprises.
              </p>
            </Card>
          )}
        </div>

        {/* Right Column: Prerequisites, Instructor, Certification Info */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Prerequisites</h3>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Basic understanding of any programming language (C, C++, Java, or Python).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>A laptop with at least 8GB RAM and stable internet connectivity.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Willingness to commit 15 hours per week to code exercises and lab sessions.</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Verifiable Certification</h3>
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                Graduates receive an industry-recognized certificate carrying a unique cryptographic ID and scannable QR code.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-[11px] font-medium text-slate-700">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" /> 100% Lesson Completion
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" /> $\ge 75\%$ Recorded Attendance (BR-011)
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" /> Passing Marks in Final Online Examination
                </div>
              </div>
            </div>
          </Card>

          <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 text-center space-y-3">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Need Custom Guidance?</h4>
            <p className="text-xs text-slate-600">Talk to our faculty lead to understand how this program fits your career background.</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-white text-indigo-600"
              onClick={() => setEnquiryModalOpen(true)}
            >
              Request 1:1 Counseling
            </Button>
          </div>
        </div>
      </div>

      {/* Video Preview Modal (CRS-009) */}
      <Modal
        isOpen={!!previewVideoUrl}
        onClose={() => setPreviewVideoUrl(null)}
        title="Sample Lecture Preview"
        description="Preview of actual recorded instruction from our production engineering curriculum."
      >
        <div className="space-y-4">
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center relative">
            <iframe
              src={previewVideoUrl || ''}
              title="Lecture Preview"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setPreviewVideoUrl(null)}>
              Close Preview
            </Button>
          </div>
        </div>
      </Modal>

      {/* Course Enquiry Modal */}
      <Modal
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        title={`Admissions Enquiry: ${course.title}`}
        description="Our senior academic counselor will reach out within 2 hours with syllabus and fee details."
      >
        <form onSubmit={handleEnquirySubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Your Full Name *</label>
            <input
              type="text"
              required
              value={enquiryForm.name}
              onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
              placeholder="e.g. Rahul Sharma"
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
                placeholder="rahul@example.com"
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
            <label className="block font-semibold text-slate-700 mb-1">Your Questions or Notes (Optional)</label>
            <textarea
              rows={2}
              value={enquiryForm.message}
              onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
              placeholder="Ask about batch timings, prerequisites, or scholarship discounts..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setEnquiryModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Submit Enquiry
            </Button>
          </div>
        </form>
      </Modal>

      {/* Course Admission & Batch Enrollment Modal */}
      <CourseEnrollmentModal
        isOpen={enrollmentModalOpen}
        onClose={() => setEnrollmentModalOpen(false)}
        course={course}
      />
    </div>
  );
};
