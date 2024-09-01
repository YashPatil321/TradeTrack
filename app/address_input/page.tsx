"use client"; // This marks the file as a Client Component

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddressInput() {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  };

  const geocodeAddress = async (address: string) => {
    const apiKey = 'AIzaSyA-TlVuQXWUgjmMxpLS4qmWjv164jkl75c'; // Replace with your actual API key
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status === 'OK') {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    } else {
      setError('Address not found. Please try again.');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const coords = await geocodeAddress(address);
    if (coords) {
      // Save the new location in local storage
      const savedLocations = JSON.parse(localStorage.getItem('truckLocations') || '[]');
      const newLocation = { lat: coords.lat, lng: coords.lng, title: address };
      localStorage.setItem('truckLocations', JSON.stringify([...savedLocations, newLocation]));

      // Navigate back to the Home page with the new coordinates
      router.replace('/');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#faedc8] p-8">
      <h1 className="text-2xl font-bold mb-4 text-black">Add New Truck Location</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="mb-4">
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded"
            value={address}
            onChange={handleAddressChange}
            placeholder="Enter address"
            required
            style={{ color: 'black', backgroundColor: '#fff' }} // Set input text color to black
          />
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
        >
          Add Location
        </button>
      </form>
    </div>
  );
}
