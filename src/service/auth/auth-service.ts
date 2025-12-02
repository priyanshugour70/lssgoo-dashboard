import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  generateTokenFamilyId,
} from '@/lib/utils/jwt';
import { getDeviceInfo, generateDeviceId } from '@/lib/utils/device';
import { createAuditLog } from '@/lib/utils/audit';
import { getUserPermissions, getUserRoles } from '@/lib/middleware/rbac';
import type {
  LoginInput,
  RegisterInput,
  RefreshTokenInput,
  ChangePasswordInput,
  ResetPasswordRequestInput,
  ResetPasswordInput,
  AuthUser,
  LoginResponse,
  AuthTokens,
} from '@/types/auth';
import { ErrorCodes } from '@/types/api';
import crypto from 'crypto';

const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const ACCESS_TOKEN_EXPIRY_MINUTES = 15;

export class AuthService {
  async register(input: RegisterInput): Promise<LoginResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error(ErrorCodes.ALREADY_EXISTS);
    }

    // Hash password
    const hashedPassword = await hashPassword(input.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name || null,
      },
    });

    // Create profile
    await prisma.profile.create({
      data: {
        userId: user.id,
      },
    });

    // Create audit log
    await createAuditLog({
      action: 'user.created',
      entity: 'User',
      entityId: user.id,
      newValues: { email: user.email, name: user.name },
    });

    // Login the user
    return this.login({
      email: input.email,
      password: input.password,
    });
  }

  async login(input: LoginInput, request?: Request): Promise<LoginResponse> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: {
        profile: true,
      },
    });

    if (!user) {
      await this.recordFailedLogin(input.email, 'user_not_found', request);
      throw new Error(ErrorCodes.INVALID_CREDENTIALS);
    }

    // Check if user is active
    if (!user.isActive) {
      await this.recordFailedLogin(input.email, 'user_inactive', request);
      throw new Error(ErrorCodes.FORBIDDEN);
    }

    // Check if user is blocked
    if (user.isBlocked) {
      await this.recordFailedLogin(input.email, 'user_blocked', request);
      throw new Error(ErrorCodes.FORBIDDEN);
    }

    // Verify password
    const isValidPassword = await verifyPassword(input.password, user.password);
    if (!isValidPassword) {
      await this.recordFailedLogin(input.email, 'invalid_password', request);
      throw new Error(ErrorCodes.INVALID_CREDENTIALS);
    }

    // Get device info
    const deviceInfo = await getDeviceInfo();
    const deviceId = generateDeviceId(deviceInfo.userAgent, deviceInfo.ipAddress);

    // Find or create device
    let device = await prisma.device.findUnique({
      where: {
        userId_deviceId: {
          userId: user.id,
          deviceId,
        },
      },
    });

    if (!device) {
      device = await prisma.device.create({
        data: {
          userId: user.id,
          deviceId,
          deviceName: deviceInfo.deviceName,
          deviceType: deviceInfo.deviceType,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          ipAddress: deviceInfo.ipAddress,
          location: deviceInfo.location,
          country: deviceInfo.country,
          city: deviceInfo.city,
        },
      });
    } else {
      // Update device info
      device = await prisma.device.update({
        where: { id: device.id },
        data: {
          lastSeenAt: new Date(),
          loginCount: { increment: 1 },
          ipAddress: deviceInfo.ipAddress,
          location: deviceInfo.location,
          country: deviceInfo.country,
          city: deviceInfo.city,
        },
      });
    }

    // Create session
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        sessionToken,
        deviceId: device.id,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        deviceType: deviceInfo.deviceType,
        deviceName: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        location: deviceInfo.location,
        expiresAt,
      },
    });

    // Generate tokens
    const tokenFamilyId = generateTokenFamilyId();
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      sessionId: session.id,
    });
    const refreshTokenHash = hashToken(refreshToken);

    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        tokenHash: refreshTokenHash,
        familyId: tokenFamilyId,
        deviceId: device.id,
        sessionId: session.id,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      sessionId: session.id,
    });

    // Update user last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Record successful login
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        email: user.email,
        success: true,
        deviceId: device.id,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        location: deviceInfo.location,
        country: deviceInfo.country,
        sessionId: session.id,
      },
    });

    // Get user roles and permissions
    const roles = await getUserRoles(user.id);
    const permissions = await getUserPermissions(user.id);

    // Create audit log
    await createAuditLog({
      action: 'user.logged_in',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
      userEmail: user.email,
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      isBlocked: user.isBlocked,
      roles,
      permissions,
      profile: user.profile ? {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        displayName: user.profile.displayName,
        avatar: user.profile.avatar,
      } : undefined,
    };

    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY_MINUTES * 60,
    };

    return {
      user: authUser,
      tokens,
      session: {
        id: session.id,
        deviceName: session.deviceName,
        ipAddress: session.ipAddress,
      },
    };
  }

  async refreshToken(input: RefreshTokenInput, request?: Request): Promise<AuthTokens> {
    const jwtUtils = await import('@/lib/utils/jwt');
    
    try {
      const payload = jwtUtils.verifyRefreshToken(input.refreshToken);
      const tokenHash = jwtUtils.hashToken(input.refreshToken);

      // Find refresh token
      const refreshTokenRecord = await prisma.refreshToken.findUnique({
        where: { tokenHash },
        include: {
          user: true,
          session: true,
        },
      });

      if (!refreshTokenRecord || !refreshTokenRecord.isActive || refreshTokenRecord.isRevoked) {
        throw new Error(ErrorCodes.INVALID_TOKEN);
      }

      if (refreshTokenRecord.expiresAt < new Date()) {
        throw new Error(ErrorCodes.TOKEN_EXPIRED);
      }

      // Check if user is still active
      if (!refreshTokenRecord.user.isActive || refreshTokenRecord.user.isBlocked) {
        throw new Error(ErrorCodes.FORBIDDEN);
      }

      // Check if session is still active
      if (refreshTokenRecord.sessionId && refreshTokenRecord.session) {
        if (!refreshTokenRecord.session.isActive || refreshTokenRecord.session.isRevoked) {
          throw new Error(ErrorCodes.INVALID_TOKEN);
        }
      }

      // Rotate refresh token (revoke old, create new)
      await prisma.refreshToken.update({
        where: { id: refreshTokenRecord.id },
        data: {
          isActive: false,
          isRevoked: true,
          revokedAt: new Date(),
          rotatedAt: new Date(),
        },
      });

      const newRefreshToken = generateRefreshToken({
        userId: refreshTokenRecord.userId,
        email: refreshTokenRecord.user.email,
        sessionId: refreshTokenRecord.sessionId || undefined,
      });
      const newRefreshTokenHash = jwtUtils.hashToken(newRefreshToken);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

      await prisma.refreshToken.create({
        data: {
          userId: refreshTokenRecord.userId,
          token: newRefreshToken,
          tokenHash: newRefreshTokenHash,
          familyId: refreshTokenRecord.familyId,
          parentTokenId: refreshTokenRecord.id,
          deviceId: refreshTokenRecord.deviceId,
          sessionId: refreshTokenRecord.sessionId,
          ipAddress: refreshTokenRecord.ipAddress,
          userAgent: refreshTokenRecord.userAgent,
          expiresAt,
        },
      });

      const accessToken = generateAccessToken({
        userId: refreshTokenRecord.userId,
        email: refreshTokenRecord.user.email,
        sessionId: refreshTokenRecord.sessionId || undefined,
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: ACCESS_TOKEN_EXPIRY_MINUTES * 60,
      };
    } catch (error) {
      throw new Error(ErrorCodes.INVALID_TOKEN);
    }
  }

  async logout(userId: string, sessionId?: string): Promise<void> {
    if (sessionId) {
      // Revoke specific session
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          isRevoked: true,
          revokedAt: new Date(),
          revokedBy: userId,
          revokedReason: 'user_logout',
        },
      });

      // Revoke all refresh tokens for this session
      await prisma.refreshToken.updateMany({
        where: {
          sessionId,
          isActive: true,
        },
        data: {
          isActive: false,
          isRevoked: true,
          revokedAt: new Date(),
          revokedBy: userId,
          revokedReason: 'user_logout',
        },
      });
    } else {
      // Revoke all sessions for user
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
          revokedReason: 'user_logout_all',
        },
      });

      // Revoke all refresh tokens for user
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
          revokedReason: 'user_logout_all',
        },
      });
    }

    await createAuditLog({
      action: 'user.logged_out',
      entity: 'User',
      entityId: userId,
      userId,
    });
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(ErrorCodes.NOT_FOUND);
    }

    const isValidPassword = await verifyPassword(input.currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error(ErrorCodes.INVALID_CREDENTIALS);
    }

    const hashedPassword = await hashPassword(input.newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await createAuditLog({
      action: 'user.password_changed',
      entity: 'User',
      entityId: userId,
      userId,
    });
  }

  async requestPasswordReset(input: ResetPasswordRequestInput): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      // Don't reveal if user exists
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expiresAt,
      },
    });

    // In production, send email with reset link
    // await sendPasswordResetEmail(user.email, token);
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: input.token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error(ErrorCodes.INVALID_TOKEN);
    }

    const hashedPassword = await hashPassword(input.password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    await createAuditLog({
      action: 'user.password_reset',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
      userEmail: user.email,
    });
  }

  private async recordFailedLogin(
    email: string,
    reason: string,
    request?: Request
  ): Promise<void> {
    const deviceInfo = await getDeviceInfo();
    const deviceId = generateDeviceId(deviceInfo.userAgent, deviceInfo.ipAddress);

    await prisma.loginHistory.create({
      data: {
        email,
        success: false,
        failureReason: reason,
        deviceId,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        location: deviceInfo.location,
        country: deviceInfo.country,
        isSuspicious: false,
      },
    });
  }
}

export const authService = new AuthService();

