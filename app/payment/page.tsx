"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession, SessionProvider } from 'next-auth/react';
import Link from 'next/link';
import StripeProvider from '@/components/StripeProvider';
import CheckoutForm from '@/components/CheckoutForm';

function PaymentPageContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  
  // Get all booking details from URL
  const serviceId = searchParams.get('serviceId');
  const serviceName = searchParams.get('service');
  const serviceDate = searchParams.get('date');
  const serviceTime = searchParams.get('time');
  const estimatedTime = searchParams.get('estimatedTime');
  const priceString = searchParams.get('price');
  const serviceNotes = searchParams.get('notes');
  
  // State variables
  const [clientSecret, setClientSecret] = useState<string>('');
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(priceString ? parseFloat(priceString) : 75);
  const [addressLine1, setAddressLine1] = useState<string>('');
  const [addressLine2, setAddressLine2] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [zipCode, setZipCode] = useState<string>('');
  const [addressError, setAddressError] = useState<string>('');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Show error if no service info provided
  useEffect(() => {
    if (status === 'authenticated' && (!serviceId && !serviceName)) {
      setError('No service selected. Please go back and select a service.');
      setLoading(false);
    }
  }, [serviceId, serviceName, status]);

  // Process service info and create payment intent
  useEffect(() => {
    if (status !== 'authenticated' || loading === false) return;

    const setupPayment = async () => {
      try {
        // Create service object from URL parameters if available
        if (serviceName && priceString) {
          const price = parseFloat(priceString);
          const serviceObj = {
            _id: serviceId || 'direct-booking',
            name: serviceName,
            price: price,
            estimatedTime: estimatedTime || '1 hour',
            description: `Booking for ${serviceName} on ${serviceDate} at ${serviceTime}`,
            skillsAndServices: serviceName,
            hours: serviceTime,
            mainLocation: 'As specified in booking',
          };
          
          setService(serviceObj);
          setAmount(price);
          
          // Create payment intent
          const response = await fetch('/api/payments/create-intent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              serviceId: serviceId || 'direct-booking',
              amount: price,
              description: `${serviceName} - ${serviceDate} at ${serviceTime}`,
            }),
          });
          
          const data = await response.json();
          
          if (!data.success) {
            throw new Error(data.error || 'Failed to create payment intent');
          }
          
          setClientSecret(data.clientSecret);
        } 
        // Fetch service details from API if we have serviceId
        else if (serviceId) {
          const serviceResponse = await fetch(`/api/services/${serviceId}`);
          const serviceData = await serviceResponse.json();
          
          if (!serviceData.success) {
            throw new Error(serviceData.error || 'Failed to fetch service details');
          }
          
          setService(serviceData.data);
          
          // Calculate price
          const baseAmount = priceString ? parseFloat(priceString) : 75;
          setAmount(baseAmount);
          
          // Create payment intent
          const paymentResponse = await fetch('/api/payments/create-intent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              serviceId,
              amount: baseAmount,
            }),
          });
          
          const paymentData = await paymentResponse.json();
          
          if (!paymentData.success) {
            throw new Error(paymentData.error || 'Failed to create payment intent');
          }
          
          setClientSecret(paymentData.clientSecret);
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Payment setup error:', err);
        setError(err.message || 'Failed to set up payment. Please try again.');
        setLoading(false);
      }
    };
    
    setupPayment();
  }, [serviceId, serviceName, priceString, serviceDate, serviceTime, estimatedTime, status, loading]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-900 mb-6">{error}</p>
        <Link 
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  // Loading service details
  if (loading || !service) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-900">Loading service details...</p>
      </div>
    );
  }

  // Render payment page
  return (
    <div className="max-w-4xl mx-auto my-10 p-6">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">Payment for Handyman Service</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-start mb-4">
            {service.image && (
              <img 
                src={service.image} 
                alt={service.name} 
                className="w-24 h-24 object-cover rounded-md mr-4 mb-4 md:mb-0"
              />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900">{service.name}</h2>
              <p className="text-gray-700 mb-4">{service.description || `Service booking for ${serviceDate}`}</p>
              
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Booking Details:</h3>
                <div className="text-gray-900 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {serviceDate && <p className="mb-1"><strong>Date:</strong> {serviceDate}</p>}
                  {serviceTime && <p className="mb-1"><strong>Time:</strong> {serviceTime}</p>}
                  <p className="mb-1"><strong>Service:</strong> {serviceName || service.skillsAndServices}</p>
                  <p className="mb-1"><strong>Estimated Time:</strong> {estimatedTime || service.estimatedTime || '1 hour'}</p>
                  <p className="mb-1"><strong>Price:</strong> ${amount.toFixed(2)}</p>
                  {service.mainLocation && <p className="mb-1"><strong>Location:</strong> {service.mainLocation}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Service Address</h2>
        <p className="text-gray-700 mb-4">Please provide the address where you would like the service to be performed:</p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="address-line1" className="block text-sm font-medium text-gray-900 mb-1">Address Line 1*</label>
            <input
              type="text"
              id="address-line1"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              placeholder="Street address"
              required
            />
          </div>
          
          <div>
            <label htmlFor="address-line2" className="block text-sm font-medium text-gray-900 mb-1">Address Line 2</label>
            <input
              type="text"
              id="address-line2"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              placeholder="Apartment, suite, unit, building, floor, etc."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-900 mb-1">City*</label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                placeholder="City"
                required
              />
            </div>
            
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-900 mb-1">State/Province*</label>
              <input
                type="text"
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                placeholder="State"
                required
              />
            </div>
            
            <div>
              <label htmlFor="zipcode" className="block text-sm font-medium text-gray-900 mb-1">ZIP/Postal Code*</label>
              <input
                type="text"
                id="zipcode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                placeholder="ZIP/Postal code"
                required
              />
            </div>
          </div>
          
          {addressError && <p className="text-red-500 text-sm">{addressError}</p>}
        </div>
      </div>

      {clientSecret ? (
        <StripeProvider options={{ clientSecret }}>
          <CheckoutForm 
            serviceId={serviceId || ''} 
            serviceName={service.name} 
            amount={amount}
            description={`Payment for handyman service: ${service.name}`}
            addressInfo={{
              addressLine1,
              addressLine2,
              city,
              state,
              zipCode,
              serviceNotes: serviceNotes || ''
            }}
            validateAddress={() => {
              if (!addressLine1 || !city || !state || !zipCode) {
                setAddressError('Please fill in all required address fields');
                return false;
              }
              setAddressError('');
              return true;
            }}
          />
        </StripeProvider>
      ) : (
        <div className="text-center p-6 bg-white rounded-lg shadow">
          <div className="animate-spin inline-block h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full mr-2"></div>
          <span className="text-gray-900">Setting up payment system...</span>
        </div>
      )}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <SessionProvider>
      <PaymentPageContent />
    </SessionProvider>
  );
}
