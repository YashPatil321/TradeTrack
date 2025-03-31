"use client";

declare global {
  interface Window {
    initMap: () => void;
  }
}
/// <reference types="@types/google.maps" />

import { useEffect, useState } from "react";
import Link from "next/link";

// Unified interfaces for service data.
interface ServiceSchedule {
  day: string;
  time: string;
  address: string;
  lat: number;
  lng: number;
}

interface Service {
  name: string;
  description: string;
  image: string;
  hours: string;
  cuisine?: string;
  restrictions?: string[];
  mealTimes?: string[];
  certifications?: string;    // for plumber
  cleaningType?: string;      // for cleaner
  license?: string;           // for electrician
  mainLocation: string;
  schedule: ServiceSchedule[];
  trade: "truck" | "plumber" | "electrician" | "cleaning";
}

export default function Locator() {
  const [locations, setLocations] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState("");
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // Merge service data from multiple localStorage keys.
  useEffect(() => {
    const trucks = JSON.parse(localStorage.getItem("trucks") || "[]");
    const plumbers = JSON.parse(localStorage.getItem("plumbers") || "[]");
    const electricians = JSON.parse(localStorage.getItem("electricians") || "[]");
    const cleaners = JSON.parse(localStorage.getItem("cleanings") || "[]");
    setLocations([...trucks, ...plumbers, ...electricians, ...cleaners]);
  }, []);

  // Load Google Maps script and initialize the map (once).
  useEffect(() => {
    const initMap = () => {
      const mapElement = document.getElementById("map") as HTMLElement;
      if (!mapElement) return;
      const newMap = new window.google.maps.Map(mapElement, {
        zoom: 4,
        center: { lat: 39.8283, lng: -98.5795 },
      });
      setMap(newMap);
    };

    if (!window.google || !window.google.maps) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
      return () => {
        document.head.removeChild(script);
      };
    } else {
      initMap();
    }
  }, []);

  // Update markers whenever map, locations, or selectedTrade changes.
  useEffect(() => {
    if (!map) return;
    // Clear existing markers.
    markers.forEach((marker) => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];

    // Helper function: create marker for a service schedule slot with an icon.
    const createMarker = (service: Service, slot: ServiceSchedule, iconUrl: string) => {
      const marker = new window.google.maps.Marker({
        position: { lat: slot.lat, lng: slot.lng },
        map,
        title: service.name,
        icon: {
          url: iconUrl,
          scaledSize: new window.google.maps.Size(50, 50),
        },
      });
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding:10px; max-width:200px; color:black;">
            <img src="${service.image}" alt="${service.name}" style="width:100px; height:auto;" />
            <h3>${service.name}</h3>
            <p>Location: ${slot.address}</p>
          </div>
        `,
      });
      marker.addListener("mouseover", () => infoWindow.open(map, marker));
      marker.addListener("mouseout", () => infoWindow.close());
      marker.addListener("click", () => {
        setSelectedService(service);
        setIsModalOpen(true);
      });
      newMarkers.push(marker);
    };

    // Loop through each service and add markers.
    locations.forEach((service) => {
      // If a trade filter is active, only add markers for matching services.
      if (selectedTrade && service.trade !== selectedTrade) return;
      if (Array.isArray(service.schedule)) {
        service.schedule.forEach((slot) => {
          if (
            typeof slot.lat === "number" &&
            typeof slot.lng === "number" &&
            slot.lat !== 0 &&
            slot.lng !== 0
          ) {
            let iconUrl = "";
            switch (service.trade) {
              case "plumber":
                iconUrl = "/plumber.png";
                break;
              case "electrician":
                iconUrl = "/electrician.png";
                break;
              case "cleaning":
                iconUrl = "/electrician.png";
                break;
              case "truck":
                iconUrl = "/plumber.jpeg";
                break;
            }
            createMarker(service, slot, iconUrl);
          } else {
            console.warn(`Skipping invalid marker for ${service.name}`, slot);
          }
        });
      }
    });
    setMarkers(newMarkers);
  }, [map, locations, selectedTrade]);

  // "Search Near Me" functionality: recenter map on user's location.
  const searchNearMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (!map) return;
          map.setCenter({ lat: latitude, lng: longitude });
          map.setZoom(12);
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

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  return (
    <>
      {/* Fixed Nav Bar */}
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

      {/* Second Menu Bar */}
      <div className="p-3 w-full mt-16" style={{ backgroundColor: "#f5d9bc" }}>
        <div className="container mx-auto flex flex-wrap items-center justify-between">
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
          </div>
          <button
            onClick={searchNearMe}
            className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600"
          >
            Search Near Me
          </button>
        </div>
      </div>

      {/* Map Section */}
      <main
        className="flex min-h-screen flex-col items-center justify-between p-0"
        style={{ backgroundColor: "#f5d9bc" }}
      >
        <div id="map" style={{ height: "1200px", width: "120%" }}></div>

        {isModalOpen && selectedService && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeModal}
          >
            <div
              className="bg-white p-6 rounded-lg max-w-xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4 text-black">
                {selectedService.name}
              </h2>
              {selectedService.image && (
                <img
                  src={selectedService.image}
                  alt={selectedService.name}
                  className="w-full h-auto mb-4"
                />
              )}
              <p className="text-black mb-2">
                <strong>Description:</strong> {selectedService.description}
              </p>
              <p className="text-black mb-2">
                <strong>Hours:</strong> {selectedService.hours}
              </p>
              {selectedService.trade === "truck" && (
                <>
                  <p className="text-black mb-2">
                    <strong>Cuisine:</strong> {selectedService.cuisine}
                  </p>
                  <p className="text-black mb-2">
                    <strong>Dietary Restrictions:</strong>{" "}
                    {selectedService.restrictions && selectedService.restrictions.length > 0
                      ? selectedService.restrictions.join(", ")
                      : "None"}
                  </p>
                  <p className="text-black mb-2">
                    <strong>Meal Times:</strong>{" "}
                    {selectedService.mealTimes && selectedService.mealTimes.length > 0
                      ? selectedService.mealTimes.join(", ")
                      : "Not specified"}
                  </p>
                </>
              )}
              {selectedService.trade === "plumber" && (
                <p className="text-black mb-2">
                  <strong>Certifications:</strong>{" "}
                  {selectedService.certifications || "Not specified"}
                </p>
              )}
              {selectedService.trade === "electrician" && (
                <p className="text-black mb-2">
                  <strong>License:</strong> {selectedService.license || "Not specified"}
                </p>
              )}
              {selectedService.trade === "cleaning" && (
                <p className="text-black mb-2">
                  <strong>Cleaning Type:</strong> {selectedService.cleaningType || "Not specified"}
                </p>
              )}
              <div className="flex flex-col md:flex-row md:space-x-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-black">Main Location</h3>
                  <p className="text-black">
                    {selectedService.mainLocation
                      ? selectedService.mainLocation
                      : (selectedService.schedule && selectedService.schedule[0]?.address) || "Not specified"}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold text-black mb-2">
                  Weekly Schedule for {selectedService.name} for this week
                </h3>
                <ul className="space-y-2">
                  {selectedService.schedule &&
                    selectedService.schedule.map((slot, index: number) => (
                      <li key={index} className="text-black border-b pb-2">
                        <p>
                          <strong>Day:</strong> {slot.day}
                        </p>
                        <p>
                          <strong>Time:</strong> {slot.time}
                        </p>
                        <p>
                          <strong>Address:</strong> {slot.address}
                        </p>
                      </li>
                    ))}
                </ul>
              </div>
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
