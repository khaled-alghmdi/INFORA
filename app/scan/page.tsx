'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import { Scan, CheckCircle, XCircle, User, Package, Zap, AlertCircle } from 'lucide-react';

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

const ScanPage = () => {
  const [barcode, setBarcode] = useState('');
  const [device, setDevice] = useState<Device | null>(null);
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
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUsers();
    // Auto-focus on barcode input
    barcodeInputRef.current?.focus();
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

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    setScanning(true);
    setMessage(null);
    setDevice(null);

    // Search by barcode, asset_number, or serial_number
    const { data, error } = await supabase
      .from('devices')
      .select('*, users!devices_assigned_to_fkey(full_name, email, department)')
      .or(`barcode.eq.${barcode},asset_number.eq.${barcode},serial_number.eq.${barcode}`)
      .single();

    if (error || !data) {
      setScannedBarcode(barcode);
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
      barcode: barcode,
      timestamp: new Date().toISOString(),
      status: data.status,
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
    setBarcode('');
    setDevice(null);
    barcodeInputRef.current?.focus();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 bg-gray-50 min-h-screen p-8">
        <PageHeader
          title="Quick Scan"
          description="Scan barcodes for instant device lookup and management"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Scanner Interface */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scan Input */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                  <Scan className="relative w-16 h-16 text-green-600" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                Ready to Scan
              </h2>
              <p className="text-center text-gray-600 mb-6">
                Scan barcode, asset number, or enter serial number
              </p>

              <form onSubmit={handleBarcodeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Scan className="w-4 h-4 inline mr-2" />
                    Barcode / Asset Number / Serial Number
                  </label>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Scan or type here..."
                    className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-green-500 focus:border-green-500 text-gray-900 font-mono"
                    autoComplete="off"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={!barcode.trim()}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
                >
                  <Zap className="w-6 h-6" />
                  <span>Search Device</span>
                </button>
              </form>

              {/* Message Display */}
              {message && (
                <div
                  className={`mt-6 p-4 rounded-lg border ${
                    message.type === 'success'
                      ? 'bg-green-50 border-green-200'
                      : message.type === 'error'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {message.type === 'success' ? (
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    ) : message.type === 'error' ? (
                      <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          message.type === 'success'
                            ? 'text-green-800'
                            : message.type === 'error'
                            ? 'text-red-800'
                            : 'text-blue-800'
                        }`}
                      >
                        {message.text}
                      </p>
                      {message.type === 'info' && scannedBarcode && (
                        <button
                          onClick={openAddDeviceModal}
                          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold"
                        >
                          + Add New Device
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Device Details */}
            {device && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Device Details</h3>
                  <button
                    onClick={resetScan}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    Scan Another
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Device Name</p>
                    <p className="text-lg font-bold text-gray-900">{device.name}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Type</p>
                    <p className="text-lg font-bold text-gray-900">{device.type}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Asset Number</p>
                    <p className="text-sm font-mono text-gray-900">{device.asset_number || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Serial Number</p>
                    <p className="text-sm font-mono text-gray-900">{device.serial_number}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Barcode</p>
                    <p className="text-sm font-mono text-gray-900">{device.barcode || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(device.status)}`}>
                      {device.status}
                    </span>
                  </div>
                </div>

                {device.users && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Currently Assigned To:</p>
                    <p className="text-lg font-bold text-blue-900">{device.users.full_name}</p>
                    <p className="text-sm text-blue-700">{device.users.department}</p>
                    <p className="text-sm text-blue-700">{device.users.email}</p>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">Quick Actions:</h4>
                  
                  {device.status === 'assigned' ? (
                    <button
                      onClick={handleQuickUnassign}
                      className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-semibold"
                    >
                      Return Device (Unassign)
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Assign to user:</p>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {users.slice(0, 5).map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleQuickAssign(user.id)}
                            className="w-full text-left px-4 py-2 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                          >
                            <div className="font-medium text-gray-900">{user.full_name}</div>
                            <div className="text-sm text-gray-500">{user.department}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStatusUpdate('available')}
                      className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all text-sm font-semibold"
                    >
                      Mark Available
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('maintenance')}
                      className="flex-1 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-all text-sm font-semibold"
                    >
                      Mark Maintenance
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Scan History */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-purple-600" />
              Recent Scans
            </h3>
            
            {scanHistory.length === 0 ? (
              <div className="text-center py-8">
                <Scan className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No scans yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scanHistory.map((scan, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <p className="text-sm font-semibold text-gray-900 truncate">{scan.device}</p>
                    <p className="text-xs text-gray-600 font-mono">{scan.barcode}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(scan.status)}`}>
                        {scan.status}
                      </span>
                      <p className="text-xs text-gray-500">
                        {new Date(scan.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <h4 className="text-sm font-semibold text-green-900 mb-2">💡 Scanner Tips:</h4>
              <ul className="text-xs text-green-800 space-y-1">
                <li>• Scan barcode directly into the input field</li>
                <li>• Works with any USB/Bluetooth scanner</li>
                <li>• New barcode? Click "Add New Device"</li>
                <li>• Can also search by asset number</li>
                <li>• Press Enter or click Search</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">📦 Adding Devices:</h4>
              <p className="text-xs text-blue-800">
                This is the recommended way to add devices with barcodes. Simply scan the barcode, and if it's not found, click "Add New Device" to register it instantly.
              </p>
            </div>
          </div>
        </div>

        {/* Add Device Modal */}
        {showAddDeviceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Device</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Scanned Barcode:</strong> <span className="font-mono">{scannedBarcode}</span>
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Device Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., Dell Laptop XPS 15"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    >
                      <option value="" className="text-gray-500">Select Type</option>
                      <option value="Laptop" className="text-gray-900">Laptop</option>
                      <option value="Desktop" className="text-gray-900">Desktop</option>
                      <option value="Monitor" className="text-gray-900">Monitor</option>
                      <option value="Mobile" className="text-gray-900">Mobile</option>
                      <option value="Tablet" className="text-gray-900">Tablet</option>
                      <option value="Printer" className="text-gray-900">Printer</option>
                      <option value="Keyboard" className="text-gray-900">Keyboard</option>
                      <option value="Mouse" className="text-gray-900">Mouse</option>
                      <option value="Other" className="text-gray-900">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asset Number
                    </label>
                    <input
                      type="text"
                      value={formData.asset_number}
                      onChange={(e) => setFormData({ ...formData, asset_number: e.target.value })}
                      placeholder="e.g., AST-12345"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 font-mono bg-gray-100"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Serial Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.serial_number}
                      onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                      placeholder="e.g., SN123456789"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Warranty Expiry
                    </label>
                    <input
                      type="date"
                      value={formData.warranty_expiry}
                      onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specifications
                  </label>
                  <textarea
                    value={formData.specifications}
                    onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                    rows={3}
                    placeholder="e.g., Intel i7, 16GB RAM, 512GB SSD"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowAddDeviceModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDevice}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md"
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

