"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TruckInput() {
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

  const router = useRouter();

  // Function to get lat/lng for an address
  const getLatLngFromAddress = async (address: string) => {
    const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key='AIzaSyD9AQtE_WlHC0RvWvZ8BoP2ypr3EByvRDs'}`
    );
    const data = await response.json();

    if (data.status === "OK") {
        return data.results[0].geometry.location;
    } else {
        console.error("Geocoding Error:", data.status, data.error_message);
        return { lat: 0, lng: 0 }; // 🚨 Default to 0,0 if geocoding fails
    }
};
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Create a URL for previewing the image
      const imageUrl = URL.createObjectURL(file);
      setTruckImage(imageUrl);
    }
  };
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
  
    // Function to get lat/lng for an address
    const geocodeAddress = async (address: string) => {
      
      console.log("🌍 Geocoding address:", address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=AIzaSyD9AQtE_WlHC0RvWvZ8BoP2ypr3EByvRDs`;
  
      try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("🔍 Geocoding Response for", address, ":", data);
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
  
    // Geocode the main address (from the main address field)
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
    // Create the main schedule slot using the main address
    const mainScheduleSlot = {
      day: "Main Location",
      time: "",
      address: address,
      lat: mainCoords.lat,
      lng: mainCoords.lng,
    };
  
    // Filter out empty schedule entries (allowing the schedule part to be optional)
    const filteredSchedule = schedule.filter(
      (slot) => slot.address && slot.address.trim() !== ""
    );
  
    // Convert each nonempty schedule entry to include lat/lng
    const scheduleWithCoords = await Promise.all(
      filteredSchedule.map(async (slot) => {
        const coords = await geocodeAddress(slot.address);
        return { ...slot, lat: coords.lat, lng: coords.lng };
      })
    );
  
    // Combine the main schedule slot with any additional schedule slots
    const finalSchedule = [mainScheduleSlot, ...scheduleWithCoords];
  
    console.log("🗺️ Final Schedule Data with Lat/Lng:", finalSchedule);
  
    // Check if any schedule slot is invalid
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
  
    const newTruck = {
      name: truckName,
      image: truckImage,
      description,
      hours,
      cuisine,
      restrictions,
      mealTimes,
      mainLocation: address, // <- Use the top-level address state here
      schedule: scheduleWithCoords,
    };
  
    // Save to localStorage or your DB
    let trucks = JSON.parse(localStorage.getItem("trucks") || "[]");
    trucks.push(newTruck);
    localStorage.setItem("trucks", JSON.stringify(trucks));
  
    // Confirmation, etc.
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

  const handleRestrictionChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-black">
        Add New Truck Location
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-2xl space-y-4"
      >
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

        <div>
          <label className="block text-black mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-black mb-2">Hours of Operation</label>
          <input
            type="text"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
          />
        </div>

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
