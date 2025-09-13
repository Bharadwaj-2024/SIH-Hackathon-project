import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  MapPinIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const Complaints = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/complaints', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setComplaints(Array.isArray(data) ? data : (data.complaints || []));
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  // Normalize various backend status strings to UI-friendly canonical values
  const normalizeStatus = (status = '') => {
    const s = String(status).trim().toLowerCase();
    if (!s) return 'pending';
    if (s === 'submitted' || s === 'open') return 'pending';
    if (s === 'in progress') return 'in-progress';
    return s.replace(/\s+/g, '-');
  };

  const displayStatus = (status = '') => {
    const original = String(status);
    const low = original.toLowerCase();
    if (low === 'submitted') return 'Submitted';
    if (low === 'in progress') return 'In Progress';
    const n = normalizeStatus(original);
    return n
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const getStatusIcon = (status) => {
    switch (normalizeStatus(status)) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'in-progress':
        return <ExclamationTriangleIcon className="h-5 w-5 text-blue-500" />;
      case 'resolved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (normalizeStatus(status)) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredComplaints = complaints.filter((complaint) => {
    const title = complaint.title || '';
    const description = complaint.description || '';
    const category = complaint.category || '';
    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || normalizeStatus(complaint.status) === statusFilter;
    const matchesDepartment =
      departmentFilter === 'all' || category.toLowerCase() === departmentFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('complaints.allComplaints')}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Browse and track civic issues in your community
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              to="/submit-complaint"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              {t('complaints.submitComplaint')}
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-gray-700"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-gray-700"
              >
                <option value="all">All Departments</option>
                <option value="sanitation">Sanitation</option>
                <option value="roads">Roads</option>
                <option value="water">Water</option>
                <option value="electricity">Electricity</option>
                <option value="parks">Parks</option>
                <option value="transport">Transport</option>
                <option value="health">Health</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Complaints List */}
        {filteredComplaints.length === 0 ? (
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No complaints found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredComplaints.map((complaint) => (
                <li key={complaint._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {/* Thumbnail */}
                      <div className="hidden sm:block mr-3">
                        {complaint?.images?.length ? (
                          <img
                            src={`/api/uploads/${complaint.images[0]}`}
                            alt={complaint.title}
                            className="h-14 w-14 rounded-md object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <img
                            src="https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?q=80&w=200&auto=format&fit=crop"
                            alt="Complaint"
                            className="h-14 w-14 rounded-md object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusIcon(complaint.status)}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {complaint.title}
                          </p>
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(complaint.status)}`}>
                            {displayStatus(complaint.status)}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {formatDate(complaint.createdAt)}
                          <span className="mx-2">•</span>
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {complaint?.location?.address || 'Unknown location'}
                          <span className="mx-2">•</span>
                          <span className="capitalize">{complaint.category || 'Other'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <Link
                        to={`/complaints/${complaint._id}`}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Complaints;