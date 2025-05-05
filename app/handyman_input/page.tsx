"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, SessionProvider } from "next-auth/react";
import Link from "next/link";
import ImageUploader from "@/components/ImageUploader";
function HandymanInput() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const [serviceArea, setServiceArea] = useState("");
  const [handymanName, setHandymanName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState("");
  const [schedule, setSchedule] = useState([{ day: "", time: "", address: "" }]);
  const [confirmationMessage, setConfirmationMessage] = useState("");

  // Specific services with detailed descriptions, flat rates, and required materials
  const [specificServices, setSpecificServices] = useState([
    // Plumbing Services
    { 
      id: "faucet_replacement",
      category: "Plumbing",
      name: "Faucet Replacement", 
      selected: false, 
      price: 120, 
      timeLimit: "1.5 hours", 
      description: "Remove old faucet and install new one, including testing for leaks",
      materials: [
        { name: "Standard faucet parts", price: 30 },
        { name: "Premium faucet kit", price: 65 }
      ],
      selectedMaterial: ""
    },
    { 
      id: "toilet_repair",
      category: "Plumbing",
      name: "Toilet Repair", 
      selected: false, 
      price: 100, 
      timeLimit: "1 hour", 
      description: "Fix running toilet, replace flapper or fill valve, address tank issues",
      materials: [
        { name: "Basic toilet repair kit", price: 25 },
        { name: "Complete flush system", price: 45 }
      ],
      selectedMaterial: ""
    },
    { 
      id: "drain_unclogging",
      category: "Plumbing",
      name: "Drain Unclogging", 
      selected: false, 
      price: 90, 
      timeLimit: "1 hour", 
      description: "Clear clogged sink, shower, or tub drains",
      materials: [
        { name: "Basic drain cleaning supplies", price: 15 },
        { name: "Professional drain cleaning kit", price: 35 }
      ],
      selectedMaterial: ""
    },
    { 
      id: "pipe_leak_fix",
      category: "Plumbing",
      name: "Pipe Leak Repair", 
      selected: false, 
      price: 150, 
      timeLimit: "2 hours", 
      description: "Locate and fix leaking pipes under sinks or in accessible areas",
      materials: [
        { name: "Pipe repair supplies", price: 25 },
        { name: "Pipe replacement kit", price: 45 }
      ],
      selectedMaterial: ""
    },

    // Electrical Services
    { 
      id: "outlet_installation",
      category: "Electrical",
      name: "Outlet Installation", 
      selected: false, 
      price: 85, 
      timeLimit: "1 hour", 
      description: "Install new electrical outlet or replace existing one",
      materials: [
        { name: "Standard outlet", price: 10 },
        { name: "GFCI outlet", price: 25 },
        { name: "USB outlet", price: 35 }
      ],
      selectedMaterial: ""
    },
    { 
      id: "light_fixture",
      category: "Electrical",
      name: "Light Fixture Installation", 
      selected: false, 
      price: 110, 
      timeLimit: "1.5 hours", 
      description: "Remove old fixture and install new light fixture (customer provides fixture)",
      materials: [
        { name: "Light fixture installation kit", price: 15 },
        { name: "Light bulbs (pack of 4)", price: 20 }
      ],
      selectedMaterial: ""
    },
    { 
      id: "ceiling_fan",
      category: "Electrical",
      name: "Ceiling Fan Installation", 
      selected: false, 
      price: 150, 
      timeLimit: "2 hours", 
      description: "Install new ceiling fan or replace existing fan (customer provides fan)",
      materials: [
        { name: "Ceiling fan mounting kit", price: 25 },
        { name: "Reinforced ceiling mount", price: 45 }
      ],
      selectedMaterial: ""
    },
    { 
      id: "switch_replacement",
      category: "Electrical",
      name: "Switch Replacement", 
      selected: false, 
      price: 70, 
      timeLimit: "45 minutes", 
      description: "Replace light switch, dimmer, or timer switch",
      materials: [
        { name: "Standard switch", price: 10 },
        { name: "Dimmer switch", price: 25 },
        { name: "Smart switch", price: 45 }
      ],
      selectedMaterial: ""
    },

    // Carpentry Services
    { 
      id: "door_repair",
      category: "Carpentry",
      name: "Door Repair/Adjustment", 
      selected: false, 
      price: 120, 
      timeLimit: "1.5 hours", 
      description: "Fix sticking doors, replace hinges, adjust alignment",
      materials: [
        { name: "Door hardware kit", price: 20 },
        { name: "Premium hinges and hardware", price: 35 }
      ],
      selectedMaterial: ""
    },
    { 
      id: "cabinet_installation",
      category: "Carpentry",
      name: "Cabinet Installation", 
      selected: false, 
      price: 180, 
      timeLimit: "2.5 hours", 
      description: "Install or reattach cabinets, adjust doors and hardware",
      materials: [
        { name: "Cabinet hardware kit", price: 25 },
        { name: "Premium cabinet hardware", price: 45 }
      ],
      selectedMaterial: ""
    },
    { 
      id: "trim_installation",
      category: "Carpentry",
      name: "Trim Installation", 
      selected: false, 
      price: 130, 
      timeLimit: "2 hours", 
      description: "Install or replace baseboards, crown molding, or door trim",
      materials: [
        { name: "Basic trim supplies", price: 30 },
        { name: "Premium trim materials", price: 60 }
      ],
      selectedMaterial: ""
    },

    // Drywall Services
    { 
      id: "drywall_patch",
      category: "Drywall",
      name: "Drywall Patch", 
      selected: false, 
      price: 100, 
      timeLimit: "1.5 hours", 
      description: "Repair holes in drywall up to 12 inches",
      materials: [
        { name: "Small patch kit", price: 15 },
        { name: "Complete drywall repair kit", price: 35 }
      ],
      selectedMaterial: ""
    },
    { 
      id: "texture_matching",
      category: "Drywall",
      name: "Texture Matching", 
      selected: false, 
      price: 120, 
      timeLimit: "2 hours", 
      description: "Match and apply texture to repaired drywall areas",
      materials: [
        { name: "Basic texture supplies", price: 20 },
        { name: "Professional texture kit", price: 40 }
      ],
      selectedMaterial: ""
    },
    
    // Painting Services
    { 
      id: "interior_painting",
      category: "Painting",
      name: "Interior Painting", 
      selected: false, 
      price: 200, 
      timeLimit: "3 hours", 
      description: "Paint walls or ceiling in one average-sized room (up to 12x12 ft)",
      materials: [
        { name: "Standard paint (1 gallon)", price: 35 },
        { name: "Premium paint (1 gallon)", price: 55 },
        { name: "Paint supplies (brushes, rollers, tape)", price: 25 }
      ],
      selectedMaterial: ""
    },
    { 
      id: "trim_touchup",
      category: "Painting",
      name: "Trim Touch-ups", 
      selected: false, 
      price: 90, 
      timeLimit: "1.5 hours", 
      description: "Touch up paint on baseboards, crown molding, or door trim",
      materials: [
        { name: "Small paint can and supplies", price: 25 },
        { name: "Premium paint and supplies", price: 40 }
      ],
      selectedMaterial: ""
    },

    // Furniture Services
    { 
      id: "furniture_assembly",
      category: "Furniture",
      name: "Furniture Assembly", 
      selected: false, 
      price: 90, 
      timeLimit: "1.5 hours", 
      description: "Assemble flat-pack furniture (bed frame, desk, bookshelf, etc.)",
      materials: [],
      selectedMaterial: ""
    },
    { 
      id: "furniture_repair",
      category: "Furniture",
      name: "Furniture Repair", 
      selected: false, 
      price: 110, 
      timeLimit: "1.5 hours", 
      description: "Fix wobbly tables, repair chair legs, secure loose parts",
      materials: [
        { name: "Furniture repair supplies", price: 20 },
        { name: "Premium furniture hardware", price: 35 }
      ],
      selectedMaterial: ""
    },

    // Outdoor Services
    { 
      id: "gutter_cleaning",
      category: "Outdoor",
      name: "Gutter Cleaning", 
      selected: false, 
      price: 120, 
      timeLimit: "2 hours", 
      description: "Clean gutters and downspouts for a single-story home",
      materials: [
        { name: "Gutter cleaning supplies", price: 15 }
      ],
      selectedMaterial: ""
    },
    { 
      id: "fence_repair",
      category: "Outdoor",
      name: "Fence Repair", 
      selected: false, 
      price: 150, 
      timeLimit: "2.5 hours", 
      description: "Fix or replace damaged fence sections (up to 8 ft)",
      materials: [
        { name: "Basic fence repair kit", price: 35 },
        { name: "Premium fence materials", price: 65 }
      ],
      selectedMaterial: ""
    },

    // General Services
    { 
      id: "tv_mounting",
      category: "General",
      name: "TV Mounting", 
      selected: false, 
      price: 100, 
      timeLimit: "1.5 hours", 
      description: "Mount TV on wall, conceal cables when possible",
      materials: [
        { name: "Basic TV mount", price: 35 },
        { name: "Premium TV mount (tilting/extending)", price: 75 },
        { name: "Cable management kit", price: 20 }
      ],
      selectedMaterial: ""
    },
    { 
      id: "shelf_installation",
      category: "General",
      name: "Shelf Installation", 
      selected: false, 
      price: 80, 
      timeLimit: "1 hour", 
      description: "Install floating shelves or bracket shelves",
      materials: [
        { name: "Shelf mounting hardware", price: 15 },
        { name: "Heavy-duty mounting kit", price: 30 }
      ],
      selectedMaterial: ""
    }
  ]);

  // Price agreement checkbox
  const [agreeToPricing, setAgreeToPricing] = useState(false);

  // Image upload handler
  const handleImageUploaded = (url: string) => {
    setImageUrl(url);
  };

  // Checkbox handler for specific services
  const handleServiceChange = (serviceId: string) => {
    setSpecificServices(specificServices.map(service => 
      service.id === serviceId 
        ? { ...service, selected: !service.selected }
        : service
    ));
  };

  // Geocode an address to get its lat/lng using Google Geocoding API
  const geocodeAddress = async (addr: string) => {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        addr
      )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    if (data.status === "OK") {
      return data.results[0].geometry.location;
    } else {
      console.error("Geocoding Error:", data.status, data.error_message);
      return { lat: null, lng: null };
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Validate phone number
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (!phoneRegex.test(phoneNumber)) {
      setConfirmationMessage("Please enter a valid phone number");
      return;
    }
    
    // Check if at least one service is selected
    const hasSelectedService = specificServices.some(service => service.selected);
    
    // No need to validate material selection for handyman input
    if (!hasSelectedService) {
      setConfirmationMessage("Please select at least one service that you offer");
      return;
    }
    
    // Check pricing agreement
    if (!agreeToPricing) {
      setConfirmationMessage("Please agree to our pricing structure before continuing");
      return;
    }

    // Geocode the main service area address
    const mainCoords = await geocodeAddress(serviceArea);
    if (
      mainCoords.lat === null ||
      mainCoords.lng === null ||
      (mainCoords.lat === 0 && mainCoords.lng === 0)
    ) {
      setConfirmationMessage(
        "Error: The service area address is invalid. Please check and try again."
      );
      return;
    }
    
    // Use the service area as the main location for the schedule
    const mainScheduleSlot = {
      day: "Main Location",
      time: "N/A", // Default value, change if needed
      address: serviceArea,
      lat: mainCoords.lat,
      lng: mainCoords.lng,
    };

    // Process additional schedule entries (filter out empty addresses)
    const filteredSchedule = schedule.filter(
      (slot) => slot.address && slot.address.trim() !== ""
    );
    const scheduleWithCoords = await Promise.all(
      filteredSchedule.map(async (slot) => {
        const coords = await geocodeAddress(slot.address);
        return { ...slot, lat: coords.lat, lng: coords.lng };
      })
    );
    const finalSchedule = [mainScheduleSlot, ...scheduleWithCoords];
    console.log("Final Schedule Data with Lat/Lng:", finalSchedule);

    const hasInvalid = finalSchedule.some(
      (slot) =>
        slot.lat === null ||
        slot.lng === null ||
        (slot.lat === 0 && slot.lng === 0)
    );
    if (hasInvalid) {
      setConfirmationMessage(
        "Error: One or more addresses are invalid. Please check and try again."
      );
      return;
    }

    // Ensure the user is logged in and has an email
    if (!session?.user?.email) {
      setConfirmationMessage("Error: You must be logged in to add a service.");
      return;
    }

    // Process selected services - handyman only selects which services to offer, not materials
    const selectedServices = specificServices
      .filter(service => service.selected)
      .map(service => {
        return { 
          service: service.name,
          category: service.category,
          rate: service.price,
          timeLimit: service.timeLimit,
          description: service.description,
          materials: service.materials // Include all possible materials but don't select any
        };
      });

    // Log the selected services to verify they're correct
    console.log("Selected services being saved:", JSON.stringify(selectedServices, null, 2));
    
    // Build the new handyman object; trade is set to "handyman"
    const newHandyman = {
      name: handymanName,
      description: description,
      image: imageUrl,
      hours: hours,
      // CRITICAL: Ensure services array is properly passed and structured
      services: selectedServices,
      mainLocation: serviceArea,
      location: {
        type: "Point",
        coordinates: [mainCoords.lng, mainCoords.lat]
      },
      schedule: finalSchedule,
      userEmail: session.user.email,
      trade: "handyman",
      // REMOVE incorrect price data - we're using flat rates per service, not hourly
      // price and priceType should NOT be hardcoded here
      // Additional data that might be useful
      phoneNumber: phoneNumber,
      agreedToPricing: agreeToPricing
    };

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHandyman),
      });
      const json = await res.json();
      if (json.success) {
        setConfirmationMessage("Handyman service listed successfully!");
        console.log("Handyman service successfully added!", newHandyman);
        router.push("/profile"); // Redirect to profile after submission
      } else {
        console.error("Error details:", json);
        if (json.details && Array.isArray(json.details)) {
          setConfirmationMessage("Error creating handyman service: " + json.details.join(", "));
        } else {
          setConfirmationMessage("Error creating handyman service: " + json.error);
        }
      }
    } catch (error) {
      console.error("Error creating handyman service:", error);
      setConfirmationMessage("Error creating handyman service, please try again later.");
    }
  };

  const addScheduleSlot = () => {
    setSchedule([...schedule, { day: "", time: "", address: "" }]);
  };

  const updateSchedule = (index: number, field: string, value: string) => {
    const updated = schedule.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    );
    setSchedule(updated);
  };

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#f5d9bc" }}>
      {/* Fixed Nav Bar */}
      <nav className="fixed top-0 left-0 w-full bg-black text-white p-4 z-50 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-xl font-bold">ServiceHub</div>
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
            <li>
              <Link href="/list_your_service" legacyBehavior>
                <a className="hover:text-gray-300">List Your Service</a>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <h1 className="text-3xl font-bold mb-6 text-black pt-20">List Your Handyman Service</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-2xl space-y-4">
        {/* Handyman Name */}
        <div>
          <label className="block text-black mb-2">Handyman Name/Company</label>
          <input
            type="text"
            value={handymanName}
            onChange={(e) => setHandymanName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
            required
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-black mb-2">Phone Number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
            placeholder="(123) 456-7890"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Format: (123) 456-7890 or 123-456-7890</p>
        </div>

        {/* Service Area (Address) */}
        <div>
          <label className="block text-black mb-2">Service Area (Address)</label>
          <input
            type="text"
            value={serviceArea}
            onChange={(e) => setServiceArea(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
            required
          />
        </div>

        {/* Handyman Image Upload */}
        <div>
          <label className="block text-black mb-2">Upload Image</label>
          <ImageUploader onImageUploadedAction={handleImageUploaded} />
        </div>

        {/* Description */}
        <div>
          <label className="block text-black mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
            rows={3}
          />
        </div>

        {/* Hours of Operation */}
        <div>
          <label className="block text-black mb-2 font-medium">Hours of Operation</label>
          <input
            type="text"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
            placeholder="9-5"
          />
          <p className="text-xs text-gray-500 mt-1">Format: 9-5 or 10-6 (this will be used to create available time slots for bookings)</p>
        </div>

        {/* Service Checkboxes with Detailed Descriptions and Prices */}
        <div>
          <label className="block text-black mb-4 text-xl font-medium">Services Offered</label>
          {/* Services Grouped by Category */}
          {['Plumbing', 'Electrical', 'Carpentry', 'Drywall', 'Painting', 'Furniture', 'Outdoor', 'General'].map(category => {
            const categoryServices = specificServices.filter(service => service.category === category);
            
            if (categoryServices.length === 0) return null;
            
            return (
              <div key={category} className="mb-8">
                <h3 className="text-xl font-bold text-black mb-3 border-b pb-2">{category} Services</h3>
                <div className="grid grid-cols-1 gap-4">
                  {categoryServices.map(service => (
                    <div key={service.id} className="border rounded p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={service.selected}
                            onChange={() => handleServiceChange(service.id)}
                            className="mr-3 h-5 w-5"
                          />
                          <label className="text-black font-semibold text-lg">{service.name}</label>
                        </div>
                        <div className="text-black font-bold">${service.price} flat rate <span className="text-black font-normal">({service.timeLimit})</span></div>
                      </div>
                      <div className="mt-2 ml-8 text-black">{service.description}</div>
                      
                      {/* Show available materials but don't let handyman select them */}
                      {service.selected && service.materials.length > 0 && (
                        <div className="mt-3 ml-8 border-t pt-2">
                          <label className="block text-black font-medium mb-1">Available Materials:</label>
                          <div className="text-black text-sm">
                            <p>Clients will select from these options when booking:</p>
                            <ul className="list-disc ml-5 mt-1">
                              {service.materials.map((material, idx) => (
                                <li key={idx}>
                                  {material.name} - ${material.price}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
        </div>

        {/* Schedule Section (Optional) */}
        <h2 className="text-2xl font-bold text-black">Schedule (Optional)</h2>
        {schedule.map((slot, index) => (
          <div key={index} className="border border-gray-300 p-4 mb-4 rounded">
            <div className="mb-2">
              <label className="block text-black">Day</label>
              <input
                type="text"
                value={slot.day}
                onChange={(e) => updateSchedule(index, "day", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-black"
                placeholder="E.g., Monday"
              />
            </div>
            <div className="mb-2">
              <label className="block text-black">Time</label>
              <input
                type="text"
                value={slot.time}
                onChange={(e) => updateSchedule(index, "time", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-black"
                placeholder="E.g., 9 AM - 5 PM"
              />
            </div>
            <div className="mb-2">
              <label className="block text-black">Address</label>
              <input
                type="text"
                value={slot.address}
                onChange={(e) => updateSchedule(index, "address", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-black"
                placeholder="Optional: Additional service location"
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addScheduleSlot}
          className="bg-blue-500 text-white p-2 rounded w-full"
        >
          Add Another Schedule Slot
        </button>

        {/* Pricing Agreement */}
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="text-lg font-bold text-black mb-2">Service Pricing Agreement</h3>
          <p className="text-black mb-4">
            Our standard pricing structure for handyman services is as follows:
          </p>
          <ul className="list-disc pl-5 text-black mb-4">
            <li>Basic services: $100-150 (1-2 hours)</li>
            <li>Specialized services: $150-300 (2-4 hours)</li>
            <li>Emergency services: Additional $75 fee</li>
            <li>Weekend/holiday services: 1.5x regular rate</li>
          </ul>
          <p className="text-black mb-4">
            TradeTrack takes a 10% commission on all bookings made through our platform.
          </p>
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              checked={agreeToPricing}
              onChange={(e) => setAgreeToPricing(e.target.checked)}
              className="mr-2"
              required
            />
            <label className="text-black">
              I agree to the pricing structure and commission terms
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 bg-green-500 text-white p-2 rounded w-full"
        >
          Submit
        </button>

        {confirmationMessage && (
          <div className="mt-4 p-4 bg-gray-200 rounded text-black">
            {confirmationMessage}
          </div>
        )}
      </form>
    </div>
  );
}

export default function HandymanInputPage() {
  return (
    <SessionProvider>
      <HandymanInput />
    </SessionProvider>
  );
}