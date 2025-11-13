'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import { Scan, CheckCircle, XCircle, User, Package, Zap, AlertCircle, Monitor, Search } from 'lucide-react';

type Device = {
  id: string;
  name: string;
  type: string;
  barcode: string | null;
  asset_number: string | null;
  serial_number: string;
  status: string;
  assigned_to: string | null;
  assigned_date: string | null;
  purchase_date: string;
  specifications: string | null;
  users?: {
    full_name: string;
    email: string;
    department: string;
  };
};

type UserData = {
  id: string;
  employee_id: string | null;
  full_name: string;
  email: string;
  department: string;
  role: string;
  is_active: boolean;
  devices: any[];
  requests: any[];
  totalDevices: number;
  totalRequests: number;
};

type UserSearchResult = {
  id: string;
  employee_id: string | null;
  full_name: string;
  email: string;
  department: string;
  role: string;
  is_active: boolean;
};

const ScanPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<'device' | 'user'>('device');
  const [device, setDevice] = useState<Device | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    barcode: '',
    asset_number: '',
    serial_number: '',
    status: 'available',
    purchase_date: '',
    warranty_expiry: '',
    specifications: '',
  });
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUsers();
    // Auto-focus on search input
    searchInputRef.current?.focus();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email, department')
      .eq('is_active', true)
      .order('full_name');

    if (data) {
      setUsers(data);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setScanning(true);
    setMessage(null);
    setDevice(null);
    setUserData(null);
    setUserSearchResults([]);

    if (searchMode === 'device') {
      // Search for device by barcode, asset_number, or serial_number
      const { data, error } = await supabase
        .from('devices')
        .select('*, users!devices_assigned_to_fkey(full_name, email, department)')
        .or(`barcode.eq.${searchTerm},asset_number.eq.${searchTerm},serial_number.eq.${searchTerm}`)
        .single();

      if (error || !data) {
        setScannedBarcode(searchTerm);
        setMessage({ 
          type: 'info', 
          text: 'Device not found in system. Would you like to add it?' 
        });
        setScanning(false);
        return;
      }

      setDevice(data);
      setMessage({ type: 'success', text: `Device found: ${data.name}` });
      
      // Add to scan history
      setScanHistory(prev => [{
        device: data.name,
        barcode: searchTerm,
        timestamp: new Date().toISOString(),
        status: data.status,
      }, ...prev.slice(0, 9)]);

    } else {
      // Search for user by multiple criteria
      let usersFound: any[] = [];
      
      // Try exact match on employee_id first
      const { data: byEmployeeId } = await supabase
        .from('users')
        .select('*')
        .eq('employee_id', searchTerm);
      
      if (byEmployeeId && byEmployeeId.length > 0) {
        usersFound = byEmployeeId;
      } else {
        // Try other fields with partial matching
        const { data: byOtherFields } = await supabase
          .from('users')
          .select('*')
          .or(`id.eq.${searchTerm},full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%`);
        
        if (byOtherFields && byOtherFields.length > 0) {
          usersFound = byOtherFields;
        }
      }

      if (usersFound.length === 0) {
        setMessage({ 
          type: 'error', 
          text: 'User not found in system. Please check and try again.' 
        });
        setScanning(false);
        return;
      }

      // If multiple users found, show selection list
      if (usersFound.length > 1) {
        setUserSearchResults(usersFound);
        setMessage({ 
          type: 'success', 
          text: `Found ${usersFound.length} matching users. Select one to view details.` 
        });
        setScanning(false);
        return;
      }

      // If only one user found, load their full data
      const foundUser = usersFound[0];
      await loadUserDetails(foundUser.id);
    }

    setScanning(false);
  };

  const loadUserDetails = async (userId: string) => {
    setScanning(true);
    
    // Fetch user data
    const { data: foundUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!foundUser) {
      setMessage({ 
        type: 'error', 
        text: 'Error loading user details.' 
      });
      setScanning(false);
      return;
    }

    // Fetch user's devices
    const { data: userDevices } = await supabase
      .from('devices')
      .select('*')
      .eq('assigned_to', foundUser.id);

    // FILTER: Only show Laptop and Monitor devices
    const filteredDevices = (userDevices || []).filter(
      (device: any) => device.type === 'Laptop' || device.type === 'Monitor'
    );

    // Fetch user's requests
    const { data: userRequests } = await supabase
      .from('requests')
      .select('*')
      .eq('user_id', foundUser.id)
      .order('created_at', { ascending: false });

    const completeUserData: UserData = {
      ...foundUser,
      devices: filteredDevices,
      requests: userRequests || [],
      totalDevices: filteredDevices.length,
      totalRequests: userRequests?.length || 0,
    };

    setUserData(completeUserData);
    setUserSearchResults([]); // Clear search results
    setMessage({ 
      type: 'success', 
      text: `User found: ${foundUser.full_name}` 
    });

    // Add to search history
    setScanHistory(prev => [{
      device: foundUser.full_name,
      barcode: searchTerm,
      timestamp: new Date().toISOString(),
      status: foundUser.is_active ? 'active' : 'inactive',
    }, ...prev.slice(0, 9)]);

    setScanning(false);
  };

  const openAddDeviceModal = () => {
    setFormData({
      name: '',
      type: '',
      barcode: scannedBarcode,
      asset_number: '',
      serial_number: '',
      status: 'available',
      purchase_date: '',
      warranty_expiry: '',
      specifications: '',
    });
    setShowAddDeviceModal(true);
  };

  const handleAddDevice = async () => {
    if (!formData.name || !formData.type || !formData.serial_number || !formData.purchase_date) {
      alert('Please fill in all required fields (Name, Type, Serial Number, Purchase Date)');
      return;
    }

    const { error } = await supabase.from('devices').insert([formData]);

    if (!error) {
      setShowAddDeviceModal(false);
      setMessage({ type: 'success', text: 'Device added successfully!' });
      resetForm();
      resetScan();
      
      // Add to scan history
      setScanHistory(prev => [{
        device: formData.name,
        barcode: formData.barcode,
        timestamp: new Date().toISOString(),
        status: 'available',
      }, ...prev.slice(0, 9)]);
    } else {
      alert('Error adding device. Please check if barcode or serial number already exists.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      barcode: '',
      asset_number: '',
      serial_number: '',
      status: 'available',
      purchase_date: '',
      warranty_expiry: '',
      specifications: '',
    });
  };

  const handleQuickAssign = async (userId: string) => {
    if (!device) return;

    const { error } = await supabase
      .from('devices')
      .update({
        assigned_to: userId,
        assigned_date: new Date().toISOString(),
        status: 'assigned',
      })
      .eq('id', device.id);

    if (!error) {
      // Create assignment record
      await supabase.from('assignments').insert([
        {
          device_id: device.id,
          user_id: userId,
          assigned_date: new Date().toISOString(),
          notes: 'Quick scan assignment',
        },
      ]);

      setMessage({ type: 'success', text: 'Device assigned successfully!' });
      resetScan();
    } else {
      setMessage({ type: 'error', text: 'Failed to assign device. Please try again.' });
    }
  };

  const handleQuickUnassign = async () => {
    if (!device) return;

    // FIXED: Update assignments table with return_date
    // First, find the active assignment for this device
    const { data: activeAssignment } = await supabase
      .from('assignments')
      .select('*')
      .eq('device_id', device.id)
      .is('return_date', null)
      .order('assigned_date', { ascending: false })
      .limit(1)
      .single();

    // Update the assignment with return date
    if (activeAssignment) {
      await supabase
        .from('assignments')
        .update({ return_date: new Date().toISOString() })
        .eq('id', activeAssignment.id);
    }

    // Then update the device
    const { error } = await supabase
      .from('devices')
      .update({
        assigned_to: null,
        assigned_date: null,
        status: 'available',
      })
      .eq('id', device.id);

    if (!error) {
      setMessage({ type: 'success', text: 'Device returned successfully!' });
      resetScan();
    } else {
      setMessage({ type: 'error', text: 'Failed to return device. Please try again.' });
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!device) return;

    const { error } = await supabase
      .from('devices')
      .update({ status: newStatus })
      .eq('id', device.id);

    if (!error) {
      setMessage({ type: 'success', text: `Device status updated to ${newStatus}!` });
      setDevice({ ...device, status: newStatus });
    } else {
      setMessage({ type: 'error', text: 'Failed to update status. Please try again.' });
    }
  };

  const resetScan = () => {
    setSearchTerm('');
    setDevice(null);
    setUserData(null);
    setUserSearchResults([]);
    searchInputRef.current?.focus();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:border-gray-600';
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen p-8">
        <PageHeader
          title="Universal Search"
          description="Search for devices or users with all related data"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Scanner Interface */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scan Input */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                  <Search className="relative w-16 h-16 text-green-600 dark:text-green-400" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
                Universal Search
              </h2>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Search for devices or users instantly
              </p>

              {/* Search Mode Toggle */}
              <div className="flex mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setSearchMode('device')}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all font-semibold ${
                    searchMode === 'device'
                      ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Monitor className="w-5 h-5" />
                  <span>Device</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('user')}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all font-semibold ${
                    searchMode === 'user'
                      ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>User</span>
                </button>
              </div>

              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {searchMode === 'device' ? (
                      <>
                        <Search className="w-4 h-4 inline mr-2" />
                        Barcode / Asset Number / Serial Number
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 inline mr-2" />
                        Employee ID / Name / Email / Department
                      </>
                    )}
                  </label>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={searchMode === 'device' ? 'Scan or type device identifier...' : 'Search for user...'}
                    className="w-full px-4 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                    autoComplete="off"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={!searchTerm.trim()}
                  className={`w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold ${
                    searchMode === 'device'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white'
                      : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
                  }`}
                >
                  <Zap className="w-6 h-6" />
                  <span>Search {searchMode === 'device' ? 'Device' : 'User'}</span>
                </button>
              </form>

              {/* Message Display */}
              {message && (
                <div
                  className={`mt-6 p-4 rounded-lg border ${
                    message.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : message.type === 'error'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {message.type === 'success' ? (
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : message.type === 'error' ? (
                      <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          message.type === 'success'
                            ? 'text-green-800 dark:text-green-300'
                            : message.type === 'error'
                            ? 'text-red-800 dark:text-red-300'
                            : 'text-blue-800 dark:text-blue-300'
                        }`}
                      >
                        {message.text}
                      </p>
                      {message.type === 'info' && scannedBarcode && (
                        <button
                          onClick={openAddDeviceModal}
                          className="mt-3 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all text-sm font-semibold"
                        >
                          + Add New Device
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Multiple User Search Results */}
            {userSearchResults.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Select User ({userSearchResults.length} found)
                  </h3>
                  <button
                    onClick={resetScan}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline"
                  >
                    New Search
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {userSearchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => loadUserDetails(user.id)}
                      className="w-full text-left p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 hover:border-purple-300 dark:hover:border-purple-700 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {user.full_name}
                            </h4>
                          </div>
                          
                          {user.employee_id && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                              <span className="font-semibold">Employee ID:</span> {user.employee_id}
                            </p>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{user.email}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Department</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{user.department}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              user.is_active 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 capitalize">
                              {user.role}
                            </span>
                          </div>
                        </div>

                        <div className="ml-4 text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Device Details */}
            {device && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Device Details</h3>
                  <button
                    onClick={resetScan}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline"
                  >
                    Scan Another
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Device Name</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{device.name}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Type</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{device.type}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Asset Number</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white">{device.asset_number || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Serial Number</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white">{device.serial_number}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Barcode</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white">{device.barcode || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(device.status)}`}>
                      {device.status}
                    </span>
                  </div>
                </div>

                {device.users && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Currently Assigned To:</p>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-200">{device.users.full_name}</p>
                    <p className="text-sm text-blue-700 dark:text-blue-400">{device.users.department}</p>
                    <p className="text-sm text-blue-700 dark:text-blue-400">{device.users.email}</p>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Quick Actions:</h4>
                  
                  {device.status === 'assigned' ? (
                    <button
                      onClick={handleQuickUnassign}
                      className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-semibold"
                    >
                      Return Device (Unassign)
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Assign to user:</p>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {users.slice(0, 5).map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleQuickAssign(user.id)}
                            className="w-full text-left px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-700 transition-colors"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">{user.full_name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.department}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStatusUpdate('available')}
                      className="flex-1 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-all text-sm font-semibold"
                    >
                      Mark Available
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('maintenance')}
                      className="flex-1 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/40 transition-all text-sm font-semibold"
                    >
                      Mark Maintenance
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* User Details */}
            {userData && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">User Profile</h3>
                  <button
                    onClick={resetScan}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline"
                  >
                    Search Another
                  </button>
                </div>

                {/* User Info Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="col-span-2 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Full Name</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{userData.full_name}</p>
                  </div>
                  {userData.employee_id && (
                    <div className="col-span-2 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">Employee ID</p>
                      <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">{userData.employee_id}</p>
                    </div>
                  )}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Email</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{userData.email}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Department</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{userData.department}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Role</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{userData.role}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      userData.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                    }`}>
                      {userData.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-lg">
                    <Package className="w-8 h-8 mb-2" />
                    <p className="text-3xl font-bold">{userData.totalDevices}</p>
                    <p className="text-sm text-green-100">Assigned Devices</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-lg">
                    <AlertCircle className="w-8 h-8 mb-2" />
                    <p className="text-3xl font-bold">{userData.totalRequests}</p>
                    <p className="text-sm text-orange-100">Total Requests</p>
                  </div>
                </div>

                {/* Assigned Devices */}
                {userData.devices.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <Package className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                      Assigned Devices ({userData.devices.length})
                    </h4>
                    <div className="space-y-2">
                      {userData.devices.map((device: any) => (
                        <div key={device.id} className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{device.name}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{device.type} • {device.serial_number}</p>
                              {device.barcode && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">Barcode: {device.barcode}</p>
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(device.status)}`}>
                              {device.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Requests */}
                {userData.requests.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 text-orange-600 dark:text-orange-400" />
                      Recent Requests ({userData.requests.length})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {userData.requests.slice(0, 5).map((request: any) => (
                        <div key={request.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{request.title}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{request.description.substring(0, 80)}...</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {request.request_type === 'device_request' ? '💻 Device Request' : '🔧 IT Support'} • 
                                {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              request.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                              request.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                              request.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}>
                              {request.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {userData.devices.length === 0 && userData.requests.length === 0 && (
                  <div className="text-center py-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-500">No devices or requests for this user</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Scan History */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
              Recent Scans
            </h3>
            
            {scanHistory.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No searches yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scanHistory.map((scan, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{scan.device}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">{scan.barcode}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(scan.status)}`}>
                        {scan.status}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(scan.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">🔍 Universal Search Tips:</h4>
              <ul className="text-xs text-green-800 dark:text-green-400 space-y-1">
                <li>• Toggle between Device and User search modes</li>
                <li>• Device: Scan barcode, asset number, or serial</li>
                <li>• User: Search by name, email, or department</li>
                <li>• Works with any USB/Bluetooth scanner</li>
                <li>• Press Enter or click Search button</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">👥 User Lookup:</h4>
              <p className="text-xs text-purple-800 dark:text-purple-400">
                Search for any user to see their complete profile: assigned devices, request history, and account status.
              </p>
            </div>

            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">📦 Device Registration:</h4>
              <p className="text-xs text-blue-800 dark:text-blue-400">
                Scan unknown barcodes to add new devices instantly. Barcode is auto-filled and ready to save.
              </p>
            </div>
          </div>
        </div>

        {/* Add Device Modal */}
        {showAddDeviceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add New Device</h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Scanned Barcode:</strong> <span className="font-mono">{scannedBarcode}</span>
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Device Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700"
                    placeholder="e.g., Dell Laptop XPS 15"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700"
                    >
                      <option value="" className="text-gray-500">Select Type</option>
                      <option value="Laptop" className="text-gray-900 dark:text-white">Laptop</option>
                      <option value="Monitor" className="text-gray-900 dark:text-white">Monitor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Asset Number
                    </label>
                    <input
                      type="text"
                      value={formData.asset_number}
                      onChange={(e) => setFormData({ ...formData, asset_number: e.target.value })}
                      placeholder="e.g., AST-12345"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-900 font-mono"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Serial Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.serial_number}
                      onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                      placeholder="e.g., SN123456789"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Purchase Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Warranty Expiry
                    </label>
                    <input
                      type="date"
                      value={formData.warranty_expiry}
                      onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Specifications
                  </label>
                  <textarea
                    value={formData.specifications}
                    onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                    rows={3}
                    placeholder="e.g., Intel i7, 16GB RAM, 512GB SSD"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowAddDeviceModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDevice}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-md"
                >
                  Add Device
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ScanPage;

