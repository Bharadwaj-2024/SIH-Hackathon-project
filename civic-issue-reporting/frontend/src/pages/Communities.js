import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  PlusIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const Communities = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'my'
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 9 });

  useEffect(() => {
    fetchCommunities(page);
    fetchUserCommunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch communities when page or search changes (only for 'all' tab data)
  useEffect(() => {
    if (activeTab === 'all') {
      fetchCommunities(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, searchTerm]);

  // When switching to 'all' tab, ensure data is fresh
  useEffect(() => {
    if (activeTab === 'all') {
      setPage(1);
      fetchCommunities(1);
    }
    // no refetch for 'my' tab
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const getPrivacyLabel = (community) => {
    if (typeof community?.privacy === 'string' && community.privacy.trim()) {
      return community.privacy;
    }
    return community?.settings?.isPrivate ? 'private' : 'public';
  };

  // Fallback local communities if API is empty/unavailable
  const fallbackCommunities = [
    {
      _id: 'local-1',
      name: 'Clean Water Now',
      description: 'Residents campaigning for clean and safe drinking water in the East Ward. Weekly rallies and water testing drives.',
      privacy: 'public',
      memberCount: 842,
      postCount: 120,
      coverImage: 'https://images.unsplash.com/photo-1508711040923-0b3be9705a17?q=80&w=1280&auto=format&fit=crop',
    },
    {
      _id: 'local-2',
      name: 'Fix Our Roads',
      description: 'Community advocating for pothole repairs and safer streets; mapping bad stretches and coordinating repair requests.',
      privacy: 'public',
      memberCount: 1267,
      postCount: 210,
      coverImage: 'https://images.unsplash.com/photo-1524666041070-9d87656c25bb?q=80&w=1280&auto=format&fit=crop',
    },
    {
      _id: 'local-3',
      name: 'Power Outage Watch',
      description: 'Citizens reporting frequent electricity cuts and voltage fluctuations; pushing for infrastructure upgrades.',
      privacy: 'public',
      memberCount: 565,
      postCount: 74,
      coverImage: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?q=80&w=1280&auto=format&fit=crop',
    },
    {
      _id: 'local-4',
      name: 'Waste-Free Neighborhood',
      description: 'Grassroots group protesting irregular garbage collection and promoting community clean-up drives.',
      privacy: 'public',
      memberCount: 954,
      postCount: 188,
      coverImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1280&auto=format&fit=crop',
    },
    {
      _id: 'local-5',
      name: 'Safer Crosswalks',
      description: 'Parents and students advocating for zebra crossings, speed bumps, and better signage near schools.',
      privacy: 'public',
      memberCount: 403,
      postCount: 65,
      coverImage: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1280&auto=format&fit=crop',
    },
    {
      _id: 'local-6',
      name: 'Park Restoration League',
      description: 'Volunteers pushing for park maintenance, tree planting, and safer play areas for kids.',
      privacy: 'public',
      memberCount: 678,
      postCount: 98,
      coverImage: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1280&auto=format&fit=crop',
    },
  ];

  const fetchCommunities = async (currentPage = 1) => {
    try {
      const token = localStorage.getItem('token');
      const qs = new URLSearchParams({
        page: String(currentPage),
        limit: String(limit),
        search: searchTerm || ''
      });
      const response = await fetch(`/api/communities?${qs.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const items = Array.isArray(data) ? data : (data.communities || []);
        setCommunities(items.length > 0 ? items : fallbackCommunities);
        if (data && data.pagination) {
          setPagination({
            page: Number(data.pagination.page) || currentPage,
            pages: Number(data.pagination.pages) || 1,
            total: Number(data.pagination.total) || items.length,
            limit: Number(data.pagination.limit) || limit
          });
        } else {
          setPagination({ page: 1, pages: 1, total: items.length, limit });
        }
      } else {
        setCommunities(fallbackCommunities);
        setPagination({ page: 1, pages: 1, total: fallbackCommunities.length, limit });
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
      setCommunities(fallbackCommunities);
      setPagination({ page: 1, pages: 1, total: fallbackCommunities.length, limit });
    }
  };

  const fetchUserCommunities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/communities/user/my-communities', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const items = Array.isArray(data) ? data : (data.communities || []);
        setUserCommunities(items);
      }
    } catch (error) {
      console.error('Error fetching user communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinCommunity = async (communityId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        fetchCommunities();
        fetchUserCommunities();
      }
    } catch (error) {
      console.error('Error joining community:', error);
    }
  };

  const leaveCommunity = async (communityId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/communities/${communityId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        fetchCommunities();
        fetchUserCommunities();
      }
    } catch (error) {
      console.error('Error leaving community:', error);
    }
  };

  const isUserMember = (communityId) => {
    return userCommunities.some(community => community._id === communityId);
  };

  const sourceList = activeTab === 'my' ? userCommunities : communities;
  const filteredCommunities = activeTab === 'my'
    ? sourceList.filter((community) => {
        const name = (community?.name || '').toLowerCase();
        const desc = (community?.description || '').toLowerCase();
        const q = searchTerm.toLowerCase();
        return name.includes(q) || desc.includes(q);
      })
    : sourceList;

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
              {t('communities.title')}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {t('communities.subtitle')}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              to="/create-community"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              {t('communities.create')}
            </Link>
          </div>
        </div>

        {/* Search and Tabs */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search */}
            <div className="relative max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('communities.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>

            {/* Tabs */}
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'all'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {t('communities.allCommunities')}
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'my'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {t('communities.myCommunities')} ({userCommunities.length})
              </button>
            </div>
          </div>
        </div>

        {/* Communities Grid */}
        {filteredCommunities.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {activeTab === 'my' ? t('communities.noJoinedCommunities') : t('communities.noCommunitiesFound')}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {activeTab === 'my' 
                ? t('communities.joinCommunityPrompt')
                : t('communities.createCommunityPrompt')
              }
            </p>
            <div className="mt-6">
              <Link
                to={activeTab === 'my' ? '#' : '/create-community'}
                onClick={activeTab === 'my' ? () => setActiveTab('all') : undefined}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {activeTab === 'my' ? (
                  <>
                    <UsersIcon className="h-4 w-4 mr-2" />
                    {t('communities.browseCommunities')}
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    {t('communities.create')}
                  </>
                )}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((community) => (
              <div
                key={community._id}
                className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Cover Image (if any) */}
                {community.coverImage && (
                  <div className="h-36 w-full overflow-hidden">
                    <img
                      src={community.coverImage}
                      alt={community.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Community Header */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {community.name}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 capitalize">
                      {getPrivacyLabel(community)}
                    </span>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                    {community.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center">
                      <UsersIcon className="h-4 w-4 mr-1" />
                      <span>{community.memberCount || 0} {t('communities.members')}</span>
                    </div>
                    <div className="flex items-center">
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                      <span>{community.postCount || 0} {t('communities.posts')}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {String(community._id).startsWith('local-') ? (
                      <button
                        disabled
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-200 dark:border-gray-700 text-sm font-medium rounded-md text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
                        title="This is a preview community"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        {t('communities.view')}
                      </button>
                    ) : (
                      <Link
                        to={`/communities/${community._id}`}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        {t('communities.view')}
                      </Link>
                    )}

                    {isUserMember(community._id) ? (
                      <button
                        onClick={() => leaveCommunity(community._id)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:border-red-600 dark:text-red-400 dark:bg-gray-800 dark:hover:bg-red-900"
                      >
                        {t('communities.leave')}
                      </button>
                    ) : (
                      <button
                        onClick={() => joinCommunity(community._id)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        {t('communities.join')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls (All Communities) */}
        {activeTab === 'all' && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {pagination.total > 0 ? (
                (() => {
                  const start = (pagination.page - 1) * pagination.limit + 1;
                  const end = Math.min(pagination.page * pagination.limit, pagination.total);
                  return <span>Showing {start}–{end} of {pagination.total}</span>;
                })()
              ) : (
                <span>Showing 0 of 0</span>
              )}
            </div>
            <div className="inline-flex items-center gap-1">
              <button
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              {/* Page numbers (simple when small) */}
              {pagination.pages <= 7 && Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`px-3 py-1.5 text-sm rounded-md border ${p === pagination.page ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              {pagination.pages > 7 && (
                <span className="px-2 text-sm text-gray-600 dark:text-gray-400">Page {pagination.page} of {pagination.pages}</span>
              )}
              <button
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Communities;