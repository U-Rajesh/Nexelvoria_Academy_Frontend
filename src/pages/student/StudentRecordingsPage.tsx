import React, { useState, useEffect, useCallback } from 'react';
import {
  PlayCircle,
  Calendar,
  User,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import { STORAGE_KEYS } from '../../constants/appConfig';
import { useStorageSync } from '../../hooks/useStorageSync';
import type { Course, Enrollment, Batch, RecordedClassItem } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import { formatDate } from '../../utils/formatters';

interface RecordingItem {
  id: string;
  title: string;
  date: string;
  duration: string;
  moduleName: string;
  courseId: string;
  courseTitle: string;
  trainer: string;
  description: string;
  videoEmbedUrl: string;
}

export const StudentRecordingsPage: React.FC = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<{ enrollment: Enrollment; course: Course; batch?: Batch }[]>([]);
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRecording, setActiveRecording] = useState<RecordingItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [enrRes, recRes] = await Promise.all([
      studentService.getStudentEnrollments(user.id),
      studentService.getStudentRecordedClasses(user.id),
    ]);

    const loadedEnrollments = enrRes.success ? enrRes.data : [];
    if (enrRes.success) {
      setEnrollments(enrRes.data);
    }

    if (recRes.success) {
      const mapped: RecordingItem[] = recRes.data.map((r: RecordedClassItem) => {
        const enr = loadedEnrollments.find((e) => e.course.id === r.courseId);
        return {
          id: r.id,
          title: r.title,
          date: r.sessionDate || '2026-11-09',
          duration: `${r.durationMinutes || 90}m`,
          moduleName: r.moduleName || 'Instructional Module',
          courseId: r.courseId,
          courseTitle: enr?.course.title || 'Full Stack Java Cloud Architecture',
          trainer: 'Dr. Vikram Rao',
          description: r.description,
          videoEmbedUrl: r.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        };
      });
      setRecordings(mapped);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useStorageSync([STORAGE_KEYS.TEACHER_RECORDINGS, STORAGE_KEYS.ENROLLMENTS], loadData);

  const filteredRecordings = recordings.filter((rec) => {
    const matchesCourse = selectedCourseId === 'all' || rec.courseId === selectedCourseId;
    const matchesQuery =
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.moduleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.trainer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesQuery;
  });

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
        <h2 className="text-lg font-bold text-slate-900">Recorded Lectures Locked</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Per SRS Rule STD-003, recorded lectures are strictly accessible to students with authorized active enrollments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recorded Live Classes</h1>
          <p className="text-xs text-slate-500 mt-1">
            Replay past lectures, review architectural walkthroughs, and revisit coding drills (STD-003).
          </p>
        </div>

        <Badge variant="purple" size="md">
          {recordings.length} Recorded Sessions
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
            placeholder="Search lectures, Kafka, Docker..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Recordings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredRecordings.map((rec) => (
          <Card key={rec.id} className="overflow-hidden flex flex-col justify-between hover:shadow-lg transition-shadow bg-white">
            <div className="relative aspect-video bg-slate-900 group cursor-pointer" onClick={() => setActiveRecording(rec)}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <PlayCircle className="h-6 w-6" />
                </div>
              </div>
              <span className="absolute bottom-3 right-3 bg-slate-900/80 text-white text-[11px] font-mono px-2 py-0.5 rounded">
                {rec.duration}
              </span>
              <span className="absolute top-3 left-3 bg-white/95 text-indigo-700 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded shadow-xs">
                {rec.courseTitle.split(' ')[0]} Cohort
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {formatDate(rec.date)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> {rec.trainer}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                  {rec.title}
                </h3>
                <p className="text-[11px] text-indigo-600 font-medium">{rec.moduleName}</p>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {rec.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Recorded HD 1080p</span>
                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs"
                  onClick={() => setActiveRecording(rec)}
                  leftIcon={<PlayCircle className="h-3.5 w-3.5" />}
                >
                  Watch Lecture
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Video Player Modal */}
      <Modal
        isOpen={!!activeRecording}
        onClose={() => setActiveRecording(null)}
        title={activeRecording?.title || 'Class Recording'}
        description={`${activeRecording?.trainer} • Recorded on ${activeRecording ? formatDate(activeRecording.date) : ''}`}
      >
        {activeRecording && (
          <div className="space-y-4 text-xs">
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
              <iframe
                src={activeRecording.videoEmbedUrl}
                title={activeRecording.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-slate-700">
              <h4 className="font-bold text-slate-900">Lecture Summary & Covered Concepts</h4>
              <p className="leading-relaxed">{activeRecording.description}</p>
              <div className="pt-1 flex items-center gap-2 text-slate-400 text-[11px]">
                <span>{activeRecording.moduleName}</span>
                <span>•</span>
                <span>Duration: {activeRecording.duration}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setActiveRecording(null)}>
                Close Player
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

