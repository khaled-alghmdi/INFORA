// Core Types for INFORA IT Device Inventory System

export type DeviceStatus = 'available' | 'assigned' | 'maintenance';

export type DeviceType = 
  | 'Laptop'
  | 'Desktop'
  | 'Monitor'
  | 'Mobile'
  | 'Tablet'
  | 'Printer'
  | 'Keyboard'
  | 'Mouse'
  | 'Other';

export type UserRole = 'admin' | 'user';

export interface Device {
  id: string;
  name: string;
  type: string;
  serial_number: string;
  status: DeviceStatus;
  assigned_to: string | null;
  assigned_date: string | null;
  purchase_date: string;
  warranty_expiry: string | null;
  specifications: string | null;
  created_at: string;
  updated_at: string;
  assignee_name?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  department: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  device_count?: number;
}

export interface Assignment {
  id: string;
  device_id: string;
  user_id: string;
  assigned_date: string;
  return_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalDevices: number;
  assignedDevices: number;
  availableDevices: number;
  maintenanceDevices: number;
  totalUsers: number;
  activeUsers: number;
}

export interface DeviceFormData {
  name: string;
  type: string;
  serial_number: string;
  status: DeviceStatus;
  purchase_date: string;
  warranty_expiry: string;
  specifications: string;
}

export interface UserFormData {
  email: string;
  full_name: string;
  department: string;
  role: UserRole;
  is_active: boolean;
}

export type ReportType = 
  | 'all_devices'
  | 'assigned_devices'
  | 'available_devices'
  | 'user_devices'
  | 'maintenance_history';

