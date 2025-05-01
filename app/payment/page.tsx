"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import StripeProvider from '@/components/StripeProvider';
import CheckoutForm from '@/components/CheckoutForm';
import Link from 'next/link';

export default function PaymentPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('service_id');
  
  const [clientSecret, setClientSecret] = useState('');
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);

  // If not authenticated, redirect to login
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  // If no service ID provided, show error
  useEffect(() => {
    if (status === 'authenticated' && !serviceId) {
      setError('No service selected. Please go back and select a service.');
      setLoading(false);
    }
  }, [serviceId, status]);

  // Fetch service details and create payment intent
  useEffect(() => {
    if (status === 'authenticated' && serviceId) {
      // First, fetch the service details
      fetch(`/api/services/${serviceId}`)
        .then(res => res.json())
        .then(response => {
          if (!response.success) {
            throw new Error(response.error || 'Failed to fetch service details');
          }
          
          setService(response.data);
          
          // Calculate amount based on service details
          // This is a simplistic calculation, you might want to implement
          // more sophisticated pricing based on service type, duration, etc.
          const baseAmount = 75; // $75 base fee for handyman services
          setAmount(baseAmount);
          
          // Create payment intent
          return fetch('/api/payments/create-intent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              serviceId,
              amount: baseAmount,
            }),
          });
        })
        .then(res => res.json())
        .then(data => {
          if (!data.success) {
            throw new Error(data.error || 'Failed to create payment intent');
          }
          
          setClientSecret(data.clientSecret);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error:', err);
          setError(err.message);
          setLoading(false);
        });
    }
  }, [serviceId, status]);

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-700 mb-6">{error}</p>
        <Link 
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  if (loading || !service) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-10 p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Payment for Handyman Service</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex items-start mb-4">
            {service.image && (
              <img 
                src={service.image} 
                alt={service.name} 
                className="w-24 h-24 object-cover rounded-md mr-4"
              />
            )}
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">{service.name}</h2>
              <p className="text-gray-600 mb-2">{service.description}</p>
              <div className="text-sm text-gray-500">
                <p><strong>Skills:</strong> {service.skillsAndServices}</p>
                <p><strong>Hours:</strong> {service.hours}</p>
                <p><strong>Location:</strong> {service.mainLocation}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {clientSecret && (
        <StripeProvider options={{ clientSecret }}>
          <CheckoutForm 
            serviceId={serviceId || ''} 
            serviceName={service.name} 
            amount={amount}
            description={`Payment for handyman service: ${service.name}`}
          />
        </StripeProvider>
      )}
    </div>
  );
}
