'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { LayoutDashboard, Monitor, Users, FileText, LogOut, MessageSquare, Bell, TrendingUp, Activity, Scan, Search, Upload, PenSquare, ShieldAlert, AlertCircle, Warehouse } from 'lucide-react';
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
    { href: '/warehouse', label: 'Warehouse', icon: Warehouse },
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
    <div className="group fixed left-0 top-0 z-40">
      {/* Subtle glow effect that extends beyond sidebar */}
      <div className="fixed left-0 top-0 w-20 h-screen z-30 pointer-events-none transition-all duration-500 ease-out group-hover:w-64">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/5 to-green-500/0 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
      </div>
      
      <aside className="w-20 group-hover:w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-white min-h-screen fixed left-0 top-0 shadow-2xl group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15),0_0_40px_rgba(16,185,129,0.1)] border-r-2 border-gray-700 dark:border-gray-800 group-hover:border-green-500/30 overflow-y-auto overflow-x-hidden transition-all duration-500 ease-out">
        {/* Subtle inner glow overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 via-green-500/3 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        
        {/* Subtle animated border glow */}
        <div className="absolute inset-0 border-r-2 border-green-500/0 group-hover:border-green-500/20 transition-all duration-500 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-green-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative p-4 group-hover:p-6 pb-32 transition-all duration-500">
          <div className="flex items-center justify-center group-hover:justify-start space-x-3 mb-8 transition-all duration-500">
            <div className="relative">
              <Image src="/Tamer_logo.png" alt="Tamer Logo" width={45} height={45} className="relative object-contain transform group-hover:scale-110 transition-transform duration-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-white opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[200px] overflow-hidden transition-all duration-500 whitespace-nowrap">
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
                  className={`group/link relative flex items-center justify-center group-hover:justify-start space-x-3 px-3 group-hover:px-4 py-3 rounded-xl transition-all duration-500 ${
                    isActive
                      ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-lg shadow-green-500/30 group-hover:shadow-green-500/40'
                      : 'text-gray-300 hover:bg-gray-800/60 hover:text-white group-hover:hover:translate-x-1 group-hover:hover:bg-gray-800/80'
                  }`}
                  title={item.label}
                >
                  {isActive && (
                    <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full group-hover:w-1.5 transition-all duration-500"></div>
                  )}
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${isActive ? 'text-white scale-110 group-hover:scale-115' : 'group-hover/link:text-green-400 group-hover/link:scale-110'}`} />
                  <span className="font-medium opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[200px] overflow-hidden transition-all duration-500 whitespace-nowrap group-hover:translate-x-0">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 group-hover:p-6 border-t border-gray-700 group-hover:border-green-500/20 bg-gradient-to-t from-gray-900 to-transparent transition-all duration-500">
          <div className="mb-3">
            <Link
              href="/profile"
              className="flex items-center justify-center group-hover:justify-start space-x-3 mb-4 p-3 rounded-xl bg-gray-800/50 group-hover:bg-gray-800/80 backdrop-blur-sm transition-all duration-500 hover:bg-gray-800/90 cursor-pointer"
            >
              <div className="relative flex-shrink-0">
                <div className="relative h-12 w-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center shadow-lg ring-2 ring-green-400/20 group-hover:ring-green-400/30 transition-all duration-500 overflow-hidden">
                  {currentUser?.profile_image ? (
                    <Image
                      src={currentUser.profile_image}
                      alt={currentUser?.full_name || 'User'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-lg">
                      {currentUser?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0 opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[200px] overflow-hidden transition-all duration-500">
                <p className="font-semibold text-white text-sm truncate">
                  {currentUser?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">{currentUser?.email || ''}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="group/btn w-full flex items-center justify-center group-hover:justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              title="Logout"
            >
              <LogOut className="w-4 h-4 group-hover/btn:rotate-12 transition-transform flex-shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[100px] overflow-hidden transition-all duration-500 whitespace-nowrap">Logout</span>
            </button>
          </div>
        </div>
      </aside>

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
    </div>
  );
};

export default Sidebar;

