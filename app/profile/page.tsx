"use client";

import { SessionProvider, useSession, signOut, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
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

function ProfileContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasHandymanService, setHasHandymanService] = useState(false);
  const [stripeConnectSuccess, setStripeConnectSuccess] = useState(false);

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
    }
  }, [status, router]);

  // Fetch services data once authenticated
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
    if (status === "authenticated" && session?.user?.email) {
      fetchServices();
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

        {/* Stripe Connect Success Message */}
        {stripeConnectSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6 flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-medium">Stripe account setup successful!</p>
              <p className="text-sm mt-1">Your Stripe account has been connected to TradeTrack. You can now receive payments for your handyman services.</p>
            </div>
          </div>
        )}
        
        {/* Stripe Connect Section (Only for Handyman Service Owners) */}
        {hasHandymanService && (
          <StripeConnect />
        )}

        {/* Services Section */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Your Listed Services
          </h2>
          
          {isLoading ? (
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
              <p className="text-gray-500 text-lg mb-4">
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
                      <h3 className="text-xl font-bold text-gray-800">{service.name}</h3>
                      <span className="text-2xl" title={service.trade}>
                        {getTradeIcon(service.trade)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">{service.description}</p>
                    <div className="flex flex-col space-y-1 text-sm text-gray-500">
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
          )}
        </div>
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