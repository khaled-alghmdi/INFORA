'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import { Activity, Search, Filter, Download, User, Monitor, AlertCircle, CheckCircle, XCircle, UserPlus, UserMinus } from 'lucide-react';

type ActivityLog = {
  id: string;
  action: string;
  user: string;
  entity: string;
  description: string;
  timestamp: string;
  type: 'device' | 'user' | 'request' | 'system';
};

const ActivityLogPage = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [activities, searchTerm, typeFilter]);

  const fetchActivities = async () => {
    setLoading(true);
    const activityList: ActivityLog[] = [];

    // Fetch device assignments from assignments table
    const { data: assignments } = await supabase
      .from('assignments')
      .select('*, device:devices(name), user:users(full_name)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (assignments) {
      assignments.forEach((assignment: any) => {
        activityList.push({
          id: assignment.id,
          action: assignment.return_date ? 'Device Unassigned' : 'Device Assigned',
          user: assignment.user?.full_name || 'Unknown',
          entity: assignment.device?.name || 'Unknown Device',
          description: assignment.return_date
            ? `Device returned by ${assignment.user?.full_name}`
            : `Device assigned to ${assignment.user?.full_name}`,
          timestamp: assignment.created_at,
          type: 'device',
        });
      });
    }

    // Fetch recent device changes
    const { data: devices } = await supabase
      .from('devices')
      .select('*, users!devices_assigned_to_fkey(full_name)')
      .order('updated_at', { ascending: false })
      .limit(30);

    if (devices) {
      devices.forEach((device: any) => {
        if (device.updated_at !== device.created_at) {
          activityList.push({
            id: `device-${device.id}`,
            action: 'Device Updated',
            user: 'System',
            entity: device.name,
            description: `Device "${device.name}" status changed to ${device.status}`,
            timestamp: device.updated_at,
            type: 'device',
          });
        }
      });
    }

    // Fetch recent requests
    const { data: requests } = await supabase
      .from('requests')
      .select('*, user:users!requests_user_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(30);

    if (requests) {
      requests.forEach((request: any) => {
        activityList.push({
          id: `request-${request.id}`,
          action: `Request ${request.status}`,
          user: request.user?.full_name || 'Unknown',
          entity: request.title,
          description: `${request.request_type === 'device_request' ? 'Device request' : 'IT support'}: ${request.title}`,
          timestamp: request.updated_at || request.created_at,
          type: 'request',
        });
      });
    }

    // Fetch recent users
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (users) {
      users.forEach((user: any) => {
        if (new Date(user.created_at).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000) {
          activityList.push({
            id: `user-${user.id}`,
            action: 'User Created',
            user: 'Admin',
            entity: user.full_name,
            description: `New user "${user.full_name}" added to ${user.department}`,
            timestamp: user.created_at,
            type: 'user',
          });
        }
      });
    }

    // Sort all activities by timestamp
    activityList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setActivities(activityList);
    setLoading(false);
  };

  const filterActivities = () => {
    let filtered = [...activities];

    if (searchTerm) {
      filtered = filtered.filter(
        (activity) =>
          activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((activity) => activity.type === typeFilter);
    }

    setFilteredActivities(filtered);
  };

  const getActivityIcon = (action: string) => {
    if (action.includes('Assigned')) return <UserPlus className="w-5 h-5 text-green-600" />;
    if (action.includes('Unassigned')) return <UserMinus className="w-5 h-5 text-orange-600" />;
    if (action.includes('Created')) return <CheckCircle className="w-5 h-5 text-blue-600" />;
    if (action.includes('Updated')) return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    if (action.includes('Deleted')) return <XCircle className="w-5 h-5 text-red-600" />;
    if (action.includes('pending')) return <AlertCircle className="w-5 h-5 text-orange-600" />;
    if (action.includes('completed')) return <CheckCircle className="w-5 h-5 text-green-600" />;
    return <Activity className="w-5 h-5 text-gray-600" />;
  };

  const getActivityColor = (action: string) => {
    if (action.includes('Assigned')) return 'bg-green-50 border-green-200';
    if (action.includes('Unassigned')) return 'bg-orange-50 border-orange-200';
    if (action.includes('Created')) return 'bg-blue-50 border-blue-200';
    if (action.includes('Updated')) return 'bg-yellow-50 border-yellow-200';
    if (action.includes('Deleted')) return 'bg-red-50 border-red-200';
    if (action.includes('completed')) return 'bg-green-50 border-green-200';
    return 'bg-gray-50 border-gray-200';
  };

  const exportToCSV = () => {
    const headers = ['Action', 'User', 'Entity', 'Description', 'Timestamp'];
    const rows = filteredActivities.map((activity) => [
      activity.action,
      activity.user,
      activity.entity,
      activity.description,
      new Date(activity.timestamp).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 bg-gray-50 min-h-screen p-8">
        <PageHeader
          title="Activity Log"
          description="Track all system activities and changes"
          action={
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
            >
              <Download className="w-5 h-5" />
              <span>Export CSV</span>
            </button>
          }
        />

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
            >
              <option value="all" className="text-gray-900">All Activities</option>
              <option value="device" className="text-gray-900">Device Activities</option>
              <option value="user" className="text-gray-900">User Activities</option>
              <option value="request" className="text-gray-900">Request Activities</option>
              <option value="system" className="text-gray-900">System Activities</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <Activity className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">{filteredActivities.length}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Total Activities</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <Monitor className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">
                {filteredActivities.filter((a) => a.type === 'device').length}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Device Activities</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <User className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900">
                {filteredActivities.filter((a) => a.type === 'user').length}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">User Activities</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <AlertCircle className="w-8 h-8 text-orange-600" />
              <span className="text-2xl font-bold text-gray-900">
                {filteredActivities.filter((a) => a.type === 'request').length}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Request Activities</p>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Activity Timeline</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              <p className="mt-4 text-gray-600">Loading activities...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No activities found</h3>
              <p className="text-gray-600">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className={`p-4 rounded-lg border ${getActivityColor(activity.action)} transition-all hover:shadow-md`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4">{getActivityIcon(activity.action)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{activity.action}</h3>
                          <p className="text-sm text-gray-700 mt-1">{activity.description}</p>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                        <span className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {activity.user}
                        </span>
                        <span className="flex items-center">
                          <Monitor className="w-3 h-3 mr-1" />
                          {activity.entity}
                        </span>
                        <span className="px-2 py-1 bg-white rounded text-xs font-medium">
                          {activity.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ActivityLogPage;

