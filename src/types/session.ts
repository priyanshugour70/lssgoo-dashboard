import { z } from 'zod';

// Session Schemas
export const revokeSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  reason: z.string().optional(),
});

export const revokeAllSessionsSchema = z.object({
  reason: z.string().optional(),
});

// Types
export type RevokeSessionInput = z.infer<typeof revokeSessionSchema>;
export type RevokeAllSessionsInput = z.infer<typeof revokeAllSessionsSchema>;

// Response Types
export interface Session {
  id: string;
  userId: string;
  sessionToken: string;
  fingerprint: string | null;
  deviceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  deviceType: string | null;
  deviceName: string | null;
  browser: string | null;
  os: string | null;
  location: string | null;
  isActive: boolean;
  isRevoked: boolean;
  revokedAt: string | null;
  revokedBy: string | null;
  revokedReason: string | null;
  lastActivityAt: string;
  lastActivityIp: string | null;
  activityCount: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  device?: {
    id: string;
    deviceName: string | null;
    deviceType: string | null;
    isTrusted: boolean;
    isBlocked: boolean;
  };
}

export interface Device {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  osVersion: string | null;
  platform: string | null;
  ipAddress: string | null;
  location: string | null;
  country: string | null;
  city: string | null;
  isTrusted: boolean;
  isBlocked: boolean;
  blockedAt: string | null;
  blockedBy: string | null;
  blockedReason: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  loginCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoginHistory {
  id: string;
  userId: string | null;
  email: string | null;
  success: boolean;
  failureReason: string | null;
  deviceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  location: string | null;
  country: string | null;
  isSuspicious: boolean;
  riskScore: number | null;
  sessionId: string | null;
  refreshTokenId: string | null;
  attemptedAt: string;
}

