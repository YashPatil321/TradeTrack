"use client";

import { useState } from "react";

export default function UpdateSchedule() {
  const [truckName, setTruckName] = useState("");
  const [schedule, setSchedule] = useState([]);

  const handleUpdateSchedule = () => {
    const storedTrucks = localStorage.getItem("trucks");
    let trucks = storedTrucks ? JSON.parse(storedTrucks) : [];
    
    // Find truck and update its schedule
    const updatedTrucks = trucks.map(truck => {
      if (truck.name === truckName) {
        return { ...truck, schedule };
      }
      return truck;
    });

    localStorage.setItem("trucks", JSON.stringify(updatedTrucks));
    alert("Schedule updated successfully!");
  };

  const handleAddSlot = () => {
    setSchedule([...schedule, { startTime: "", endTime: "", lat: "", lng: "" }]);
  };

  const handleChangeSlot = (index, field, value) => {
    const updatedSchedule = schedule.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    );
    setSchedule(updatedSchedule);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Update Truck Schedule</h2>

        <div className="mb-4">
          <label htmlFor="truckName" className="block text-lg mb-2 text-gray-700">Truck Name</label>
          <input
            id="truckName"
            type="text"
            value={truckName}
            onChange={(e) => setTruckName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter truck name"
          />
        </div>

        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-3 text-gray-800">Schedule</h3>
          {schedule.map((slot, index) => (
            <div key={index} className="mb-4">
              <input
                type="text"
                value={slot.startTime}
                onChange={(e) => handleChangeSlot(index, 'startTime', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Start Time (HH:MM)"
              />
              <input
                type="text"
                value={slot.endTime}
                onChange={(e) => handleChangeSlot(index, 'endTime', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="End Time (HH:MM)"
              />
              <input
                type="text"
                value={slot.lat}
                onChange={(e) => handleChangeSlot(index, 'lat', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Latitude"
              />
              <input
                type="text"
                value={slot.lng}
                onChange={(e) => handleChangeSlot(index, 'lng', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Longitude"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddSlot}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-300"
          >
            Add Another Slot
          </button>
        </div>

        <button
          onClick={handleUpdateSchedule}
          className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition duration-300"
        >
          Update Schedule
        </button>
      </div>
    </div>
  );
}
