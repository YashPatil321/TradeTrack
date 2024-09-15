"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddressInput() {
  const [address, setAddress] = useState('');
  const [truckName, setTruckName] = useState('');
  const [truckImage, setTruckImage] = useState('');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [restrictions, setRestrictions] = useState([]);
  const [mealTimes, setMealTimes] = useState([]);
  const [schedule, setSchedule] = useState([{ day: '', time: '', address: '' }]); // Changed to address

  const router = useRouter();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const newTruck = {
      address,
      truckName,
      truckImage,
      description,
      hours,
      currentLocation,
      cuisine,
      restrictions,
      mealTimes,
      schedule, // Includes schedule in the saved truck
    };
    let trucks = JSON.parse(localStorage.getItem('trucks') || '[]');
    trucks.push(newTruck);
    localStorage.setItem('trucks', JSON.stringify(trucks));
    router.push('/');
  };

  const addScheduleSlot = () => {
    setSchedule([...schedule, { day: '', time: '', address: '' }]); // Changed to address
  };

  const updateSchedule = (index: number, field: string, value: string) => {
    const updatedSchedule = schedule.map((slot, i) => i === index ? { ...slot, [field]: value } : slot);
    setSchedule(updatedSchedule);
  };

  const handleRestrictionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) {
      setRestrictions([...restrictions, value]);
    } else {
      setRestrictions(restrictions.filter(restriction => restriction !== value));
    }
  };

  const handleMealTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) {
      setMealTimes([...mealTimes, value]);
    } else {
      setMealTimes(mealTimes.filter(time => time !== value));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-black">Add New Truck Location</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-2xl space-y-4">
        
        <div>
          <label className="block text-black mb-2">Truck Name</label>
          <input
            type="text"
            value={truckName}
            onChange={(e) => setTruckName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black" // Made text black
            required
          />
        </div>

        <div>
          <label className="block text-black mb-2">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black" // Made text black
            required
          />
        </div>

        <div>
          <label className="block text-black mb-2">Truck Image URL</label>
          <input
            type="text"
            value={truckImage}
            onChange={(e) => setTruckImage(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black" // Made text black
          />
        </div>

        <div>
          <label className="block text-black mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black" // Made text black
            rows="3"
          />
        </div>

        <div>
          <label className="block text-black mb-2">Hours of Operation</label>
          <input
            type="text"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black" // Made text black
          />
        </div>

        <div>
          <label className="block text-black mb-2">Cuisine Type</label>
          <select
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black" // Made text black
          >
            <option value="" disabled>Select Cuisine</option>
            <option value="Mexican">Mexican</option>
            <option value="Italian">Italian</option>
            <option value="American">American</option>
            <option value="Asian">Asian</option>
            {/* Add more cuisine options as needed */}
          </select>
        </div>

        <div>
          <label className="block text-black mb-2">Dietary Restrictions</label>
          <div className="flex space-x-4">
            <label className="text-black">
              <input type="checkbox" value="Vegetarian" onChange={handleRestrictionChange} /> Vegetarian
            </label>
            <label className="text-black">
              <input type="checkbox" value="Vegan" onChange={handleRestrictionChange} /> Vegan
            </label>
            <label className="text-black">
              <input type="checkbox" value="Kosher" onChange={handleRestrictionChange} /> Kosher
            </label>
          </div>
        </div>

        <div>
          <label className="block text-black mb-2">Meal Times</label>
          <div className="flex space-x-4">
            <label className="text-black">
              <input type="checkbox" value="Breakfast" onChange={handleMealTimeChange} /> Breakfast
            </label>
            <label className="text-black">
              <input type="checkbox" value="Lunch" onChange={handleMealTimeChange} /> Lunch
            </label>
            <label className="text-black">
              <input type="checkbox" value="Dinner" onChange={handleMealTimeChange} /> Dinner
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
                onChange={(e) => updateSchedule(index, 'day', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-black" // Made text black
                placeholder="E.g. Monday"
              />
            </div>
            <div className="mb-2">
              <label className="block text-black">Time</label>
              <input
                type="text"
                value={slot.time}
                onChange={(e) => updateSchedule(index, 'time', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-black" // Made text black
                placeholder="E.g. 10:00 AM - 2:00 PM"
              />
            </div>
            <div className="mb-2">
              <label className="block text-black">Address</label> {/* Replaced lat/lng with address */}
              <input
                type="text"
                value={slot.address}
                onChange={(e) => updateSchedule(index, 'address', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-black" // Made text black
              />
            </div>
          </div>
        ))}
        <button type="button" onClick={addScheduleSlot} className="bg-blue-500 text-white p-2 rounded w-full">
          Add Another Schedule Slot
        </button>

        <button type="submit" className="mt-4 bg-green-500 text-white p-2 rounded w-full">
          Submit
        </button>
      </form>
    </div>
  );
}
