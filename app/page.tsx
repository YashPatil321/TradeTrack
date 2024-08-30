"use client"; // This marks the file as a Client Component

import { useEffect } from "react";
import Link from 'next/link';

export default function Home() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyA-TlVuQXWUgjmMxpLS4qmWjv164jkl75c&callback=initMap&v=weekly&solution_channel=GMP_CCS_customcontrols_v2`;
    script.async = true;
    script.defer = true;

    window.initMap = function () {
      const map = new window.google.maps.Map(document.getElementById("map"), {
        zoom: 4,
        center: { lat: 39.8283, lng: -98.5795 }, // Center of the USA
      });

      const truckIcon = {
        url: 'food-truck.png', // Path to food truck icon
        scaledSize: new window.google.maps.Size(50, 50),
        origin: new window.google.maps.Point(0, 0),
        anchor: new window.google.maps.Point(25, 50),
      };

      // Array of locations to mark on the map
      const locations = [
        { lat: 40.7128, lng: -74.0060, title: "New York", icon: truckIcon }, // New York
        { lat: 34.0522, lng: -118.2437, title: "Los Angeles", icon: truckIcon }, // Los Angeles
        { lat: 29.7604, lng: -95.3698, title: "Houston", icon: truckIcon }, // Houston
        { lat: 37.7749, lng: -122.4194, title: "San Francisco", icon: truckIcon }, // San Francisco
      ];

      // Create markers for each location
      locations.forEach((location) => {
        new window.google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: map,
          title: location.title,
          icon: location.icon, // Use the custom truck icon
        });
      });
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-black text-white p-4 z-50 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-xl font-bold">
            TruckTrack
          </div>
          <ul className="flex space-x-4">
            <li>
              <a href="services.tsx" className="hover:text-gray-300">
                Locator
              </a>
            </li>
            <li>
              <a href="app/about.tsx" className="hover:text-gray-300">
                About
              </a>
            </li>
            <li>
              <a href="app/servicesx.tsx" className="hover:text-gray-300">
                Services
              </a>
            </li>
            <li>
              <a href="contact.tsx" className="hover:text-gray-300">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </nav>


      <main
        className="flex min-h-screen flex-col items-center justify-between p-24"
        style={{ backgroundColor: "#faedc8" }} // Setting the background color to #faedc8
      >
        <div id="map" style={{ height: "800px", width: "75%" }}></div>
      </main>
    </>
  );
}
