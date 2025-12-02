import { headers } from 'next/headers';

export interface DeviceInfo {
  userAgent: string | null;
  ipAddress: string | null;
  deviceType: string | null;
  deviceName: string | null;
  browser: string | null;
  os: string | null;
  location: string | null;
  country: string | null;
  city: string | null;
}

export function parseUserAgent(userAgent: string | null): {
  browser: string | null;
  os: string | null;
  deviceType: string | null;
  deviceName: string | null;
} {
  if (!userAgent) {
    return {
      browser: null,
      os: null,
      deviceType: null,
      deviceName: null,
    };
  }

  // Browser detection
  let browser: string | null = null;
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  } else if (userAgent.includes('Opera')) {
    browser = 'Opera';
  }

  // OS detection
  let os: string | null = null;
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  }

  // Device type detection
  let deviceType: string | null = null;
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    deviceType = 'mobile';
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    deviceType = 'tablet';
  } else {
    deviceType = 'desktop';
  }

  // Device name
  const deviceName = `${browser || 'Unknown'} on ${os || 'Unknown'}`;

  return {
    browser,
    os,
    deviceType,
    deviceName,
  };
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent');
  const forwarded = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const ipAddress = forwarded?.split(',')[0] || realIp || null;

  const { browser, os, deviceType, deviceName } = parseUserAgent(userAgent);

  // Location would typically come from a geolocation service
  // For now, we'll leave it null
  return {
    userAgent,
    ipAddress,
    deviceType,
    deviceName,
    browser,
    os,
    location: null,
    country: null,
    city: null,
  };
}

import crypto from 'crypto';

export function generateDeviceId(userAgent: string | null, ipAddress: string | null): string {
  const data = `${userAgent || ''}-${ipAddress || ''}`;
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return hash.substring(0, 32);
}

