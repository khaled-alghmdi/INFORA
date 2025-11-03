'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import { FileText, Download, Calendar, User } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportType = 
  | 'operations'
  | 'assets'
  | 'user_devices'
  | 'available_stock'
  | 'warranty';

const ReportsPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType>('operations');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');

  const reportTypes = [
    {
      id: 'operations' as ReportType,
      title: 'Operations Report',
      description: 'All operations and assignments within the last month',
      icon: FileText,
    },
    {
      id: 'assets' as ReportType,
      title: 'Asset Report',
      description: 'All devices assigned to all employees',
      icon: FileText,
    },
    {
      id: 'user_devices' as ReportType,
      title: 'User Devices Report',
      description: 'Each user and their assigned devices breakdown',
      icon: FileText,
    },
    {
      id: 'available_stock' as ReportType,
      title: 'Available Stock Report',
      description: 'All available devices currently in stock',
      icon: FileText,
    },
    {
      id: 'warranty' as ReportType,
      title: 'Warranty Status Report',
      description: 'Devices still under warranty (within 4 years of purchase)',
      icon: FileText,
    },
  ];

  useEffect(() => {
    fetchUsers();
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

  // Add logo to PDF header
  const addLogoToPDF = (doc: jsPDF, title: string) => {
    // Add logo
    const logoImg = new Image();
    logoImg.src = '/Tamer_logo.png';
    doc.addImage(logoImg, 'PNG', 14, 10, 20, 20);
    
    // Add company name next to logo
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // Green color
    doc.text('TAMER CONSUMER COMPANY', 38, 18);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('IT Device Inventory Management System', 38, 24);
    
    // Add line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 32, 196, 32);
    
    // Add report title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(title, 14, 42);
  };

  // 1. Operations Report - All operations within the last month
  const generateOperationsReport = async () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    let query = supabase
      .from('assignments')
      .select('*, devices(name, type, serial_number), users(full_name, department)')
      .gte('assigned_date', oneMonthAgo.toISOString())
      .order('assigned_date', { ascending: false });

    // Filter by specific user if selected
    if (selectedUserId !== 'all') {
      query = query.eq('user_id', selectedUserId);
    }

    const { data: assignments } = await query;

    if (!assignments) return;

    const doc = new jsPDF();
    
    // Add logo and header
    const reportTitle = selectedUserId === 'all'
      ? 'Operations Report - Last Month'
      : `Operations Report - ${users.find(u => u.id === selectedUserId)?.full_name || 'User'}`;
    addLogoToPDF(doc, reportTitle);
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 50);
    doc.text(`Period: ${oneMonthAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()}`, 14, 56);
    doc.text(`Total Operations: ${assignments.length}`, 14, 62);
    
    const tableData = assignments.map((assignment: any) => [
      new Date(assignment.assigned_date).toLocaleDateString(),
      assignment.devices?.name || 'N/A',
      assignment.devices?.type || 'N/A',
      assignment.devices?.serial_number || 'N/A',
      assignment.users?.full_name || 'N/A',
      assignment.users?.department || 'N/A',
      assignment.return_date ? 'Returned' : 'Active',
    ]);

    autoTable(doc, {
      startY: 68,
      head: [['Date', 'Device', 'Type', 'Serial No.', 'User', 'Department', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 8 },
    });

    const fileName = selectedUserId === 'all'
      ? `operations_report_${new Date().toISOString().split('T')[0]}.pdf`
      : `operations_report_${users.find(u => u.id === selectedUserId)?.full_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    doc.save(fileName);
  };

  // 2. Asset Report - All devices assigned to all employees
  const generateAssetReport = async () => {
    let query = supabase
      .from('devices')
      .select('*, users!devices_assigned_to_fkey(full_name, email, department)')
      .eq('status', 'assigned');

    // Filter by specific user if selected
    if (selectedUserId !== 'all') {
      query = query.eq('assigned_to', selectedUserId);
    }

    const { data: devices } = await query.order('users(full_name)');

    if (!devices) return;

    const doc = new jsPDF();
    
    // Add logo and header
    const reportTitle = selectedUserId === 'all'
      ? 'Asset Report - All Assigned Devices'
      : `Asset Report - ${users.find(u => u.id === selectedUserId)?.full_name || 'User'}`;
    addLogoToPDF(doc, reportTitle);
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 50);
    doc.text(`Total Assets Assigned: ${devices.length}`, 14, 56);
    
    const tableData = devices.map((device: any) => [
      device.users?.full_name || 'N/A',
      device.users?.department || 'N/A',
      device.name,
      device.type,
      device.serial_number,
      device.purchase_date,
      device.assigned_date ? new Date(device.assigned_date).toLocaleDateString() : 'N/A',
    ]);

    autoTable(doc, {
      startY: 62,
      head: [['Employee', 'Department', 'Device', 'Type', 'Serial Number', 'Purchase Date', 'Assigned Date']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 8 },
    });

    const fileName = selectedUserId === 'all'
      ? `asset_report_${new Date().toISOString().split('T')[0]}.pdf`
      : `asset_report_${users.find(u => u.id === selectedUserId)?.full_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    doc.save(fileName);
  };

  // 4. Available Stock Report - Devices available in stock
  const generateAvailableStockReport = async () => {
    const { data: devices } = await supabase
      .from('devices')
      .select('*')
      .eq('status', 'available')
      .order('type');

    if (!devices) return;

    const doc = new jsPDF();
    
    // Add logo and header
    addLogoToPDF(doc, 'Available Stock Report');
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 50);
    doc.text(`Total Available in Stock: ${devices.length}`, 14, 56);
    
    // Group by type
    const groupedByType: { [key: string]: number } = {};
    devices.forEach((device: any) => {
      groupedByType[device.type] = (groupedByType[device.type] || 0) + 1;
    });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Stock Summary:', 14, 64);
    doc.setFont('helvetica', 'normal');
    let yPos = 70;
    Object.entries(groupedByType).forEach(([type, count]) => {
      doc.text(`${type}: ${count} units`, 20, yPos);
      yPos += 5;
    });

    const tableData = devices.map((device: any) => [
      device.type,
      device.name,
      device.serial_number,
      device.specifications || 'N/A',
      device.purchase_date,
      device.warranty_expiry || 'N/A',
    ]);

    autoTable(doc, {
      startY: yPos + 5,
      head: [['Type', 'Device Name', 'Serial Number', 'Specifications', 'Purchase Date', 'Warranty Expiry']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 8 },
    });

    doc.save(`available_stock_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateUserDevicesReport = async () => {
    let query = supabase
      .from('users')
      .select('*, devices!devices_assigned_to_fkey(*)')
      .order('full_name');

    // Filter by specific user if selected
    if (selectedUserId !== 'all') {
      query = query.eq('id', selectedUserId);
    }

    const { data: usersData } = await query;

    if (!usersData) return;

    const doc = new jsPDF();
    
    // Add logo and header
    const reportTitle = selectedUserId === 'all'
      ? 'User Devices Report - All Users'
      : `User Devices Report - ${users.find(u => u.id === selectedUserId)?.full_name || 'User'}`;
    addLogoToPDF(doc, reportTitle);
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 50);
    doc.text(`Total Users: ${usersData.length}`, 14, 56);
    
    let startY = 65;

    usersData.forEach((user: any) => {
      const devices = user.devices || [];
      
      if (startY > 250) {
        doc.addPage();
        startY = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${user.full_name} (${user.department})`, 14, startY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Email: ${user.email}`, 14, startY + 6);
      doc.text(`Devices Assigned: ${devices.length}`, 14, startY + 12);

      if (devices.length > 0) {
        const tableData = devices.map((device: any) => [
          device.name,
          device.type,
          device.serial_number,
          device.assigned_date ? new Date(device.assigned_date).toLocaleDateString() : 'N/A',
        ]);

        autoTable(doc, {
          startY: startY + 18,
          head: [['Device Name', 'Type', 'Serial Number', 'Assigned Date']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129] },
          margin: { left: 20 },
        });

        startY = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.text('No devices assigned', 20, startY + 18);
        startY += 30;
      }
    });

    const fileName = selectedUserId === 'all' 
      ? 'user_devices_report_all.pdf'
      : `user_devices_report_${usersData[0]?.full_name.replace(/\s+/g, '_')}.pdf`;
    
    doc.save(fileName);
  };

  // 5. Warranty Status Report - Devices still under warranty (within 4 years)
  const generateWarrantyReport = async () => {
    const { data: devices } = await supabase
      .from('devices')
      .select('*')
      .order('purchase_date', { ascending: false });

    if (!devices) return;

    // Filter devices still under warranty (within 4 years of purchase)
    const fourYearsAgo = new Date();
    fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);

    const underWarranty = devices.filter((device: any) => {
      const purchaseDate = new Date(device.purchase_date);
      return purchaseDate >= fourYearsAgo;
    });

    const doc = new jsPDF();
    
    // Add logo and header
    addLogoToPDF(doc, 'Warranty Status Report');
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 50);
    doc.text(`Devices Under Warranty: ${underWarranty.length}`, 14, 56);
    doc.text(`Warranty Period: Within 4 years from purchase date`, 14, 62);
    
    const tableData = underWarranty.map((device: any) => {
      const purchaseDate = new Date(device.purchase_date);
      const warrantyEndDate = new Date(purchaseDate);
      warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 4);
      
      const daysRemaining = Math.ceil((warrantyEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      return [
        device.name,
        device.type,
        device.serial_number,
        device.purchase_date,
        warrantyEndDate.toLocaleDateString(),
        daysRemaining > 0 ? `${daysRemaining} days` : 'Expired',
        device.status,
      ];
    });

    autoTable(doc, {
      startY: 68,
      head: [['Device Name', 'Type', 'Serial Number', 'Purchase Date', 'Warranty Ends', 'Days Remaining', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 8 },
      columnStyles: {
        5: { halign: 'center' },
      },
    });

    // Add summary at the end
    const finalY = (doc as any).lastAutoTable.finalY || 46;
    doc.setFontSize(10);
    doc.text(`Total Devices in Report: ${underWarranty.length}`, 14, finalY + 10);

    doc.save(`warranty_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);

    try {
      switch (selectedReport) {
        case 'operations':
          await generateOperationsReport();
          break;
        case 'assets':
          await generateAssetReport();
          break;
        case 'user_devices':
          await generateUserDevicesReport();
          break;
        case 'available_stock':
          await generateAvailableStockReport();
          break;
        case 'warranty':
          await generateWarrantyReport();
          break;
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 bg-gray-50 min-h-screen p-8">
        <PageHeader
          title="Reports"
          description="Generate and export reports from the database"
        />

        {/* Report Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            const isSelected = selectedReport === report.id;

            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`text-left p-6 rounded-lg shadow-md transition-all ${
                  isSelected
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white ring-4 ring-green-300 shadow-xl'
                    : 'bg-white text-gray-900 hover:shadow-lg hover:scale-105'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`p-3 rounded-lg ${
                      isSelected ? 'bg-white bg-opacity-20' : 'bg-gradient-to-br from-green-100 to-emerald-100'
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        isSelected ? 'text-white' : 'text-green-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{report.title}</h3>
                    <p
                      className={`text-sm ${
                        isSelected ? 'text-green-50' : 'text-gray-600'
                      }`}
                    >
                      {report.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Generate Report Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {reportTypes.find((r) => r.id === selectedReport)?.title}
              </h2>
              <p className="text-gray-600">
                {reportTypes.find((r) => r.id === selectedReport)?.description}
              </p>
            </div>
            <Calendar className="w-12 h-12 text-gray-400" />
          </div>

          <div className="border-t border-gray-200 pt-6">
            {/* User Selector - Show for user-related reports */}
            {(selectedReport === 'user_devices' || selectedReport === 'operations' || selectedReport === 'assets') && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <label className="block text-sm font-semibold text-gray-900">
                    Filter by User
                  </label>
                </div>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="all">📊 All Users</option>
                  <optgroup label="Active Users">
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        👤 {user.full_name} - {user.department}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <div className="mt-3 p-3 bg-white rounded border border-blue-100">
                  <p className="text-sm text-gray-700 font-medium mb-1">
                    {selectedUserId === 'all' ? '✓ All Users Selected' : '✓ Specific User Selected'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {selectedUserId === 'all' 
                      ? selectedReport === 'operations'
                        ? 'Report will show all operations across all users'
                        : selectedReport === 'assets'
                        ? 'Report will show all assigned devices across all employees'
                        : 'Report will include all users and their devices'
                      : selectedReport === 'operations'
                      ? 'Report will show only operations for the selected user'
                      : selectedReport === 'assets'
                      ? 'Report will show only devices assigned to the selected user'
                      : 'Report will show only the selected user\'s devices'}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className={`flex items-center space-x-3 px-6 py-3 rounded-lg font-semibold transition-all ${
                isGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              <Download className="w-5 h-5" />
              <span>{isGenerating ? 'Generating Report...' : 'Generate & Download PDF'}</span>
            </button>

            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">Report Information:</h4>
              <ul className="space-y-1 text-sm text-green-800">
                <li>• Report will be generated in PDF format</li>
                <li>• All data is current as of today</li>
                <li>• Report includes detailed information with tables</li>
                <li>• Download will start automatically when ready</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recent Reports Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Report Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-2">📋 Operations Report</h4>
              <p className="text-sm text-gray-600">
                Track all device assignments and operations from the last month with detailed history.
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-2">💼 Asset Report</h4>
              <p className="text-sm text-gray-600">
                Complete list of all devices currently assigned to employees across all departments.
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-gray-900 mb-2">👤 User Devices Report</h4>
              <p className="text-sm text-gray-600">
                Detailed breakdown showing each user and their specifically assigned devices.
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-gray-900 mb-2">📦 Available Stock Report</h4>
              <p className="text-sm text-gray-600">
                Inventory of all available devices in stock ready for assignment with specifications.
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg border border-red-200">
              <h4 className="font-semibold text-gray-900 mb-2">🛡️ Warranty Status Report</h4>
              <p className="text-sm text-gray-600">
                Track devices still under warranty within 4 years of purchase with expiration dates.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;

