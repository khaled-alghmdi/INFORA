'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

const AuthCheck = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/signup'];
    
    if (publicRoutes.includes(pathname)) {
      setIsChecking(false);
      return;
    }

    // Check authentication
    if (!isAuthenticated()) {
      router.push('/login');
    } else {
      setIsChecking(false);
    }
  }, [pathname, router]);

  // Show loading state while checking auth
  if (isChecking && !['/login', '/signup'].includes(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthCheck;

