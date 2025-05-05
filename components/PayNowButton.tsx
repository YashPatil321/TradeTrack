"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PayNowButtonProps {
  serviceId: string;
  className?: string;
}

interface ServiceDetails {
  _id: string;
  name: string;
  services?: Array<{
    service: string;
    category: string;
    rate: number;
    timeLimit: string;
    description: string;
    materialName?: string | null;
    materialPrice?: number;
    totalPrice?: number;
    materials?: Array<{
      name: string;
      price: number;
    }>;
  }>;
}

export default function PayNowButton({ serviceId, className = '' }: PayNowButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [serviceOptions, setServiceOptions] = useState<any[]>([]);
  const [materialOptions, setMaterialOptions] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [serviceRate, setServiceRate] = useState(0);
  const [materialPrice, setMaterialPrice] = useState(0);
  const [materialName, setMaterialName] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]);

  // All possible time slots
  const allTimeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ];

  // Fetch service details when modal opens
  useEffect(() => {
    if (showModal) {
      fetchServiceDetails();
      // Reset date and time selections when opening modal
      setSelectedDate('');
      setSelectedTime('');
      setAvailableTimeSlots([]);
    }
  }, [showModal]);
  
  // Fetch booked time slots when a date is selected
  useEffect(() => {
    if (selectedDate && serviceId) {
      fetchBookedTimeSlots(selectedDate);
    }
  }, [selectedDate, serviceId]);

  // Calculate total amount when service or material changes
  useEffect(() => {
    setTotalAmount(serviceRate + materialPrice);
  }, [serviceRate, materialPrice]);

  // Fetch booked time slots for a specific date
  const fetchBookedTimeSlots = async (date: string) => {
    try {
      // Fetch bookings for this service on the selected date
      const response = await fetch(`/api/services/${serviceId}/bookings?date=${date}`);
      const data = await response.json();
      
      if (data.success) {
        // Extract booked time slots
        const booked = data.bookings.map((booking: any) => booking.time);
        setBookedTimeSlots(booked);
        
        // Filter out booked time slots
        const available = allTimeSlots.filter(time => !booked.includes(time));
        setAvailableTimeSlots(available);
        
        // If the currently selected time is now booked, reset it
        if (booked.includes(selectedTime)) {
          setSelectedTime('');
        }
      } else {
        // If error or no bookings found, all slots are available
        setBookedTimeSlots([]);
        setAvailableTimeSlots([...allTimeSlots]);
      }
    } catch (error) {
      console.error('Error fetching booked time slots:', error);
      // On error, assume all slots are available
      setBookedTimeSlots([]);
      setAvailableTimeSlots([...allTimeSlots]);
    }
  };
  
  // Fetch service details from API
  const fetchServiceDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/services/${serviceId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setServiceDetails(data.data);
        
        // Create service options from the service details
        if (data.data.services && data.data.services.length > 0) {
          const options = data.data.services.map((service: any) => ({
            id: service.service,
            name: service.service,
            rate: service.rate,
            timeLimit: service.timeLimit,
            description: service.description,
            materials: service.materials || [],
            category: service.category
          }));
          
          setServiceOptions(options);
        }
      }
    } catch (error) {
      console.error('Error fetching service details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle service selection change
  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const serviceId = e.target.value;
    setSelectedService(serviceId);
    
    // Find the selected service
    const service = serviceOptions.find(s => s.id === serviceId);
    if (service) {
      setServiceRate(service.rate);
      
      // Update material options based on selected service
      if (service.materials && service.materials.length > 0) {
        setMaterialOptions(service.materials);
      } else {
        setMaterialOptions([]);
      }
      
      // Reset material selection
      setSelectedMaterial('');
      setMaterialPrice(0);
      setMaterialName('');
    }
  };

  // Handle material selection change
  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const materialId = e.target.value;
    setSelectedMaterial(materialId);
    
    if (materialId === '') {
      setMaterialPrice(0);
      setMaterialName('');
      return;
    }
    
    // Find the selected material
    const material = materialOptions.find(m => m.name === materialId);
    if (material) {
      setMaterialPrice(material.price);
      setMaterialName(material.name);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService || !selectedDate || !selectedTime) {
      return;
    }
    
    // Find the selected service details
    const service = serviceOptions.find(s => s.id === selectedService);
    if (!service) return;
    
    // Calculate total amount
    const amount = serviceRate + materialPrice;
    
    // Prepare payment data
    const paymentData = {
      serviceId,
      serviceName: service.name,
      amount,
      selectedService,
      selectedMaterial,
      date: selectedDate,
      time: selectedTime,
      additionalInstructions: notes, // Store the additional instructions
      serviceNotes: notes, // Also include as serviceNotes for the API
    };
    
    // Store payment details in localStorage for later use
    localStorage.setItem('pendingBooking', JSON.stringify(paymentData));
    
    // Navigate to payment page
    router.push(`/payment?service=${serviceId}`);
  };

  // Get tomorrow's date as the default minimum date for booking
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors ${className}`}
      >
        Book Now
      </button>
      
      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-blue-600 text-white px-6 py-4">
              <h3 className="text-xl font-bold">Book Service</h3>
              <p className="text-blue-100">Complete your booking details</p>
            </div>
            
            {loading ? (
              <div className="p-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-700">Loading service details...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  {/* Service Selection */}
                  <div>
                    <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">Select Service*</label>
                    <div className="relative">
                      <select
                        id="service"
                        value={selectedService}
                        onChange={handleServiceChange}
                        className="block w-full p-3 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                        required
                      >
                        <option value="">-- Select a service --</option>
                        {serviceOptions.map(service => (
                          <option key={service.id} value={service.id}>
                            {service.name} - ${service.rate} ({service.timeLimit})
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    {selectedService && serviceOptions.find(s => s.id === selectedService)?.description && (
                      <p className="mt-1 text-sm text-gray-500">{serviceOptions.find(s => s.id === selectedService)?.description}</p>
                    )}
                  </div>
                  
                  {/* Materials Selection - only shown if the selected service has materials */}
                  {materialOptions.length > 0 && (
                    <div>
                      <label htmlFor="material" className="block text-sm font-medium text-gray-700 mb-1">Select Materials</label>
                      <div className="relative">
                        <select
                          id="material"
                          value={selectedMaterial}
                          onChange={handleMaterialChange}
                          className="block w-full p-3 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                          <option value="">No materials needed</option>
                          {materialOptions.map(material => (
                            <option key={material.name} value={material.name}>
                              {material.name} - ${material.price}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Date and Time Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Select Date*</label>
                      <input
                        type="date"
                        id="date"
                        min={getTomorrowDate()}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">Select Time*</label>
                      <div className="relative">
                        <select
                          id="time"
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          className="block w-full p-3 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                          required
                        >
                          <option value="">-- Select a time --</option>
                          {availableTimeSlots.map((time: string) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Notes */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                    <textarea
                      id="notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Specify any special requirements or additional information"
                    ></textarea>
                  </div>
                  
                  {/* Price Summary */}
                  {selectedService && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                      <h4 className="font-medium text-gray-900 mb-2">Price Summary</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Service Fee:</span>
                          <span className="text-gray-900">${serviceRate.toFixed(2)}</span>
                        </div>
                        
                        {selectedMaterial && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Materials ({materialName}):</span>
                            <span className="text-gray-900">${materialPrice.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between font-bold pt-2 border-t border-gray-200 mt-2">
                          <span>Total:</span>
                          <span>${totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
