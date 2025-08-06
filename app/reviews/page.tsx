'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReviewDisplay from '@/components/ReviewDisplay';

export default function ReviewsPage() {
  const [filterProvider, setFilterProvider] = useState('');
  const [filterService, setFilterService] = useState('');
  const [displayLimit, setDisplayLimit] = useState(20);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-black text-white p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            TradesMonk
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/about" className="hover:text-gray-300">About</Link>
            <Link href="/profile" className="hover:text-gray-300">Profile</Link>
            <div className="text-sm">
              Customer Reviews
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Customer Reviews
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See what our customers are saying about TradesMonk services and providers. 
              Real reviews from verified bookings.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Filter Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Provider
                </label>
                <input
                  type="text"
                  value={filterProvider}
                  onChange={(e) => setFilterProvider(e.target.value)}
                  placeholder="Enter provider name..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Service
                </label>
                <input
                  type="text"
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value)}
                  placeholder="Enter service name..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Reviews
                </label>
                <select
                  value={displayLimit}
                  onChange={(e) => setDisplayLimit(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={10}>10 Reviews</option>
                  <option value={20}>20 Reviews</option>
                  <option value={50}>50 Reviews</option>
                  <option value={100}>100 Reviews</option>
                </select>
              </div>
            </div>
            
            {(filterProvider || filterService) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setFilterProvider('');
                    setFilterService('');
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Reviews Display */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <ReviewDisplay
              providerName={filterProvider || undefined}
              serviceName={filterService || undefined}
              limit={displayLimit}
              showStatistics={true}
            />
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Ready to Experience Quality Service?</h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Join thousands of satisfied customers who trust TradesMonk for their home service needs. 
                Book with confidence knowing you're working with verified, reviewed professionals.
              </p>
              <Link
                href="/"
                className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
              >
                Book a Service Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
