import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  BookOpen,
  Video,
  FileCheck2,
  Briefcase,
  CreditCard,
  Info,
  Calendar,
  Clock,
  Check,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { getStorageItem, setStorageItem } from '../../utils/storage';

export interface StudentNotificationItem {
  id: string;
  category: 'academic' | 'live_class' | 'test' | 'placement' | 'fee' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

const DEFAULT_NOTIFICATIONS: StudentNotificationItem[] = [
  {
    id: 'notif-1',
    category: 'live_class',
    title: 'Upcoming Live Session: Spring Cloud API Gateway',
    message: 'Your morning live session with Dr. Vikram Rao starts today at 7:30 AM IST on Google Meet. Join 5 minutes early to test your audio.',
    timestamp: 'Today, 7:00 AM',
    isRead: false,
    actionUrl: '/student/live-classes',
    actionLabel: 'Join Class',
  },
  {
    id: 'notif-2',
    category: 'test',
    title: 'Online Examination Scheduled: Microservices Midterm',
    message: 'The Midterm examination for Module 3 has been released. The test window is open until 11:59 PM tomorrow.',
    timestamp: 'Yesterday, 4:15 PM',
    isRead: false,
    actionUrl: '/student/tests',
    actionLabel: 'Take Test',
  },
  {
    id: 'notif-3',
    category: 'placement',
    title: 'New Placement Drive: Senior Full Stack Engineer at TechCorp',
    message: 'TechCorp India has published an exclusive hiring drive for Nexelvoria graduates (CTC: ₹12.5 - 18.0 LPA). Applications close on Friday.',
    timestamp: 'Nov 8, 2026',
    isRead: false,
    actionUrl: '/student/placements',
    actionLabel: 'Apply Now',
  },
  {
    id: 'notif-4',
    category: 'academic',
    title: 'Assignment Evaluated: Multithreaded Banking Engine',
    message: 'Your assignment has been graded by Dr. Vikram Rao with score 95/100 and detailed feedback comments.',
    timestamp: 'Nov 6, 2026',
    isRead: true,
    actionUrl: '/student/assignments',
    actionLabel: 'View Feedback',
  },
  {
    id: 'notif-5',
    category: 'fee',
    title: 'Payment Confirmed & Official Receipt Generated',
    message: 'Lump-sum tuition payment of ₹35,000 has been verified. Receipt RCPT-2026-004128 is available for download.',
    timestamp: 'Nov 1, 2026',
    isRead: true,
    actionUrl: '/student/payment-history',
    actionLabel: 'Download Receipt',
  },
  {
    id: 'notif-6',
    category: 'system',
    title: 'Account Verification Complete (Dual OTP Verified)',
    message: 'Your registration and dual OTP verification succeeded. You have full student access to all enrolled batch materials.',
    timestamp: 'Oct 28, 2026',
    isRead: true,
    actionUrl: '/student/profile',
    actionLabel: 'View Profile',
  },
];

export const StudentNotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const storageKey = `nex_student_notifications_${user?.id || 'default'}`;

  const [notifications, setNotifications] = useState<StudentNotificationItem[]>(() =>
    getStorageItem<StudentNotificationItem[]>(storageKey, DEFAULT_NOTIFICATIONS)
  );
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'academic' | 'live_class' | 'test' | 'placement' | 'fee'>('all');

  useEffect(() => {
    setStorageItem(storageKey, notifications);
  }, [notifications, storageKey]);

  const toggleReadStatus = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: !item.isRead } : item))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    showToast({
      type: 'success',
      title: 'Notifications Updated',
      message: 'All notifications have been marked as read.',
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'unread') return !item.isRead;
    if (activeFilter !== 'all') return item.category === activeFilter;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getCategoryBadge = (category: StudentNotificationItem['category']) => {
    switch (category) {
      case 'live_class':
        return <Badge variant="purple" size="sm" dot>Live Session</Badge>;
      case 'test':
        return <Badge variant="warning" size="sm" dot>Online Test</Badge>;
      case 'placement':
        return <Badge variant="success" size="sm" dot>Placement</Badge>;
      case 'academic':
        return <Badge variant="info" size="sm">Academic</Badge>;
      case 'fee':
        return <Badge variant="neutral" size="sm">Fee & Receipt</Badge>;
      case 'system':
      default:
        return <Badge variant="neutral" size="sm">System</Badge>;
    }
  };

  const getCategoryIcon = (category: StudentNotificationItem['category']) => {
    switch (category) {
      case 'live_class':
        return <Video className="h-5 w-5 text-indigo-600" />;
      case 'test':
        return <FileCheck2 className="h-5 w-5 text-amber-600" />;
      case 'placement':
        return <Briefcase className="h-5 w-5 text-emerald-600" />;
      case 'academic':
        return <BookOpen className="h-5 w-5 text-sky-600" />;
      case 'fee':
        return <CreditCard className="h-5 w-5 text-slate-700" />;
      case 'system':
      default:
        return <Info className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notification Center</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Stay updated with class timetables, examination windows, placement drives, and instructor feedback.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} leftIcon={<Check className="h-3.5 w-3.5" />}>
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'all', label: 'All Alerts' },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'live_class', label: 'Live Classes' },
          { key: 'test', label: 'Examinations' },
          { key: 'placement', label: 'Placements' },
          { key: 'academic', label: 'Assignments' },
          { key: 'fee', label: 'Fees & Invoices' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === tab.key
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="p-12 text-center text-slate-400 text-xs">
            <Bell className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            No notifications found under this filter.
          </Card>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-5 rounded-xl border transition-all ${
                notif.isRead
                  ? 'bg-white border-slate-200/80'
                  : 'bg-indigo-50/40 border-indigo-200 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                    notif.isRead ? 'bg-slate-100 text-slate-500' : 'bg-white border border-indigo-100 shadow-xs'
                  }`}
                >
                  {getCategoryIcon(notif.category)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(notif.category)}
                      <h3 className={`text-xs font-bold ${notif.isRead ? 'text-slate-800' : 'text-slate-900 font-extrabold'}`}>
                        {notif.title}
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {notif.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pt-0.5">{notif.message}</p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    {notif.actionUrl ? (
                      <Link to={notif.actionUrl}>
                        <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                          {notif.actionLabel || 'View Details'}
                        </Button>
                      </Link>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleReadStatus(notif.id)}
                        className="text-[11px] font-medium text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        {notif.isRead ? 'Mark as Unread' : 'Mark as Read'}
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="text-[11px] font-medium text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Dismiss notification"
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

