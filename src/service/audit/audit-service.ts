import { prisma } from '@/lib/prisma';
import type { AuditLog, AuditLogQuery } from '@/types/audit';

export class AuditService {
  async getAuditLogs(query: AuditLogQuery): Promise<{
    data: AuditLog[];
    total: number;
  }> {
    const { page, pageSize, action, entity, entityId, userId, startDate, endDate } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }

    if (entity) {
      where.entity = { contains: entity, mode: 'insensitive' };
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs.map(log => this.formatAuditLog(log)),
      total,
    };
  }

  async getAuditLog(id: string): Promise<AuditLog> {
    const log = await prisma.auditLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw new Error('NOT_FOUND');
    }

    return this.formatAuditLog(log);
  }

  private formatAuditLog(log: any): AuditLog {
    return {
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      userId: log.userId,
      userEmail: log.userEmail,
      oldValues: log.oldValues as Record<string, unknown> | null,
      newValues: log.newValues as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt.toISOString(),
    };
  }
}

export const auditService = new AuditService();

