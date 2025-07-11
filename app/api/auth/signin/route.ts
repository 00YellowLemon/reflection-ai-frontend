import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie, createAuthResponse, createAuthError } from '@/lib/serverAuth';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return createAuthError('ID token is required', 400);
    }

    // Create session cookie
    const sessionCookie = await createSessionCookie(idToken);

    // Set the session cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: 60 * 60 * 24 * 5, // 5 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return createAuthResponse({ 
      message: 'Successfully signed in',
      success: true 
    });
  } catch (error) {
    console.error('Sign in error:', error);
    return createAuthError('Failed to sign in', 500);
  }
}
