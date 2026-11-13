import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Users,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Briefcase,
  BookOpen,
  DollarSign,
  Radio,
  FileText,
  Mail,
  MessageSquare,
  Smartphone,
  Info,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { Card } from '../../components/common/Card';
import type { InAppNotification, Batch } from '../../types';

const NOTIFICATION_TEMPLATES = [
  {
    id: 'fee_reminder',
    name: 'Fee Reminder Notice (BR-005)',
    category: 'fee' as const,
    title: 'Tuition Installment Payment Due Reminder',
    message:
      'Dear Student, your upcoming tuition installment is scheduled for review. Kindly remit payment via the portal before the 15th to maintain uninterrupted LMS and batch access.',
    linkUrl: '/student/fees',
  },
  {
    id: 'exam_schedule',
    name: 'Upcoming Certification Assessment (EXM-001)',
    category: 'exam' as const,
    title: 'Upcoming Certification Exam Window Announced',
    message:
      'The final proctored certification assessment for your enrolled cohort has been scheduled. Please ensure all prerequisite lessons, lab assignments, and modules are completed.',
    linkUrl: '/student/tests',
  },
  {
    id: 'live_class_rescheduled',
    name: 'Live Class Timetable Rescheduled (CRS-010)',
    category: 'academic' as const,
    title: 'Notice: Live Interactive Session Rescheduled',
    message:
      "Due to a technical workshop schedule adjustment, tomorrow's live interactive coding session will start at 11:00 AM IST instead of 10:00 AM.",
    linkUrl: '/student/courses',
  },
  {
    id: 'placement_drive',
    name: 'Campus Hiring Drive Alert (PLC-003)',
    category: 'placement' as const,
    title: 'Exclusive Campus Drive: Accio Technologies & CloudScale',
    message:
      'New Full-Stack Java Engineer and React Developer openings are live on the placement portal. Shortlisting begins Friday for students with >75% attendance.',
    linkUrl: '/student/placements',
  },
  {
    id: 'attendance_alert',
    name: 'Low Attendance Warning (BR-011)',
    category: 'academic' as const,
    title: 'Urgent: Academic Attendance Criteria Reminder',
    message:
      'Your current attendance has dipped near the mandatory 75% institute threshold (BR-011). Please ensure regular attendance in upcoming scheduled sessions to retain exam and placement eligibility.',
    linkUrl: '/student/attendance',
  },
];

