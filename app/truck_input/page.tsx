"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, SessionProvider } from "next-auth/react";
import Link from "next/link";

function TruckInput() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [address, setAddress] = useState("");
  const [truckName, setTruckName] = useState("");
  const [truckImage, setTruckImage] = useState("");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [mealTimes, setMealTimes] = useState<string[]>([]);
  const [schedule, setSchedule] = useState([{ day: "", time: "", address: "" }]);
  const [confirmationMessage, setConfirmationMessage] = useState("");

  // Redirect to login if unauthenticated (optional)
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Function to get lat/lng using Google Geocoding API
  const getLatLngFromAddress = async (addr: string) => {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        addr
      )}&key=AIzaSyD9AQtE_WlHC0RvWvZ8BoP2ypr3EByvRDs`
    );
    const data = await response.json();
    if (data.status === "OK") {
      return data.results[0].geometry.location;
    } else {
      console.error("Geocoding Error:", data.status, data.error_message);
      return { lat: 0, lng: 0 };
    }
  };

  // File input change handler – creates a preview URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setTruckImage(imageUrl);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
  
    const geocodeAddress = async (addr: string) => {
      console.log("🌍 Geocoding address:", addr);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        addr
      )}&key=AIzaSyD9AQtE_WlHC0RvWvZ8BoP2ypr3EByvRDs`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("🔍 Geocoding Response for", addr, ":", data);
        if (data.status === "OK") {
          return {
            lat: data.results[0].geometry.location.lat,
            lng: data.results[0].geometry.location.lng,
          };
        } else {
          console.error("❌ Geocoding Error:", data.status, data.error_message);
          return { lat: null, lng: null };
        }
      } catch (error) {
        console.error("⚠️ Fetch Error:", error);
        return { lat: null, lng: null };
      }
    };
  
    const mainCoords = await geocodeAddress(address);
    if (
      mainCoords.lat === null ||
      mainCoords.lng === null ||
      (mainCoords.lat === 0 && mainCoords.lng === 0)
    ) {
      setConfirmationMessage(
        "Error: The main address is invalid. Please check and try again."
      );
      return;
    }
    // Use the main address as the main location for the schedule with default time
    const mainScheduleSlot = {
      day: "Main Location",
      time: "N/A", // Updated default value
      address: address,
      lat: mainCoords.lat,
      lng: mainCoords.lng,
    };
  
    // Process additional schedule entries (filtering out empty ones)
    const filteredSchedule = schedule.filter(
      (slot) => slot.address && slot.address.trim() !== ""
    );
    const scheduleWithCoords = await Promise.all(
      filteredSchedule.map(async (slot) => {
        const coords = await geocodeAddress(slot.address);
        return { ...slot, lat: coords.lat, lng: coords.lng };
      })
    );
    // Combine main location with schedule entries
    const finalSchedule = [mainScheduleSlot, ...scheduleWithCoords];
    console.log("🗺️ Final Schedule Data with Lat/Lng:", finalSchedule);
  
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
  
    if (!session?.user?.email) {
      setConfirmationMessage("Error: You must be logged in to add a service.");
      return;
    }
  
    const newTruck = {
      name: truckName,
      image: truckImage,
      description,
      hours,
      cuisine,
      restrictions,
      mealTimes,
      mainLocation: address,
      schedule: scheduleWithCoords,
      userEmail: session.user.email,
      trade: "food_truck",
    };
  
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTruck),
      });
      const json = await res.json();
      if (json.success) {
        setConfirmationMessage("Truck created successfully!");
        console.log("✅ Truck successfully added!", newTruck);
        router.push("/profile"); // Redirect to profile after successful submission
      } else {
        setConfirmationMessage("Error creating truck: " + json.error);
      }
    } catch (error) {
      console.error("Error creating truck:", error);
      setConfirmationMessage("Error creating truck, please try again later.");
    }
  };
  
  const addScheduleSlot = () => {
    setSchedule([...schedule, { day: "", time: "", address: "" }]);
  };

  const updateSchedule = (index: number, field: string, value: string) => {
    const updatedSchedule = schedule.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    );
    setSchedule(updatedSchedule);
  };

  const handleRestrictionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) {
      setRestrictions([...restrictions, value]);
    } else {
      setRestrictions(restrictions.filter((r) => r !== value));
    }
  };

  const handleMealTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) {
      setMealTimes([...mealTimes, value]);
    } else {
      setMealTimes(mealTimes.filter((t) => t !== value));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#f5d9bc" }}>
      {/* Fixed Nav Bar */}
      <nav className="fixed top-0 left-0 w-full bg-black text-white p-4 z-50 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-xl font-bold">TruckTrack</div>
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
              <Link href="/contact" legacyBehavior>
                <a className="hover:text-gray-300">Contact</a>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <h1 className="text-3xl font-bold mb-6 text-black pt-20">Add New Truck Location</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-2xl space-y-4">
        {/* Truck Name */}
        <div>
          <label className="block text-black mb-2">Truck Name</label>
          <input
            type="text"
            value={truckName}
            onChange={(e) => setTruckName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
            required
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-black mb-2">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
            required
          />
        </div>

        {/* Truck Image */}
        <div>
          <label className="block text-black mb-2">Truck Image</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="w-full p-2 border border-gray-300 rounded text-black"
            required
          />
          {truckImage && (
            <div className="mt-4">
              <p className="text-black">Preview:</p>
              <img src={truckImage} alt="Truck Preview" className="w-48 h-auto border" />
            </div>
          )}
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

        {/* Cuisine Type */}
        <div>
          <label className="block text-black mb-2">Cuisine Type</label>
          <select
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
          >
            <option value="" disabled>
              Select Cuisine
            </option>
            <option value="Mexican">Mexican</option>
            <option value="Italian">Italian</option>
            <option value="American">American</option>
            <option value="Asian">Asian</option>
          </select>
        </div>

        {/* Dietary Restrictions */}
        <div>
          <label className="block text-black mb-2">Dietary Restrictions</label>
          <div className="flex space-x-4">
            <label className="text-black">
              <input
                type="checkbox"
                value="Vegetarian"
                onChange={handleRestrictionChange}
              />{" "}
              Vegetarian
            </label>
            <label className="text-black">
              <input
                type="checkbox"
                value="Vegan"
                onChange={handleRestrictionChange}
              />{" "}
              Vegan
            </label>
            <label className="text-black">
              <input
                type="checkbox"
                value="Kosher"
                onChange={handleRestrictionChange}
              />{" "}
              Kosher
            </label>
          </div>
        </div>

        {/* Meal Times */}
        <div>
          <label className="block text-black mb-2">Meal Times</label>
          <div className="flex space-x-4">
            <label className="text-black">
              <input
                type="checkbox"
                value="Breakfast"
                onChange={handleMealTimeChange}
              />{" "}
              Breakfast
            </label>
            <label className="text-black">
              <input
                type="checkbox"
                value="Lunch"
                onChange={handleMealTimeChange}
              />{" "}
              Lunch
            </label>
            <label className="text-black">
              <input
                type="checkbox"
                value="Dinner"
                onChange={handleMealTimeChange}
              />{" "}
              Dinner
            </label>
          </div>
        </div>

        {/* Schedule */}
        <h2 className="text-2xl font-bold text-black">Schedule</h2>
        {schedule.map((slot, index) => (
          <div key={index} className="border border-gray-300 p-4 mb-4 rounded">
            <div className="mb-2">
              <label className="block text-black">Day</label>
              <input
                type="text"
                value={slot.day}
                onChange={(e) => updateSchedule(index, "day", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-black"
                placeholder="E.g. Monday"
              />
            </div>
            <div className="mb-2">
              <label className="block text-black">Time</label>
              <input
                type="text"
                value={slot.time}
                onChange={(e) => updateSchedule(index, "time", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-black"
                placeholder="E.g. 10:00 AM - 2:00 PM"
              />
            </div>
            <div className="mb-2">
              <label className="block text-black">Address</label>
              <input
                type="text"
                value={slot.address}
                onChange={(e) => updateSchedule(index, "address", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-black"
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

// Export TruckInputPage wrapping the TruckInput component in a SessionProvider.
export default function TruckInputPage() {
  return (
    <SessionProvider>
      <TruckInput />
    </SessionProvider>
  );
}
