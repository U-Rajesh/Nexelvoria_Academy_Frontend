import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Building,
  Save,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  DollarSign,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { adminService, type InstituteSettings } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';

export const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [settings, setSettings] = useState<InstituteSettings>({
    instituteName: 'Nexelvoria Academy',
    tagline: 'Bridging Talent with Industry Excellence',
    supportEmail: 'admissions@nexelvoria.edu.in',
    supportPhone: '+91 98765 43210',
    whatsappNumber: '+91 98765 43210',
    address: 'Nexelvoria Tech Tower, Cyber City, Hyderabad, Telangana 500081',
    academicSession: '2026-27 Cohort',
    minAttendancePercentage: 75,
    minExamPassPercentage: 60,
    defaultMaxBatchCapacity: 40,
    paymentGatewayMode: 'test',
    currency: 'INR (₹)',
    receiptPrefix: 'REC-NEX',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    adminService.getInstituteSettings().then((res) => {
      if (res.success) setSettings(res.data);
    });
  }, []);

  const handleChange = (field: keyof InstituteSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    const res = await adminService.saveInstituteSettings({ id: user.id, name: user.name }, settings);
    setIsSaving(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Institute Settings Saved',
        message: 'Academic gates and institutional configuration updated. (ADM-016)',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institute Operational Settings (ADM-016)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Global institutional configuration, academic qualification gates, financial prefixes, and official contacts.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleSave}
          isLoading={isSaving}
          leftIcon={<Save className="h-4 w-4" />}
        >
          Save Configuration
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs text-slate-700">
        {/* Section 1: Institute Branding & Profile */}
        <Card className="p-6 bg-white border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Building className="h-4 w-4 text-indigo-600" /> Institutional Profile & Branding
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Academy Name *</label>
              <input
                type="text"
                required
                value={settings.instituteName}
                onChange={(e) => handleChange('instituteName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Motto / Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Official Admissions Email *</label>
              <input
                type="email"
                required
                value={settings.supportEmail}
                onChange={(e) => handleChange('supportEmail', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Admissions Helpdesk Phone *</label>
              <input
                type="tel"
                required
                value={settings.supportPhone}
                onChange={(e) => handleChange('supportPhone', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Official WhatsApp Desk Phone</label>
              <input
                type="tel"
                value={settings.whatsappNumber}
                onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Campus Physical Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Academic Governance & Gates */}
        <Card className="p-6 bg-white border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Award className="h-4 w-4 text-indigo-600" /> Academic Governance & Certification Gates (BR-011)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Current Academic Session</label>
              <input
                type="text"
                value={settings.academicSession}
                onChange={(e) => handleChange('academicSession', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Default Batch Seat Capacity Limit</label>
              <input
                type="number"
                min={10}
                max={200}
                value={settings.defaultMaxBatchCapacity}
                onChange={(e) => handleChange('defaultMaxBatchCapacity', Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Minimum Attendance Gate (% for Certification per BR-011) *
              </label>
              <input
                type="number"
                min={50}
                max={100}
                value={settings.minAttendancePercentage}
                onChange={(e) => handleChange('minAttendancePercentage', Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Standard institute threshold is 75% lecture participation.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Minimum Exam Score Gate (% for Certification per BR-011) *
              </label>
              <input
                type="number"
                min={40}
                max={100}
                value={settings.minExamPassPercentage}
                onChange={(e) => handleChange('minExamPassPercentage', Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Standard institute passing threshold is 60% exam score.
              </span>
            </div>
          </div>
        </Card>

        {/* Section 3: Financial & Gateway Setup */}
        <Card className="p-6 bg-white border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-indigo-600" /> Financial Reconciliation & Gateway
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Payment Gateway Mode</label>
              <select
                value={settings.paymentGatewayMode}
                onChange={(e) => handleChange('paymentGatewayMode', e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="test">Test / Sandbox Simulation</option>
                <option value="live">Live Production (Razorpay)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Operational Currency</label>
              <input
                type="text"
                disabled
                value={settings.currency}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Receipt Number Prefix</label>
              <input
                type="text"
                value={settings.receiptPrefix}
                onChange={(e) => handleChange('receiptPrefix', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
              />
            </div>
          </div>
        </Card>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
};

