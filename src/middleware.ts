import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // For dashboard routes, we'll do auth check in the layout component
  // Middleware only handles basic redirects to avoid Edge Runtime issues
  // The actual auth and role checking happens in the layout component (Node.js runtime)
  
  // Redirect /dashboard to /dashboard/users
  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/dashboard/users', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
};

