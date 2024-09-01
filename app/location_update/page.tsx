"use client"; // This marks the file as a Client Component

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ManageTrucks() {
  const [trucks, setTrucks] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const storedTrucks = JSON.parse(localStorage.getItem('trucks') || '[]');
    setTrucks(storedTrucks);
  }, []);

  const handleUpdateLocation = (truck) => {
    router.push(`/address_input?truckId=${truck.id}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#faedc8]">
      <h1 className="text-2xl font-bold mb-4 text-black">Manage Truck Locations</h1>
      <ul className="w-full max-w-sm">
        {trucks.map((truck) => (
          <li key={truck.id} className="mb-4">
            <div className="flex justify-between items-center p-2 border border-gray-300 rounded bg-white">
              <span>{truck.name}</span>
              <button
                className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
                onClick={() => handleUpdateLocation(truck)}
              >
                Update Location
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
