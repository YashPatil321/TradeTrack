"use client";

import Link from "next/link";

export default function MainNav() {
  return (
    <header className="w-full h-16 border-b border-gray-200 bg-white/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-gray-900">
          TradesMonk
        </Link>
        <nav className="flex items-center gap-4 text-sm text-gray-700">
          <Link href="/about" className="hover:text-gray-900">About</Link>
          <Link href="/reviews" className="hover:text-gray-900">Reviews</Link>
        </nav>
      </div>
    </header>
  );
}
