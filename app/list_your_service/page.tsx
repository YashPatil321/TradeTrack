"use client";

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-black mb-8">Welcome to TradeTrack!</h1>
      <p className="text-lg text-black mb-12">Select your trade to get started:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl">
        <Link href="/truck_input" className="block p-6 bg-white rounded shadow hover:shadow-lg transition">
          <h2 className="text-2xl font-bold mb-2">Food Truck</h2>
          <p className="text-gray-700">Showcase your food truck and schedule locations.</p>
        </Link>
        <Link href="/plumber_input" className="block p-6 bg-white rounded shadow hover:shadow-lg transition">
          <h2 className="text-2xl font-bold mb-2">Plumber</h2>
          <p className="text-gray-700">Connect with customers seeking plumbing services.</p>
        </Link>
        <Link href="/cleaning_input" className="block p-6 bg-white rounded shadow hover:shadow-lg transition">
          <h2 className="text-2xl font-bold mb-2">Cleaning Services</h2>
          <p className="text-gray-700">Reach clients in need of professional cleaning.</p>
        </Link>
        <Link href="/electrician_input" className="block p-6 bg-white rounded shadow hover:shadow-lg transition">
          <h2 className="text-2xl font-bold mb-2">Electrician</h2>
          <p className="text-gray-700">Offer reliable electrical repair and installation services.</p>
        </Link>
        <Link href="/carpenter_input" className="block p-6 bg-white rounded shadow hover:shadow-lg transition">
          <h2 className="text-2xl font-bold mb-2">Carpenter</h2>
          <p className="text-gray-700">Show off your carpentry projects and expertise.</p>
        </Link>
      </div>
    </div>
  );
}
