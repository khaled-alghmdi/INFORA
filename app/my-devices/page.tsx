'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import { Package, Laptop, Sunrise, Sun, Sunset, Moon, FileText, AlertTriangle, ExternalLink } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';

type Device = {
  id: string;
  name: string;
  type: string;
  barcode: string | null;
  asset_number: string | null;
  serial_number: string;
  status: string;
  assigned_date: string | null;
  purchase_date: string;
  warranty_expiry: string | null;
  specifications: string | null;
};

const MyDevicesPage = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myDevices, setMyDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      fetchMyDevices(user.id);
    }
  }, []);

  const fetchMyDevices = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('devices')
      .select('*')
      .eq('assigned_to', userId)
      .order('assigned_date', { ascending: false });

    if (data) {
      // FILTER: Only show Laptop and Monitor devices
      const filteredDevices = data.filter(
        (device) => device.type === 'Laptop' || device.type === 'Monitor'
      );
      setMyDevices(filteredDevices);
    }
    setLoading(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else if (hour >= 17 && hour < 22) {
      return 'Good Evening';
    } else {
      return 'Good Night';
    }
  };

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return <Sunrise className="w-8 h-8 text-orange-500" />;
    } else if (hour >= 12 && hour < 17) {
      return <Sun className="w-8 h-8 text-yellow-500" />;
    } else if (hour >= 17 && hour < 22) {
      return <Sunset className="w-8 h-8 text-orange-600" />;
    } else {
      return <Moon className="w-8 h-8 text-indigo-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="ml-20 flex-1 min-h-screen p-8 transition-all duration-300">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 dark:border-green-400"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">Loading your devices...</p>
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
          title={`${getGreeting()}, ${currentUser?.full_name || 'User'}!`}
          description="View and manage your assigned devices"
          icon={getGreetingIcon()}
        />

        {/* Summary Card */}
        <div className="grid grid-cols-1 mb-8">
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-2">Total Devices Assigned</p>
                <span className="text-5xl font-bold">{myDevices.length}</span>
              </div>
              <Package className="w-20 h-20 opacity-50" />
            </div>
          </div>
        </div>

        {/* My Devices Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Package className="w-6 h-6 mr-2 text-green-600 dark:text-green-400" />
            My Assigned Devices ({myDevices.length})
          </h2>

          {myDevices.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Devices Assigned</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">You don&apos;t have any devices assigned to you yet.</p>
              <p className="text-sm text-gray-500">Contact your IT department to request a device assignment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myDevices.map((device) => (
                <div key={device.id} className="p-4 border-2 border-gray-200 dark:border-gray-700 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg hover:border-green-400 transition-all hover:shadow-md">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Laptop className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <h3 className="font-bold text-gray-900 dark:text-white">{device.name}</h3>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                      {device.type}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {device.asset_number && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Asset:</span> <span className="font-mono">{device.asset_number}</span>
                      </p>
                    )}
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Serial:</span> <span className="font-mono text-xs">{device.serial_number}</span>
                    </p>
                    {device.specifications && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Specs:</span> {device.specifications}
                      </p>
                    )}
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Assigned:</span> {new Date(device.assigned_date || '').toLocaleDateString()}
                    </p>
                    {device.warranty_expiry && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Warranty:</span> {new Date(device.warranty_expiry).toLocaleDateString()}
                      </p>
                    )}
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

export default MyDevicesPage;

