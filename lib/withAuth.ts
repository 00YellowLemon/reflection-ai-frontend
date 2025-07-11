import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, createAuthError } from '@/lib/serverAuth';

export async function withAuth(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        return createAuthError('Authentication required', 401);
      }
      
      return await handler(request, user);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return createAuthError('Authentication failed', 401);
    }
  };
}
