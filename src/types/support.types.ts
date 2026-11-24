export type TicketCategory = 'Academic' | 'Technical / LMS' | 'Fee & Payment' | 'Placement' | 'Certificate' | 'General';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'teacher' | 'admin' | 'super_admin';
  message: string;
  sentAt: string;
  attachmentUrl?: string;
  /** Staff-only note (never shown to the student). */
  isInternal?: boolean;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string; // e.g. "TKT-1082"
  studentId: string;
  studentName: string;
  studentEmail: string;
  category: TicketCategory;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  assignedAdminId?: string;
  /** Backend fields (live API): category name, assignee name, original message. */
  categoryName?: string;
  assignedAdminName?: string;
  description?: string;
  messages: TicketMessage[];
}

