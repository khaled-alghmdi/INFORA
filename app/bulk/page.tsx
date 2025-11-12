'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import { Upload, Download, FileText, Users, Monitor, CheckCircle, XCircle, AlertCircle, Zap } from 'lucide-react';

type TabType = 'devices' | 'users';

const BulkOperationsPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('devices');
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResults(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('File is empty or invalid');
        setImporting(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataLines = lines.slice(1);

      let successCount = 0;
      const errors: string[] = [];

      if (activeTab === 'devices') {
        await importDevices(headers, dataLines, successCount, errors);
      } else {
        await importUsers(headers, dataLines, successCount, errors);
      }

      setImporting(false);
    };

    reader.readAsText(file);
  };

  const importDevices = async (headers: string[], dataLines: string[], successCount: number, errors: string[]) => {
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      if (!line.trim()) continue;

      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const device: any = {};

      headers.forEach((header, index) => {
        const value = values[index] || '';
        const key = header.toLowerCase().replace(/\s+/g, '_');
        device[key] = value || null;
      });

      // Validate required fields
      if (!device.name || !device.type || !device.serial_number || !device.purchase_date) {
        errors.push(`Row ${i + 2}: Missing required fields (name, type, serial_number, purchase_date)`);
        continue;
      }

      // Set defaults
      if (!device.status) device.status = 'available';

      const { error } = await supabase.from('devices').insert([device]);

      if (error) {
        errors.push(`Row ${i + 2}: ${error.message}`);
      } else {
        successCount++;
      }
    }

    setResults({ success: successCount, errors });
  };

  const importUsers = async (headers: string[], dataLines: string[], successCount: number, errors: string[]) => {
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      if (!line.trim()) continue;

      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const user: any = {};

      headers.forEach((header, index) => {
        const value = values[index] || '';
        const key = header.toLowerCase().replace(/\s+/g, '_');
        
        // Handle boolean for is_active
        if (key === 'is_active') {
          user[key] = value.toLowerCase() === 'true' || value === '1';
        } else {
          user[key] = value || null;
        }
      });

      // Validate required fields
      if (!user.email || !user.full_name || !user.department) {
        errors.push(`Row ${i + 2}: Missing required fields (email, full_name, department)`);
        continue;
      }

      // Set defaults
      if (!user.role) user.role = 'user';
      if (user.is_active === null || user.is_active === undefined) user.is_active = true;

      const { error } = await supabase.from('users').insert([user]);

      if (error) {
        errors.push(`Row ${i + 2}: ${error.message}`);
      } else {
        successCount++;
      }
    }

    setResults({ success: successCount, errors });
  };

  const downloadDeviceTemplate = () => {
    const template = `name,type,barcode,asset_number,serial_number,status,purchase_date,warranty_expiry,specifications
"Dell Latitude 5520",Laptop,BC123456,AST-001,SN123456789,available,2024-01-15,2028-01-15,"Intel i7, 16GB RAM, 512GB SSD"
"Dell UltraSharp 27",Monitor,BC123457,AST-002,SN987654321,available,2024-02-20,2028-02-20,"27 inch, 4K Resolution"`;

    downloadCSV(template, 'device_import_template.csv');
  };

  const downloadUserTemplate = () => {
    const template = `employee_id,full_name,email,department,role,is_active,initial_password
EMP-001,John Doe,john.doe@tamergroup.com,IT Department,admin,true,TempPass123!
EMP-002,Jane Smith,jane.smith@tamergroup.com,Marketing,user,true,TempPass456!
EMP-003,Mike Wilson,mike.wilson@tamergroup.com,Sales,user,true,TempPass789!`;

    downloadCSV(template, 'user_import_template.csv');
  };

  const exportDevices = async () => {
    const { data: devices } = await supabase
      .from('devices')
      .select('name, type, barcode, asset_number, serial_number, status, purchase_date, warranty_expiry, specifications')
      .order('created_at', { ascending: false });

    if (!devices || devices.length === 0) {
      alert('No devices to export');
      return;
    }

    const headers = Object.keys(devices[0]);
    const csvContent = [
      headers.join(','),
      ...devices.map((device: any) =>
        headers.map(header => `"${device[header] || ''}"`).join(',')
      ),
    ].join('\n');

    downloadCSV(csvContent, `devices_export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportUsers = async () => {
    const { data: users } = await supabase
      .from('users')
      .select('employee_id, full_name, email, department, role, is_active')
      .order('created_at', { ascending: false });

    if (!users || users.length === 0) {
      alert('No users to export');
      return;
    }

    const headers = Object.keys(users[0]);
    const csvContent = [
      headers.join(','),
      ...users.map((user: any) =>
        headers.map(header => `"${user[header] || ''}"`).join(',')
      ),
    ].join('\n');

    downloadCSV(csvContent, `users_export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen p-8">
        <PageHeader
          title="Bulk Operations"
          description="Import/export multiple devices and users at once - Device assignments done separately"
        />

        {/* Tab Selector */}
        <div className="flex mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-2">
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-all font-semibold ${
              activeTab === 'devices'
                ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Monitor className="w-5 h-5" />
            <span>Devices</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-all font-semibold ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Users</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Import Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <Upload className="w-6 h-6 text-green-600 dark:text-green-400 mr-2" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Import {activeTab === 'devices' ? 'Devices' : 'Users'}
              </h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">📝 Instructions:</h3>
                <ol className="text-xs text-blue-800 dark:text-blue-400 space-y-1 list-decimal list-inside">
                  <li>Download the CSV template below</li>
                  <li>Fill in your data (one row per {activeTab === 'devices' ? 'device' : 'user'})</li>
                  <li>Save as CSV file</li>
                  <li>Upload using the button below</li>
                </ol>
                {activeTab === 'users' && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded">
                    <p className="text-xs text-green-800 dark:text-green-400">
                      <strong>✓ Note:</strong> This will only create user accounts. Device assignments must be done separately in the Devices page.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={activeTab === 'devices' ? downloadDeviceTemplate : downloadUserTemplate}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all font-semibold border-2 border-gray-300 dark:border-gray-600"
              >
                <Download className="w-5 h-5" />
                <span>Download CSV Template</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all font-semibold ${
                  importing
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white'
                    : activeTab === 'devices'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white shadow-md'
                    : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-md'
                }`}
              >
                <Upload className="w-5 h-5" />
                <span>{importing ? 'Importing...' : `Upload CSV File`}</span>
              </button>

              {results && (
                <div className="mt-4 space-y-3">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                      <p className="text-sm font-semibold text-green-900 dark:text-green-300">
                        Successfully imported: {results.success} {activeTab === 'devices' ? 'device(s)' : 'user(s)'}
                      </p>
                    </div>
                  </div>

                  {results.errors.length > 0 && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-start">
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-900 dark:text-red-300 mb-2">
                            Errors ({results.errors.length}):
                          </p>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {results.errors.map((error, index) => (
                              <p key={index} className="text-xs text-red-700 dark:text-red-400">
                                • {error}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Export Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <Download className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Export {activeTab === 'devices' ? 'Devices' : 'Users'}
              </h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">📊 Export Options:</h3>
                <p className="text-xs text-purple-800 dark:text-purple-400">
                  Export all {activeTab === 'devices' ? 'devices' : 'users'} to a CSV file for backup, analysis, or migration.
                </p>
              </div>

              <button
                onClick={activeTab === 'devices' ? exportDevices : exportUsers}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all font-semibold shadow-md ${
                  activeTab === 'devices'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                    : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white'
                }`}
              >
                <Download className="w-5 h-5" />
                <span>Export All {activeTab === 'devices' ? 'Devices' : 'Users'}</span>
              </button>

              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Note:</strong> The exported file will include all {activeTab === 'devices' ? 'devices' : 'users'} in the system with all their data fields.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CSV Format Guide */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
            CSV Format Guide
          </h3>

          {activeTab === 'devices' ? (
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                <strong>Required Fields for Devices:</strong>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                  <p className="text-xs font-semibold text-green-900 dark:text-green-300">name</p>
                  <p className="text-xs text-green-700 dark:text-green-400">Device name</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                  <p className="text-xs font-semibold text-green-900 dark:text-green-300">type</p>
                  <p className="text-xs text-green-700 dark:text-green-400">Device type</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                  <p className="text-xs font-semibold text-green-900 dark:text-green-300">serial_number</p>
                  <p className="text-xs text-green-700 dark:text-green-400">Unique serial</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                  <p className="text-xs font-semibold text-green-900 dark:text-green-300">purchase_date</p>
                  <p className="text-xs text-green-700 dark:text-green-400">YYYY-MM-DD</p>
                </div>
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                <strong>Optional Fields:</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-mono">barcode</span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-mono">asset_number</span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-mono">status</span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-mono">warranty_expiry</span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-mono">specifications</span>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-xs text-yellow-800 dark:text-yellow-400">
                  <strong>⚠️ Note:</strong> Status defaults to &ldquo;available&rdquo; if not specified. Valid status values: available, assigned, maintenance
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg">
                <p className="text-sm font-semibold text-green-900 dark:text-green-300 mb-1">
                  ✓ User Account Creation Only
                </p>
                <p className="text-xs text-green-800 dark:text-green-400 mb-2">
                  This bulk import will create user accounts in the system. Device assignments are NOT included and must be done separately through the Devices page.
                </p>
                <p className="text-xs text-green-800 dark:text-green-400">
                  <strong>🔐 Important:</strong> Users MUST have an initial_password to login to the system. Include it in your CSV file.
                </p>
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                <strong>Required Fields for Users:</strong>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                  <p className="text-xs font-semibold text-green-900 dark:text-green-300">full_name</p>
                  <p className="text-xs text-green-700 dark:text-green-400">Full name</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                  <p className="text-xs font-semibold text-green-900 dark:text-green-300">email</p>
                  <p className="text-xs text-green-700 dark:text-green-400">Email address</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                  <p className="text-xs font-semibold text-green-900 dark:text-green-300">department</p>
                  <p className="text-xs text-green-700 dark:text-green-400">Department</p>
                </div>
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                <strong>Recommended Field:</strong>
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-mono font-semibold">initial_password</span>
                <span className="text-xs text-gray-600 dark:text-gray-400 self-center">← Required for users to login</span>
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                <strong>Optional Fields:</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-mono">employee_id</span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-mono">role</span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-mono">is_active</span>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-xs text-yellow-800 dark:text-yellow-400 mb-2">
                  <strong>⚠️ Defaults:</strong> Role defaults to &ldquo;user&rdquo; if not specified. Valid values: user, admin. is_active defaults to true.
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-400">
                  <strong>🔐 Password:</strong> Users need initial_password to login. They should change it after first login for security.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-6">
            <Zap className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Fast Import</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {activeTab === 'devices' 
                ? 'Upload hundreds of devices in seconds using CSV files' 
                : 'Create multiple user accounts instantly - no device assignments'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <Download className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Easy Export</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Download all data for backup or external analysis
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Templates Included</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pre-formatted templates with examples to get started
            </p>
          </div>
        </div>

        {/* Workflow Guide */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertCircle className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
            Recommended Workflow for New Employees
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-bold">1</span>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Import Users</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Use bulk import to create user accounts</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-bold">2</span>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Add Devices</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Import devices or add via Quick Search</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-bold">3</span>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Assign Devices</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Go to Devices page → Assign to users</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 dark:bg-green-500 text-white flex items-center justify-center font-bold">✓</span>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Complete!</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Users and devices ready to use</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BulkOperationsPage;

