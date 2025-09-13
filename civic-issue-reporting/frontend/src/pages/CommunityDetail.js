import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeftIcon,
  UsersIcon,
  PlusIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

const CommunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    fetchCommunity();
    fetchPosts();
  }, [id]);

  const fetchCommunity = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/communities/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCommunity(data);
        setIsJoined(data.members?.includes(user?._id));
      } else {
        navigate('/communities');
      }
    } catch (error) {
      console.error('Error fetching community:', error);
      navigate('/communities');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/communities/${id}/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleJoinLeave = async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = isJoined ? 'leave' : 'join';
      const response = await fetch(`/api/communities/${id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsJoined(!isJoined);
        fetchCommunity();
      }
    } catch (error) {
      console.error('Error joining/leaving community:', error);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/communities/${id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newPost),
      });

      if (response.ok) {
        setNewPost({ title: '', content: '' });
        fetchPosts();
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="page-container">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Community not found
            </h1>
            <button
              onClick={() => navigate('/communities')}
              className="mt-4 text-primary-600 hover:text-primary-500"
            >
              Back to Communities
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/communities')}
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Communities
        </button>

        {/* Community Header */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {community.name}
                </h1>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <UsersIcon className="h-4 w-4 mr-1" />
                  {community.memberCount || 0} members
                  <span className="mx-2">•</span>
                  <span className="capitalize">{community.privacy}</span>
                  <span className="mx-2">•</span>
                  Created {formatDate(community.createdAt)}
                </div>
              </div>
              <button
                onClick={handleJoinLeave}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  isJoined
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {isJoined ? 'Leave Community' : 'Join Community'}
              </button>
            </div>

            <p className="text-gray-700 dark:text-gray-300">
              {community.description}
            </p>
          </div>
        </div>

        {/* Create Post Form (only for joined members) */}
        {isJoined && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Create New Post
              </h2>
            </div>
            <div className="px-6 py-4">
              <form onSubmit={handleCreatePost}>
                <div className="mb-4">
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Post title..."
                  />
                </div>
                <div className="mb-4">
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={3}
                    className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="What's happening in your community?"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newPost.title.trim() || !newPost.content.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Post
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Posts List */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Community Posts ({posts.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {posts.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No posts yet. {isJoined ? 'Be the first to post!' : 'Join the community to see and create posts.'}
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post._id} className="px-6 py-4">
                  <div className="flex items-center mb-2">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {post.author?.name || 'Anonymous'}
                    </span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {post.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityDetail;