import { NextRequest } from 'next/server';
import { verifyAccessToken, hashToken } from '@/lib/utils/jwt';
import { prisma } from '@/lib/prisma';
import { ErrorCodes } from '@/types/api';
import { getAccessTokenFromCookie } from '@/lib/utils/cookies';
import crypto from 'crypto';

export interface AuthContext {
  userId: string;
  email: string;
  sessionId?: string;
}

export async function getAuthContext(request: NextRequest): Promise<AuthContext | null> {
  try {
    // Try to get token from cookie first, then from Authorization header
    let token = getAccessTokenFromCookie(request);
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
      }
      token = authHeader.substring(7);
    }
    const payload = verifyAccessToken(token);

    // Check if token is blacklisted
    const tokenHash = hashToken(token);
    const blacklisted = await prisma.tokenBlacklist.findUnique({
      where: { tokenHash },
    });

    if (blacklisted) {
      return null;
    }

    // Check if session is still active
    if (payload.sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: payload.sessionId },
      });

      if (!session || !session.isActive || session.isRevoked) {
        return null;
      }

      // Update last activity
      await prisma.session.update({
        where: { id: payload.sessionId },
        data: {
          lastActivityAt: new Date(),
          lastActivityIp: request.headers.get('x-forwarded-for')?.split(',')[0] || 
                         request.headers.get('x-real-ip') || null,
          activityCount: { increment: 1 },
        },
      });
    }

    return {
      userId: payload.userId,
      email: payload.email,
      sessionId: payload.sessionId,
    };
  } catch (error) {
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const context = await getAuthContext(request);
  if (!context) {
    throw new Error(ErrorCodes.UNAUTHORIZED);
  }
  return context;
}

