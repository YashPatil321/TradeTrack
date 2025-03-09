"use client";

import Link from "next/link";

export default function ListYourService() {
  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#f5d9bc" }}>
      {/* Fixed Nav Bar */}
      <nav className="fixed top-0 left-0 w-full bg-black text-white p-4 z-50 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-xl font-bold">TruckTrack</div>
          <ul className="flex space-x-4">
            <li>
              <Link href="/" legacyBehavior>
                <a className="hover:text-gray-300">Home</a>
              </Link>
            </li>
            <li>
              <Link href="/about" legacyBehavior>
                <a className="hover:text-gray-300">About</a>
              </Link>
            </li>
            <li>
              <Link href="/contact" legacyBehavior>
                <a className="hover:text-gray-300">Contact</a>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Page Content */}
      <div className="container mx-auto pt-24 px-4">
        <h1 className="text-4xl font-bold text-black mb-8 text-center">List Your Service</h1>
        <p className="text-lg text-black mb-8 text-center">
          Welcome! Choose the type of service you’d like to list and get started.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Food Truck Card */}
          <Link href="/truck_input" legacyBehavior>
            <a className="block bg-white p-6 rounded shadow hover:shadow-lg transition">
              <h2 className="text-2xl font-bold mb-2 text-black">Food Truck</h2>
              <p className="text-gray-700">
                Showcase your food truck, schedule your locations, and reach hungry customers.
              </p>
            </a>
          </Link>
          
          {/* Plumber Card */}
          <Link href="/plumber_input" legacyBehavior>
            <a className="block bg-white p-6 rounded shadow hover:shadow-lg transition">
              <h2 className="text-2xl font-bold mb-2 text-black">Plumber</h2>
              <p className="text-gray-700">
                List your plumbing services and connect with local customers needing repairs.
              </p>
            </a>
          </Link>
          
          {/* Cleaning Services Card */}
          <Link href="/cleaning_input" legacyBehavior>
            <a className="block bg-white p-6 rounded shadow hover:shadow-lg transition">
              <h2 className="text-2xl font-bold mb-2 text-black">Cleaning Services</h2>
              <p className="text-gray-700">
                Promote your professional cleaning services and find new clients in your area.
              </p>
            </a>
          </Link>
          
          {/* Electrician Card */}
          <Link href="/electrician_input" legacyBehavior>
            <a className="block bg-white p-6 rounded shadow hover:shadow-lg transition">
              <h2 className="text-2xl font-bold mb-2 text-black">Electrician</h2>
              <p className="text-gray-700">
                Offer your electrical repair and installation services to homes and businesses.
              </p>
            </a>
          </Link>
          
          {/* You can add more cards here as needed */}
        </div>
      </div>
    </div>
  );
}
