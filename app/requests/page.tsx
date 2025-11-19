'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import { Plus, AlertCircle, Laptop, Search, Filter, CheckCircle, XCircle, Clock, PlayCircle, Trash2 } from 'lucide-react';
import { getCurrentUser as getAuthUser } from '@/lib/auth';

type RequestType = 'device_request' | 'it_support';
type RequestStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed' | 'closed';
type RequestPriority = 'low' | 'medium' | 'high' | 'urgent';

type Request = {
  id: string;
  user_id: string;
  request_type: RequestType;
  title: string;
  description: string;
  priority: RequestPriority;
  status: RequestStatus;
  device_type: string | null;
  assigned_to: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  user?: {
    full_name: string;
    email: string;
    department: string;
  };
  assignee?: {
    full_name: string;
  };
};

const RequestsPage = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    closedCount: number;
  }>({
    show: false,
    closedCount: 0,
  });
  const [formData, setFormData] = useState({
    request_type: 'device_request' as RequestType,
    title: '',
    description: '',
    priority: 'medium' as RequestPriority,
    device_type: '',
  });

  const filterRequests = useCallback(() => {
    let filtered = [...requests];

    if (searchTerm) {
      filtered = filtered.filter(
        (request) =>
          request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.user?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((request) => request.request_type === typeFilter);
    }

    setFilteredRequests(filtered);
  }, [requests, searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    getUserId();
    fetchRequests();

    // Set up real-time subscription for requests
    const requestsChannel = supabase
      .channel('requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'requests',
        },
        (payload) => {
          console.log('🔄 Realtime: Request change detected', payload.eventType, payload);
          
          // OPTIMIZED: Update specific record instead of refetching all
          if (payload.eventType === 'INSERT' && payload.new) {
            // Add new request to top of list
            fetchRequests(); // Need to fetch to get user data
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            // Update existing request in list
            setRequests(prevRequests => 
              prevRequests.map(req => 
                req.id === payload.new.id 
                  ? { ...req, ...payload.new as any } 
                  : req
              )
            );
          } else if (payload.eventType === 'DELETE' && payload.old) {
            // Remove deleted request from list
            setRequests(prevRequests => 
              prevRequests.filter(req => req.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(requestsChannel);
    };
  }, []);

  useEffect(() => {
    filterRequests();
  }, [filterRequests]);

  const getUserId = () => {
    const user = getAuthUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // OPTIMIZED: Select only needed fields + limit to recent 100 requests
      const { data, error } = await supabase
        .from('requests')
        .select(`
          id,
          user_id,
          request_type,
          title,
          description,
          priority,
          status,
          device_type,
          assigned_to,
          resolution_notes,
          created_at,
          updated_at,
          resolved_at,
          user:users!requests_user_id_fkey(full_name, email, department),
          assignee:users!requests_assigned_to_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching requests:', error);
      } else if (data) {
        setRequests(data as any);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!formData.title || !formData.description) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields',
      });
      return;
    }

    // Validate device type for device requests
    if (formData.request_type === 'device_request' && !formData.device_type) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a device type for your request',
      });
      return;
    }

    if (!currentUserId) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Authentication Error',
        message: 'User not found. Please login again.',
      });
      return;
    }

    // Build request data with proper null handling
    const requestData: any = {
      user_id: currentUserId,
      request_type: formData.request_type,
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      status: 'pending' as RequestStatus,
    };

    // Only add device_type if it's a device request and has a value
    if (formData.request_type === 'device_request' && formData.device_type) {
      requestData.device_type = formData.device_type;
    } else {
      requestData.device_type = null;
    }

    const { data, error } = await supabase.from('requests').insert([requestData]).select();

    if (error) {
      console.error('Error submitting request:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error Submitting Request',
        message: `${error.message}\n\nPlease ensure you have permission to create requests or contact your administrator.`,
      });
      return;
    }

    // OPTIMIZED: Don't refetch all, just add the new request to the list
    if (data && data[0]) {
      const newRequest = {
        ...data[0],
        user: null, // Will be populated by real-time or next fetch
        assignee: null,
      };
      setRequests([newRequest as Request, ...requests]);
    }
    
    setShowRequestModal(false);
    resetForm();
    setNotification({
      show: true,
      type: 'success',
      title: 'Request Submitted Successfully',
      message: 'Your request has been submitted and will be reviewed by the IT team.',
    });
  };

  const handleUpdateStatus = async (requestId: string, newStatus: RequestStatus) => {
    const updateData: any = {
      status: newStatus,
    };

    if (newStatus === 'completed' || newStatus === 'closed' || newStatus === 'rejected') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('requests')
      .update(updateData)
      .eq('id', requestId);

    if (!error) {
      // OPTIMIZED: Update state directly instead of refetching all
      setRequests(requests.map(req => 
        req.id === requestId 
          ? { ...req, ...updateData } 
          : req
      ));
    }
  };

  const resetForm = () => {
    setFormData({
      request_type: 'device_request',
      title: '',
      description: '',
      priority: 'medium',
      device_type: '',
    });
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'approved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      case 'completed':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400';
      case 'closed':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: RequestPriority) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      case 'medium':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
      case 'urgent':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-2.5 h-2.5" />;
      case 'in_progress':
        return <PlayCircle className="w-2.5 h-2.5" />;
      case 'approved':
      case 'completed':
        return <CheckCircle className="w-2.5 h-2.5" />;
      case 'rejected':
      case 'closed':
        return <XCircle className="w-2.5 h-2.5" />;
      default:
        return <AlertCircle className="w-2.5 h-2.5" />;
    }
  };

  const handleDeleteClosedRequests = () => {
    const closedCount = requests.filter(r => r.status === 'closed' || r.status === 'completed').length;
    
    if (closedCount === 0) {
      setNotification({
        show: true,
        type: 'info',
        title: 'No Requests to Delete',
        message: 'No closed or completed requests to delete.',
      });
      return;
    }

    setDeleteConfirmation({
      show: true,
      closedCount,
    });
  };

  const handleConfirmDeleteClosedRequests = async () => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('requests')
        .delete()
        .in('status', ['closed', 'completed']);
      
      if (error) throw error;

      setNotification({
        show: true,
        type: 'success',
        title: 'Requests Deleted Successfully',
        message: `Successfully deleted ${deleteConfirmation.closedCount} closed/completed requests!`,
      });
      await fetchRequests();
    } catch (error: any) {
      console.error('Error deleting requests:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error Deleting Requests',
        message: error.message,
      });
    } finally {
      setLoading(false);
      setDeleteConfirmation({
        show: false,
        closedCount: 0,
      });
    }
  };

  const handleCancelDeleteClosedRequests = () => {
    setDeleteConfirmation({
      show: false,
      closedCount: 0,
    });
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-20 flex-1 min-h-screen p-8 transition-all duration-300">
        <PageHeader
          title="Requests"
          description="Submit device requests and IT support tickets"
          action={
            <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>New Request</span>
            </button>
              <button
                onClick={handleDeleteClosedRequests}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg"
              >
                <Trash2 className="w-5 h-5" />
                <span>Delete Closed</span>
              </button>
            </div>
          }
        />

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search requests..."
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
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="device_request">Device Request</option>
              <option value="it_support">IT Support</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading requests...</h3>
              <p className="text-gray-600 dark:text-gray-400">Please wait</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No requests found</h3>
              <p className="text-gray-600 dark:text-gray-400">Start by creating a new request</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-1 mb-1">
                      {request.request_type === 'device_request' ? (
                        <Laptop className="w-3 h-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      )}
                      <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white">{request.title}</h3>
                    </div>
                    <p className="text-[9px] text-gray-600 dark:text-gray-400 mb-1.5 line-clamp-1">{request.description}</p>
                    <div className="flex flex-wrap items-center gap-1">
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-semibold ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {getStatusIcon(request.status)}
                        <span>{request.status.replace('_', ' ').toUpperCase()}</span>
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[8px] font-semibold ${getPriorityColor(
                          request.priority
                        )}`}
                      >
                        {request.priority.toUpperCase()}
                      </span>
                      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-[8px] font-semibold">
                        {request.request_type === 'device_request' ? '💻' : '🔧'}
                      </span>
                      {request.device_type && (
                        <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-[8px] font-semibold">
                          {request.device_type}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-[9px] text-gray-500 dark:text-gray-400">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] font-medium text-gray-900 dark:text-white mt-0.5">
                      {request.user?.full_name || 'Unknown'}
                    </p>
                    <p className="text-[8px] text-gray-500 dark:text-gray-400">{request.user?.department}</p>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="border-t pt-1.5 mt-1.5">
                  <div className="flex items-center justify-between">
                    <div className="text-[9px] text-gray-600 dark:text-gray-400">
                      {request.assignee && (
                        <span>Assigned: <strong>{request.assignee.full_name}</strong></span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'in_progress')}
                            className="px-1.5 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-[9px] font-medium"
                          >
                            Start
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'approved')}
                            className="px-1.5 py-0.5 bg-green-500 text-white rounded hover:bg-green-600 text-[9px] font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'rejected')}
                            className="px-1.5 py-0.5 bg-red-500 text-white rounded hover:bg-red-600 text-[9px] font-medium"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {request.status === 'in_progress' && (
                        <button
                          onClick={() => handleUpdateStatus(request.id, 'completed')}
                          className="px-1.5 py-0.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 text-[9px] font-medium"
                        >
                          Complete
                        </button>
                      )}
                      {(request.status === 'approved' || request.status === 'completed') && (
                        <button
                          onClick={() => handleUpdateStatus(request.id, 'closed')}
                          className="px-1.5 py-0.5 bg-gray-500 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-500 text-[9px] font-medium"
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* New Request Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Submit New Request</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Request Type
                  </label>
                  <select
                    value={formData.request_type}
                    onChange={(e) => setFormData({ ...formData, request_type: e.target.value as RequestType })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="device_request" className="text-gray-900 dark:text-white">💻 Device Request</option>
                    <option value="it_support" className="text-gray-900 dark:text-white">🔧 IT Support</option>
                  </select>
                </div>

                {formData.request_type === 'device_request' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Device Type
                    </label>
                    <select
                      value={formData.device_type}
                      onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="" className="text-gray-500">Select Device Type</option>
                      <option value="Laptop" className="text-gray-900 dark:text-white">Laptop</option>
                      <option value="Monitor" className="text-gray-900 dark:text-white">Monitor</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief description of your request"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    placeholder="Provide detailed information about your request"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as RequestPriority })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="low" className="text-gray-900 dark:text-white">Low</option>
                    <option value="medium" className="text-gray-900 dark:text-white">Medium</option>
                    <option value="high" className="text-gray-900 dark:text-white">High</option>
                    <option value="urgent" className="text-gray-900 dark:text-white">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-md"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.show && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 px-4 py-6"
            role="dialog"
            aria-modal="true"
            aria-label="Delete requests confirmation dialog"
            tabIndex={-1}
            onClick={handleCancelDeleteClosedRequests}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation();
                handleCancelDeleteClosedRequests();
              }
            }}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-900"
              role="document"
              tabIndex={0}
              aria-label="Delete requests confirmation content"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-4 rounded-xl bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-200">
                <AlertCircle className="h-10 w-10 flex-shrink-0" />
                <div>
                  <p className="text-lg font-semibold">Delete Requests</p>
                  <p className="text-sm text-red-600 dark:text-red-200/80">
                    Delete {deleteConfirmation.closedCount} closed/completed requests?
                  </p>
                </div>
              </div>

              <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
                <p className="mb-2">This will permanently delete all requests with status:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Closed</li>
                  <li>Completed</li>
                </ul>
                <p className="mt-4 font-semibold text-gray-900 dark:text-white">This action CANNOT be undone.</p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCancelDeleteClosedRequests}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 sm:w-32"
                  tabIndex={0}
                  aria-label="Cancel deletion"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteClosedRequests}
                  className="w-full rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-center font-semibold text-white transition hover:from-red-700 hover:to-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 sm:w-32"
                  tabIndex={0}
                  aria-label="Confirm delete requests"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Modal */}
        {notification.show && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 px-4 py-6"
            role="dialog"
            aria-modal="true"
            aria-label="Notification dialog"
            tabIndex={-1}
            onClick={() => setNotification({ ...notification, show: false })}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation();
                setNotification({ ...notification, show: false });
              }
            }}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-900"
              role="document"
              tabIndex={0}
              aria-label="Notification content"
              onClick={(event) => event.stopPropagation()}
            >
              <div
                className={`flex items-center gap-4 rounded-xl p-4 ${
                  notification.type === 'success'
                    ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                    : notification.type === 'error'
                    ? 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                    : 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
                }`}
              >
                {notification.type === 'success' ? (
                  <CheckCircle className="h-10 w-10 flex-shrink-0" />
                ) : notification.type === 'error' ? (
                  <XCircle className="h-10 w-10 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-10 w-10 flex-shrink-0" />
                )}
                <div>
                  <p className="text-lg font-semibold">{notification.title}</p>
                  <p
                    className={`text-sm whitespace-pre-line ${
                      notification.type === 'success'
                        ? 'text-green-600 dark:text-green-200/80'
                        : notification.type === 'error'
                        ? 'text-red-600 dark:text-red-200/80'
                        : 'text-blue-600 dark:text-blue-200/80'
                    }`}
                  >
                    {notification.message}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => setNotification({ ...notification, show: false })}
                  className={`rounded-lg px-6 py-3 text-center font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    notification.type === 'success'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800'
                      : notification.type === 'error'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                  }`}
                  tabIndex={0}
                  aria-label="Close notification"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RequestsPage;