export const AdminNotificationPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Composer State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [targetGroup, setTargetGroup] = useState<string>('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'academic' | 'exam' | 'placement' | 'fee' | 'general'>('general');
  const [linkUrl, setLinkUrl] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Multi-Channel Dispatch (COM-001 & BR-014)
  const [channels, setChannels] = useState({
    inApp: true,
    email: true,
    whatsapp: true,
    sms: false, // BR-014: Disabled per regulatory compliance
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const tpl = NOTIFICATION_TEMPLATES.find((t) => t.id === templateId);
    if (tpl) {
      setTitle(tpl.title);
      setMessage(tpl.message);
      setCategory(tpl.category);
      setLinkUrl(tpl.linkUrl);
    }
  };

  const loadData = async () => {
    const [nRes, bRes] = await Promise.all([
      adminService.getNotifications(),
      adminService.getBatches(),
    ]);

    if (nRes.success) setNotifications(nRes.data);
    if (bRes.success) setBatches(bRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !message.trim()) return;

    setIsSending(true);
    const res = await adminService.sendBroadcastNotification(
      { id: user.id, name: user.name },
      {
        targetGroup,
        title,
        message,
        category,
        linkUrl: linkUrl.trim() || undefined,
      }
    );
    setIsSending(false);

    if (res.success) {
      const activeChannels: string[] = [];
      if (channels.inApp) activeChannels.push('In-App');
      if (channels.email) activeChannels.push('Email');
      if (channels.whatsapp) activeChannels.push('WhatsApp API');

      showToast({
        type: 'success',
        title: 'Broadcast Announcement Dispatched',
        message: `Alert sent via ${activeChannels.join(', ')} to ${targetGroup.toUpperCase()}. (COM-001 & COM-004)`,
      });
      setTitle('');
      setMessage('');
      setLinkUrl('');
      setSelectedTemplateId('');
      loadData();
    }
  };

  const columns: Column<InAppNotification>[] = [
    {
      key: 'title',
      header: 'Announcement Title',
      sortable: true,
      render: (n) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{n.title}</span>
          <span className="text-[11px] text-slate-500 line-clamp-1">{n.message}</span>
        </div>
      ),
    },
    {
      key: 'userId',
      header: 'Target Audience',
      render: (n) => (
        <Badge variant={n.userId === 'all' ? 'purple' : 'info'} size="sm">
          {n.userId === 'all'
            ? 'ALL MEMBERS'
            : n.userId === 'students'
            ? 'STUDENTS ONLY'
            : n.userId === 'teachers'
            ? 'TEACHERS ONLY'
            : `BATCH: ${n.userId}`}
        </Badge>
      ),
    },
    {
      key: 'category',
      header: 'Alert Category',
      render: (n) => (
        <span className="text-[11px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          {n.category}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Dispatched Date',
      sortable: true,
      render: (n) => <span className="text-xs text-slate-500">{formatDate(n.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Broadcast Alerts (ADM-013)</h1>
        <p className="text-xs text-slate-500 mt-1">
          Publish immediate push notifications, timetable revisions, exam schedules, and campus drive announcements with multi-channel dispatch (COM-001 & COM-004).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer Form Card */}
        <Card className="lg:col-span-1 p-6 bg-white border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Radio className="h-4 w-4 text-indigo-600 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900">Broadcast Composer</h3>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-3 text-xs text-slate-700">
            {/* Template Selector (COM-004) */}
            <div>
              <label className="block font-semibold text-slate-800 mb-1 flex items-center justify-between">
                <span>Pre-configured Template (COM-004)</span>
                <span className="text-[10px] text-indigo-600 font-normal">Auto-fills form</span>
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-slate-50"
              >
                <option value="">-- Choose Template (or write custom) --</option>
                {NOTIFICATION_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Target Audience *</label>
              <select
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="all">All Institute Members (Broadcast)</option>
                <option value="students">All Enrolled Students</option>
                <option value="teachers">All Teaching Faculty</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.batchCode}>
                    Cohort: {b.name} ({b.batchCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Alert Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="general">General Institute Update</option>
                <option value="placement">Placement & Campus Drives</option>
                <option value="exam">Examination & Assessments</option>
                <option value="academic">Academic Syllabus & Timetable</option>
                <option value="fee">Tuition Fee Notice</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Notification Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Campus Drive Announcement: Accio Technologies"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Message Body *</label>
              <textarea
                required
                rows={4}
                placeholder="Enter the full message text sent to recipient portals..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Action Link URL (Optional)</label>
              <input
                type="text"
                placeholder="e.g. /student/placements or /student/tests"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium font-mono"
              />
            </div>

            {/* Multi-Channel Selectors (COM-001 & BR-014) */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                Delivery Channels (COM-001)
              </label>
              <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels.inApp}
                    onChange={(e) => setChannels({ ...channels, inApp: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                  />
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Bell className="h-3.5 w-3.5 text-indigo-600" /> In-App Portal Notification
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels.email}
                    onChange={(e) => setChannels({ ...channels, email: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                  />
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Mail className="h-3.5 w-3.5 text-blue-600" /> Email Broadcast
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels.whatsapp}
                    onChange={(e) => setChannels({ ...channels, whatsapp: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                  />
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp Business API
                  </span>
                </label>

                <div className="flex items-center justify-between pt-1 opacity-60">
                  <label className="flex items-center gap-2 cursor-not-allowed">
                    <input
                      type="checkbox"
                      disabled
                      checked={false}
                      className="rounded text-slate-400 h-3.5 w-3.5 cursor-not-allowed"
                    />
                    <span className="flex items-center gap-1.5 text-slate-500 line-through">
                      <Smartphone className="h-3.5 w-3.5" /> Direct SMS Gateway
                    </span>
                  </label>
                  <span className="text-[10px] text-amber-700 font-mono bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    BR-014 Guard
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isSending}
              leftIcon={<Send className="h-4 w-4" />}
            >
              Send Multi-Channel Broadcast
            </Button>
          </form>
        </Card>

        {/* History Table */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
            Dispatched Broadcast History
          </h3>

          <DataTable
            data={notifications}
            columns={columns}
            searchPlaceholder="Search dispatched announcements..."
            pageSize={8}
          />
        </div>
      </div>
    </div>
  );
};

