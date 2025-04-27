"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Service {
  _id: string;
  name: string;
  description: string;
  image: string;
  hours: string;
  mainLocation: string;
  trade: "food_truck" | "plumber" | "electrician" | "cleaner";
}

function ProfileContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch services data once authenticated
  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch("/api/services");
        const json = await res.json();
        if (json.success) {
          setServices(json.data);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    }
    if (status === "authenticated") {
      fetchServices();
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 pt-24">
      <div className="flex items-center justify-between bg-white shadow rounded-lg p-6 mb-8">
        <div>
          <p className="text-2xl font-semibold mb-1">
            Welcome, <strong>{session?.user?.name || "Guest"}</strong>!
          </p>
          <p className="text-gray-600">
            Email: {session?.user?.email || "N/A"}
          </p>
        </div>
        <div>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Sign out
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold mb-6 text-black">Your Listed Services</h2>
        {services.length === 0 ? (
          <p className="text-gray-500 text-lg">
            You haven&apos;t listed any services yet.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {services.map((service) => (
              <div
                key={service._id}
                className="bg-white shadow rounded-lg p-4 hover:shadow-lg transition-shadow duration-300"
              >
                {service.image && (
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                )}
                <h3 className="text-2xl font-bold mb-2 text-black">{service.name}</h3>
                <p className="text-gray-700 mb-2">{service.description}</p>
                <p className="text-gray-600 mb-1">
                  <strong>Trade:</strong> {service.trade}
                </p>
                <p className="text-gray-600">
                  <strong>Main Location:</strong> {service.mainLocation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <SessionProvider>
      <ProfileContent />
    </SessionProvider>
  );
}
