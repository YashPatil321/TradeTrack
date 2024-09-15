"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Locator() {
  const [locations, setLocations] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

            marker.addListener('mouseover', () => {
              infoWindow.open(map, marker);
            });

            marker.addListener('mouseout', () => {
              infoWindow.close();
            });

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

  // Search near me functionality
  const searchNearMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const map = new window.google.maps.Map(document.getElementById('map'), {
          zoom: 12,
          center: { lat: latitude, lng: longitude },
        });

        locations.forEach((truck) => {
          truck.schedule.forEach((slot) => {
            const marker = new window.google.maps.Marker({
              position: { lat: slot.lat, lng: slot.lng },
              map,
              title: truck.name,
            });
          });
        });
      });
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTruck(null);
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

      <div className="bg-white p-4 shadow-md fixed top-16 left-0 w-full z-40 flex justify-center">
        <div className="container mx-auto flex items-center justify-center bg-orange-100 rounded p-4">
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="cuisine" className="text-gray-800">Cuisine:</label>
              <select id="cuisine" className="bg-gray-100 text-gray-800 border border-gray-300 p-2 rounded">
                <option value="">Select Cuisine</option>
                <option value="mexican">Mexican</option>
                <option value="asian">Asian</option>
                <option value="italian">Italian</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label htmlFor="dietary-restrictions" className="text-gray-800">Dietary Restrictions:</label>
              <select id="dietary-restrictions" className="bg-gray-100 text-gray-800 border border-gray-300 p-2 rounded">
                <option value="">Select Restriction</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="kosher">Kosher</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label htmlFor="meal-times" className="text-gray-800">Meal Times:</label>
              <div className="flex space-x-2">
                <label>
                  <input type="checkbox" value="breakfast" className="mr-1" />
                  <span className="text-black">Breakfast</span>
                </label>
                <label>
                  <input type="checkbox" value="lunch" className="mr-1" />
                  <span className="text-black">Lunch</span>
                </label>
                <label>
                  <input type="checkbox" value="dinner" className="mr-1" />
                  <span className="text-black">Dinner</span>
                </label>
              </div>
            </div>

            <button onClick={searchNearMe} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700">
              Search Near Me
            </button>
          </div>
        </div>
      </div>

      <main className="flex min-h-screen flex-col items-center justify-between p-24" style={{ backgroundColor: '#f5d9bc' }}>
        <div id="map" style={{ height: '800px', width: '75%' }}></div>

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
        )}
      </main>
    </>
  );
}
