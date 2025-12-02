import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/utils/audit';
import type {
  RevokeSessionInput,
  Session,
  Device,
  LoginHistory,
} from '@/types/session';
import { ErrorCodes } from '@/types/api';

export class SessionService {
  async getSessions(userId: string, page: number = 1, pageSize: number = 20): Promise<{
    data: Session[];
    total: number;
  }> {
    const skip = (page - 1) * pageSize;

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where: { userId },
        skip,
        take: pageSize,
        orderBy: { lastActivityAt: 'desc' },
        include: {
          device: true,
        },
      }),
      prisma.session.count({ where: { userId } }),
    ]);

    return {
      data: sessions.map(s => this.formatSession(s)),
      total,
    };
  }

  async getSession(id: string, userId: string): Promise<Session> {
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        device: true,
      },
    });

    if (!session) {
      throw new Error(ErrorCodes.NOT_FOUND);
    }

    if (session.userId !== userId) {
      throw new Error(ErrorCodes.FORBIDDEN);
    }

    return this.formatSession(session);
  }

  async revokeSession(input: RevokeSessionInput, userId: string): Promise<void> {
    const session = await prisma.session.findUnique({
      where: { id: input.sessionId },
    });

    if (!session) {
      throw new Error(ErrorCodes.NOT_FOUND);
    }

    if (session.userId !== userId) {
      throw new Error(ErrorCodes.FORBIDDEN);
    }

    await prisma.session.update({
      where: { id: input.sessionId },
      data: {
        isActive: false,
        isRevoked: true,
        revokedAt: new Date(),
        revokedBy: userId,
        revokedReason: input.reason || 'user_revoked',
      },
    });

    // Revoke all refresh tokens for this session
    await prisma.refreshToken.updateMany({
      where: {
        sessionId: input.sessionId,
        isActive: true,
      },
      data: {
        isActive: false,
        isRevoked: true,
        revokedAt: new Date(),
        revokedBy: userId,
        revokedReason: 'session_revoked',
      },
    });

    await createAuditLog({
      action: 'session.revoked',
      entity: 'Session',
      entityId: input.sessionId,
      userId,
    });
  }

  async revokeAllSessions(userId: string, reason?: string): Promise<void> {
    await prisma.session.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
        isRevoked: true,
        revokedAt: new Date(),
        revokedBy: userId,
        revokedReason: reason || 'user_revoked_all',
      },
    });

    await prisma.refreshToken.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
        isRevoked: true,
        revokedAt: new Date(),
        revokedBy: userId,
        revokedReason: 'all_sessions_revoked',
      },
    });

    await createAuditLog({
      action: 'sessions.revoked_all',
      entity: 'User',
      entityId: userId,
      userId,
    });
  }

  async getDevices(userId: string, page: number = 1, pageSize: number = 20): Promise<{
    data: Device[];
    total: number;
  }> {
    const skip = (page - 1) * pageSize;

    const [devices, total] = await Promise.all([
      prisma.device.findMany({
        where: { userId },
        skip,
        take: pageSize,
        orderBy: { lastSeenAt: 'desc' },
      }),
      prisma.device.count({ where: { userId } }),
    ]);

    return {
      data: devices.map(d => this.formatDevice(d)),
      total,
    };
  }

  async getDevice(id: string, userId: string): Promise<Device> {
    const device = await prisma.device.findUnique({
      where: { id },
    });

    if (!device) {
      throw new Error(ErrorCodes.NOT_FOUND);
    }

    if (device.userId !== userId) {
      throw new Error(ErrorCodes.FORBIDDEN);
    }

    return this.formatDevice(device);
  }

  async trustDevice(deviceId: string, userId: string): Promise<Device> {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new Error(ErrorCodes.NOT_FOUND);
    }

    if (device.userId !== userId) {
      throw new Error(ErrorCodes.FORBIDDEN);
    }

    const updated = await prisma.device.update({
      where: { id: deviceId },
      data: { isTrusted: true },
    });

    await createAuditLog({
      action: 'device.trusted',
      entity: 'Device',
      entityId: deviceId,
      userId,
    });

    return this.formatDevice(updated);
  }

  async getLoginHistory(
    userId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    data: LoginHistory[];
    total: number;
  }> {
    const skip = (page - 1) * pageSize;

    const [history, total] = await Promise.all([
      prisma.loginHistory.findMany({
        where: { userId },
        skip,
        take: pageSize,
        orderBy: { attemptedAt: 'desc' },
      }),
      prisma.loginHistory.count({ where: { userId } }),
    ]);

    return {
      data: history.map(h => this.formatLoginHistory(h)),
      total,
    };
  }

  private formatSession(session: any): Session {
    return {
      id: session.id,
      userId: session.userId,
      sessionToken: session.sessionToken,
      fingerprint: session.fingerprint,
      deviceId: session.deviceId,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      deviceType: session.deviceType,
      deviceName: session.deviceName,
      browser: session.browser,
      os: session.os,
      location: session.location,
      isActive: session.isActive,
      isRevoked: session.isRevoked,
      revokedAt: session.revokedAt?.toISOString() || null,
      revokedBy: session.revokedBy,
      revokedReason: session.revokedReason,
      lastActivityAt: session.lastActivityAt.toISOString(),
      lastActivityIp: session.lastActivityIp,
      activityCount: session.activityCount,
      expiresAt: session.expiresAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      device: session.device ? {
        id: session.device.id,
        deviceName: session.device.deviceName,
        deviceType: session.device.deviceType,
        isTrusted: session.device.isTrusted,
        isBlocked: session.device.isBlocked,
      } : undefined,
    };
  }

  private formatDevice(device: any): Device {
    return {
      id: device.id,
      userId: device.userId,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      browser: device.browser,
      os: device.os,
      osVersion: device.osVersion,
      platform: device.platform,
      ipAddress: device.ipAddress,
      location: device.location,
      country: device.country,
      city: device.city,
      isTrusted: device.isTrusted,
      isBlocked: device.isBlocked,
      blockedAt: device.blockedAt?.toISOString() || null,
      blockedBy: device.blockedBy,
      blockedReason: device.blockedReason,
      firstSeenAt: device.firstSeenAt.toISOString(),
      lastSeenAt: device.lastSeenAt.toISOString(),
      loginCount: device.loginCount,
      createdAt: device.createdAt.toISOString(),
      updatedAt: device.updatedAt.toISOString(),
    };
  }

  private formatLoginHistory(history: any): LoginHistory {
    return {
      id: history.id,
      userId: history.userId,
      email: history.email,
      success: history.success,
      failureReason: history.failureReason,
      deviceId: history.deviceId,
      ipAddress: history.ipAddress,
      userAgent: history.userAgent,
      location: history.location,
      country: history.country,
      isSuspicious: history.isSuspicious,
      riskScore: history.riskScore,
      sessionId: history.sessionId,
      refreshTokenId: history.refreshTokenId,
      attemptedAt: history.attemptedAt.toISOString(),
    };
  }
}

export const sessionService = new SessionService();

