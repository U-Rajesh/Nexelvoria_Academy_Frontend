import React, { useCallback, useEffect, useState } from 'react';
import { Info, KeyRound, Mail, MessageSquare, Send, ShieldCheck, CalendarRange } from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDateTime } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import type { SystemConfigStatus } from '../../types';
import { IntegrationsCard, MaintenanceCard } from '../../components/admin/MaintenanceAndIntegrations';

const DELIVERY_LABEL: Record<SystemConfigStatus['email']['delivery'], { text: string; variant: 'success' | 'warning' | 'danger' }> = {
  smtp: { text: 'SMTP delivery', variant: 'success' },
  development_log: { text: 'Development: codes written to the server log', variant: 'warning' },
  not_configured: { text: 'Not configured', variant: 'danger' },
};

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-1.5 border-b border-slate-100 last:border-0">
    <span className="text-slate-500">{label}</span>
    <span className="font-semibold text-slate-900 text-right break-all">{value}</span>
  </div>
);

/**
 * Platform configuration (Super Admin). Read-only: these values come from the
 * server environment and code, not from a database table, so they cannot be
 * edited here. The page shows what the server actually enforces and lets the
 * Super Admin send a real SMTP test message.
 */
export const SuperAdminSystemConfigPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [config, setConfig] = useState<SystemConfigStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await superAdminService.getSystemConfig();
    if (res.success && res.data) {
      setConfig(res.data);
      setError(null);
    } else {
      setConfig(null);
      setError(res.error || 'System configuration could not be loaded.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (user?.email) setRecipient((r) => r || user.email || '');
  }, [user?.email]);

  const sendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim()) return;
    setIsSending(true);
    const res = await superAdminService.testEmailConfiguration(recipient.trim());
    setIsSending(false);
    if (res.success && res.data) {
      setLastResult(`Accepted by the SMTP server for ${res.data.sentTo} at ${formatDateTime(res.data.sentAt)}.`);
      showToast({ type: 'success', title: 'Test email sent', message: 'Check the recipient inbox to confirm delivery.' });
    } else {
      setLastResult(null);
      showToast({ type: 'error', title: 'Test email not sent', message: res.error || 'Please retry.' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-xs">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Configuration</h1>
        <p className="text-slate-500 mt-1">
          What the server is running with right now. These values are set in the server environment, so they are shown
          read-only. Institute details are edited from Institute Settings.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-3">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      <MaintenanceCard />

      {config && (
        <>
          {config.integrations && <IntegrationsCard integrations={config.integrations} />}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-indigo-600" /> Outgoing email
                </h3>
                <Badge variant={DELIVERY_LABEL[config.email.delivery].variant} size="sm">
                  {DELIVERY_LABEL[config.email.delivery].text}
                </Badge>
              </div>
              {config.email.host ? (
                <div>
                  <Row label="Server" value={`${config.email.host}:${config.email.port}`} />
                  <Row label="Encrypted connection" value={config.email.secure ? 'Yes (TLS)' : 'STARTTLS / none'} />
                  <Row label="Account" value={config.email.user} />
                  <Row label="Sender" value={config.email.from} />
                </div>
              ) : (
                <p className="text-slate-600">
                  {config.email.configurationError ?? 'No SMTP server is configured on this server.'}
                </p>
              )}
            </Card>

            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-600" /> SMS
              </h3>
              <Badge variant="neutral" size="sm">Not configured</Badge>
              <p className="text-slate-600">{config.sms.note}</p>
            </Card>

            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-600" /> Sign-in security
              </h3>
              <div>
                <Row label="Failed sign-ins before lockout" value={config.security.maxFailedLoginAttempts} />
                <Row label="Minimum password length" value={config.security.passwordMinLength} />
                <Row label="Access token lifetime" value={`${config.security.accessTokenTtlMinutes} minutes`} />
                <Row label="Session lifetime" value={`${config.security.refreshTokenTtlDays} days`} />
                <Row label="Session lifetime (remember me)" value={`${config.security.rememberMeRefreshTokenTtlDays} days`} />
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-indigo-600" /> One-time codes
              </h3>
              <div>
                <Row label="Channel" value="Email only" />
                <Row label="Code validity" value={`${config.otp.ttlMinutes} minutes`} />
                <Row label="Attempts per code" value={config.otp.maxVerifyAttempts} />
                <Row label="Resend cooldown" value={`${config.otp.resendCooldownSeconds} seconds`} />
              </div>
            </Card>

            <Card className="p-5 space-y-3 md:col-span-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-indigo-600" /> Reporting
              </h3>
              <div>
                <Row label="Time zone" value={config.reporting.timezone} />
                <Row label="Current financial year" value={`${config.reporting.financialYear} (from ${formatDateTime(config.reporting.financialYearStartsAt)})`} />
                <Row label="Server environment" value={config.environment} />
              </div>
            </Card>
          </div>

          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Send className="h-4 w-4 text-indigo-600" /> Send a test email
            </h3>
            <form onSubmit={sendTest} className="flex flex-col sm:flex-row gap-2 sm:items-end">
              <div className="flex-1">
                <label htmlFor="test-recipient" className="block font-semibold text-slate-700 mb-1">Recipient</label>
                <input
                  id="test-recipient"
                  type="email"
                  required
                  maxLength={254}
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSending}
                disabled={config.email.delivery !== 'smtp'}
                title={config.email.delivery !== 'smtp' ? 'SMTP is not configured on this server' : undefined}
              >
                Send test email
              </Button>
            </form>
            {lastResult && <p className="text-emerald-700">{lastResult}</p>}
          </Card>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex gap-2">
            <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
            <p>
              Payment-gateway keys, SMTP passwords and other secrets are never sent to the browser. To change these
              values, update the server environment and restart the API.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
