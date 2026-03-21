import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/api/auth'];
  const isPublicRoute = publicRoutes.some(route => pathname === route);

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check for protected routes (e.g., /dashboard)
  if (pathname.startsWith('/dashboard')) {
    // Try to get token from cookie first, then from Authorization header
    let token = request.cookies.get('forfait-token')?.value;

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      // No token found, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify token
    const verified = await verifyToken(token);

    if (!verified) {
      // Invalid token, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Token is valid, allow request
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
