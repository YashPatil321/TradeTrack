"use client";

declare global {
  interface Window {
    initMap: () => void;
  }
}
/// <reference types="@types/google.maps" />

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, SessionProvider } from "next-auth/react";
import Link from "next/link";
import ListYourTradeButton from "../components/ListYourTradeButton";
import NewBookingModal from "@/components/NewBookingModal";
import Image from 'next/image';

interface ServiceSchedule {
  day: string;
  time: string;
  address: string;
  lat: number;
  lng: number;
}

interface PointLocation {
  type: "Point";
  coordinates: number[];
}

interface Service {
  _id?: string;
  name: string;
  description: string;
  image: string;
  hours: string;
  cuisine?: string;
  restrictions?: string[];
  mealTimes?: string[];
  certifications?: string;     // for plumber
  license?: string;            // for electrician
  skillsAndServices?: string;  // for handyman
  specialties?: string;        // for painter
  mainLocation: string;
  schedule?: ServiceSchedule[];
  trade: "food_truck" | "plumber" | "electrician" | "handyman" | "painter";
  userEmail: string;
  price?: number;
  priceType?: string;
  stripeAccountId?: string;
  location?: PointLocation;    // GeoJSON location for handyman/static services
  estimatedTime?: string;      // Estimated time for service completion
  phoneNumber?: string;        // Added for contact information
  services?: Array<{           // Individual services offered by handyman
    service: string;
    category?: string;
    rate: number;
    timeLimit: string;
    description?: string;
    materials?: Array<{name: string, price: number}>;
  }>
}

