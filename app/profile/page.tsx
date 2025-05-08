"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSession, signOut, signIn, SessionProvider } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaUser, FaTools, FaChartLine, FaHome, FaHistory, FaListAlt, FaSignOutAlt } from 'react-icons/fa';
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

function ProfileContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileType, setProfileType] = useState<string | null>(null);
  const [hasHandymanService, setHasHandymanService] = useState(false);
  const [stripeConnectSuccess, setStripeConnectSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('services');
  const [showProfileSelection, setShowProfileSelection] = useState(false);

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
      // Check if user has a profile type set
      const checkProfileType = async () => {
        try {
          const res = await fetch(`/api/user/profile?email=${session?.user?.email}`);
          const data = await res.json();
          if (data.success && data.profile) {
            setProfileType(data.profile.type);
          } else {
            // If no profile exists, show profile selection
            setShowProfileSelection(true);
          }
        } catch (error) {
          console.error("Error checking profile type:", error);
          setShowProfileSelection(true);
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
        setShowProfileSelection(false);
      } else {
        console.error('Error saving profile type:', data.error);
      }
    } catch (error) {
      console.error('Error saving profile type:', error);
    }
  };

  // Fetch services and bookings data once authenticated
  useEffect(() => {
    async function fetchServices() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/services");
        const json = await res.json();
        if (json.success) {
          // Filter services to only include those belonging to the current user
          const userServices = json.data.filter(
            (service: Service) => service.userEmail === session?.user?.email
          );
          setServices(userServices);
          
          // Check if user has any handyman services
          const handymanServices = userServices.filter(
            (service: Service) => service.trade === "handyman"
          );
          setHasHandymanService(handymanServices.length > 0);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchBookings() {
      try {
        const res = await fetch("/api/bookings/user");
        const json = await res.json();
        if (json.success) {
          // The API now returns client bookings and provider bookings separately
          setBookings(json.clientBookings || []);
          
          // If the user is also a provider, they will have a separate dashboard page
          if (json.isProvider) {
            // For visual indication that there are provider bookings
            setHasHandymanService(true);
          }
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    }

    if (status === "authenticated" && session?.user?.email && !showProfileSelection) {
      fetchServices();
      fetchBookings();
    }
  }, [status, session, showProfileSelection]);

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
  
  // Profile Selection UI
  if (showProfileSelection) {
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
        
        <WelcomeScreen onProfileSelected={() => setShowProfileSelection(false)} />
      </div>
    );
  }

  if (status === "loading") {
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

        <div className="max-w-5xl mx-auto p-8 pt-24">
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-300 h-12 w-12"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Profile UI
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
            <li>
              <Link href="/list_your_service" legacyBehavior>
                <a className="hover:text-gray-300">List Your Service</a>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-8 pt-24">
        {/* Profile Type Indicator */}
        {profileType && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Account Type</h2>
            <div className="flex items-center">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                profileType === 'client' ? 'bg-blue-100 text-blue-800' : 
                profileType === 'provider' ? 'bg-green-100 text-green-800' : 
                'bg-purple-100 text-purple-800'
              }`}>
                {profileType === 'client' ? 'Client' : 
                 profileType === 'provider' ? 'Provider' : 
                 'Both (Client & Provider)'}
              </span>
              <button 
                onClick={() => setShowProfileSelection(true)}
                className="ml-4 text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Change
              </button>
            </div>
          </div>
        )}

        {/* Stripe Connect Success Message */}
        {stripeConnectSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
            <span className="block sm:inline">Successfully connected to Stripe! You can now receive payments.</span>
          </div>
        )}

        {/* User Profile Card */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="bg-gray-200 rounded-full p-6">
              <FaUser className="w-12 h-12 text-gray-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{session?.user?.name || 'User'}</h1>
              <p className="text-gray-600">{session?.user?.email}</p>
              <p className="mt-2 text-gray-800">Profile Type: <span className="font-semibold capitalize">{profileType || 'Not set'}</span></p>
              <div className="flex mt-4 md:mt-0 space-x-3">
                <Link href="/list_your_service" legacyBehavior>
                  <a className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition">
                    Add New Service
                  </a>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
          <div className="flex border-b">
            <button
              className={`flex-1 py-3 px-4 font-medium ${
                activeTab === 'orders' ? 'bg-gray-100 border-b-2 border-blue-500' : ''
              }`}
              onClick={() => setActiveTab('orders')}
            >
              <FaListAlt className="inline mr-2" /> My Orders
            </button>
            <button
              className={`flex-1 py-3 px-4 font-medium ${
                activeTab === 'services' ? 'bg-gray-100 border-b-2 border-blue-500' : ''
              }`}
              onClick={() => setActiveTab('services')}
            >
              <FaTools className="inline mr-2" /> My Services
            </button>
            {hasHandymanService && (
              <Link href="/provider/dashboard" legacyBehavior>
                <a className="flex-1 py-3 px-4 font-medium text-center hover:bg-gray-50">
                  <FaChartLine className="inline mr-2" /> Provider Dashboard
                </a>
              </Link>
            )}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">My Orders</h2>
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
                        <div className="flex justify-between">
                          <h3 className="font-medium">{booking.serviceName}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Provider: {booking.providerName}</p>
                        <p className="text-sm text-gray-600">Date: {new Date(booking.date).toLocaleDateString()} at {booking.time}</p>
                        <p className="text-sm text-gray-600">Amount: ${booking.amount.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">Payment: {booking.paymentStatus}</p>
                        <div className="mt-3 flex space-x-2">
                          <Link href={`/booking/${booking._id}`} legacyBehavior>
                            <a className="text-blue-500 hover:text-blue-700 text-sm">View Details</a>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">You haven't made any bookings yet.</p>
                    <Link href="/" legacyBehavior>
                      <a className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition">
                        Browse Services
                      </a>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'services' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">My Services</h2>
                {isLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : services.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => (
                      <div key={service._id} className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{getTradeIcon(service.trade)}</span>
                          <div>
                            <h3 className="font-medium">{service.name}</h3>
                            <p className="text-sm text-gray-600 capitalize">{service.trade.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{service.description.substring(0, 100)}...</p>
                        <p className="text-sm text-gray-600 mt-1">Hours: {service.hours}</p>
                        <p className="text-sm text-gray-600">Location: {service.mainLocation}</p>
                        <div className="mt-3 flex space-x-2">
                          <Link href={`/service/${service._id}`} legacyBehavior>
                            <a className="text-blue-500 hover:text-blue-700 text-sm">View</a>
                          </Link>
                          <Link href={`/service/edit/${service._id}`} legacyBehavior>
                            <a className="text-green-500 hover:text-green-700 text-sm">Edit</a>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">You haven't listed any services yet.</p>
                    <Link href="/list_your_service" legacyBehavior>
                      <a className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition">
                        Add a Service
                      </a>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <SessionProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <ProfileContent />
      </Suspense>
    </SessionProvider>
  );
}