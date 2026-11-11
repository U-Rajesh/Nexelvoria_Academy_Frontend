import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  PlayCircle,
  FileText,
  Lock,
  CheckCircle,
  Bookmark,
  MessageSquare,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Download,
  AlertCircle,
  Menu,
  X,
} from 'lucide-react';
import { SEED_COURSES } from '../../mocks/seedData';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import type { Lesson, CourseModule, Chapter } from '../../types';

export const LMSViewerPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const { showToast } = useNotification();

  const course = SEED_COURSES.find((c) => c.id === courseId || c.slug === courseId) || SEED_COURSES[0];

  // Initial lesson selection
  const initialLesson = course.modules[0]?.chapters[0]?.lessons[0];
  const [currentLesson, setCurrentLesson] = useState<Lesson>(initialLesson);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(['les-1', 'les-2']);
  const [bookmarkedLessonIds, setBookmarkedLessonIds] = useState<string[]>(['les-1']);
  const [activeTab, setActiveTab] = useState<'video' | 'notes' | 'doubts'>('video');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openModuleIds, setOpenModuleIds] = useState<string[]>([course.modules[0]?.id]);

  // Doubt submission state
  const [doubtText, setDoubtText] = useState('');
  const [doubts, setDoubts] = useState<string[]>([
    'Dr. Vikram: Remember to run Java 21 with preview flags if you are experimenting with scoped values on earlier builds.',
  ]);

  const isCompleted = completedLessonIds.includes(currentLesson.id);
  const isBookmarked = bookmarkedLessonIds.includes(currentLesson.id);

  const toggleModule = (modId: string) => {
    setOpenModuleIds((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    );
  };

  const handleMarkComplete = async () => {
    if (!user) return;
    const res = await studentService.completeLesson(user.id, course.id, currentLesson.id);
    if (res.success) {
      setCompletedLessonIds((prev) => Array.from(new Set([...prev, currentLesson.id])));
      showToast({
        type: 'success',
        title: 'Lesson Completed',
        message: `Great progress! Course completion is now ${res.data}%.`,
      });
    }
  };

  const handleToggleBookmark = async () => {
    if (!user) return;
    const res = await studentService.toggleBookmarkLesson(user.id, course.id, currentLesson.id);
    if (res.success) {
      if (res.data) {
        setBookmarkedLessonIds((prev) => [...prev, currentLesson.id]);
        showToast({ type: 'info', message: 'Lesson bookmarked.' });
      } else {
        setBookmarkedLessonIds((prev) => prev.filter((id) => id !== currentLesson.id));
        showToast({ type: 'info', message: 'Bookmark removed.' });
      }
    }
  };

  const handlePostDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtText.trim()) return;
    setDoubts((prev) => [...prev, `${user?.name || 'Student'}: ${doubtText}`]);
    setDoubtText('');
    showToast({
      type: 'success',
      title: 'Question Submitted',
      message: 'Your doubt has been forwarded to Dr. Vikram Rao for review.',
    });
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
      {/* Mobile Sidebar Toggle Button */}
      <div className="lg:hidden p-3 bg-slate-900 text-white flex items-center justify-between">
        <span className="text-xs font-semibold">{course.title}</span>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 rounded bg-slate-800 text-slate-300"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* LMS Course Hierarchy Sidebar (Course -> Module -> Chapter -> Lesson) */}
      <div
        className={`lg:w-80 bg-slate-50 border-r border-slate-200 flex flex-col h-full shrink-0 transition-transform ${
          sidebarOpen ? 'block' : 'hidden lg:flex'
        }`}
      >
        <div className="p-4 border-b border-slate-200 bg-white">
          <Link
            to="/student/courses"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-semibold mb-2 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to My Courses
          </Link>
          <h2 className="text-sm font-bold text-slate-900 leading-snug">{course.title}</h2>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Overall Progress</span>
            <span className="font-semibold text-slate-800">
              {Math.round((completedLessonIds.length / 4) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all"
              style={{ width: `${Math.round((completedLessonIds.length / 4) * 100)}%` }}
            />
          </div>
        </div>

        {/* Modules Accordion */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {course.modules.map((mod) => {
            const isOpen = openModuleIds.includes(mod.id);
            return (
              <div key={mod.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="w-full px-3.5 py-2.5 bg-slate-100/70 hover:bg-slate-100 flex items-center justify-between text-left text-xs font-bold text-slate-800 transition-colors cursor-pointer"
                >
                  <span className="line-clamp-1">{mod.title}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="p-2 space-y-3 divide-y divide-slate-100">
                    {mod.chapters.map((chap) => (
                      <div key={chap.id} className="pt-2 first:pt-0 space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 block">
                          {chap.title}
                        </span>
                        <div className="space-y-0.5">
                          {chap.lessons.map((les) => {
                            const isCurrent = currentLesson.id === les.id;
                            const isDone = completedLessonIds.includes(les.id);
                            return (
                              <button
                                key={les.id}
                                onClick={() => {
                                  setCurrentLesson(les);
                                  setSidebarOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                                  isCurrent
                                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate pr-2">
                                  {isDone ? (
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <PlayCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  )}
                                  <span className="truncate">{les.title}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {les.durationMinutes}m
                                </span>
                              </button>
                            );
                          })}
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

      {/* Lesson Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900 text-slate-100">
        {/* Top Lesson Control Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold block">
              Current Lesson
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white truncate">{currentLesson.title}</h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleBookmark}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Lesson'}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
            </button>

            <Button
              variant={isCompleted ? 'success' : 'primary'}
              size="sm"
              onClick={handleMarkComplete}
              leftIcon={<CheckCircle className="h-4 w-4" />}
            >
              {isCompleted ? 'Completed' : 'Mark Complete'}
            </Button>
          </div>
        </div>

        {/* Content Tabs (Video / Study Notes / Doubts) */}
        <div className="flex items-center px-4 bg-slate-950/60 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('video')}
            className={`px-4 py-2.5 font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'video'
                ? 'text-indigo-400 border-indigo-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Video Lecture
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2.5 font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'notes'
                ? 'text-indigo-400 border-indigo-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            PDF & Notes
          </button>
          <button
            onClick={() => setActiveTab('doubts')}
            className={`px-4 py-2.5 font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'doubts'
                ? 'text-indigo-400 border-indigo-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Lesson Doubts & Discussion
          </button>
        </div>

        {/* Active Tab Screen */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-900">
          {activeTab === 'video' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800">
                <iframe
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title={currentLesson.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Duration: {currentLesson.durationMinutes} Minutes</span>
                <span>Instructor: Dr. Vikram Rao (Lead Faculty)</span>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="max-w-3xl mx-auto p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-400" /> Lesson PDF Resource
                </span>
                <a
                  href="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF Notes
                </a>
              </div>
              <div className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-900 p-4 rounded-xl">
                {currentLesson.studyMaterialText ||
                  'Enterprise Virtual Threads decouple tasks from underlying kernel OS threads, maintaining low memory footprints of ~2KB per virtual thread compared to 1MB per platform thread.'}
              </div>
            </div>
          )}

          {activeTab === 'doubts' && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Ask a Question for this Lesson
                </h4>
                <form onSubmit={handlePostDoubt} className="space-y-3">
                  <textarea
                    rows={3}
                    value={doubtText}
                    onChange={(e) => setDoubtText(e.target.value)}
                    placeholder="Type your technical query or code doubt here..."
                    className="w-full p-3 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button variant="primary" size="sm" type="submit" rightIcon={<MessageSquare className="h-4 w-4" />}>
                    Post Doubt
                  </Button>
                </form>
              </div>

              {/* Doubt Thread */}
              <div className="space-y-2">
                {doubts.map((d, i) => (
                  <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
                    {d}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

