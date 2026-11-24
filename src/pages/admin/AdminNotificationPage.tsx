import React, { useState, useEffect } from 'react';
import { Bell, Send, Radio, Info, AlertCircle } from 'lucide-react';
import {
  adminService,
  type AdminNotificationType,
  type BroadcastAudienceRole,
} from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { Card } from '../../components/common/Card';
import { NotificationHistoryPanel } from '../../components/admin/NotificationHistoryPanel';
import type { AuditLog } from '../../types';

const NOTIFICATION_TEMPLATES: Array<{
  id: string;
  name: string;
  notificationType: AdminNotificationType;
  title: string;
  message: string;
}> = [
  {
    id: 'fee_reminder',
    name: 'Fee Payment Reminder',
    notificationType: 'payment',
    title: 'Course Fee Payment Reminder',
    message:
      'Dear Student, your course fee payment is pending. Kindly complete the payment via the portal to activate full LMS and batch access.',
  },
  {
    id: 'exam_schedule',
    name: 'Upcoming Certification Assessment',
    notificationType: 'academic',
    title: 'Upcoming Certification Exam Window Announced',
    message:
      'The final certification assessment for your enrolled cohort has been scheduled. Please ensure all prerequisite lessons, lab assignments, and modules are completed.',
  },
  {
    id: 'live_class_rescheduled',
    name: 'Live Class Timetable Rescheduled',
    notificationType: 'academic',
    title: 'Notice: Live Interactive Session Rescheduled',
    message:
      "Due to a schedule adjustment, tomorrow's live interactive session will start at 11:00 AM IST instead of 10:00 AM.",
  },
  {
    id: 'placement_drive',
    name: 'Campus Hiring Drive Alert',
    notificationType: 'placement',
    title: 'New Placement Opportunities Published',
    message: 'New openings are live on the placement portal. Review the eligibility details and apply before the deadline.',
  },
  {
    id: 'attendance_alert',
    name: 'Low Attendance Warning (BR-011)',
    notificationType: 'academic',
    title: 'Academic Attendance Criteria Reminder',
    message:
      'Your current attendance is close to the 75% certificate eligibility threshold (BR-011). Please attend upcoming scheduled sessions.',
  },
];

/** Broadcast audiences, expressed as the backend's role codes. */
const AUDIENCES: Array<{ id: string; label: string; roles: BroadcastAudienceRole[] }> = [
  { id: 'students', label: 'All Students', roles: ['student'] },
  { id: 'teachers', label: 'All Teachers', roles: ['teacher'] },
  { id: 'students_teachers', label: 'All Students and Teachers', roles: ['student', 'teacher'] },
  { id: 'staff', label: 'All Admins and Super Admins', roles: ['admin', 'super_admin'] },
  { id: 'everyone', label: 'Everyone (all roles)', roles: ['student', 'teacher', 'admin', 'super_admin'] },
];

const TYPE_LABEL: Record<AdminNotificationType, string> = {
  announcement: 'General Announcement',
  academic: 'Academic / Timetable / Exams',
  placement: 'Placement & Campus Drives',
  payment: 'Fees & Payments',
  system: 'System Notice',
};

type Recipient = { id: string; name: string; detail: string };

/**
 * Admin / Super Admin notifications (ADM-013, COM-002, COM-007), backed by the
 * live API. Delivery is in-app only: no email or WhatsApp provider is
 * configured on the server and SMS is disabled (BR-014). Success is reported
 * only when the server confirms it, with the server's recipient count.
 */
