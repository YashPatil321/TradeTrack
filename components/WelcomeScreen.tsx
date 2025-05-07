"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

interface WelcomeScreenProps {
  onProfileSelected: () => void;
}

export default function WelcomeScreen({ onProfileSelected }: WelcomeScreenProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle profile type selection
  const handleProfileTypeSelection = async (type: string) => {
    if (!session?.user?.email) {
      setError("You must be logged in to select a profile type");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email,
          profileType: type,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Notify parent component that profile was selected
        onProfileSelected();
        
        // Redirect to profile page
        router.push('/profile');
      } else {
        setError(data.error || 'Error saving profile type');
      }
    } catch (error: any) {
      setError(error.message || 'Error saving profile type');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: "#f5d9bc" }}>
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-xl w-full">
        <h2 className="text-2xl font-bold text-center mb-6">Welcome to TradeTrack!</h2>
        <p className="text-center text-gray-600 mb-6">
          Please select how you want to use TradeTrack. You can always change this later.
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div 
            onClick={() => !isLoading && handleProfileTypeSelection('client')}
            className={`border-2 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex justify-center mb-4">
              <Image src="/client-icon.svg" alt="Client" width={40} height={40} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Client</h3>
            <p className="text-sm text-gray-600">Book services from professionals</p>
          </div>

          <div 
            onClick={() => !isLoading && handleProfileTypeSelection('provider')}
            className={`border-2 rounded-lg p-6 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex justify-center mb-4">
              <Image src="/provider-icon.svg" alt="Provider" width={40} height={40} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Provider</h3>
            <p className="text-sm text-gray-600">Offer professional services</p>
          </div>

          <div 
            onClick={() => !isLoading && handleProfileTypeSelection('both')}
            className={`border-2 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex justify-center mb-4">
              <Image src="/both-icon.svg" alt="Both" width={40} height={40} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Both</h3>
            <p className="text-sm text-gray-600">Book and offer services</p>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
}