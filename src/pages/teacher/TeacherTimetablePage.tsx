import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  ExternalLink,
  Users,
  BookOpen,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teacherService } from '../../services/teacherService';
import type { Batch } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

interface TimetableSlot {
  id: string;
  day: string;
  timeWindow: string;
  topic: string;
  batchName: string;
  courseName: string;
  meetingUrl: string;
  isToday: boolean;
}

export const TeacherTimetablePage: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);

  const timetable: TimetableSlot[] = [
    {
      id: 'slot-mon',
      day: 'Monday',
      timeWindow: '7:30 AM - 9:30 AM IST',
      topic: 'Spring Cloud API Gateway & Resilience4j Circuit Breakers',
      batchName: 'Oct 2026 Morning Cohort (JFS-2026-M1)',
      courseName: 'Full Stack Java & Cloud Microservices',
      meetingUrl: 'https://meet.google.com/nex-java-batch',
      isToday: true,
    },
    {
      id: 'slot-tue',
      day: 'Tuesday',
      timeWindow: '7:30 AM - 9:30 AM IST',
      topic: 'Distributed Tracing with Micrometer, Zipkin & OpenTelemetry',
      batchName: 'Oct 2026 Morning Cohort (JFS-2026-M1)',
      courseName: 'Full Stack Java & Cloud Microservices',
      meetingUrl: 'https://meet.google.com/nex-java-batch',
      isToday: false,
    },
    {
      id: 'slot-wed',
      day: 'Wednesday',
      timeWindow: '7:30 AM - 9:30 AM IST',
      topic: 'Docker Multi-stage Builds & Kubernetes Cluster Deployment',
      batchName: 'Oct 2026 Morning Cohort (JFS-2026-M1)',
      courseName: 'Full Stack Java & Cloud Microservices',
      meetingUrl: 'https://meet.google.com/nex-java-batch',
      isToday: false,
    },
    {
      id: 'slot-thu',
      day: 'Thursday',
      timeWindow: '7:30 AM - 9:30 AM IST',
      topic: 'Kafka Event Streaming, Partition Rebalancing & Consumer Groups',
      batchName: 'Oct 2026 Morning Cohort (JFS-2026-M1)',
      courseName: 'Full Stack Java & Cloud Microservices',
      meetingUrl: 'https://meet.google.com/nex-java-batch',
      isToday: false,
    },
    {
      id: 'slot-fri',
      day: 'Friday',
      timeWindow: '7:30 AM - 9:30 AM IST',
      topic: 'Weekly Capstone Code Reviews & Architectural Sagas',
      batchName: 'Oct 2026 Morning Cohort (JFS-2026-M1)',
      courseName: 'Full Stack Java & Cloud Microservices',
      meetingUrl: 'https://meet.google.com/nex-java-batch',
      isToday: false,
    },
    {
      id: 'slot-sat',
      day: 'Saturday',
      timeWindow: '10:00 AM - 11:30 AM IST',
      topic: 'Weekend Doubt Clearing & System Design Walkthrough',
      batchName: 'Oct 2026 Morning Cohort (JFS-2026-M1)',
      courseName: 'Full Stack Java & Cloud Microservices',
      meetingUrl: 'https://meet.google.com/nex-java-batch',
      isToday: false,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty Academic Timetable</h1>
          <p className="text-xs text-slate-500 mt-1">
            Weekly live session schedule for your allocated cohorts (BR-015 compliant).
          </p>
        </div>

        <Badge variant="purple" size="md">
          Mon - Sat Active Schedule
        </Badge>
      </div>

      {/* Timetable Cards */}
      <div className="space-y-4">
        {timetable.map((slot) => (
          <Card
            key={slot.id}
            className={`p-6 border transition-all ${
              slot.isToday
                ? 'border-teal-400 bg-gradient-to-r from-teal-50/50 via-white to-white shadow-sm ring-1 ring-teal-300'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={`h-12 w-12 rounded-xl flex flex-col items-center justify-center shrink-0 text-xs font-bold ${
                    slot.isToday ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-normal uppercase">{slot.day.slice(0, 3)}</span>
                  <span>{slot.isToday ? 'TODAY' : slot.day.slice(0, 2)}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{slot.day}</h3>
                    <span className="text-xs font-mono font-bold text-teal-800">
                      {slot.timeWindow}
                    </span>
                    {slot.isToday && (
                      <Badge variant="success" size="sm" dot>Live Today</Badge>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800">{slot.topic}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {slot.batchName} • {slot.courseName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a href={slot.meetingUrl} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant={slot.isToday ? 'primary' : 'outline'}
                    size="sm"
                    className={slot.isToday ? 'bg-teal-600 hover:bg-teal-700' : ''}
                    leftIcon={<Video className="h-3.5 w-3.5" />}
                    rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
                  >
                    Join Room
                  </Button>
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

