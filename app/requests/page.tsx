'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import { Plus, AlertCircle, Laptop, Search, Filter, CheckCircle, XCircle, Clock, PlayCircle } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [formData, setFormData] = useState({
    request_type: 'device_request' as RequestType,
    title: '',
    description: '',
    priority: 'medium' as RequestPriority,
    device_type: '',
  });

  useEffect(() => {
    getCurrentUser();
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter, typeFilter]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('requests')
      .select(`
        *,
        user:users!requests_user_id_fkey(full_name, email, department),
        assignee:users!requests_assigned_to_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setRequests(data as Request[]);
    }
  };

  const filterRequests = () => {
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
  };

  const handleSubmitRequest = async () => {
    if (!formData.title || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    const requestData = {
      user_id: currentUserId,
      request_type: formData.request_type,
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      status: 'pending' as RequestStatus,
      device_type: formData.request_type === 'device_request' ? formData.device_type : null,
    };

    const { error } = await supabase.from('requests').insert([requestData]);

    if (!error) {
      setShowRequestModal(false);
      fetchRequests();
      resetForm();
      alert('Request submitted successfully!');
    } else {
      alert('Error submitting request. Please try again.');
    }
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
      fetchRequests();
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
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: RequestPriority) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-700';
      case 'medium':
        return 'bg-blue-100 text-blue-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'urgent':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <PlayCircle className="w-4 h-4" />;
      case 'approved':
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
      case 'closed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 bg-gray-50 min-h-screen p-8">
        <PageHeader
          title="Requests"
          description="Submit device requests and IT support tickets"
          action={
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>New Request</span>
            </button>
          }
        />

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
            >
              <option value="all">All Types</option>
              <option value="device_request">Device Request</option>
              <option value="it_support">IT Support</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests found</h3>
              <p className="text-gray-600">Start by creating a new request</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {request.request_type === 'device_request' ? (
                        <Laptop className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-blue-600" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-3">{request.description}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status.replace('_', ' ').toUpperCase()}</span>
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(
                          request.priority
                        )}`}
                      >
                        {request.priority.toUpperCase()}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                        {request.request_type === 'device_request' ? '📱 Device Request' : '🔧 IT Support'}
                      </span>
                      {request.device_type && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                          {request.device_type}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {request.user?.full_name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-500">{request.user?.department}</p>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {request.assignee && (
                        <span>Assigned to: <strong>{request.assignee.full_name}</strong></span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'in_progress')}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                          >
                            Start
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'approved')}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'rejected')}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {request.status === 'in_progress' && (
                        <button
                          onClick={() => handleUpdateStatus(request.id, 'completed')}
                          className="px-3 py-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 text-sm"
                        >
                          Complete
                        </button>
                      )}
                      {(request.status === 'approved' || request.status === 'completed') && (
                        <button
                          onClick={() => handleUpdateStatus(request.id, 'closed')}
                          className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
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
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit New Request</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Request Type
                  </label>
                  <select
                    value={formData.request_type}
                    onChange={(e) => setFormData({ ...formData, request_type: e.target.value as RequestType })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  >
                    <option value="device_request" className="text-gray-900">📱 Device Request</option>
                    <option value="it_support" className="text-gray-900">🔧 IT Support</option>
                  </select>
                </div>

                {formData.request_type === 'device_request' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Device Type
                    </label>
                    <select
                      value={formData.device_type}
                      onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    >
                      <option value="" className="text-gray-500">Select Device Type</option>
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
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief description of your request"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    placeholder="Provide detailed information about your request"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as RequestPriority })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  >
                    <option value="low" className="text-gray-900">Low</option>
                    <option value="medium" className="text-gray-900">Medium</option>
                    <option value="high" className="text-gray-900">High</option>
                    <option value="urgent" className="text-gray-900">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md"
                >
                  Submit Request
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

