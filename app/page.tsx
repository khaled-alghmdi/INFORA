'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import StatsCard from '@/components/StatsCard';
import { Monitor, Users, Package, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type DashboardStats = {
  totalDevices: number;
  assignedDevices: number;
  availableDevices: number;
  maintenanceDevices: number;
  totalUsers: number;
  activeUsers: number;
};

type DeviceByType = {
  name: string;
  count: number;
};

const Dashboard = () => {
  const router = useRouter();
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalDevices: 0,
    assignedDevices: 0,
    availableDevices: 0,
    maintenanceDevices: 0,
    totalUsers: 0,
    activeUsers: 0,
  });

  const [devicesByType, setDevicesByType] = useState<DeviceByType[]>([]);
  const [devicesByStatus, setDevicesByStatus] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUserData(user);
    
    // Redirect non-admin users to My Devices page
    if (user && user.role !== 'admin') {
      router.push('/my-devices');
      return;
    }
  }, [router]);

  useEffect(() => {
    // Only fetch admin dashboard data if user is admin
    if (currentUserData?.role === 'admin') {
      fetchDashboardData();
    }
  }, [currentUserData]);

  const fetchDashboardData = async () => {
      // OPTIMIZED: Fetch devices and users in parallel
      const [devicesResult, usersResult] = await Promise.all([
        supabase.from('devices').select('type, status'),
        supabase.from('users').select('is_active')
      ]);

      const { data: devices } = devicesResult;
      const { data: users } = usersResult;

      if (devices) {
        const totalDevices = devices.length;
        const assignedDevices = devices.filter((d) => d.status === 'assigned').length;
        const availableDevices = devices.filter((d) => d.status === 'available').length;
        const maintenanceDevices = devices.filter((d) => d.status === 'maintenance').length;

        setStats({
          totalDevices,
          assignedDevices,
          availableDevices,
          maintenanceDevices,
          totalUsers: users?.length || 0,
          activeUsers: users?.filter((u) => u.is_active).length || 0,
        });

        // Group devices by type
        const typeGroups = devices.reduce((acc: { [key: string]: number }, device) => {
          acc[device.type] = (acc[device.type] || 0) + 1;
          return acc;
        }, {});

        setDevicesByType(
          Object.entries(typeGroups).map(([name, count]) => ({ name, count }))
        );

        // Group devices by status
        setDevicesByStatus([
          { name: 'Available', value: availableDevices },
          { name: 'Assigned', value: assignedDevices },
          { name: 'Maintenance', value: maintenanceDevices },
        ]);
      }
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen p-8 relative overflow-hidden">
        <div className="relative z-10">
        <PageHeader
          title="Dashboard"
          description="Overview of IT device inventory and analytics"
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Devices"
            value={stats.totalDevices}
            icon={Monitor}
            trend="+5% from last month"
            trendUp={true}
          />
          <StatsCard
            title="Assigned Devices"
            value={stats.assignedDevices}
            icon={Package}
            trend="+12% from last month"
            trendUp={true}
          />
          <StatsCard
            title="Available Devices"
            value={stats.availableDevices}
            icon={Package}
          />
          <StatsCard
            title="Maintenance"
            value={stats.maintenanceDevices}
            icon={AlertTriangle}
            trend="-2% from last month"
            trendUp={false}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart - Devices by Type */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elegant-lg p-6 card-hover animate-fade-in border-2 border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Devices by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={devicesByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="url(#colorBar)" />
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart - Devices by Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elegant-lg p-6 card-hover animate-fade-in border-2 border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Devices by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={devicesByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {devicesByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Users Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elegant-lg p-6 card-hover animate-fade-in border-2 border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Statistics</h3>
              <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-2 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total Users</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Active Users</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Inactive Users</span>
                <span className="text-2xl font-bold text-red-600">
                  {stats.totalUsers - stats.activeUsers}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elegant-lg p-6 card-hover animate-fade-in border-2 border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <span className="w-2 h-8 bg-gradient-to-b from-green-600 to-emerald-700 rounded-full"></span>
              <span>Quick Actions</span>
            </h3>
            <div className="flex flex-col gap-3">
              <Link
                href="/devices?action=add"
                className="group relative block w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] overflow-hidden text-center"
                aria-label="Add a new device"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative font-semibold">Add New Device</span>
              </Link>
              <Link
                href="/devices?action=assign"
                className="group relative block w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] overflow-hidden text-center"
                aria-label="Assign an existing device"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative font-semibold">Assign Device</span>
              </Link>
              <Link
                href="/reports"
                className="group relative block w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] overflow-hidden text-center"
                aria-label="Generate reports"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative font-semibold">Generate Report</span>
              </Link>
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

