import React from 'react';
import { Info, KeyRound } from 'lucide-react';
import { Card } from '../../components/common/Card';

/**
 * Roles & permissions (Admin view).
 *
 * The previous page edited a permission matrix kept only in browser storage,
 * which the server never enforced. It is replaced by this notice until the
 * verified permission catalog and role-permission tables exist; role
 * management itself belongs to the Super Admin.
 */
export const AdminRolePermissionPage: React.FC = () => (
  <div className="max-w-3xl mx-auto space-y-6 text-xs">
    <div>
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
        <KeyRound className="h-6 w-6 text-indigo-600" /> Roles & Permissions
      </h1>
      <p className="text-slate-500 mt-1">How access is controlled on the platform today.</p>
    </div>

    <Card className="p-5 space-y-3">
      <div className="flex gap-2 text-slate-700">
        <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p>
            Access is currently controlled by <strong>role</strong>: student, teacher, admin and super admin. Each
            server endpoint checks the signed-in user's role.
          </p>
          <p>
            Fine-grained permissions are not available yet: the approved permission catalog and the role-permission
            tables have not been verified. When they are, the Super Admin will manage role permissions; admins cannot
            change them.
          </p>
        </div>
      </div>
    </Card>
  </div>
);
