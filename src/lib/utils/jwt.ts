import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  sessionId?: string;
  jti?: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  const jti = crypto.randomUUID();
  return jwt.sign(
    { ...payload, jti, type: 'access' },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

export function generateRefreshToken(payload: TokenPayload): string {
  const jti = crypto.randomUUID();
  return jwt.sign(
    { ...payload, jti, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload & { type: string };
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload & { type: string };
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateTokenFamilyId(): string {
  return crypto.randomUUID();
}

