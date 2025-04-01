"use client";

import { SessionProvider, useSession } from "next-auth/react";
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

function DashboardContent() {
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
    return <p>Loading dashboard...</p>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Dashboard</h1>
      {session && (
        <p>
          Welcome, <strong>{session.user?.name}</strong>!
        </p>
      )}
      <div style={{ marginTop: "2rem" }}>
        <h2>Your Services</h2>
        {services.length === 0 ? (
          <p>No services found.</p>
        ) : (
          services.map((service) => (
            <div
              key={service._id}
              style={{ border: "1px solid #ccc", padding: "1rem", marginBottom: "1rem" }}
            >
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <p>
                <strong>Trade:</strong> {service.trade}
              </p>
              <p>
                <strong>Main Location:</strong> {service.mainLocation}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <SessionProvider>
      <DashboardContent />
    </SessionProvider>
  );
}
