import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessagesPanel } from '../../components/common/MessagesPanel';

/** COM-010: in-app messages between students and the Admin team (same page for both sides). */
export const MessagesPage: React.FC<{ mode: 'student' | 'staff' }> = ({ mode }) => {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Messages</h1>
        <p className="text-xs text-slate-500 mt-1">
          {mode === 'student'
            ? 'Write to the Admin team. Replies appear here.'
            : 'Messages from students. Only your own conversations are shown.'}
        </p>
      </div>
      {user?.id ? <MessagesPanel mode={mode} currentUserId={String(user.id)} /> : <p className="text-xs text-slate-400">Loading…</p>}
    </div>
  );
};
