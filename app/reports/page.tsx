'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import { FileText, Download, Calendar, User, Info, CheckCircle, Flag } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import SearchableUserSelect from '@/components/SearchableUserSelect';

type ReportType = 
  | 'operations'
  | 'assets'
  | 'user_devices'
  | 'available_stock'
  | 'warranty'
  | 'it_problems'
  | 'permanent_devices';

const ReportsPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType>('operations');
  const [users, setUsers] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('all');
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  
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
    {
      id: 'permanent_devices' as ReportType,
      title: 'Delivery Note Required Report',
      description: 'Users who MUST do delivery notes for specific devices',
      icon: FileText,
    },
  ];

  useEffect(() => {
    fetchUsers();
    loadLogo();
  }, []);

  useEffect(() => {
    // Load preview when report type changes
    loadPreviewData();
  }, [selectedReport, selectedUserId, startDate, endDate]);

  const loadPreviewData = async () => {
    setIsLoadingPreview(true);
    
    try {
      let data: any = null;

      switch (selectedReport) {
        case 'operations':
          let query = supabase
            .from('assignments')
            .select('assigned_date, return_date, notes, devices(name, type, serial_number, asset_number), users(full_name, department)')
            .order('assigned_date', { ascending: false });

          if (startDate) query = query.gte('assigned_date', new Date(startDate).toISOString());
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59);
            query = query.lte('assigned_date', end.toISOString());
          }
          if (selectedUserId !== 'all') query = query.eq('user_id', selectedUserId);

          const { data: assignments } = await query;
          data = { type: 'operations', data: assignments || [] };
          break;

        case 'assets':
          let assetsQuery = supabase
            .from('devices')
            .select('*, users!devices_assigned_to_fkey(full_name, email, department)')
            .order('status');

          if (selectedUserId !== 'all') {
            assetsQuery = assetsQuery.eq('assigned_to', selectedUserId);
          }

          const { data: assets } = await assetsQuery;
          data = { type: 'assets', data: assets || [] };
          break;

        case 'user_devices':
          let userDevQuery = supabase
            .from('users')
            .select('*, devices!devices_assigned_to_fkey(*)')
            .order('full_name');

          if (selectedUserId !== 'all') {
            userDevQuery = userDevQuery.eq('id', selectedUserId);
          }

          const { data: usersData } = await userDevQuery;
          const usersWithDevices = (usersData || []).filter((user: any) => {
            const devices = user.devices || [];
            return devices.length > 0;
          });
          data = { type: 'user_devices', data: usersWithDevices };
          break;

        case 'available_stock':
          const { data: availDevices } = await supabase
            .from('devices')
            .select('*')
            .eq('status', 'available')
            .order('type');

          data = { type: 'available_stock', data: availDevices || [] };
          break;

        case 'warranty':
          const { data: allDevices } = await supabase
            .from('devices')
            .select('*')
            .order('purchase_date', { ascending: false });

          const fourYearsAgo = new Date();
          fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);

          const underWarranty = (allDevices || []).filter((device: any) => {
            const purchaseDate = new Date(device.purchase_date);
            return purchaseDate >= fourYearsAgo;
          });

          const outOfWarranty = (allDevices || []).filter((device: any) => {
            const purchaseDate = new Date(device.purchase_date);
            return purchaseDate < fourYearsAgo;
          });

          data = { type: 'warranty', underWarranty, outOfWarranty, total: allDevices?.length || 0 };
          break;

        case 'it_problems':
          const { data: problems } = await supabase
            .from('requests')
            .select('*, user:users!requests_user_id_fkey(full_name, email, department)')
            .eq('request_type', 'it_support')
            .order('created_at', { ascending: false });

          data = { type: 'it_problems', data: problems || [] };
          break;

        case 'permanent_devices':
          const { data: usersWithReminders } = await supabase
            .from('users')
            .select('*, permanent_device:devices!users_permanent_device_id_fkey(name, type, asset_number, serial_number, status)')
            .eq('has_permanent_device', true)
            .not('permanent_device_id', 'is', null)
            .order('full_name');

          data = { type: 'permanent_devices', data: usersWithReminders || [] };
          break;
      }

      setPreviewData(data);
    } catch (error) {
      console.error('Error loading preview:', error);
      setPreviewData(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const loadLogo = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        setLogoDataUrl(dataUrl);
        setLogoLoaded(true);
      }
    };
    img.onerror = () => {
      console.warn('Logo failed to load');
      setLogoLoaded(false);
    };
    img.src = '/Tamer_logo.png';
  };

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

  // Add header to PDF with logo
  const addLogoToPDF = (doc: jsPDF, title: string) => {
    // Add Tamer logo if loaded
    if (logoLoaded && logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', 14, 10, 25, 25);
      } catch (error) {
        console.warn('Error adding logo:', error);
      }
    }
    
    // Add company name next to logo
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // Green color
    doc.text('TAMER CONSUMER COMPANY', 44, 18);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('IT Device Inventory Management System', 44, 26);
    
    // Add line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 38, 196, 38);
    
    // Add report title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(title, 14, 48);
  };

  // 1. OPERATIONS REPORT - REWRITTEN FROM SCRATCH
  const generateOperationsReport = async () => {
    console.log('=== GENERATING NEW OPERATIONS REPORT ===');
    
    try {
      // STEP 1: Fetch assignments from database
      let query = supabase
        .from('assignments')
        .select('assigned_date, return_date, notes, devices(name, type, serial_number, asset_number), users(full_name, department)')
        .order('assigned_date', { ascending: false });

      if (startDate) query = query.gte('assigned_date', new Date(startDate).toISOString());
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59);
        query = query.lte('assigned_date', end.toISOString());
      }
      if (selectedUserId !== 'all') query = query.eq('user_id', selectedUserId);

      const { data, error } = await query;
      
      if (error) {
        alert('Database error: ' + error.message);
        return;
      }
      if (!data || data.length === 0) {
        alert('No operations found.');
        return;
      }

      // STEP 2: Build operations array
      const allOps = [];
      
      for (const row of data) {
        // Add ASSIGNED operation
        allOps.push({
          date: row.assigned_date,
          deviceName: row.devices?.name || 'N/A',
          assetNo: row.devices?.asset_number || 'N/A',
          deviceType: row.devices?.type || 'N/A',
          serial: row.devices?.serial_number || 'N/A',
          userName: row.users?.full_name || 'N/A',
          dept: row.users?.department || 'N/A',
          action: 'ASSIGNED',
          notes: row.notes || '-'
        });
        
        // Add RETURNED operation if exists
        if (row.return_date) {
          allOps.push({
            date: row.return_date,
            deviceName: row.devices?.name || 'N/A',
            assetNo: row.devices?.asset_number || 'N/A',
            deviceType: row.devices?.type || 'N/A',
            serial: row.devices?.serial_number || 'N/A',
            userName: row.users?.full_name || 'N/A',
            dept: row.users?.department || 'N/A',
            action: 'RETURNED',
            notes: 'Returned to inventory'
          });
        }
      }
      
      // Sort by date newest first
      allOps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      console.log('Total operations:', allOps.length);

      // STEP 3: Create PDF (LANDSCAPE)
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      
      // Add header with logo
      if (logoLoaded && logoDataUrl) {
        pdf.addImage(logoDataUrl, 'PNG', 14, 10, 25, 25);
      }
      
      pdf.setFontSize(16);
      pdf.setTextColor(16, 185, 129);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TAMER CONSUMER COMPANY', 44, 18);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('IT Device Inventory Management System', 44, 26);
      
      pdf.setDrawColor(200, 200, 200);
      pdf.line(14, 38, 283, 38);
      
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      const title = selectedUserId === 'all' ? 'Operations Report' : 'Operations Report - ' + (users.find(u => u.id === selectedUserId)?.full_name || 'User');
      pdf.text(title, 14, 48);
      
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Generated: ' + new Date().toLocaleDateString(), 14, 56);
      
      let period = 'Period: All Time';
      if (startDate && endDate) period = 'Period: ' + new Date(startDate).toLocaleDateString() + ' - ' + new Date(endDate).toLocaleDateString();
      else if (startDate) period = 'Period: From ' + new Date(startDate).toLocaleDateString();
      else if (endDate) period = 'Period: Until ' + new Date(endDate).toLocaleDateString();
      pdf.text(period, 14, 62);
      
      pdf.text('Total Assignments: ' + data.length, 14, 68);
      pdf.text('Total Operations: ' + allOps.length, 14, 74);

      // STEP 4: Create table
      const tableRows = allOps.map(op => [
        new Date(op.date).toLocaleDateString(),
        op.deviceName,
        op.assetNo,
        op.deviceType,
        op.serial,
        op.userName,
        op.dept,
        op.action,
        'Completed',
        op.notes
      ]);
      
      autoTable(pdf, {
        startY: 82,
        head: [['Date', 'Device', 'Asset No.', 'Type', 'Serial', 'User', 'Department', 'Action', 'Status', 'Notes']],
        body: tableRows,
        theme: 'striped',
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 24, halign: 'center' },
          1: { cellWidth: 34 },
          2: { cellWidth: 24, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 26, halign: 'center' },
          5: { cellWidth: 34 },
          6: { cellWidth: 28 },
          7: { cellWidth: 28, fontStyle: 'bold', halign: 'center', fillColor: [240, 253, 244] },
          8: { cellWidth: 24, halign: 'center' },
          9: { cellWidth: 32 }
        }
      });

      // STEP 5: Save PDF
      const filename = 'Operations_Report_' + new Date().toISOString().split('T')[0] + '.pdf';
      pdf.save(filename);
      
      console.log('=== REPORT GENERATED SUCCESSFULLY ===');
      
    } catch (err) {
      console.error('ERROR:', err);
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown'));
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
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 56);
    doc.text(`Total Devices: ${devices.length}`, 14, 62);
    doc.text(`Under Warranty: ${underWarranty.length}`, 14, 68);
    doc.text(`Out of Warranty: ${outOfWarranty.length}`, 14, 74);
    doc.text(`Warranty Period: 4 years from purchase date`, 14, 80);
    
    let startY = 88;

    // Section 1: Devices Under Warranty
    if (underWarranty.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 197, 94); // Green color
      doc.text('[OK] DEVICES UNDER WARRANTY', 14, startY);
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
      doc.text('[X] DEVICES OUT OF WARRANTY', 14, startY);
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
      doc.text(`[!] ${pendingCount} problems pending attention`, 14, finalY + 16);
    }

    doc.save(`it_problems_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // 7. Delivery Note Required Report - Users who MUST do delivery notes for specific devices
  const generatePermanentDevicesReport = async () => {
    const { data: usersWithReminders } = await supabase
      .from('users')
      .select('*, permanent_device:devices!users_permanent_device_id_fkey(name, type, asset_number, serial_number, status)')
      .eq('has_permanent_device', true)
      .not('permanent_device_id', 'is', null)
      .order('full_name');

    if (!usersWithReminders || usersWithReminders.length === 0) {
      alert('No users with delivery note requirements found.');
      return;
    }

    const doc = new jsPDF();
    
    // Add logo and header
    addLogoToPDF(doc, 'Delivery Note Required Report');
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 56);
    doc.text(`Total Users with Delivery Note Requirements: ${usersWithReminders.length}`, 14, 62);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38); // Red color
    doc.text('IMPORTANT: These users MUST do delivery notes for their assigned devices', 14, 70);
    doc.setTextColor(0, 0, 0);

    const tableData = usersWithReminders.map((user: any) => [
      user.full_name,
      user.email,
      user.department,
      user.employee_id || 'N/A',
      user.permanent_device?.name || 'N/A',
      user.permanent_device?.type || 'N/A',
      user.permanent_device?.asset_number || 'N/A',
      user.permanent_device?.serial_number || 'N/A',
      user.permanent_device?.status || 'N/A',
    ]);

    autoTable(doc, {
      startY: 78,
      head: [['User Name', 'Email', 'Department', 'Employee ID', 'Device Name', 'Type', 'Asset No.', 'Serial Number', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [220, 38, 38], // Red 
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: 'bold' },
        1: { cellWidth: 35 },
        4: { cellWidth: 28, fillColor: [254, 226, 226] }, // Light red background for device
      },
    });

    // Add footer note
    const finalY = (doc as any).lastAutoTable.finalY || 80;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`REMINDER: All ${usersWithReminders.length} users listed MUST do delivery notes!`, 14, finalY + 10);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('This report shows users flagged to require delivery notes for their specific assigned devices.', 14, finalY + 16);

    doc.save(`delivery_note_required_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const renderPreviewTable = () => {
    if (!previewData || !previewData.data) return null;

    const data = previewData.data;

    // Show message if no data
    if (data.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No data found for this report.</p>
        </div>
      );
    }

    // Render based on report type
    switch (previewData.type) {
      case 'permanent_devices':
        return (
          <table className="w-full text-sm">
            <thead className="bg-red-600 text-white sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">User Name</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Department</th>
                <th className="px-4 py-3 text-left font-semibold bg-red-700">Device Name</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Asset No.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.slice(0, 20).map((user: any, index: number) => (
                <tr key={user.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{user.full_name}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{user.email}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{user.department}</td>
                  <td className="px-4 py-3 font-semibold text-red-900 dark:text-red-300 bg-red-50 dark:bg-red-900/20">
                    {user.permanent_device?.name || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{user.permanent_device?.type || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono">{user.permanent_device?.asset_number || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'available_stock':
        return (
          <table className="w-full text-sm">
            <thead className="bg-green-600 text-white sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Device Name</th>
                <th className="px-4 py-3 text-left font-semibold">Asset No.</th>
                <th className="px-4 py-3 text-left font-semibold">Serial Number</th>
                <th className="px-4 py-3 text-left font-semibold">Purchase Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.slice(0, 20).map((device: any, index: number) => (
                <tr key={device.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{device.type}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{device.name}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono">{device.asset_number || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono text-xs">{device.serial_number}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{new Date(device.purchase_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'assets':
        return (
          <table className="w-full text-sm">
            <thead className="bg-green-600 text-white sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Device Name</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Asset No.</th>
                <th className="px-4 py-3 text-left font-semibold">Serial Number</th>
                <th className="px-4 py-3 text-left font-semibold">Assigned To</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.slice(0, 20).map((device: any, index: number) => (
                <tr key={device.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{device.name}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{device.type}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono">{device.asset_number || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono text-xs">{device.serial_number}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{device.users?.full_name || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      device.status === 'assigned' ? 'bg-green-100 text-green-700' :
                      device.status === 'available' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {device.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'it_problems':
        return (
          <table className="w-full text-sm">
            <thead className="bg-green-600 text-white sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Employee</th>
                <th className="px-4 py-3 text-left font-semibold">Department</th>
                <th className="px-4 py-3 text-left font-semibold">Problem Title</th>
                <th className="px-4 py-3 text-left font-semibold">Priority</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.slice(0, 20).map((problem: any, index: number) => (
                <tr key={problem.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{new Date(problem.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{problem.user?.full_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{problem.user?.department || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{problem.title}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      problem.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      problem.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      problem.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {problem.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 capitalize">{problem.status.replace('_', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'operations':
        return (
          <table className="w-full text-sm">
            <thead className="bg-green-600 text-white sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Device</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">User</th>
                <th className="px-4 py-3 text-left font-semibold">Department</th>
                <th className="px-4 py-3 text-left font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.slice(0, 20).map((assignment: any, index: number) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{new Date(assignment.assigned_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{assignment.devices?.name || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{assignment.devices?.type || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{assignment.users?.full_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{assignment.users?.department || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{assignment.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'user_devices':
        return (
          <div className="space-y-4">
            {data.slice(0, 20).map((user: any) => (
              <div key={user.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{user.full_name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.department} • {user.email}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                    {user.devices.length} device{user.devices.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Device Name</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Type</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Asset No.</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Assigned Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.devices.map((device: any) => (
                        <tr key={device.id}>
                          <td className="px-3 py-2 text-gray-900 dark:text-white">{device.name}</td>
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{device.type}</td>
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300 font-mono">{device.asset_number || 'N/A'}</td>
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                            {device.assigned_date ? new Date(device.assigned_date).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        );

      case 'warranty':
        return (
          <div className="space-y-6">
            {previewData.underWarranty.length > 0 && (
              <div>
                <h4 className="text-lg font-bold text-green-700 dark:text-green-400 mb-3">
                  ✓ DEVICES UNDER WARRANTY ({previewData.underWarranty.length})
                </h4>
                <table className="w-full text-sm">
                  <thead className="bg-green-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Device Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Type</th>
                      <th className="px-4 py-3 text-left font-semibold">Purchase Date</th>
                      <th className="px-4 py-3 text-left font-semibold">Warranty Ends</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {previewData.underWarranty.slice(0, 10).map((device: any, index: number) => {
                      const purchaseDate = new Date(device.purchase_date);
                      const warrantyEndDate = new Date(purchaseDate);
                      warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 4);
                      
                      return (
                        <tr key={device.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{device.name}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{device.type}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{device.purchase_date}</td>
                          <td className="px-4 py-3 text-green-700 dark:text-green-400 font-semibold">{warrantyEndDate.toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{device.status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {previewData.underWarranty.length > 10 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    ...and {previewData.underWarranty.length - 10} more (showing first 10)
                  </p>
                )}
              </div>
            )}
            
            {previewData.outOfWarranty.length > 0 && (
              <div>
                <h4 className="text-lg font-bold text-red-700 dark:text-red-400 mb-3">
                  ✗ DEVICES OUT OF WARRANTY ({previewData.outOfWarranty.length})
                </h4>
                <table className="w-full text-sm">
                  <thead className="bg-red-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Device Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Type</th>
                      <th className="px-4 py-3 text-left font-semibold">Purchase Date</th>
                      <th className="px-4 py-3 text-left font-semibold">Warranty Ended</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {previewData.outOfWarranty.slice(0, 10).map((device: any, index: number) => {
                      const purchaseDate = new Date(device.purchase_date);
                      const warrantyEndDate = new Date(purchaseDate);
                      warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 4);
                      
                      return (
                        <tr key={device.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{device.name}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{device.type}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{device.purchase_date}</td>
                          <td className="px-4 py-3 text-red-700 dark:text-red-400 font-semibold">{warrantyEndDate.toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{device.status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {previewData.outOfWarranty.length > 10 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    ...and {previewData.outOfWarranty.length - 10} more (showing first 10)
                  </p>
                )}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Preview not available for this report type.</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Click "Generate & Download PDF" to create the report.</p>
          </div>
        );
    }
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
        case 'permanent_devices':
          await generatePermanentDevicesReport();
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
                <SearchableUserSelect
                  users={users}
                  value={selectedUserId}
                  onChange={(userId) => setSelectedUserId(userId)}
                  placeholder="Select User"
                  showAllOption={true}
                />
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

        {/* Preview Section for ALL Reports */}
        {previewData && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-green-200 dark:border-green-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-green-900 dark:text-green-300">📋 Report Preview</h3>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isLoadingPreview ? 'Loading...' : 
                  previewData.type === 'warranty' 
                    ? `${previewData.total || 0} total devices`
                    : `${previewData.data?.length || 0} records`
                }
              </span>
            </div>

            {isLoadingPreview ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading preview...</p>
              </div>
            ) : (
              <>
                {previewData.data?.length > 20 && previewData.type !== 'warranty' && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-300">
                      <span className="font-bold">Showing first 20 of {previewData.data.length} records</span> - Full data will be in PDF
                    </p>
                  </div>
                )}
                <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  {/* Preview for each report type */}
                  {renderPreviewTable()}
                </div>
              </>
            )}
          </div>
        )}

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
            <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">⚠️ Delivery Note Required Report</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Users who MUST do delivery notes for specific devices - a reminder list with device details.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
