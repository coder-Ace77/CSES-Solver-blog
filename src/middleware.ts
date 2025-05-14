
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_AUTH_COOKIE_NAME = 'admin_auth_token';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin route, but not /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const isAuthenticated = request.cookies.has(ADMIN_AUTH_COOKIE_NAME);

    if (!isAuthenticated) {
      const loginUrl = new URL('/admin/login', request.url);
      // If trying to access a sub-path of admin, redirect to login but keep original path for after login
      // loginUrl.searchParams.set('redirect', pathname); // Optional: for redirecting back after login
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (static assets)
     * - images (static images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets|images).*)',
  ],
};
