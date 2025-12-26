'use client';

import { useState, useEffect } from 'react';
import { formatReviewForDisplay, getReviewStatistics } from '@/lib/reviewUtils';

interface Review {
  _id: string;
  customerName: string;
  serviceName: string;
  serviceType: string;
  providerName: string;
  rating: number;
  reviewText: string;
  reviewDate: string;
  wouldRecommend?: boolean;
  serviceQuality?: number;
  timeliness?: number;
  communication?: number;
}

interface ReviewDisplayProps {
  providerName?: string;
  serviceName?: string;
  limit?: number;
  showStatistics?: boolean;
}

export default function ReviewDisplay({ 
  providerName, 
  serviceName, 
  limit = 10, 
  showStatistics = true 
}: ReviewDisplayProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    fetchReviews();
  }, [providerName, serviceName, limit]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (providerName) params.append('provider', providerName);
      if (serviceName) params.append('service', serviceName);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/reviews/submit?${params}`);
      const data = await response.json();

      if (response.ok) {
        setReviews(data.reviews);
        setStatistics(data.statistics);
      } else {
        setError(data.error || 'Failed to fetch reviews');
      }
    } catch (err) {
      setError('Network error while fetching reviews');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ⭐
          </span>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  const renderStatistics = () => {
    if (!statistics || !showStatistics) return null;

    const stats = getReviewStatistics(reviews);

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Review Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.average}</div>
            <div className="text-sm text-gray-600">Average Rating</div>
            {renderStars(Math.round(stats.average))}
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Reviews</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {Math.round((stats.distribution[5] + stats.distribution[4]) / stats.total * 100) || 0}%
            </div>
            <div className="text-sm text-gray-600">Positive Reviews</div>
          </div>
        </div>
        
        {/* Rating Distribution */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Rating Distribution</h4>
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center space-x-2 mb-1">
              <span className="text-sm w-8">{rating}⭐</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{
                    width: `${stats.total > 0 ? (stats.distribution[rating as keyof typeof stats.distribution] / stats.total) * 100 : 0}%`
                  }}
                />
              </div>
              <span className="text-sm text-gray-600 w-8">
                {stats.distribution[rating as keyof typeof stats.distribution]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">No Reviews Yet</h3>
        <p className="text-gray-500">
          Be the first to leave a review for this {providerName ? 'provider' : 'service'}!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderStatistics()}
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Customer Reviews ({reviews.length})
        </h3>
        
        {reviews.map((review) => {
          const formattedReview = formatReviewForDisplay(review);
          
          return (
            <div key={review._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-800">{formattedReview.customerName}</h4>
                  <p className="text-sm text-gray-600">
                    {formattedReview.serviceName} • {formattedReview.reviewDate}
                  </p>
                </div>
                {renderStars(review.rating)}
              </div>
              
              {review.reviewText && (
                <p className="text-gray-700 mb-4 leading-relaxed">
                  "{review.reviewText}"
                </p>
              )}
              
              {/* Detailed Ratings */}
              {(review.serviceQuality || review.timeliness || review.communication) && (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  {review.serviceQuality && (
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Quality</div>
                      <div className="text-yellow-500">
                        {'⭐'.repeat(review.serviceQuality)}
                      </div>
                    </div>
                  )}
                  {review.timeliness && (
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Timeliness</div>
                      <div className="text-yellow-500">
                        {'⭐'.repeat(review.timeliness)}
                      </div>
                    </div>
                  )}
                  {review.communication && (
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Communication</div>
                      <div className="text-yellow-500">
                        {'⭐'.repeat(review.communication)}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {review.wouldRecommend !== undefined && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-600">
                    Would recommend: {' '}
                    <span className={`font-medium ${review.wouldRecommend ? 'text-green-600' : 'text-red-600'}`}>
                      {review.wouldRecommend ? '👍 Yes' : '👎 No'}
                    </span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
