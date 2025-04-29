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
  const [skillsAndServices, setSkillsAndServices] = useState("");
  const [schedule, setSchedule] = useState([{ day: "", time: "", address: "" }]);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  
  // Services offered checkboxes
  const [servicesOffered, setServicesOffered] = useState({
    carpentry: false,
    plumbing: false,
    electrical: false,
    painting: false,
    drywall: false,
    flooring: false,
    furniture: false,
    outdoor: false,
    general: false
  });
  
  // Price agreement checkbox
  const [agreeToPricing, setAgreeToPricing] = useState(false);

  // Image upload handler
  const handleImageUploaded = (url: string) => {
    setImageUrl(url);
  };

  // Checkbox handler for services
  const handleServiceChange = (service: keyof typeof servicesOffered) => {
    setServicesOffered({
      ...servicesOffered,
      [service]: !servicesOffered[service]
    });
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
    const hasSelectedService = Object.values(servicesOffered).some(value => value);
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

    // Convert services offered to a formatted string
    const selectedServices = Object.entries(servicesOffered)
      .filter(([_, selected]) => selected)
      .map(([service, _]) => service.charAt(0).toUpperCase() + service.slice(1))
      .join(", ");

    // Build the new handyman object; trade is set to "handyman"
    const newHandyman = {
      name: handymanName,
      phoneNumber: phoneNumber,
      image: imageUrl,
      description,
      hours,
      skillsAndServices: selectedServices + (skillsAndServices ? `. ${skillsAndServices}` : ""),
      mainLocation: serviceArea,
      schedule: finalSchedule,
      userEmail: session.user.email, // Associate with logged-in user
      trade: "handyman",
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
        setConfirmationMessage("Error creating handyman service: " + json.error);
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
          <ImageUploader onImageUploaded={handleImageUploaded} />
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
          <label className="block text-black mb-2">Hours of Operation</label>
          <input
            type="text"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
          />
        </div>

        {/* Services Offered Checkboxes */}
        <div>
          <label className="block text-black mb-2">Services Offered</label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={servicesOffered.carpentry}
                onChange={() => handleServiceChange('carpentry')}
                className="mr-2"
              />
              <span className="text-black">Carpentry</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={servicesOffered.plumbing}
                onChange={() => handleServiceChange('plumbing')}
                className="mr-2"
              />
              <span className="text-black">Minor Plumbing</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={servicesOffered.electrical}
                onChange={() => handleServiceChange('electrical')}
                className="mr-2"
              />
              <span className="text-black">Minor Electrical</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={servicesOffered.painting}
                onChange={() => handleServiceChange('painting')}
                className="mr-2"
              />
              <span className="text-black">Painting</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={servicesOffered.drywall}
                onChange={() => handleServiceChange('drywall')}
                className="mr-2"
              />
              <span className="text-black">Drywall Repair</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={servicesOffered.flooring}
                onChange={() => handleServiceChange('flooring')}
                className="mr-2"
              />
              <span className="text-black">Flooring Installation</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={servicesOffered.furniture}
                onChange={() => handleServiceChange('furniture')}
                className="mr-2"
              />
              <span className="text-black">Furniture Assembly</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={servicesOffered.outdoor}
                onChange={() => handleServiceChange('outdoor')}
                className="mr-2"
              />
              <span className="text-black">Outdoor Maintenance</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={servicesOffered.general}
                onChange={() => handleServiceChange('general')}
                className="mr-2"
              />
              <span className="text-black">General Repairs</span>
            </label>
          </div>
        </div>

        {/* Additional Skills/Services */}
        <div>
          <label className="block text-black mb-2">Additional Skills & Services</label>
          <textarea
            value={skillsAndServices}
            onChange={(e) => setSkillsAndServices(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
            rows={2}
            placeholder="List any additional skills or services not covered above"
          />
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
            <li>Basic services: $50-75/hour</li>
            <li>Specialized services: $75-100/hour</li>
            <li>Emergency services: Additional $50 fee</li>
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