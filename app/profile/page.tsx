"use client";

import { SessionProvider, useSession, signOut, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import StripeConnect from "@/components/profile/StripeConnect";
import { FaUser, FaTools, FaHistory, FaListAlt, FaSignOutAlt } from "react-icons/fa";

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
}

function ProfileContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services');
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
        const res = await fetch("/api/bookings?email=" + session?.user?.email);
        const json = await res.json();
        if (json.success) {
          setBookings(json.data);
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
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email,
          type: type
        })
      });
      const data = await res.json();
      if (data.success) {
        setProfileType(type);
        setShowProfileSelection(false);
        if (type === "service_provider") {
          router.push("/handyman_input");
        }
      }
    } catch (error) {
      console.error("Error creating profile:", error);
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

        {/* Conditional display based on whether profile selection is shown */}
        {!showProfileSelection && (
          <>
            {/* Stripe Connect Success Message */}
            {stripeConnectSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-black">Stripe account setup successful!</p>
                  <p className="text-sm mt-1 text-black">Your Stripe account has been connected to TradeTrack. You can now receive payments for your handyman services.</p>
                </div>
              </div>
            )}
            
            {/* Stripe Connect Section (Only for Handyman Service Owners) */}
            {profileType === "service_provider" && hasHandymanService && (
              <StripeConnect />
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-bold text-black mb-6">
                  {profileType === "service_provider" ? "Your Listed Services" : "Services You Can Order"}
                </h2>
                
                {profileType === "service_provider" ? (
                  isLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="bg-gray-100 p-4 rounded-lg">
                          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : services.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-black text-lg mb-4">
                        You haven&apos;t listed any services yet.
                      </p>
                      <Link href="/list_your_service">
                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-lg transition">
                          List Your First Service
                        </button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {services.map((service) => (
                        <div
                          key={service._id}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
                        >
                          {service.image && (
                            <div className="h-48 overflow-hidden">
                              <img
                                src={service.image}
                                alt={service.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="p-5">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-xl font-bold text-black">{service.name}</h3>
                              <span className="text-2xl" title={service.trade}>
                                {getTradeIcon(service.trade)}
                              </span>
                            </div>
                            <p className="text-black mb-3 line-clamp-2">{service.description}</p>
                            <div className="flex flex-col space-y-1 text-sm text-black">
                              <p><strong>Trade:</strong> {service.trade.replace('_', ' ')}</p>
                              <p><strong>Location:</strong> {service.mainLocation}</p>
                              <p><strong>Hours:</strong> {service.hours}</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                              <Link 
                                href={`/edit_service/${service._id}`}
                                className="text-blue-500 hover:text-blue-700 font-medium"
                              >
                                Edit Service
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="text-center py-8">
                    <p className="text-black text-lg mb-4">
                      Browse available services on our home page.
                    </p>
                    <Link href="/">
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-lg transition">
                        Browse Services
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-bold text-black mb-6">
                  Your Order History
                </h2>
                
                {bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-black text-lg mb-4">
                      You don&apos;t have any orders yet.
                    </p>
                    <Link href="/">
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-lg transition">
                        Browse Services
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <div key={booking._id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap justify-between mb-2">
                          <h3 className="text-lg font-semibold text-black">{booking.serviceName}</h3>
                          <span className={`px-2 py-1 rounded text-sm ${booking.status === 'completed' ? 'bg-green-100 text-green-800' : booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-black"><span className="font-medium">Order Date:</span> {new Date(booking.createdAt).toLocaleDateString()}</p>
                            <p className="text-black"><span className="font-medium">Address:</span> {booking.address.addressLine1}, {booking.address.city}</p>
                            <p className="text-black"><span className="font-medium">Payment Status:</span> {booking.paymentStatus}</p>
                          </div>
                          <div>
                            <p className="text-black"><span className="font-medium">Base Fee:</span> ${booking.amount - (booking.materialPrice || 0)}</p>
                            {booking.materialName && (
                              <>
                                <p className="text-black"><span className="font-medium">Materials:</span> {booking.materialName} (${booking.materialPrice})</p>
                              </>
                            )}
                            <p className="text-black font-bold"><span className="font-medium">Total Amount:</span> ${booking.amount}</p>
                          </div>
                        </div>
                        
                        {booking.description && (
                          <div className="mt-2">
                            <p className="text-black"><span className="font-medium">Description:</span> {booking.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Profile Selection */}
        {showProfileSelection && (
          <div className="bg-white shadow-lg rounded-lg p-8">
            <h1 className="text-3xl font-bold text-black mb-6 text-center">Welcome to TradeTrack!</h1>
            <p className="text-black text-lg mb-8 text-center">Please select your account type:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div onClick={() => createProfile("client")} className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-lg p-6 cursor-pointer transition-all">
                <div className="flex flex-col items-center text-center">
                  <div className="text-4xl text-blue-500 mb-4"><FaUser /></div>
                  <h3 className="text-xl font-bold text-black mb-2">I'm a Client</h3>
                  <p className="text-black">I want to hire handymen and other service providers</p>
                </div>
              </div>
              
              <div onClick={() => createProfile("service_provider")} className="bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-lg p-6 cursor-pointer transition-all">
                <div className="flex flex-col items-center text-center">
                  <div className="text-4xl text-green-500 mb-4"><FaTools /></div>
                  <h3 className="text-xl font-bold text-black mb-2">I'm a Service Provider</h3>
                  <p className="text-black">I want to offer my services and get hired</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <SessionProvider>
      <ProfileContent />
    </SessionProvider>
  );
}