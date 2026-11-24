import React, { useCallback, useEffect, useState } from 'react';
import { KeyRound, Monitor, History, LogOut, ShieldAlert } from 'lucide-react';
import { authService } from '../../services/authService';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import type { LoginHistoryItem, SessionItem } from '../../types';

const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs';

/**
 * Account security for Admin and Super Admin users (AUTH-007, AUTH-008,
 * AUTH-009, AUTH-010). Everything is the signed-in user's own data.
 * Two-factor sign-in (AUTH-013) awaits an approved policy and is not offered.
 */
export const AdminAccountSecurityPage: React.FC = () => {
  const { showToast } = useNotification();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [history, setHistory] = useState<LoginHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busySession, setBusySession] = useState<string | null>(null);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    const [s, h] = await Promise.all([authService.getActiveSessions(), authService.getLoginHistory()]);
    setIsLoading(false);
    if (s.success) setSessions(s.data);
    if (h.success) setHistory(h.data);
    setLoadError(!s.success ? s.error || 'Sessions could not be loaded.' : !h.success ? h.error || 'Login history could not be loaded.' : null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (next !== confirm) return setPwError('The new password and its confirmation do not match.');
    setIsSaving(true);
    const res = await authService.changePassword(current, next);
    setIsSaving(false);
    if (res.success) {
      showToast({ type: 'success', title: 'Password Changed', message: res.message || 'Your other sessions were signed out.' });
      setCurrent('');
      setNext('');
      setConfirm('');
      load();
    } else {
      setPwError(res.error || 'The password could not be changed.');
    }
  };

  const endSession = async (s: SessionItem) => {
    setBusySession(s.id);
    const res = await authService.terminateSession('', s.id);
    setBusySession(null);
    if (res.success) {
      showToast({ type: 'info', title: 'Session Signed Out', message: `${s.device} was signed out.` });
      setSessions(res.data);
    } else showToast({ type: 'error', title: 'Not signed out', message: res.error || 'Please retry.' });
  };

  const endOthers = async () => {
    setBusySession('others');
    const res = await authService.terminateOtherSessions();
    setBusySession(null);
    if (res.success) {
      showToast({ type: 'info', title: 'Other Sessions', message: res.message || 'Other sessions were signed out.' });
      setSessions(res.data);
    } else showToast({ type: 'error', title: 'Not signed out', message: res.error || 'Please retry.' });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Security</h1>
        <p className="text-xs text-slate-500 mt-1">Change your password, review where you are signed in, and check recent sign-in activity.</p>
      </div>

      {loadError && <Card className="p-4 border border-rose-200 bg-rose-50 text-xs text-rose-800">{loadError}</Card>}

      {/* Change password */}
      <Card className="p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-indigo-600" /> Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
            <input type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
            <input type="password" required autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <input type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
          </div>
          {pwError && <p className="sm:col-span-3 p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">{pwError}</p>}
          <p className="sm:col-span-2 text-[11px] text-slate-500">At least 8 characters with an uppercase letter, a number and a special character. Your other sessions are signed out.</p>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* Sessions */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Monitor className="h-4 w-4 text-indigo-600" /> Active Sessions
          </h2>
          <Button variant="outline" size="sm" onClick={endOthers} isLoading={busySession === 'others'} disabled={sessions.filter((s) => !s.isCurrent).length === 0} leftIcon={<LogOut className="h-3.5 w-3.5" />}>
            Sign Out All Other Sessions
          </Button>
        </div>
        {isLoading ? (
          <p className="text-xs text-slate-400">Loading…</p>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No active sessions.</p>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
            {sessions.map((s) => (
              <div key={s.id} className="p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-900">{[s.device, s.browser, s.os].filter(Boolean).join(' · ') || 'Unknown device'}</span>
                  {s.isCurrent && (
                    <Badge variant="success" size="sm" className="ml-2">
                      THIS DEVICE
                    </Badge>
                  )}
                  <span className="block text-[11px] text-slate-500">
                    {[s.ipAddress, s.location, s.lastActive].filter(Boolean).join(' · ')}
                  </span>
                </div>
                {!s.isCurrent && (
                  <Button variant="ghost" size="sm" className="text-xs text-rose-600" isLoading={busySession === s.id} onClick={() => endSession(s)}>
                    Sign Out
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Login history */}
      <Card className="p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <History className="h-4 w-4 text-indigo-600" /> Recent Sign-In Activity
        </h2>
        {isLoading ? (
          <p className="text-xs text-slate-400">Loading…</p>
        ) : history.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No sign-in activity recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
            {history.map((h) => (
              <div key={h.id} className="p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono text-slate-600">{new Date(h.timestamp).toLocaleString()}</span>
                <span className="text-slate-500">{[h.device, h.ipAddress].filter(Boolean).join(' · ') || '—'}</span>
                <Badge variant={h.status === 'success' ? 'success' : 'danger'} size="sm" dot>
                  {h.status === 'success' ? 'SIGNED IN' : `FAILED${h.failureReason ? `: ${h.failureReason}` : ''}`}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 border border-amber-200 bg-amber-50 text-xs text-amber-900 flex items-start gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
        <span>Two-factor sign-in is not available yet: it will be enabled once the two-factor policy is approved.</span>
      </Card>
    </div>
  );
};
