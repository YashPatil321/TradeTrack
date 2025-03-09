"use client";

declare global {
  interface Window {
    initMap: () => void;
  }
}
/// <reference types="@types/google.maps" />

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TruckSchedule {
  lat: number;
  lng: number;
  address: string;
}
interface Truck {
  name: string;
  description: string;
  image: string;
  hours: string;
  cuisine: string;
  restrictions?: string[];
  mealTimes?: string[];
  mainLocation: string;
  schedule: { address: string; lat: number; lng: number }[];
}
export default function Locator() {
  const [locations, setLocations] = useState<Truck[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState("");


  // Fetch trucks from localStorage
  useEffect(() => {
    const storedTrucks = localStorage.getItem("trucks");
    if (storedTrucks) {
      setLocations(JSON.parse(storedTrucks));
    }
  }, []); // ✅ No dependency, so it runs only once when page loads
  

  // Initialize Google Maps
  // Initialize Google Maps
useEffect(() => {
  if (!locations || locations.length === 0) return; // Only run if there are trucks

  // Define initMap so that Google Maps can call it after the script loads
  window.initMap = function () {
    const mapElement = document.getElementById("map") as HTMLElement | null;
    if (!mapElement) return;

    // Initialize the map
    const map = new window.google.maps.Map(mapElement, {
      zoom: 4,
      center: { lat: 39.8283, lng: -98.5795 },
    });

    // Loop through each truck and add markers
    locations.forEach((truck) => {
      if (Array.isArray(truck.schedule)) {
        truck.schedule.forEach((slot) => {
          // Only add marker if slot.lat and slot.lng are valid numbers
          if (typeof slot.lat === "number" && typeof slot.lng === "number") {
            const marker = new window.google.maps.Marker({
              position: { lat: slot.lat, lng: slot.lng },
              map,
              title: truck.name,
              icon: {
                url: "food-truck.png", // Ensure this image is in your public folder
                scaledSize: new window.google.maps.Size(50, 50),
              },
            });

            // Create an info window for marker
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 10px; max-width: 200px; color: black;">
                  <img src="${truck.image}" alt="${truck.name}" style="width: 100px; height: auto;" />
                  <h3>${truck.name}</h3>
                  <p>Current Location: ${slot.address}</p>
                </div>
              `,
            });

            // Open info window on mouseover and close on mouseout
            marker.addListener("mouseover", () => infoWindow.open(map, marker));
            marker.addListener("mouseout", () => infoWindow.close());

            // Show modal on marker click
            marker.addListener("click", () => {
              setSelectedTruck(truck);
              setIsModalOpen(true);
            });
          } else {
            console.warn(`Skipping invalid marker for truck "${truck.name}"`, slot);
          }
        });
      }
    });
  };

  // Create and load the Google Maps script with callback
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyD9AQtE_WlHC0RvWvZ8BoP2ypr3EByvRDs&callback=initMap`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);

  // Clean up the script when the component unmounts
  return () => {
    document.head.removeChild(script);
  };
}, [locations]);


  // Search near me functionality
  const searchNearMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const mapElement = document.getElementById("map") as HTMLElement | null;
          if (!mapElement) return;
  
          // Create a new map centered at the user's location
          const map = new window.google.maps.Map(mapElement, {
            zoom: 12,
            center: { lat: latitude, lng: longitude },
          });
  
          // Loop through each truck and add markers
          locations.forEach((truck) => {
            if (Array.isArray(truck.schedule)) {
              truck.schedule.forEach((slot) => {
                // Only add marker if lat/lng are valid numbers
                if (
                  typeof slot.lat === "number" &&
                  typeof slot.lng === "number" &&
                  !isNaN(slot.lat) &&
                  !isNaN(slot.lng) &&
                  slot.lat !== 0 &&
                  slot.lng !== 0 &&
                  slot.lat !== null &&
                  slot.lng !== null
                ) {
                  const marker = new window.google.maps.Marker({
                    position: { lat: slot.lat, lng: slot.lng },
                    map,
                    title: truck.name,
                    icon: {
                      url: "food-truck.png", // Ensure this image exists in your public folder
                      scaledSize: new window.google.maps.Size(50, 50),
                    },
                  });
  
                  const infoWindow = new window.google.maps.InfoWindow({
                    content: `
                      <div style="padding: 10px; max-width: 200px; color: black;">
                        <img src="${truck.image}" alt="${truck.name}" style="width: 100px; height: auto;" />
                        <h3>${truck.name}</h3>
                        <p>Current Location: ${slot.address}</p>
                      </div>
                    `,
                  });
  
                  marker.addListener("mouseover", () => infoWindow.open(map, marker));
                  marker.addListener("mouseout", () => infoWindow.close());
                  marker.addListener("click", () => {
                    setSelectedTruck(truck);
                    setIsModalOpen(true);
                  });
                } else {
                  console.warn(`Skipping invalid marker for truck: ${truck.name}`, slot);
                }
              });
            }
          });
        },
        (error) => {
          console.error("Error getting geolocation:", error);
          alert("Error getting your location.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };
  

  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTruck(null);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-black text-white p-4 z-50 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-xl font-bold">TradeTrack</div>
          <ul className="flex space-x-4">
            <li>
              <Link href="/" legacyBehavior>
                <a className="hover:text-gray-300">Locator</a>
              </Link>
            </li>
            <li>
              <Link href="/about" legacyBehavior>
                <a className="hover:text-gray-300">About</a>
              </Link>
            </li>
            <li>
              <Link href="/list_your_service" legacyBehavior>
                <a className="hover:text-gray-300">List Your Trade</a>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      <div
        className="p-3 w-full mt-16" // changed from mt-16 to mt-12
        style={{ backgroundColor: "#f5d9bc" }}
        >
        <div className="container mx-auto flex flex-wrap items-center justify-between">
          {/* Hardcoded Trade Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTrade("")}
              className={`px-4 py-2 rounded text-sm ${
                selectedTrade === ""
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black hover:bg-gray-300"
              }`}
            >
              All Trades
            </button>
            <button
              onClick={() => setSelectedTrade("food_truck")}
              className={`px-4 py-2 rounded text-sm ${
                selectedTrade === "food_truck"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black hover:bg-gray-300"
              }`}
            >
              Food Truck
            </button>
            <button
              onClick={() => setSelectedTrade("plumber")}
              className={`px-4 py-2 rounded text-sm ${
                selectedTrade === "plumber"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black hover:bg-gray-300"
              }`}
            >
              Plumber
            </button>
            <button
              onClick={() => setSelectedTrade("electrician")}
              className={`px-4 py-2 rounded text-sm ${
                selectedTrade === "electrician"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black hover:bg-gray-300"
              }`}
            >
              Electrician
            </button>
            <button
              onClick={() => setSelectedTrade("cleaner")}
              className={`px-4 py-2 rounded text-sm ${
                selectedTrade === "cleaner"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black hover:bg-gray-300"
              }`}
            >
              Cleaner
            </button>
            <button
              onClick={() => setSelectedTrade("carpenter")}
              className={`px-4 py-2 rounded text-sm ${
                selectedTrade === "carpenter"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black hover:bg-gray-300"
              }`}
            >
              Carpenter
            </button>
          </div>

          {/* Search Near Me Button */}
          <button
            onClick={searchNearMe}
            className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600"
          >
            Search Near Me
          </button>
        </div>
      </div>
      
      <main
  className="flex min-h-screen flex-col items-center justify-between p-0"
  style={{ backgroundColor: '#f5d9bc' }}
>
  <div id="map" style={{ height: '1200px', width: '120%' }}></div>

  {isModalOpen && selectedTruck && (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={closeModal}
    >
      <div
        className="bg-white p-6 rounded-lg max-w-xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Truck Name */}
        <h2 className="text-2xl font-bold mb-4 text-black">
          {selectedTruck.name}
        </h2>

        {/* Truck Image (only if provided) */}
        {selectedTruck.image && (
          <img
            src={selectedTruck.image}
            alt={selectedTruck.name}
            className="w-full h-auto mb-4"
          />
        )}

        {/* Basic Details */}
        <p className="text-black mb-2">
          <strong>Description:</strong> {selectedTruck.description}
        </p>
        <p className="text-black mb-2">
          <strong>Hours:</strong> {selectedTruck.hours}
        </p>
        <p className="text-black mb-2">
          <strong>Cuisine:</strong> {selectedTruck.cuisine}
        </p>
        <p className="text-black mb-2">
          <strong>Dietary Restrictions:</strong>{" "}
          {selectedTruck.restrictions && selectedTruck.restrictions.length > 0
            ? selectedTruck.restrictions.join(", ")
            : "None"}
        </p>
        <p className="text-black mb-2">
          <strong>Meal Times:</strong>{" "}
          {selectedTruck.mealTimes && selectedTruck.mealTimes.length > 0
            ? selectedTruck.mealTimes.join(", ")
            : "Not specified"}
        </p>

        {/* Location Section */}
        <div className="flex flex-col md:flex-row md:space-x-4 mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-black">Main Location</h3>
            <p className="text-black">
              {selectedTruck.mainLocation
                ? selectedTruck.mainLocation
                : (selectedTruck.schedule && selectedTruck.schedule[0]?.address) || "Not specified"}
            </p>
          </div>
          {/* Removed Home Location section as it does not exist in Truck interface */}
        </div>

        {/* Weekly Schedule Section */}
        <div className="mt-4">
          <h3 className="text-xl font-bold text-black mb-2">
            Weekly Schedule for {selectedTruck.name} for this week
          </h3>
          <ul className="space-y-2">
            {selectedTruck.schedule && selectedTruck.schedule.map((slot: any, index: number) => (
              <li key={index} className="text-black border-b pb-2">
                <p><strong>Day:</strong> {slot.day}</p>
                <p><strong>Time:</strong> {slot.time}</p>
                <p><strong>Address:</strong> {slot.address}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Close Button */}
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
          onClick={closeModal}
        >
          Close
        </button>
      </div>
    </div>
  )}
</main>

    </>
  );
}