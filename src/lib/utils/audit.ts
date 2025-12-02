import { prisma } from '@/lib/prisma';
import { getDeviceInfo } from './device';

export interface AuditLogData {
  action: string;
  entity: string;
  entityId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    const deviceInfo = await getDeviceInfo();
    
    await prisma.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        entityId: data.entityId || null,
        userId: data.userId || null,
        userEmail: data.userEmail || null,
        oldValues: data.oldValues || null,
        newValues: data.newValues || null,
        ipAddress: deviceInfo.ipAddress || null,
        userAgent: deviceInfo.userAgent || null,
      },
    });
  } catch (error) {
    // Don't throw error - audit logging should not break the main flow
    console.error('Failed to create audit log:', error);
  }
}

export function getChanges(oldValues: Record<string, unknown> | null, newValues: Record<string, unknown> | null): {
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
} {
  if (!oldValues && !newValues) {
    return { oldValues: null, newValues: null };
  }

  if (!oldValues) {
    return { oldValues: null, newValues: newValues };
  }

  if (!newValues) {
    return { oldValues, newValues: null };
  }

  // Filter out unchanged values
  const filteredOld: Record<string, unknown> = {};
  const filteredNew: Record<string, unknown> = {};

  const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

  for (const key of allKeys) {
    const oldVal = oldValues[key];
    const newVal = newValues[key];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      if (oldVal !== undefined) filteredOld[key] = oldVal;
      if (newVal !== undefined) filteredNew[key] = newVal;
    }
  }

  return {
    oldValues: Object.keys(filteredOld).length > 0 ? filteredOld : null,
    newValues: Object.keys(filteredNew).length > 0 ? filteredNew : null,
  };
}

