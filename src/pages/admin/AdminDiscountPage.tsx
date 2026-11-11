import React, { useState, useEffect } from 'react';
import {
  Percent,
  Plus,
  Tag,
  Copy,
  Trash2,
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
import type { CouponDiscount, Course } from '../../types';

export const AdminDiscountPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [discounts, setDiscounts] = useState<CouponDiscount[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('fixed_amount');
  const [value, setValue] = useState(5000);
  const [validUntil, setValidUntil] = useState('2026-12-31');
  const [applicableCourseId, setApplicableCourseId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    const [dRes, cRes] = await Promise.all([
      adminService.getDiscounts(),
      adminService.getCourses(),
    ]);
    if (dRes.success) setDiscounts(dRes.data);
    if (cRes.success) setCourses(cRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !code.trim()) return;

    setIsSubmitting(true);
    const res = await adminService.createDiscount(
      { id: user.id, name: user.name },
      {
        code: code.trim().toUpperCase(),
        description,
        discountType,
        value,
        validUntil,
        applicableCourseIds: applicableCourseId ? [applicableCourseId] : [],
        isActive: true,
      }
    );
    setIsSubmitting(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Discount Coupon Created',
        message: `Coupon code ${code.toUpperCase()} is now live. (ADM-010)`,
      });
      setIsModalOpen(false);
      loadData();
      setCode('');
      setDescription('');
    }
  };

  const handleToggle = async (id: string) => {
    if (!user) return;
    const res = await adminService.toggleDiscount({ id: user.id, name: user.name }, id);
    if (res.success) {
      showToast({ type: 'info', title: 'Coupon Status Changed', message: res.message || 'Coupon status changed.' });
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    const res = await adminService.deleteDiscount({ id: user.id, name: user.name }, id);
    if (res.success) {
      showToast({ type: 'info', title: 'Coupon Removed', message: 'Discount deleted.' });
      loadData();
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
      key: 'applicableCourseIds',
      header: 'Applicable Programs',
      render: (d) => {
        if (!d.applicableCourseIds || d.applicableCourseIds.length === 0) {
          return <Badge variant="neutral" size="sm">ALL COURSES</Badge>;
        }
        const crs = courses.filter((c) => d.applicableCourseIds.includes(c.id));
        return (
          <span className="text-xs text-slate-600 truncate max-w-[150px] block">
            {crs.map((c) => c.title).join(', ')}
          </span>
        );
      },
    },
    {
      key: 'validUntil',
      header: 'Validity Expiration',
      sortable: true,
      render: (d) => <span className="text-xs text-slate-500">{formatDate(d.validUntil)}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (d) => (
        <Badge variant={d.isActive ? 'success' : 'neutral'} size="sm" dot>
          {d.isActive ? 'ACTIVE' : 'EXPIRED'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (d) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggle(d.id)}
            className="text-xs text-slate-600 hover:bg-slate-100"
          >
            {d.isActive ? 'Pause' : 'Activate'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(d.id)}
            className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50"
            leftIcon={<Trash2 className="h-3 w-3" />}
          >
            Delete
          </Button>
        </div>
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
                <label className="block font-semibold text-slate-800 mb-1">Course Scope</label>
                <select
                  value={applicableCourseId}
                  onChange={(e) => setApplicableCourseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="">All Institute Programs</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Expiry Date *</label>
                <input
                  type="date"
                  required
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
