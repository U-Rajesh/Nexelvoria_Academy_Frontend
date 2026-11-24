import React, { useCallback, useEffect, useState } from 'react';
import { Tags } from 'lucide-react';
import { adminService, type SupportCategoryAdmin } from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';

/**
 * Support ticket categories (SUP-006). Changes are saved on the server and
 * audited; a category is deactivated rather than deleted because tickets
 * reference it. Students only see active categories.
 */
export const SupportCategoriesManager: React.FC = () => {
  const { showToast } = useNotification();
  const [items, setItems] = useState<SupportCategoryAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminService.getSupportCategories();
    setLoading(false);
    if (res.success) {
      setItems(res.data);
      setError(null);
    } else setError(res.error || 'Categories could not be loaded.');
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const done = async (ok: boolean, title: string, message: string, error?: string) => {
    if (ok) {
      showToast({ type: 'success', title, message });
      await load();
    } else showToast({ type: 'error', title: 'Not saved', message: error || 'The server did not save the change.' });
    return ok;
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim().length < 2) return;
    setBusy('new');
    const res = await adminService.createSupportCategory(newName.trim());
    setBusy(null);
    if (await done(res.success, 'Category created', `"${newName.trim()}" is available to students.`, res.error)) setNewName('');
  };

  const rename = async () => {
    if (!editing || editing.name.trim().length < 2) return;
    setBusy(editing.id);
    const res = await adminService.updateSupportCategory(editing.id, { name: editing.name.trim() });
    setBusy(null);
    if (await done(res.success, 'Category renamed', `Renamed to "${editing.name.trim()}".`, res.error)) setEditing(null);
  };

  const toggle = async (c: SupportCategoryAdmin) => {
    setBusy(c.id);
    const res = await adminService.updateSupportCategory(c.id, { isActive: !c.isActive });
    setBusy(null);
    await done(res.success, c.isActive ? 'Category deactivated' : 'Category activated', `"${c.name}" is now ${c.isActive ? 'hidden from new tickets' : 'available'}.`, res.error);
  };

  return (
    <Card className="p-5 space-y-3 text-xs">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
        <Tags className="h-4 w-4 text-indigo-600" /> Ticket categories
      </h3>
      <p className="text-slate-500">Students choose from active categories when raising a ticket. Deactivate a category instead of deleting it; existing tickets keep it.</p>
      <form onSubmit={create} className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="New category name"
          maxLength={100}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button type="submit" variant="primary" size="sm" isLoading={busy === 'new'} disabled={newName.trim().length < 2}>
          Add
        </Button>
      </form>
      {error && <p className="text-rose-700">{error}</p>}
      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-slate-400 italic">No categories yet. Students cannot raise tickets until one is added.</p>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
          {items.map((c) => (
            <li key={c.id} className="p-2.5 flex flex-wrap items-center justify-between gap-2">
              {editing?.id === c.id ? (
                <input
                  className="flex-1 px-2 py-1 border border-slate-200 rounded"
                  maxLength={100}
                  value={editing.name}
                  onChange={(e) => setEditing({ id: c.id, name: e.target.value })}
                />
              ) : (
                <span className="font-semibold text-slate-800">{c.name}</span>
              )}
              <div className="flex items-center gap-2">
                <Badge variant={c.isActive ? 'success' : 'neutral'} size="sm">
                  {c.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {editing?.id === c.id ? (
                  <>
                    <Button variant="primary" size="sm" isLoading={busy === c.id} onClick={rename}>
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setEditing({ id: c.id, name: c.name })}>
                      Rename
                    </Button>
                    <Button variant="outline" size="sm" isLoading={busy === c.id} onClick={() => toggle(c)}>
                      {c.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
