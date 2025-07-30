"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, SessionProvider } from "next-auth/react";
import { getAllServices, getAllCategories, ServiceItem } from "../utils/serviceData";
import Link from "next/link";
import Image from "next/image";

// Service provider registration page
function HandymanInputContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Provider information
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [availableHours, setAvailableHours] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  
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
        setSelectedCategory(categories[0]);
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
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.email) {
      setError("You must be logged in to register as a service provider");
      return;
    }
    
    if (!name || !description || !availableHours || !phoneNumber || !location) {
      setError("Please fill in all required fields");
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
      
      // Create the service data matching the Service model
      const serviceData = {
        name,
        description,
        image: imageUrl,
        hours: availableHours,
        phoneNumber,
        mainLocation: location,
        trade: "handyman", // Specific trade type
        userEmail: session.user.email,
        // GeoJSON location structure expected by the Service model
        location: {
          type: "Point",
          coordinates: [0, 0] // Will be updated when geocoding is added
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
      setAvailableHours("");
      setPhoneNumber("");
      setLocation("");
      
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
          <div className="text-xl font-bold">TradersTap</div>
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
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
                    Service Area/Location *
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="e.g., Downtown, North Side, etc."
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hours">
                    Available Hours *
                  </label>
                  <input
                    id="hours"
                    type="text"
                    value={availableHours}
                    onChange={(e) => setAvailableHours(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="e.g., Mon-Fri: 9AM-5PM, Weekends: 10AM-2PM"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image">
                    Profile Image URL
                  </label>
                  <input
                    id="image"
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="https://example.com/your-image.jpg"
                  />
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
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          selectedCategory === category
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {category}
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
                              <span className="text-blue-600 font-medium">${service.price.toFixed(2)}</span>
                              <span className="text-gray-500">{service.timeLimit}</span>
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