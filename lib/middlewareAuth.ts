import { NextRequest } from 'next/server';

export function hasValidSession(request: NextRequest): boolean {
  try {
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      return false;
    }

    // Basic validation - check if it looks like a Firebase session cookie
    // Firebase session cookies are typically long strings (JWTs)
    // This is a lightweight check, real validation happens in API routes
    return sessionCookie.length > 50 && sessionCookie.includes('.');
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}
