"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSession, signOut, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaUser, FaTools, FaChartLine, FaHome, FaHistory, FaListAlt, FaSignOutAlt } from 'react-icons/fa';
import { SessionProvider } from 'next-auth/react';
import Link from 'next/link';
import StripeConnect from "@/components/profile/StripeConnect";

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
  const [activeTab, setActiveTab] = useState('orders');
  const [profileType, setProfileType] = useState<string | null>(null);
  const [hasHandymanService, setHasHandymanService] = useState(false);
  const [stripeConnectSuccess, setStripeConnectSuccess] = useState(false);
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

  // Redirect to login if unauthenticated
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

    if (status === "authenticated" && session?.user?.email) {
      fetchServices();
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

  const createProfile = async (type: string) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        throw new Error('Failed to create profile');
      }

      setShowProfileSelection(false);
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#f5d9bc" }}>
        {/* Fixed Nav Bar - maintained even during loading */}
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
        
        <div className="flex items-center justify-center min-h-screen pt-16">
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
    );
  }

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
        {/* User Profile Card */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Picture */}
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-4xl">
              {session?.user?.name?.[0] || "?"}
            </div>
            
            {/* User Details */}
            <div className="flex-grow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {session?.user?.name || "Guest"}
                  </h1>
                  <p className="text-gray-600 mb-2">{session?.user?.email || "No email provided"}</p>
                </div>
                
                <div className="flex mt-4 md:mt-0 space-x-3">
                  <Link href="/list_your_service">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition">
                      Add New Service
                    </button>
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
              
              {/* Create New Account Button */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-gray-600 mb-2">Want to create a new account?</p>
                <button
                  onClick={() => signIn("google")}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition"
                >
                  Create New Account
                </button>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96">
              <div className="bg-white shadow-lg rounded-lg p-8">
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-3xl font-bold text-black">My Profile</h1>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setActiveTab('services')}
                      className={`px-4 py-2 rounded-lg ${
                        activeTab === 'services'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      My Services
                    </button>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className={`px-4 py-2 rounded-lg ${
                        activeTab === 'orders'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      My Bookings
                    </button>
                  </div>
                </div>

                {activeTab === 'services' && (
                  <div className="bg-white shadow-lg rounded-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-black">My Services</h2>
                      {hasHandymanService && (
                        <Link href="/provider-dashboard" className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                          <FaChartLine className="mr-2" /> View Dashboard
                        </Link>
                      )}
                    </div>
                    {services.length === 0 ? (
                      <div className="text-center py-8">
                        {hasHandymanService ? (
                          <p className="text-gray-600 mb-4">No services listed yet.</p>
                        ) : (
                          <p className="text-gray-600 mb-4">Browse available services on our home page.</p>
                        )}
                        {hasHandymanService ? (
                          <Link href="/list_your_service">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg transition">
                              List Your Service
                            </button>
                          </Link>
                        ) : (
                          <Link href="/">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg transition">
                              Browse Services
                            </button>
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {services.map((service) => (
                          <div key={service._id} className="bg-white rounded-lg shadow-md p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-lg font-semibold text-black">{service.name}</h3>
                              <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                                {service.trade.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <p className="text-black">{service.description}</p>
                            <p className="text-black">Hours: {service.hours}</p>
                            <p className="text-black">Location: {service.mainLocation}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div className="bg-white shadow-lg rounded-lg p-6">
                    <div className="mt-8">
                      <div className="bg-blue-50 rounded-lg p-6">
                        <h2 className="text-2xl font-bold text-blue-800 mb-6">My Bookings</h2>
                        {bookings.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-gray-600 mb-4">No bookings yet. Start booking services now!</p>
                            <Link href="/">
                              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg transition">
                                Browse Services
                              </button>
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {bookings.map((booking) => (
                              <div key={booking._id} className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h3 className="text-lg font-semibold text-black">{booking.serviceName}</h3>
                                    <p className="text-gray-600">{booking.providerName}</p>
                                  </div>
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm ${
                                      booking.status === 'completed'
                                        ? 'bg-gray-100 text-gray-800'
                                        : booking.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-black mb-2">
                                      <span className="font-medium">Date:</span> {new Date(booking.date).toLocaleDateString()}
                                    </p>
                                    <p className="text-black">
                                      <span className="font-medium">Time:</span> {booking.time}
                                    </p>
                                  </div>
                                  {booking.address && (
                                    <div>
                                      <p className="text-black mb-2">
                                        <span className="font-medium">Location:</span> {booking.address.city}, {booking.address.state}
                                      </p>
                                      <p className="text-black">
                                        <span className="font-medium">Address:</span> {booking.address.addressLine1}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                {booking.description && (
                                  <div className="mt-4">
                                    <p className="text-black">
                                      <span className="font-medium">Description:</span> {booking.description}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {showProfileSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg w-full max-w-md">
              <h2 className="text-2xl font-bold mb-6">Welcome to TradeTrack</h2>
              <p className="text-gray-600 mb-8">Please select your account type:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => createProfile('client')}
                  className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-lg p-6 text-center transition-all"
                >
                  <FaUser className="text-4xl text-blue-500 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Client</h3>
                  <p className="text-gray-600">I want to hire handymen and other service providers</p>
                </button>
                <button
                  onClick={() => createProfile('service_provider')}
                  className="bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-lg p-6 text-center transition-all"
                >
                  <FaTools className="text-4xl text-gray-600 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Service Provider</h3>
                  <p className="text-gray-600">I want to offer my services and get hired</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ProfilePage() {
  return (
    <SessionProvider>
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }>
        <ProfileContent />
      </Suspense>
    </SessionProvider>
  );
}