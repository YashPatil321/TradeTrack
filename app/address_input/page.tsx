"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddressInput() {
  const [truckName, setTruckName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!truckName || !address) {
      alert("Please enter both a truck name and address.");
      return;
    }

    setLoading(true);

    try {
      // Geocode address to get lat/lng
      const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=AIzaSyA-TlVuQXWUgjmMxpLS4qmWjv164jkl75c`;

      const response = await fetch(geocodingUrl);
      const data = await response.json();

      if (data.status !== "OK") {
        alert("Failed to fetch location data. Please try again.");
        setLoading(false);
        return;
      }

      const { lat, lng } = data.results[0].geometry.location;

      // Create a new truck object
      const newTruck = {
        name: truckName,
        lat,
        lng,
      };

      // Save new truck to localStorage
      const storedTrucks = localStorage.getItem("trucks");
      const trucks = storedTrucks ? JSON.parse(storedTrucks) : [];
      trucks.push(newTruck);
      localStorage.setItem("trucks", JSON.stringify(trucks));

      alert("Truck location added successfully!");

      // Redirect to the map page
      router.push("/");

    } catch (error) {
      alert("An error occurred while adding the truck.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#faf0e6" }}>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Add Truck Location</h2>

        <div className="mb-4">
          <label htmlFor="truckName" className="block text-lg mb-2 text-gray-700">Truck Name</label>
          <input
            id="truckName"
            type="text"
            value={truckName}
            onChange={(e) => setTruckName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
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
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
            placeholder="Enter address"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition duration-300"
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Truck Location"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="w-full bg-green-500 text-white py-3 mt-4 rounded hover:bg-green-600 transition duration-300"
        >
          See Map
        </button>
      </form>
    </div>
  );
}
