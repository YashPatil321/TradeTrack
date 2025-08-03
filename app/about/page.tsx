"use client";

import { Metadata } from 'next';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function AboutPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5e6d3' }}>
      {/* Navigation Bar - Matching Home Page */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-black text-white shadow-md">
        <div className="container mx-auto flex justify-between items-center p-2">
          <Link href="/" className="text-xl font-bold text-white hover:text-gray-300 cursor-pointer">
            TradesTap
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/about" className="text-white hover:text-gray-300 text-base">
              About
            </Link>
            {session ? (
              <div className="flex items-center space-x-4">
                {/* Admin Dashboard Link - only show for admin */}
                {(session.user?.email === 'yashp.d39@gmail.com' || session.user?.email === 'neelvp@gmail.com') && (
                  <Link href="/admin-dashboard" className="text-white hover:text-gray-300 bg-amber-700 px-3 py-1 rounded text-sm">
                    Admin
                  </Link>
                )}
                <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 hover:bg-gray-700 transition-colors">
                  <Link href="/profile" className="text-white hover:text-gray-300 text-base">
                    Welcome, <span className="text-blue-400" style={{ textShadow: '0 0 2px rgba(0,0,0,0.5)' }}>{session.user?.name || session.user?.email?.split('@')[0] || 'User'}</span>!
                  </Link>
                </div>
              </div>
            ) : (
              <Link href="/profile" className="text-white hover:text-gray-300 text-base">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-black text-white pt-16">
        <div className="container mx-auto px-4 py-24">
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="text-6xl font-bold mb-8 leading-tight">
              About TradesTap
            </h1>
            <p className="text-2xl text-gray-300 leading-relaxed">
              Empowering local service professionals and connecting communities with trusted, independent contractors.
            </p>
          </div>
        </div>
      </div>

      {/* Our Story Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-12 mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Supporting Local Heroes
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                TradesTap was born from a simple truth: <strong>local service professionals are the backbone of our communities</strong>, 
                yet they're constantly being pushed out by massive corporations that prioritize profit over personal service. 
                We're here to level the playing field.
              </p>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                <strong>Did you know?</strong> Small, local service businesses employ over 27 million Americans and contribute 
                $1.3 trillion to the U.S. economy annually. Yet 70% of consumers struggle to find reliable local contractors, 
                often defaulting to expensive corporate chains that charge 40-60% more for the same services.
              </p>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Our mission is simple: connect homeowners directly with skilled, independent professionals in their community. 
                When you choose TradesTap, you're not just getting quality service – you're supporting local families, 
                keeping money in your community, and helping small businesses thrive.
              </p>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="bg-white rounded-2xl shadow-xl p-12 mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="bg-amber-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🔍</span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">1. Search</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Discover local, independent professionals who live and work in your community.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-amber-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">📅</span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">2. Book</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Connect directly with local pros – no corporate middleman, no inflated prices.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-amber-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">✅</span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">3. Relax</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Support your local economy while getting personalized, quality service from people who care.
                </p>
              </div>
            </div>
          </div>

          {/* Why Choose Us Section */}
          <div className="bg-white rounded-2xl shadow-xl p-12 mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              Why Local Matters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="flex items-start space-x-6">
                <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🛡️</span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-4">Support Local Families</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Every booking directly supports independent contractors and their families, not corporate shareholders. 
                    Local businesses reinvest 68% of revenue back into the community.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-6">
                <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-4">Better Prices</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Skip the corporate markup. Local professionals typically charge 30-50% less than big chains 
                    while providing more personalized service.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-6">
                <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-4">Personal Accountability</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Local professionals stake their reputation on every job. They live in your community 
                    and depend on word-of-mouth referrals.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-6">
                <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📍</span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-4">Community Investment</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Local businesses create 2x more local jobs per dollar of revenue than chains. 
                    Your choice makes a real difference in your neighborhood.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-black text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-300">
            Join the movement to support local businesses and get better service at better prices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/" 
              className="bg-white text-black hover:bg-gray-100 px-8 py-3 rounded-lg font-medium text-lg transition-colors"
            >
              Find a Service
            </Link>
            <Link 
              href="/profile" 
              className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-lg font-medium text-lg transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
