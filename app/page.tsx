"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Locator() {
  const [locations, setLocations] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    cuisine: '',
    vegetarian: false,
    vegan: false,
    kosher: false,
    mealTimes: {
      breakfast: false,
      lunch: false,
      dinner: false
    },
    searchQuery: ''
  });

  // Fetch trucks from localStorage
  useEffect(() => {
    const storedTrucks = localStorage.getItem('trucks');
    if (storedTrucks) {
      setLocations(JSON.parse(storedTrucks));
    }
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyA-TlVuQXWUgjmMxpLS4qmWjv164jkl75c&callback=initMap&v=weekly`;
    script.async = true;
    script.defer = true;

    window.initMap = function () {
      const map = new window.google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: { lat: 39.8283, lng: -98.5795 },
      });

      locations.forEach((truck) => {
        if (Array.isArray(truck.schedule)) {
          truck.schedule.forEach((slot) => {
            const marker = new window.google.maps.Marker({
              position: { lat: slot.lat, lng: slot.lng },
              map,
              title: truck.name,
              icon: {
                url: 'food-truck.png',
                scaledSize: new window.google.maps.Size(50, 50),
              },
            });

            const infoWindowContent = `
              <div style="padding: 10px; max-width: 200px; color: black;">
                <img src="${truck.image}" alt="${truck.name}" style="width: 100px; height: auto;" />
                <h3>${truck.name}</h3>
                <p>Current Location: ${slot.address}</p>
              </div>
            `;

            const infoWindow = new window.google.maps.InfoWindow({
              content: infoWindowContent,
            });

            // On hover: show a small image and current location
            marker.addListener('mouseover', () => {
              infoWindow.open(map, marker);
            });

            marker.addListener('mouseout', () => {
              infoWindow.close();
            });

            // On click: open the modal with full details
            marker.addListener('click', () => {
              setSelectedTruck(truck);
              setIsModalOpen(true);
            });
          });
        }
      });
    };

    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [locations]);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTruck(null);
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFilters({
        ...filters,
        [name]: checked
      });
    } else {
      setFilters({
        ...filters,
        [name]: value
      });
    }
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
                name="cuisine"
                value={filters.cuisine}
                onChange={handleFilterChange}
                className="border rounded p-2"
              >
                <option value="">All</option>
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
                name="vegetarian"
                checked={filters.vegetarian}
                onChange={handleFilterChange}
                className="mr-2"
              />
              <label className="mr-4">Vegetarian</label>

              <input
                type="checkbox"
                name="vegan"
                checked={filters.vegan}
                onChange={handleFilterChange}
                className="mr-2"
              />
              <label className="mr-4">Vegan</label>

              <input
                type="checkbox"
                name="kosher"
                checked={filters.kosher}
                onChange={handleFilterChange}
                className="mr-2"
              />
              <label>Kosher</label>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-lg">Meal Times:</label>
              <input
                type="checkbox"
                name="mealTimes.breakfast"
                checked={filters.mealTimes.breakfast}
                onChange={handleFilterChange}
                className="mr-2"
              />
              <label className="mr-4">Breakfast</label>

              <input
                type="checkbox"
                name="mealTimes.lunch"
                checked={filters.mealTimes.lunch}
                onChange={handleFilterChange}
                className="mr-2"
              />
              <label className="mr-4">Lunch</label>

              <input
                type="checkbox"
                name="mealTimes.dinner"
                checked={filters.mealTimes.dinner}
                onChange={handleFilterChange}
                className="mr-2"
              />
              <label>Dinner</label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                name="searchQuery"
                value={filters.searchQuery}
                onChange={handleFilterChange}
                placeholder="Search Near Me"
                className="border rounded p-2"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="flex min-h-screen flex-col items-center justify-between p-24" style={{ backgroundColor: '#f5d9bc' }}>
        <div id="map" style={{ height: '800px', width: '100%' }}></div>

        {isModalOpen && selectedTruck && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeModal}
          >
            <div className="bg-white p-6 rounded-lg max-w-xl w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-4 text-black">{selectedTruck.name}</h2>
              <img
                src={selectedTruck.image}
                alt={selectedTruck.name}
                className="w-full h-auto mb-4"
              />
              <p className="text-black"><strong>Description:</strong> {selectedTruck.description}</p>
              <p className="text-black"><strong>Hours:</strong> {selectedTruck.hours}</p>
              <button
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
