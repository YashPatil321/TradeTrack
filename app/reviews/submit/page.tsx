'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ReviewFormData {
  customerEmail: string;
  customerName: string;
  bookingId: string;
  serviceName: string;
  serviceType: string;
  providerName: string;
  rating: number;
  reviewText: string;
  wouldRecommend: boolean | null;
  serviceQuality: number;
  timeliness: number;
  communication: number;
}

function ReviewSubmissionForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [formData, setFormData] = useState<ReviewFormData>({
    customerEmail: '',
    customerName: '',
    bookingId: '',
    serviceName: '',
    serviceType: '',
    providerName: '',
    rating: 0,
    reviewText: '',
    wouldRecommend: null,
    serviceQuality: 0,
    timeliness: 0,
    communication: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    // Pre-fill form with URL parameters
    setFormData(prev => ({
      ...prev,
      customerEmail: searchParams.get('customerEmail') || '',
      customerName: searchParams.get('customerName') || '',
      bookingId: searchParams.get('bookingId') || '',
      serviceName: searchParams.get('serviceName') || '',
      serviceType: searchParams.get('serviceType') || '',
      providerName: searchParams.get('providerName') || ''
    }));
  }, [searchParams]);

  const handleStarClick = (field: 'rating' | 'serviceQuality' | 'timeliness' | 'communication', value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStars = (field: 'rating' | 'serviceQuality' | 'timeliness' | 'communication', currentValue: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(field, star)}
            className={`text-2xl transition-colors duration-200 ${
              star <= currentValue ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400`}
          >
            ⭐
          </button>
        ))}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      setSubmitError('Please select an overall rating');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitSuccess(true);
        // Redirect to thank you page after 3 seconds
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setSubmitError(result.error || 'Failed to submit review');
      }
    } catch (error) {
      setSubmitError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            Your review has been submitted successfully. Thank you for helping other customers make informed decisions!
          </p>
          <Link 
            href="/"
            className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            Return to TradesMonk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-black text-white p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            TradesMonk
          </Link>
          <div className="text-sm">
            Leave a Review
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              How was your service?
            </h1>
            <p className="text-gray-600">
              Your feedback helps us maintain quality and helps other customers
            </p>
          </div>

          {/* Service Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Service Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Service:</span>
                <p className="text-gray-800">{formData.serviceName}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Provider:</span>
                <p className="text-gray-800">{formData.providerName}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Customer:</span>
                <p className="text-gray-800">{formData.customerName}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Booking ID:</span>
                <p className="text-gray-800">{formData.bookingId}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Overall Rating */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                Overall Rating *
              </label>
              <div className="flex items-center space-x-4">
                {renderStars('rating', formData.rating)}
                <span className="text-gray-600">
                  {formData.rating > 0 && `${formData.rating} star${formData.rating !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>

            {/* Detailed Ratings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Quality
                </label>
                {renderStars('serviceQuality', formData.serviceQuality)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeliness
                </label>
                {renderStars('timeliness', formData.timeliness)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Communication
                </label>
                {renderStars('communication', formData.communication)}
              </div>
            </div>

            {/* Written Review */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                Tell us about your experience
              </label>
              <textarea
                value={formData.reviewText}
                onChange={(e) => setFormData(prev => ({ ...prev, reviewText: e.target.value }))}
                placeholder="Share details about the service quality, professionalism, and your overall experience..."
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                maxLength={1000}
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {formData.reviewText.length}/1000 characters
              </div>
            </div>

            {/* Recommendation */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                Would you recommend this provider?
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, wouldRecommend: true }))}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    formData.wouldRecommend === true
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  👍 Yes
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, wouldRecommend: false }))}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    formData.wouldRecommend === false
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  👎 No
                </button>
              </div>
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{submitError}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting || formData.rating === 0}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ReviewSubmitPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading review form...</p>
        </div>
      </div>
    }>
      <ReviewSubmissionForm />
    </Suspense>
  );
}
