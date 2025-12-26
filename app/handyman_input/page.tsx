"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, SessionProvider } from "next-auth/react";
// Service data types and inline data
interface ServiceItem {
  id: string;
  name: string;
  category: string;
  price?: string;
  timeLimit?: string;
  description?: string;
}

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
}

// Inline service data to replace missing utils/serviceData
const getAllServices = (): ServiceItem[] => [
  { 
    id: "tv-shelf-mounting", 
    name: "TV & Shelf Mounting", 
    category: "handyman",
    price: "$85",
    timeLimit: "2 hours",
    description: "Professional TV mounting and shelf installation"
  },
  { 
    id: "furniture-assembly", 
    name: "Furniture Assembly", 
    category: "handyman",
    price: "$95",
    timeLimit: "3 hours",
    description: "Expert furniture assembly and setup"
  },
  { 
    id: "picture-hanging", 
    name: "Picture Hanging", 
    category: "handyman",
    price: "$65",
    timeLimit: "1 hour",
    description: "Professional picture and artwork hanging"
  },
  { 
    id: "minor-repairs", 
    name: "Minor Repairs", 
    category: "handyman",
    price: "$75",
    timeLimit: "2 hours",
    description: "Small household repairs and fixes"
  }
];

const getAllCategories = (): CategoryItem[] => [
  { id: "handyman", name: "Handyman Services", icon: "🔨" },
  { id: "plumbing", name: "Plumbing", icon: "🔧" },
  { id: "electrician", name: "Electrician Services", icon: "⚡" },
  { id: "painting", name: "Painting Services", icon: "🎨" }
];
import Link from "next/link";
import Image from "next/image";

