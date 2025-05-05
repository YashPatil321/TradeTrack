"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, SessionProvider } from "next-auth/react";
import Link from "next/link";
import { FileUploader } from "react-drag-drop-files";
import Image from 'next/image';

function PlumberInput() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to login if unauthenticated (optional)
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const [serviceArea, setServiceArea] = useState("");
  const [plumberName, setPlumberName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState("");
  const [certifications, setCertifications] = useState("");
  const [schedule, setSchedule] = useState([{ day: "", time: "", address: "" }]);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const fileTypes = ["JPG", "PNG", "GIF", "JPEG"];

  const handleImageChange = (file: File) => {
    setImage(file);
    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Geocode an address to get its lat/lng using Google Geocoding API
  const geocodeAddress = async (addr: string) => {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        addr
      )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    if (data.status === "OK") {
      return data.results[0].geometry.location;
    } else {
      console.error("Geocoding Error:", data.status, data.error_message);
      return { lat: null, lng: null };
    }
  };

  const uploadImage = async () => {
    if (!image) return null;
    
    setIsUploading(true);
    
    // In a real implementation, you would:
    // 1. Create a FormData object
    // 2. Send it to your backend API
    // 3. Upload to a service like AWS S3, Cloudinary, etc.
    // 4. Return the URL of the uploaded image
    
    // For the prototype, we'll simulate this with a delay and return a placeholder URL
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsUploading(false);
    
    // This is just a placeholder URL. In production, you'd return the actual URL from your image hosting service
    return `https://example.com/uploaded-images/${image.name}`;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Geocode the main service area address
    const mainCoords = await geocodeAddress(serviceArea);
    if (
      mainCoords.lat === null ||
      mainCoords.lng === null ||
      (mainCoords.lat === 0 && mainCoords.lng === 0)
    ) {
      setConfirmationMessage(
        "Error: The service area address is invalid. Please check and try again."
      );
      return;
    }
    
    // Use the service area as the main location for the schedule
    const mainScheduleSlot = {
      day: "Main Location",
      time: "N/A", // Default value, change if needed
      address: serviceArea,
      lat: mainCoords.lat,
      lng: mainCoords.lng,
    };

    // Process additional schedule entries (filter out empty addresses)
    const filteredSchedule = schedule.filter(
      (slot) => slot.address && slot.address.trim() !== ""
    );
    const scheduleWithCoords = await Promise.all(
      filteredSchedule.map(async (slot) => {
        const coords = await geocodeAddress(slot.address);
        return { ...slot, lat: coords.lat, lng: coords.lng };
      })
    );
    const finalSchedule = [mainScheduleSlot, ...scheduleWithCoords];
    console.log("Final Schedule Data with Lat/Lng:", finalSchedule);

    const hasInvalid = finalSchedule.some(
      (slot) =>
        slot.lat === null ||
        slot.lng === null ||
        (slot.lat === 0 && slot.lng === 0)
    );
    if (hasInvalid) {
      setConfirmationMessage(
        "Error: One or more addresses are invalid. Please check and try again."
      );
      return;
    }

    // Ensure the user is logged in and has an email
    if (!session?.user?.email) {
      setConfirmationMessage("Error: You must be logged in to add a service.");
      return;
    }

    // Upload the image and get the URL
    let imageUrl = null;
    if (image) {
      imageUrl = await uploadImage();
      if (!imageUrl) {
        setConfirmationMessage("Error uploading image. Please try again.");
        return;
      }
    }

    // Build the new plumber object; trade is set to "plumber"
    const newPlumber = {
      name: plumberName,
      image: imageUrl || imagePreview || "", // Use the uploaded URL or the preview for testing
      description,
      hours,
      certifications,
      mainLocation: serviceArea,
      schedule: finalSchedule,
      userEmail: session.user.email, // Associate with logged-in user
      trade: "plumber",
    };

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlumber),
      });
      const json = await res.json();
      if (json.success) {
        setConfirmationMessage("Plumber service listed successfully!");
        console.log("Plumber service successfully added!", newPlumber);
        router.push("/profile"); // Redirect to profile after submission
      } else {
        setConfirmationMessage("Error creating plumber service: " + json.error);
      }
    } catch (error) {
      console.error("Error creating plumber service:", error);
      setConfirmationMessage("Error creating plumber service, please try again later.");
    }
  };

  const addScheduleSlot = () => {
    setSchedule([...schedule, { day: "", time: "", address: "" }]);
  };

  const updateSchedule = (index: number, field: string, value: string) => {
    const updated = schedule.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    );
    setSchedule(updated);
  };

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#f5d9bc" }}>
      {/* Fixed Nav Bar */}
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
              <Link href="/list_your_service" legacyBehavior>
                <a className="hover:text-gray-300">List Your Service</a>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <h1 className="text-3xl font-bold mb-6 text-black pt-20">List Your Plumber Service</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-2xl space-y-4">
        {/* Plumber Name */}
        <div>
          <label className="block text-black mb-2">Plumber Name</label>
          <input
            type="text"
            value={plumberName}
            onChange={(e) => setPlumberName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
            required
          />
        </div>

        {/* Service Area (Address) */}
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

        {/* Plumber Image Upload */}
        <div>
          <label className="block text-black mb-2">Upload Image</label>
          <div className="border-2 border-dashed border-gray-300 p-4 rounded">
            <FileUploader
              handleChange={handleImageChange}
              name="image"
              types={fileTypes}
              label="Drag & drop an image here or click to browse"
            />
            {imagePreview && (
              <div className="relative w-full h-48 mb-4">
                <Image
                  src={imagePreview}
                  alt="Service preview"
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-black mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
            rows={3}
          />
        </div>

        {/* Hours of Operation */}
        <div>
          <label className="block text-black mb-2">Hours of Operation</label>
          <input
            type="text"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
          />
        </div>

        {/* Certifications / Specialties */}
        <div>
          <label className="block text-black mb-2">Certifications / Specialties</label>
          <input
            type="text"
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-black"
            placeholder="E.g., Licensed, 24/7 Emergency Service"
          />
        </div>

        {/* Schedule Section (Optional) */}
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
                placeholder="E.g., 9 AM - 5 PM"
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
        <button
          type="button"
          onClick={addScheduleSlot}
          className="bg-blue-500 text-white p-2 rounded w-full"
        >
          Add Another Schedule Slot
        </button>

        <button
          type="submit"
          className="mt-4 bg-green-500 text-white p-2 rounded w-full"
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Submit"}
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

export default function PlumberInputPage() {
  return (
    <SessionProvider>
      <PlumberInput />
    </SessionProvider>
  );
}