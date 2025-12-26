"use client";

import Link from "next/link";

export default function MainNav() {
  return (
    <header className="w-full h-14 bg-black text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-white hover:text-gray-300">
          TradesMonk
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="text-white hover:text-gray-300">Home</Link>
          <Link href="/about" className="text-white hover:text-gray-300">About</Link>
          <Link href="/reviews" className="text-white hover:text-gray-300">Reviews</Link>
        </nav>
      </div>
    </header>
  );
}
