"use client";

import { useState } from "react";

export default function AddressInput() {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      setError("Please enter a valid address.");
      return;
    }

    // Geocode address to get latitude and longitude
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=AIzaSyA-TlVuQXWUgjmMxpLS4qmWjv164jkl75c`;

    try {
      const response = await fetch(geocodeUrl);
      const data = await response.json();

      if (data.status === "OK") {
        const { lat, lng } = data.results[0].geometry.location;

        // Replace with actual API call to store truck location
        console.log("Latitude:", lat, "Longitude:", lng);
        setSuccess("Truck location added successfully!");
        setError("");
      } else {
        setError("Failed to get location. Try a different address.");
        setSuccess("");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
      setSuccess("");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#faedc8]">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Add Truck Location</h2>

        <div className="mb-4">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="Enter address"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-yellow-500 text-white p-3 rounded-lg hover:bg-yellow-600 transition-colors duration-300"
        >
          Add Truck
        </button>

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
        {success && <p className="text-green-500 mt-4 text-center">{success}</p>}
      </form>
    </div>
  );
}
