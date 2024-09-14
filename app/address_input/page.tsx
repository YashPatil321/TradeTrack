"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddressInput() {
  const [truckName, setTruckName] = useState("");
  const [address, setAddress] = useState("");
  const [schedule, setSchedule] = useState([{ startTime: "", endTime: "", address: "" }]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAddSlot = () => {
    setSchedule([...schedule, { startTime: "", endTime: "", address: "" }]);
  };

  const handleChangeSlot = (index, field, value) => {
    const updatedSchedule = schedule.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    );
    setSchedule(updatedSchedule);
  };

  const getLatLngFromAddress = async (address) => {
    try {
      const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyA-TlVuQXWUgjmMxpLS4qmWjv164jkl75c`;
      const response = await fetch(geocodingUrl);
      const data = await response.json();

      if (data.status !== "OK") {
        throw new Error("Failed to fetch location data");
      }

      return data.results[0].geometry.location;
    } catch (error) {
      console.error("Error fetching location data:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!truckName || !address || schedule.some(slot => !slot.startTime || !slot.endTime || !slot.address)) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const mainLocation = await getLatLngFromAddress(address);
      if (!mainLocation) {
        alert("Failed to fetch location data for main address. Please try again.");
        setLoading(false);
        return;
      }

      const newTruck = {
        name: truckName,
        cuisine: "American", // Placeholder for cuisine, can be expanded
        schedule: await Promise.all(schedule.map(async (slot) => {
          const location = await getLatLngFromAddress(slot.address);
          return {
            ...slot,
            lat: location ? location.lat : mainLocation.lat,
            lng: location ? location.lng : mainLocation.lng,
          };
        })),
      };

      const storedTrucks = localStorage.getItem("trucks");
      const trucks = storedTrucks ? JSON.parse(storedTrucks) : [];
      trucks.push(newTruck);
      localStorage.setItem("trucks", JSON.stringify(trucks));

      alert("Truck location added successfully!");
      router.push("/");

    } catch (error) {
      alert("An error occurred while adding the truck.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Add Truck Location</h2>

        <div className="mb-4">
          <label htmlFor="truckName" className="block text-lg mb-2 text-gray-700">Truck Name</label>
          <input
            id="truckName"
            type="text"
            value={truckName}
            onChange={(e) => setTruckName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded"
            placeholder="Enter truck name"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="address" className="block text-lg mb-2 text-gray-700">Address</label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded"
            placeholder="Enter address"
          />
        </div>

        <h3 className="text-lg font-semibold mb-2">Schedule:</h3>
        {schedule.map((slot, index) => (
          <div key={index} className="mb-4">
            <input
              type="time"
              value={slot.startTime}
              onChange={(e) => handleChangeSlot(index, "startTime", e.target.value)}
              className="w-full p-2 mb-2 border border-gray-300 rounded"
            />
            <input
              type="time"
              value={slot.endTime}
              onChange={(e) => handleChangeSlot(index, "endTime", e.target.value)}
              className="w-full p-2 mb-2 border border-gray-300 rounded"
            />
            <input
              type="text"
              value={slot.address}
              onChange={(e) => handleChangeSlot(index, "address", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter schedule address"
            />
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddSlot}
          className="w-full mb-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        >
          Add Another Slot
        </button>

        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 bg-green-500 text-white rounded hover:bg-green-700"
        >
          {loading ? "Adding..." : "Add Truck"}
        </button>
      </form>
    </div>
  );
}
