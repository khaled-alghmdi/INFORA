'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import { TrendingUp, Users, Monitor, AlertCircle, CheckCircle, Clock, BarChart3, DollarSign, Calendar, Package, Zap, Award, TrendingDown, Activity, Shield, Box } from 'lucide-react';

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days
  const [analytics, setAnalytics] = useState({
    // Core Metrics
    totalDevices: 0,
    assignedDevices: 0,
    availableDevices: 0,
    maintenanceDevices: 0,
    utilizationRate: 0,
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    
    // Request Metrics
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    avgResponseTime: '0',
    requestResolutionRate: 0,
    
    // Device Analytics
    devicesByType: [] as { type: string; count: number; percentage: number }[],
    devicesByStatus: [] as { status: string; count: number; percentage: number }[],
    devicesByDepartment: [] as { department: string; count: number; users: number }[],
    deviceAge: { new: 0, recent: 0, old: 0, veryOld: 0 },
    
    // Warranty Analytics
    warrantyStatus: {
      inWarranty: 0,
      expiringSoon: 0, // 60 days
      expired: 0,
      noWarranty: 0,
    },
    
    // Request Analytics
    requestsByType: [] as { type: string; count: number }[],
    requestsByPriority: [] as { priority: string; count: number }[],
    requestsByStatus: [] as { status: string; count: number }[],
    requestTrends: [] as { period: string; count: number }[],
    
    // User Analytics
    usersWithDevices: 0,
    usersWithoutDevices: 0,
    avgDevicesPerUser: 0,
    topUsers: [] as { name: string; department: string; deviceCount: number }[],
    
    // Performance KPIs
    deviceTurnoverRate: 0,
    stockAvailability: 0,
    criticalStockTypes: [] as string[],
    maintenanceRate: 0,
    
    // Time-based Analytics
    requestsThisWeek: 0,
    requestsLastWeek: 0,
    requestsTrend: 'up' as 'up' | 'down' | 'stable',
    deviceAssignmentsThisMonth: 0,
    
    // IT Support Metrics
    itSupportRequests: 0,
    deviceRequests: 0,
    avgITResponseTime: '0',
    avgDeviceResponseTime: '0',
    urgentRequestsCount: 0,
    
    // Recent Activity
    recentActivity: [] as any[],
  });

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);

    // OPTIMIZED: Fetch all data in parallel with only needed fields
    const [devicesResult, usersResult, requestsResult, assignmentsResult] = await Promise.all([
      supabase.from('devices').select('id, name, type, status, assigned_to, purchase_date, warranty_expiry'),
      supabase.from('users').select('id, full_name, department, is_active'),
      supabase.from('requests').select('id, user_id, request_type, status, priority, created_at, resolved_at, user:users!requests_user_id_fkey(full_name, department)'),
      supabase.from('assignments').select('id, device_id, user_id, assigned_date, return_date, created_at').order('created_at', { ascending: false })
    ]);

    const { data: devices } = devicesResult;
    const { data: users } = usersResult;
    const { data: requests } = requestsResult;
    const { data: assignments } = assignmentsResult;

    if (devices && users && requests) {
      // ===== CORE DEVICE METRICS =====
      const assigned = devices.filter((d: any) => d.status === 'assigned').length;
      const available = devices.filter((d: any) => d.status === 'available').length;
      const maintenance = devices.filter((d: any) => d.status === 'maintenance').length;
      const utilization = devices.length > 0 ? (assigned / devices.length) * 100 : 0;

      // ===== USER METRICS =====
      const activeUsers = users.filter((u: any) => u.is_active).length;
      const inactiveUsers = users.filter((u: any) => !u.is_active).length;

      // Users with and without devices
      const usersWithDevices = users.filter((u: any) => 
        devices.some((d: any) => d.assigned_to === u.id)
      ).length;
      const usersWithoutDevices = activeUsers - usersWithDevices;

      // Average devices per user
      const avgDevicesPerUser = usersWithDevices > 0 ? assigned / usersWithDevices : 0;

      // Top users by device count
      const userDeviceCounts = users.map((user: any) => ({
        name: user.full_name,
        department: user.department,
        deviceCount: devices.filter((d: any) => d.assigned_to === user.id).length,
      }))
      .filter((u: any) => u.deviceCount > 0)
      .sort((a: any, b: any) => b.deviceCount - a.deviceCount)
      .slice(0, 5);

      // ===== REQUEST METRICS =====
      const pending = requests.filter((r: any) => r.status === 'pending').length;
      const completed = requests.filter((r: any) => r.status === 'completed').length;
      const approved = requests.filter((r: any) => r.status === 'approved').length;
      const rejected = requests.filter((r: any) => r.status === 'rejected').length;
      const urgentRequests = requests.filter((r: any) => r.priority === 'urgent').length;

      // Resolution rate
      const resolutionRate = requests.length > 0 
        ? ((completed + rejected) / requests.length) * 100 
        : 0;

      // IT Support vs Device Requests
      const itSupport = requests.filter((r: any) => r.request_type === 'it_support').length;
      const deviceReq = requests.filter((r: any) => r.request_type === 'device_request').length;

      // ===== RESPONSE TIME CALCULATIONS =====
      const completedWithTime = requests.filter((r: any) => 
        (r.status === 'completed' || r.status === 'closed') && r.resolved_at
      );
      
      let avgTime = '0 days';
      let avgITTime = '0 days';
      let avgDeviceTime = '0 days';

      if (completedWithTime.length > 0) {
        // Overall average
        const totalHours = completedWithTime.reduce((sum: number, req: any) => {
          const created = new Date(req.created_at).getTime();
          const resolved = new Date(req.resolved_at).getTime();
          return sum + ((resolved - created) / (1000 * 60 * 60));
        }, 0);
        const avgHours = totalHours / completedWithTime.length;
        avgTime = formatTime(avgHours);

        // IT Support average
        const itCompleted = completedWithTime.filter((r: any) => r.request_type === 'it_support');
        if (itCompleted.length > 0) {
          const itHours = itCompleted.reduce((sum: number, req: any) => {
            const created = new Date(req.created_at).getTime();
            const resolved = new Date(req.resolved_at).getTime();
            return sum + ((resolved - created) / (1000 * 60 * 60));
          }, 0);
          avgITTime = formatTime(itHours / itCompleted.length);
        }

        // Device Request average
        const deviceCompleted = completedWithTime.filter((r: any) => r.request_type === 'device_request');
        if (deviceCompleted.length > 0) {
          const deviceHours = deviceCompleted.reduce((sum: number, req: any) => {
            const created = new Date(req.created_at).getTime();
            const resolved = new Date(req.resolved_at).getTime();
            return sum + ((resolved - created) / (1000 * 60 * 60));
          }, 0);
          avgDeviceTime = formatTime(deviceHours / deviceCompleted.length);
        }
      }

      // ===== DEVICE AGE ANALYSIS =====
      const now = new Date().getTime();
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      const deviceAge = {
        new: 0,      // < 1 year
        recent: 0,   // 1-2 years
        old: 0,      // 2-3 years
        veryOld: 0,  // > 3 years
      };

      devices.forEach((device: any) => {
        const purchaseDate = new Date(device.purchase_date).getTime();
        const age = (now - purchaseDate) / oneYear;
        
        if (age < 1) deviceAge.new++;
        else if (age < 2) deviceAge.recent++;
        else if (age < 3) deviceAge.old++;
        else deviceAge.veryOld++;
      });

      // ===== WARRANTY STATUS =====
      const fourYearsAgo = new Date();
      fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

      const warrantyStatus = {
        inWarranty: 0,
        expiringSoon: 0,
        expired: 0,
        noWarranty: 0,
      };

      devices.forEach((device: any) => {
        if (!device.warranty_expiry) {
          warrantyStatus.noWarranty++;
        } else {
          const warrantyDate = new Date(device.warranty_expiry);
          const today = new Date();
          
          if (warrantyDate < today) {
            warrantyStatus.expired++;
          } else if (warrantyDate <= sixtyDaysFromNow) {
            warrantyStatus.expiringSoon++;
          } else {
            warrantyStatus.inWarranty++;
          }
        }
      });

      // ===== DEVICES BY TYPE WITH PERCENTAGES =====
      const typeCount: { [key: string]: number } = {};
      devices.forEach((d: any) => {
        typeCount[d.type] = (typeCount[d.type] || 0) + 1;
      });
      const devicesByType = Object.entries(typeCount)
        .map(([type, count]) => ({ 
          type, 
          count: count as number,
          percentage: Math.round((count as number / devices.length) * 100)
        }))
        .sort((a, b) => b.count - a.count);

      // ===== DEVICES BY STATUS WITH PERCENTAGES =====
      const statusCount: { [key: string]: number } = {};
      devices.forEach((d: any) => {
        statusCount[d.status] = (statusCount[d.status] || 0) + 1;
      });
      const devicesByStatus = Object.entries(statusCount).map(([status, count]) => ({
        status,
        count: count as number,
        percentage: Math.round((count as number / devices.length) * 100)
      }));

      // ===== DEVICES BY DEPARTMENT =====
      const deptCount: { [key: string]: { devices: number; users: Set<string> } } = {};
      devices.forEach((d: any) => {
        if (d.assigned_to) {
          const user = users.find((u: any) => u.id === d.assigned_to);
          if (user) {
            if (!deptCount[user.department]) {
              deptCount[user.department] = { devices: 0, users: new Set() };
            }
            deptCount[user.department].devices++;
            deptCount[user.department].users.add(user.id);
          }
        }
      });
      const devicesByDepartment = Object.entries(deptCount)
        .map(([department, data]) => ({ 
          department, 
          count: data.devices,
          users: data.users.size
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // ===== REQUESTS BY TYPE, PRIORITY, STATUS =====
      const reqTypeCount: { [key: string]: number } = {};
      requests.forEach((r: any) => {
        const type = r.request_type === 'device_request' ? 'Device Request' : 'IT Support';
        reqTypeCount[type] = (reqTypeCount[type] || 0) + 1;
      });
      const requestsByType = Object.entries(reqTypeCount).map(([type, count]) => ({
        type,
        count: count as number,
      }));

      const priorityCount: { [key: string]: number } = {};
      requests.forEach((r: any) => {
        priorityCount[r.priority] = (priorityCount[r.priority] || 0) + 1;
      });
      const requestsByPriority = Object.entries(priorityCount).map(([priority, count]) => ({
        priority,
        count: count as number,
      }));

      const reqStatusCount: { [key: string]: number } = {};
      requests.forEach((r: any) => {
        reqStatusCount[r.status] = (reqStatusCount[r.status] || 0) + 1;
      });
      const requestsByStatus = Object.entries(reqStatusCount).map(([status, count]) => ({
        status,
        count: count as number,
      }));

      // ===== TIME-BASED ANALYTICS =====
      const now2 = new Date();
      const weekAgo = new Date(now2.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now2.getTime() - 14 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now2.getTime() - 30 * 24 * 60 * 60 * 1000);

      const requestsThisWeek = requests.filter((r: any) => 
        new Date(r.created_at) >= weekAgo
      ).length;
      
      const requestsLastWeek = requests.filter((r: any) => {
        const date = new Date(r.created_at);
        return date >= twoWeeksAgo && date < weekAgo;
      }).length;

      const requestsTrend = requestsThisWeek > requestsLastWeek ? 'up' : 
                           requestsThisWeek < requestsLastWeek ? 'down' : 'stable';

      const deviceAssignmentsThisMonth = assignments ? 
        assignments.filter((a: any) => new Date(a.created_at) >= monthAgo).length : 0;

      // ===== PERFORMANCE KPIs =====
      const stockAvailability = devices.length > 0 ? (available / devices.length) * 100 : 0;
      const maintenanceRate = devices.length > 0 ? (maintenance / devices.length) * 100 : 0;

      // Critical stock (less than 3 available)
      const availableByType: { [key: string]: number } = {};
      devices.filter((d: any) => d.status === 'available').forEach((d: any) => {
        availableByType[d.type] = (availableByType[d.type] || 0) + 1;
      });
      const criticalStockTypes = Object.entries(availableByType)
        .filter(([_, count]) => count < 3)
        .map(([type]) => type);

      // Recent activity
      const recentActivity = requests
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setAnalytics({
        totalDevices: devices.length,
        assignedDevices: assigned,
        availableDevices: available,
        maintenanceDevices: maintenance,
        utilizationRate: Math.round(utilization),
        totalUsers: users.length,
        activeUsers,
        inactiveUsers,
        totalRequests: requests.length,
        pendingRequests: pending,
        completedRequests: completed,
        approvedRequests: approved,
        rejectedRequests: rejected,
        avgResponseTime: avgTime,
        requestResolutionRate: Math.round(resolutionRate),
        devicesByType,
        devicesByStatus,
        devicesByDepartment,
        deviceAge,
        warrantyStatus,
        requestsByType,
        requestsByPriority,
        requestsByStatus,
        requestTrends: [],
        usersWithDevices,
        usersWithoutDevices,
        avgDevicesPerUser: Math.round(avgDevicesPerUser * 10) / 10,
        topUsers: userDeviceCounts,
        deviceTurnoverRate: 0,
        stockAvailability: Math.round(stockAvailability),
        criticalStockTypes,
        maintenanceRate: Math.round(maintenanceRate * 10) / 10,
        requestsThisWeek,
        requestsLastWeek,
        requestsTrend,
        deviceAssignmentsThisMonth,
        itSupportRequests: itSupport,
        deviceRequests: deviceReq,
        avgITResponseTime: avgITTime,
        avgDeviceResponseTime: avgDeviceTime,
        urgentRequestsCount: urgentRequests,
        recentActivity,
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatTime = (hours: number): string => {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${remainingHours}h`;
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="ml-20 flex-1 min-h-screen p-8 transition-all duration-300">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 dark:border-green-400"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">Loading comprehensive analytics...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-20 flex-1 min-h-screen p-8 transition-all duration-300">
        <PageHeader
          title="Analytics & Insights"
          description="Comprehensive data-driven insights for better decision making"
        />

        {/* Primary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Monitor className="w-10 h-10" />
              <span className="text-4xl font-bold">{analytics.totalDevices}</span>
            </div>
            <p className="text-blue-100 text-sm font-medium mb-2">Total Devices</p>
            <div className="flex items-center text-xs">
              <CheckCircle className="w-4 h-4 mr-1" />
              {analytics.assignedDevices} assigned ({analytics.utilizationRate}%)
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-10 h-10" />
              <span className="text-4xl font-bold">{analytics.utilizationRate}%</span>
            </div>
            <p className="text-green-100 text-sm font-medium mb-2">Utilization Rate</p>
            <div className="w-full bg-green-400 bg-opacity-30 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all"
                style={{ width: `${analytics.utilizationRate}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-10 h-10" />
              <span className="text-4xl font-bold">{analytics.totalUsers}</span>
            </div>
            <p className="text-purple-100 text-sm font-medium mb-2">Total Users</p>
            <div className="flex items-center text-xs">
              <CheckCircle className="w-4 h-4 mr-1" />
              {analytics.activeUsers} active • {analytics.usersWithDevices} with devices
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="w-10 h-10" />
              <span className="text-4xl font-bold">{analytics.totalRequests}</span>
            </div>
            <p className="text-orange-100 text-sm font-medium mb-2">Total Requests</p>
            <div className="flex items-center text-xs">
              <Clock className="w-4 h-4 mr-1" />
              {analytics.pendingRequests} pending • {analytics.urgentRequestsCount} urgent
            </div>
          </div>
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-4">
            <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.availableDevices}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Available Stock</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">{analytics.stockAvailability}% Ready</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-4">
            <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.avgDevicesPerUser}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Avg Devices/User</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">Among active users</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-4">
            <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.avgResponseTime}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Avg Response Time</p>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">{analytics.requestResolutionRate}% Resolved</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-4">
            <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.requestsThisWeek}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Requests This Week</p>
            <div className="flex items-center mt-1">
              {analytics.requestsTrend === 'up' ? (
                <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400 mr-1" />
              ) : analytics.requestsTrend === 'down' ? (
                <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
              ) : null}
              <p className="text-xs text-gray-600 dark:text-gray-400">vs {analytics.requestsLastWeek} last week</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-4">
            <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.warrantyStatus.inWarranty}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Under Warranty</p>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-1">{analytics.warrantyStatus.expiringSoon} expiring soon</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-4">
            <Box className="w-6 h-6 text-red-600 dark:text-red-400 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.criticalStockTypes.length}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Critical Stock</p>
            <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">Types with &lt;3 units</p>
          </div>
        </div>

        {/* Device Age Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Device Age Distribution
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">New (&lt; 1 year)</span>
                  <span className="text-gray-900 dark:text-white font-bold">{analytics.deviceAge.new}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div className="bg-green-500 dark:bg-green-600 h-3 rounded-full" style={{ width: `${(analytics.deviceAge.new / analytics.totalDevices) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Recent (1-2 years)</span>
                  <span className="text-gray-900 dark:text-white font-bold">{analytics.deviceAge.recent}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div className="bg-blue-500 dark:bg-blue-600 h-3 rounded-full" style={{ width: `${(analytics.deviceAge.recent / analytics.totalDevices) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Old (2-3 years)</span>
                  <span className="text-gray-900 dark:text-white font-bold">{analytics.deviceAge.old}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div className="bg-yellow-500 dark:bg-yellow-600 h-3 rounded-full" style={{ width: `${(analytics.deviceAge.old / analytics.totalDevices) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Very Old (&gt; 3 years)</span>
                  <span className="text-gray-900 dark:text-white font-bold">{analytics.deviceAge.veryOld}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div className="bg-red-500 dark:bg-red-600 h-3 rounded-full" style={{ width: `${(analytics.deviceAge.veryOld / analytics.totalDevices) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
              Warranty Status Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">In Warranty</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{analytics.warrantyStatus.inWarranty}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{Math.round((analytics.warrantyStatus.inWarranty / analytics.totalDevices) * 100)}% of devices</p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expiring Soon</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{analytics.warrantyStatus.expiringSoon}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Within 60 days</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expired</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{analytics.warrantyStatus.expired}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Out of warranty</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">No Warranty</p>
                <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">{analytics.warrantyStatus.noWarranty}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Not tracked</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Devices by Type */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Devices by Type
            </h3>
            <div className="space-y-3">
              {analytics.devicesByType.map((item, index) => (
                <div key={item.type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300 font-medium flex items-center">
                      <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold mr-2">
                        {index + 1}
                      </span>
                      {item.type}
                    </span>
                    <span className="text-gray-900 dark:text-white font-bold">{item.count} ({item.percentage}%)</span>
                  </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-blue-500 dark:bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Devices by Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
              Devices by Status
            </h3>
            <div className="space-y-3">
              {analytics.devicesByStatus.map((item) => (
                <div key={item.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300 font-medium capitalize">{item.status}</span>
                    <span className="text-gray-900 dark:text-white font-bold">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        item.status === 'assigned'
                          ? 'bg-green-500 dark:bg-green-600'
                          : item.status === 'available'
                          ? 'bg-blue-500 dark:bg-blue-600'
                          : 'bg-yellow-500 dark:bg-yellow-600'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Request Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
              Request Types
            </h3>
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Device Requests</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analytics.deviceRequests}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg: {analytics.avgDeviceResponseTime}</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">IT Support</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{analytics.itSupportRequests}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg: {analytics.avgITResponseTime}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
              Request Priority
            </h3>
            <div className="space-y-2">
              {analytics.requestsByPriority.map((item) => (
                <div key={item.priority} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className={`text-sm font-medium capitalize px-2 py-1 rounded ${
                    item.priority === 'urgent' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                    item.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                    item.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {item.priority}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
              Request Status
            </h3>
            <div className="space-y-2">
              {analytics.requestsByStatus.map((item) => (
                <div key={item.status} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{item.status.replace('_', ' ')}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{item.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Resolution Rate</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{analytics.requestResolutionRate}%</p>
            </div>
          </div>
        </div>

        {/* Department & Top Users */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
              Top 10 Departments by Device Count
            </h3>
            <div className="space-y-3">
              {analytics.devicesByDepartment.map((item, index) => (
                <div key={item.department} className="flex items-center">
                  <span className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm mr-3">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{item.department}</span>
                      <span className="text-gray-900 dark:text-white font-bold">{item.count} devices • {item.users} users</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-purple-500 dark:bg-purple-600 h-2 rounded-full" style={{ width: `${(item.count / analytics.totalDevices) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
              Top 5 Users by Device Count
            </h3>
            <div className="space-y-3">
              {analytics.topUsers.map((user, index) => (
                <div key={user.name} className="flex items-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mr-3 ${
                    index === 0 ? 'bg-yellow-400 dark:bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-300 dark:bg-gray-600 text-white' :
                    index === 2 ? 'bg-orange-400 dark:bg-orange-500 text-white' :
                    'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{user.department}</p>
                  </div>
                  <span className="text-xl font-bold text-orange-600 dark:text-orange-400">{user.deviceCount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        {analytics.criticalStockTypes.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-red-900 dark:text-red-300 mb-2">⚠️ Critical Stock Alert</h3>
                <p className="text-sm text-red-700 dark:text-red-400 mb-2">
                  The following device types have critically low stock (less than 3 units available):
                </p>
                <div className="flex flex-wrap gap-2">
                  {analytics.criticalStockTypes.map((type) => (
                    <span key={type} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-sm font-semibold">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-2">
            {analytics.recentActivity.slice(0, 8).map((activity: any) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.priority === 'urgent'
                        ? 'bg-red-500'
                        : activity.priority === 'high'
                        ? 'bg-orange-500'
                        : activity.priority === 'medium'
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    }`}
                  ></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.user?.full_name} • {activity.user?.department}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    activity.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    activity.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  }`}>
                    {activity.status}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsPage;
