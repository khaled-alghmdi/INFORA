'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import { Bell, AlertTriangle, Clock, Package, Wrench, CheckCircle, XCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';

type Alert = {
  id: string;
  type: 'pending_request' | 'warranty_expiring' | 'low_stock' | 'maintenance_due' | 'inactive_user' | 'request_update' | 'device_assigned';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'urgent';
  link?: string;
  count?: number;
  date?: string;
};

const NotificationsPage = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState({
    pendingRequests: 0,
    urgentRequests: 0,
    expiringWarranties: 0,
    maintenanceDevices: 0,
  });

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    fetchAlerts(user);

    // Mark notifications as viewed when user opens this page
    if (user) {
      markNotificationsAsViewed(user.id);
    }
  }, []);

  const markNotificationsAsViewed = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('notification_views')
        .upsert({ 
          user_id: userId, 
          last_viewed_at: new Date().toISOString() 
        });

      if (error) {
        console.log('Note: notification_views table may not exist yet.');
      }
    } catch (err) {
      console.log('Notification tracking not enabled');
    }
  };

  const fetchAlerts = async (user: any) => {
    setLoading(true);
    const alertsList: Alert[] = [];

    // Check if user is admin or regular user
    const isAdmin = user?.role === 'admin';

    if (!isAdmin) {
      // ===== USER NOTIFICATIONS ONLY =====
      
      // 1. Request Status Updates (approved, completed, rejected)
      const { data: updatedRequests } = await supabase
        .from('requests')
        .select('*')
        .eq('user_id', user?.id)
        .in('status', ['approved', 'completed', 'rejected'])
        .order('updated_at', { ascending: false });

      if (updatedRequests) {
        updatedRequests.forEach((request: any) => {
          const statusIcon = request.status === 'approved' ? '✅' : request.status === 'completed' ? '🎉' : '❌';
          const statusText = request.status.charAt(0).toUpperCase() + request.status.slice(1);
          
          alertsList.push({
            id: `request-${request.id}`,
            type: 'request_update',
            title: `Request ${statusIcon} ${statusText}`,
            description: `Your request "${request.title}" has been ${request.status}`,
            severity: request.status === 'approved' ? 'medium' : request.status === 'completed' ? 'low' : 'high',
            link: '/my-requests',
            date: request.updated_at,
          });
        });
      }

      // 2. Newly Assigned Devices (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: newDevices } = await supabase
        .from('devices')
        .select('*')
        .eq('assigned_to', user?.id)
        .gte('assigned_date', sevenDaysAgo.toISOString());

      if (newDevices && newDevices.length > 0) {
        newDevices.forEach((device: any) => {
          alertsList.push({
            id: `device-${device.id}`,
            type: 'device_assigned',
            title: `📦 New Device Assigned: ${device.type}`,
            description: `${device.brand} ${device.model} (SN: ${device.serial_number})`,
            severity: 'medium',
            link: '/my-devices',
            date: device.assigned_date,
          });
        });
      }

      setLoading(false);
      setAlerts(alertsList);
      return;
    }

    // ===== ADMIN NOTIFICATIONS ONLY =====

    // 1. Pending Requests
    const { data: pendingRequests } = await supabase
      .from('requests')
      .select('*, user:users!requests_user_id_fkey(full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (pendingRequests && pendingRequests.length > 0) {
      const urgentCount = pendingRequests.filter((r: any) => r.priority === 'urgent').length;
      
      alertsList.push({
        id: 'pending-requests',
        type: 'pending_request',
        title: `${pendingRequests.length} Pending Request${pendingRequests.length > 1 ? 's' : ''}`,
        description: urgentCount > 0 
          ? `${urgentCount} urgent request${urgentCount > 1 ? 's' : ''} need${urgentCount === 1 ? 's' : ''} immediate attention`
          : 'Employee requests awaiting review',
        severity: urgentCount > 0 ? 'urgent' : pendingRequests.length > 5 ? 'high' : 'medium',
        link: '/requests',
        count: pendingRequests.length,
      });

      setStats(prev => ({ 
        ...prev, 
        pendingRequests: pendingRequests.length,
        urgentRequests: urgentCount
      }));
    }

    // 2. Expiring Warranties (within 60 days)
    const { data: devices } = await supabase
      .from('devices')
      .select('*')
      .not('warranty_expiry', 'is', null);

    if (devices) {
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

      const expiringDevices = devices.filter((device: any) => {
        const warrantyDate = new Date(device.warranty_expiry);
        const today = new Date();
        return warrantyDate > today && warrantyDate <= sixtyDaysFromNow;
      });

      if (expiringDevices.length > 0) {
        alertsList.push({
          id: 'expiring-warranties',
          type: 'warranty_expiring',
          title: `${expiringDevices.length} Warrant${expiringDevices.length > 1 ? 'ies' : 'y'} Expiring Soon`,
          description: 'Device warranties expiring within 60 days',
          severity: 'medium',
          link: '/devices',
          count: expiringDevices.length,
        });

        setStats(prev => ({ ...prev, expiringWarranties: expiringDevices.length }));
      }
    }

    // 3. Devices in Maintenance
    const { data: maintenanceDevices } = await supabase
      .from('devices')
      .select('*')
      .eq('status', 'maintenance');

    if (maintenanceDevices && maintenanceDevices.length > 0) {
      alertsList.push({
        id: 'maintenance-devices',
        type: 'maintenance_due',
        title: `${maintenanceDevices.length} Device${maintenanceDevices.length > 1 ? 's' : ''} in Maintenance`,
        description: 'Devices currently under maintenance',
        severity: 'low',
        link: '/devices',
        count: maintenanceDevices.length,
      });

      setStats(prev => ({ ...prev, maintenanceDevices: maintenanceDevices.length }));
    }

    // 4. Low Stock Alert (Less than 3 available devices of any type)
    const { data: availableDevices } = await supabase
      .from('devices')
      .select('type')
      .eq('status', 'available');

    if (availableDevices) {
      const typeCounts: { [key: string]: number } = {};
      availableDevices.forEach((device: any) => {
        typeCounts[device.type] = (typeCounts[device.type] || 0) + 1;
      });

      const lowStockTypes = Object.entries(typeCounts).filter(([_, count]) => count < 3);

      if (lowStockTypes.length > 0) {
        alertsList.push({
          id: 'low-stock',
          type: 'low_stock',
          title: `Low Stock: ${lowStockTypes.map(([type]) => type).join(', ')}`,
          description: `${lowStockTypes.length} device type${lowStockTypes.length > 1 ? 's' : ''} with less than 3 units available`,
          severity: 'medium',
          link: '/devices',
          count: lowStockTypes.length,
        });
      }
    }

    // 5. Inactive Users with Devices
    const { data: usersWithDevices } = await supabase
      .from('users')
      .select('*, devices!devices_assigned_to_fkey(id)')
      .eq('is_active', false);

    if (usersWithDevices) {
      const inactiveWithDevices = usersWithDevices.filter((user: any) => 
        user.devices && user.devices.length > 0
      );

      if (inactiveWithDevices.length > 0) {
        alertsList.push({
          id: 'inactive-users',
          type: 'inactive_user',
          title: `${inactiveWithDevices.length} Inactive User${inactiveWithDevices.length > 1 ? 's' : ''} with Devices`,
          description: 'Inactive users still have devices assigned',
          severity: 'high',
          link: '/users',
          count: inactiveWithDevices.length,
        });
      }
    }

    setAlerts(alertsList);
    setLoading(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'urgent':
        return 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300';
      case 'low':
        return 'bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'pending_request':
      case 'request_update':
        return <Bell className="w-6 h-6" />;
      case 'warranty_expiring':
        return <Clock className="w-6 h-6" />;
      case 'low_stock':
        return <Package className="w-6 h-6" />;
      case 'maintenance_due':
        return <Wrench className="w-6 h-6" />;
      case 'inactive_user':
        return <AlertTriangle className="w-6 h-6" />;
      case 'device_assigned':
        return <Package className="w-6 h-6" />;
      default:
        return <Bell className="w-6 h-6" />;
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
        <PageHeader
          title={isAdmin ? "System Notifications" : "My Notifications"}
          description={isAdmin ? "Monitor system alerts and pending actions" : "View updates on your requests and devices"}
        />

        {/* Admin Stats Cards - ONLY FOR ADMINS */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Bell className="w-8 h-8" />
                <span className="text-3xl font-bold">{stats.pendingRequests}</span>
              </div>
              <p className="text-green-100 text-sm">Pending Requests</p>
            </div>

            <div className="bg-gradient-to-br from-red-600 to-orange-700 text-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-8 h-8" />
                <span className="text-3xl font-bold">{stats.urgentRequests}</span>
              </div>
              <p className="text-orange-100 text-sm">Urgent Requests</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-600 to-orange-700 text-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8" />
                <span className="text-3xl font-bold">{stats.expiringWarranties}</span>
              </div>
              <p className="text-yellow-100 text-sm">Expiring Warranties</p>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-cyan-700 text-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Wrench className="w-8 h-8" />
                <span className="text-3xl font-bold">{stats.maintenanceDevices}</span>
              </div>
              <p className="text-blue-100 text-sm">In Maintenance</p>
            </div>
          </div>
        )}

        {/* Alerts List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2 text-orange-500" />
            {isAdmin ? 'Active Alerts' : 'My Updates'}
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 dark:border-green-400"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading notifications...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {isAdmin ? 'All Clear!' : 'No New Updates'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {isAdmin ? 'No alerts or pending actions at this time' : 'You don&apos;t have any new notifications'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={alert.link || '#'}
                  className={`block p-4 rounded-lg border-2 transition-all hover:shadow-lg hover:scale-[1.01] ${getSeverityColor(
                    alert.severity
                  )}`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-semibold">{alert.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                          alert.severity === 'urgent' ? 'bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-200' :
                          alert.severity === 'high' ? 'bg-orange-200 dark:bg-orange-900 text-orange-900 dark:text-orange-200' :
                          alert.severity === 'medium' ? 'bg-yellow-200 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-200' :
                          'bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm opacity-90">{alert.description}</p>
                      {alert.date && (
                        <p className="text-xs opacity-70 mt-2">
                          {new Date(alert.date).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions - SEPARATE FOR USERS AND ADMINS */}
        {isAdmin ? (
          // ADMIN QUICK ACTIONS
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/requests"
              className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <Bell className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-semibold mb-2">View All Requests</h3>
              <p className="text-green-100 text-sm">Manage employee requests and tickets</p>
            </Link>

            <Link
              href="/devices"
              className="bg-gradient-to-br from-blue-600 to-cyan-700 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <Package className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Device Management</h3>
              <p className="text-blue-100 text-sm">Check inventory and warranties</p>
            </Link>

            <Link
              href="/reports"
              className="bg-gradient-to-br from-purple-600 to-pink-700 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <FileText className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Generate Reports</h3>
              <p className="text-purple-100 text-sm">Create detailed system reports</p>
            </Link>
          </div>
        ) : (
          // USER QUICK ACTIONS - NO ADMIN PAGES
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/my-devices"
              className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <Package className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-semibold mb-2">My Devices</h3>
              <p className="text-green-100 text-sm">View all devices assigned to you</p>
            </Link>

            <Link
              href="/my-requests"
              className="bg-gradient-to-br from-blue-600 to-cyan-700 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <Bell className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-semibold mb-2">My Requests</h3>
              <p className="text-blue-100 text-sm">Submit and track your IT requests</p>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default NotificationsPage;
