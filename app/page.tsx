"use client";

declare global {
  interface Window {
    initMap: () => void;
  }
}
/// <reference types="@types/google.maps" />


import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, SessionProvider, signIn } from "next-auth/react";
import Link from "next/link";
import NewBookingModal from "@/components/NewBookingModal";
import Image from 'next/image';
import { motion, AnimatePresence } from "framer-motion";

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

// Define service categories and their specific services with detailed descriptions and pricing
const serviceCategories = [
  {
    id: "handyman",
    name: "Handyman Services",
    icon: "🔨",
    color: "#f6ad55",
    services: [
      {
        name: "15AMP Wall Outlet Upgrade Package",
        description: "Complete upgrade of 10 wall outlets to modern 15AMP duplex with USB-A and USB-C ports. White outlets provided and installed professionally",
        price: "$500",
        timeEstimate: "4 hours"
      },
      {
        name: "Kitchen Faucet Replacement",
        description: "Professional kitchen faucet installation and old faucet removal. Customer provides new faucet, we handle all plumbing connections",
        price: "$300",
        timeEstimate: "3 hours"
      },
      {
        name: "Angle Valve Replacement Service",
        description: "Complete hot and cold angle valve replacement for kitchen sink plus two bathroom vanities. All valves and fittings included",
        price: "$500",
        timeEstimate: "3 hours"
      },
      {
        name: "Drywall Patch, Texture & Paint",
        description: "Professional repair of 3 drywall patches including texture matching and paint touch-up for seamless wall restoration",
        price: "$500",
        timeEstimate: "3 hours"
      },
      {
        name: "Complete Toilet Replacement",
        description: "Full toilet replacement service including Home Depot pickup and old toilet disposal. Customer provides new toilet model",
        price: "$300",
        timeEstimate: "3 hours"
      },
      {
        name: "Room LED Lighting with Channel",
        description: "Premium LED strip lighting installation in ceiling channels for gaming rooms, kids rooms, or offices. Professional channel mounting included",
        price: "$700",
        timeEstimate: "6 hours"
      },
      {
        name: "Room LED Lighting (No Channel)",
        description: "LED strip lighting installation for gaming rooms, kids rooms, or offices. Direct ceiling mounting without channel system",
        price: "$300",
        timeEstimate: "4 hours"
      },
      {
        name: "House Lock Change Service",
        description: "Professional lock and door knob replacement for up to 10 doors including closets and bathrooms. Customer provides locks",
        price: "$500",
        timeEstimate: "5 hours"
      }
    ]
  },
  {
    id: "plumbing",
    name: "Plumbing",
    icon: "🔧",
    color: "#4299e1",
    services: [
      {
        name: "Faucet Repair & Replacement",
        description: "Complete faucet repair including cartridge replacement, seal fixes, and full faucet installation for kitchen and bathroom sinks",
        price: "$85",
        timeEstimate: "2 hours"
      },
      {
        name: "Toilet Repair & Installation",
        description: "Toilet troubleshooting, flapper replacement, fill valve repair, complete toilet removal and installation with wax ring",
        price: "$120",
        timeEstimate: "3 hours"
      },
      {
        name: "Drain Cleaning & Unclogging",
        description: "Professional drain cleaning using snakes and hydro-jetting for kitchen sinks, bathroom drains, and main sewer lines",
        price: "$95",
        timeEstimate: "2 hours"
      },
      {
        name: "Pipe Leak Detection & Repair",
        description: "Advanced leak detection using specialized equipment, pipe patching, joint repair, and emergency leak stopping",
        price: "$110",
        timeEstimate: "3 hours"
      },
      {
        name: "Water Heater Service",
        description: "Water heater maintenance, thermostat replacement, heating element repair, and complete tank or tankless installation",
        price: "$150",
        timeEstimate: "4 hours"
      },
      {
        name: "Garbage Disposal Installation",
        description: "Complete garbage disposal removal and installation including electrical connections, plumbing hookup, and testing",
        price: "$130",
        timeEstimate: "3 hours"
      }
    ]
  },
  {
    id: "electrician",
    name: "Electrician Services",
    icon: "⚡",
    color: "#f6e05e",
    services: [
      {
        name: "Outlet Installation & Repair",
        description: "Installation of new electrical outlets, GFCI outlets, USB outlets, and repair of faulty or damaged electrical receptacles",
        price: "$95",
        timeEstimate: "1 hour"
      },
      {
        name: "Light Switch Installation",
        description: "Installation and replacement of standard switches, dimmer switches, smart switches, and three-way switch configurations",
        price: "$85",
        timeEstimate: "1 hour"
      },
      {
        name: "Ceiling Fan Installation",
        description: "Complete ceiling fan installation including electrical connections, mounting, balancing, and remote control setup",
        price: "$120",
        timeEstimate: "3 hours"
      },
      {
        name: "Light Fixture Replacement",
        description: "Installation of chandeliers, pendant lights, recessed lighting, wall sconces, and outdoor security lighting",
        price: "$100",
        timeEstimate: "1 hour"
      },
      {
        name: "Circuit Breaker Repair",
        description: "Troubleshooting electrical panel issues, circuit breaker replacement, and electrical safety inspections",
        price: "$130",
        timeEstimate: "2 hours"
      },
      {
        name: "Electrical Wiring Repair",
        description: "Repair of damaged wiring, wire splicing, electrical code compliance updates, and safety hazard elimination",
        price: "$110",
        timeEstimate: "3 hours"
      },
      {
        name: "Smart Home Device Installation",
        description: "Installation of smart thermostats, smart doorbells, security cameras, and home automation electrical components",
        price: "$140",
        timeEstimate: "2 hours"
      }
    ]
  },
  {
    id: "painting",
    name: "Painting Services",
    icon: "🎨",
    color: "#9ae6b4",
    services: [
      {
        name: "Interior Room Painting",
        description: "Complete interior room painting including wall preparation, primer application, two coats of premium paint, and trim work",
        price: "$180",
        timeEstimate: "5 hours"
      },
      {
        name: "Exterior House Painting",
        description: "Professional exterior painting with pressure washing, surface prep, weather-resistant paint, and protective coating application",
        price: "$220",
        timeEstimate: "7 hours"
      },
      {
        name: "Cabinet Painting & Refinishing",
        description: "Kitchen and bathroom cabinet refinishing with sanding, priming, spray painting, and new hardware installation",
        price: "$160",
        timeEstimate: "6 hours"
      },
      {
        name: "Deck & Fence Staining",
        description: "Deck and fence restoration with power washing, wood conditioning, stain application, and weatherproof sealing",
        price: "$140",
        timeEstimate: "5 hours"
      },
      {
        name: "Accent Wall & Feature Painting",
        description: "Specialty accent wall painting, textured finishes, color consultation, and decorative painting techniques",
        price: "$120",
        timeEstimate: "3 hours"
      },
      {
        name: "Ceiling Painting",
        description: "Professional ceiling painting with proper equipment, stain blocking primer, and smooth finish application",
        price: "$100",
        timeEstimate: "2 hours"
      },
      {
        name: "Touch-Up & Repair Painting",
        description: "Paint touch-ups, nail hole filling, minor wall repairs, and color matching for seamless wall restoration",
        price: "$80",
        timeEstimate: "1 hour"
      }
    ]
  }
];

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
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Selection state for the two-step process
  const [selectionStep, setSelectionStep] = useState<"category" | "service" | "map">("category");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSpecificService, setSelectedSpecificService] = useState<string | null>(null);
  const [mapDimmed, setMapDimmed] = useState(true);

  // Handle reopening booking modal after login - simplified approach
  useEffect(() => {
    // Check if there's a stored service selection for booking
    const selectedServiceForBooking = sessionStorage.getItem('selectedServiceForBooking');
    if (selectedServiceForBooking && services.length > 0) {
      // Find the service by the stored service type
      const service = services.find(s => 
        s.trade === 'handyman' || s.trade === 'plumber' || s.trade === 'electrician' || s.trade === 'painter'
      );
      if (service) {
        setSelectedService(service);
        setSelectedSpecificService(selectedServiceForBooking);
        setIsBookingModalOpen(true);
        // Clear the stored selection
        sessionStorage.removeItem('selectedServiceForBooking');
      }
    }
  }, [services]);

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
      
      // Auto-zoom to user's current location within 25 miles
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const userLocation = { lat: latitude, lng: longitude };
            
            // Set map center to user's location and zoom to show 25-mile radius
            newMap.setCenter(userLocation);
            // Zoom level 10 shows approximately 25-mile radius more accurately
            newMap.setZoom(10);
            
            // Add a 20-mile radius circle around the client's location
            const clientServiceArea = new window.google.maps.Circle({
              strokeColor: '#4F46E5',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: '#4F46E5',
              fillOpacity: 0.15,
              map: newMap,
              center: userLocation,
              radius: 32186.88 // 20 miles in meters
            });
          },
          (error) => {
            console.log('Geolocation error, using default center:', error);
            // Keep default center if geolocation fails
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      }
      
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

  // Create markers for services based on selected trade
  useEffect(() => {
    if (!map || !services.length) return;

    console.log("Creating markers with selected trade:", selectedTrade);
    console.log("Total services:", services.length);

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    const newMarkers: google.maps.Marker[] = [];

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

      // Note: Service area circle is now shown around client location instead of each provider

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
        
        let iconUrl = "";
        let iconSize = new window.google.maps.Size(45, 45); // Larger default size for better visibility
        
        switch (service.trade) {
          case "plumber":
            iconUrl = "/plumber.png";
            break;
          case "electrician":
            iconUrl = "/electrician.png";
            break;
          case "handyman":
            iconUrl = "/handyman.png";
            iconSize = new window.google.maps.Size(45, 45); // Consistent larger size for handyman
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
    
    setMarkers(newMarkers);
  }, [map, services, selectedTrade, selectionStep]);

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectionStep("service");
    
    // Map trade ID to the corresponding trade value
    const tradeMap: Record<string, string> = {
      "plumbing": "plumber",
      "handyman": "handyman",
      "electrician": "electrician",
      "painting": "painter"
    };
    
    setSelectedTrade(tradeMap[categoryId] || "");
  };

  // Handle specific service selection - updated for new service structure
  const handleSpecificServiceSelect = (service: any) => {
    // Create precise mapping from service names to booking modal IDs
    const serviceNameToIdMap: { [key: string]: string } = {
      // Handyman services
      '15AMP Wall Outlet Upgrade Package': 'outlet-upgrade-package',
      'Kitchen Faucet Replacement': 'kitchen-faucet-replacement',
      'Angle Valve Replacement Service': 'angle-valve-replacement',
      'Drywall Patch, Texture & Paint': 'drywall-patch-paint',
      'Complete Toilet Replacement': 'toilet-replacement',
      'Room LED Lighting with Channel': 'led-lighting-with-channel',
      'Room LED Lighting (No Channel)': 'led-lighting-no-channel',
      'House Lock Change Service': 'house-lock-change',
      // Plumbing services
      'Faucet Repair & Replacement': 'faucet-repair',
      'Toilet Repair & Installation': 'toilet-repair',
      'Drain Cleaning & Unclogging': 'drain-cleaning',
      'Pipe Leak Detection & Repair': 'pipe-repair',
      'Water Heater Service': 'water-heater-service',
      // Electrical services
      'Light Fixture & Switch Installation': 'light-fixture',
      'Outlet Repair & Installation': 'outlet-repair',
      'Ceiling Fan Installation': 'ceiling-fan',
      'Electrical Panel Upgrades': 'panel-upgrade',
      'Wiring & Circuit Installation': 'wiring-installation',
      // Painting services
      'Interior Painting': 'interior-painting',
      'Exterior Painting': 'exterior-painting',
      'Cabinet & Furniture Painting': 'cabinet-painting',
      'Touch-up & Repair Painting': 'touch-up-painting',
      'Wallpaper Removal & Installation': 'wallpaper-service'
    };
    
    const serviceId = serviceNameToIdMap[service.name] || 'furniture-assembly';
    console.log('Selected service:', service.name, '-> ID:', serviceId); // Debug log
    setSelectedSpecificService(serviceId);
    setSelectionStep("map");
    setMapDimmed(false);
    
    // Search near user's location
    searchNearMe();
  };

  // Reset selection process
  const resetSelection = () => {
    setSelectedCategory(null);
    setSelectedSpecificService(null);
    setSelectionStep("category");
    setMapDimmed(true);
  };

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
          <Link href="/" legacyBehavior>
            <a className="text-xl font-bold text-white hover:text-gray-300 cursor-pointer">TradersTap</a>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/" legacyBehavior>
              <a className="text-white hover:text-gray-300">Locator</a>
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
      
      {/* Map Section with Overlay */}
      <main
        className="flex min-h-screen flex-col items-center justify-between p-0 relative"
        style={{ backgroundColor: "#f5d9bc" }}
      >
        {/* Map Container */}
        <div 
          id="map" 
          ref={mapRef}
          className="absolute inset-0 w-full h-full"
          style={{ height: "100vh", width: "100%" }}
        ></div>
        
        {/* Dimming Overlay */}
        {mapDimmed && (
          <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-500 z-10"></div>
        )}
        
        {/* Service Selection UI */}
        <div className="relative z-20 w-full h-full flex flex-col items-center justify-center px-4">
          {/* Category Selection Step */}
          <AnimatePresence mode="wait">
            {selectionStep === "category" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
                transition={{ duration: 0.5 }}
                className="bg-white bg-opacity-90 rounded-lg p-8 max-w-4xl w-full shadow-xl"
              >
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
                  What type of service are you looking for?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {serviceCategories.map((category) => {
                    const isHandyman = category.id === "handyman";
                    const isComingSoon = !isHandyman;
                    
                    return (
                      <motion.div
                        key={category.id}
                        whileHover={isHandyman ? { scale: 1.05, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" } : {}}
                        whileTap={isHandyman ? { scale: 0.95 } : {}}
                        onClick={isHandyman ? () => handleCategorySelect(category.id) : undefined}
                        className={`relative overflow-hidden rounded-lg shadow-md p-6 transition-all duration-300 text-center ${
                          isHandyman 
                            ? 'bg-white cursor-pointer hover:shadow-lg' 
                            : 'bg-gradient-to-br from-gray-50 to-gray-100 cursor-not-allowed'
                        }`}
                        style={{ borderTop: `4px solid ${category.color}` }}
                      >
                        {/* Coming Soon Badge */}
                        {isComingSoon && (
                          <div className="absolute top-3 right-3 z-10">
                            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12 animate-pulse">
                              Coming Soon
                            </div>
                          </div>
                        )}
                        
                        {/* Overlay for disabled categories */}
                        {isComingSoon && (
                          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-5"></div>
                        )}
                        
                        <div className="relative z-10">
                          <div className={`text-4xl mb-4 transition-all duration-300 ${
                            isComingSoon ? 'opacity-60 grayscale' : ''
                          }`}>
                            {category.icon}
                          </div>
                          <h3 className={`text-xl font-semibold transition-all duration-300 ${
                            isComingSoon ? 'text-gray-500' : 'text-gray-800'
                          }`}>
                            {category.name}
                          </h3>
                          
                          {/* Coming Soon Animation */}
                          {isComingSoon && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-400 font-medium mb-2">Available Soon</p>
                              <div className="flex justify-center">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
            
            {/* Specific Service Selection Step - Updated with detailed service cards */}
            {selectionStep === "service" && selectedCategory && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
                transition={{ duration: 0.4 }}
                className="bg-white bg-opacity-90 rounded-lg p-8 max-w-5xl w-full shadow-xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <button
                    onClick={resetSelection}
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back
                  </button>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {serviceCategories.find(c => c.id === selectedCategory)?.name}
                  </h2>
                  <div className="w-20"></div> {/* Spacer for alignment */}
                </div>
                
                <h3 className="text-xl text-center text-gray-700 mb-6">
                  What specific service do you need?
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-80 overflow-y-auto pr-2">
                  {serviceCategories
                    .find(c => c.id === selectedCategory)
                    ?.services.map((service, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSpecificServiceSelect(service)}
                        className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-all duration-300 border border-gray-200"
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="text-xl font-semibold text-gray-800">{service.name}</h4>
                          <span className="text-lg font-bold text-blue-600">{service.price}</span>
                        </div>
                        <p className="text-gray-600 my-3">{service.description}</p>
                        <div className="flex justify-between items-center mt-4 text-sm">
                          <span className="text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Est. {service.timeEstimate}
                          </span>
                          <span className="text-blue-600 font-medium">Select →</span>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </motion.div>
            )}
            
            {/* Map View Controls (when map is active) */}
            {selectionStep === "map" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-20 left-0 right-0 flex justify-center"
              >
                <div className="bg-white rounded-lg shadow-lg p-4 flex items-center space-x-4">
                  <div className="text-gray-800">
                    <span className="font-medium">Showing:</span> {selectedSpecificService} providers
                  </div>
                  <button
                    onClick={resetSelection}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                  >
                    Change Service
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Service Modal - Enhanced with more detailed information */}
        {isModalOpen && selectedService && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white z-10 p-4 sm:p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 pr-4">{selectedService.name}</h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-colors"
                    type="button"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-4 sm:p-6">
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

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-3 text-gray-900">Service Provider</h3>
                  <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg">{selectedService.description}</p>
                </div>

              <div className="mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Service Type</span>
                    <span className="text-gray-900 font-medium capitalize">
                      {selectedService.trade === "food_truck" ? "Food Truck" : selectedService.trade.charAt(0).toUpperCase() + selectedService.trade.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-start justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Service Area</span>
                    <div className="text-right">
                      <span className="text-gray-900 font-medium">{selectedService.mainLocation}</span>
                      <div className="text-xs text-gray-500 mt-1">Coverage: ~25 mile radius</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Hours</span>
                    <span className="text-gray-900 font-medium">{selectedService.hours}</span>
                  </div>
                </div>
              </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  {selectedService.trade === "handyman" || selectedService.trade === "plumber" || selectedService.trade === "electrician" || selectedService.trade === "painter" ? (
                    session ? (
                      <button
                        onClick={() => {
                          // Store the selected service type for pre-selection in booking modal
                          const serviceToBook = selectedSpecificService || 'furniture-assembly'; // Default to first handyman service
                          sessionStorage.setItem('selectedServiceForBooking', serviceToBook);
                          console.log('Booking service:', serviceToBook); // Debug log
                          setIsBookingModalOpen(true);
                          setIsModalOpen(false);
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm"
                        type="button"
                      >
                        Book Service
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          // Store booking intent before redirecting to OAuth
                          const serviceToBook = selectedSpecificService || 'furniture-assembly'; // Default to first handyman service
                          sessionStorage.setItem('pendingBooking', JSON.stringify({
                            serviceId: selectedService._id,
                            serviceName: selectedService.name,
                            selectedServiceType: serviceToBook
                          }));
                          sessionStorage.setItem('selectedServiceForBooking', serviceToBook);
                          // Use NextAuth's signIn function for proper redirect handling
                          signIn('google', { callbackUrl: window.location.origin });
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm"
                        type="button"
                      >
                        Login to Book
                      </button>
                    )
                  ) : (
                    selectedService.trade === "food_truck" && (
                      <a
                        href={`tel:${selectedService.phoneNumber || "555-123-4567"}`}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm text-center"
                      >
                        Call to Order
                      </a>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Booking Modasl */}
        {isBookingModalOpen && selectedService && (
          <NewBookingModal
            service={selectedService}
            selectedServiceType={selectedSpecificService || undefined}
            isOpen={isBookingModalOpen}
            onCloseAction={() => setIsBookingModalOpen(false)}
          />
        )}
      </main>
    </>
  );
}

export default function Home() {
  return (
    <SessionProvider>
      <Locator />
    </SessionProvider>
  );
}