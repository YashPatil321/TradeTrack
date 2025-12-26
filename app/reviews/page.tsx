'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReviewDisplay from '@/components/ReviewDisplay';
import MainNav from '@/components/MainNav';

export default function ReviewsPage() {
  const [filterProvider, setFilterProvider] = useState('');
  const [filterService, setFilterService] = useState('');
  const [displayLimit, setDisplayLimit] = useState(20);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5e6d3' }}>
      <MainNav />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-black mb-4">
              Customer Reviews
            </h1>
            <p className="text-lg text-black max-w-2xl mx-auto">
              See what our customers are saying about TradesMonk services and providers. 
              Real reviews from verified bookings.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
            <h2 className="text-xl font-semibold text-black mb-4">Filter Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Filter by Provider
                </label>
                <input
                  type="text"
                  value={filterProvider}
                  onChange={(e) => setFilterProvider(e.target.value)}
                  placeholder="Enter provider name..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Filter by Service
                </label>
                <input
                  type="text"
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value)}
                  placeholder="Enter service name..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Number of Reviews
                </label>
                <select
                  value={displayLimit}
                  onChange={(e) => setDisplayLimit(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                  className="text-black hover:text-gray-800 text-sm font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Reviews Display */}
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8 border border-gray-200">
            <ReviewDisplay
              providerName={filterProvider || undefined}
              serviceName={filterService || undefined}
              limit={displayLimit}
              showStatistics={true}
            />
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <div className="bg-black rounded-lg p-8 text-white">
              <h3 className="text-2xl font-bold text-white mb-4">Ready to Experience Quality Service?</h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Join thousands of satisfied customers who trust TradesMonk for their home service needs. 
                Book with confidence knowing you're working with verified, reviewed professionals.
              </p>
              <Link
                href="/"
                className="inline-block bg-amber-500 text-black px-8 py-3 rounded-lg font-semibold hover:bg-amber-400 transition-colors duration-200"
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
