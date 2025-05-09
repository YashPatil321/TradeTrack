"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface StripeAccountStatus {
  hasAccount: boolean;
  accountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
}

export default function StripeConnect() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);

  // Check if the user has a connected Stripe account
  useEffect(() => {
    if (session) {
      checkAccountStatus();
    }
  }, [session]);

  const checkAccountStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/stripe/account-status');
      const data = await response.json();
      
      if (data.success || (!data.success && data.hasAccount === false)) {
        setAccountStatus(data);
      } else {
        setError(data.error || 'Failed to check account status');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const connectStripeAccount = async () => {
    setConnectLoading(true);
    setError(null);
    
    try {
      // Get the current URL to use as base URL for redirect
      const baseUrl = window.location.origin;
      
      const response = await fetch('/api/stripe/connect-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ baseUrl }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Redirect to Stripe's onboarding page
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create Stripe account');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setConnectLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Stripe Connect</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Payment Settings</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {accountStatus && accountStatus.hasAccount ? (
        <div>
          <div className="mb-4 p-4 bg-gray-50 rounded-md">
            <p className="font-medium">Stripe Account Status</p>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${accountStatus.detailsSubmitted ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span>Account details: {accountStatus.detailsSubmitted ? 'Completed' : 'Incomplete'}</span>
              </div>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${accountStatus.chargesEnabled ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span>Payment processing: {accountStatus.chargesEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${accountStatus.payoutsEnabled ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span>Payouts: {accountStatus.payoutsEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </div>
          
          {(!accountStatus.detailsSubmitted || !accountStatus.chargesEnabled) && (
            <div className="mt-4">
              <p className="text-gray-700 mb-2">
                Your Stripe account setup is incomplete. You need to complete the onboarding process 
                to receive payments for your handyman services.
              </p>
              <button
                onClick={connectStripeAccount}
                disabled={connectLoading}
                className={`mt-2 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  connectLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {connectLoading ? 'Processing...' : 'Complete Stripe Onboarding'}
              </button>
            </div>
          )}
          
          {accountStatus.chargesEnabled && accountStatus.payoutsEnabled && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-gray-800">
                <span className="font-medium">Your Stripe account is fully set up!</span> You can now receive payments 
                for your handyman services directly to your bank account.
              </p>
              <p className="text-gray-700 mt-2 text-sm">
                Visit the <a 
                  href="https://dashboard.stripe.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Stripe Dashboard
                </a> to manage your payouts and view your earnings.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="text-gray-700 mb-4">
            Connect a Stripe account to receive payments for your handyman services directly to your bank account.
          </p>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mb-4">
            <p className="text-blue-700 text-sm">
              <span className="font-medium">How it works:</span> When customers pay for your services through TradeTrack, 
              the money will be sent to your connected Stripe account. Stripe handles all the payment processing, 
              and you can transfer funds to your bank account at any time.
            </p>
          </div>
          <button
            onClick={connectStripeAccount}
            disabled={connectLoading}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              connectLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {connectLoading ? 'Processing...' : 'Connect Stripe Account'}
          </button>
        </div>
      )}
    </div>
  );
}
