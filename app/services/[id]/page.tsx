"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { SessionProvider } from 'next-auth/react';
import PayNowButton from '@/components/PayNowButton';

interface ServiceDetails {
  _id: string;
  name: string;
  description: string;
  image: string;
  hours: string;
  mainLocation: string;
  trade: string;
  skillsAndServices?: string;
  services?: Array<{
    service: string;
    category?: string;
    rate: number;
    timeLimit: string;
    description: string;
    materialName?: string | null;
    materialPrice?: number;
    totalPrice?: number;
  }>;
  userEmail: string;
  schedule?: {
    day: string;
    time: string;
    address: string;
    lat: number;
    lng: number;
  }[];
}

function ServiceDetailsContent() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const [service, setService] = useState<ServiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServiceDetails() {
      try {
        const response = await fetch(`/api/services/${id}`);
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch service details');
        }
        
        setService(data.data);
      } catch (error: any) {
        console.error('Error fetching service details:', error);
        setError(error.message || 'An error occurred while fetching service details');
      } finally {
        setLoading(false);
      }
    }
    
    if (id) {
      fetchServiceDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-700 mb-6">{error || 'Service not found'}</p>
        <Link 
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  // Check if the service is a handyman service
  const isHandyman = service.trade === 'handyman';
  
  return (
    <div className="max-w-4xl mx-auto my-10 p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {service.image && (
          <div className="w-full h-64 relative">
            <img 
              src={service.image} 
              alt={service.name} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{service.name}</h1>
              <p className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mb-4">
                {service.trade.replace('_', ' ').toUpperCase()}
              </p>
            </div>
            
            {/* Only show payment button for handyman services */}
            {isHandyman && session && session.user?.email !== service.userEmail && (
              <PayNowButton serviceId={service._id} />
            )}
          </div>
          
          <p className="text-black mb-6">{service.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Service Details</h2>
              <div className="space-y-2">
                <p className="text-black"><span className="font-medium">Hours:</span> {service.hours}</p>
                <p className="text-black"><span className="font-medium">Location:</span> {service.mainLocation}</p>
              </div>
            </div>
            
            {service.schedule && service.schedule.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Schedule</h2>
                <div className="space-y-2">
                  {service.schedule.map((slot, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-3 py-1">
                      <p className="font-medium">{slot.day}</p>
                      <p className="text-sm text-black">{slot.time} - {slot.address}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Detailed Services Section */}
          {isHandyman && service.services && service.services.length > 0 && (
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Available Services</h2>
              {/* Group services by category */}
              {Object.entries(service.services.reduce((acc, serviceItem) => {
                const category = serviceItem.category || "Other";
                if (!acc[category]) acc[category] = [];
                acc[category].push(serviceItem);
                return acc;
              }, {} as Record<string, typeof service.services>)).map(([category, items]) => (
                <div key={category} className="mb-6">
                  <h3 className="text-lg font-bold text-black mb-3 border-b pb-2">{category} Services</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {items.map((serviceItem, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-semibold text-black w-3/5 truncate">{serviceItem.service}</h3>
                          <div className="text-lg font-bold text-black">
                            {serviceItem.materialName ? (
                              <>${serviceItem.totalPrice} flat rate <span className="text-black font-normal">({serviceItem.timeLimit})</span></>
                            ) : (
                              <>${serviceItem.rate} flat rate <span className="text-black font-normal">({serviceItem.timeLimit})</span></>
                            )}
                          </div>
                        </div>
                        <p className="text-black">{serviceItem.description}</p>
                        
                        {/* Show material details if available */}
                        {serviceItem.materialName && (
                          <div className="mt-3 pt-2 border-t border-gray-200">
                            <div className="flex justify-between text-black">
                              <span>Service fee:</span>
                              <span>${serviceItem.rate}</span>
                            </div>
                            <div className="flex justify-between text-black">
                              <span>Materials ({serviceItem.materialName}):</span>
                              <span>${serviceItem.materialPrice}</span>
                            </div>
                            <div className="flex justify-between text-black font-bold mt-1 pt-1 border-t border-gray-200">
                              <span>Total:</span>
                              <span>${serviceItem.totalPrice}</span>
                            </div>
                            <div className="mt-2 text-black text-sm italic">
                              Note: If service takes longer than {serviceItem.timeLimit}, additional charges may apply.
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Book this Service</h2>
            <p className="text-black mb-4">
              {isHandyman 
                ? "Need handyman help? Select from our detailed services above and book now with our secure payment system."
                : `Interested in this ${service.trade.replace('_', ' ')} service? Contact the provider for more information.`
              }
            </p>
            
            <div className="flex space-x-4">
              {isHandyman && session && session.user?.email !== service.userEmail ? (
                <PayNowButton 
                  serviceId={service._id} 
                  className="flex-1 py-3 text-center"
                />
              ) : (
                <Link
                  href={`/contact?service=${service._id}`}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded text-center"
                >
                  Contact Provider
                </Link>
              )}
              
              <Link
                href="/"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded"
              >
                Back to Services
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServiceDetailsPage() {
  return (
    <SessionProvider>
      <ServiceDetailsContent />
    </SessionProvider>
  );
}
