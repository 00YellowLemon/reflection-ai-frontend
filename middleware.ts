import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Since we're using context-based authentication, we don't need middleware-based route protection
  // The RouteGuard component handles auth checks on the client side
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
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
