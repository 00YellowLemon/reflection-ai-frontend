import { NextRequest } from 'next/server';
import { getCurrentUser, createAuthResponse, createAuthError } from '@/lib/serverAuth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createAuthError('Not authenticated', 401);
    }

    return createAuthResponse({ 
      user,
      success: true 
    });
  } catch (error) {
    console.error('Get user error:', error);
    return createAuthError('Failed to get user', 500);
  }
}
