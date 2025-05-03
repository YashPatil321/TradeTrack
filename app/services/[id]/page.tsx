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
          
          <p className="text-gray-600 mb-6">{service.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Service Details</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Hours:</span> {service.hours}</p>
                <p><span className="font-medium">Location:</span> {service.mainLocation}</p>
                {isHandyman && service.skillsAndServices && (
                  <p>
                    <span className="font-medium">Skills & Services:</span> {service.skillsAndServices}
                  </p>
                )}
              </div>
            </div>
            
            {service.schedule && service.schedule.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Schedule</h2>
                <div className="space-y-2">
                  {service.schedule.map((slot, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-3 py-1">
                      <p className="font-medium">{slot.day}</p>
                      <p className="text-sm text-gray-600">{slot.time} - {slot.address}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Book this Service</h2>
            <p className="text-gray-600 mb-4">
              {isHandyman 
                ? "Need handyman help? Book this service now with our secure payment system."
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
