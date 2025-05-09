"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FaUser, FaTools, FaClipboardList, FaHome, FaEnvelope } from "react-icons/fa";

interface Booking {
  _id: string;
  serviceId: string;
  serviceName: string;
  amount: number;
  customerEmail: string;
  description: string;
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    date?: string;
    time?: string;
    serviceNotes?: string;
  };
  status: string;
  paymentStatus: string;
  createdAt: string;
  date?: string;
  time?: string;
}

function ProviderDashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProvider, setIsProvider] = useState(false);

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const fetchBookings = async () => {
        try {
          setIsLoading(true);
          const res = await fetch("/api/bookings/user");
          const json = await res.json();
          
          if (json.success) {
            // Set provider bookings from the API
            setBookings(json.providerBookings || []);
            setIsProvider(json.isProvider);
            
            if (!json.isProvider) {
              // If user is not a provider, redirect to regular profile
              router.push("/profile");
            }
          }
        } catch (error) {
          console.error("Error fetching provider bookings:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchBookings();
    }
  }, [status, router]);

  // Format date from ISO string
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString();
  };

  // Email client directly
  const emailClient = (clientEmail: string, serviceName: string) => {
    const subject = encodeURIComponent(`Your ${serviceName} booking`);
    const body = encodeURIComponent(`Hello,\n\nI'm reaching out regarding your recent ${serviceName} booking. `);
    window.open(`mailto:${clientEmail}?subject=${subject}&body=${body}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-black">Service Provider Dashboard</h1>
        <Link href="/profile" className="text-blue-600 hover:text-blue-800">
          &larr; Back to Profile
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {!isProvider ? (
            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
              <h2 className="text-xl font-bold text-yellow-800 mb-2">Not a Service Provider</h2>
              <p className="text-yellow-700">
                You don&apos;t have any services registered as a provider. To view this dashboard, 
                you need to create a service first.
              </p>
              <Link 
                href="/services/create" 
                className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Create a Service
              </Link>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white shadow-lg rounded-lg p-8 text-center">
              <div className="text-5xl text-gray-300 mb-4 mx-auto"><FaClipboardList /></div>
              <h2 className="text-2xl font-bold text-black mb-2">No Bookings Yet</h2>
              <p className="text-gray-600 mb-6">
                You don&apos;t have any client bookings for your services yet.
              </p>
              <Link 
                href="/services/create" 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Add Another Service
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-bold text-black mb-4">Client Bookings</h2>
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking._id} className="border rounded-lg p-5 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-black">{booking.serviceName}</h3>
                          <p className="text-sm text-gray-500">
                            Booking ID: {booking._id.toString().substring(0, 8)}...
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          booking.status === 'completed' 
                            ? 'bg-gray-100 text-gray-800' 
                            : booking.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <h4 className="font-medium text-black mb-2">Booking Details</h4>
                          <p className="text-black flex items-center gap-2">
                            <FaClipboardList className="text-gray-500" /> 
                            <span className="font-medium">Date:</span> {formatDate(booking.date || booking.address?.date)}
                          </p>
                          <p className="text-black flex items-center gap-2">
                            <span className="text-transparent">.</span>
                            <span className="font-medium">Time:</span> {booking.time || booking.address?.time || "Not specified"}
                          </p>
                          <p className="text-black flex items-center gap-2">
                            <span className="text-transparent">.</span>
                            <span className="font-medium">Amount:</span> ${booking.amount.toFixed(2)}
                          </p>
                          <p className="text-black flex items-center gap-2">
                            <span className="text-transparent">.</span>
                            <span className="font-medium">Booked On:</span> {formatDate(booking.createdAt)}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-black mb-2">Client Information</h4>
                          <p className="text-black flex items-center gap-2">
                            <FaUser className="text-gray-500" /> 
                            <span className="font-medium">Email:</span> {booking.customerEmail}
                          </p>
                          <p className="text-black flex items-center gap-2">
                            <FaHome className="text-gray-500" /> 
                            <span className="font-medium">Address:</span> 
                            {booking.address?.addressLine1 && <span>{booking.address.addressLine1}</span>}
                            {booking.address?.addressLine2 && <span>, {booking.address.addressLine2}</span>}
                          </p>
                          <p className="text-black flex items-center gap-2">
                            <span className="text-transparent">.</span>
                            <span className="font-medium">Location:</span> {booking.address?.city}, {booking.address?.state} {booking.address?.zipCode}
                          </p>
                        </div>
                      </div>
                      
                      {booking.address?.serviceNotes && (
                        <div className="bg-gray-50 p-4 rounded-md mb-4">
                          <h4 className="font-medium text-black mb-2">Additional Instructions</h4>
                          <p className="text-black">{booking.address.serviceNotes}</p>
                        </div>
                      )}
                      
                      <div className="flex justify-end space-x-3 mt-4">
                        <button
                          onClick={() => emailClient(booking.customerEmail, booking.serviceName)}
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                        >
                          <FaEnvelope /> Contact Client
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProviderDashboardPage() {
  return (
    <SessionProvider>
      <ProviderDashboardContent />
    </SessionProvider>
  );
}
