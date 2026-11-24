import React, { useState, useEffect } from 'react';
import { SupportCategoriesManager } from '../../components/admin/SupportCategoriesManager';
import type { TicketStatusChange } from '../../services/adminService';
import { Send, AlertCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { superAdminService } from '../../services/superAdminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { Modal } from '../../components/feedback/Modal';
import type { SupportTicket, TicketStatus } from '../../types';

type AssigneeChoice = { id: string; name: string };

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const statusVariant = (s: TicketStatus) =>
  s === 'resolved' ? 'success' : s === 'in_progress' ? 'purple' : s === 'closed' ? 'neutral' : 'warning';

/**
 * Admin / Super Admin support desk (SUP-003, SUP-004), backed by the live API:
 * list, thread, replies (optionally internal), status and assignee changes.
 * Assignees must be Admin or Super Admin accounts: every staff member can take
 * a ticket themselves; a Super Admin can also pick any Admin.
 */
export const AdminSupportPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isThreadLoading, setIsThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);

  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>('in_progress');
  const [assigneeId, setAssigneeId] = useState('');
  const [assignees, setAssignees] = useState<AssigneeChoice[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  /** SUP-005: every status change of the open ticket, from the server. */
  const [history, setHistory] = useState<TicketStatusChange[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const loadTickets = async () => {
    setIsLoading(true);
    const res = await adminService.getTickets();
    setIsLoading(false);
    if (res.success) {
      setTickets(res.data);
      setLoadError(null);
    } else {
      setLoadError(res.error ?? 'Support tickets could not be loaded.');
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Valid assignees: the signed-in staff member, and (Super Admin only) every Admin account.
  useEffect(() => {
    if (!user) return;
    const self: AssigneeChoice = { id: user.id, name: `${user.name} (me)` };
    if (user.role !== 'super_admin') {
      setAssignees([self]);
      return;
    }
    superAdminService.getAdmins().then((res) => {
      const admins = res.success
        ? res.data.filter((a) => a.id !== user.id && a.status === 'active').map((a) => ({ id: a.id, name: a.name }))
        : [];
      setAssignees([self, ...admins]);
    });
  }, [user]);

  const openTicket = async (ticketId: string) => {
    setIsThreadLoading(true);
    setThreadError(null);
    setFormError(null);
    setReplyText('');
    setIsInternal(false);
    setAssigneeId('');
    const [res, hist] = await Promise.all([adminService.getTicket(ticketId), adminService.getTicketHistory(ticketId)]);
    setIsThreadLoading(false);
    setHistory(hist.success ? hist.data : []);
    setHistoryError(hist.success ? null : hist.error || 'The ticket history could not be loaded.');
    if (res.success) {
      setSelectedTicket(res.data);
      setTicketStatus(res.data.status);
    } else {
      setThreadError(res.error ?? 'The ticket could not be loaded.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    const text = replyText.trim();
    const statusChanged = ticketStatus !== selectedTicket.status;
    if (!text && !statusChanged && !assigneeId) {
      setFormError('Write a reply, or change the status or assignee.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    let current = selectedTicket;

    if (text) {
      const reply = await adminService.replyTicket(selectedTicket.id, text, isInternal);
      if (!reply.success) {
        setIsSubmitting(false);
        setFormError(reply.error ?? 'The reply could not be posted.');
        return;
      }
      // A staff reply moves an open ticket to in_progress on the server.
      const refreshed = await adminService.getTicket(selectedTicket.id);
      if (refreshed.success) current = refreshed.data;
    }

    if (ticketStatus !== current.status || assigneeId) {
      const upd = await adminService.updateTicketStatus(selectedTicket.id, ticketStatus, assigneeId || undefined);
      if (!upd.success) {
        setIsSubmitting(false);
        setFormError(
          text
            ? `The reply was posted, but the ticket was not updated: ${upd.error}`
            : upd.error ?? 'The ticket could not be updated.'
        );
        await openTicket(selectedTicket.id);
        loadTickets();
        return;
      }
    }

    setIsSubmitting(false);
    showToast({
      type: 'success',
      title: text ? (isInternal ? 'Internal Note Saved' : 'Reply Posted') : 'Ticket Updated',
      message: `Ticket ${selectedTicket.ticketNumber} saved.`,
    });
    await openTicket(selectedTicket.id);
    loadTickets();
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
      render: (t) => <span className="font-bold text-slate-900 block text-xs">{t.studentName || `User #${t.studentId}`}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (t) => <Badge variant="purple" size="sm">{t.categoryName ?? t.category}</Badge>,
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
        <Badge variant={t.priority === 'urgent' ? 'danger' : t.priority === 'high' ? 'warning' : 'info'} size="sm">
          {String(t.priority ?? '').toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (t) => (
        <Badge variant={statusVariant(t.status)} size="sm" dot>
          {String(t.status ?? '').replace('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'assignedAdminName',
      header: 'Assigned To',
      render: (t) => <span className="text-xs text-slate-600">{t.assignedAdminName ?? 'Unassigned'}</span>,
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
          onClick={() => openTicket(t.id)}
          className="text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
        >
          Open Thread
        </Button>
      ),
    },
  ];

  const isOpen = isThreadLoading || !!selectedTicket || !!threadError;
  const closeModal = () => {
    setSelectedTicket(null);
    setThreadError(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Support Desk (ADM-016)</h1>
        <p className="text-xs text-slate-500 mt-1">
          Resolve student academic inquiries, LMS technical access issues, fee queries, and placement assistance requests.
        </p>
      </div>

      {loadError && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-700">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {loadError}
          </span>
          <Button variant="outline" size="sm" onClick={loadTickets}>
            Retry
          </Button>
        </div>
      )}

      {/* Main Table */}
      {isLoading && tickets.length === 0 ? (
        <p className="text-xs text-slate-500">Loading support tickets...</p>
      ) : !loadError && tickets.length === 0 ? (
        <p className="text-xs text-slate-500 p-6 border border-dashed border-slate-200 rounded-lg text-center">
          No support tickets have been raised yet.
        </p>
      ) : (
        <DataTable
          data={tickets}
          columns={columns}
          searchPlaceholder="Search ticket ID, student name or subject..."
          pageSize={10}
        />
      )}

      {/* Conversation Thread Modal */}
      {isOpen && (
        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          title={selectedTicket ? `Ticket ${selectedTicket.ticketNumber}: ${selectedTicket.subject}` : 'Support Ticket'}
          size="lg"
        >
          {isThreadLoading && !selectedTicket ? (
            <p className="text-xs text-slate-500">Loading conversation...</p>
          ) : threadError && !selectedTicket ? (
            <p className="text-xs text-red-700">{threadError}</p>
          ) : selectedTicket ? (
            <div className="space-y-4 text-xs text-slate-700">
              {/* Ticket Info Bar */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900 block">{selectedTicket.studentName || `User #${selectedTicket.studentId}`}</span>
                  <span className="text-[11px] text-slate-500">
                    Category: {selectedTicket.categoryName ?? selectedTicket.category} • Priority:{' '}
                    {String(selectedTicket.priority ?? '').toUpperCase()} • Assigned to:{' '}
                    {selectedTicket.assignedAdminName ?? 'Unassigned'}
                  </span>
                </div>
                <Badge variant={statusVariant(selectedTicket.status)} size="sm">
                  {String(selectedTicket.status ?? '').replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              {/* SUP-005: status history */}
              <div className="p-3 rounded-xl border border-slate-200 bg-white text-[11px] space-y-1">
                <span className="font-bold text-slate-700 block">Status history</span>
                {historyError ? (
                  <span className="text-rose-700">{historyError}</span>
                ) : history.length === 0 ? (
                  <span className="text-slate-400">No status changes recorded.</span>
                ) : (
                  <ol className="space-y-0.5">
                    {history.map((h) => (
                      <li key={h.id} className="flex flex-wrap gap-x-2 text-slate-600">
                        <span className="font-mono text-slate-400">{formatDate(h.changedAt)}</span>
                        <span>
                          {h.previousStatus ? `${h.previousStatus.replace('_', ' ')} → ` : 'Opened as '}
                          <strong>{h.newStatus.replace('_', ' ')}</strong>
                        </span>
                        <span className="text-slate-400">by {h.changedByName ?? (h.changedByUserId ? `User #${h.changedByUserId}` : 'system')}</span>
                        {h.changeReason && <span className="italic">({h.changeReason})</span>}
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {/* Messages Thread: the original request, then replies */}
              <div className="max-h-72 overflow-y-auto space-y-3 p-3 bg-slate-50/50 rounded-xl border border-slate-200">
                {selectedTicket.description && (
                  <div className="p-3 rounded-xl max-w-[85%] space-y-1 bg-white border border-slate-200 text-slate-800">
                    <div className="flex items-center justify-between gap-4 text-[10px] opacity-80">
                      <span className="font-bold">{selectedTicket.studentName || 'Student'} (STUDENT)</span>
                      <span>{formatDate(selectedTicket.createdAt)}</span>
                    </div>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>
                )}
                {selectedTicket.messages.map((msg) => {
                  const isStaff = msg.senderRole !== 'student';
                  return (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl max-w-[85%] space-y-1 ${
                        msg.isInternal
                          ? 'ml-auto bg-amber-50 border border-amber-200 text-amber-900'
                          : isStaff
                          ? 'ml-auto bg-indigo-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-[10px] opacity-80">
                        <span className="font-bold">
                          {msg.senderName || 'User'} ({msg.isInternal ? 'INTERNAL NOTE' : isStaff ? 'SUPPORT STAFF' : 'STUDENT'})
                        </span>
                        <span>{formatDate(msg.sentAt)}</span>
                      </div>
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  );
                })}
                {selectedTicket.messages.length === 0 && (
                  <p className="text-[11px] text-slate-400 text-center">No replies yet.</p>
                )}
              </div>

              {/* Reply / Update Form */}
              <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Administrative Reply</label>
                  <textarea
                    rows={3}
                    placeholder="Type your response to the student (optional when only changing the status or assignee)..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                  <label className="mt-1 flex items-center gap-2 text-[11px] text-slate-600">
                    <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
                    Internal note (not visible to the student)
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Status:</span>
                    <select
                      value={ticketStatus}
                      onChange={(e) => setTicketStatus(e.target.value as TicketStatus)}
                      className="px-2 py-1 border border-slate-200 rounded-md bg-white text-slate-800"
                    >
                      {(Object.keys(STATUS_LABEL) as TicketStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Assign to:</span>
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded-md bg-white text-slate-800"
                    >
                      <option value="">Keep current</option>
                      {assignees.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formError && (
                  <p className="flex items-center gap-2 text-[11px] text-red-700">
                    <AlertCircle className="h-3.5 w-3.5" /> {formError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={closeModal}>
                    Close
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} leftIcon={<Send className="h-4 w-4" />}>
                    Save
                  </Button>
                </div>
              </form>
            </div>
          ) : null}
        </Modal>
      )}

      <SupportCategoriesManager />
    </div>
  );
};
