'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { LayoutDashboard, Monitor, Users, FileText, LogOut, MessageSquare, Bell, TrendingUp, Activity, Scan, Search, Upload, PenSquare, ShieldAlert, AlertCircle } from 'lucide-react';
import { getCurrentUser, logout } from '@/lib/auth';

const Sidebar = () => {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  // Admin-only menu items
  const adminNavItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/devices', label: 'Devices', icon: Monitor },
    { href: '/users', label: 'Users', icon: Users },
    { href: '/scan', label: 'Quick Search', icon: Search },
    { href: '/requests', label: 'Requests', icon: MessageSquare },
    { href: '/bulk', label: 'Bulk Operations', icon: Upload },
    { href: '/analytics', label: 'Analytics', icon: TrendingUp },
    { href: '/activity', label: 'Activity Log', icon: Activity },
    { href: '/reports', label: 'Reports', icon: FileText },
  ];

  // Regular user menu items
  const userNavItems = [
    { href: '/my-devices', label: 'My Devices', icon: Monitor },
    { href: '/my-requests', label: 'My Requests', icon: MessageSquare },
    { href: '/delivery-note', label: 'Delivery Note', icon: PenSquare },
    { href: '/incident-request', label: 'Incident Request', icon: ShieldAlert },
  ];

  // Select navigation based on user role
  const navItems = currentUser?.role === 'admin' ? adminNavItems : userNavItems;

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <aside className="group w-20 hover:w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-white min-h-screen fixed left-0 top-0 shadow-2xl border-r border-gray-700 dark:border-gray-800 z-40 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out">
      <div className="p-4 group-hover:p-6 pb-32 transition-all duration-300">
        <div className="flex items-center justify-center group-hover:justify-start space-x-3 mb-8 transition-all duration-300">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <Image src="/Tamer_logo.png" alt="Tamer Logo" width={45} height={45} className="relative object-contain transform group-hover:scale-110 transition-transform" />
          </div>
          <h1 className="text-2xl font-extrabold text-white animate-pulse-soft opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto overflow-hidden transition-all duration-300 whitespace-nowrap" style={{ textShadow: '-1px -1px 0 #065f46, 1px -1px 0 #065f46, -1px 1px 0 #065f46, 1px 1px 0 #065f46, 0 -1px 0 #065f46, 0 1px 0 #065f46, -1px 0 0 #065f46, 1px 0 0 #065f46' }}>
            INFORA
          </h1>
        </div>
        <nav className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 #1f2937' }}>
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ animationDelay: `${index * 50}ms` }}
                className={`group/link relative flex items-center justify-center group-hover:justify-start space-x-3 px-4 py-3 rounded-xl transition-all duration-300 animate-fade-in ${
                  isActive
                    ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-lg shadow-green-500/50'
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white group-hover:hover:translate-x-1'
                }`}
                title={item.label}
              >
                {isActive && (
                  <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full"></div>
                )}
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'group-hover/link:text-green-400'} transition-colors`} />
                <span className="font-medium opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto overflow-hidden transition-all duration-300 whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 group-hover:p-6 border-t border-gray-700 bg-gradient-to-t from-gray-900 to-transparent transition-all duration-300">
        <div className="mb-3">
          <div className="flex items-center justify-center group-hover:justify-start space-x-3 mb-4 p-3 rounded-xl bg-gray-800/50 backdrop-blur-sm transition-all duration-300">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full blur-sm opacity-50"></div>
              <div className="relative h-12 w-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center shadow-lg ring-2 ring-green-400/20">
                <span className="text-white font-bold text-lg">
                  {currentUser?.full_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0 opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto overflow-hidden transition-all duration-300">
              <p className="font-semibold text-white text-sm truncate">
                {currentUser?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-400 truncate">{currentUser?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="group/btn w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            title="Logout"
          >
            <LogOut className="w-4 h-4 group-hover/btn:rotate-12 transition-transform flex-shrink-0" />
            <span className="opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto overflow-hidden transition-all duration-300 whitespace-nowrap">Logout</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label="Logout confirmation dialog"
          tabIndex={-1}
          onClick={handleCancelLogout}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              handleCancelLogout();
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-900"
            role="document"
            tabIndex={0}
            aria-label="Logout confirmation content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-4 rounded-xl bg-orange-50 p-4 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200">
              <AlertCircle className="h-10 w-10 flex-shrink-0" />
              <div>
                <p className="text-lg font-semibold">Logout Confirmation</p>
                <p className="text-sm text-orange-600 dark:text-orange-200/80">
                  Are you sure you want to logout?
                </p>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
              <p>You will be redirected to the login page and will need to sign in again to access the system.</p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCancelLogout}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 sm:w-32"
                tabIndex={0}
                aria-label="Cancel logout"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="w-full rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-center font-semibold text-white transition hover:from-red-700 hover:to-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 sm:w-32"
                tabIndex={0}
                aria-label="Confirm logout"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

