import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, createAuthResponse, createAuthError } from '@/lib/serverAuth';
import { adminAuth } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (user) {
      // Revoke all refresh tokens for the user
      await adminAuth.revokeRefreshTokens(user.uid);
    }

    // Clear the session cookie
    const cookieStore = await cookies();
    cookieStore.delete('session');

    return createAuthResponse({ 
      message: 'Successfully signed out',
      success: true 
    });
  } catch (error) {
    console.error('Sign out error:', error);
    return createAuthError('Failed to sign out', 500);
  }
}