export const AdminNotificationPage: React.FC = () => {
  const { showToast } = useNotification();

  const [history, setHistory] = useState<AuditLog[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // Composer State
  const [mode, setMode] = useState<'broadcast' | 'single'>('broadcast');
  const [audienceId, setAudienceId] = useState(AUDIENCES[0]!.id);
  const [recipientRole, setRecipientRole] = useState<'student' | 'teacher'>('student');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientsError, setRecipientsError] = useState<string | null>(null);
  const [recipientId, setRecipientId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState<AdminNotificationType>('announcement');
  const [isSending, setIsSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = NOTIFICATION_TEMPLATES.find((t) => t.id === templateId);
    if (tpl) {
      setTitle(tpl.title);
      setMessage(tpl.message);
      setNotificationType(tpl.notificationType);
    }
  };

  const loadHistory = async () => {
    setIsHistoryLoading(true);
    const res = await adminService.getBroadcastHistory();
    setIsHistoryLoading(false);
    if (res.success) {
      setHistory(res.data);
      setHistoryError(null);
    } else {
      setHistoryError(res.error ?? 'Broadcast history could not be loaded.');
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Recipients for a single notification: real student / teacher accounts.
  useEffect(() => {
    if (mode !== 'single') return;
    setRecipients([]);
    setRecipientId('');
    setRecipientsError(null);
    const load =
      recipientRole === 'student'
        ? adminService.getStudents().then((r) => ({
            ...r,
            data: r.data.map((s) => ({ id: s.id, name: s.name, detail: s.email })),
          }))
        : adminService.getTeachers().then((r) => ({
            ...r,
            data: r.data.map((t) => ({ id: t.id, name: t.name, detail: t.email })),
          }));
    load.then((r) => {
      if (r.success) setRecipients(r.data);
      else setRecipientsError(r.error ?? 'Recipients could not be loaded.');
    });
  }, [mode, recipientRole]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (title.trim().length < 2 || message.trim().length < 5) {
      setFormError('A title (2+ characters) and a message (5+ characters) are required.');
      return;
    }

    if (mode === 'single') {
      if (!recipientId) {
        setFormError('Choose a recipient.');
        return;
      }
      setIsSending(true);
      const res = await adminService.sendNotification({ recipientUserId: recipientId, title, messageBody: message, notificationType });
      setIsSending(false);
      if (!res.success) {
        setFormError(res.error ?? 'The notification could not be sent.');
        return;
      }
      const who = recipients.find((r) => r.id === recipientId)?.name ?? `user #${recipientId}`;
      showToast({ type: 'success', title: 'Notification Sent', message: `In-app notification delivered to ${who}.` });
    } else {
      const audience = AUDIENCES.find((a) => a.id === audienceId)!;
      setIsSending(true);
      const res = await adminService.broadcastNotification({ audience: audience.roles, title, messageBody: message, notificationType });
      setIsSending(false);
      if (!res.success) {
        setFormError(res.error ?? 'The broadcast could not be sent.');
        return;
      }
      const count = res.data.recipientCount;
      showToast({
        type: count > 0 ? 'success' : 'warning',
        title: count > 0 ? 'Broadcast Sent' : 'No Recipients',
        message:
          count > 0
            ? `In-app notification delivered to ${count} recipient(s) (${audience.label}).`
            : `No user currently holds the selected role(s) (${audience.label}); nothing was delivered.`,
      });
      loadHistory();
    }

    setTitle('');
    setMessage('');
    setSelectedTemplateId('');
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'details',
      header: 'Broadcast',
      render: (l) => <span className="text-[11px] text-slate-700 line-clamp-2 block max-w-[420px]">{l.details}</span>,
    },
    {
      key: 'actorName',
      header: 'Sent By',
      render: (l) => <span className="text-xs font-semibold text-slate-800">{l.actorName}</span>,
    },
    {
      key: 'timestamp',
      header: 'Dispatched Date',
      sortable: true,
      render: (l) => <span className="text-xs text-slate-500">{formatDate(l.timestamp)}</span>,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Broadcast Alerts (ADM-013)</h1>
        <p className="text-xs text-slate-500 mt-1">
          Publish in-app notifications to individual users or to everyone holding a role.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer Form Card */}
        <Card className="lg:col-span-1 p-6 bg-white border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Radio className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Notification Composer</h3>
          </div>

          <form onSubmit={handleSend} className="space-y-3 text-xs text-slate-700">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Send To *</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'broadcast' | 'single')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="broadcast">Everyone holding a role (broadcast)</option>
                <option value="single">One specific student or teacher</option>
              </select>
            </div>

            {mode === 'broadcast' ? (
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Target Audience *</label>
                <select
                  value={audienceId}
                  onChange={(e) => setAudienceId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {AUDIENCES.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Recipient Type *</label>
                  <select
                    value={recipientRole}
                    onChange={(e) => setRecipientRole(e.target.value as 'student' | 'teacher')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Recipient *</label>
                  <select
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="">{recipients.length ? '-- Choose recipient --' : 'No recipients available'}</option>
                    {recipients.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.detail})
                      </option>
                    ))}
                  </select>
                  {recipientsError && <p className="mt-1 text-[11px] text-red-700">{recipientsError}</p>}
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Template (optional)</label>
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
              <label className="block font-semibold text-slate-800 mb-1">Notification Type</label>
              <select
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value as AdminNotificationType)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {(Object.keys(TYPE_LABEL) as AdminNotificationType[]).map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Notification Title *</label>
              <input
                type="text"
                required
                maxLength={250}
                placeholder="e.g. Campus Drive Announcement"
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
                placeholder="Enter the full message text shown in the recipient's portal..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* Delivery channel: what the server actually supports */}
            <div className="flex gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-600">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-indigo-600" />
              <span>
                <Bell className="inline h-3 w-3 text-indigo-600" /> Delivered as an in-app portal notification. Email and
                WhatsApp delivery are not configured on the server; SMS is disabled at launch (BR-014).
              </span>
            </div>

            {formError && (
              <p className="flex items-center gap-2 text-[11px] text-red-700">
                <AlertCircle className="h-3.5 w-3.5" /> {formError}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isSending}
              leftIcon={<Send className="h-4 w-4" />}
            >
              {mode === 'broadcast' ? 'Send Broadcast' : 'Send Notification'}
            </Button>
          </form>
        </Card>

        {/* History Table */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">Broadcast History (activity log)</h3>
          {historyError ? (
            <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-700">
              <span>{historyError}</span>
              <Button variant="outline" size="sm" onClick={loadHistory}>
                Retry
              </Button>
            </div>
          ) : isHistoryLoading && history.length === 0 ? (
            <p className="text-xs text-slate-500">Loading broadcast history...</p>
          ) : history.length === 0 ? (
            <p className="text-xs text-slate-500 p-6 border border-dashed border-slate-200 rounded-lg text-center">
              No broadcasts have been sent yet.
            </p>
          ) : (
            <DataTable data={history} columns={columns} searchPlaceholder="Search broadcasts..." pageSize={8} />
          )}
          <p className="text-[11px] text-slate-400">
            <Badge variant="neutral" size="sm">Note</Badge> Every individual and broadcast notification is listed in the notification history below.
          </p>
        </div>
      </div>
      <NotificationHistoryPanel />
    </div>
  );
};
