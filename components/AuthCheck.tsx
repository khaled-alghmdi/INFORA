'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '@/lib/auth';

const AuthCheck = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Public routes that don't require authentication
    const publicRoutes = ['/login'];
    
    if (publicRoutes.includes(pathname)) {
      setIsChecking(false);
      return;
    }

    // Check authentication
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Get current user to check role
    const currentUser = getCurrentUser();
    
    // Admin-only routes
    const adminOnlyRoutes = [
      '/',
      '/devices',
      '/users',
      '/scan',
      '/requests',
      '/bulk',
      '/analytics',
      '/activity',
      '/reports'
    ];

    // If user is trying to access admin page but is not admin
    if (currentUser?.role !== 'admin' && adminOnlyRoutes.includes(pathname)) {
      // Redirect to user dashboard
      router.push('/my-devices');
      return;
    }

    setIsChecking(false);
  }, [pathname, router]);

  // Show loading state while checking auth
  if (isChecking && !['/login'].includes(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthCheck;

