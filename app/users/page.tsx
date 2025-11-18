'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import { Plus, Edit, Trash2, Search, UserCheck, UserX, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import SearchableDeviceSelect from '@/components/SearchableDeviceSelect';

type User = {
  id: string;
  employee_id: string | null;
  email: string;
  full_name: string;
  department: string;
  role: string;
  is_active: boolean;
  has_permanent_device?: boolean;
  permanent_device_id?: string | null;
  initial_password: string | null;
  created_at: string;
  device_count?: number;
};

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [letterFilter, setLetterFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    email: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    department: '',
    role: 'user',
    is_active: true,
    has_permanent_device: false,
    permanent_device_id: '',
    initial_password: '',
  });

  const filterUsers = useCallback(() => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.employee_id && user.employee_id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter((user) => user.is_active === isActive);
    }

    // Letter filter - filter by first letter of name
    if (letterFilter !== 'all') {
      filtered = filtered.filter((user) => 
        user.full_name.charAt(0).toUpperCase() === letterFilter
      );
    }

    setFilteredUsers(filtered);
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [users, searchTerm, roleFilter, statusFilter, letterFilter]);

  useEffect(() => {
    fetchUsers();
    fetchDevices();

    // Set up real-time subscription for users
    const usersChannel = supabase
      .channel('users_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          console.log('User change detected:', payload);
          // Refresh users when any change occurs
          fetchUsers();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(usersChannel);
    };
  }, []);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const fetchUsers = async () => {
    // OPTIMIZED: Fetch users and device counts in parallel (not N+1 queries)
    const [usersResult, devicesResult] = await Promise.all([
      supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('devices')
        .select('assigned_to')
        .not('assigned_to', 'is', null)
    ]);

    const { data: usersData } = usersResult;
    const { data: devicesData } = devicesResult;

    if (usersData) {
      // Count devices per user efficiently
      const deviceCounts = (devicesData || []).reduce((acc: Record<string, number>, device) => {
        acc[device.assigned_to] = (acc[device.assigned_to] || 0) + 1;
        return acc;
      }, {});

      // Add device counts to users
      const usersWithCounts = usersData.map(user => ({
        ...user,
        device_count: deviceCounts[user.id] || 0,
      }));

      setUsers(usersWithCounts);
    }
  };

  const fetchDevices = async () => {
    const { data } = await supabase
      .from('devices')
      .select('id, name, type, asset_number, serial_number, status')
      .order('name');
    
    if (data) {
      setDevices(data);
    }
  };

  const handleCopyEmployeeId = (employeeId: string) => {
    navigator.clipboard.writeText(employeeId);
    alert('Employee ID copied to clipboard!');
  };

  const handleAddUser = async () => {
    // Validate required fields
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      alert('First name and last name are required!');
      return;
    }

    // Warn if no password is set
    if (!formData.initial_password) {
      const confirmed = confirm('⚠️ Warning: No password set! This user will not be able to login.\n\nDo you want to continue without a password?');
      if (!confirmed) return;
    }

    // Combine name fields into full_name
    const middlePart = formData.middle_name.trim() ? ` ${formData.middle_name.trim()}` : '';
    const full_name = `${formData.first_name.trim()}${middlePart} ${formData.last_name.trim()}`;

    // Validate permanent device if checkbox is checked
    if (formData.has_permanent_device && !formData.permanent_device_id) {
      alert('Please select a device if user does not do delivery note');
      return;
    }

    // Prepare data
    const userData = {
      employee_id: formData.employee_id || null,
      email: formData.email,
      full_name: full_name,
      department: formData.department,
      role: formData.role,
      is_active: formData.is_active,
      has_permanent_device: formData.has_permanent_device,
      permanent_device_id: formData.has_permanent_device ? formData.permanent_device_id : null,
      initial_password: formData.initial_password || null,
      password_changed_at: null, // Force password change on first login
    };

    const { error } = await supabase.from('users').insert([userData]);

    if (error) {
      console.error('Error adding user:', error);
      alert(`Error adding user: ${error.message}`);
      return;
    }

    setShowAddModal(false);
    fetchUsers();
    resetForm();
    alert('User added successfully!' + (formData.initial_password ? ' User can now login with the password you set.' : ''));
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    // Validate required fields
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      alert('First name and last name are required!');
      return;
    }

    // Combine name fields into full_name
    const middlePart = formData.middle_name.trim() ? ` ${formData.middle_name.trim()}` : '';
    const full_name = `${formData.first_name.trim()}${middlePart} ${formData.last_name.trim()}`;

    // Validate permanent device if checkbox is checked
    if (formData.has_permanent_device && !formData.permanent_device_id) {
      alert('Please select a device for delivery note reminder');
      return;
    }

    // Prepare data
    const userData: any = {
      employee_id: formData.employee_id || null,
      email: formData.email,
      full_name: full_name,
      department: formData.department,
      role: formData.role,
      is_active: formData.is_active,
      has_permanent_device: formData.has_permanent_device,
      permanent_device_id: formData.has_permanent_device ? formData.permanent_device_id : null,
      initial_password: formData.initial_password || null,
    };

    // If password was changed by admin, force user to change it on next login
    if (formData.initial_password && formData.initial_password !== selectedUser.initial_password) {
      userData.password_changed_at = null; // Force password change
    }

    const { error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', selectedUser.id);

    if (error) {
      console.error('Error updating user:', error);
      alert(`Error updating user: ${error.message}`);
      return;
    }

    setShowEditModal(false);
    fetchUsers();
    resetForm();
    setSelectedUser(null);
    
    // Notify admin about password change requirement
    if (formData.initial_password && formData.initial_password !== selectedUser.initial_password) {
      alert('User updated successfully! The user will be required to change their password on next login.');
    } else {
      alert('User updated successfully!');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to delete this user? This will unassign all their devices.')) {
      const { error } = await supabase.from('users').delete().eq('id', id);

      if (!error) {
        fetchUsers();
      }
    }
  };

  const handleToggleStatus = async (user: User) => {
    const { error } = await supabase
      .from('users')
      .update({ is_active: !user.is_active })
      .eq('id', user.id);

    if (!error) {
      fetchUsers();
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      email: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      department: '',
      role: 'user',
      is_active: true,
      has_permanent_device: false,
      permanent_device_id: '',
      initial_password: '',
    });
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    
    // Split full_name into parts
    const nameParts = user.full_name.trim().split(' ');
    const first_name = nameParts[0] || '';
    const middle_name = nameParts[1] || '';
    const last_name = nameParts.slice(2).join(' ') || '';
    
    setFormData({
      employee_id: user.employee_id || '',
      email: user.email,
      first_name: first_name,
      middle_name: middle_name,
      last_name: last_name,
      department: user.department,
      role: user.role,
      is_active: user.is_active,
      has_permanent_device: user.has_permanent_device || false,
      permanent_device_id: user.permanent_device_id || '',
      initial_password: user.initial_password || '',
    });
    setShowEditModal(true);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  const startItem = filteredUsers.length > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, filteredUsers.length);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of table when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-20 flex-1 min-h-screen p-8 transition-all duration-300">
        <PageHeader
          title="Users"
          description="Manage users and their access to the system"
          action={
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Add User</span>
            </button>
          }
        />

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, department, or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700"
            >
              <option value="all" className="text-gray-900 dark:text-white">All Roles</option>
              <option value="admin" className="text-gray-900 dark:text-white">Admin</option>
              <option value="user" className="text-gray-900 dark:text-white">User</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700"
            >
              <option value="all" className="text-gray-900 dark:text-white">All Status</option>
              <option value="active" className="text-gray-900 dark:text-white">Active</option>
              <option value="inactive" className="text-gray-900 dark:text-white">Inactive</option>
            </select>
          </div>

          {/* Alphabetical Filter */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Filter by first letter:</p>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setLetterFilter('all')}
                className={`px-2 py-1 text-[10px] font-semibold rounded transition-all ${
                  letterFilter === 'all'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map((letter) => (
                <button
                  key={letter}
                  onClick={() => setLetterFilter(letter)}
                  className={`w-6 h-6 text-[10px] font-bold rounded transition-all ${
                    letterFilter === letter
                      ? 'bg-green-600 text-white shadow-md scale-110'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-400'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Users Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{users.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Users</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {users.filter((u) => u.is_active).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Inactive Users</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {users.filter((u) => !u.is_active).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Admins</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {users.filter((u) => u.role === 'admin').length}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tighter min-w-[300px]">
                  Dept
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                  Role
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                  D
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tighter" title="Permanent Device">
                  📋
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {user.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{user.full_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px] leading-tight mt-0.5">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {user.employee_id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono bg-indigo-100 dark:bg-indigo-900/30 text-gray-900 dark:text-white px-2 py-1 rounded">
                          {user.employee_id}
                        </span>
                        <button
                          onClick={() => handleCopyEmployeeId(user.employee_id!)}
                          className="text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3 whitespace-normal min-w-[300px]">
                    <span className="text-sm text-gray-900 dark:text-white">{user.department}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        user.role === 'admin'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-gray-900 dark:text-white font-bold">{user.device_count || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.has_permanent_device ? (
                      <span className="text-lg" title="REMINDER: User MUST do delivery note for specific device">⚠️</span>
                    ) : (
                      <span className="text-lg text-gray-300 dark:text-gray-600" title="No special delivery note requirement">➖</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded ${
                        user.is_active
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200'
                      }`}
                    >
                      {user.is_active ? (
                        <>
                          <UserCheck className="w-3 h-3" />
                          <span>✓</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-3 h-3" />
                          <span>✗</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-green-600 dark:text-green-400 hover:text-green-800"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 text-base">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          
          {/* Pagination Controls */}
          {filteredUsers.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4 bg-gray-50 dark:bg-gray-900">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-semibold">{startItem}</span> to <span className="font-semibold">{endItem}</span> of{' '}
                  <span className="font-semibold">{filteredUsers.length}</span> users
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                      currentPage === 1
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                              currentPage === page
                                ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-md'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="px-2 text-gray-500 dark:text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                      currentPage === totalPages
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New User</h2>
              </div>
              <div className="overflow-y-auto flex-1 p-6">
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="First"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      value={formData.middle_name}
                      onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                      placeholder="Middle"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Last"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    placeholder="e.g., EMP-001, 12345"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="user" className="text-gray-900 dark:text-white">User</option>
                    <option value="admin" className="text-gray-900 dark:text-white">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Initial Password <span className="text-orange-600 dark:text-orange-400">(Recommended)</span>
                  </label>
                  <input
                    type="password"
                    value={formData.initial_password}
                    onChange={(e) => setFormData({ ...formData, initial_password: e.target.value })}
                    placeholder="Set temporary password for user login"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">🔐 Required for user to login. They should change it on first login.</p>
                </div>
                <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-green-600 dark:text-green-400 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Active User
                  </label>
                </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="has_permanent_device"
                        checked={formData.has_permanent_device}
                        onChange={(e) => {
                          setFormData({ 
                            ...formData, 
                            has_permanent_device: e.target.checked,
                            permanent_device_id: e.target.checked ? formData.permanent_device_id : ''
                          });
                        }}
                        className="h-4 w-4 text-red-600 dark:text-red-400 focus:ring-red-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                      <label htmlFor="has_permanent_device" className="ml-2 block text-sm font-medium text-red-900 dark:text-red-300">
                        ⚠️ REMINDER: User MUST Do Delivery Note for Specific Device
                      </label>
              </div>
                    
                    {formData.has_permanent_device && (
                      <div className="pl-6 space-y-2">
                        <label className="block text-sm font-semibold text-red-900 dark:text-red-300">
                          Select Device (User MUST do delivery note for this device):
                        </label>
                        <SearchableDeviceSelect
                          devices={devices}
                          value={formData.permanent_device_id}
                          onChange={(deviceId) => setFormData({ ...formData, permanent_device_id: deviceId })}
                          placeholder="-- Select Device --"
                          required={formData.has_permanent_device}
                        />
                        <p className="text-xs text-red-700 dark:text-red-300 font-bold">
                          📝 REMINDER: This user MUST do delivery note for the selected device!
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">
                    ℹ️ Check this to flag/remind admin that user MUST do delivery note for specific device
                  </p>
                </div>
              </div>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex justify-end space-x-4">
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
                  onClick={handleAddUser}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-md"
                >
                  Add User
                </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit User</h2>
              </div>
              <div className="overflow-y-auto flex-1 p-6">
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="First"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      value={formData.middle_name}
                      onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                      placeholder="Middle"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Last"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    placeholder="e.g., EMP-001, 12345"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="user" className="text-gray-900 dark:text-white">User</option>
                    <option value="admin" className="text-gray-900 dark:text-white">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Initial Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={formData.initial_password}
                    onChange={(e) => setFormData({ ...formData, initial_password: e.target.value })}
                    placeholder="Leave blank to keep current"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Update password or leave blank</p>
                </div>
                <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit_is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-green-600 dark:text-green-400 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label htmlFor="edit_is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Active User
                  </label>
                </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="edit_has_permanent_device"
                        checked={formData.has_permanent_device}
                        onChange={(e) => {
                          setFormData({ 
                            ...formData, 
                            has_permanent_device: e.target.checked,
                            permanent_device_id: e.target.checked ? formData.permanent_device_id : ''
                          });
                        }}
                        className="h-4 w-4 text-red-600 dark:text-red-400 focus:ring-red-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                      <label htmlFor="edit_has_permanent_device" className="ml-2 block text-sm font-medium text-red-900 dark:text-red-300">
                        ⚠️ REMINDER: User MUST Do Delivery Note for Specific Device
                      </label>
              </div>
                    
                    {formData.has_permanent_device && (
                      <div className="pl-6 space-y-2">
                        <label className="block text-sm font-semibold text-red-900 dark:text-red-300">
                          Select Device (User MUST do delivery note for this device):
                        </label>
                        <SearchableDeviceSelect
                          devices={devices}
                          value={formData.permanent_device_id}
                          onChange={(deviceId) => setFormData({ ...formData, permanent_device_id: deviceId })}
                          placeholder="-- Select Device --"
                          required={formData.has_permanent_device}
                        />
                        <p className="text-xs text-red-700 dark:text-red-300 font-bold">
                          📝 REMINDER: This user MUST do delivery note for the selected device!
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">
                    ℹ️ Check this to flag/remind admin that user MUST do delivery note for specific device
                  </p>
                </div>
              </div>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditUser}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-md"
                >
                  Save Changes
                </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UsersPage;

