'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MainNav from '@/components/MainNav';

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
  const [missingFields, setMissingFields] = useState<string[]>([]);

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
              star <= currentValue ? 'text-amber-500' : 'text-gray-300'
            } hover:text-amber-600`}
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation of required fields
    const required: Array<keyof ReviewFormData> = [
      'customerEmail', 'customerName', 'bookingId', 'serviceName', 'serviceType', 'providerName', 'rating'
    ];
    const missing = required.filter((k) => !formData[k] || (k === 'rating' && formData.rating === 0));
    if (missing.length) {
      setMissingFields(missing.map(String));
      setSubmitError('Please fill the required fields highlighted below.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setMissingFields([]);

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
      <div className="min-h-screen bg-tan-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            Your review has been submitted successfully. Thank you for helping other customers make informed decisions!
          </p>
          <Link 
            href="/"
            className="inline-block bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200"
          >
            Return to TradesMonk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5e6d3' }}>
      <MainNav />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">
              How was your service?
            </h1>
            <p className="text-gray-600">
              Your feedback helps us maintain quality and helps other customers
            </p>
          </div>

          {/* Service Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
            <h2 className="text-lg font-semibold text-black mb-4">Service Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700 block mb-1">Service:</span>
                <p className="text-gray-900 font-medium">{formData.serviceName || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-black block mb-1">Provider:</span>
                <p className="text-black font-medium">{formData.providerName || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-black block mb-1">Customer:</span>
                <p className="text-black">{formData.customerName || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-black block mb-1">Booking ID:</span>
                <p className="font-mono text-black">{formData.bookingId || 'N/A'}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* If any required autofill is missing, show inputs so user can complete them */}
            {(missingFields.length > 0 || !formData.customerEmail || !formData.customerName || !formData.providerName || !formData.serviceName || !formData.serviceType || !formData.bookingId) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-4">
                <p className="text-amber-800 text-sm">Some details were not provided in the link. Please complete the required fields below.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Your Email *</label>
                    <input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                      className={`w-full p-3 border rounded-lg bg-white text-black ${missingFields.includes('customerEmail') ? 'border-red-400' : 'border-gray-300'}`}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Your Name *</label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                      className={`w-full p-3 border rounded-lg bg-white text-black ${missingFields.includes('customerName') ? 'border-red-400' : 'border-gray-300'}`}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Provider Name *</label>
                    <input
                      type="text"
                      value={formData.providerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, providerName: e.target.value }))}
                      className={`w-full p-3 border rounded-lg bg-white text-black ${missingFields.includes('providerName') ? 'border-red-400' : 'border-gray-300'}`}
                      placeholder="e.g., Tony's Handyman Services"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Service Name *</label>
                    <input
                      type="text"
                      value={formData.serviceName}
                      onChange={(e) => setFormData(prev => ({ ...prev, serviceName: e.target.value }))}
                      className={`w-full p-3 border rounded-lg bg-white text-black ${missingFields.includes('serviceName') ? 'border-red-400' : 'border-gray-300'}`}
                      placeholder="e.g., 15AMP Wall Outlet Upgrade Package"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Service Type *</label>
                    <select
                      value={formData.serviceType}
                      onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                      className={`w-full p-3 border rounded-lg bg-white text-black ${missingFields.includes('serviceType') ? 'border-red-400' : 'border-gray-300'}`}
                    >
                      <option value="">Select type</option>
                      <option value="handyman">Handyman</option>
                      <option value="plumber">Plumber</option>
                      <option value="electrician">Electrician</option>
                      <option value="painter">Painter</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-black mb-1">Booking ID *</label>
                    <input
                      type="text"
                      value={formData.bookingId}
                      onChange={(e) => setFormData(prev => ({ ...prev, bookingId: e.target.value }))}
                      className={`w-full p-3 border rounded-lg bg-white text-black ${missingFields.includes('bookingId') ? 'border-red-400' : 'border-gray-300'}`}
                      placeholder="Paste your booking ID"
                    />
                  </div>
                </div>
              </div>
            )}
            {/* Overall Rating */}
            <div className="space-y-2">
              <label className="block text-lg font-semibold text-black mb-2">
                Overall Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-4">
                {renderStars('rating', formData.rating)}
                <span className="text-black font-medium">
                  {formData.rating > 0 ? `${formData.rating} star${formData.rating !== 1 ? 's' : ''}` : 'Select rating'}
                </span>
              </div>
            </div>

            {/* Detailed Ratings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Service Quality
                </label>
                {renderStars('serviceQuality', formData.serviceQuality)}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Timeliness
                </label>
                {renderStars('timeliness', formData.timeliness)}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Communication
                </label>
                {renderStars('communication', formData.communication)}
              </div>
            </div>

            {/* Written Review */}
            <div>
              <label className="block text-lg font-semibold text-black mb-3">
                Tell us about your experience
              </label>
              <textarea
                value={formData.reviewText}
                onChange={(e) => setFormData(prev => ({ ...prev, reviewText: e.target.value }))}
                placeholder="Share details about the service quality, professionalism, and your overall experience..."
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-black placeholder-gray-400"
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
                      : 'bg-gray-200 text-black hover:bg-gray-300'
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
                      : 'bg-gray-200 text-black hover:bg-gray-300'
                  }`}
                >
                  👎 No
                </button>
              </div>
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                <p className="text-red-600 font-medium">{submitError}</p>
                {missingFields.length > 0 && (
                  <ul className="list-disc list-inside text-red-700 text-sm">
                    {missingFields.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting || formData.rating === 0}
                className="bg-black text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
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
