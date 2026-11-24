import type { AuditLog } from '../types';

/**
 * Maps NXA_AuditLogs records from the admin and super-admin audit endpoints to
 * the AuditLog view model. Shared so both screens render records identically.
 */

/** GET /admin/activity-logs item (backend AuditLogRecord). */
export interface BackendAuditLog {
  id: string;
  timestamp: string;
  actorUserId: string;
  actorName?: string;
  actorRole?: string;
  actionType: string;
  moduleCode: string;
  entityName: string;
  entityId: string;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

/** Renders a stored JSON audit value compactly; non-JSON is shown as-is. */
const describeAuditValue = (raw: string | undefined): string => {
  if (!raw) return '';
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === 'object') {
      return Object.entries(obj)
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
        .join(', ');
    }
  } catch {
    // not JSON
  }
  return raw;
};

export const fromBackendAuditLog = (l: BackendAuditLog): AuditLog => {
  const before = describeAuditValue(l.oldValues);
  const after = describeAuditValue(l.newValues);
  return {
    id: l.id,
    timestamp: l.timestamp,
    actorId: l.actorUserId,
    actorName: l.actorName ?? `User #${l.actorUserId}`,
    actorRole: l.actorRole ?? '',
    action: l.actionType,
    targetEntity: `${l.entityName}: ${l.entityId}`,
    details: before && after ? `${before} → ${after}` : after || before || l.details || '',
    module: l.moduleCode,
    ...(l.ipAddress ? { ipAddress: l.ipAddress } : {}),
    ...(l.userAgent ? { userAgent: l.userAgent } : {}),
  };
};
