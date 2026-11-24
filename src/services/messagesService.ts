import { apiClient } from './api';
import type { ApiResponse } from '../types/common.types';

/**
 * COM-010: student <-> Admin messages (NXA_Messages). Every call works on the
 * signed-in user's own conversations; the server allows only student <-> active
 * Admin / Super Admin pairs. In-app only: no email, SMS or WhatsApp delivery.
 */
export interface DirectMessage {
  id: string;
  senderUserId: string;
  recipientUserId: string;
  body: string;
  sentAt: string;
  readAt?: string;
}
export interface ConversationSummary {
  userId: string;
  name: string;
  lastMessage: string;
  lastSentAt: string;
  unreadCount: number;
}
export interface MessageContact {
  userId: string;
  name: string;
}

const errorText = (err: any, fallback: string): string => {
  const body = err?.response?.data;
  const details: { field?: string; message?: string }[] = Array.isArray(body?.details) ? body.details : [];
  const d = details.map((x) => x.message).filter(Boolean).join('; ');
  return d && !String(body?.message ?? '').includes(d) ? `${body?.message || fallback} (${d})` : body?.message || err?.message || fallback;
};

async function call<T>(req: () => Promise<{ data?: { data?: T } }>, empty: T, fallback: string): Promise<ApiResponse<T>> {
  try {
    const res = await req();
    return { success: true, data: (res.data?.data ?? empty) as T };
  } catch (err) {
    return { success: false, data: empty, error: errorText(err, fallback) };
  }
}

export const messagesService = {
  getContacts: () => call<MessageContact[]>(() => apiClient.get('/support/messages/contacts'), [], 'Contacts could not be loaded.'),
  getConversations: () => call<ConversationSummary[]>(() => apiClient.get('/support/messages/conversations'), [], 'Conversations could not be loaded.'),
  getConversation: (userId: string) =>
    call<DirectMessage[]>(() => apiClient.get(`/support/messages/conversations/${encodeURIComponent(userId)}`), [], 'Messages could not be loaded.'),
  markRead: (userId: string) =>
    call<{ marked: number }>(() => apiClient.post(`/support/messages/conversations/${encodeURIComponent(userId)}/read`, {}), { marked: 0 }, 'Could not mark as read.'),
  send: (recipientUserId: string, body: string) =>
    call<DirectMessage | null>(() => apiClient.post('/support/messages', { recipientUserId, body }), null, 'The message could not be sent.'),
};
