'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import { Plus, AlertCircle, Laptop, CheckCircle, Clock, XCircle, MessageSquare, Filter } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';

type Request = {
  id: string;
  request_type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  device_type: string | null;
  created_at: string;
  updated_at: string;
};

const MyRequestsPage = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myRequests, setMyRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData] = useState({
    request_type: 'device_request' as 'device_request' | 'it_support',
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    device_type: '',
  });

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      fetchMyRequests(user.id);
    }
  }, []);

  useEffect(() => {
    let filtered = [...myRequests];

    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.request_type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    setFilteredRequests(filtered);
  }, [myRequests, filterType, filterStatus]);

  const fetchMyRequests = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      setMyRequests(data);
      setFilteredRequests(data);
    }
    setLoading(false);
  };

  const handleSubmitRequest = async () => {
    if (!formData.title || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    const requestData = {
      user_id: currentUser.id,
      request_type: formData.request_type,
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      status: 'pending',
      device_type: formData.request_type === 'device_request' ? formData.device_type : null,
    };

    const { error } = await supabase.from('requests').insert([requestData]);

    if (!error) {
      setShowRequestModal(false);
      fetchMyRequests(currentUser.id);
      resetForm();
      alert('Request submitted successfully! IT team will review it soon.');
    } else {
      alert('Error submitting request. Please try again.');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
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

  const stats = {
    total: myRequests.length,
    pending: myRequests.filter(r => r.status === 'pending' || r.status === 'in_progress').length,
    completed: myRequests.filter(r => r.status === 'completed' || r.status === 'approved').length,
    deviceRequests: myRequests.filter(r => r.request_type === 'device_request').length,
    itSupport: myRequests.filter(r => r.request_type === 'it_support').length,
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="ml-64 flex-1 min-h-screen p-8">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 dark:border-green-400"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">Loading your requests...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen p-8">
        <PageHeader
          title="My Requests"
          description="Submit new requests and track the status of your existing requests"
          action={
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>New Request</span>
            </button>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-10 h-10" />
              <span className="text-4xl font-bold">{stats.total}</span>
            </div>
            <p className="text-green-100 text-sm font-medium">Total Requests</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-10 h-10" />
              <span className="text-4xl font-bold">{stats.pending}</span>
            </div>
            <p className="text-green-100 text-sm font-medium">Pending</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-10 h-10" />
              <span className="text-4xl font-bold">{stats.completed}</span>
            </div>
            <p className="text-green-100 text-sm font-medium">Completed</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Laptop className="w-10 h-10" />
              <span className="text-4xl font-bold">{stats.deviceRequests}</span>
            </div>
            <p className="text-green-100 text-sm font-medium">Device Requests</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-10 h-10" />
              <span className="text-4xl font-bold">{stats.itSupport}</span>
            </div>
            <p className="text-green-100 text-sm font-medium">IT Support</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700 text-sm"
              >
                <option value="all" className="text-gray-900">All Types</option>
                <option value="device_request" className="text-gray-900">Device Requests</option>
                <option value="it_support" className="text-gray-900">IT Support</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700 text-sm"
              >
                <option value="all" className="text-gray-900">All Status</option>
                <option value="pending" className="text-gray-900">Pending</option>
                <option value="in_progress" className="text-gray-900">In Progress</option>
                <option value="approved" className="text-gray-900">Approved</option>
                <option value="completed" className="text-gray-900">Completed</option>
                <option value="rejected" className="text-gray-900">Rejected</option>
                <option value="closed" className="text-gray-900">Closed</option>
              </select>
            </div>
            <div className="flex-1"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredRequests.length} of {myRequests.length} requests
            </span>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <MessageSquare className="w-6 h-6 mr-2 text-green-600 dark:text-green-400" />
            All Requests ({filteredRequests.length})
          </h2>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Requests Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {myRequests.length === 0
                  ? "You haven't submitted any requests yet."
                  : 'No requests match your filters.'}
              </p>
              <button
                onClick={() => setShowRequestModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Your First Request</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-5 border-l-4 rounded-lg bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors shadow-sm hover:shadow-md"
                  style={{
                    borderColor:
                      request.status === 'completed' || request.status === 'approved'
                        ? '#10b981'
                        : request.status === 'pending'
                        ? '#f59e0b'
                        : request.status === 'rejected'
                        ? '#ef4444'
                        : '#3b82f6',
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {request.request_type === 'device_request' ? (
                          <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                            <Laptop className="w-5 h-5 text-purple-600" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-blue-600" />
                          </div>
                        )}
                        <div>
                           <h3 className="font-bold text-gray-900 dark:text-white text-lg">{request.title}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Submitted on {new Date(request.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 ml-13">{request.description}</p>
                      <div className="flex flex-wrap items-center gap-2 ml-13">
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span>{request.status.replace('_', ' ').toUpperCase()}</span>
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(request.priority)}`}>
                          {request.priority.toUpperCase()} PRIORITY
                        </span>
                        <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold">
                          {request.request_type === 'device_request' ? '💻 Device Request' : '🔧 IT Support'}
                        </span>
                        {request.device_type && (
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                            {request.device_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                    Request Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.request_type}
                    onChange={(e) => setFormData({ ...formData, request_type: e.target.value as 'device_request' | 'it_support' })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700"
                  >
                    <option value="device_request" className="text-gray-900">💻 Device Request - I need a new device</option>
                    <option value="it_support" className="text-gray-900">🔧 IT Support - I have a problem</option>
                  </select>
                </div>

                {formData.request_type === 'device_request' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      What type of device do you need?
                    </label>
                    <select
                      value={formData.device_type}
                      onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700"
                    >
                      <option value="" className="text-gray-500">Select Device Type</option>
                      <option value="Laptop" className="text-gray-900">Laptop</option>
                      <option value="Monitor" className="text-gray-900">Monitor</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={formData.request_type === 'device_request' ? 'e.g., Need laptop for new project' : 'e.g., My computer won\'t start'}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    placeholder={formData.request_type === 'device_request' ? 'Describe what device you need and why...' : 'Describe the problem you\'re experiencing...'}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700"
                  >
                    <option value="low" className="text-gray-900">Low - Can wait</option>
                    <option value="medium" className="text-gray-900">Medium - Normal priority</option>
                    <option value="high" className="text-gray-900">High - Important</option>
                    <option value="urgent" className="text-gray-900">Urgent - Need immediately</option>
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
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-md"
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

export default MyRequestsPage;

