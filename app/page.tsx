"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
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
              <div style="padding: 10px; max-width: 200px;">
                <h3>${truck.name}</h3>
                <p>Cuisine: ${truck.cuisine}</p>
                <p>Hours: ${slot.startTime} - ${slot.endTime}</p>
                <button style="color: blue; cursor: pointer;" id="view-more-${truck.id}">View More</button>
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

      <main className="flex min-h-screen flex-col items-center justify-between p-24" style={{ backgroundColor: '#f5d9bc' }}>
        <div id="map" style={{ height: '800px', width: '75%' }}></div>

        {isModalOpen && selectedTruck && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeModal}
          >
            <div className="bg-white p-6 rounded-lg max-w-xl w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-4">{selectedTruck.name}</h2>
              <p>Cuisine: {selectedTruck.cuisine}</p>
              <p>Schedule:</p>
              <ul>
                {selectedTruck.schedule.map((slot, index) => (
                  <li key={index}>
                    {slot.startTime} - {slot.endTime}
                  </li>
                ))}
              </ul>
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
