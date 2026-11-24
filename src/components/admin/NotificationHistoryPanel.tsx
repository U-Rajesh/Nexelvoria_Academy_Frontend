import React, { useCallback, useEffect, useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { adminService, type NotificationHistoryPage, type NotificationHistoryQuery } from '../../services/adminService';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

const TYPES = ['system', 'academic', 'payment', 'placement', 'announcement'];
const inputCls = 'px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500';
const PAGE_SIZE = 20;

/**
 * COM-008: every in-app notification sent, across recipients, newest first,
 * filtered and paged on the server. Read state is the recipient's own.
 */
export const NotificationHistoryPanel: React.FC = () => {
  const [draft, setDraft] = useState<Omit<NotificationHistoryQuery, 'page' | 'pageSize'>>({});
  const [filter, setFilter] = useState<Omit<NotificationHistoryQuery, 'page' | 'pageSize'>>({});
  const [page, setPage] = useState(1);
  const [data, setData] = useState<NotificationHistoryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminService.getNotificationHistory({ ...filter, page, pageSize: PAGE_SIZE });
    setLoading(false);
    if (res.success && res.data) {
      setData(res.data);
      setError(null);
    } else setError(res.error || 'Notification history could not be loaded.');
  }, [filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.from && draft.to && draft.from > draft.to) return setError('The start date must not be after the end date.');
    setPage(1);
    setFilter({ ...draft, search: draft.search?.trim() || undefined });
  };

  return (
    <Card className="p-5 space-y-3 text-xs">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
        <History className="h-4 w-4 text-indigo-600" /> Notification history
      </h3>
      <form onSubmit={apply} className="flex flex-wrap items-end gap-2">
        <select className={inputCls} value={draft.notificationType ?? ''} onChange={(e) => setDraft({ ...draft, notificationType: e.target.value || undefined })}>
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input type="date" className={inputCls} value={draft.from ?? ''} onChange={(e) => setDraft({ ...draft, from: e.target.value || undefined })} />
        <input type="date" className={inputCls} value={draft.to ?? ''} onChange={(e) => setDraft({ ...draft, to: e.target.value || undefined })} />
        <input className={`${inputCls} flex-1 min-w-[160px]`} placeholder="Search title, message or recipient" maxLength={100} value={draft.search ?? ''} onChange={(e) => setDraft({ ...draft, search: e.target.value })} />
        <Button type="submit" variant="primary" size="sm">
          Apply
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={load} isLoading={loading} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
          Refresh
        </Button>
      </form>
      {error && <p className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800">{error}</p>}
      {data && (
        <>
          <p className="text-slate-500">{data.total} notifications</p>
          {data.rows.length === 0 ? (
            <p className="text-slate-400 italic">No notifications match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Sent</th>
                    <th className="px-2 py-1.5 text-left">Recipient</th>
                    <th className="px-2 py-1.5 text-left">Type</th>
                    <th className="px-2 py-1.5 text-left">Title</th>
                    <th className="px-2 py-1.5 text-left">Read</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.rows.map((n) => (
                    <tr key={n.id}>
                      <td className="px-2 py-1.5 whitespace-nowrap">{new Date(n.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                      <td className="px-2 py-1.5">{n.recipientName ?? `User #${n.recipientUserId}`}</td>
                      <td className="px-2 py-1.5 capitalize">{n.notificationType}</td>
                      <td className="px-2 py-1.5">
                        <span className="font-semibold text-slate-800">{n.title}</span>
                        <span className="block text-slate-500 line-clamp-1">{n.messageBody}</span>
                      </td>
                      <td className="px-2 py-1.5">{n.readAt ? 'Read' : 'Unread'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span>
                Page {data.page} of {data.totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages || loading} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
};