// Service provider registration page
function HandymanInputContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Provider information
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  
  // Service selection
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [availableServices, setAvailableServices] = useState<ServiceItem[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  // Form state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  // Load available services and categories
  useEffect(() => {
    try {
      const services = getAllServices();
      setAvailableServices(services);
      
      const categories = getAllCategories();
      if (categories.length > 0) {
        setSelectedCategory(categories[0].id);
      }
    } catch (err) {
      console.error("Error loading services:", err);
      setError("Failed to load available services. Please try again later.");
    }
  }, []);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);
  
  // Filter services by selected category
  const filteredServices = availableServices.filter(
    service => service.category === selectedCategory
  );
  
  // Toggle service selection
  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };
  
  // Geocode address to get coordinates
  const geocodeAddress = async (address: string) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        setCoordinates({ lat: location.lat, lng: location.lng });
        return true;
      } else {
        setError("Could not find the address. Please check and try again.");
        return false;
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setError("Error finding address. Please try again.");
      return false;
    }
  };
  
  // Handle address input with geocoding
  const handleAddressChange = async (value: string) => {
    setAddress(value);
    if (value.length > 10) { // Only geocode if address is reasonably long
      await geocodeAddress(value);
    }
  };
  
  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImageUrl(previewUrl);
    }
  };
  
  // Handle drag and drop for images
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImageUrl(previewUrl);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.email) {
      setError("You must be logged in to register as a service provider");
      return;
    }
    
    if (!name || !description || !phoneNumber || !address) {
      setError("Please fill in all required fields");
      return;
    }
    
    if (!coordinates) {
      setError("Please enter a valid address so we can locate you on the map");
      return;
    }
    
    if (selectedServices.length === 0) {
      setError("Please select at least one service to offer");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Format selected services for the Service model
      const formattedServices = selectedServices.map(serviceId => {
        const service = availableServices.find(s => s.id === serviceId);
        return {
          service: service?.name || "",
          category: service?.category || "",
          rate: service?.price || 0,
          timeLimit: service?.timeLimit || "1 hour",
          description: service?.description || ""
        };
      });
      
      // Upload image if provided
      let finalImageUrl = imageUrl;
      if (imageFile) {
        // For now, use the preview URL. In production, you'd upload to a cloud service
        // TODO: Implement actual image upload to cloud storage
        finalImageUrl = imageUrl; // Using preview URL for now
      }
      
      // Create the service data matching the Service model
      const serviceData = {
        name,
        description,
        image: finalImageUrl || "https://via.placeholder.com/300x200?text=Handyman+Service",
        hours: "Monday-Friday 9AM-5PM", // Consistent hours as requested
        phoneNumber,
        mainLocation: address,
        trade: "handyman", // Specific trade type
        userEmail: session.user.email,
        // GeoJSON location structure with actual coordinates
        location: {
          type: "Point",
          coordinates: [coordinates.lng, coordinates.lat] // [longitude, latitude]
        },
        // Include the specific services offered
        services: formattedServices
      };
      
      // Submit to API - using the services endpoint to match other trade forms
      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to register handyman service");
      }
      
      setSuccess(true);
      
      // Reset form
      setSelectedServices([]);
      setName("");
      setDescription("");
      setImageUrl("");
      setImageFile(null);
      setPhoneNumber("");
      setAddress("");
      setCoordinates(null);
      
      // Redirect to profile after 2 seconds
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || "An error occurred while registering your services");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-16 bg-gray-100">
      {/* Fixed Nav Bar */}
      <nav className="fixed top-0 left-0 w-full bg-blue-600 text-white p-4 z-50 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-xl font-bold">TradesMonk</div>
          <ul className="flex space-x-4">
            <li>
              <Link href="/" className="hover:text-gray-200">
                Home
              </Link>
            </li>
            <li>
              <Link href="/profile" className="hover:text-gray-200">
                Profile
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      
      <div className="container mx-auto px-4 pt-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Register as a Service Provider</h1>
          
          {success ? (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              <p className="text-center">Your profile has been created successfully! Redirecting to your profile...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                  <p>{error}</p>
                </div>
              )}
              
              {/* Personal Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                      Full Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                      Phone Number *
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                    Service Address *
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                      coordinates ? 'border-green-500' : address.length > 10 ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter your full service address (e.g., 123 Main St, San Diego, CA 92101)"
                    required
                  />
                  {coordinates && (
                    <p className="text-green-600 text-sm mt-1">✓ Address verified and located on map</p>
                  )}
                  {address.length > 10 && !coordinates && (
                    <p className="text-red-600 text-sm mt-1">Please enter a valid address</p>
                  )}
                </div>
                
                {/* Hours are now fixed to 9-5 as requested */}
                <div className="mb-4">
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-blue-800 text-sm">
                      <strong>Service Hours:</strong> Monday-Friday 9AM-5PM (Standard for all TradesMonk providers)
                    </p>
                  </div>
                </div>
                
                {/* Image Upload with Drag and Drop */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Profile Image
                  </label>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    {imageUrl ? (
                      <div className="space-y-4">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="mx-auto h-32 w-32 object-cover rounded-lg"
                        />
                        <p className="text-green-600 text-sm">Image selected successfully!</p>
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImageUrl("");
                          }}
                          className="text-red-600 text-sm hover:underline"
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-gray-400">
                          <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-600">Drag and drop your image here, or</p>
                          <label className="cursor-pointer">
                            <span className="text-blue-600 hover:text-blue-500 font-medium">browse to upload</span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageChange}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                    About You/Your Services *
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                    placeholder="Describe your experience, qualifications, and what makes your service special..."
                    required
                  />
                </div>
              </div>
              
              {/* Service Selection */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Services You Offer</h2>
                
                {/* Category Selection */}
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Service Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {getAllCategories().map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          selectedCategory === category.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Services List */}
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Select Services to Offer (Select all that apply)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredServices.map((service) => (
                      <div 
                        key={service.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedServices.includes(service.id)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => toggleServiceSelection(service.id)}
                      >
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(service.id)}
                            onChange={() => toggleServiceSelection(service.id)}
                            className="mt-1 mr-3"
                          />
                          <div>
                            <h3 className="font-bold text-gray-800">{service.name}</h3>
                            <p className="text-sm text-gray-600">{service.description}</p>
                            <div className="mt-2 flex justify-between text-sm">
                              <span className="text-blue-600 font-medium">{service.price || 'Price TBD'}</span>
                              <span className="text-gray-500">{service.timeLimit || 'Time TBD'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                  ))}
                </div>
              </div>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md focus:outline-none focus:shadow-outline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Submitting..." : "Register as Service Provider"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Main component with SessionProvider
export default function HandymanInput() {
  return (
    <SessionProvider>
      <HandymanInputContent />
    </SessionProvider>
  );
}