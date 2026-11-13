import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Laptop,
  Globe,
  KeyRound,
  LogOut,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  QrCode,
  Lock,
  History,
  Info,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { authService } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import { formatDate } from '../../utils/formatters';
import type { SessionItem, LoginHistoryItem, TwoFactorSettings, StudentProfile } from '../../types';

export const StudentSecurityPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const student = user as (StudentProfile | null);

  // States
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [history, setHistory] = useState<LoginHistoryItem[]>([]);
  const [twoFactorSettings, setTwoFactorSettings] = useState<TwoFactorSettings | null>(
    student?.twoFactorSettings || null
  );
  const [is2FAEnabled, setIs2FAEnabled] = useState(student?.twoFactorEnabled ?? false);

  // Modals
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [terminateAllModalOpen, setTerminateAllModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  const loadSecurityData = async () => {
    if (!user) return;
    const [sessRes, histRes] = await Promise.all([
      authService.getActiveSessions(user.id),
      authService.getLoginHistory(user.id),
    ]);
    if (sessRes.success) setSessions(sessRes.data);
    if (histRes.success) setHistory(histRes.data);
  };

  useEffect(() => {
    loadSecurityData();
  }, [user]);

  // Handle terminating individual session
  const handleTerminateSession = async (sessionId: string) => {
    if (!user) return;
    setIsProcessing(true);
    const res = await authService.terminateSession(user.id, sessionId);
    setIsProcessing(false);
    if (res.success) {
      setSessions(res.data);
      showToast({
        type: 'info',
        title: 'Session Terminated',
        message: 'The remote session has been revoked and signed out.',
      });
    }
  };

  // Handle terminating all other sessions
  const handleTerminateAllOtherSessions = async () => {
    if (!user) return;
    setIsProcessing(true);
    const res = await authService.terminateOtherSessions(user.id);
    setIsProcessing(false);
    setTerminateAllModalOpen(false);
    if (res.success) {
      setSessions(res.data);
      showToast({
        type: 'success',
        title: 'Remote Sessions Revoked',
        message: 'All other active devices have been disconnected.',
      });
    }
  };

  // Handle 2FA Setup Confirmation
  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (verificationCode.trim() !== '123456' && verificationCode.length !== 6) {
      showToast({
        type: 'error',
        title: 'Invalid Authenticator Code',
        message: 'Please enter a valid 6-digit code. (Demo code: 123456)',
      });
      return;
    }

    setIsProcessing(true);
    const res = await authService.toggleTwoFactor(user.id, true, verificationCode);
    setIsProcessing(false);

    if (res.success && res.data) {
      setTwoFactorSettings(res.data);
      setIs2FAEnabled(true);
      setSetupModalOpen(false);
      setVerificationCode('');
      showToast({
        type: 'success',
        title: 'Two-Factor Authentication Enabled',
        message: 'Your account is now protected with 2FA TOTP verification.',
      });
    }
  };

  // Handle Disable 2FA
  const handleDisable2FA = async () => {
    if (!user) return;
    setIsProcessing(true);
    const res = await authService.toggleTwoFactor(user.id, false);
    setIsProcessing(false);
    if (res.success) {
      setIs2FAEnabled(false);
      setTwoFactorSettings(null);
      showToast({
        type: 'info',
        title: '2FA Deactivated',
        message: 'Two-Factor Authentication has been turned off.',
      });
    }
  };

  const handleCopySecret = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    showToast({ type: 'info', message: 'Secret key copied to clipboard.' });
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyBackupCodes = (codes: string[]) => {
    navigator.clipboard.writeText(codes.join('\n'));
    setCopiedBackupCodes(true);
    showToast({ type: 'info', message: 'Backup emergency codes copied.' });
    setTimeout(() => setCopiedBackupCodes(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Security & Sessions</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor active device sessions, configure Two-Factor Authentication, review login audits, and manage account protection.
        </p>
      </div>

      {/* SECTION 1: SECURITY OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Account State Status */}
        <Card className="p-4 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Account Status</span>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                student?.accountState === 'approved'
                  ? 'success'
                  : student?.accountState === 'locked'
                  ? 'danger'
                  : 'warning'
              }
              size="md"
              dot
            >
              {(student?.accountState || 'approved').toUpperCase().replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500">
            {student?.accountState === 'locked'
              ? 'Account locked after 5 failed attempts.'
              : 'Identity & credentials verified.'}
          </p>
        </Card>

        {/* Two-Factor Authentication */}
        <Card className="p-4 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Two-Factor Auth (2FA)</span>
          <div className="flex items-center gap-2">
            <Badge variant={is2FAEnabled ? 'success' : 'neutral'} size="md" dot={is2FAEnabled}>
              {is2FAEnabled ? '2FA ENABLED' : 'DISABLED'}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500">
            {is2FAEnabled ? 'TOTP Authenticator active' : 'Recommended for extra protection'}
          </p>
        </Card>

        {/* Password Age */}
        <Card className="p-4 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password Age</span>
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-bold text-slate-800">
              {student?.lastPasswordChange ? formatDate(student.lastPasswordChange) : 'Default (Oct 2026)'}
            </span>
          </div>
          <Link to="/student/change-password" className="text-[11px] text-indigo-600 hover:underline block">
            Change password →
          </Link>
        </Card>

        {/* Active Sessions Count */}
        <Card className="p-4 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Devices</span>
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-bold text-slate-800">{sessions.length} Logged In</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {sessions.filter((s) => !s.isCurrent).length} remote sessions active
          </p>
        </Card>
      </div>

      {/* Lockout Security Warning */}
      <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-start gap-3 text-xs text-indigo-950">
        <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-bold">Brute-Force Lockout Defense Active:</strong>
          <p className="text-indigo-800 leading-relaxed">
            In compliance with student portal security standards, any account experiencing{' '}
            <strong>5 consecutive failed password attempts</strong> will be automatically locked to prevent unauthorized intrusion. Unlocking requires password recovery or Administrator intervention.
          </p>
        </div>
      </div>

      {/* SECTION 2: ACTIVE SESSIONS */}
      <Card className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Active Device Sessions</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Devices and browsers currently authenticated with your student credentials.
            </p>
          </div>

          {sessions.filter((s) => !s.isCurrent).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTerminateAllModalOpen(true)}
              className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs"
              leftIcon={<LogOut className="h-3.5 w-3.5" />}
            >
              Sign Out All Other Sessions
            </Button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {sessions.map((sess) => (
            <div key={sess.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
              <div className="flex items-start gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  {sess.os?.toLowerCase().includes('ios') || sess.device?.toLowerCase().includes('phone') ? (
                    <Smartphone className="h-5 w-5" />
                  ) : (
                    <Laptop className="h-5 w-5" />
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{sess.device}</span>
                    {sess.isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        This Device
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">ID: {sess.id}</span>
                    )}
                  </div>
                  <p className="text-slate-500">
                    {sess.browser} • {sess.os}
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>IP: {sess.ipAddress}</span>
                    <span>•</span>
                    <span>Location: {sess.location}</span>
                    <span>•</span>
                    <span>Last active: {sess.lastActive}</span>
                  </p>
                </div>
              </div>

              {!sess.isCurrent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTerminateSession(sess.id)}
                  disabled={isProcessing}
                  className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 self-start sm:self-center"
                >
                  Terminate
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* SECTION 3: TWO-FACTOR AUTHENTICATION */}
      <Card className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Two-Factor Authentication (2FA)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Require a time-based 6-digit authenticator code (Google Authenticator, Authy, Microsoft Authenticator) when signing in.
            </p>
          </div>

          <div>
            {is2FAEnabled ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisable2FA}
                disabled={isProcessing}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Disable 2FA
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSetupModalOpen(true)}
                leftIcon={<Shield className="h-4 w-4" />}
              >
                Enable 2FA
              </Button>
            )}
          </div>
        </div>

        {is2FAEnabled && twoFactorSettings && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">2FA Authenticator Configured</span>
              <span className="text-[11px] text-slate-500">
                Activated on {formatDate(twoFactorSettings.lastConfiguredAt || new Date().toISOString())}
              </span>
            </div>

            {/* Backup Codes */}
            {twoFactorSettings.backupCodes && (
              <div className="space-y-2 pt-2 border-t border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Emergency One-Time Backup Codes:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyBackupCodes(twoFactorSettings.backupCodes!)}
                    className="text-[11px] text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    {copiedBackupCodes ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedBackupCodes ? 'Copied' : 'Copy All'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
                  {twoFactorSettings.backupCodes.map((code, idx) => (
                    <div key={idx} className="p-1.5 bg-white border border-slate-200 rounded text-slate-800 font-bold">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* SECTION 4: LOGIN AUDIT HISTORY */}
      <Card className="p-6 space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Recent Login Activity</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of the most recent authentication attempts for this account.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Device / Client</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No recorded login history.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {formatDate(item.timestamp)}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {item.device} ({item.browser})
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{item.ipAddress}</td>
                    <td className="py-2.5 px-3">{item.location}</td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={item.status === 'success' ? 'success' : 'danger'}
                        size="sm"
                        dot
                      >
                        {item.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 2FA Setup Modal */}
      <Modal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        title="Setup Two-Factor Authentication"
        size="md"
      >
        <form onSubmit={handleConfirm2FA} className="space-y-5 text-xs">
          <div className="text-center space-y-2">
            <div className="h-32 w-32 mx-auto bg-slate-950 p-3 rounded-2xl flex flex-col items-center justify-center text-white border border-slate-700 shadow-md">
              <QrCode className="h-16 w-16 text-indigo-400" />
              <span className="text-[10px] text-slate-400 mt-1 font-mono">Scan QR Code</span>
            </div>
            <p className="text-slate-600 max-w-sm mx-auto">
              Scan this QR code with your mobile authenticator app (e.g. Google Authenticator or Microsoft Authenticator).
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Or Enter Key Manually
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-900">NEX-SEC-9921-AF88-LMS</span>
              <button
                type="button"
                onClick={() => handleCopySecret('NEX-SEC-9921-AF88-LMS')}
                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold text-[11px]"
              >
                {copiedKey ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Enter 6-Digit Authenticator Code
            </label>
            <input
              type="text"
              maxLength={6}
              required
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full text-center font-mono tracking-widest text-lg font-bold py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1 text-center">
              💡 Demo code: <span className="font-mono text-slate-700 font-bold">123456</span>
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setSetupModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isProcessing}>
              Activate 2FA
            </Button>
          </div>
        </form>
      </Modal>

      {/* Terminate All Confirmation Modal */}
      <Modal
        isOpen={terminateAllModalOpen}
        onClose={() => setTerminateAllModalOpen(false)}
        title="Revoke All Remote Sessions?"
        size="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            This will immediately sign out all active sessions on other phones, laptops, and tablets. Your current session will remain active.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setTerminateAllModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isProcessing}
              onClick={handleTerminateAllOtherSessions}
            >
              Sign Out Other Devices
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

