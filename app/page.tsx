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
  // Cache for address -> coords to reduce repeated geocoding
  const geocodeCache = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  // Keep only one visible client service area circle
  const serviceAreaCircleRef = useRef<google.maps.Circle | null>(null);
  // Service templates loaded from Mongo so new services show up automatically
  type ServiceTemplateItem = { trade: string; name: string; description: string; price: string; timeEstimate: string };
  const [serviceTemplates, setServiceTemplates] = useState<ServiceTemplateItem[]>([]);
  
  // Selection state for the two-step process
  const [selectionStep, setSelectionStep] = useState<"category" | "service" | "map">("category");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSpecificService, setSelectedSpecificService] = useState<string | null>(null);
  const [selectedServiceName, setSelectedServiceName] = useState<string | null>(null);
  const [mapDimmed, setMapDimmed] = useState(true);
  const [userTriggeredNearMe, setUserTriggeredNearMe] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Format a slug like "baseboard-replacement-12-12" to "Baseboard Replacement 12 12"
  const formatServiceLabel = (id?: string | null, fallback?: string | null) => {
    if (fallback && fallback.trim()) return fallback;
    if (!id) return '';
    const cleaned = id.replace(/--/g, ' - ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned.replace(/\b\w/g, (m) => m.toUpperCase());
  };

  // After login, restore the modal the user had open or their pending booking
  useEffect(() => {
    if (!session) return;
    // Wait until services are loaded to resolve IDs
    if (!services || services.length === 0) return;

    try {
      // Restore user location if it was previously stored
      const storedLocation = sessionStorage.getItem('userLocation');
      if (storedLocation) {
        try {
          const loc = JSON.parse(storedLocation);
          if (loc.lat && loc.lng) {
            setUserLocation(loc);
            setUserTriggeredNearMe(true);
          }
        } catch {}
      }

      // Restore last selected specific service (id + name) for filtering and state
      const selectedForBooking = sessionStorage.getItem('selectedServiceForBooking');
      if (selectedForBooking) {
        try {
          const parsed = JSON.parse(selectedForBooking);
          if (parsed?.serviceId) setSelectedSpecificService(parsed.serviceId);
          if (parsed?.serviceName) setSelectedServiceName(parsed.serviceName);
          // If we have both service selection and location, restore the map state
          if (parsed?.serviceName && storedLocation) {
            setSelectionStep('map');
            setMapDimmed(false);
          }
        } catch {}
      }

      const pending = sessionStorage.getItem('pendingBooking');
      if (pending) {
        const { serviceId, selectedServiceType } = JSON.parse(pending);
        const svc = services.find(s => s._id === serviceId);
        if (svc) {
          setSelectedService(svc);
          setSelectedSpecificService(selectedServiceType || null);
          setIsModalOpen(true);
          setSelectionStep('map');
          setMapDimmed(false);
        }
        sessionStorage.removeItem('pendingBooking');
        return;
      }

      const lastOpen = sessionStorage.getItem('lastOpenModalServiceId');
      if (lastOpen) {
        const svc = services.find(s => s._id === lastOpen);
        if (svc) {
          setSelectedService(svc);
          setIsModalOpen(true);
          setSelectionStep('map');
          setMapDimmed(false);
        }
      }
    } catch (e) {
      console.warn('Failed to restore modal after login', e);
    }
  }, [session, services]);

  // Restore map state (zoom and circle) after location is restored from sessionStorage
  useEffect(() => {
    if (!map || !userLocation || !userTriggeredNearMe) return;
    
    // Restore the map zoom and center to user location
    map.setCenter(userLocation);
    map.setZoom(12);
    
    // Recreate the service area circle
    if (serviceAreaCircleRef.current) {
      serviceAreaCircleRef.current.setMap(null);
      serviceAreaCircleRef.current = null;
    }
    serviceAreaCircleRef.current = new window.google.maps.Circle({
      strokeColor: '#1D4ED8',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#3B82F6',
      fillOpacity: 0.1,
      map: map,
      center: userLocation,
      radius: 16093.4 // 10 miles in meters
    });
  }, [map, userLocation, userTriggeredNearMe]);

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

  // Fetch service templates (handyman/electrician/etc.) from DB
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/service-templates');
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          setServiceTemplates(json.data);
        }
      } catch (e) {
        console.error('Failed to load service templates', e);
      }
    }
    fetchTemplates();
  }, []);

  // Merge DB templates with hardcoded list for a category (DB at bottom)
  const getMergedServices = (categoryId: string) => {
    // Exclusively use DB-driven templates to avoid hardcoded discrepancies
    const idToTrade: Record<string, string> = { plumbing: 'plumbing', handyman: 'handyman', electrician: 'electrician', painting: 'painting' };
    const trade = idToTrade[categoryId];
    const fromDb = serviceTemplates
      .filter((t) => t.trade === trade)
      .map((t) => ({ name: t.name, description: t.description, price: t.price, timeEstimate: t.timeEstimate }));
    return fromDb;
  };

  // Load Google Maps script and initialize the map
  useEffect(() => {
    const initMap = () => {
      const mapElement = document.getElementById("map") as HTMLElement;
      if (!mapElement) return;
      
      // Create map with initial options - keep at state level until service selected
      const newMap = new window.google.maps.Map(mapElement, {
        zoom: 6, // State level zoom - don't zoom in until service selected
        center: { lat: 32.7157, lng: -117.1611 }, // San Diego area default
        disableDefaultUI: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });
      
      // IMPORTANT: Don't auto-zoom to user location on page load
      // Only zoom in when user actually selects a specific service
      
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
    const bounds = new window.google.maps.LatLngBounds();
    const geocoder = new window.google.maps.Geocoder();

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
        try { if (service._id) sessionStorage.setItem('lastOpenModalServiceId', service._id); } catch {}
      });

      newMarkers.push(marker);
      bounds.extend(new window.google.maps.LatLng(location.lat, location.lng));
    };

    // Create markers in batches to prevent flickering
    const batchSize = 50;
    for (let i = 0; i < services.length; i += batchSize) {
      const batch = services.slice(i, i + batchSize);

      batch.forEach((service) => {
        if (selectedTrade && service.trade !== selectedTrade) return;
        // If a specific service has been selected, only show providers that offer it
        if (selectedServiceName) {
          const offers = Array.isArray(service.services) && service.services.some(s => s?.service === selectedServiceName);
          if (!offers) return;
        }

        let iconUrl = "";
        let iconSize = new window.google.maps.Size(45, 45);

        switch (service.trade) {
          case "plumber":
            iconUrl = "/plumber.png";
            break;
          case "electrician":
            iconUrl = "/electrician.png";
            break;
          case "handyman":
            iconUrl = "/handyman.png";
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
        } else if (Array.isArray(service.schedule)) {
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
        } else if (service.mainLocation) {
          // Fallback: geocode provider main address
          const addr = service.mainLocation.trim();
          const cached = geocodeCache.current.get(addr);
          const apply = (lat: number, lng: number) => {
            if (typeof lat === 'number' && typeof lng === 'number' && lat !== 0 && lng !== 0) {
              createMarker(
                service,
                { lat, lng, address: addr },
                iconUrl,
                iconSize
              );
            }
          };
          if (cached) {
            apply(cached.lat, cached.lng);
          } else {
            geocoder.geocode({ address: addr }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                const loc = results[0].geometry.location;
                const coords = { lat: loc.lat(), lng: loc.lng() };
                geocodeCache.current.set(addr, coords);
                apply(coords.lat, coords.lng);
              } else {
                console.warn('Geocode failed for', addr, status);
              }
            });
          }
        }
      });

      newMarkers.forEach(marker => marker.setMap(map));
    }

    setMarkers(newMarkers);

    // Auto-fit only after user explicitly triggers location search to prevent early zooming
    const shouldAutoFit = userTriggeredNearMe && !!selectedServiceName;
    if (shouldAutoFit && newMarkers.length > 0) {
      try {
        map.fitBounds(bounds, 60);
        // If only one marker, set a reasonable zoom
        if (newMarkers.length === 1) {
          map.setZoom(12);
          map.panTo(bounds.getCenter());
        }
      } catch (e) {
        console.warn('fitBounds failed', e);
      }
    }
  }, [map, services, selectedTrade, selectionStep, selectedServiceName, userTriggeredNearMe]);

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectionStep("service");

    // Map trade ID to the corresponding trade value
    const tradeMap: Record<string, string> = {
      plumbing: "plumber",
      handyman: "handyman",
      electrician: "electrician",
      painting: "painter",
    };

    setSelectedTrade(tradeMap[categoryId] || "");
  };

  // Handle specific service selection - updated for new service structure
  const handleSpecificServiceSelect = (service: any) => {
  // Create precise mapping from service names to booking modal IDs
  const serviceNameToIdMap: { [key: string]: string } = {
    // Handyman services (updated to match actual service templates)
    '15AMP Wall Outlet Upgrade Package': '15amp-wall-outlet-upgrade',
    '20AMP Wall Outlet Upgrade Package': '20amp-wall-outlet-upgrade',
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
    'Garbage Disposal Installation': 'garbage-disposal',
    // Electrical services
    'Outlet Installation & Repair': 'outlet-repair',
    'Light Switch Installation': 'light-switch',
    'Ceiling Fan Installation': 'ceiling-fan',
    'Light Fixture Replacement': 'light-fixture',
    'Circuit Breaker Repair': 'circuit-breaker',
    'Electrical Wiring Repair': 'wiring-repair',
    'Smart Home Device Installation': 'smart-home',
    // Painting services
    'Interior Room Painting': 'interior-painting',
    'Exterior House Painting': 'exterior-painting',
    'Cabinet Painting & Refinishing': 'cabinet-painting',
    'Deck & Fence Staining': 'deck-staining',
    'Accent Wall & Feature Painting': 'accent-wall',
    'Ceiling Painting': 'ceiling-painting',
    'Touch-Up & Repair Painting': 'touch-up-painting'
  };

  const serviceId = serviceNameToIdMap[service.name] || service.name.toLowerCase().replace(/[^a-z0-9]/g, '-'); // Generate ID from name if not found
  console.log('Selected service:', service.name, '-> ID:', serviceId); // Debug log
  
  // Store service selection for booking modal
  sessionStorage.setItem('selectedServiceForBooking', JSON.stringify({
    serviceId: serviceId,
    serviceName: service.name,
    servicePrice: service.price,
    serviceDescription: service.description
  }));
  setSelectedSpecificService(serviceId);
  setSelectedServiceName(service.name);
  setSelectionStep("map");
  setMapDimmed(false);

  // Search near user's location
  searchNearMe();
};

