import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Send,
  User,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { Modal } from '../../components/feedback/Modal';
import { Card } from '../../components/common/Card';
import type { SupportTicket, TicketMessage } from '../../types';

export const AdminSupportPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [ticketStatus, setTicketStatus] = useState<'open' | 'in_progress' | 'resolved' | 'closed'>('resolved');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTickets = async () => {
    const res = await adminService.getTickets();
    if (res.success) {
      setTickets(res.data);
      if (selectedTicket) {
        const updated = res.data.find((t) => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicket || !replyText.trim()) return;

    setIsSubmitting(true);
    const res = await adminService.replyTicket(
      { id: user.id, name: user.name },
      selectedTicket.id,
      replyText,
      ticketStatus
    );
    setIsSubmitting(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Reply Dispatched',
        message: `Response sent to ${selectedTicket.studentName}. Status: ${ticketStatus.toUpperCase()}.`,
      });
      setReplyText('');
      loadTickets();
    }
  };

  const columns: Column<SupportTicket>[] = [
    {
      key: 'ticketNumber',
      header: 'Ticket #',
      sortable: true,
      render: (t) => <span className="font-mono text-xs font-bold text-slate-900">{t.ticketNumber}</span>,
    },
    {
      key: 'studentName',
      header: 'Student Name',
      sortable: true,
      render: (t) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{t.studentName}</span>
          <span className="text-[11px] text-slate-400 font-mono">{t.studentEmail}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (t) => <Badge variant="purple" size="sm">{t.category}</Badge>,
    },
    {
      key: 'subject',
      header: 'Subject Matter',
      render: (t) => (
        <span className="text-xs text-slate-800 font-semibold line-clamp-1 block max-w-[280px]">
          {t.subject}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (t) => (
        <Badge
          variant={
            t.priority === 'urgent'
              ? 'danger'
              : t.priority === 'high'
              ? 'warning'
              : 'info'
          }
          size="sm"
        >
          {t.priority.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (t) => (
        <Badge
          variant={
            t.status === 'resolved'
              ? 'success'
              : t.status === 'in_progress'
              ? 'purple'
              : t.status === 'closed'
              ? 'neutral'
              : 'warning'
          }
          size="sm"
          dot
        >
          {t.status.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Raised On',
      sortable: true,
      render: (t) => <span className="text-xs text-slate-500">{formatDate(t.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (t) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedTicket(t);
            setTicketStatus(t.status === 'resolved' ? 'resolved' : 'in_progress');
          }}
          className="text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
        >
          Open Thread
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Support Desk (ADM-016)</h1>
        <p className="text-xs text-slate-500 mt-1">
          Resolve student academic inquiries, LMS technical access issues, fee queries, and placement assistance requests.
        </p>
      </div>

      {/* Main Table */}
      <DataTable
        data={tickets}
        columns={columns}
        searchPlaceholder="Search ticket ID, student name or subject..."
        pageSize={10}
      />

      {/* Conversation Thread Modal */}
      {selectedTicket && (
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={`Ticket ${selectedTicket.ticketNumber}: ${selectedTicket.subject}`}
          size="lg"
        >
          <div className="space-y-4 text-xs text-slate-700">
            {/* Ticket Info Bar */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-900 block">{selectedTicket.studentName} ({selectedTicket.studentEmail})</span>
                <span className="text-[11px] text-slate-500">Category: {selectedTicket.category} • Priority: {selectedTicket.priority.toUpperCase()}</span>
              </div>
              <Badge
                variant={
                  selectedTicket.status === 'resolved'
                    ? 'success'
                    : selectedTicket.status === 'in_progress'
                    ? 'purple'
                    : 'warning'
                }
                size="sm"
              >
                {selectedTicket.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            {/* Messages Thread */}
            <div className="max-h-72 overflow-y-auto space-y-3 p-3 bg-slate-50/50 rounded-xl border border-slate-200">
              {selectedTicket.messages.map((msg) => {
                const isAdmin = msg.senderRole === 'admin' || msg.senderRole === 'teacher';
                return (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl max-w-[85%] space-y-1 ${
                      isAdmin
                        ? 'ml-auto bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 text-[10px] opacity-80">
                      <span className="font-bold">{msg.senderName} ({msg.senderRole.toUpperCase()})</span>
                      <span>{formatDate(msg.sentAt)}</span>
                    </div>
                    <p className="text-xs leading-relaxed">{msg.message}</p>
                  </div>
                );
              })}
            </div>

            {/* Reply Composer Form */}
            <form onSubmit={handleSendReply} className="space-y-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Administrative Reply</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Type your official administrative resolution or response to the student..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Set Ticket Status:</span>
                  <select
                    value={ticketStatus}
                    onChange={(e) => setTicketStatus(e.target.value as any)}
                    className="px-2 py-1 border border-slate-200 rounded-md bg-white text-slate-800"
                  >
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved (Case Solved)</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelectedTicket(null)}>
                    Close
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} leftIcon={<Send className="h-4 w-4" />}>
                    Send Reply
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

