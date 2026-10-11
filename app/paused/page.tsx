import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TradesMonk - Services Paused",
  description:
    "TradesMonk services are paused. Our new site is moving to mantlekeep.com.",
};

export default function PausedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-8 sm:p-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Thank you, TradesMonk community
        </h1>
        <p className="text-lg text-gray-700 mb-4">
          Thank you to everyone for being a part of the TradesMonk community.
        </p>
        <p className="text-lg text-gray-700 mb-8">
          TradesMonk services are currently paused while we transition to our
          new site, <span className="font-semibold">MantleKeep</span>.
        </p>
        <a
          href="https://mantlekeep.com"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          Visit mantlekeep.com
        </a>
      </div>
    </main>
  );
}
