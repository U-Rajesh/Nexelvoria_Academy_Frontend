import React, { useCallback, useEffect, useState } from 'react';
import { MessageSquare, RefreshCw, Send } from 'lucide-react';
import { messagesService, type ConversationSummary, type DirectMessage, type MessageContact } from '../../services/messagesService';
import { useNotification } from '../../context/NotificationContext';
import { Button } from './Button';
import { Card } from './Card';

const fmt = (iso: string) => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

/**
 * COM-010 messages between students and the Admin team. Students can start a
 * conversation with an Admin; Admins reply to students who wrote to them or
 * start one from a student's id. Everything is loaded from and saved on the server.
 */
export const MessagesPanel: React.FC<{ mode: 'student' | 'staff'; currentUserId: string }> = ({ mode, currentUserId }) => {
  const { showToast } = useNotification();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [contacts, setContacts] = useState<MessageContact[]>([]);
  const [selected, setSelected] = useState<{ userId: string; name: string } | null>(null);
  const [thread, setThread] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [newRecipient, setNewRecipient] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    const res = await messagesService.getConversations();
    setLoading(false);
    if (res.success) {
      setConversations(res.data);
      setError(null);
    } else setError(res.error || 'Conversations could not be loaded.');
  }, []);

  useEffect(() => {
    loadConversations();
    if (mode === 'student') messagesService.getContacts().then((r) => r.success && setContacts(r.data));
  }, [loadConversations, mode]);

  const open = async (userId: string, name: string) => {
    setSelected({ userId, name });
    setThread([]);
    const res = await messagesService.getConversation(userId);
    if (!res.success) return showToast({ type: 'error', title: 'Messages unavailable', message: res.error || 'Please retry.' });
    setThread(res.data);
    if (res.data.some((m) => m.recipientUserId === currentUserId && !m.readAt)) {
      await messagesService.markRead(userId);
      loadConversations();
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = selected?.userId ?? newRecipient.trim();
    if (!target || !draft.trim()) return;
    setSending(true);
    const res = await messagesService.send(target, draft.trim());
    setSending(false);
    if (!res.success || !res.data) return showToast({ type: 'error', title: 'Not sent', message: res.error || 'The message could not be sent.' });
    setDraft('');
    const name = selected?.name ?? contacts.find((c) => c.userId === target)?.name ?? `User #${target}`;
    await open(target, name);
    loadConversations();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-indigo-600" /> Conversations
          </h3>
          <Button variant="ghost" size="sm" onClick={loadConversations} isLoading={loading} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        </div>
        {error && <p className="text-rose-700">{error}</p>}
        {!loading && conversations.length === 0 && <p className="text-slate-400 italic">No conversations yet.</p>}
        <ul className="divide-y divide-slate-100">
          {conversations.map((c) => (
            <li key={c.userId}>
              <button
                className={`w-full text-left p-2 rounded ${selected?.userId === c.userId ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                onClick={() => open(c.userId, c.name)}
              >
                <span className="flex justify-between gap-2">
                  <span className="font-semibold text-slate-800">{c.name}</span>
                  {c.unreadCount > 0 && <span className="px-1.5 rounded-full bg-indigo-600 text-white text-[10px]">{c.unreadCount}</span>}
                </span>
                <span className="block text-slate-500 truncate">{c.lastMessage}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="pt-2 border-t border-slate-100 space-y-1">
          <span className="font-semibold text-slate-700">New conversation</span>
          {mode === 'student' ? (
            <select
              className="w-full px-2 py-1.5 border border-slate-200 rounded"
              value={newRecipient}
              onChange={(e) => {
                setNewRecipient(e.target.value);
                const c = contacts.find((x) => x.userId === e.target.value);
                if (c) open(c.userId, c.name);
              }}
            >
              <option value="">Choose an Admin…</option>
              {contacts.map((c) => (
                <option key={c.userId} value={c.userId}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex gap-1">
              <input
                className="flex-1 px-2 py-1.5 border border-slate-200 rounded"
                placeholder="Student user id"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value.replace(/\D/g, ''))}
              />
              <Button variant="outline" size="sm" disabled={!newRecipient} onClick={() => open(newRecipient, `Student #${newRecipient}`)}>
                Open
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4 md:col-span-2 flex flex-col gap-3 min-h-[320px]">
        {!selected ? (
          <p className="text-slate-400 italic m-auto">Select a conversation.</p>
        ) : (
          <>
            <h3 className="text-sm font-bold text-slate-900">{selected.name}</h3>
            <div className="flex-1 overflow-y-auto max-h-96 space-y-2 p-2 bg-slate-50 rounded border border-slate-100">
              {thread.length === 0 && <p className="text-slate-400 italic">No messages yet.</p>}
              {thread.map((m) => {
                const mine = m.senderUserId === currentUserId;
                return (
                  <div key={m.id} className={`max-w-[80%] p-2 rounded-lg ${mine ? 'ml-auto bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-800'}`}>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <span className={`block text-[10px] mt-1 ${mine ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {fmt(m.sentAt)}
                      {mine && (m.readAt ? ' · Read' : ' · Sent')}
                    </span>
                  </div>
                );
              })}
            </div>
            <form onSubmit={send} className="flex gap-2">
              <textarea
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
                maxLength={4000}
                placeholder="Write a message…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <Button type="submit" variant="primary" size="sm" isLoading={sending} disabled={!draft.trim()} leftIcon={<Send className="h-3.5 w-3.5" />}>
                Send
              </Button>
            </form>
            <p className="text-[11px] text-slate-400">In-app messages only; no email, SMS or WhatsApp copy is sent.</p>
          </>
        )}
      </Card>
    </div>
  );
};
