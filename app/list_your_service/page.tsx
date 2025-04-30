"use client";

import Link from "next/link";

export default function ListYourService() {
  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#f5d9bc" }}>
      {/* Fixed Nav Bar */}
      <nav className="fixed top-0 left-0 w-full bg-black text-white p-4 z-50 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-xl font-bold">TradeTrack</div>
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
              <Link href="/list_your_service" legacyBehavior>
                <a className="hover:text-gray-300">List Your Service</a>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Page Content */}
      <div className="container mx-auto pt-24 px-4">
        <h1 className="text-4xl font-bold text-black mb-8 text-center">List Your Service</h1>
        <p className="text-lg text-black mb-8 text-center">
          Welcome! Choose the type of service you&apos;d like to list and get started.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {/* Plumber Card */}
          <Link href="/plumber_input" legacyBehavior>
            <a className="block bg-white p-6 rounded shadow hover:shadow-lg transition">
              <h2 className="text-2xl font-bold mb-2 text-black">Plumber</h2>
              <p className="text-gray-700">
                List your plumbing services and connect with local customers needing repairs.
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
          
          {/* Handyman Card */}
          <Link href="/handyman_input" legacyBehavior>
            <a className="block bg-white p-6 rounded shadow hover:shadow-lg transition">
              <h2 className="text-2xl font-bold mb-2 text-black">Handyman</h2>
              <p className="text-gray-700">
                Provide a range of home repair and maintenance services to nearby customers.
              </p>
            </a>
          </Link>
          
          {/* Painter Card */}
          <Link href="/painter_input" legacyBehavior>
            <a className="block bg-white p-6 rounded shadow hover:shadow-lg transition">
              <h2 className="text-2xl font-bold mb-2 text-black">Painter</h2>
              <p className="text-gray-700">
                Showcase your painting expertise for residential and commercial projects.
              </p>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}