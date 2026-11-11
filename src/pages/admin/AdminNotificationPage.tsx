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

export const AdminNotificationPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Composer State
  const [targetGroup, setTargetGroup] = useState<string>('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'academic' | 'exam' | 'placement' | 'fee' | 'general'>('general');
  const [linkUrl, setLinkUrl] = useState('');
  const [isSending, setIsSending] = useState(false);

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
      showToast({
        type: 'success',
        title: 'Broadcast Announcement Dispatched',
        message: `Alert successfully sent to audience: ${targetGroup.toUpperCase()}. (ADM-013)`,
      });
      setTitle('');
      setMessage('');
      setLinkUrl('');
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
          Publish immediate push notifications, timetable revisions, exam schedules, and campus drive announcements.
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

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isSending}
              leftIcon={<Send className="h-4 w-4" />}
            >
              Send Broadcast
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

