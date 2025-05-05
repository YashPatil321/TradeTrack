"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface BookingModalProps {
  service: any;
  isOpen: boolean;
  onCloseAction: () => void;
}

interface ServiceOption {
  id: string;
  name: string;
  rate: number;
  timeLimit: string;
  description: string;
  category: string;
  materials?: Array<{name: string, price: number}>;
}

interface ServiceDetails {
  name: string;
  estimatedTime: string;
  durationHours: number;
  price: number;
  materialName?: string;
  materialPrice?: number;
  totalPrice?: number;
}

export default function NewBookingModal({ service, isOpen, onCloseAction }: BookingModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedService, setSelectedService] = useState<string>('');
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [materialOptions, setMaterialOptions] = useState<Array<{name: string, price: number}>>([]);
  const [materialPrice, setMaterialPrice] = useState<number>(0);
  const [materialName, setMaterialName] = useState<string>('');
  const [totalPrice, setTotalPrice] = useState<number>(0);

  // Initialize data on component mount
  useEffect(() => {
    if (!service) return;
    console.log('Handyman service data received:', service);
    
    // Make sure we're only working with handyman services
    if (service.trade !== 'handyman') {
      console.error('Error: This is not a handyman service');
      return;
    }
    
    // Generate dates (next 7 days)
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    }
    setAvailableDates(dates);
    
    // Set default time slots
    setAvailableTimes([
      '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
    ]);
    
    // CRITICAL: Process specific services from MongoDB
    if (service.services && Array.isArray(service.services) && service.services.length > 0) {
      console.log('MongoDB handyman services found:', service.services);
      
      // Map each service to our required format
      const serviceOptions = service.services.map((s: any, index: number) => {
        // These are the exact services the handyman selected when signing up
        // service.service is the actual service name (e.g., "Faucet Replacement")
        return {
          id: `service-${index}`,
          name: s.service,
          rate: s.rate,
          timeLimit: s.timeLimit,
          description: s.description || '',
          category: s.category,
          materials: Array.isArray(s.materials) ? s.materials : []
        };
      });
      
      console.log('Processed service options:', serviceOptions);
      
      // Sort services by category
      serviceOptions.sort((a: ServiceOption, b: ServiceOption) => {
        if (a.category < b.category) return -1;
        if (a.category > b.category) return 1;
        return 0;
      });
      
      setServices(serviceOptions);
      console.log('Loaded structured services:', serviceOptions);
      
      // If there's only one service, pre-select it
      if (serviceOptions.length === 1) {
        setSelectedService(serviceOptions[0].id);
      }
    } else if (service.skillsAndServices) {
      // Legacy format (fallback)
      const serviceList = service.skillsAndServices.split(',').map((s: string, index: number) => ({
        id: 'service-' + index,
        name: s.trim(),
        rate: service.price || 75,
        timeLimit: '1 hour',
        description: '',
        category: 'General'
      }));
      setServices(serviceList);
      console.log('Loaded legacy services:', serviceList);
    } else {
      // Use the service itself as a single option if no specific services found
      const fallbackService = {
        id: service._id || 'service-0',
        name: service.name || 'General Handyman Service',
        rate: service.price || 75,
        timeLimit: '1 hour',
        description: service.description || '',
        category: 'General'
      };
      setServices([fallbackService]);
      setSelectedService(fallbackService.id);
      console.log('Created fallback service:', fallbackService);
    }
  }, [service]);

  // Calculate service details when service changes
  useEffect(() => {
    if (!selectedService) {
      setServiceDetails(null);
      setMaterialOptions([]);
      setMaterialPrice(0);
      setMaterialName('');
      setSelectedMaterial('');
      setTotalPrice(0);
      return;
    }
    
    // Find the selected service details
    console.log('Looking for service with ID:', selectedService);
    console.log('Available services:', services);
    
    const selected = services.find((s) => s.id === selectedService);
    console.log('Selected service:', selected);
    
    if (!selected) return;
    
    // If the service has materials, set them as options
    if (selected.materials && selected.materials.length > 0) {
      setMaterialOptions(selected.materials);
    } else {
      setMaterialOptions([]);
    }
    
    // Calculate duration hours based on time limit string
    let durationHours = 1;
    const timeLimit = selected.timeLimit || '1 hour';
    if (timeLimit.includes('1.5')) durationHours = 1.5;
    else if (timeLimit.includes('2')) durationHours = 2;
    else if (timeLimit.includes('2.5')) durationHours = 2.5;
    else if (timeLimit.includes('3')) durationHours = 3;
    
    const price = selected.rate;
    const totalPriceValue = price + materialPrice;
    
    setServiceDetails({
      name: selected.name,
      estimatedTime: timeLimit,
      durationHours: durationHours,
      price: price,
      materialName: materialName,
      materialPrice: materialPrice,
      totalPrice: totalPriceValue
    });
    
    setTotalPrice(totalPriceValue);
    
  }, [selectedService, services, materialPrice, materialName]);

  // Fetch booked slots when date or service changes
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (service?._id && selectedDate) {
        try {
          const res = await fetch(`/api/bookings/booked?serviceId=${service._id}&date=${encodeURIComponent(selectedDate)}`);
          const data = await res.json();
          if (data.success) setBookedSlots(data.bookedSlots);
        } catch (err) {
          console.error('Error fetching booked slots:', err);
        }
      }
    };
    fetchBookedSlots();
  }, [selectedDate, service?._id]);

  // Generate time slots when date or service changes
  useEffect(() => {
    if (!selectedDate || !serviceDetails) {
      console.log('Missing required data:', { selectedDate, serviceDetails });
      return;
    }
    
    // Clear any previously selected time when date or service changes
    setSelectedTime('');
    
    // Parse service hours (assuming format like "9-5" or "10-6")
    let startHour = 9;
    let endHour = 17; // 5 PM
    
    // Default hours if none are specified
    if (!service.hours) {
      console.log('No hours specified, using default 9-5');
    } else {
      try {
        const hoursParts = service.hours.split('-');
        if (hoursParts.length === 2) {
          const start = parseInt(hoursParts[0].trim().split(':')[0]);
          const end = parseInt(hoursParts[1].trim().split(':')[0]);
          
          if (!isNaN(start)) startHour = start;
          if (!isNaN(end)) endHour = end;
          
          console.log(`Parsed hours from ${service.hours}: ${startHour}-${endHour}`);
        }
      } catch (err) {
        console.log('Error parsing hours:', err);
      }
    }
    
    // Basic validation to ensure we have a valid time range
    if (startHour >= endHour) {
      console.log('Invalid hours range, resetting to default');
      startHour = 9;
      endHour = 17;
    }
    
    // Generate time slots based on service duration
    const times = [];
    
    // Ensure duration is valid (default to 1 hour if not)
    const durationHours = serviceDetails.durationHours > 0 ? serviceDetails.durationHours : 1;
    
    console.log('Generating time slots with duration:', durationHours, 'hours');
    console.log(`Available window: ${startHour} to ${endHour}`);
    
    // Generate fixed time slots regardless of duration to ensure we always have options
    for (let hour = startHour; hour < endHour; hour++) {
      // Create an hourly slot
      const amPm = hour < 12 ? 'AM' : 'PM';
      const displayHour = hour <= 12 ? hour : hour - 12;
      const slotTime = `${displayHour}:00 ${amPm}`;
      times.push(slotTime);
      
      // Add half-hour slot if there's room
      if (hour + 0.5 < endHour) {
        const halfSlotTime = `${displayHour}:30 ${amPm}`;
        times.push(halfSlotTime);
      }
    }
    
    console.log('Generated time slots:', times);
    if (times.length === 0) {
      console.warn('No time slots were generated! Adding default slots.');
      times.push('9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM');
    }
    
    setAvailableTimes(times);
  }, [selectedDate, serviceDetails, service?.hours]);

  // Filter available times to exclude booked slots
  const availableSlots = availableTimes.filter(time => 
    !bookedSlots.includes(time)
  );

  if (!isOpen) return null;

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedService(e.target.value);
    // Reset material selection when service changes
    setSelectedMaterial('');
    setMaterialPrice(0);
    setMaterialName('');
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTime(e.target.value);
    console.log(`Selected time: ${e.target.value}`);
  };

  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const materialId = e.target.value;
    setSelectedMaterial(materialId);
    
    if (materialId === '') {
      setMaterialPrice(0);
      setMaterialName('');
    } else {
      const material = materialOptions.find(m => m.name === materialId);
      if (material) {
        setMaterialPrice(material.price);
        setMaterialName(material.name);
      }
    }
  };

  // Update total price when material price changes
  useEffect(() => {
    if (!serviceDetails) return;
    setTotalPrice(serviceDetails.price + materialPrice);
  }, [materialPrice, serviceDetails]);

  const handleProceedToPayment = () => {
    console.log('Payment proceeding with:', { selectedService, selectedDate, selectedTime, serviceDetails });
    if (!selectedService || !selectedDate || !selectedTime || !serviceDetails) {
      alert('Please make sure you have selected a service, date, and time slot.');
      return;
    }
    
    setLoading(true);
    
    // Create query parameters
    let queryParams = new URLSearchParams({
      serviceId: service._id || '',
      service: selectedService,
      serviceName: serviceDetails.name,
      date: selectedDate,
      time: selectedTime,
      estimatedTime: serviceDetails.estimatedTime,
      price: totalPrice.toString()
    });
    
    // Add material info if selected
    if (materialName && materialPrice > 0) {
      queryParams.append('materialName', materialName);
      queryParams.append('materialPrice', materialPrice.toString());
    }
    
    // Redirect to payment page
    router.push(`/payment?${queryParams.toString()}`);
    onCloseAction();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onCloseAction}>
      <div className="w-full max-w-md p-6 bg-white rounded-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Book Service</h2>
          <button 
            onClick={onCloseAction}
            className="text-xl font-bold cursor-pointer"
            type="button"
          >
            ×
          </button>
        </div>
        
        {/* Service Selection */}
        <div className="mb-4">
          <label className="block mb-2 font-semibold text-gray-900">Select Service*</label>
          <div className="relative">
            <select 
              id="service-select"
              value={selectedService}
              onChange={handleServiceChange}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm cursor-pointer bg-white text-black"
              required
            >
              <option value="">Choose a service...</option>
              
              {/* Group services by category */}
              {Array.from(new Set(services.map(s => s.category))).map(category => (
                <optgroup key={category} label={category}>
                  {services
                    .filter(s => s.category === category)
                    .map(service => (
                      <option key={service.id} value={service.id} className="text-black">
                        {service.name} - ${service.rate} flat rate ({service.timeLimit})
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          {selectedService && services.find(s => s.id === selectedService)?.description && (
            <p className="mt-1 text-sm text-gray-600 italic">{services.find(s => s.id === selectedService)?.description}</p>
          )}
        </div>
        
        {/* Material Selection - only shown if the selected service has materials */}
        {selectedService && materialOptions.length > 0 && (
          <div className="mb-4">
            <label htmlFor="material" className="block mb-2 font-semibold text-gray-900">Select Materials</label>
            <div className="relative">
              <select
                id="material"
                value={selectedMaterial}
                onChange={handleMaterialChange}
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer bg-white text-black"
              >
                <option value="">No materials needed</option>
                {materialOptions.map((material) => (
                  <option key={material.name} value={material.name} className="text-black">
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
        
        {/* Price Summary */}
        {serviceDetails && (
          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded">
            <h4 className="font-medium text-gray-900 mb-2">Price Summary</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-700">Service Fee:</span>
                <span className="text-gray-900">${serviceDetails.price.toFixed(2)}</span>
              </div>
              
              {materialName && materialPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Materials ({materialName}):</span>
                  <span className="text-gray-900">${materialPrice.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold pt-2 border-t border-gray-200 mt-2">
                <span>Total:</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
            <p className="mt-2 text-sm italic text-black">
              Note: Service will take approximately {serviceDetails.estimatedTime}. If the service takes longer than this time limit, additional charges may apply.
            </p>
          </div>
        )}
        
        {/* Date Selection */}
        <div className="mb-4">
          <label className="block mb-2 font-semibold text-gray-900">Select Date*</label>
          <div className="relative">
            <select 
              id="date-select"
              value={selectedDate}
              onChange={handleDateChange}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer bg-white text-black"
              required
            >
              <option value="">Choose a date...</option>
              {availableDates.map((date, index) => (
                <option key={index} value={date} className="text-black">{date}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Time Selection */}
        {selectedDate && (
          <div className="mb-4">
            <label htmlFor="time-select" className="block mb-2 font-semibold text-gray-900">Select Time*</label>
            <div className="relative">
              <select 
                id="time-select"
                value={selectedTime}
                onChange={handleTimeChange}
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer bg-white text-black"
                required
              >
                <option value="">Choose a time...</option>
                {availableTimes.map((time, index) => (
                  <option key={index} value={time} className="text-black">{time}</option>
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
        
        {/* Buttons */}
        <div className="flex justify-between mt-6">
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              onCloseAction();
            }}
            className="px-4 py-2 font-bold text-gray-700 bg-gray-200 rounded hover:bg-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancel
          </a>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              console.log('Trying to proceed with:', { selectedService, selectedDate, selectedTime });
              if (selectedService && selectedDate && selectedTime) {
                handleProceedToPayment();
              }
            }}
            className={`px-4 py-2 font-bold rounded focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              selectedService && selectedDate && selectedTime
                ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                : 'bg-blue-300 text-white cursor-not-allowed'
            }`}
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </a>
        </div>
      </div>
    </div>
  );
}
