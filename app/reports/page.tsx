'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import { FileText, Download, Calendar, User, Info, CheckCircle, Flag } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportType = 
  | 'operations'
  | 'assets'
  | 'user_devices'
  | 'available_stock'
  | 'warranty'
  | 'it_problems';

const ReportsPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType>('operations');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  
  // Date filters for operations report
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const reportTypes = [
    {
      id: 'operations' as ReportType,
      title: 'Operations Report',
      description: 'All operations and assignments filtered by date range',
      icon: FileText,
    },
    {
      id: 'assets' as ReportType,
      title: 'Asset Report',
      description: 'All assets grouped by status (assigned, available, maintenance)',
      icon: FileText,
    },
    {
      id: 'user_devices' as ReportType,
      title: 'User Devices Report',
      description: 'Show all devices that are assigned to users',
      icon: FileText,
    },
    {
      id: 'available_stock' as ReportType,
      title: 'Available Stock Report',
      description: 'Show only devices that are available in stock',
      icon: FileText,
    },
    {
      id: 'warranty' as ReportType,
      title: 'Warranty Status Report',
      description: 'All devices in warranty and out of warranty',
      icon: FileText,
    },
    {
      id: 'it_problems' as ReportType,
      title: 'IT Problems Report',
      description: 'All IT support problems reported by employees',
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

  // Add header to PDF (logo temporarily disabled to fix error)
  const addLogoToPDF = (doc: jsPDF, title: string) => {
    // Add company name
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // Green color
    doc.text('TAMER CONSUMER COMPANY', 14, 18);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('IT Device Inventory Management System', 14, 24);
    
    // Add line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 32, 196, 32);
    
    // Add report title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(title, 14, 42);
  };

  // 1. Operations Report - All operations filtered by date range
  const generateOperationsReport = async () => {
    try {
      // ENHANCED: Fetch multiple sources of operations
      let assignmentsQuery = supabase
        .from('assignments')
        .select('*, devices(name, type, serial_number, asset_number), users(full_name, department)')
        .order('assigned_date', { ascending: false });

      // Apply date filters if provided
      if (startDate) {
        assignmentsQuery = assignmentsQuery.gte('assigned_date', new Date(startDate).toISOString());
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        assignmentsQuery = assignmentsQuery.lte('assigned_date', endDateTime.toISOString());
      }

      // Filter by specific user if selected
      if (selectedUserId !== 'all') {
        assignmentsQuery = assignmentsQuery.eq('user_id', selectedUserId);
      }

      const { data: assignments, error: fetchError } = await assignmentsQuery;
      
      if (fetchError) {
        console.error('Database fetch error:', fetchError);
        alert(`Database error: ${fetchError.message}`);
        return;
      }

      if (!assignments || assignments.length === 0) {
        alert('No operations found for the selected criteria.');
        return;
      }

      // Create comprehensive operations list with all actions
      const operations: any[] = [];
      
      assignments.forEach((assignment: any) => {
        // Assignment action
        operations.push({
          date: assignment.assigned_date,
          device: assignment.devices?.name || 'N/A',
          asset: assignment.devices?.asset_number || 'N/A',
          type: assignment.devices?.type || 'N/A',
          serial: assignment.devices?.serial_number || 'N/A',
          user: assignment.users?.full_name || 'N/A',
          department: assignment.users?.department || 'N/A',
          action: '✓ Device Assigned',
          status: 'Completed',
          notes: assignment.notes || '-',
        });
        
        // Return action (if exists)
        if (assignment.return_date) {
          operations.push({
            date: assignment.return_date,
            device: assignment.devices?.name || 'N/A',
            asset: assignment.devices?.asset_number || 'N/A',
            type: assignment.devices?.type || 'N/A',
            serial: assignment.devices?.serial_number || 'N/A',
            user: assignment.users?.full_name || 'N/A',
            department: assignment.users?.department || 'N/A',
            action: '↩ Device Returned',
            status: 'Completed',
            notes: 'Device returned to inventory',
          });
        }
      });
      
      // Sort all operations by date (newest first)
      operations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Prepare PDF data
      const tableData = operations.map((op: any) => [
        new Date(op.date).toLocaleDateString(),
        op.device,
        op.asset,
        op.type,
        op.serial,
        op.user,
        op.department,
        op.action,
        op.status,
        op.notes,
      ]);
      
      // Build report title
      let reportTitle = 'Operations Report';
      if (selectedUserId !== 'all') {
        const selectedUser = users.find(u => u.id === selectedUserId);
        if (selectedUser) {
          reportTitle = 'Operations Report - ' + selectedUser.full_name;
        }
      }
      
      // Build period text
      let periodText = 'Period: All Time';
      if (startDate && endDate) {
        periodText = `Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
      } else if (startDate) {
        periodText = `Period: From ${new Date(startDate).toLocaleDateString()}`;
      } else if (endDate) {
        periodText = `Period: Until ${new Date(endDate).toLocaleDateString()}`;
      }
      
      // Create PDF
      const doc = new jsPDF();
      addLogoToPDF(doc, reportTitle);
      
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text('Generated: ' + new Date().toLocaleDateString(), 14, 50);
      doc.text(periodText, 14, 56);
      doc.text('Total Assignments: ' + assignments.length, 14, 62);
      doc.text('Total Operations (including returns): ' + operations.length, 14, 68);

      autoTable(doc, {
        startY: 74,
        head: [['Date', 'Device', 'Asset No.', 'Type', 'Serial', 'User', 'Dept', 'Action', 'Status', 'Notes']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 6, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 25 },
          2: { cellWidth: 18 },
          3: { cellWidth: 15 },
          4: { cellWidth: 22 },
          5: { cellWidth: 22 },
          6: { cellWidth: 20 },
          7: { cellWidth: 25, fontStyle: 'bold', halign: 'center' },
          8: { cellWidth: 15, halign: 'center' },
          9: { cellWidth: 20 },
        },
      });

      // Build filename
      const today = new Date().toISOString().split('T')[0];
      let fileName = 'operations_report_' + today + '.pdf';
      if (selectedUserId !== 'all') {
        const selectedUser = users.find(u => u.id === selectedUserId);
        if (selectedUser) {
          const userName = selectedUser.full_name.replace(/\s+/g, '_');
          fileName = 'operations_report_' + userName + '_' + today + '.pdf';
        }
      }
      
      doc.save(fileName);
    } catch (error) {
      console.error('Error in generateOperationsReport:', error);
      alert(`Error generating report: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  // 2. Asset Report - All assets grouped by status
  const generateAssetReport = async () => {
    let query = supabase
      .from('devices')
      .select('*, users!devices_assigned_to_fkey(full_name, email, department)')
      .order('status');

    // Filter by specific user if selected
    if (selectedUserId !== 'all') {
      query = query.eq('assigned_to', selectedUserId);
    }

    const { data: devices } = await query;

    if (!devices) return;

    const doc = new jsPDF();
    
    // Add logo and header
    const reportTitle = selectedUserId === 'all'
      ? 'Asset Report - All Assets Grouped by Status'
      : `Asset Report - ${users.find(u => u.id === selectedUserId)?.full_name || 'User'}`;
    addLogoToPDF(doc, reportTitle);
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 50);
    doc.text(`Total Assets: ${devices.length}`, 14, 56);
    
    // Group devices by status
    const groupedByStatus: { [key: string]: any[] } = {};
    devices.forEach((device: any) => {
      const status = device.status || 'unknown';
      if (!groupedByStatus[status]) {
        groupedByStatus[status] = [];
      }
      groupedByStatus[status].push(device);
    });

    // Display summary
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Assets Summary by Status:', 14, 64);
    doc.setFont('helvetica', 'normal');
    let yPos = 70;
    Object.entries(groupedByStatus).forEach(([status, statusDevices]) => {
      doc.text(`${status.toUpperCase()}: ${statusDevices.length} devices`, 20, yPos);
      yPos += 5;
    });

    let startY = yPos + 10;

    // Create tables for each status group
    Object.entries(groupedByStatus).forEach(([status, statusDevices]) => {
      if (startY > 250) {
        doc.addPage();
        startY = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(`${status.toUpperCase()} (${statusDevices.length})`, 14, startY);
      doc.setTextColor(0, 0, 0);
      
      const tableData = statusDevices.map((device: any) => [
        device.name,
        device.asset_number || 'N/A',
        device.type,
        device.serial_number,
        device.users?.full_name || 'N/A',
        device.users?.department || 'N/A',
        device.purchase_date,
        device.assigned_date ? new Date(device.assigned_date).toLocaleDateString() : 'N/A',
      ]);

      autoTable(doc, {
        startY: startY + 5,
        head: [['Device', 'Asset No.', 'Type', 'Serial Number', 'Employee', 'Department', 'Purchase Date', 'Assigned Date']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 7 },
      });

      startY = (doc as any).lastAutoTable.finalY + 15;
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
      device.asset_number || 'N/A',
      device.serial_number,
      device.specifications || 'N/A',
      device.purchase_date,
      device.warranty_expiry || 'N/A',
    ]);

    autoTable(doc, {
      startY: yPos + 5,
      head: [['Type', 'Device Name', 'Asset No.', 'Serial Number', 'Specifications', 'Purchase Date', 'Warranty Expiry']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 7 },
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

    // Filter to show only users with devices
    const usersWithDevices = usersData.filter((user: any) => {
      const devices = user.devices || [];
      return devices.length > 0;
    });

    if (usersWithDevices.length === 0) {
      alert('No users with assigned devices found.');
      return;
    }

    const doc = new jsPDF();
    
    // Add logo and header
    const reportTitle = selectedUserId === 'all'
      ? 'User Devices Report - Users with Devices'
      : `User Devices Report - ${users.find(u => u.id === selectedUserId)?.full_name || 'User'}`;
    addLogoToPDF(doc, reportTitle);
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 50);
    doc.text(`Total Users with Devices: ${usersWithDevices.length}`, 14, 56);
    
    let startY = 65;

    usersWithDevices.forEach((user: any) => {
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

      const tableData = devices.map((device: any) => [
        device.name,
        device.asset_number || 'N/A',
        device.type,
        device.serial_number,
        device.assigned_date ? new Date(device.assigned_date).toLocaleDateString() : 'N/A',
      ]);

      autoTable(doc, {
        startY: startY + 18,
        head: [['Device Name', 'Asset No.', 'Type', 'Serial Number', 'Assigned Date']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: 20 },
        styles: { fontSize: 8 },
      });

      startY = (doc as any).lastAutoTable.finalY + 15;
    });

    const fileName = selectedUserId === 'all' 
      ? 'user_devices_report_all.pdf'
      : `user_devices_report_${usersWithDevices[0]?.full_name.replace(/\s+/g, '_')}.pdf`;
    
    doc.save(fileName);
  };

  // 5. Warranty Status Report - All devices (in warranty and out of warranty)
  const generateWarrantyReport = async () => {
    const { data: devices } = await supabase
      .from('devices')
      .select('*')
      .order('purchase_date', { ascending: false });

    if (!devices) return;

    // Separate devices by warranty status (within 4 years of purchase)
    const fourYearsAgo = new Date();
    fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);

    const underWarranty = devices.filter((device: any) => {
      const purchaseDate = new Date(device.purchase_date);
      return purchaseDate >= fourYearsAgo;
    });

    const outOfWarranty = devices.filter((device: any) => {
      const purchaseDate = new Date(device.purchase_date);
      return purchaseDate < fourYearsAgo;
    });

    const doc = new jsPDF();
    
    // Add logo and header
    addLogoToPDF(doc, 'Warranty Status Report');
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 50);
    doc.text(`Total Devices: ${devices.length}`, 14, 56);
    doc.text(`Under Warranty: ${underWarranty.length}`, 14, 62);
    doc.text(`Out of Warranty: ${outOfWarranty.length}`, 14, 68);
    doc.text(`Warranty Period: 4 years from purchase date`, 14, 74);
    
    let startY = 82;

    // Section 1: Devices Under Warranty
    if (underWarranty.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 197, 94); // Green color
      doc.text('✓ DEVICES UNDER WARRANTY', 14, startY);
      doc.setTextColor(0, 0, 0);
      
      const underWarrantyData = underWarranty.map((device: any) => {
        const purchaseDate = new Date(device.purchase_date);
        const warrantyEndDate = new Date(purchaseDate);
        warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 4);
        
        const daysRemaining = Math.ceil((warrantyEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        return [
          device.name,
          device.asset_number || 'N/A',
          device.type,
          device.serial_number,
          device.purchase_date,
          warrantyEndDate.toLocaleDateString(),
          daysRemaining > 0 ? `${daysRemaining} days` : 'Expired',
          device.status,
        ];
      });

      autoTable(doc, {
        startY: startY + 6,
        head: [['Device Name', 'Asset No.', 'Type', 'Serial Number', 'Purchase Date', 'Warranty Ends', 'Days Remaining', 'Status']],
        body: underWarrantyData,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] }, // Green
        styles: { fontSize: 7 },
        columnStyles: {
          6: { halign: 'center' },
        },
      });

      startY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Section 2: Devices Out of Warranty
    if (outOfWarranty.length > 0) {
      if (startY > 250) {
        doc.addPage();
        startY = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(239, 68, 68); // Red color
      doc.text('✕ DEVICES OUT OF WARRANTY', 14, startY);
      doc.setTextColor(0, 0, 0);
      
      const outOfWarrantyData = outOfWarranty.map((device: any) => {
        const purchaseDate = new Date(device.purchase_date);
        const warrantyEndDate = new Date(purchaseDate);
        warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 4);
        
        const daysExpired = Math.abs(Math.ceil((warrantyEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
        
        return [
          device.name,
          device.asset_number || 'N/A',
          device.type,
          device.serial_number,
          device.purchase_date,
          warrantyEndDate.toLocaleDateString(),
          `${daysExpired} days ago`,
          device.status,
        ];
      });

      autoTable(doc, {
        startY: startY + 6,
        head: [['Device Name', 'Asset No.', 'Type', 'Serial Number', 'Purchase Date', 'Warranty Ended', 'Expired', 'Status']],
        body: outOfWarrantyData,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] }, // Red
        styles: { fontSize: 7 },
        columnStyles: {
          6: { halign: 'center' },
        },
      });
    }

    doc.save(`warranty_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // 6. IT Problems Report - All IT support problems reported by employees
  const generateITProblemsReport = async () => {
    const { data: problems } = await supabase
      .from('requests')
      .select('*, user:users!requests_user_id_fkey(full_name, email, department)')
      .eq('request_type', 'it_support')
      .order('created_at', { ascending: false });

    if (!problems) return;

    const doc = new jsPDF();
    
    // Add logo and header
    addLogoToPDF(doc, 'IT Problems Report');
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 50);
    doc.text(`Total IT Problems: ${problems.length}`, 14, 56);
    
    // Group by status
    const statusGroups = ['pending', 'in_progress', 'completed', 'closed'];
    const groupCounts = statusGroups.map(status => ({
      status,
      count: problems.filter((p: any) => p.status === status).length
    }));

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Problems Summary by Status:', 14, 64);
    doc.setFont('helvetica', 'normal');
    let yPos = 70;
    groupCounts.forEach(({ status, count }) => {
      if (count > 0) {
        doc.text(`${status.toUpperCase()}: ${count} problems`, 20, yPos);
        yPos += 5;
      }
    });

    const tableData = problems.map((problem: any) => [
      new Date(problem.created_at).toLocaleDateString(),
      problem.user?.full_name || 'N/A',
      problem.user?.department || 'N/A',
      problem.title,
      problem.description.length > 100 ? problem.description.substring(0, 100) + '...' : problem.description,
      problem.priority.toUpperCase(),
      problem.status.replace('_', ' ').toUpperCase(),
    ]);

    autoTable(doc, {
      startY: yPos + 5,
      head: [['Date', 'Employee', 'Department', 'Problem Title', 'Description', 'Priority', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 7 },
      columnStyles: {
        4: { cellWidth: 50 }, // Description column wider
      },
    });

    // Add summary at the end
    const finalY = (doc as any).lastAutoTable.finalY || 80;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Problems Reported: ${problems.length}`, 14, finalY + 10);
    
    const pendingCount = problems.filter((p: any) => p.status === 'pending').length;
    if (pendingCount > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(`⚠ ${pendingCount} problems pending attention`, 14, finalY + 16);
    }

    doc.save(`it_problems_report_${new Date().toISOString().split('T')[0]}.pdf`);
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
        case 'it_problems':
          await generateITProblemsReport();
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
      <main className="ml-64 flex-1 min-h-screen p-8">
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
                className={`text-left p-6 rounded-lg shadow-md transition-all border-2 ${
                  isSelected
                    ? 'bg-gradient-to-br from-green-600 to-emerald-700 text-white border-green-400 dark:border-green-500 shadow-xl scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 hover:shadow-lg hover:scale-105 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-lg flex-shrink-0 ${
                      isSelected 
                        ? 'bg-gray-900 dark:bg-gray-950 bg-opacity-30 dark:bg-opacity-50' 
                        : 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30'
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        isSelected ? 'text-white' : 'text-green-600 dark:text-green-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold mb-2">{report.title}</h3>
                    <p
                      className={`text-sm leading-relaxed ${
                        isSelected ? 'text-green-50 dark:text-green-100' : 'text-gray-600 dark:text-gray-400'
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {reportTypes.find((r) => r.id === selectedReport)?.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {reportTypes.find((r) => r.id === selectedReport)?.description}
              </p>
            </div>
            <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            {/* Date Range Filter - Show for operations report */}
            {selectedReport === 'operations' && (
              <div className="mb-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Filter by Date Range
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="report-start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      id="report-start-date"
                      name="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="mm/dd/yyyy"
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="report-end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      id="report-end-date"
                      name="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="mm/dd/yyyy"
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center mt-0.5">
                      <Info className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        {startDate || endDate ? 'Date Filter Applied' : 'All Dates (No Filter)'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {startDate && endDate
                          ? `Showing operations from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`
                          : startDate
                          ? `Showing operations from ${new Date(startDate).toLocaleDateString()} onwards`
                          : endDate
                          ? `Showing operations until ${new Date(endDate).toLocaleDateString()}`
                          : 'Showing all operations (no date filter applied)'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Selector - Show for user-related reports */}
            {(selectedReport === 'user_devices' || selectedReport === 'operations' || selectedReport === 'assets') && (
              <div className="mb-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <label htmlFor="report-user-filter" className="text-sm font-semibold text-gray-900 dark:text-white">
                    Filter by User
                  </label>
                </div>
                <div className="relative">
                  <select
                    id="report-user-filter"
                    name="userFilter"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-4 py-3 pl-20 pr-10 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white appearance-none cursor-pointer font-medium"
                  >
                    <option value="all">All Users</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} - {user.department}
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <Flag className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 dark:text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center mt-0.5">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        {selectedUserId === 'all' ? 'All Users Selected' : 'Specific User Selected'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
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
                </div>
              </div>
            )}

            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className={`flex items-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all ${
                isGenerating
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white'
                  : 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white shadow-md hover:shadow-lg'
              }`}
            >
              <Download className="w-5 h-5" />
              <span>{isGenerating ? 'Generating Report...' : 'Generate & Download PDF'}</span>
            </button>

            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">Report Information:</h4>
              <ul className="space-y-1 text-sm text-green-800 dark:text-green-400">
                <li>• Report will be generated in PDF format</li>
                <li>• All data is current as of today</li>
                <li>• Report includes detailed information with tables</li>
                <li>• Download will start automatically when ready</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recent Reports Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Report Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📋 Operations Report</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track all device assignments and operations filtered by custom date range with detailed history.
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">💼 Asset Report</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All assets organized and grouped by their current status (assigned, available, maintenance, etc.).
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">👤 User Devices Report</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Shows only users who have devices assigned, with detailed breakdown of their equipment.
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📦 Available Stock Report</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Inventory showing only available devices in stock ready for assignment with specifications.
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🛡️ Warranty Status Report</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complete warranty overview showing both devices in warranty and out of warranty separately.
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🔧 IT Problems Report</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All IT support problems reported by employees with names, titles, and brief descriptions.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;

