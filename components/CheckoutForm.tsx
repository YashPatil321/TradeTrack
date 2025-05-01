"use client";

import { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
  AddressElement
} from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';

export default function CheckoutForm({ 
  serviceId, 
  serviceName,
  amount,
  description 
}: { 
  serviceId: string;
  serviceName: string;
  amount: number;
  description: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Retrieve the client secret from URL query parameter
    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    // Retrieve the payment intent for any messages or status
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) return;
      
      switch (paymentIntent.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Please provide payment details.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Redirect to the confirmation page after payment
        return_url: `${window.location.origin}/payment-confirmation?service_id=${serviceId}`,
        receipt_email: email,
      },
    });

    // This will only execute if there's an immediate error when confirming the payment
    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message || "An unexpected error occurred");
    } else {
      setMessage("An unexpected error occurred");
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">{serviceName}</h2>
      <p className="mb-6 text-gray-600">{description}</p>
      
      <div className="mb-4">
        <div className="p-4 bg-gray-50 rounded-md mb-4">
          <h3 className="text-lg font-medium mb-2 text-gray-800">Price</h3>
          <p className="text-3xl font-bold text-green-600">${amount.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      
      <div className="mb-6">
        <label htmlFor="payment-element" className="block text-sm font-medium text-gray-700 mb-1">
          Payment details
        </label>
        <PaymentElement id="payment-element" />
      </div>
      
      <div className="mb-6">
        <label htmlFor="address-element" className="block text-sm font-medium text-gray-700 mb-1">
          Billing address
        </label>
        <AddressElement options={{ mode: 'billing' }} />
      </div>
      
      <button
        disabled={isLoading || !stripe || !elements}
        id="submit"
        className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${
          isLoading || !stripe || !elements 
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        <span id="button-text">
          {isLoading ? (
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </span>
      </button>
      
      {/* Show any error or success messages */}
      {message && (
        <div className={`mt-4 p-4 rounded-md ${
          message.includes('succeeded') 
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}
    </form>
  );
}
