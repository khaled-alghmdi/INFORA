'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import { Plus, Edit, Trash2, Search, Filter, Shield, ShieldAlert } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

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
  warranty_expiry: string | null;
  specifications: string | null;
  assignee_name?: string;
};

type User = {
  id: string;
  full_name: string;
  email: string;
};

const DevicesPage = () => {
  const searchParams = useSearchParams();
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAssignHint, setShowAssignHint] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
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

  useEffect(() => {
    fetchDevices();
    fetchUsers();

    // Set up real-time subscription for devices
    const devicesChannel = supabase
      .channel('devices_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'devices',
        },
        (payload) => {
          console.log('Device change detected:', payload);
          // Refresh devices when any change occurs
          fetchDevices();
        }
      )
      .subscribe();

    // Set up real-time subscription for assignments
    const assignmentsChannel = supabase
      .channel('assignments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments',
        },
        (payload) => {
          console.log('Assignment change detected:', payload);
          // Refresh devices when assignments change
          fetchDevices();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(devicesChannel);
      supabase.removeChannel(assignmentsChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add') {
      setShowAddModal(true);
    }
    if (action === 'assign') {
      setShowAssignHint(true);
      const table = document.getElementById('devices-table');
      if (table) {
        table.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [searchParams]);

  useEffect(() => {
    filterDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices, searchTerm, statusFilter, typeFilter]);

  const fetchDevices = async () => {
    const { data } = await supabase
      .from('devices')
      .select('*, users!devices_assigned_to_fkey(full_name)')
      .order('created_at', { ascending: false });

    if (data) {
      const devicesWithAssignee = data.map((device: any) => ({
        ...device,
        assignee_name: device.users?.full_name || null,
      }));
      
      // FILTER: Only show Laptop and Monitor devices in UI
      const filteredByAllowedTypes = devicesWithAssignee.filter(
        (device: any) => device.type === 'Laptop' || device.type === 'Monitor'
      );
      
      setDevices(filteredByAllowedTypes);
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('is_active', true)
      .order('full_name');

    if (data) {
      setUsers(data);
    }
  };

  const filterDevices = () => {
    let filtered = [...devices];

    if (searchTerm) {
      filtered = filtered.filter(
        (device) =>
          device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          device.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          device.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (device.asset_number && device.asset_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (device.barcode && device.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((device) => device.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((device) => device.type === typeFilter);
    }

    setFilteredDevices(filtered);
  };

  const handleAddDevice = async () => {
    // Validate required fields
    if (!formData.name || !formData.type || !formData.serial_number || !formData.purchase_date) {
      alert('Please fill in all required fields: Device Name, Type, Serial Number, and Purchase Date');
      return;
    }

    // Prepare data - set empty strings to null to avoid unique constraint issues
    const deviceData = {
      ...formData,
      barcode: formData.barcode || null,
      asset_number: formData.asset_number || null,
      warranty_expiry: formData.warranty_expiry || null,
      specifications: formData.specifications || null,
    };

    const { error } = await supabase.from('devices').insert([deviceData]);

    if (error) {
      console.error('Error adding device:', error);
      alert(`Error adding device: ${error.message}`);
      return;
    }

    setShowAddModal(false);
    fetchDevices();
    resetForm();
    alert('Device added successfully!');
  };

  const handleEditDevice = async () => {
    if (!selectedDevice) return;

    // Validate required fields
    if (!formData.name || !formData.type || !formData.serial_number || !formData.purchase_date) {
      alert('Please fill in all required fields: Device Name, Type, Serial Number, and Purchase Date');
      return;
    }

    // Prepare data - set empty strings to null
    const deviceData = {
      ...formData,
      barcode: formData.barcode || null,
      asset_number: formData.asset_number || null,
      warranty_expiry: formData.warranty_expiry || null,
      specifications: formData.specifications || null,
    };

    const { error } = await supabase
      .from('devices')
      .update(deviceData)
      .eq('id', selectedDevice.id);

    if (error) {
      console.error('Error updating device:', error);
      alert(`Error updating device: ${error.message}`);
      return;
    }

    setShowEditModal(false);
    fetchDevices();
    resetForm();
    setSelectedDevice(null);
    alert('Device updated successfully!');
  };

  const handleDeleteDevice = async (id: string) => {
    if (confirm('Are you sure you want to delete this device?')) {
      const { error } = await supabase.from('devices').delete().eq('id', id);

      if (!error) {
        fetchDevices();
      }
    }
  };

  const handleAssignDevice = async (userId: string) => {
    if (!selectedDevice) return;

    const { error } = await supabase
      .from('devices')
      .update({
        assigned_to: userId,
        assigned_date: new Date().toISOString(),
        status: 'assigned',
      })
      .eq('id', selectedDevice.id);

    if (!error) {
      // Create assignment record
      await supabase.from('assignments').insert([
        {
          device_id: selectedDevice.id,
          user_id: userId,
          assigned_date: new Date().toISOString(),
          notes: 'Device assigned',
        },
      ]);

      setShowAssignModal(false);
      fetchDevices();
      setSelectedDevice(null);
      setShowAssignHint(false);
    }
  };

  const handleUnassignDevice = async (deviceId: string) => {
    // FIXED: Update assignments table with return_date
    // First, find the active assignment for this device
    const { data: activeAssignment } = await supabase
      .from('assignments')
      .select('*')
      .eq('device_id', deviceId)
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
      .eq('id', deviceId);

    if (!error) {
      fetchDevices();
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

  const getWarrantyStatus = (purchaseDate: string) => {
    if (!purchaseDate) {
      return { status: 'unknown', label: 'N/A', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400' };
    }

    const purchase = new Date(purchaseDate);
    const warrantyEndDate = new Date(purchase);
    warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 4); // Add 4 years
    
    const today = new Date();
    
    if (warrantyEndDate >= today) {
      return { 
        status: 'active', 
        label: 'Active', 
        color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
        icon: <Shield className="w-2 h-2" />
      };
    } else {
      return { 
        status: 'expired', 
        label: 'Expired', 
        color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
        icon: <ShieldAlert className="w-2 h-2" />
      };
    }
  };

  const openEditModal = (device: Device) => {
    setSelectedDevice(device);
    setFormData({
      name: device.name,
      type: device.type,
      barcode: device.barcode || '',
      asset_number: device.asset_number || '',
      serial_number: device.serial_number,
      status: device.status,
      purchase_date: device.purchase_date,
      warranty_expiry: device.warranty_expiry || '',
      specifications: device.specifications || '',
    });
    setShowEditModal(true);
  };

  const openAssignModal = (device: Device) => {
    setSelectedDevice(device);
    setShowAssignModal(true);
  };

  // Fixed device types - only Laptop and Monitor
  const deviceTypes = ['Laptop', 'Monitor'];

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-20 flex-1 min-h-screen p-8 transition-all duration-300">
        <PageHeader
          title="Devices"
          description="Manage all IT devices in the company"
          action={
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Add Device</span>
            </button>
          }
        />

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-6 mb-6">
          {showAssignHint && (
            <div className="mb-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-100 dark:border-green-700">
              Select a device in the table below, choose Assign from its actions column, and pick the target user to complete the assignment.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, barcode, asset number, serial number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="maintenance">Maintenance</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="Laptop">Laptop</option>
              <option value="Monitor">Monitor</option>
            </select>
          </div>
        </div>

        {/* Devices Table */}
        <div id="devices-table" className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-1.5 py-1 text-left text-[8px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                  Device
                </th>
                <th className="px-1.5 py-1 text-left text-[8px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                  Barcode
                </th>
                <th className="px-1.5 py-1 text-left text-[8px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                  Asset
                </th>
                <th className="px-1.5 py-1 text-left text-[8px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                  Type
                </th>
                <th className="px-1.5 py-1 text-left text-[8px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                  Serial
                </th>
                <th className="px-1.5 py-1 text-left text-[8px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                  Status
                </th>
                <th className="px-1.5 py-1 text-left text-[8px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                  Warranty
                </th>
                <th className="px-1.5 py-1 text-left text-[8px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                  Assigned
                </th>
                <th className="px-1.5 py-1 text-center text-[8px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                  Act
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDevices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-1.5 py-0.5 whitespace-nowrap">
                    <div className="text-[10px] font-medium text-gray-900 dark:text-white leading-none">{device.name}</div>
                    <div className="text-[8px] text-gray-500 dark:text-gray-400 truncate max-w-[100px] leading-tight mt-0.5">{device.specifications || '-'}</div>
                  </td>
                  <td className="px-1.5 py-0.5 whitespace-nowrap">
                    <span className="px-1 py-0.5 text-[8px] font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                      {device.barcode || '-'}
                    </span>
                  </td>
                  <td className="px-1.5 py-0.5 whitespace-nowrap">
                    <span className="px-1 py-0.5 text-[8px] font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                      {device.asset_number || '-'}
                    </span>
                  </td>
                  <td className="px-1.5 py-0.5 whitespace-nowrap">
                    <span className="px-1 py-0.5 text-[8px] font-semibold rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                      {device.type}
                    </span>
                  </td>
                  <td className="px-1.5 py-0.5 whitespace-nowrap text-[9px] text-gray-900 dark:text-white font-mono">
                    {device.serial_number}
                  </td>
                  <td className="px-1.5 py-0.5 whitespace-nowrap">
                    <span
                      className={`px-1 py-0.5 text-[8px] font-semibold rounded ${
                        device.status === 'available'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : device.status === 'assigned'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      }`}
                    >
                      {device.status}
                    </span>
                  </td>
                  <td className="px-1.5 py-0.5 whitespace-nowrap">
                    {(() => {
                      const warrantyStatus = getWarrantyStatus(device.purchase_date);
                      return (
                        <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 text-[8px] font-semibold rounded ${warrantyStatus.color}`}>
                          {warrantyStatus.icon}
                          <span>{warrantyStatus.label}</span>
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-1.5 py-0.5 whitespace-nowrap">
                    {device.assignee_name ? (
                      <div>
                        <div className="text-[9px] text-gray-900 dark:text-white font-medium leading-none">{device.assignee_name}</div>
                        <button
                          onClick={() => handleUnassignDevice(device.id)}
                          className="text-[8px] text-red-600 dark:text-red-400 hover:text-red-800 leading-tight"
                        >
                          Unassign
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openAssignModal(device)}
                        className="text-[9px] text-green-600 dark:text-green-400 hover:text-green-800 font-medium"
                      >
                        Assign
                      </button>
                    )}
                  </td>
                  <td className="px-1.5 py-0.5 whitespace-nowrap">
                    <div className="flex gap-0.5 justify-center">
                      <button
                        onClick={() => openEditModal(device)}
                        className="text-green-600 dark:text-green-400 hover:text-green-800"
                        title="Edit"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteDevice(device.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Add Device Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add New Device</h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  💡 <strong>Tip:</strong> Use <a href="/scan" className="underline font-semibold hover:text-blue-600 dark:hover:text-blue-200">Quick Scan</a> page to add devices with barcode scanner
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
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

        {/* Edit Device Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Device</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Device Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="Laptop" className="text-gray-900 dark:text-white">Laptop</option>
                      <option value="Monitor" className="text-gray-900 dark:text-white">Monitor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="available" className="text-gray-900 dark:text-white">Available</option>
                      <option value="assigned" className="text-gray-900 dark:text-white">Assigned</option>
                      <option value="maintenance" className="text-gray-900 dark:text-white">Maintenance</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Asset Number
                    </label>
                    <input
                      type="text"
                      value={formData.asset_number}
                      onChange={(e) => setFormData({ ...formData, asset_number: e.target.value })}
                      placeholder="e.g., AST-12345"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                    setSelectedDevice(null);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditDevice}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Device Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Assign Device</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Assign <strong>{selectedDevice?.name}</strong> to:
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleAssignDevice(user.id)}
                    className="w-full text-left px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-700 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{user.full_name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedDevice(null);
                }}
                className="w-full mt-4 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DevicesPage;

