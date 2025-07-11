import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from './firebaseAdmin';
import { cookies } from 'next/headers';

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
}

export async function createSessionCookie(idToken: string): Promise<string> {
  try {
    // Create a session cookie that lasts 5 days
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    return sessionCookie;
  } catch (error) {
    console.error('Error creating session cookie:', error);
    throw new Error('Failed to create session cookie');
  }
}

export async function verifySessionCookie(sessionCookie: string): Promise<AuthenticatedUser | null> {
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email || null,
      emailVerified: decodedClaims.email_verified || false,
      displayName: decodedClaims.name || null,
      photoURL: decodedClaims.picture || null,
    };
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return null;
    }

    return await verifySessionCookie(sessionCookie);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

export function createAuthResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function createAuthError(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
