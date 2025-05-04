"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession, SessionProvider } from 'next-auth/react';
import Link from 'next/link';

function PaymentConfirmation() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('service_id');
  const paymentIntent = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');
  
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && serviceId) {
      // Fetch service details
      fetch(`/api/services/${serviceId}`)
        .then(res => res.json())
        .then(response => {
          if (!response.success) {
            throw new Error(response.error || 'Failed to fetch service details');
          }
          
          setService(response.data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error:', err);
          setError(err.message);
          setLoading(false);
        });
    } else if (status === 'authenticated' && !serviceId) {
      setError('No service ID provided');
      setLoading(false);
    }
  }, [serviceId, status]);

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const isPaymentSuccessful = redirectStatus === 'succeeded';

  return (
    <div className="max-w-2xl mx-auto my-10 p-6">
      <div className={`text-center p-8 rounded-lg shadow-md ${
        isPaymentSuccessful 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-red-50 border border-red-200'
      }`}>
        {isPaymentSuccessful ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-green-800 mb-4">Payment Successful!</h1>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-red-800 mb-4">Payment Failed</h1>
          </>
        )}

        {service && (
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">Service:</span> {service.name}
            </p>
            {paymentIntent && (
              <p className="text-gray-700 mb-2">
                <span className="font-semibold">Payment Reference:</span>{' '}
                <span className="font-mono text-sm">{paymentIntent}</span>
              </p>
            )}
          </div>
        )}

        {isPaymentSuccessful ? (
          <div className="text-left mb-6">
            <p className="text-green-700 mb-4">
              Thank you for your payment! Your booking for handyman services has been confirmed.
            </p>
            <p className="text-gray-600 mb-2">
              <strong>What's next?</strong>
            </p>
            <ul className="list-disc pl-5 mb-4 text-gray-600">
              <li>You will receive a confirmation email with your receipt and booking details.</li>
              <li>The handyman will contact you shortly to confirm the appointment time.</li>
              <li>You can view your bookings and appointment status in your account dashboard.</li>
            </ul>
          </div>
        ) : (
          <div className="text-left mb-6">
            <p className="text-red-700 mb-4">
              We're sorry, but your payment could not be processed at this time.
            </p>
            <p className="text-gray-600 mb-2">
              <strong>Possible reasons:</strong>
            </p>
            <ul className="list-disc pl-5 mb-4 text-gray-600">
              <li>Your card was declined by the issuing bank.</li>
              <li>Insufficient funds or credit limit.</li>
              <li>The payment information provided was incorrect.</li>
              <li>There was a temporary issue with the payment processor.</li>
            </ul>
            <p className="text-gray-600">
              Please try again with a different payment method or contact your bank for more information.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <Link 
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Return to Home
          </Link>
          
          {!isPaymentSuccessful && (
            <Link 
              href={`/payment?service_id=${serviceId}`}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Try Again
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentConfirmationPage() {
  return (
    <SessionProvider>
      <PaymentConfirmation />
    </SessionProvider>
  );
}
