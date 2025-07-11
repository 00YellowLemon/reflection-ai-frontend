'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  requireAuth = false, 
  redirectTo 
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // User is not authenticated but route requires auth
        router.push(redirectTo || '/auth');
      } else if (!requireAuth && user && pathname === '/auth') {
        // User is authenticated but on auth page
        router.push(redirectTo || '/chat');
      }
    }
  }, [user, loading, requireAuth, router, redirectTo, pathname]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If requireAuth is true and user is not authenticated, don't render children
  if (requireAuth && !user) {
    return null;
  }

  // If requireAuth is false and user is authenticated on auth page, don't render children
  if (!requireAuth && user && pathname === '/auth') {
    return null;
  }

  return <>{children}</>;
};
