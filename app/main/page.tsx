"use client";

import { useEffect, useState } from 'react';

interface Truck {
  truckName: string;
  address: string;
  description: string;
  hours: string;
  cuisine: string;
  currentLocation: string;
  restrictions: string[];
  mealTimes: string[];
  schedule: { day: string; time: string; address: string }[];
}

export default function MainPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);

  useEffect(() => {
    const storedTrucks = JSON.parse(localStorage.getItem('trucks') || '[]');
    setTrucks(storedTrucks);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-black">Food Truck Locations</h1>
      <div className="w-full max-w-2xl space-y-4">
        {trucks.map((truck, index) => (
          <div key={index} className="bg-white p-6 rounded shadow-md">
            <h2 className="text-2xl font-bold text-black">{truck.truckName}</h2>
            <p className="text-black"><strong>Address:</strong> {truck.address}</p>
            <p className="text-black"><strong>Description:</strong> {truck.description}</p>
            <p className="text-black"><strong>Hours:</strong> {truck.hours}</p>
            <p className="text-black"><strong>Cuisine:</strong> {truck.cuisine}</p>
            <p className="text-black"><strong>Current Location:</strong> {truck.currentLocation}</p>
            <p className="text-black"><strong>Dietary Restrictions:</strong> {truck.restrictions.join(', ')}</p>
            <p className="text-black"><strong>Meal Times:</strong> {truck.mealTimes.join(', ')}</p>
            <div className="text-black">
              <strong>Schedule:</strong>
              <ul>
                {truck.schedule.map((slot: any, i: number) => (
                  <li key={i}>{slot.day} - {slot.time} at {slot.address}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
