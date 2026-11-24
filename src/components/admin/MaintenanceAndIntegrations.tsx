import React, { useCallback, useEffect, useState } from 'react';
import { Plug, Power } from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import type { SystemConfigStatus } from '../../types';

/**
 * Maintenance mode (CFG-20) is a real switch: while on, the API answers 503 to
 * everyone except Super Admins. The state shown is the one the server saved.
 */
export const MaintenanceCard: React.FC = () => {
  const { showToast } = useNotification();
  const [state, setState] = useState<{ enabled: boolean; message: string } | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await superAdminService.getMaintenance();
    if (res.success && res.data) {
      setState(res.data);
      setMessage(res.data.message);
      setError(null);
    } else setError(res.error || 'Maintenance status could not be loaded.');
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (enabled: boolean) => {
    if (enabled && !window.confirm('Turn maintenance mode on? Everyone except Super Admins will be unable to use the platform until it is turned off.')) return;
    setSaving(true);
    const res = await superAdminService.setMaintenance(enabled, message.trim() || undefined);
    setSaving(false);
    if (res.success && res.data) {
      setState(res.data);
      setMessage(res.data.message);
      showToast({ type: enabled ? 'warning' : 'success', title: enabled ? 'Maintenance mode is on' : 'Maintenance mode is off', message: res.message || '' });
    } else showToast({ type: 'error', title: 'Not changed', message: res.error || 'The server did not change maintenance mode.' });
  };

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Power className="h-4 w-4 text-indigo-600" /> Maintenance mode
        </h3>
        {state && (
          <Badge variant={state.enabled ? 'danger' : 'success'} size="sm">
            {state.enabled ? 'ON: platform closed' : 'Off'}
          </Badge>
        )}
      </div>
      {error && <p className="text-rose-700">{error}</p>}
      {state && (
        <>
          <p className="text-slate-600">
            While on, every request from students, teachers and Admins receives a maintenance notice. Super Admins keep full access and sign-in stays open.
          </p>
          <label className="block font-semibold text-slate-700">Message shown to users</label>
          <textarea
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            maxLength={300}
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            {state.enabled ? (
              <>
                <Button variant="outline" size="sm" isLoading={saving} onClick={() => save(true)}>
                  Update message
                </Button>
                <Button variant="primary" size="sm" isLoading={saving} onClick={() => save(false)}>
                  Turn off
                </Button>
              </>
            ) : (
              <Button variant="danger" size="sm" isLoading={saving} onClick={() => save(true)}>
                Turn on
              </Button>
            )}
          </div>
        </>
      )}
    </Card>
  );
};

/** What is actually configured: presence only, never secret values, never "verified" unless it was. */
export const IntegrationsCard: React.FC<{ integrations: SystemConfigStatus['integrations'] }> = ({ integrations }) => {
  const rows: Array<{ name: string; ok: boolean; label: string; note: string }> = [
    {
      name: 'Payment gateway (Razorpay)',
      ok: false,
      label: integrations.paymentGateway.webhookSecretConfigured ? 'Webhook secret set; checkout not integrated' : 'Not configured',
      note: integrations.paymentGateway.note,
    },
    { name: 'File storage', ok: integrations.fileStorage.configured, label: 'Not configured', note: integrations.fileStorage.note },
    { name: 'WhatsApp messaging', ok: integrations.whatsapp.configured, label: 'Not configured', note: integrations.whatsapp.note },
    { name: 'Backups', ok: integrations.backups.configured, label: 'Not configured', note: integrations.backups.note },
  ];
  return (
    <Card className="p-5 space-y-3">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
        <Plug className="h-4 w-4 text-indigo-600" /> Integrations
      </h3>
      <ul className="divide-y divide-slate-100">
        {rows.map((r) => (
          <li key={r.name} className="py-2 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-800">{r.name}</span>
              <Badge variant={r.ok ? 'success' : 'warning'} size="sm">
                {r.label}
              </Badge>
            </div>
            <p className="text-slate-500">{r.note}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
};
