"use client";

import { useState } from 'react';

export default function AddressInput() {
  const [truckName, setTruckName] = useState('');
  const [address, setAddress] = useState('');
  const [truckImage, setTruckImage] = useState('');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [vegetarian, setVegetarian] = useState(false);
  const [vegan, setVegan] = useState(false);
  const [kosher, setKosher] = useState(false);
  const [mealTimes, setMealTimes] = useState({
    breakfast: false,
    lunch: false,
    dinner: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const truckData = {
      name: truckName,
      address,
      image: truckImage,
      description,
      hours,
      currentLocation,
      cuisine,
      dietaryRestrictions: {
        vegetarian,
        vegan,
        kosher
      },
      mealTimes
    };

    let trucks = JSON.parse(localStorage.getItem('trucks')) || [];
    trucks.push(truckData);
    localStorage.setItem('trucks', JSON.stringify(trucks));

    // Clear form
    setTruckName('');
    setAddress('');
    setTruckImage('');
    setDescription('');
    setHours('');
    setCurrentLocation('');
    setCuisine('');
    setVegetarian(false);
    setVegan(false);
    setKosher(false);
    setMealTimes({
      breakfast: false,
      lunch: false,
      dinner: false
    });

    alert('Truck information added successfully!');
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-black text-white p-4 z-50 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-xl font-bold">TruckTrack</div>
          <ul className="flex space-x-4">
            <li>
              <Link href="/" legacyBehavior>
                <a className="hover:text-gray-300">Locator</a>
              </Link>
            </li>
            <li>
              <Link href="/about" legacyBehavior>
                <a className="hover:text-gray-300">About</a>
              </Link>
            </li>
            <li>
              <Link href="/services" legacyBehavior>
                <a className="hover:text-gray-300">Services</a>
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

      <div className="bg-white p-4 shadow-md fixed top-16 left-0 w-full z-40">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-lg">Cuisine:</label>
              <select
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="border rounded p-2"
              >
                <option value="">Select Cuisine</option>
                <option value="Mexican">Mexican</option>
                <option value="Italian">Italian</option>
                <option value="Chinese">Chinese</option>
                <option value="Indian">Indian</option>
                {/* Add more options as needed */}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-lg">Dietary Restrictions:</label>
              <input
                type="checkbox"
                checked={vegetarian}
                onChange={(e) => setVegetarian(e.target.checked)}
                className="mr-2"
              />
              <label className="mr-4">Vegetarian</label>

              <input
                type="checkbox"
                checked={vegan}
                onChange={(e) => setVegan(e.target.checked)}
                className="mr-2"
              />
              <label className="mr-4">Vegan</label>

              <input
                type="checkbox"
                checked={kosher}
                onChange={(e) => setKosher(e.target.checked)}
                className="mr-2"
              />
              <label>Kosher</label>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-lg">Meal Times:</label>
              <input
                type="checkbox"
                checked={mealTimes.breakfast}
                onChange={(e) => setMealTimes(prev => ({ ...prev, breakfast: e.target.checked }))}
                className="mr-2"
              />
              <label className="mr-4">Breakfast</label>

              <input
                type="checkbox"
                checked={mealTimes.lunch}
                onChange={(e) => setMealTimes(prev => ({ ...prev, lunch: e.target.checked }))}
                className="mr-2"
              />
              <label className="mr-4">Lunch</label>

              <input
                type="checkbox"
                checked={mealTimes.dinner}
                onChange={(e) => setMealTimes(prev => ({ ...prev, dinner: e.target.checked }))}
                className="mr-2"
              />
              <label>Dinner</label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search Near Me"
                className="border rounded p-2"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="flex min-h-screen flex-col items-center justify-between p-24" style={{ backgroundColor: '#f5d9bc' }}>
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Add Truck Location</h2>
          <div className="mb-4">
            <label className="block text-gray-700">Truck Name:</label>
            <input
              type="text"
              value={truckName}
              onChange={(e) => setTruckName(e.target.value)}
              className="border rounded p-2 w-full"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Address:</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="border rounded p-2 w-full"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Truck Image URL:</label>
            <input
              type="text"
              value={truckImage}
              onChange={(e) => setTruckImage(e.target.value)}
              className="border rounded p-2 w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border rounded p-2 w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Hours of Operation:</label>
            <input
              type="text"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="border rounded p-2 w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Current Location:</label>
            <input
              type="text"
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
              className="border rounded p-2 w-full"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
          >
            Add Truck
          </button>
        </form>
      </main>
    </>
  );
}
