import React, { useCallback, useEffect, useState } from 'react';
import { Info, KeyRound } from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';
import { formatDate } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import type { GlobalRole } from '../../types';

/**
 * Roles (Super Admin). Lists the roles stored in NXA_Roles. Permission
 * mapping and custom role creation are intentionally not offered until the
 * verified permission catalog and role-permission tables are available -
 * the server refuses those changes (RBAC_CATALOG_UNAVAILABLE) rather than
 * pretending to save them.
 */
export const SuperAdminRolesPage: React.FC = () => {
  const [roles, setRoles] = useState<GlobalRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const res = await superAdminService.getGlobalRoles();
    setIsLoading(false);
    if (res.success) {
      setRoles(res.data);
      setError(null);
    } else {
      setRoles([]);
      setError(res.error || 'Roles could not be loaded.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-xs">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <KeyRound className="h-6 w-6 text-indigo-600" /> Roles & Permissions
        </h1>
        <p className="text-slate-500 mt-1">The roles defined in the platform database.</p>
      </div>

      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex gap-2">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Permission management is not available yet. The approved permission catalog and the role-permission tables
          have not been verified, so permissions are not shown or editable and new roles cannot be created. Access is
          currently controlled by role (student, teacher, admin, super admin).
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

      <Card className="overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading roles…</td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {error ? 'Roles are unavailable.' : 'No roles are defined.'}
                  </td>
                </tr>
              ) : (
                roles.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 px-4 font-semibold text-slate-900">{r.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{r.slug}</td>
                    <td className="py-3 px-4 text-slate-600">{r.description || '—'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={r.isSystemRole ? 'info' : 'neutral'} size="sm">
                        {r.isSystemRole ? 'System' : 'Custom'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={r.isActive ? 'success' : 'neutral'} size="sm">
                        {r.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{r.createdAt ? formatDate(r.createdAt) : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
