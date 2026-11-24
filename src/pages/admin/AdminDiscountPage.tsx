import React, { useState, useEffect } from 'react';
import {
  Percent,
  Plus,
  Tag,
  Copy,
  Calendar,
  CheckCircle2,
  BookOpen,
  DollarSign,
  Gift,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate, formatINR } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { Modal } from '../../components/feedback/Modal';
import { Card } from '../../components/common/Card';
import type { CouponDiscount } from '../../types';

export const AdminDiscountPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [discounts, setDiscounts] = useState<CouponDiscount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('fixed_amount');
  const [value, setValue] = useState(5000);
  const [validUntil, setValidUntil] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [perUserLimit, setPerUserLimit] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const dRes = await adminService.getDiscounts();
    setIsLoading(false);
    if (dRes.success) {
      setDiscounts(dRes.data);
      setLoadError(null);
    } else {
      setLoadError(dRes.error || 'Coupons could not be loaded.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !code.trim()) return;

    setIsSubmitting(true);
    const res = await adminService.createDiscount({
      code: code.trim().toUpperCase(),
      description: description.trim(),
      discountType,
      value,
      ...(validUntil ? { validUntil } : {}),
      ...(usageLimit ? { usageLimit: Number(usageLimit) } : {}),
      ...(perUserLimit ? { perUserLimit: Number(perUserLimit) } : {}),
    });
    setIsSubmitting(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Discount Coupon Created',
        message: `Coupon code ${code.toUpperCase()} was created and is active. (ADM-010)`,
      });
      setIsModalOpen(false);
      loadData();
      setCode('');
      setDescription('');
      setUsageLimit('');
      setPerUserLimit('');
    } else {
      showToast({ type: 'error', title: 'Coupon not created', message: res.error || 'Please retry.' });
    }
  };

  const handleToggle = async (d: CouponDiscount) => {
    if (!user) return;
    setBusyId(d.id);
    const res = await adminService.setCouponActive(d.id, !d.isActive);
    setBusyId(null);
    if (res.success) {
      showToast({ type: 'info', title: 'Coupon Status', message: res.message || 'Coupon status changed.' });
      loadData();
    } else {
      showToast({ type: 'error', title: 'Status not changed', message: res.error || 'Please retry.' });
    }
  };

  const copyCode = (codeStr: string) => {
    navigator.clipboard.writeText(codeStr);
    showToast({ type: 'success', title: 'Code Copied', message: `${codeStr} copied to clipboard.` });
  };

  const columns: Column<CouponDiscount>[] = [
    {
      key: 'code',
      header: 'Coupon Code',
      sortable: true,
      render: (d) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
            {d.code}
          </span>
          <button
            onClick={() => copyCode(d.code)}
            className="text-slate-400 hover:text-indigo-600 p-1"
            title="Copy coupon code"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description & Scholarship Scheme',
      render: (d) => <span className="text-xs text-slate-700 font-medium">{d.description}</span>,
    },
    {
      key: 'value',
      header: 'Discount Benefit',
      sortable: true,
      render: (d) => (
        <span className="text-xs font-extrabold text-emerald-600">
          {d.discountType === 'percentage' ? `${d.value}% Off` : `${formatINR(d.value)} Flat Off`}
        </span>
      ),
    },
    {
      key: 'usageCount',
      header: 'Usage / Limits',
      render: (d) => (
        <span className="text-xs text-slate-600">
          {d.usageCount ?? 0} used · {d.usageLimit ? `max ${d.usageLimit}` : 'no limit'} · {d.perUserLimit ? `${d.perUserLimit}/student` : 'no per-student limit'}
        </span>
      ),
    },
    {
      key: 'validUntil',
      header: 'Validity Expiration',
      sortable: true,
      render: (d) => <span className="text-xs text-slate-500">{d.validUntil ? formatDate(d.validUntil) : 'No expiry'}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (d) => (
        <Badge variant={d.isActive ? 'success' : 'neutral'} size="sm" dot>
          {d.isActive ? 'ACTIVE' : 'INACTIVE'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (d) => (
        <Button
          variant="ghost"
          size="sm"
          isLoading={busyId === d.id}
          onClick={() => handleToggle(d)}
          className="text-xs text-slate-600 hover:bg-slate-100"
        >
          {d.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Discounts & Scholarships (ADM-010)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure promotional coupon codes, early-bird incentives, and university merit scholarship grants.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Discount Coupon
        </Button>
      </div>

      {loadError && <Card className="p-4 border border-rose-200 bg-rose-50 text-xs text-rose-800">{loadError}</Card>}
      {isLoading && <p className="text-xs text-slate-400">Loading coupons…</p>}
      {!isLoading && !loadError && discounts.length === 0 && (
        <p className="text-xs text-slate-400 italic">No coupons have been created yet.</p>
      )}

      {/* Main Table */}
      <DataTable
        data={discounts}
        columns={columns}
        searchPlaceholder="Search coupon code, scholarship scheme or description..."
        pageSize={10}
      />

      {/* Create Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create Discount Coupon (ADM-010)"
          size="md"
        >
          <form onSubmit={handleCreateDiscount} className="space-y-4 text-xs text-slate-700">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Coupon Promo Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. DIWALI2026, MERIT100"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Scheme Description *</label>
              <input
                type="text"
                required
                placeholder="e.g. Merit scholarship for B.Tech CS students with >8.5 CGPA"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Discount Type</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="fixed_amount">Fixed Amount (₹ INR)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Discount Value ({discountType === 'percentage' ? '%' : '₹'}) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Total Usage Limit</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="No limit"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Limit per Student</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="No limit"
                  value={perUserLimit}
                  onChange={(e) => setPerUserLimit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500">Coupons apply to all programs: the database has no coupon-to-course mapping.</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save & Activate Coupon
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