// Reset selection process
const resetSelection = () => {
  setSelectedCategory(null);
  setSelectedSpecificService(null);
  setSelectedServiceName(null);
  setSelectionStep("category");
  setMapDimmed(true);
  setUserTriggeredNearMe(false);
  // Remove any existing service area ring and reset map view
  try {
    if (serviceAreaCircleRef.current) {
      serviceAreaCircleRef.current.setMap(null);
      serviceAreaCircleRef.current = null;
    }
    if (map) {
      map.setZoom(6);
      map.setCenter({ lat: 32.7157, lng: -117.1611 });
    }
  } catch {}
};

// "Search Near Me" functionality: recenter map on user's location and zoom in
const searchNearMe = () => {
  // Mark that the user explicitly requested a location-based search
  setUserTriggeredNearMe(true);
  
  // If we already have the user's location cached, use it without re-prompting
  if (userLocation && map) {
    const loc = userLocation;
    map.setCenter(loc);
    map.setZoom(12);
    
    // Maintain only one service area circle around user location
    if (serviceAreaCircleRef.current) {
      serviceAreaCircleRef.current.setMap(null);
      serviceAreaCircleRef.current = null;
    }
    serviceAreaCircleRef.current = new window.google.maps.Circle({
      strokeColor: '#1D4ED8',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#3B82F6',
      fillOpacity: 0.1,
      map: map,
      center: loc,
      radius: 16093.4 // 10 miles in meters
    });
    return;
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (!map) return;
        const loc = { lat: latitude, lng: longitude };
        setUserLocation(loc);
        
        // Store location in sessionStorage for persistence across reloads
        sessionStorage.setItem('userLocation', JSON.stringify(loc));
        
        // Center map on user location and zoom in for service search
        map.setCenter(loc);
        map.setZoom(12); // Zoom in to show local area
        
        // Maintain only one service area circle around user location
        if (serviceAreaCircleRef.current) {
          serviceAreaCircleRef.current.setMap(null);
          serviceAreaCircleRef.current = null;
        }
        serviceAreaCircleRef.current = new window.google.maps.Circle({
          strokeColor: '#1D4ED8',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#3B82F6',
          fillOpacity: 0.1,
          map: map,
          center: loc,
          radius: 16093.4 // 10 miles in meters
        });
      },
      (error: GeolocationPositionError) => {
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
      <div className="fixed top-0 left-0 right-0 z-10 bg-black text-white shadow-md">
        <div className="container mx-auto flex justify-between items-center p-2">
          <Link href="/" legacyBehavior>
            <a className="text-xl font-bold text-white hover:text-gray-300 cursor-pointer">TradesMonk</a>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/about" legacyBehavior>
              <a className="text-white hover:text-gray-300 text-base">About</a>
            </Link>
            {session ? (
              <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 hover:bg-gray-700 transition-colors">
                <Link href="/profile" legacyBehavior>
                  <a className="text-white hover:text-gray-300 text-base">
                    Welcome, <span className="text-blue-400" style={{ textShadow: '0 0 2px rgba(0,0,0,0.5)' }}>{session.user?.name || session.user?.email?.split('@')[0] || 'User'}</span>!
                  </a>
                </Link>
              </div>
            ) : (
              <Link href="/profile" legacyBehavior>
                <a className="text-white hover:text-gray-300 text-base">Login</a>
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
                                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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

                <h3 className="text-xl text-center text-gray-700 mb-2">
                  What specific service do you need?
                </h3>
                <p className="text-center text-gray-500 text-sm mb-6">
                  Blue circle shows your 10-mile service area
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-80 overflow-y-auto pr-2">
                  {getMergedServices(selectedCategory).map((service, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSpecificServiceSelect(service)}
                      className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-all duration-300 border border-gray-200"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="text-lg font-semibold text-gray-800">
                          {service.name}
                        </h4>
                        <div className="text-right">
                          <span className="text-lg font-bold text-blue-600">{service.price}</span>
                          <p className="text-xs text-gray-500">{service.timeEstimate}</p>
                        </div>
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
            {selectionStep === "map" && selectedSpecificService && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-20 left-0 right-0 flex justify-center"
              >
                <div className="bg-white rounded-lg shadow-lg p-4 flex items-center space-x-4">
                  <div className="text-gray-800">
                    <span className="font-medium">Showing:</span> {formatServiceLabel(selectedSpecificService, selectedServiceName)} providers
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
                          // Store the selected service type for pre-selection in booking modal (normalized JSON)
                          const serviceToBook = selectedSpecificService || 'furniture-assembly';
                          try {
                            sessionStorage.setItem('selectedServiceForBooking', JSON.stringify({
                              serviceId: serviceToBook,
                              serviceName: selectedServiceName || serviceToBook
                            }));
                          } catch {}
                          console.log('Booking service:', serviceToBook);
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
                          const serviceToBook = selectedSpecificService || 'furniture-assembly';
                          try {
                            sessionStorage.setItem('pendingBooking', JSON.stringify({
                              serviceId: selectedService._id,
                              serviceName: selectedService.name,
                              selectedServiceType: serviceToBook
                            }));
                            sessionStorage.setItem('selectedServiceForBooking', JSON.stringify({
                              serviceId: serviceToBook,
                              serviceName: selectedServiceName || serviceToBook
                            }));
                          } catch {}
                          // Use NextAuth's signIn function - let NextAuth handle redirect automatically
                          signIn('google');
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