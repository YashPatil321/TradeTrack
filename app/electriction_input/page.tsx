"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ElectricianInput() {
  const [electricianName, setElectricianName] = useState("");
  const [electricianImage, setElectricianImage] = useState("");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [license, setLicense] = useState("");
  const [schedule, setSchedule] = useState([{ day: "", time: "", address: "" }]);
  const [confirmationMessage, setConfirmationMessage] = useState("");

  const router = useRouter();

  const addScheduleSlot = () => {
    setSchedule([...schedule, { day: "", time: "", address: "" }]);
  };

  const updateSchedule = (index: number, field: string, value: string) => {
    const updatedSchedule = schedule.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    );
    setSchedule(updatedSchedule);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const newElectrician = {
      name: electricianName,
      image: electricianImage,
      description,
      hours,
      serviceArea,
      license,
      schedule,
      mainLocation: serviceArea,
    };

    let electricians = JSON.parse(localStorage.getItem("electricians") || "[]");
    electricians.push(newElectrician);
    localStorage.setItem("electricians", JSON.stringify(electricians));

    setConfirmationMessage("Electrician service listed successfully!");
    router.refresh();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#f5d9bc" }}>
      {/* Nav Bar */}
      <nav className="fixed top-0 left-0 w-full bg-black text-white p-4 z-50 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-xl font-bold">ServiceHub</div>
          <ul className="flex space-x-4">
            <li>
              <Link href="/" legacyBehavior>
                <a className="hover:text-gray-300">Home</a>
              </Link>
            </li>
            <li>
              <Link href="/about" legacyBehavior>
                <a className="hover:text-gray-300">About</a>
              </Link>
            </li>
            <li>
              <Link href="/list-your-service" legacyBehavior>
                <a className="hover:text-gray-300">List Your Service</a>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <h1 className="text-3xl font-bold mb-6 text-black pt-20">List Your Electrician Service</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-2xl space-y-4">
        <div>
          <label className="block text-black mb-2">Electrician Name</label>
          <input
            type="text"
            value={electricianName}
            onChange={(e) => setElectricianName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
            required
          />
        </div>
        <div>
          <label className="block text-black mb-2">Service Area (Address)</label>
          <input
            type="text"
            value={serviceArea}
            onChange={(e) => setServiceArea(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
            required
          />
        </div>
        <div>
          <label className="block text-black mb-2">Electrician Image URL</label>
          <input
            type="text"
            value={electricianImage}
            onChange={(e) => setElectricianImage(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
          />
        </div>
        <div>
          <label className="block text-black mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-black mb-2">Hours of Operation</label>
          <input
            type="text"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
          />
        </div>
        <div>
          <label className="block text-black mb-2">License Number</label>
          <input
            type="text"
            value={license}
            onChange={(e) => setLicense(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
            placeholder="Enter your electrician license number"
          />
        </div>

        <h2 className="text-2xl font-bold text-black">Schedule (Optional)</h2>
        {schedule.map((slot, index) => (
          <div key={index} className="border border-gray-300 p-4 mb-4 rounded">
            <div className="mb-2">
              <label className="block text-black">Day</label>
              <input
                type="text"
                value={slot.day}
                onChange={(e) => updateSchedule(index, "day", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-black"
                placeholder="E.g., Monday"
              />
            </div>
            <div className="mb-2">
              <label className="block text-black">Time</label>
              <input
                type="text"
                value={slot.time}
                onChange={(e) => updateSchedule(index, "time", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-black"
                placeholder="E.g., 8 AM - 5 PM"
              />
            </div>
            <div className="mb-2">
              <label className="block text-black">Address</label>
              <input
                type="text"
                value={slot.address}
                onChange={(e) => updateSchedule(index, "address", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-black"
                placeholder="Optional: Additional service location"
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
        {confirmationMessage && (
          <div className="mt-4 p-4 bg-gray-200 rounded text-black">
            {confirmationMessage}
          </div>
        )}
      </form>
    </div>
  );
}
