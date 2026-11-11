import React, { useState } from 'react';
import { HelpCircle, Plus, Send, MessageSquare, Clock } from 'lucide-react';
import { SEED_TICKETS } from '../../mocks/seedData';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import type { SupportTicket, TicketCategory } from '../../types';

export const StudentSupportPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [tickets, setTickets] = useState<SupportTicket[]>(SEED_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(SEED_TICKETS[0]);
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  // New ticket form
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<TicketCategory>('Academic');
  const [newMessage, setNewMessage] = useState('');

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newTkt: SupportTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId: user.id,
      studentName: user.name,
      studentEmail: user.email,
      category: newCategory,
      subject: newSubject,
      status: 'open',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderId: user.id,
          senderName: user.name,
          senderRole: 'student',
          message: newMessage,
          sentAt: new Date().toISOString(),
        },
      ],
    };

    setTickets((prev) => [newTkt, ...prev]);
    setSelectedTicket(newTkt);
    setNewTicketModalOpen(false);
    setNewSubject('');
    setNewMessage('');
    showToast({
      type: 'success',
      title: 'Ticket Raised',
      message: `Support ticket ${newTkt.ticketNumber} created successfully.`,
    });
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket || !user) return;

    const updated = {
      ...selectedTicket,
      messages: [
        ...selectedTicket.messages,
        {
          id: `msg-${Date.now()}`,
          senderId: user.id,
          senderName: user.name,
          senderRole: 'student' as const,
          message: replyText,
          sentAt: new Date().toISOString(),
        },
      ],
    };

    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTicket(updated);
    setReplyText('');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support & Help Desk</h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit academic doubts, fee inquiries, or LMS technical issues directly to staff (SRS Module SUP).
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setNewTicketModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Support Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Tickets</h3>
          <div className="space-y-2">
            {tickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-indigo-700">{t.ticketNumber}</span>
                    <Badge variant={t.status === 'resolved' ? 'success' : 'info'} size="sm">
                      {t.status.toUpperCase()}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{t.subject}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span>{t.category}</span>
                    <span>{formatDate(t.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Ticket Thread */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card className="flex flex-col h-[600px]">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-indigo-600">
                      {selectedTicket.ticketNumber}
                    </span>
                    <Badge variant="purple" size="sm">{selectedTicket.category}</Badge>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedTicket.subject}</h3>
                </div>
                <Badge variant="info" size="sm" dot>{selectedTicket.status}</Badge>
              </div>

              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
                {selectedTicket.messages.map((m) => {
                  const isMe = m.senderId === user?.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col max-w-md ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <span className="text-[10px] text-slate-400 font-medium mb-1">
                        {m.senderName} ({m.senderRole.toUpperCase()}) • {formatDate(m.sentAt)}
                      </span>
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-slate-100 flex gap-2 bg-white">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type reply to staff..."
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button variant="primary" size="sm" type="submit" rightIcon={<Send className="h-3.5 w-3.5" />}>
                  Reply
                </Button>
              </form>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center p-8 bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
              Select a ticket to view conversation thread.
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      <Modal
        isOpen={newTicketModalOpen}
        onClose={() => setNewTicketModalOpen(false)}
        title="Raise New Support Ticket"
        size="md"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ticket Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as TicketCategory)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Academic">Academic / Doubt</option>
              <option value="Technical / LMS">Technical / LMS Player</option>
              <option value="Fee & Payment">Fee & Payment Query</option>
              <option value="Placement">Placement Assistance</option>
              <option value="Certificate">Certificate Request</option>
              <option value="General">General Inquiry</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Title</label>
            <input
              type="text"
              required
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Brief summary of your query"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description</label>
            <textarea
              rows={4}
              required
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Describe your issue or doubt in detail..."
              className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setNewTicketModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

