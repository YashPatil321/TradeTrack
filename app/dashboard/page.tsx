"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PayNowButton from "@/components/PayNowButton";

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

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);

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
        const res = await fetch("/api/services");
        const json = await res.json();
        if (json.success) {
          setServices(json.data);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    }
    if (status === "authenticated") {
      fetchServices();
    }
  }, [status]);

  if (status === "loading") {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        {session && (
          <p className="text-gray-600 mt-2">
            Welcome, <strong>{session.user?.name}</strong>!
          </p>
        )}
      </div>
      
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Available Services</h2>
          <Link 
            href="/list_your_service"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            List Your Service
          </Link>
        </div>
        
        {services.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-500">No services found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service._id}
                className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full"
              >
                {service.image && (
                  <div className="h-48 w-full relative">
                    <Image 
                      src={service.image} 
                      alt={service.name} 
                      className="h-full w-full object-cover"
                      width={500}
                      height={300}
                      priority
                    />
                  </div>
                )}
                
                <div className="p-6 flex-grow">
                  <div className="mb-2 flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-800">{service.name}</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {service.trade.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">{service.description}</p>
                  
                  <div className="text-sm text-gray-500">
                    <p className="mb-1"><strong>Location:</strong> {service.mainLocation}</p>
                    <p><strong>Hours:</strong> {service.hours}</p>
                  </div>
                </div>
                
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                  <Link 
                    href={`/services/${service._id}`}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded text-center text-sm font-medium"
                  >
                    View Details
                  </Link>
                  
                  {/* Add payment button for handyman services */}
                  {service.trade === 'handyman' && session?.user?.email !== service.userEmail && (
                    <PayNowButton 
                      serviceId={service._id} 
                      className="flex-1 text-sm font-medium text-center"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <SessionProvider>
      <DashboardContent />
    </SessionProvider>
  );
}
