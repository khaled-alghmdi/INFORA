'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';

const NotificationBell = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    
    fetchNotificationCount();
    
    // Set up real-time subscription for new requests (admin only)
    if (currentUser?.role === 'admin') {
      const channel = supabase
        .channel('requests_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'requests',
          },
          async (payload) => {
            // Fetch user details for the new request
            const { data: userData } = await supabase
              .from('users')
              .select('full_name, employee_id')
              .eq('id', payload.new.user_id)
              .single();

            const userName = userData?.full_name || 'A user';
            const requestType = payload.new.request_type === 'device_request' 
              ? '💻 Device Request' 
              : '🔧 IT Support';

            // Show notification alert
            setAlertMessage(`${userName} submitted a new ${requestType}: "${payload.new.title}"`);
            setShowAlert(true);

            // Play notification sound (optional)
            try {
              const audio = new Audio('/notification.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {
                // Silently fail if audio doesn't play
              });
            } catch (error) {
              // Audio not available
            }

            // Update notification count
            fetchNotificationCount();

            // Hide alert after 8 seconds
            setTimeout(() => {
              setShowAlert(false);
            }, 8000);
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        supabase.removeChannel(channel);
      };
    }

    // Refresh count every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleViewed = () => {
      setNotificationCount(0);
      fetchNotificationCount();
    };

    window.addEventListener('notifications-viewed', handleViewed);
    return () => window.removeEventListener('notifications-viewed', handleViewed);
  }, []);

  const fetchNotificationCount = async () => {
    const currentUser = getCurrentUser();
    let count = 0;

    // Get last viewed timestamp for this user
    let lastViewed: Date | null = null;
    try {
      const { data: viewData } = await supabase
        .from('notification_views')
        .select('last_viewed_at')
        .eq('user_id', currentUser?.id)
        .single();

      if (viewData) {
        lastViewed = new Date(viewData.last_viewed_at);
      }
    } catch (err) {
      // notification_views table doesn't exist yet
    }

    if (currentUser?.role === 'admin') {
      // Admin notifications: NEW pending requests, maintenance, expiring warranties
      
      // Count NEW pending requests (created after last viewed)
      const { data: pendingRequests } = await supabase
        .from('requests')
        .select('id, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingRequests) {
        if (lastViewed) {
          // Only count requests created AFTER last viewed
          const newRequests = pendingRequests.filter((req: any) => 
            new Date(req.created_at) > lastViewed
          );
          count += newRequests.length;
        } else {
          // Never viewed - count all pending requests
          count += pendingRequests.length;
        }
      }

      // For admin, we DON'T count warranties and maintenance in badge
      // Those are shown on the notifications page but don't need real-time alerts
      // Only NEW pending requests should trigger the badge
      
    } else {
      // User notifications: request updates, new device assignments
      
      // Count requests updated AFTER last viewed
      const { data: updatedRequests } = await supabase
        .from('requests')
        .select('id, updated_at')
        .eq('user_id', currentUser?.id)
        .in('status', ['approved', 'completed', 'rejected']);

      if (updatedRequests) {
        if (lastViewed) {
          // Only count notifications newer than last viewed
          const newNotifications = updatedRequests.filter((req: any) => 
            new Date(req.updated_at) > lastViewed
          );
          count += newNotifications.length;
        } else {
          // Never viewed - count all
          count += updatedRequests.length;
        }
      }

      // Count newly assigned devices AFTER last viewed
      const { data: newDevices } = await supabase
        .from('devices')
        .select('id, assigned_date')
        .eq('assigned_to', currentUser?.id)
        .not('assigned_date', 'is', null);

      if (newDevices) {
        if (lastViewed) {
          // Only count devices assigned after last viewed
          const newAssignments = newDevices.filter((device: any) =>
            new Date(device.assigned_date) > lastViewed
          );
          count += newAssignments.length;
        } else {
          // Count devices assigned in last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const recentDevices = newDevices.filter((device: any) =>
            new Date(device.assigned_date) > sevenDaysAgo
          );
          count += recentDevices.length;
        }
      }
    }

    setNotificationCount(count);
  };

  return (
    <>
      <Link
        href="/notifications"
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="View Notifications"
      >
        <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors" />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </Link>

      {/* Real-time notification alert */}
      {showAlert && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-green-500 dark:border-green-600 p-4 max-w-md">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center animate-pulse">
                  <Bell className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">New Request Received!</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">{alertMessage}</p>
              </div>
              <button
                onClick={() => setShowAlert(false)}
                className="flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationBell;

