import React, { useState, useEffect } from 'react';
import {
  Sliders,
  AlertTriangle,
  ShieldCheck,
  Save,
  Server,
  Database,
  Globe,
  Building,
  Palette,
  CreditCard,
  Mail,
  Bell,
  Lock,
  Power,
  RotateCcw,
  Eye,
  EyeOff,
  Send,
  CheckCircle2,
  Calendar,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import type { SystemConfig } from '../../types';

export const SuperAdminSystemConfigPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [activeTab, setActiveTab] = useState<
    'institute' | 'branding' | 'academic' | 'payment' | 'email_sms' | 'notifications' | 'security' | 'maintenance' | 'preferences'
  >('institute');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  // Masking toggles for sensitive credentials
  const [showPaymentSecret, setShowPaymentSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [showSmsSecret, setShowSmsSecret] = useState(false);

  const loadConfig = async () => {
    setIsLoading(true);
    const res = await superAdminService.getSystemConfig();
    if (res.success) setConfig(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSaveConfig = async () => {
    if (!user || !config) return;
    setIsSaving(true);
    const res = await superAdminService.updateSystemConfig({ id: user.id, name: user.name }, config);
    setIsSaving(false);

    if (res.success && res.data) {
      setConfig(res.data);
      showToast({
        type: 'success',
        title: 'System Configuration Synced',
        message: 'Platform parameters, security policies, and gateway settings saved to immutable state.',
      });
    } else {
      showToast({ type: 'error', title: 'Save Failed', message: res.error || 'Failed to update configuration.' });
    }
  };

  const handleTestEmail = async () => {
    if (!user || !config) return;
    setIsTestingEmail(true);
    const res = await superAdminService.testEmailConfiguration(
      { id: user.id, name: user.name },
      config.emailSms.senderEmail || 'test@nexelvoria.edu.in'
    );
    setIsTestingEmail(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'SMTP Handshake Verified',
        message: res.message || 'Test email dispatched successfully.',
      });
    }
  };

  if (isLoading || !config) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Loading system configuration parameters...
      </div>
    );
  }

  const tabs = [
    { id: 'institute', label: 'Institute Details', icon: <Building className="h-4 w-4" /> },
    { id: 'branding', label: 'Branding & Logo', icon: <Palette className="h-4 w-4" /> },
    { id: 'academic', label: 'Academic & Batches', icon: <Calendar className="h-4 w-4" /> },
    { id: 'payment', label: 'Payment Gateway', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'email_sms', label: 'Email & SMS Dispatch', icon: <Mail className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notification Switches', icon: <Bell className="h-4 w-4" /> },
    { id: 'security', label: 'Security & Auth Policy', icon: <Lock className="h-4 w-4" /> },
    { id: 'maintenance', label: 'Maintenance Mode', icon: <Power className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Configuration</h1>
            <Badge variant="danger" size="sm">
              Root Authority Only
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure institutional parameters, payment gateway credentials, authentication security policies, and maintenance mode.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadConfig}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="bg-rose-600 hover:bg-rose-700"
            isLoading={isSaving}
            onClick={handleSaveConfig}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Configuration
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex space-x-2 min-w-max pb-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab 1: Institute Details */}
      {activeTab === 'institute' && (
        <Card className="p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Institute Official Profile</h3>
            <p className="text-xs text-slate-500">Legal name, accreditation identifiers, and institutional contact channels</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Institute Legal Name</label>
              <input
                type="text"
                value={config.institute.name}
                onChange={(e) =>
                  setConfig({ ...config, institute: { ...config.institute, name: e.target.value } })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Institutional Code</label>
              <input
                type="text"
                value={config.institute.code}
                onChange={(e) =>
                  setConfig({ ...config, institute: { ...config.institute, code: e.target.value } })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Accreditation / Affiliation String</label>
              <input
                type="text"
                value={config.institute.affiliation}
                onChange={(e) =>
                  setConfig({ ...config, institute: { ...config.institute, affiliation: e.target.value } })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Official Support Email</label>
              <input
                type="email"
                value={config.institute.supportEmail}
                onChange={(e) =>
                  setConfig({ ...config, institute: { ...config.institute, supportEmail: e.target.value } })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Helpline Phone Number</label>
              <input
                type="tel"
                value={config.institute.supportPhone}
                onChange={(e) =>
                  setConfig({ ...config, institute: { ...config.institute, supportPhone: e.target.value } })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">WhatsApp Student Helpline</label>
              <input
                type="tel"
                value={config.institute.whatsappNumber}
                onChange={(e) =>
                  setConfig({ ...config, institute: { ...config.institute, whatsappNumber: e.target.value } })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">GSTIN / Tax Identification</label>
              <input
                type="text"
                value={config.institute.gstNumber}
                onChange={(e) =>
                  setConfig({ ...config, institute: { ...config.institute, gstNumber: e.target.value } })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Registered Campus Address</label>
              <textarea
                rows={2}
                value={config.institute.address}
                onChange={(e) =>
                  setConfig({ ...config, institute: { ...config.institute, address: e.target.value } })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Tab 2: Branding & Logo */}
      {activeTab === 'branding' && (
        <Card className="p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Institute Visual Identity &amp; Branding</h3>
            <p className="text-xs text-slate-500">Logo assets, brand palette, and institutional marketing taglines</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Primary Brand Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.branding.primaryColor}
                    onChange={(e) =>
                      setConfig({ ...config, branding: { ...config.branding, primaryColor: e.target.value } })
                    }
                    className="h-10 w-16 p-1 border border-slate-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.branding.primaryColor}
                    onChange={(e) =>
                      setConfig({ ...config, branding: { ...config.branding, primaryColor: e.target.value } })
                    }
                    className="w-32 px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Secondary Brand Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.branding.secondaryColor}
                    onChange={(e) =>
                      setConfig({ ...config, branding: { ...config.branding, secondaryColor: e.target.value } })
                    }
                    className="h-10 w-16 p-1 border border-slate-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.branding.secondaryColor}
                    onChange={(e) =>
                      setConfig({ ...config, branding: { ...config.branding, secondaryColor: e.target.value } })
                    }
                    className="w-32 px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Institute Tagline</label>
                <input
                  type="text"
                  value={config.branding.tagline}
                  onChange={(e) =>
                    setConfig({ ...config, branding: { ...config.branding, tagline: e.target.value } })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Institutional Motto</label>
                <input
                  type="text"
                  value={config.branding.motto}
                  onChange={(e) =>
                    setConfig({ ...config, branding: { ...config.branding, motto: e.target.value } })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* Logo Preview Card */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="font-semibold text-slate-700 block">Logo URL &amp; Live Render Preview</span>
              <input
                type="text"
                value={config.branding.logoUrl}
                onChange={(e) =>
                  setConfig({ ...config, branding: { ...config.branding, logoUrl: e.target.value } })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-[11px]"
              />

              <div className="p-4 bg-white rounded-lg border border-slate-200 flex items-center justify-center min-h-[120px]">
                <img
                  src={config.branding.logoUrl}
                  alt="Institute Logo Preview"
                  className="max-h-16 object-contain rounded"
                  onError={(e) => {
                    (e.target as any).src = 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=180&q=80';
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-500 text-center">
                Recommended dimension: 320x80px SVG or high-res transparent PNG
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 3: Academic & Batch Defaults */}
      {activeTab === 'academic' && (
        <Card className="p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Academic Year &amp; Batch Policies</h3>
            <p className="text-xs text-slate-500">Configure default enrollment capacity, term cycles, and passing thresholds</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Active Academic Year</label>
              <input
                type="text"
                value={config.academic.currentAcademicYear}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    academic: { ...config.academic, currentAcademicYear: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Active Cohort / Term</label>
              <input
                type="text"
                value={config.academic.activeTerm}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    academic: { ...config.academic, activeTerm: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Default Batch Capacity Limit (SRS Sec 13 Item 4)
              </label>
              <input
                type="number"
                min={10}
                max={150}
                value={config.academic.maxBatchCapacity}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    academic: { ...config.academic, maxBatchCapacity: parseInt(e.target.value) || 40 },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">Standard maximum learners per batch</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Minimum Attendance Threshold % (SRS Rule BR-004)
              </label>
              <input
                type="number"
                min={50}
                max={100}
                value={config.academic.minAttendancePercentage}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    academic: {
                      ...config.academic,
                      minAttendancePercentage: parseInt(e.target.value) || 75,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
              />
              <span className="text-[11px] text-rose-600 mt-0.5 block">Mandatory 75% for certificate eligibility</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Assignment Grace Period (Days)
              </label>
              <input
                type="number"
                min={0}
                max={7}
                value={config.academic.assignmentGracePeriodDays}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    academic: {
                      ...config.academic,
                      assignmentGracePeriodDays: parseInt(e.target.value) || 2,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Minimum Exam Pass Criteria %
              </label>
              <input
                type="number"
                min={40}
                max={100}
                value={config.academic.passPercentage}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    academic: { ...config.academic, passPercentage: parseInt(e.target.value) || 60 },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2 pt-3 border-t border-slate-100 flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.academic.isRegistrationOpen}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      academic: { ...config.academic, isRegistrationOpen: e.target.checked },
                    })
                  }
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="font-semibold text-slate-800">
                  Allow Public Online Candidate Registrations
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.academic.isCatalogPublic}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      academic: { ...config.academic, isCatalogPublic: e.target.checked },
                    })
                  }
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="font-semibold text-slate-800">
                  Publish Course Catalog to Website Visitors
                </span>
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 4: Payment Gateway Settings */}
      {activeTab === 'payment' && (
        <Card className="p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Payment Gateway Integration</h3>
              <p className="text-xs text-slate-500">API keys, webhook secrets, and reconciliation settings for student fees</p>
            </div>
            <Badge variant={config.paymentGateway.isLiveMode ? 'success' : 'warning'} size="sm">
              {config.paymentGateway.isLiveMode ? 'Production Live Mode' : 'Sandbox Test Mode'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Primary Payment Provider</label>
              <select
                value={config.paymentGateway.provider}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    paymentGateway: { ...config.paymentGateway, provider: e.target.value as any },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option value="razorpay">Razorpay (Recommended - UPI/Cards/Netbanking)</option>
                <option value="stripe">Stripe Payments India</option>
                <option value="cashfree">Cashfree Payments</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">API Key ID</label>
              <input
                type="text"
                value={config.paymentGateway.keyId}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    paymentGateway: { ...config.paymentGateway, keyId: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">API Key Secret (Masked)</label>
              <div className="relative">
                <input
                  type={showPaymentSecret ? 'text' : 'password'}
                  value={config.paymentGateway.keySecretMasked}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      paymentGateway: { ...config.paymentGateway, keySecretMasked: e.target.value },
                    })
                  }
                  className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPaymentSecret(!showPaymentSecret)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPaymentSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Webhook Signature Secret (Masked)</label>
              <div className="relative">
                <input
                  type={showWebhookSecret ? 'text' : 'password'}
                  value={config.paymentGateway.webhookSecretMasked}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      paymentGateway: { ...config.paymentGateway, webhookSecretMasked: e.target.value },
                    })
                  }
                  className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="sm:col-span-2 pt-3 border-t border-slate-100 flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.paymentGateway.isLiveMode}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      paymentGateway: { ...config.paymentGateway, isLiveMode: e.target.checked },
                    })
                  }
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="font-semibold text-slate-800">
                  Switch to Live Production Transactions
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.paymentGateway.autoReconcile}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      paymentGateway: { ...config.paymentGateway, autoReconcile: e.target.checked },
                    })
                  }
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="font-semibold text-slate-800">
                  Auto-Reconcile Payment Webhooks with Student Ledgers
                </span>
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 5: Email & SMS Dispatch */}
      {activeTab === 'email_sms' && (
        <Card className="p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Email (SMTP) &amp; SMS Dispatch Architecture</h3>
              <p className="text-xs text-slate-500">Configure transactional outbound notifications</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              isLoading={isTestingEmail}
              onClick={handleTestEmail}
              leftIcon={<Send className="h-4 w-4 text-rose-600" />}
            >
              Send Test Email
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">SMTP Host Server</label>
              <input
                type="text"
                value={config.emailSms.smtpHost}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    emailSms: { ...config.emailSms, smtpHost: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">SMTP Port</label>
              <input
                type="number"
                value={config.emailSms.smtpPort}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    emailSms: { ...config.emailSms, smtpPort: parseInt(e.target.value) || 587 },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">SMTP Username</label>
              <input
                type="text"
                value={config.emailSms.smtpUser}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    emailSms: { ...config.emailSms, smtpUser: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">SMTP Password (Masked)</label>
              <div className="relative">
                <input
                  type={showSmtpPassword ? 'text' : 'password'}
                  value={config.emailSms.smtpPasswordMasked}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      emailSms: { ...config.emailSms, smtpPasswordMasked: e.target.value },
                    })
                  }
                  className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Sender Display Name</label>
              <input
                type="text"
                value={config.emailSms.senderName}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    emailSms: { ...config.emailSms, senderName: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Outbound From Email</label>
              <input
                type="email"
                value={config.emailSms.senderEmail}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    emailSms: { ...config.emailSms, senderEmail: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            {/* SRS BR-014 Enforced SMS Notice */}
            <div className="sm:col-span-2 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="font-bold text-amber-900">
                  SRS Rule BR-014 Compliance (SMS Disabled at Launch)
                </span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                As per specification Rule BR-014, transactional SMS service is deliberately maintained in disabled state
                at initial launch. All verification OTPs, payment receipts, and enrollment alerts are routed through
                <strong> Email and In-App notifications</strong>.
              </p>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={config.emailSms.isSmsEnabled}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      emailSms: { ...config.emailSms, isSmsEnabled: e.target.checked },
                    })
                  }
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-semibold text-amber-950">
                  Override BR-014 and Enable SMS Gateway Dispatch
                </span>
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 6: Notification Switches */}
      {activeTab === 'notifications' && (
        <Card className="p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">System Notification Triggers</h3>
            <p className="text-xs text-slate-500">Enable or silence automated notifications for academic events</p>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80 cursor-pointer">
              <input
                type="checkbox"
                checked={config.notifications.emailOnAdmission}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    notifications: { ...config.notifications, emailOnAdmission: e.target.checked },
                  })
                }
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Admission &amp; Approval Notification</span>
                <span className="text-slate-500">
                  Automatically dispatch credentials and welcome packet when an admin approves student registration.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80 cursor-pointer">
              <input
                type="checkbox"
                checked={config.notifications.emailOnPayment}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    notifications: { ...config.notifications, emailOnPayment: e.target.checked },
                  })
                }
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Tuition Payment &amp; Receipt Email</span>
                <span className="text-slate-500">
                  Send official PDF payment receipt and course unlock notice upon verified fee transactions.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80 cursor-pointer">
              <input
                type="checkbox"
                checked={config.notifications.emailOnExamResult}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    notifications: { ...config.notifications, emailOnExamResult: e.target.checked },
                  })
                }
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Online Assessment Score Release</span>
                <span className="text-slate-500">
                  Notify students when test results or assignment marks are published by instructors.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80 cursor-pointer">
              <input
                type="checkbox"
                checked={config.notifications.pushAnnouncements}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    notifications: { ...config.notifications, pushAnnouncements: e.target.checked },
                  })
                }
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Institute Announcements In-App Broadcast</span>
                <span className="text-slate-500">
                  Surface critical campus announcements and placement drive updates in student header badges.
                </span>
              </div>
            </label>
          </div>
        </Card>
      )}

      {/* Tab 7: Security & Auth Policy */}
      {activeTab === 'security' && (
        <Card className="p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Security Architecture &amp; Authentication Policies</h3>
            <p className="text-xs text-slate-500">Enforce password expiration, failed login lockouts, and multi-factor authorization</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Session Inactivity Timeout (Minutes)</label>
              <input
                type="number"
                min={15}
                max={480}
                value={config.security.sessionTimeoutMinutes}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    security: {
                      ...config.security,
                      sessionTimeoutMinutes: parseInt(e.target.value) || 60,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">Standard: 60 minutes</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Max Failed Login Attempts Before Lock</label>
              <input
                type="number"
                min={3}
                max={10}
                value={config.security.maxFailedLogins}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    security: {
                      ...config.security,
                      maxFailedLogins: parseInt(e.target.value) || 5,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">Standard: 5 attempts</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Password Expiry Cycle (Days)</label>
              <input
                type="number"
                min={30}
                max={365}
                value={config.security.passwordExpiryDays}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    security: {
                      ...config.security,
                      passwordExpiryDays: parseInt(e.target.value) || 90,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">Staff &amp; Admin accounts policy</span>
            </div>

            <div className="sm:col-span-2 pt-3 border-t border-slate-100 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.security.enforceTwoFactor}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      security: { ...config.security, enforceTwoFactor: e.target.checked },
                    })
                  }
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="font-semibold text-slate-800">
                  Enforce Two-Factor Authentication (2FA) for All Administrators &amp; Super Admin
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.security.requireSpecialChars}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      security: { ...config.security, requireSpecialChars: e.target.checked },
                    })
                  }
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="font-semibold text-slate-800">
                  Require Complex Passwords (Uppercase, Lowercase, Number, and Special Character)
                </span>
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 8: Maintenance Mode */}
      {activeTab === 'maintenance' && (
        <Card className="p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Platform Maintenance Mode</h3>
              <p className="text-xs text-slate-500">Temporarily restrict public and student access during infrastructure maintenance</p>
            </div>
            <Badge variant={config.maintenance.isMaintenanceMode ? 'danger' : 'success'} size="sm">
              {config.maintenance.isMaintenanceMode ? 'Maintenance Mode Active' : 'Normal Operations'}
            </Badge>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.maintenance.isMaintenanceMode}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      maintenance: { ...config.maintenance, isMaintenanceMode: e.target.checked },
                    })
                  }
                  className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <span className="font-bold text-slate-900 text-sm block">Activate Maintenance Mode</span>
                  <span className="text-slate-500">
                    When active, public visitors and student learners will see the maintenance landing banner.
                    Super Admin and whitelisted IPs retain access.
                  </span>
                </div>
              </label>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Public Maintenance Notice Message
              </label>
              <textarea
                rows={3}
                value={config.maintenance.message}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maintenance: { ...config.maintenance, message: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Bypass IP Whitelist (Comma-separated)
              </label>
              <input
                type="text"
                value={config.maintenance.allowedIps}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maintenance: { ...config.maintenance, allowedIps: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                IP addresses that bypass the maintenance screen (e.g. 192.168.1.1, 103.21.144.12)
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
