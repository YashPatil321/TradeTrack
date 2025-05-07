"use client";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FaGoogle, FaSpinner } from "react-icons/fa";

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/profile");
    }
  }, [status, router]);

  const handleSignIn = () => {
    setIsLoading(true);
    signIn("google");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f5d9bc" }}>
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-300 h-12 w-12"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f5d9bc" }}>
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
          </ul>
        </div>
      </nav>

      <div className="flex items-center justify-center min-h-screen pt-16">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome to TradeTrack</h1>
            <p className="text-black">Sign in to manage your services and bookings</p>
          </div>

          {session ? (
            <div className="text-center">
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <p className="text-green-700 font-medium">Welcome, {session.user?.name}!</p>
                <p className="text-sm text-green-600 mt-1">You are successfully signed in</p>
              </div>
              
              <div className="flex flex-col space-y-4">
                <button 
                  onClick={() => router.push('/profile')}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
                >
                  Go to Profile
                </button>
                
                <button 
                  onClick={() => signOut()}
                  className="bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <p className="text-black mb-4">Connect with your Google account to access all features:</p>
                <ul className="list-disc pl-5 text-black text-sm">
                  <li className="mb-1">Book services from professionals</li>
                  <li className="mb-1">List your own services</li>
                  <li className="mb-1">Manage your bookings</li>
                  <li className="mb-1">Track payments</li>
                </ul>
              </div>
              
              <button
                onClick={handleSignIn}
                disabled={isLoading}
                className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-black py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center shadow-sm"
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin mr-2" />
                ) : (
                  <FaGoogle className="text-red-500 mr-2" />
                )}
                {isLoading ? "Connecting..." : "Sign in with Google"}
              </button>
              
              <div className="mt-6 text-center text-sm text-black">
                <p>By signing in, you agree to our <a href="#" className="text-blue-500 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-500 hover:underline">Privacy Policy</a></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <SessionProvider>
      <LoginContent />
    </SessionProvider>
  );
}
