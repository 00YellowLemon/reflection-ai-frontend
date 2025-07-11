// src/middleware.ts (or middleware.ts in root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Assume a cookie named 'firebaseAuthToken' stores the Firebase auth token
  // Adjust the cookie name based on your actual implementation
  const firebaseAuthToken = request.cookies.get('firebaseAuthToken')?.value;

  const { pathname } = request.nextUrl;

  // If the user is trying to access the /chat route
  if (pathname.startsWith('/chat')) {
    if (!firebaseAuthToken) {
      // If no token, redirect to the login page (root in this case)
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    // If token exists, proceed to the requested page
    // You might want to add token verification logic here if needed,
    // though client-side Firebase SDK usually handles this.
    // For server-side verification, you'd need Firebase Admin SDK.
  }

  // If the user is authenticated and tries to access the auth page, redirect to chat
  // This prevents logged-in users from seeing the login/signup page again
  if (firebaseAuthToken && pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone();
    url.pathname = '/chat';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (the root path, public for login)
     * - /auth (the auth page itself, allow access for login/signup)
     *
     * This ensures the middleware runs for /chat and other protected routes,
     * and also for /auth to redirect already authenticated users.
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    // Explicitly include /chat and /auth if the above regex is too broad or complex
    // '/chat/:path*',
    // '/auth/:path*', // if you want to redirect authenticated users from /auth
  ],
};
