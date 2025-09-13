import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  PhotoIcon,
  MapPinIcon,
  XMarkIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';

const SubmitComplaint = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (currentLocation) {
      setValue('coordinates', `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`);
    }
  }, [currentLocation, setValue]);

  // Backend expects category with Capitalized values
  const categories = [
    'Sanitation',
    'Roads',
    'Water',
    'Electricity',
    'Parks',
    'Transport',
    'Health',
    'Other',
  ];

  // Match backend: 'Low', 'Medium', 'High', 'Critical'
  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.slice(0, 1).filter(file => {
      const isImage = file.type.startsWith('image/');
      const isUnder5MB = file.size <= 5 * 1024 * 1024; // 5MB limit
      return isImage && isUnder5MB;
    });

    if (validFiles.length !== files.length) {
      alert('Some files were rejected. Only images under 5MB are allowed.');
    }

    setSelectedFiles(validFiles.slice(0, 1)); // Only 1 image allowed
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setGettingLocation(false);
        alert('Unable to get your location. Please enter it manually.');
      }
    );
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      // Add form fields
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      if (data.priority) formData.append('priority', data.priority);

      // Location: accept either "lat, lng" or address typed; we need separate fields
      // Try to parse coordinates from the input if present
      let lat = currentLocation?.lat;
      let lng = currentLocation?.lng;
      if (!lat || !lng) {
        const coordMatch = (data.coordinates || '').match(/\s*([-+]?\d+\.?\d*)\s*,\s*([-+]?\d+\.?\d*)\s*/);
        if (coordMatch) {
          lat = parseFloat(coordMatch[1]);
          lng = parseFloat(coordMatch[2]);
        }
      }
      if (!lat || !lng) {
        throw new Error('Please provide valid coordinates via GPS or typing lat, lng.');
      }
      if (!data.address || data.address.trim().length < 5) {
        throw new Error('Please provide a valid address.');
      }
      formData.append('latitude', String(lat));
      formData.append('longitude', String(lng));
      formData.append('address', data.address);
      formData.append('isAnonymous', data.anonymous ? 'true' : 'false');

      // Add images
      if (selectedFiles[0]) {
        formData.append('image', selectedFiles[0]);
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert('Complaint submitted successfully!');
        navigate('/dashboard');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit complaint');
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert('Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {t('complaints.submitComplaint')}
            </h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('complaints.title')} *
                </label>
                <input
                  {...register('title', {
                    required: 'Title is required',
                    minLength: {
                      value: 5,
                      message: 'Title must be at least 5 characters',
                    },
                  })}
                  type="text"
                  className="input mt-1"
                  placeholder="Brief, descriptive title for your complaint"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('complaints.description')} *
                </label>
                <textarea
                  {...register('description', {
                    required: 'Description is required',
                    minLength: {
                      value: 20,
                      message: 'Description must be at least 20 characters',
                    },
                  })}
                  rows={4}
                  className="input mt-1"
                  placeholder="Provide detailed information about the issue..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Category (aka Department) and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('complaints.department')} *
                  </label>
                  <select
                    {...register('category', { required: 'Category is required' })}
                    className="input mt-1"
                  >
                    <option value="">{t('complaints.selectDepartment')}</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('complaints.priority')} *
                  </label>
                  <select
                    {...register('priority', { required: 'Priority is required' })}
                    className="input mt-1"
                  >
                    <option value="">{t('complaints.selectPriority')}</option>
                    {priorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {t(`complaints.priority.${priority}`)}
                      </option>
                    ))}
                  </select>
                  {errors.priority && (
                    <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
                  )}
                </div>
              </div>

              {/* Location: Address and Coordinates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('complaints.location')} *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                  <input
                    {...register('address', { required: 'Address is required' })}
                    type="text"
                    className="input"
                    placeholder="Street, Area, City"
                  />
                  <div className="md:col-span-2 flex rounded-md shadow-sm">
                    <input
                      {...register('coordinates')}
                      type="text"
                      className="input rounded-r-none"
                      placeholder="Latitude, Longitude"
                    />
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                      className="relative -ml-px inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-r-md text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                    >
                      {gettingLocation ? (
                        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                      ) : (
                        <MapPinIcon className="h-4 w-4" />
                      )}
                      <span className="ml-2">{gettingLocation ? 'Getting...' : 'Use GPS'}</span>
                    </button>
                  </div>
                </div>
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('complaints.images')} <span className="text-gray-500">(Optional, 1 image)</span>
                </label>
                <div className="mt-1">
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-gray-400 dark:hover:border-gray-500">
                    <div className="space-y-1 text-center">
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600 dark:text-gray-400">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                        >
                          <span>{t('complaints.uploadFiles')}</span>
                          <input
                            ref={fileInputRef}
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            multiple={false}
                            accept="image/*"
                            onChange={handleFileSelect}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, GIF up to 5MB each
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preview selected images */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedFiles.slice(0,1).map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="h-24 w-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Anonymous submission */}
              <div className="flex items-center">
                <input
                  {...register('anonymous')}
                  id="anonymous"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  {t('complaints.submitAnonymously')}
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="inline-flex items-center">
                        <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        {t('complaints.submitting')}
                      </div>
                    </>
                  ) : (
                    t('complaints.submitComplaint')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitComplaint;