import React, { useCallback, useEffect, useState } from 'react';
import { Building, Info, Lock, Save, SlidersHorizontal } from 'lucide-react';
import { adminService, type InstituteSettings, type SettingDefinition } from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';

type TextKey = 'instituteName' | 'tagline' | 'supportEmail' | 'supportPhone' | 'whatsappNumber' | 'address' | 'gstNumber';

/** Editable institute profile fields, in the order shown. Limits mirror the server schema. */
const TEXT_FIELDS: { key: TextKey; label: string; type?: string; maxLength: number; wide?: boolean; required?: boolean; hint?: string }[] = [
  { key: 'instituteName', label: 'Institute name', maxLength: 150, required: true, hint: 'Printed on report exports.' },
  { key: 'tagline', label: 'Tagline', maxLength: 200 },
  { key: 'supportEmail', label: 'Support email', type: 'email', maxLength: 254 },
  { key: 'supportPhone', label: 'Support phone', type: 'tel', maxLength: 25 },
  { key: 'whatsappNumber', label: 'WhatsApp number', type: 'tel', maxLength: 25, hint: 'Contact detail only; no WhatsApp messaging provider is configured.' },
  { key: 'gstNumber', label: 'GSTIN', maxLength: 15, hint: '15 characters, e.g. 36AABCU9603R1ZM. No GST rate or tax calculation is configured.' },
  { key: 'address', label: 'Address', maxLength: 500, wide: true },
];

const display = (v: unknown): string => (v === undefined || v === null || v === '' ? 'Not set' : String(v));

/** Approved rule settings (D1, D7, D9), shown from the server catalog, in this order. */
const RULE_GROUPS: { group: SettingDefinition['group']; title: string }[] = [
  { group: 'academic', title: 'Academic settings' },
  { group: 'courses', title: 'Course settings' },
  { group: 'security', title: 'Sign-in security' },
];
type RuleValue = number | boolean | undefined;

/**
 * Institute settings (ADM-016, CFG-01, CFG-09). Loaded from and saved to
 * GET/PUT /admin/settings; only changed fields are sent and the server audits
 * them. Settings the server stores but does not apply are shown read-only,
 * with the decision they wait on, instead of offering an edit that does nothing.
 */
