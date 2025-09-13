import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeftIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
} from '@heroicons/react/24/outline';

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaint();
    fetchComments();
  }, [id]);

  const fetchComplaint = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/complaints/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setComplaint(data);
      } else {
        navigate('/complaints');
      }
    } catch (error) {
      console.error('Error fetching complaint:', error);
      navigate('/complaints');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/comments/complaint/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/comments/complaint/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleVote = async (type) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/complaints/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ voteType: type }),
      });

      if (response.ok) {
        fetchComplaint();
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const normalizeStatus = (status = '') => {
    const s = String(status).trim().toLowerCase();
    if (s === 'submitted') return 'pending';
    if (s === 'in progress') return 'in-progress';
    return s.replace(/\s+/g, '-');
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  if (!complaint) {
    return (
      <div className="page-container">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Complaint not found
            </h1>
            <button
              onClick={() => navigate('/complaints')}
              className="mt-4 text-primary-600 hover:text-primary-500"
            >
              Back to Complaints
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
          onClick={() => navigate('/complaints')}
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Complaints
        </button>

        {/* Complaint Header */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {complaint.title}
              </h1>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(complaint.status)}`}>
                {String(complaint.status || '')}
              </span>
            </div>

            <div className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 space-x-4 mb-4">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                {formatDate(complaint.createdAt)}
              </div>
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1" />
                {complaint?.location?.address || 'Unknown location'}
              </div>
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 mr-1" />
                {complaint.submittedBy?.name || 'Anonymous'}
              </div>
              <div className="capitalize">
                {complaint.category}
              </div>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {complaint.description}
            </p>

            {/* Images */}
            {complaint.images && complaint.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {complaint.images.map((image, index) => (
                  <img
                    key={index}
                    src={`/api/uploads/${image}`}
                    alt={`Complaint ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            {/* Voting */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleVote('upvote')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <HandThumbUpIcon className="h-4 w-4 mr-2" />
                {complaint.upvotes || 0}
              </button>
              <button
                onClick={() => handleVote('downvote')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <HandThumbDownIcon className="h-4 w-4 mr-2" />
                {complaint.downvotes || 0}
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
              Comments ({comments.length})
            </h2>
          </div>

          {/* Add Comment Form */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmitComment}>
              <div className="mb-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Add a comment..."
                />
              </div>
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                Post Comment
              </button>
            </form>
          </div>

          {/* Comments List */}
          <div className="px-6 py-4">
            {comments.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment._id} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <div className="flex items-center mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {comment.author?.name || 'Anonymous'}
                      </span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetail;