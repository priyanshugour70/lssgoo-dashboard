import { NextRequest, NextResponse } from 'next/server';

const ACCESS_TOKEN_COOKIE = 'accessToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds
const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes in seconds

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): NextResponse {
  // Set access token cookie (15 minutes)
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: '/',
  });

  // Set refresh token cookie (7 days)
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return response;
}

export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  return response;
}

export function getAccessTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get(ACCESS_TOKEN_COOKIE)?.value || null;
}

export function getRefreshTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get(REFRESH_TOKEN_COOKIE)?.value || null;
}

