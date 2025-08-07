import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { Video, Play, CheckCircle, XCircle, Forward, MessageCircle } from 'lucide-react';
import type { VideoReview, ReviewStatus } from '../types';

export const VideoReviews: React.FC = () => {
  const { videoReviews, kpis } = useAppStore();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedReview, setSelectedReview] = useState<VideoReview | null>(null);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const videoReviewsList = Object.values(videoReviews);

  const filteredReviews = selectedStatus === 'all' 
    ? videoReviewsList 
    : videoReviewsList.filter(review => review.review_status === selectedStatus);

  const getStatusColor = (status: ReviewStatus) => {
    const colors = {
      queued: 'bg-yellow-100 text-yellow-800',
      forwarded: 'bg-blue-100 text-blue-800',
      reviewed: 'bg-green-100 text-green-800',
      resolved: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleStatusUpdate = async (reviewId: string, newStatus: ReviewStatus) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/video-reviews/${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          status: newStatus,
          comments: comment
        })
      });

      if (response.ok) {
        // Update will come through WebSocket
        setComment('');
        setSelectedReview(null);
      }
    } catch (error) {
      console.error('Error updating video review:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForward = async (reviewId: string, agency: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/video-reviews/${reviewId}/forward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ agency })
      });

      if (response.ok) {
        setSelectedReview(null);
      }
    } catch (error) {
      console.error('Error forwarding video review:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Video Reviews</h2>
          <p className="text-gray-600 mt-1">Review flagged enforcement incidents</p>
        </div>
        
        {/* Stats Cards */}
        <div className="flex space-x-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 min-w-[120px]">
            <div className="text-2xl font-bold text-yellow-800">{kpis?.video_reviews_queued || 0}</div>
            <div className="text-sm text-yellow-600">Pending Review</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 min-w-[120px]">
            <div className="text-2xl font-bold text-green-800">{kpis?.video_reviews_confirmed || 0}</div>
            <div className="text-sm text-green-600">Confirmed</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 min-w-[120px]">
            <div className="text-2xl font-bold text-blue-800">{kpis?.video_confirm_rate || 0}%</div>
            <div className="text-sm text-blue-600">Confirm Rate</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        {[
          { key: 'all', label: 'All', count: videoReviewsList.length },
          { key: 'queued', label: 'Queued', count: videoReviewsList.filter(r => r.review_status === 'queued').length },
          { key: 'forwarded', label: 'Forwarded', count: videoReviewsList.filter(r => r.review_status === 'forwarded').length },
          { key: 'reviewed', label: 'Reviewed', count: videoReviewsList.filter(r => r.review_status === 'reviewed').length },
          { key: 'resolved', label: 'Resolved', count: videoReviewsList.filter(r => r.review_status === 'resolved').length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setSelectedStatus(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === key
                ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            } border`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Video Reviews Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredReviews.map((review) => (
          <div key={review.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Video Thumbnail */}
            <div className="relative bg-gray-900 aspect-video">
              <img 
                src={review.thumbnail_url || '/api/placeholder/400/225'} 
                alt="Video thumbnail"
                className="w-full h-full object-cover opacity-80"
                onError={(e) => {
                  // Fallback to placeholder
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225' viewBox='0 0 400 225'%3E%3Crect width='400' height='225' fill='%23374151'/%3E%3Ctext x='200' y='112' text-anchor='middle' fill='white' font-family='Arial' font-size='16'%3EVideo Clip%3C/text%3E%3C/svg%3E";
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="text-white w-12 h-12" />
              </div>
              <div className="absolute top-2 left-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(review.review_status)}`}>
                  {review.review_status.toUpperCase()}
                </span>
              </div>
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded text-xs font-medium bg-black bg-opacity-50 text-white`}>
                  {Math.round(review.confidence_score * 100)}% confidence
                </span>
              </div>
            </div>

            {/* Video Details */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900">
                  {formatEventType(review.event_id.split('-')[0] || 'Unknown')}
                </h3>
                <span className="text-xs text-gray-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Agency:</span>
                  <span className="font-medium">{review.destination_agency.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Confidence:</span>
                  <span className={`font-medium ${getConfidenceColor(review.confidence_score)}`}>
                    {Math.round(review.confidence_score * 100)}%
                  </span>
                </div>
              </div>

              {review.reviewer_comments && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                  <MessageCircle className="w-4 h-4 inline mr-1" />
                  {review.reviewer_comments}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2 mt-4">
                {review.review_status === 'queued' && (
                  <>
                    <button
                      onClick={() => setSelectedReview(review)}
                      className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700 transition-colors"
                    >
                      <Video className="w-4 h-4 inline mr-1" />
                      Review
                    </button>
                  </>
                )}
                {review.review_status === 'reviewed' && (
                  <button
                    onClick={() => handleForward(review.id, review.destination_agency)}
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Forward className="w-4 h-4 inline mr-1" />
                    Forward
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <div className="text-center py-12">
          <Video className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No video reviews</h3>
          <p className="mt-1 text-sm text-gray-500">
            {selectedStatus === 'all' ? 'No video reviews have been created yet.' : `No ${selectedStatus} video reviews found.`}
          </p>
        </div>
      )}

      {/* Review Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedReview(null)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Review Video: {formatEventType(selectedReview.event_id.split('-')[0] || 'Unknown')}
                </h3>
                
                {/* Simulated Video Player */}
                <div className="bg-gray-900 aspect-video rounded mb-4 flex items-center justify-center">
                  <Play className="text-white w-16 h-16" />
                </div>

                <div className="space-y-3 text-sm">
                  <div><strong>Confidence Score:</strong> {Math.round(selectedReview.confidence_score * 100)}%</div>
                  <div><strong>Agency:</strong> {selectedReview.destination_agency.toUpperCase()}</div>
                  <div><strong>Created:</strong> {new Date(selectedReview.created_at).toLocaleString()}</div>
                </div>

                <div className="mt-4">
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                    Review Comments
                  </label>
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                    placeholder="Add your review comments..."
                  />
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => handleStatusUpdate(selectedReview.id, 'reviewed')}
                  disabled={isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Violation
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedReview.id, 'resolved')}
                  disabled={isLoading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Dismiss
                </button>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};