function Locator() {
  const router = useRouter();
  const { data: session } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState("");
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // Fetch services from your backend API
  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch("/api/services");
        const json = await res.json();
        if (json.success) {
          setServices(json.data);
        } else {
          console.error("Error fetching services:", json.error);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    }
    fetchServices();
  }, []);

  // Load Google Maps script and initialize the map
  useEffect(() => {
    const initMap = () => {
      const mapElement = document.getElementById("map") as HTMLElement;
      if (!mapElement) return;
      
      // Create map with initial options
      const newMap = new window.google.maps.Map(mapElement, {
        zoom: 4,
        center: { lat: 39.8283, lng: -98.5795 },
        disableDefaultUI: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });
      
      // Add zoom control
      newMap.setOptions({
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER
        }
      });
      
      setMap(newMap);
    };

    // Check if script is already loaded
    if (window.google && window.google.maps) {
      initMap();
    } else {
      // Load Google Maps script
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.body.appendChild(script);
    }
  }, []);

  // Create markers for services
  useEffect(() => {
    if (!map || !services.length) return;

    console.log("Creating markers with selected trade:", selectedTrade);
    console.log("Total services:", services.length);

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    
    const newMarkers: google.maps.Marker[] = [];
    let filteredCount = 0;

    const createMarker = (service: Service, location: { lat: number; lng: number; address: string }, iconUrl: string, iconSize: google.maps.Size) => {
      const marker = new window.google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        icon: {
          url: iconUrl,
          scaledSize: iconSize
        },
        title: service.name,
        optimized: true,
        animation: window.google.maps.Animation.DROP
      });

      marker.addListener("click", () => {
        setSelectedService(service);
        setIsModalOpen(true);
      });
      newMarkers.push(marker);
    };

    // Create markers in batches to prevent flickering
    const batchSize = 50;
    for (let i = 0; i < services.length; i += batchSize) {
      const batch = services.slice(i, i + batchSize);
      
      batch.forEach((service) => {
        if (selectedTrade && service.trade !== selectedTrade) return;
        filteredCount++;
        
        let iconUrl = "";
        let iconSize = new window.google.maps.Size(30, 30); // Default size for most icons
        
        switch (service.trade) {
          case "plumber":
            iconUrl = "/plumber.png";
            break;
          case "electrician":
            iconUrl = "/electrician.png";
            break;
          case "handyman":
            iconUrl = "/handyman.png";
            iconSize = new window.google.maps.Size(48, 48); // Increased from 36x36 to 48x48
            break;
          case "painter":
            iconUrl = "/painter.png";
            break;
          case "food_truck":
            iconUrl = "/truck.png";
            break;
          default:
            iconUrl = "/default.png";
        }
        
        if (service.location && service.location.type === "Point" && Array.isArray(service.location.coordinates)) {
          const lng = service.location.coordinates[0];
          const lat = service.location.coordinates[1];
          
          if (typeof lat === "number" && typeof lng === "number" && lat !== 0 && lng !== 0) {
            const locationObj = {
              lat,
              lng,
              address: service.mainLocation
            };
            createMarker(service, locationObj, iconUrl, iconSize);
          }
        }
        else if (Array.isArray(service.schedule)) {
          service.schedule.forEach((slot) => {
            if (
              typeof slot.lat === "number" &&
              typeof slot.lng === "number" &&
              slot.lat !== 0 &&
              slot.lng !== 0
            ) {
              const locationObj = {
                lat: slot.lat,
                lng: slot.lng,
                address: slot.address
              };
              createMarker(service, locationObj, iconUrl, iconSize);
            }
          });
        }
      });
      
      // Process the batch
      newMarkers.forEach(marker => marker.setMap(map));
      
      // Wait a bit before processing next batch
      if (i + batchSize < services.length) {
        setTimeout(() => {}, 100);
      }
    }
    
    console.log("Filtered services displayed:", filteredCount);
    
    setMarkers(newMarkers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, services, selectedTrade]); // Intentionally excluding markers to avoid infinite loop

  // "Search Near Me" functionality: recenter map on user's location
  const searchNearMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (!map) return;
          map.setCenter({ lat: latitude, lng: longitude });
          map.setZoom(11);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Error getting your location. Please try again.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <>
      {/* Black Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-black text-white shadow-md">
        <div className="container mx-auto flex justify-between items-center p-2">
          <h1 className="text-xl font-bold">TradeTrack</h1>
          <div className="flex items-center space-x-4">
            <Link href="/" legacyBehavior>
              <a className="text-white hover:text-gray-300">Locator</a>
            </Link>
            <Link href="/about" legacyBehavior>
              <a className="text-white hover:text-gray-300">About</a>
            </Link>
            {session ? (
              <Link href="/profile" legacyBehavior>
                <a className="text-white hover:text-gray-300 text-sm">
                  Welcome, <span className="text-blue-400">{session.user?.name || session.user?.email?.split('@')[0] || 'tradetrack'}</span>!
                </a>
              </Link>
            ) : (
              <Link href="/profile" legacyBehavior>
                <a className="text-white hover:text-gray-300">Login</a>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Filter Buttons */}
      <div className="fixed top-10 left-0 right-0 z-10 bg-transparent pt-4">
        <div className="container mx-auto flex flex-wrap justify-between items-center">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedTrade("")}
              className={`px-4 py-2 rounded text-sm ${
                selectedTrade === ""
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black hover:bg-gray-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedTrade("food_truck")}
              className={`px-4 py-2 rounded text-sm ${
                selectedTrade === "food_truck"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black hover:bg-gray-300"
              }`}
            >
              Food Trucks
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
              onClick={() => setSelectedTrade("handyman")}
              className={`px-4 py-2 rounded text-sm ${
                selectedTrade === "handyman"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black hover:bg-gray-300"
              }`}
            >
              Handyman
            </button>
            <button
              onClick={() => setSelectedTrade("painter")}
              className={`px-4 py-2 rounded text-sm ${
                selectedTrade === "painter"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black hover:bg-gray-300"
              }`}
            >
              Painter
            </button>
          </div>
          <button
            onClick={searchNearMe}
            className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 mt-2 sm:mt-0"
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

        {/* Service Modal */}
        {isModalOpen && selectedService && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="bg-white rounded-lg p-8 max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedService.name}</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                  type="button"
                >
                  ✕
                </button>
              </div>

              {selectedService && (
                <div className="relative w-full h-48 mb-4">
                  <Image
                    src={selectedService.image || '/default-service.jpg'}
                    alt={selectedService.name}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Description</h3>
                <p className="text-gray-900">{selectedService.description}</p>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Details</h3>
                <ul className="text-gray-900">
                  <li className="mb-1 text-gray-900">
                    <strong>Type:</strong> {selectedService.trade === "food_truck" ? "Food Truck" : selectedService.trade.charAt(0).toUpperCase() + selectedService.trade.slice(1)}
                  </li>
                  <li className="mb-1 text-gray-900">
                    <strong>Location:</strong> {selectedService.mainLocation}
                  </li>
                  <li className="mb-1 text-gray-900">
                    <strong>Hours:</strong> {selectedService.hours}
                  </li>
                  {selectedService.trade === "handyman" && (
                    <>
                      {/* Removed the redundant services line that was showing skillsAndServices */}
                      <li className="mb-1 text-gray-900">
                        <strong>Services:</strong> 
                        {selectedService.services && selectedService.services.length > 0 ? (
                          <ul className="ml-4 list-disc">
                            {selectedService.services.map((s: any, idx: number) => (
                              <li key={idx} className="text-black">
                                {s.service} - ${s.rate} flat rate ({s.timeLimit})
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span>General handyman services</span>
                        )}
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className="mt-6 flex justify-center space-x-4">
                {selectedService.trade === "handyman" ? (
                  session ? (
                    <>
                      <button
                        onClick={() => {
                          setIsBookingModalOpen(true);
                          setIsModalOpen(false);
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition cursor-pointer"
                        type="button"
                      >
                        Book Service
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => router.push("/login")}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition cursor-pointer"
                      type="button"
                    >
                      Login to Book
                    </button>
                  )
                ) : (
                  selectedService.trade === "food_truck" && (
                    <a
                      href={`tel:${selectedService.phoneNumber || "555-123-4567"}`}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                    >
                      Call to Order
                    </a>
                  )
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Booking Modal */}
        {isBookingModalOpen && selectedService && (
          <NewBookingModal
            service={selectedService}
            isOpen={isBookingModalOpen}
            onCloseAction={() => setIsBookingModalOpen(false)}
          />
        )}
      </main>
    </>
  );
}

export default function HomePage() {
  return (
    <SessionProvider>
      <Locator />
    </SessionProvider>
  );
}