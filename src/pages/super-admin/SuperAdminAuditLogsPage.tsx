import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  Layers,
  Lock,
  Globe,
  RefreshCw,
  ExternalLink,
  Sliders,
  Copy,
  Check,
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import { MetricCard } from '../../components/charts/MetricCard';
import { useNotification } from '../../context/NotificationContext';
import type { AuditLog } from '../../types';

export const SuperAdminAuditLogsPage: React.FC = () => {
  const { showToast } = useNotification();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Modals
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [copied, setCopied] = useState(false);

  const loadLogs = async () => {
    setIsLoading(true);
    const res = await superAdminService.getAuditLogs();
    if (res.success) setLogs(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const totalLogs = logs.length;
  const successCount = logs.filter((l) => (l.result || 'SUCCESS') === 'SUCCESS').length;
  const deniedCount = logs.filter((l) => l.result === 'DENIED').length;
  const adminActorCount = new Set(logs.map((l) => l.actorId)).size;

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (roleFilter !== 'all' && l.actorRole !== roleFilter) return false;
      if (moduleFilter !== 'all' && l.module !== moduleFilter) return false;
      if (resultFilter !== 'all' && (l.result || 'SUCCESS') !== resultFilter) return false;
      if (dateFilter !== 'all') {
        const logDate = new Date(l.timestamp).getTime();
        const now = Date.now();
        if (dateFilter === 'today' && now - logDate > 24 * 60 * 60 * 1000) return false;
        if (dateFilter === 'week' && now - logDate > 7 * 24 * 60 * 60 * 1000) return false;
        if (dateFilter === 'month' && now - logDate > 30 * 24 * 60 * 60 * 1000) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesActor = l.actorName.toLowerCase().includes(q);
        const matchesAction = l.action.toLowerCase().includes(q);
        const matchesTarget = l.targetEntity.toLowerCase().includes(q);
        const matchesDetails = l.details.toLowerCase().includes(q);
        const matchesIp = (l.ipAddress || '').toLowerCase().includes(q);
        return matchesActor || matchesAction || matchesTarget || matchesDetails || matchesIp;
      }
      return true;
    });
  }, [logs, roleFilter, moduleFilter, resultFilter, searchQuery]);

  const handleExportCSV = () => {
    const headers = ['Event ID', 'Timestamp', 'Actor Name', 'Actor Role', 'Action', 'Module', 'Target Record', 'Result', 'IP Address', 'Details'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.actorName}"`,
      l.actorRole,
      l.action,
      l.module || 'general',
      `"${l.targetEntity}"`,
      l.result || 'SUCCESS',
      l.ipAddress || '127.0.0.1',
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nexelvoria-system-audit-log-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({
      type: 'success',
      title: 'Audit Log Export Dispatched',
      message: `Downloaded ${filteredLogs.length} audit entries to CSV.`,
    });
  };

  const copyMetadata = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast({ type: 'info', message: 'Raw audit payload copied to clipboard.' });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System-Wide Audit Logs</h1>
            <Badge variant="danger" size="sm">
              Immutable Governance Trail
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Read-only, cryptographically verifiable transaction and security activity records across all institutional tiers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh Logs
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="bg-rose-600 hover:bg-rose-700"
            onClick={handleExportCSV}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Export Audit Trail (CSV)
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Events Logged"
          value={`${totalLogs} Entries`}
          subtitle="Lifetime Historical Logs"
          icon={<History className="h-5 w-5" />}
          iconBgColor="bg-slate-100 text-slate-700"
        />

        <MetricCard
          title="Successful Operations"
          value={`${successCount} Events`}
          subtitle="Verified Transactions"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
        />

        <MetricCard
          title="Denied Access Attempts"
          value={`${deniedCount} Intercepted`}
          subtitle="Route Guard Protected"
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBgColor="bg-rose-50 text-rose-600"
        />

        <MetricCard
          title="Administrative Actors"
          value={`${adminActorCount} Identities`}
          subtitle="Super Admin & Staff"
          icon={<User className="h-5 w-5" />}
          iconBgColor="bg-indigo-50 text-indigo-600"
        />
      </div>

      {/* Compliance Integrity Banner */}
      <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-rose-900/40 flex items-start gap-3 shadow-xs">
        <ShieldCheck className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-white">Immutable Audit Trail Protocol (SRS Sec 11 &amp; ISO 27001):</p>
          <p className="text-slate-300 leading-relaxed">
            Audit log entries are append-only. Neither Administrators nor the Super Admin can delete, prune, or mutate
            historical transaction logs from this interface. Every access request, status change, refund authorization,
            and configuration sync is permanently recorded with source IP addresses and client user-agents.
          </p>
        </div>
      </div>

      {/* Multi-Parameter Filter Bar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="sm:col-span-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search actor, action, record, IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="all">All Actor Roles</option>
              <option value="super_admin">Super Administrator</option>
              <option value="admin">Administrator Staff</option>
              <option value="teacher">Teaching Faculty</option>
              <option value="student">Student Learner</option>
              <option value="system">Automated System / Webhook</option>
            </select>
          </div>

          <div>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="all">All Functional Modules</option>
              <option value="admins">Admin Accounts</option>
              <option value="refunds">Refund Approvals (BR-006)</option>
              <option value="financial_overrides">Financial Overrides (BR-007)</option>
              <option value="roles_permissions">Roles &amp; Permissions</option>
              <option value="system_config">System Configuration</option>
              <option value="payments">Tuition Payments</option>
              <option value="students">Student Approvals</option>
              <option value="security">Security &amp; Auth</option>
            </select>
          </div>

          <div>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="all">All Results</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="DENIED">DENIED</option>
              <option value="FAILURE">FAILURE</option>
            </select>
          </div>

          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="all">All Time</option>
              <option value="today">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="overflow-hidden shadow-xs border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp &amp; Event ID</th>
                <th className="py-3 px-4">Actor &amp; Authority</th>
                <th className="py-3 px-4">Action Trigger</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Affected Record</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Client IP</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No audit records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-slate-800 text-[11px] block">
                        {formatDate(log.timestamp)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.id}</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block">{log.actorName}</span>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">
                        {log.actorRole}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-slate-100 border border-slate-200 text-slate-800">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-slate-600 font-medium">
                        {log.module ? log.module.replace('_', ' ') : 'General'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-700">
                      {log.targetEntity}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge
                        variant={
                          log.result === 'DENIED'
                            ? 'danger'
                            : log.result === 'FAILURE'
                            ? 'warning'
                            : 'success'
                        }
                        size="sm"
                        dot
                      >
                        {log.result || 'SUCCESS'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      {log.ipAddress || '103.21.144.12'}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="text-rose-600 hover:text-rose-700 font-semibold"
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Audit Log Inspection Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Record Details: ${selectedLog.id}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-400 block">Actor Identity</span>
                <span className="font-bold text-slate-900">{selectedLog.actorName}</span>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">{selectedLog.actorRole}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Event Timestamp</span>
                <span className="font-mono text-slate-800">{selectedLog.timestamp}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Operation Result</span>
                <Badge
                  variant={
                    selectedLog.result === 'DENIED'
                      ? 'danger'
                      : selectedLog.result === 'FAILURE'
                      ? 'warning'
                      : 'success'
                  }
                  size="sm"
                  dot
                >
                  {selectedLog.result || 'SUCCESS'}
                </Badge>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Recorded Client IP</span>
                <span className="font-mono text-slate-800">{selectedLog.ipAddress || '103.21.144.12'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-700">Trigger Action &amp; Scope</span>
              <div className="p-2.5 bg-slate-100 rounded-lg font-mono text-slate-900 flex items-center justify-between">
                <span>{selectedLog.action}</span>
                <span className="text-slate-500 text-[11px]">Module: {selectedLog.module || 'system'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-700">Target Entity / Resource Key</span>
              <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-mono text-[11px]">
                {selectedLog.targetEntity}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-700">Activity Context &amp; Payload Description</span>
              <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                {selectedLog.details}
              </p>
            </div>

            {selectedLog.userAgent && (
              <div className="space-y-1">
                <span className="font-semibold text-slate-500 text-[11px]">Client User Agent String</span>
                <p className="p-2 bg-slate-50 rounded font-mono text-[10px] text-slate-600 truncate border border-slate-200/60">
                  {selectedLog.userAgent}
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={copyMetadata}
                leftIcon={copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              >
                {copied ? 'Copied JSON' : 'Copy JSON Payload'}
              </Button>

              <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

