"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface BookingModalProps {
  service: any;
  isOpen: boolean;
  onCloseAction: () => void;
}

interface ServiceDetails {
  name: string;
  estimatedTime: string;
  durationHours: number;
  price: number;
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
  const [services, setServices] = useState<string[]>([]);

  // Initialize data on component mount
  useEffect(() => {
    if (service && service.skillsAndServices) {
      // Set available services
      const serviceList = service.skillsAndServices.split(',').map((s: string) => s.trim());
      setServices(serviceList);
      
      // Generate dates (next 7 days)
      const dates = [];
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
      }
      setAvailableDates(dates);
    }
  }, [service]);

  // Calculate service details when service changes
  useEffect(() => {
    if (!selectedService) {
      setServiceDetails(null);
      return;
    }

    // Determine service details based on the service name
    let estimatedTime = "1 hour";
    let durationHours = 1;
    let price = service.price || 75;
    
    const lowerCaseService = selectedService.toLowerCase();
    
    if (lowerCaseService.includes('repair') || lowerCaseService.includes('install')) {
      estimatedTime = "2 hours";
      durationHours = 2;
      price = service.price ? service.price * 1.5 : 110;
    } else if (lowerCaseService.includes('maintenance') || lowerCaseService.includes('plumbing')) {
      estimatedTime = "1.5 hours";
      durationHours = 1.5;
      price = service.price ? service.price * 1.25 : 95;
    } else if (lowerCaseService.includes('electrical')) {
      estimatedTime = "2.5 hours";
      durationHours = 2.5;
      price = service.price ? service.price * 1.75 : 125;
    }
    
    setServiceDetails({
      name: selectedService,
      estimatedTime,
      durationHours,
      price
    });
  }, [selectedService, service.price]);

  // Generate time slots when date or service changes
  useEffect(() => {
    if (!selectedDate || !serviceDetails) return;
    
    // Parse service hours (assuming format like "9-5" or "10-6")
    let startHour = 9;
    let endHour = 17; // 5 PM
    
    if (service.hours) {
      const hoursParts = service.hours.split('-');
      if (hoursParts.length === 2) {
        const start = parseInt(hoursParts[0].trim().split(':')[0]);
        let end = parseInt(hoursParts[1].trim().split(':')[0]);
        
        if (!isNaN(start)) startHour = start;
        if (!isNaN(end)) endHour = end;
      }
    }
    
    // Generate time slots based on service duration
    const times = [];
    const durationHours = serviceDetails.durationHours;
    
    // For each possible start time, check if the service can be completed before closing
    for (let i = startHour; i <= endHour - durationHours; i += 0.5) {
      // Format the time (handle half hours)
      const isHalfHour = i % 1 !== 0;
      const hour = Math.floor(i);
      const minutes = isHalfHour ? "30" : "00";
      
      let formattedTime;
      if (hour < 12) {
        formattedTime = `${hour}:${minutes} AM`;
      } else if (hour === 12) {
        formattedTime = `12:${minutes} PM`;
      } else {
        formattedTime = `${hour-12}:${minutes} PM`;
      }
      
      // Format end time
      const endTime = i + durationHours;
      const endHour = Math.floor(endTime);
      const endMinutes = endTime % 1 !== 0 ? "30" : "00";
      
      let formattedEndTime;
      if (endHour < 12) {
        formattedEndTime = `${endHour}:${endMinutes} AM`;
      } else if (endHour === 12) {
        formattedEndTime = `12:${endMinutes} PM`;
      } else {
        formattedEndTime = `${endHour-12}:${endMinutes} PM`;
      }
      
      times.push(`${formattedTime} - ${formattedEndTime}`);
    }
    
    setAvailableTimes(times);
  }, [selectedDate, serviceDetails, service.hours]);

  if (!isOpen) return null;

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedService(e.target.value);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTime(e.target.value);
  };

  const handleProceedToPayment = () => {
    if (!selectedService || !selectedDate || !selectedTime || !serviceDetails) return;
    setLoading(true);
    
    // Redirect to payment page with all necessary details
    router.push(`/payment?service=${encodeURIComponent(selectedService)}&date=${encodeURIComponent(selectedDate)}&time=${encodeURIComponent(selectedTime)}&estimatedTime=${encodeURIComponent(serviceDetails.estimatedTime)}&price=${serviceDetails.price}&serviceId=${encodeURIComponent(service._id || '')}`);
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
          <label className="block mb-2 font-semibold text-gray-900">Select Service</label>
          <select 
            value={selectedService}
            onChange={handleServiceChange}
            className="w-full p-2 border border-gray-300 rounded cursor-pointer"
          >
            <option value="">Choose a service...</option>
            {services.map((service, index) => (
              <option key={index} value={service}>{service}</option>
            ))}
          </select>
        </div>
        
        {serviceDetails && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
            <p className="font-semibold text-gray-900">Estimated time: {serviceDetails.estimatedTime}</p>
            <p className="font-semibold text-gray-900">Price: ${serviceDetails.price.toFixed(2)} hourly</p>
            <p className="mt-1 text-sm italic text-yellow-600">
              Note: If the service takes longer than estimated, additional charges may apply.
            </p>
          </div>
        )}
        
        {/* Date Selection */}
        <div className="mb-4">
          <label className="block mb-2 font-semibold text-gray-900">Select Date</label>
          <select 
            value={selectedDate}
            onChange={handleDateChange}
            className="w-full p-2 border border-gray-300 rounded cursor-pointer"
          >
            <option value="">Choose a date...</option>
            {availableDates.map((date, index) => (
              <option key={index} value={date}>{date}</option>
            ))}
          </select>
        </div>
        
        {/* Time Selection */}
        {selectedDate && (
          <div className="mb-4">
            <label className="block mb-2 font-semibold text-gray-900">Select Time</label>
            <select 
              value={selectedTime}
              onChange={handleTimeChange}
              className="w-full p-2 border border-gray-300 rounded cursor-pointer text-gray-900 font-medium"
            >
              <option value="">Choose a time...</option>
              {availableTimes.map((time, index) => (
                <option key={index} value={time}>{time}</option>
              ))}
            </select>
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
            className="px-4 py-2 font-bold text-gray-700 bg-gray-200 rounded hover:bg-gray-300 cursor-pointer"
          >
            Cancel
          </a>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              if (selectedService && selectedDate && selectedTime) {
                handleProceedToPayment();
              }
            }}
            className={`px-4 py-2 font-bold rounded ${
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