export const AdminSettingsPage: React.FC = () => {
  const { showToast } = useNotification();
  const [saved, setSaved] = useState<InstituteSettings | null>(null);
  const [draft, setDraft] = useState<InstituteSettings>({});
  const [catalog, setCatalog] = useState<SettingDefinition[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  /** Rule edits: number fields are kept as typed text until saved. */
  const [ruleDraft, setRuleDraft] = useState<Record<string, string | boolean>>({});

  const load = useCallback(async () => {
    const [res, cat] = await Promise.all([adminService.getInstituteSettings(), adminService.getSettingsCatalog()]);
    if (cat.success) setCatalog(cat.data);
    if (res.success) {
      setSaved(res.data);
      setDraft(res.data);
      setRuleDraft({});
      setLoadError(null);
    } else {
      setSaved(null);
      setLoadError(res.error || 'Institute settings could not be loaded.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Changed fields only; an emptied optional field is sent as "" (clears it). */
  const changes = (): Partial<InstituteSettings> => {
    if (!saved) return {};
    const out: Partial<InstituteSettings> = {};
    for (const f of TEXT_FIELDS) {
      const next = (draft[f.key] ?? '').trim();
      if (next === (saved[f.key] ?? '')) continue;
      if (next === '' && f.required) continue;
      out[f.key] = f.key === 'gstNumber' ? next.toUpperCase() : next;
    }
    return out;
  };

  const rules = catalog.filter(
    (s) => RULE_GROUPS.some((g) => g.group === s.group) && s.status !== 'blocked' && (s.type === 'number' || s.type === 'boolean'),
  );
  const canEdit = (s: SettingDefinition) => s.editableBy === 'admin' || isSuperAdmin;
  const ruleValue = (s: SettingDefinition): RuleValue => {
    const v = (saved as Record<string, unknown> | null)?.[s.key];
    return typeof v === 'number' || typeof v === 'boolean' ? v : undefined;
  };
  /** Changed rule settings; an out-of-range number is left for the server to refuse with its message. */
  const ruleChanges = (): Record<string, number | boolean> => {
    const out: Record<string, number | boolean> = {};
    for (const s of rules) {
      if (!(s.key in ruleDraft) || !canEdit(s)) continue;
      const raw = ruleDraft[s.key];
      const current = ruleValue(s) ?? s.defaultValue;
      if (s.type === 'boolean') {
        if (raw !== current) out[s.key] = Boolean(raw);
      } else {
        const text = String(raw).trim();
        if (text === '') continue;
        const n = Number(text);
        if (n !== current) out[s.key] = n;
      }
    }
    return out;
  };

  const pending = { ...changes(), ...ruleChanges() } as Partial<InstituteSettings>;
  const hasChanges = Object.keys(pending).length > 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;
    setIsSaving(true);
    setSaveError(null);
    const res = await adminService.saveInstituteSettings(pending);
    setIsSaving(false);
    if (res.success) {
      setSaved(res.data);
      setDraft(res.data);
      setRuleDraft({});
      showToast({ type: 'success', title: 'Settings saved', message: 'The change was recorded in the activity log.' });
    } else {
      // Keep the edits on screen so they can be corrected; the saved values are unchanged.
      setSaveError(res.error || 'The settings were not saved.');
      showToast({ type: 'error', title: 'Settings not saved', message: res.error || 'Please retry.' });
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium';
  const blocked = catalog.filter((s) => s.status === 'blocked');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institute Settings (ADM-016)</h1>
        <p className="text-xs text-slate-500 mt-1">Official institute details. Each saved change is recorded in the activity log.</p>
      </div>

      {loadError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <Button variant="outline" size="sm" onClick={load}>
            Retry
          </Button>
        </div>
      )}
      {!saved && !loadError && <p className="text-xs text-slate-400">Loading settings…</p>}

      {saved && (
        <form onSubmit={handleSave} className="space-y-6 text-xs text-slate-700" noValidate>
          <Card className="p-6 bg-white border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Building className="h-4 w-4 text-indigo-600" /> Institute profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TEXT_FIELDS.map((f) => (
                <div key={f.key} className={f.wide ? 'sm:col-span-2' : undefined}>
                  <label htmlFor={`set-${f.key}`} className="block font-semibold text-slate-800 mb-1">
                    {f.label}
                    {f.required ? ' *' : ''}
                  </label>
                  <input
                    id={`set-${f.key}`}
                    type={f.type ?? 'text'}
                    maxLength={f.maxLength}
                    value={draft[f.key] ?? ''}
                    placeholder={saved[f.key] ? undefined : 'Not set'}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                    className={inputClass}
                  />
                  {f.hint && <p className="text-[11px] text-slate-500 mt-1">{f.hint}</p>}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Empty an optional field and save to clear it. Public website contact details are edited in Website CMS.
            </p>
          </Card>

          {RULE_GROUPS.map((g) => {
            const items = rules.filter((s) => s.group === g.group);
            if (items.length === 0) return null;
            return (
              <Card key={g.group} className="p-6 bg-white border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-indigo-600" /> {g.title}
                </h3>
                {items.map((s) => {
                  const editable = canEdit(s);
                  const current = ruleValue(s);
                  const shown = s.key in ruleDraft ? ruleDraft[s.key] : current ?? s.defaultValue;
                  return (
                    <div key={s.key} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start">
                      <label htmlFor={`rule-${s.key}`} className="font-semibold text-slate-800">
                        {s.label}
                        {s.status === 'stored' && <span className="ml-2 text-[10px] font-bold uppercase text-amber-700">Saved, not yet applied</span>}
                      </label>
                      <div>
                        {s.type === 'boolean' ? (
                          <input
                            id={`rule-${s.key}`}
                            type="checkbox"
                            checked={Boolean(shown)}
                            disabled={!editable}
                            onChange={(e) => setRuleDraft((d) => ({ ...d, [s.key]: e.target.checked }))}
                            className="h-4 w-4"
                          />
                        ) : (
                          <input
                            id={`rule-${s.key}`}
                            type="number"
                            inputMode="numeric"
                            min={s.min}
                            max={s.max}
                            step={1}
                            value={String(shown ?? '')}
                            disabled={!editable}
                            onChange={(e) => setRuleDraft((d) => ({ ...d, [s.key]: e.target.value }))}
                            className={`${inputClass} max-w-[8rem]`}
                          />
                        )}
                        <p className="text-[11px] text-slate-500 mt-1">
                          {s.type === 'number' && s.min !== undefined && s.max !== undefined ? `Allowed ${s.min}–${s.max}. ` : ''}
                          {current === undefined && s.defaultValue !== undefined ? `Not saved yet; ${String(s.defaultValue)} applies. ` : ''}
                          {!editable ? 'Only the Super Admin can change this.' : ''}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500">{s.note}</p>
                    </div>
                  );
                })}
              </Card>
            );
          })}

          {saveError && <p className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">{saveError}</p>}

          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="md" isLoading={isSaving} disabled={!hasChanges} leftIcon={<Save className="h-4 w-4" />}>
              {hasChanges ? `Save ${Object.keys(pending).length} change(s)` : 'No changes'}
            </Button>
          </div>
        </form>
      )}

      {saved && blocked.length > 0 && (
        <Card className="p-6 bg-white border border-slate-200 space-y-3 text-xs">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-500" /> Not configurable yet
          </h3>
          <p className="text-slate-500">These values are stored but nothing in the application applies them yet, so they cannot be changed here.</p>
          <ul className="divide-y divide-slate-100">
            {blocked.map((s) => (
              <li key={s.key} className="py-2 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                <span className="font-semibold text-slate-800">
                  {s.label}: <span className="font-normal text-slate-600">{s.key === 'timezone' ? 'Asia/Kolkata' : display((saved as Record<string, unknown>)[s.key])}</span>
                </span>
                <span className="text-slate-500 sm:max-w-md">{s.note}</span>
              </li>
            ))}
          </ul>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex gap-2">
            <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
            <p>Maintenance mode and platform configuration are managed by the Super Admin under System Configuration.</p>
          </div>
        </Card>
      )}
    </div>
  );
};
