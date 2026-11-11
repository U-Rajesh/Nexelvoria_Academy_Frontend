import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Check,
  Video,
  FileText,
  Award,
  HelpCircle,
  MessageSquare,
  Clock,
  Trash2,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { getStorageItem, setStorageItem } from '../../utils/storage';

interface TeacherNotificationItem {
  id: string;
  category: 'live_class' | 'submission' | 'evaluation' | 'doubt' | 'retake' | 'mock' | 'announcement';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl: string;
  actionLabel: string;
}

const DEFAULT_TEACHER_NOTIFICATIONS: TeacherNotificationItem[] = [
  {
    id: 't-notif-1',
    category: 'live_class',
    title: 'Daily Live Session Starts in 25 Minutes',
    message: 'Your morning live lecture for Java Full Stack (Oct 2026 Batch) is scheduled at 7:30 AM IST. Google Meet room is ready.',
    timestamp: 'Today, 7:05 AM',
    isRead: false,
    actionUrl: '/teacher/live-classes',
    actionLabel: 'Open Class Room',
  },
  {
    id: 't-notif-2',
    category: 'doubt',
    title: 'New Student Query from Rohan Sharma',
    message: 'Student posted a question regarding Resilience4j RateLimiter thread contention under JMeter load.',
    timestamp: 'Yesterday, 6:45 PM',
    isRead: false,
    actionUrl: '/teacher/doubts',
    actionLabel: 'Answer Query',
  },
  {
    id: 't-notif-3',
    category: 'retake',
    title: 'Examination Retake Request: Karthik Varma',
    message: 'Student requested retake authorization for Java 21 Enterprise Assessment citing connection drop during test window.',
    timestamp: 'Nov 9, 2026',
    isRead: false,
    actionUrl: '/teacher/tests/retakes',
    actionLabel: 'Review Request',
  },
  {
    id: 't-notif-4',
    category: 'submission',
    title: 'Assignment Submitted: Multithreaded Banking Engine',
    message: 'Candidate Rohan Sharma submitted GitHub repo with Docker Compose orchestration ready for grading.',
    timestamp: 'Nov 8, 2026',
    isRead: true,
    actionUrl: '/teacher/assignments/evaluations',
    actionLabel: 'Evaluate Code',
  },
  {
    id: 't-notif-5',
    category: 'mock',
    title: 'Mock Interview Scheduled with Sneha Reddy',
    message: 'Upcoming System Design & Microservices mock interview scheduled for Thursday at 4:00 PM IST.',
    timestamp: 'Nov 7, 2026',
    isRead: true,
    actionUrl: '/teacher/mock-interviews',
    actionLabel: 'View Schedule',
  },
];

export const TeacherNotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const storageKey = `nex_teacher_notifications_${user?.id || 'default'}`;

  const [notifications, setNotifications] = useState<TeacherNotificationItem[]>(() =>
    getStorageItem<TeacherNotificationItem[]>(storageKey, DEFAULT_TEACHER_NOTIFICATIONS)
  );
  const [filter, setFilter] = useState<'all' | 'unread' | 'live_class' | 'doubt' | 'retake' | 'submission'>('all');

  useEffect(() => {
    setStorageItem(storageKey, notifications);
  }, [notifications, storageKey]);

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast({
      type: 'success',
      title: 'Alerts Updated',
      message: 'All faculty notifications marked as read.',
    });
  };

  const deleteNotif = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter !== 'all') return n.category === filter;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getCategoryBadge = (category: TeacherNotificationItem['category']) => {
    switch (category) {
      case 'live_class':
        return <Badge variant="purple" size="sm" dot>Live Session</Badge>;
      case 'doubt':
        return <Badge variant="warning" size="sm" dot>Student Doubt</Badge>;
      case 'retake':
        return <Badge variant="danger" size="sm" dot>Retake Request</Badge>;
      case 'submission':
        return <Badge variant="info" size="sm">Code Submission</Badge>;
      case 'mock':
        return <Badge variant="success" size="sm">Mock Interview</Badge>;
      default:
        return <Badge variant="neutral" size="sm">System Notice</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty Notification Center</h1>
            {unreadCount > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time updates regarding student submissions, live lecture windows, doubts, and examination retakes.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} leftIcon={<Check className="h-3.5 w-3.5" />}>
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
        {[
          { key: 'all', label: 'All Alerts' },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'live_class', label: 'Live Classes' },
          { key: 'doubt', label: 'Student Doubts' },
          { key: 'retake', label: 'Exam Retakes' },
          { key: 'submission', label: 'Submissions' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              filter === tab.key
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-12 text-center text-slate-400 text-xs">
            <Bell className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            No notifications in this category.
          </Card>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-xl border transition-all ${
                item.isRead ? 'bg-white border-slate-200' : 'bg-teal-50/40 border-teal-200 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getCategoryBadge(item.category)}
                    <h3 className={`text-xs ${item.isRead ? 'font-bold text-slate-800' : 'font-extrabold text-slate-900'}`}>
                      {item.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pt-0.5">{item.message}</p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <Link to={item.actionUrl}>
                      <Button variant="primary" size="sm" className="bg-teal-600 hover:bg-teal-700" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                        {item.actionLabel}
                      </Button>
                    </Link>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>{item.timestamp}</span>
                      <span>•</span>
                      <button
                        onClick={() => toggleRead(item.id)}
                        className="text-teal-700 hover:underline cursor-pointer"
                      >
                        {item.isRead ? 'Mark as Unread' : 'Mark as Read'}
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => deleteNotif(item.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Dismiss"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

