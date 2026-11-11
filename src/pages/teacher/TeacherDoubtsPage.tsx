import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  User,
  Filter,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { teacherService } from '../../services/teacherService';
import type { StudentDoubt } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/feedback/Modal';
import { formatDate } from '../../utils/formatters';

export const TeacherDoubtsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [doubts, setDoubts] = useState<StudentDoubt[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'answered' | 'resolved'>('all');
  const [selectedDoubt, setSelectedDoubt] = useState<StudentDoubt | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newStatus, setNewStatus] = useState<'answered' | 'resolved'>('answered');
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    const loadDoubts = async () => {
      const teacherId = user?.id || 'user-tch-001';
      const res = await teacherService.getStudentDoubts(teacherId);
      if (res.success) setDoubts(res.data);
    };

    loadDoubts();
  }, [user]);

  const handleOpenReply = (doubt: StudentDoubt) => {
    setSelectedDoubt(doubt);
    setReplyText('');
    setNewStatus('answered');
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoubt || !replyText.trim()) {
      showToast({ type: 'error', message: 'Please write a reply before sending.' });
      return;
    }

    setIsReplying(true);
    const res = await teacherService.replyToDoubt(
      { id: user?.id || 'user-tch-001', name: user?.name || 'Dr. Vikram Rao' },
      selectedDoubt.id,
      replyText.trim(),
      newStatus
    );
    setIsReplying(false);

    if (res.success && res.data) {
      setDoubts((prev) => prev.map((d) => (d.id === res.data.id ? res.data : d)));
      setSelectedDoubt(null);
      showToast({
        type: 'success',
        title: 'Reply Dispatched (TCH-012)',
        message: `Your answer has been sent to ${res.data.studentName}.`,
      });
    }
  };

  const filteredDoubts = doubts.filter((d) => {
    if (statusFilter === 'all') return true;
    return d.status === statusFilter;
  });

  const openCount = doubts.filter((d) => d.status === 'open').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Doubts & Mentorship Q&A</h1>
            {openCount > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {openCount} Unanswered
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review conceptual and architectural queries submitted by enrolled students (SRS Rule TCH-012).
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
        {[
          { key: 'all', label: 'All Queries' },
          { key: 'open', label: `Unanswered (${openCount})` },
          { key: 'answered', label: 'Answered' },
          { key: 'resolved', label: 'Resolved' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              statusFilter === tab.key
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Doubts Feed */}
      <div className="space-y-4">
        {filteredDoubts.length === 0 ? (
          <Card className="p-10 text-center text-xs text-slate-400">
            No student queries found under this filter.
          </Card>
        ) : (
          filteredDoubts.map((doubt) => (
            <Card key={doubt.id} className="p-6 border-slate-200 hover:border-teal-300 transition-colors space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                    {doubt.studentName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{doubt.studentName}</span>
                      <Badge variant="purple" size="sm">{doubt.batchName || 'Assigned Cohort'}</Badge>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Posted: {formatDate(doubt.createdAt)}</span>
                  </div>
                </div>

                <Badge
                  variant={
                    doubt.status === 'open'
                      ? 'warning'
                      : doubt.status === 'answered'
                      ? 'info'
                      : 'success'
                  }
                  size="sm"
                  dot
                >
                  {doubt.status === 'open' ? 'Needs Answer' : doubt.status === 'answered' ? 'Answered' : 'Resolved'}
                </Badge>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">{doubt.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{doubt.description}</p>
                {doubt.codeSnippet && (
                  <pre className="p-3 bg-slate-900 text-teal-300 rounded-lg text-[11px] font-mono overflow-x-auto">
                    <code>{doubt.codeSnippet}</code>
                  </pre>
                )}
              </div>

              {/* Thread Replies */}
              {doubt.replies && doubt.replies.length > 0 && (
                <div className="pt-2 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Conversation History</span>
                  {doubt.replies.map((rep) => (
                    <div key={rep.id} className="p-3 bg-teal-50/50 border border-teal-100 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-teal-900 font-semibold">
                        <span>{rep.authorName} ({rep.authorRole === 'teacher' ? 'Faculty Mentor' : 'Student'})</span>
                        <span className="text-slate-400 font-mono">{formatDate(rep.createdAt)}</span>
                      </div>
                      <p className="text-slate-800">{rep.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700"
                  onClick={() => handleOpenReply(doubt)}
                  leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
                >
                  {doubt.replies?.length > 0 ? 'Add Additional Reply' : 'Answer Doubt'}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Reply Modal (TCH-012) */}
      {selectedDoubt && (
        <Modal
          isOpen={!!selectedDoubt}
          onClose={() => setSelectedDoubt(null)}
          title={`Reply to Query: ${selectedDoubt.studentName}`}
          size="lg"
        >
          <form onSubmit={handleSendReply} className="space-y-4 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <span className="font-bold text-slate-900">{selectedDoubt.title}</span>
              <p className="text-slate-600 text-[11px]">{selectedDoubt.description}</p>
            </div>

            <div>
              <label className="block font-semibold mb-1">Teacher Answer & Guidance *</label>
              <textarea
                rows={5}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Provide clear technical solution, code hints, or architectural rationale..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Set Updated Query Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="answered">Mark as Answered</option>
                <option value="resolved">Mark as Fully Resolved</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button variant="outline" size="sm" type="button" onClick={() => setSelectedDoubt(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                isLoading={isReplying}
                className="bg-teal-600 hover:bg-teal-700"
                leftIcon={<Send className="h-4 w-4" />}
              >
                Send Answer to Student
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

