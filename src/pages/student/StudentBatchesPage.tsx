import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Clock,
  Video,
  UserCheck,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  ArrowRight,
  Radio,
} from 'lucide-react';
import { SEED_BATCHES } from '../../mocks/seedData';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import type { Course, Enrollment, Batch } from '../../types';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';

export const StudentBatchesPage: React.FC = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<{ enrollment: Enrollment; course: Course; batch?: Batch }[]>([]);

  useEffect(() => {
    if (!user) return;
    studentService.getStudentEnrollments(user.id).then((res) => {
      if (res.success) setEnrollments(res.data);
    });
  }, [user]);

  const batch = enrollments[0]?.batch || SEED_BATCHES[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assigned Batches & Timetable</h1>
        <p className="text-xs text-slate-500 mt-1">
          View your cohort timetable, scheduled live sessions, assigned instructor, and cohort peers.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <Badge variant="purple" size="sm">{batch.batchCode}</Badge>
            <h3 className="text-lg font-bold text-slate-900 mt-1">{batch.name}</h3>
            <p className="text-xs text-slate-500">{batch.courseName}</p>
          </div>
          <Badge variant="success" size="md" dot>Ongoing Cohort</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-600">
          <div className="space-y-1">
            <span className="text-slate-400 block font-medium">Schedule Timing</span>
            <span className="font-semibold text-slate-900">{batch.scheduleTiming}</span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 block font-medium">Start & End Dates</span>
            <span className="font-semibold text-slate-900">
              {formatDate(batch.startDate)} to {formatDate(batch.endDate)}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 block font-medium">Lead Trainer</span>
            <span className="font-semibold text-slate-900">Dr. Vikram Rao (Ph.D.)</span>
          </div>
        </div>

        {/* Live Class Link Launcher */}
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <strong className="text-indigo-900 block">Configured Meeting Room (BR-015)</strong>
            <span className="text-indigo-700">Daily lectures run on Google Meet at 7:30 AM IST.</span>
          </div>
          <a href={batch.meetingUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="primary" size="sm" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
              Launch Google Meet
            </Button>
          </a>
        </div>
      </Card>
    </div>
  );
};

export const StudentLiveClassesPage: React.FC = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<{ enrollment: Enrollment; course: Course; batch?: Batch }[]>([]);

  useEffect(() => {
    if (!user) return;
    studentService.getStudentEnrollments(user.id).then((res) => {
      if (res.success) setEnrollments(res.data);
    });
  }, [user]);

  const scheduleList = [
    {
      id: 'sc-1',
      date: 'Today (Monday)',
      time: '7:30 AM - 9:30 AM IST',
      topic: 'Spring Cloud API Gateway & Resilience4j Circuit Breakers',
      mentor: 'Dr. Vikram Rao',
      status: 'Live Soon',
      meetingUrl: 'https://meet.google.com/nex-java-batch',
    },
    {
      id: 'sc-2',
      date: 'Tomorrow (Tuesday)',
      time: '7:30 AM - 9:30 AM IST',
      topic: 'Distributed Tracing with Micrometer, Zipkin & OpenTelemetry',
      mentor: 'Dr. Vikram Rao',
      status: 'Scheduled',
      meetingUrl: 'https://meet.google.com/nex-java-batch',
    },
    {
      id: 'sc-3',
      date: 'Wednesday',
      time: '7:30 AM - 9:30 AM IST',
      topic: 'Docker Multi-stage Builds & Kubernetes Cluster Deployment',
      mentor: 'Dr. Vikram Rao',
      status: 'Scheduled',
      meetingUrl: 'https://meet.google.com/nex-java-batch',
    },
    {
      id: 'sc-4',
      date: 'Thursday',
      time: '7:30 AM - 9:30 AM IST',
      topic: 'Kafka Event Streaming, Producer/Consumer Architecture',
      mentor: 'Dr. Vikram Rao',
      status: 'Scheduled',
      meetingUrl: 'https://meet.google.com/nex-java-batch',
    },
    {
      id: 'sc-5',
      date: 'Friday',
      time: '7:30 AM - 9:30 AM IST',
      topic: 'Weekly Hands-on Capstone Code Review & Doubt Clarification',
      mentor: 'Dr. Vikram Rao',
      status: 'Scheduled',
      meetingUrl: 'https://meet.google.com/nex-java-batch',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Live Interactive Classes</h1>
          <p className="text-xs text-slate-500 mt-1">
            Join daily mentor-led classes. Live meeting URLs are configured manually per SRS Rule BR-015.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-emerald-700">Class Room Active</span>
        </div>
      </div>

      {/* Featured Today's Live Class Card */}
      <Card className="p-6 sm:p-8 space-y-6 border-indigo-200 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/20 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Radio className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="purple" size="sm" dot>Today's Live Class</Badge>
                <span className="text-[11px] font-mono font-bold text-indigo-700">7:30 AM - 9:30 AM IST</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                Spring Cloud API Gateway & Resilience4j
              </h2>
            </div>
          </div>

          <a
            href="https://meet.google.com/nex-java-batch"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto shadow-md"
              leftIcon={<Video className="h-4 w-4" />}
              rightIcon={<ExternalLink className="h-4 w-4" />}
            >
              Join Google Meet Room
            </Button>
          </a>
        </div>

        {/* Particulars & Attendance connection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-indigo-100 text-xs text-slate-600">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Instructor</span>
            <span className="font-bold text-slate-900">Dr. Vikram Rao (Ph.D.)</span>
            <p className="text-[10px] text-slate-500">Lead Enterprise Architect</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Assigned Cohort</span>
            <span className="font-bold text-slate-900">Oct 2026 Morning Cohort</span>
            <p className="text-[10px] text-slate-500">Java Full Stack Development</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Attendance Policy</span>
            <span className="font-bold text-emerald-700">Logged During Live Session</span>
            <p className="text-[10px] text-slate-500">Minimum 75% required for Certificate (BR-011)</p>
          </div>
        </div>
      </Card>

      {/* Weekly Timetable & Schedule */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Upcoming Live Sessions Timetable</h3>
            <p className="text-[11px] text-slate-500">Scheduled topics for the current academic week</p>
          </div>
          <Badge variant="neutral" size="sm">5 Sessions / Week</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Session Date</th>
                <th className="py-2.5 px-3">Time Window</th>
                <th className="py-2.5 px-3">Curriculum Topic</th>
                <th className="py-2.5 px-3">Mentor</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Access Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scheduleList.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3 font-semibold text-slate-900">{item.date}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{item.time}</td>
                  <td className="py-3 px-3 font-medium text-slate-800">{item.topic}</td>
                  <td className="py-3 px-3 text-slate-600">{item.mentor}</td>
                  <td className="py-3 px-3">
                    <Badge variant={idx === 0 ? 'purple' : 'neutral'} size="sm" dot={idx === 0}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <a
                      href={item.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 text-[11px]"
                    >
                      <span>Join Room</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Missed a Class? Link to Recorded Classes Banner */}
      <div className="p-5 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 shrink-0">
            <PlayCircle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Missed a live session or need to revise?</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              All live classroom sessions are archived in high-definition video within 4 hours after class.
            </p>
          </div>
        </div>

        <Link to="/student/recordings" className="shrink-0">
          <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
            Browse Recorded Classes
          </Button>
        </Link>
      </div>
    </div>
  );
};
