'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { AlertTriangle, LogOut } from 'lucide-react';

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  // Session timeout: 20 minutes (1200000ms)
  // Warning: 2 minutes before timeout (120000ms)
  const { showWarning, timeRemaining, resetTimer } = useSessionTimeout({
    timeout: 20 * 60 * 1000, // 20 minutes
    warningTime: 2 * 60 * 1000, // 2 minutes warning
    onTimeout: () => {
      console.log('Session expired due to inactivity');
    },
  });

  useEffect(() => {
    // Allow access to login and reset-password pages without authentication
    const publicPaths = ['/login', '/reset-password'];
    const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

    if (!isPublicPath && !isAuthenticated()) {
      router.push('/login');
    } else {
      setIsChecking(false);
    }
  }, [pathname, router]);

  // Don't render session warning on public pages
  const publicPaths = ['/login', '/reset-password'];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <>
      {children}
      
      {/* Session Timeout Warning Modal */}
      {showWarning && !isPublicPath && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl border-2 border-yellow-500 dark:border-yellow-600 animate-pulse-slow">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-full">
                <AlertTriangle className="w-12 h-12 text-yellow-600 dark:text-yellow-500" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
              Session Timeout Warning
            </h2>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-center">
              Your session will expire due to inactivity. You will be automatically logged out in:
            </p>
            
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-600 rounded-lg p-4 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600 dark:text-red-500">
                  {Math.floor(timeRemaining / 60000)}:{((timeRemaining % 60000) / 1000).toFixed(0).padStart(2, '0')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">minutes remaining</div>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
              Move your mouse or press any key to stay logged in.
            </p>
            
            <button
              onClick={resetTimer}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-lg hover:shadow-xl font-semibold"
            >
              <span>Stay Logged In</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

