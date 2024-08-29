// app/page.tsx
"use client"; // This marks the file as a Client Component

import { useEffect } from "react";
import Image from "next/image";
import { fileURLToPath } from "url";
import { url } from "inspector";

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
        url: 'food-truck.png', //path to foodtruck icon
        scaledSize: new window.google.maps.Size(50, 50),
        origin: new window.google.maps.Point(0, 0),
        anchor: new window.google.maps.Point(25, 50)
      };
    
      // Array of locations to mark on the map
      const locations = [
        { lat: 40.7128, lng: -74.0060, title: "New York", icon: truckIcon }, // New York
        { lat: 33.0147363, lng: -117.1219504, title: "Los Angeles", icon: truckIcon }, // Los Angeles
        { lat: 20.5937, lng: 78.9629, title: "India", icon: truckIcon }, // India
        { lat: 29.7604, lng: -95.3698, title: "Houston", icon: truckIcon }, // Houston
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
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Welcome To TruckTrack&nbsp;
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:size-auto lg:bg-none">
        </div>
      </div>
      <div id="map" style={{ height: "1000px", width: "100%" }}></div>
    </main>
  );
}
