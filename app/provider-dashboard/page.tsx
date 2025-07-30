"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * This page previously contained the Provider Dashboard functionality.
 * As part of application simplification, service provider features have been removed.
 * All users are now redirected to the client profile page.
 */
export default function ProviderDashboardPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Automatically redirect to the profile page
    router.replace('/profile');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h1 className="text-xl font-bold mb-4">Redirecting to Profile</h1>
        <p className="mb-4">Service provider features have been removed. You are being redirected to the client profile page.</p>
        <div className="animate-spin h-8 w-8 border-t-2 border-blue-500 border-r-2 rounded-full mx-auto"></div>
      </div>
    </div>
  );
}
