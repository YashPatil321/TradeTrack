"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaUser, FaTools, FaHistory, FaListAlt, FaSignOutAlt, FaCheckCircle, FaChartLine } from 'react-icons/fa';
import Link from 'next/link';
import WelcomeScreen from '@/components/WelcomeScreen';

interface Service {
  _id: string;
  name: string;
  description: string;
  image: string;
  hours: string;
  mainLocation: string;
  trade: "food_truck" | "plumber" | "electrician" | "handyman" | "painter";
  userEmail: string;
}

interface Booking {
  _id: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  amount: number;
  customerEmail: string;
  description: string;
  address: any;
  status: string;
  paymentStatus: string;
  createdAt: string;
  materialName?: string;
  materialPrice?: number;
  providerName: string;
  date: string;
  time: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileType, setProfileType] = useState<string>('client');
  const [stripeConnectSuccess, setStripeConnectSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');

  // Check if Stripe Connect is successful
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setStripeConnectSuccess(true);
      
      // Clear the URL parameters after 5 seconds
      const timer = setTimeout(() => {
        router.replace('/profile');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  // Redirect to login if unauthenticatedasdsad
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // Check if user has a profile type set or create a new client profile
      const checkProfileType = async () => {
        try {
          const res = await fetch(`/api/user/profile?email=${session?.user?.email}`);
          const data = await res.json();
          if (data.success && data.profile) {
            setProfileType('client'); // Always set to client regardless of what's stored
          } else {
            // If no profile exists, create one with client type
            handleProfileTypeSelection('client');
          }
        } catch (error) {
          console.error("Error checking profile type:", error);
          handleProfileTypeSelection('client'); // Create a client profile on error
        }
      };
      checkProfileType();
    }
  }, [status, router, session]);

  // Handle profile type selection
  const handleProfileTypeSelection = async (type: string) => {
    if (!session?.user?.email) return;
    
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email,
          profileType: type,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setProfileType(type);
      } else {
        console.error('Error saving profile type:', data.error);
      }
    } catch (error) {
      console.error('Error saving profile type:', error);
    }
  };

  // Fetch bookings data once authenticated
  useEffect(() => {
    async function fetchBookings() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/bookings");
        const json = await res.json();
        if (json.success) {
          setBookings(json.data || []);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated" && session?.user?.email) {
      fetchBookings();
    }
  }, [status, session]);

  const getTradeIcon = (trade: string) => {
    switch (trade) {
      case "food_truck":
        return "🍔";
      case "plumber":
        return "🔧";
      case "electrician":
        return "⚡";
      case "handyman":
        return "🔨";
      case "painter":
        return "🎨";
      default:
        return "📋";
    }
  };

  // Profile Selection UI (removed - client-only app)
  if (false) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#f5d9bc" }}>
        {/* Fixed Nav Bar */}
        <nav className="fixed top-0 left-0 w-full bg-black text-white p-4 z-50 shadow-lg">
          <div className="container mx-auto flex items-center justify-between">
            <div className="text-xl font-bold">TradeTrack</div>
            <ul className="flex space-x-4">
              <li>
                <Link href="/" legacyBehavior>
                  <a className="hover:text-gray-300">Home</a>
                </Link>
              </li>
              <li>
                <Link href="/about" legacyBehavior>
                  <a className="hover:text-gray-300">About</a>
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        <div className="container mx-auto p-8 pt-24">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-6">Welcome to TradeTrack!</h2>
            <p className="text-center text-gray-600 mb-6">
              Please select how you want to use TradeTrack. You can always change this later.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div 
                onClick={() => handleProfileTypeSelection('client')}
                className={`border-2 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all ${profileType === 'client' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              >
                <div className="flex justify-center mb-4">
                  <FaUser className="text-blue-500 w-10 h-10" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Client</h3>
                <p className="text-sm text-gray-600">Book services from professionals</p>
              </div>

              <div 
                onClick={() => handleProfileTypeSelection('provider')}
                className={`border-2 rounded-lg p-6 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all ${profileType === 'provider' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
              >
                <div className="flex justify-center mb-4">
                  <FaTools className="text-green-500 w-10 h-10" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Provider</h3>
                <p className="text-sm text-gray-600">Offer professional services</p>
              </div>

              <div 
                onClick={() => handleProfileTypeSelection('both')}
                className={`border-2 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all ${profileType === 'both' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
              >
                <div className="flex justify-center mb-4">
                  <FaChartLine className="text-purple-500 w-10 h-10" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Both</h3>
                <p className="text-sm text-gray-600">Book and offer services</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#f5d9bc" }}>
        <div className="max-w-6xl mx-auto px-4 py-8 pt-20">
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="bg-gray-200 rounded-full p-6">
                <div className="w-12 h-12"></div>
              </div>
              <div className="flex-1 animate-pulse">
                <div className="h-6 bg-gray-300 rounded mb-3 w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded mb-5 w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded mb-2 w-2/3"></div>
                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-[#f5d9bc]">
      {/* Fixed Nav Bar */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-black text-white shadow-md">
        <div className="container mx-auto flex justify-between items-center p-2">
          <Link href="/" legacyBehavior>
            <a className="text-xl font-bold text-white hover:text-gray-300 cursor-pointer">TradersTap</a>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/" legacyBehavior>
              <a className="text-white hover:text-gray-300">Locator</a>
            </Link>
            {session ? (
              <Link href="/profile" legacyBehavior>
                <a className="text-white hover:text-gray-300 text-sm">
                  Welcome, <span className="text-blue-400">{session.user?.name || session.user?.email?.split('@')[0] || 'tradetrack'}</span>!
                </a>
              </Link>
            ) : (
              <Link href="/profile" legacyBehavior>
                <a className="text-white hover:text-gray-300">Login</a>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-8 pt-24">
        {/* Stripe Connect Success Message */}
        {stripeConnectSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
            <span className="block sm:inline">Successfully connected to Stripe! You can now receive payments.</span>
          </div>
        )}

        {/* User Profile Card */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <div className="flex flex-row items-start gap-6">
            <div className="bg-gray-200 rounded-full p-4">
              <FaUser className="w-10 h-10 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-600 mb-1">{session?.user?.email}</p>
              <p className="text-gray-700">Profile Type: <span className="font-semibold">Client</span></p>
              <div className="mt-2">
                <button
                  onClick={() => signOut()}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center"
                >
                  <FaSignOutAlt className="mr-1" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* My Orders Section - Full Width */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h2>
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking._id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg text-gray-900">{booking.serviceName || 'Service Booking'}</h3>
                        <p className="text-sm text-gray-600 mt-1">Provider: {booking.providerName}</p>
                        <p className="text-sm text-gray-600">Date: {new Date(booking.date).toLocaleDateString()} at {booking.time}</p>
                        <p className="text-sm text-gray-600">Amount: ${(booking.amount || (booking as any).price || 0).toFixed ? (booking.amount || (booking as any).price || 0).toFixed(2) : '0.00'}</p>
                        <p className="text-sm text-gray-600">Payment: {booking.paymentStatus || 'Pending'}</p>
                        {(booking as any).clientInfo?.address && (
                          <p className="text-sm text-gray-600">Service Address: {(booking as any).clientInfo.address}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Booking ID: {booking._id.slice(-8)}</span>
                        <span className="text-sm font-medium text-gray-900">Pay in person when service is provided</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">You haven't made any bookings yet.</p>
                <Link 
                  href="/" 
                  className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
                >
                  Browse Services
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}