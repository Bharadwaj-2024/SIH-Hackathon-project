import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Map = () => {
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]); // Bangalore coordinates

  useEffect(() => {
    fetchComplaints();
    getUserLocation();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, statusFilter, departmentFilter, searchTerm]);

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
        // Filter complaints that have valid coordinates
        const complaintsWithCoords = data.filter(complaint => {
          const coords = parseCoordinates(complaint.location);
          return coords !== null;
        });
        setComplaints(complaintsWithCoords);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Error getting user location:', error);
        }
      );
    }
  };

  const parseCoordinates = (location) => {
    if (!location) return null;
    
    // Try to parse coordinates in format "lat, lng"
    const coordPattern = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
    const match = location.match(coordPattern);
    
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      
      // Basic validation for reasonable coordinates
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return [lat, lng];
      }
    }
    
    return null;
  };

  const filterComplaints = () => {
    let filtered = complaints;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(complaint => 
        complaint.status.toLowerCase() === statusFilter
      );
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(complaint => 
        complaint.department === departmentFilter
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(complaint =>
        complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredComplaints(filtered);
  };

  const getMarkerColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#f59e0b'; // yellow
      case 'in-progress':
        return '#3b82f6'; // blue
      case 'resolved':
        return '#10b981'; // green
      case 'rejected':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const createCustomIcon = (status) => {
    const color = getMarkerColor(status);
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="
          background-color: ${color};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('nav.map')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View complaints on the map and explore issues in different areas
          </p>
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
                placeholder="Search complaints..."
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

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Legend:</span>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
              <span>Resolved</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
              <span>Rejected</span>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden" style={{ height: '600px' }}>
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {filteredComplaints.map((complaint) => {
              const coords = parseCoordinates(complaint.location);
              if (!coords) return null;

              return (
                <Marker
                  key={complaint._id}
                  position={coords}
                  icon={createCustomIcon(complaint.status)}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {complaint.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {complaint.description.substring(0, 100)}...
                      </p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {formatDate(complaint.createdAt)}
                        </div>
                        <div className="flex items-center">
                          <MapPinIcon className="h-3 w-3 mr-1" />
                          {complaint.department}
                        </div>
                        <div className="mt-2">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            complaint.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {complaint.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Summary */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredComplaints.length} of {complaints.length} complaints on the map
        </div>
      </div>
    </div>
  );
};

export default Map;