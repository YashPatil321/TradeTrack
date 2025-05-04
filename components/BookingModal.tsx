"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface BookingModalProps {
  service: any;
  isOpen: boolean;
  onCloseAction: () => void;
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  date: string;
}

interface ServiceOption {
  name: string;
  estimatedTime: string;
  price: number;
}

export default function BookingModal({ service, isOpen, onCloseAction }: BookingModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
  
  // Refs for interactive elements
  const serviceSelectRef = React.useRef<HTMLSelectElement>(null);
  const dateSelectRef = React.useRef<HTMLSelectElement>(null);
  const timeSlotSelectRef = React.useRef<HTMLSelectElement>(null);
  const cancelButtonRef = React.useRef<HTMLButtonElement>(null);
  const proceedButtonRef = React.useRef<HTMLButtonElement>(null);
  
  // Generate available dates (next 7 days) and service options
  useEffect(() => {
    // Generate dates
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const formattedDate = date.toISOString().split('T')[0];
      dates.push(formattedDate);
    }
    
    setAvailableDates(dates);
    setSelectedDate(dates[0]);
    
    // Parse service options from skillsAndServices
    if (service && service.skillsAndServices) {
      const services = service.skillsAndServices.split(',').map((s: string) => s.trim());
      
      const options: ServiceOption[] = services.map((name: string, index: number) => {
        // Assign different estimated times and prices to different services
        let estimatedTime = "1 hour";
        let price = service.price || 75;
        
        // Vary times and prices based on service complexity (sample logic)
        if (name.toLowerCase().includes('repair') || name.toLowerCase().includes('install')) {
          estimatedTime = "2 hours";
          price = service.price ? service.price * 1.5 : 110;
        } else if (name.toLowerCase().includes('maintenance')) {
          estimatedTime = "1.5 hours";
          price = service.price ? service.price * 1.25 : 95;
        }
        
        return { name, estimatedTime, price };
      });
      
      setServiceOptions(options);
      if (options.length > 0) {
        setSelectedService(options[0]);
      }
    }
    
    // Focus service select when modal opens
    setTimeout(() => {
      if (serviceSelectRef.current) {
        serviceSelectRef.current.focus();
      }
    }, 100);
  }, [service]);  
  
  // Generate time slots based on service hours
  useEffect(() => {
    if (!service || !selectedDate) return;
    
    // Parse service hours (assuming format like "9-5" or "10-6")
    let startHour = 9;
    let endHour = 17;
    
    if (service.hours) {
      const hoursParts = service.hours.split('-');
      if (hoursParts.length === 2) {
        const start = parseInt(hoursParts[0].trim().split(':')[0]);
        let end = parseInt(hoursParts[1].trim().split(':')[0]);
        
        if (!isNaN(start)) startHour = start;
        if (!isNaN(end)) endHour = end;
      }
    }
    
    // Generate hourly slots - make sure there are at least 5 slots available
    const slots: TimeSlot[] = [];
    const availableCount = Math.floor(Math.random() * 3) + 5; // 5-7 available slots
    const availableHours = new Set();
    
    // Pre-select random available hours
    while (availableHours.size < availableCount) {
      const hour = startHour + Math.floor(Math.random() * (endHour - startHour));
      availableHours.add(hour);
    }
    
    // Create all slots
    for (let hour = startHour; hour < endHour; hour++) {
      const slotId = `${selectedDate}-${hour}`;
      const formattedHour = hour < 12 ? `${hour}:00 AM` : hour === 12 ? `12:00 PM` : `${hour-12}:00 PM`;
      const nextHour = hour + 1;
      const formattedNextHour = nextHour < 12 ? `${nextHour}:00 AM` : nextHour === 12 ? `12:00 PM` : `${nextHour-12}:00 PM`;
      
      slots.push({
        id: slotId,
        time: `${formattedHour} - ${formattedNextHour}`,
        available: availableHours.has(hour),
        date: selectedDate
      });
    }
    
    setTimeSlots(slots);
    setSelectedSlot(null);
  }, [selectedDate, service]);
  
  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDate(e.target.value);
    // After date change, focus on the time slot select
    setTimeout(() => {
      if (timeSlotSelectRef.current) {
        timeSlotSelectRef.current.focus();
      }
    }, 100);
  };
  
  const handleServiceChange = (service: ServiceOption) => {
    setSelectedService(service);
    // After service selection, focus on the date select
    setTimeout(() => {
      if (dateSelectRef.current) {
        dateSelectRef.current.focus();
      }
    }, 100);
  };
  
  const handleSlotSelect = (slotId: string) => {
    setSelectedSlot(slotId);
    // After slot selection, focus on the proceed button
    setTimeout(() => {
      if (proceedButtonRef.current) {
        proceedButtonRef.current.focus();
      }
    }, 100);
  };
  
  const handleBooking = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!selectedSlot || !selectedService) return;
    setLoading(true);
    // In a real application, you would make an API call here
    // For demo purposes, we'll just redirect to a success page after a delay
    setTimeout(() => {
      router.push('/booking-success');
    }, 1500);
  };
  
  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onCloseAction();
  };
  
  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCloseAction();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={() => onCloseAction()} // Close when clicked outside
      onKeyDown={handleKeyDown}
    >
      <div 
        className="bg-white rounded-lg p-8 max-w-md w-full"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Book Service</h1>
          <button
            onClick={onCloseAction}
            className="text-gray-500 hover:text-gray-700 text-xl cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Service</h2>
          <div className="mb-2">
            <select 
              ref={serviceSelectRef}
              className="w-full p-3 border border-gray-300 rounded cursor-pointer"
              onChange={(e) => {
                const selected = serviceOptions.find(option => option.name === e.target.value);
                if (selected) handleServiceChange(selected);
              }}
              value={selectedService?.name || ''}
              tabIndex={0}
            >
              <option value="" disabled>Choose a service...</option>
              {serviceOptions.map((option, index) => (
                <option key={index} value={option.name}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          
          {selectedService && (
            <div className="mt-4 mb-5">
              <p className="text-gray-800">Estimated service time: <span className="font-semibold">{selectedService.estimatedTime}</span></p>
              <p className="text-gray-800">Price: <span className="font-semibold">${selectedService.price.toFixed(2)} hourly</span></p>
              <p className="text-yellow-600 text-sm italic mt-2">
                Note: If the service takes longer than estimated, additional charges may apply at the same hourly rate.
              </p>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-4">Select Date</h2>
          <select
            ref={dateSelectRef}
            value={selectedDate}
            onChange={handleDateChange}
            className="w-full p-3 border border-gray-300 rounded cursor-pointer"
            tabIndex={0}
          >
            <option value="" disabled>Select a date...</option>
            {availableDates.map(date => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Time Slot</h2>
          {timeSlots.length > 0 ? (
            <select
              ref={timeSlotSelectRef}
              className="w-full p-3 border border-gray-300 rounded cursor-pointer"
              value={selectedSlot || ''}
              onChange={(e) => handleSlotSelect(e.target.value)}
              tabIndex={0}
            >
              <option value="" disabled>Select a time slot...</option>
              {timeSlots
                .filter(slot => slot.available)
                .map(slot => (
                  <option key={slot.id} value={slot.id}>
                    {slot.time}
                  </option>
                ))
              }
            </select>
          ) : (
            <div className="text-center p-4 border border-gray-200 rounded bg-gray-50">
              Loading available time slots...
            </div>
          )}
          {timeSlots.length > 0 && !timeSlots.some(slot => slot.available) && (
            <p className="text-red-500 text-sm mt-2">No available slots for this date. Please try another date.</p>
          )}
        </div>
        
        <div className="flex justify-between">
          <button
            ref={cancelButtonRef}
            onClick={handleCancel}
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded cursor-pointer hover:bg-gray-200"
            type="button"
            tabIndex={0}
          >
            Cancel
          </button>
          <button
            ref={proceedButtonRef}
            onClick={handleBooking}
            disabled={!selectedSlot || !selectedService || loading}
            className={`px-8 py-3 rounded text-white ${
              !selectedSlot || !selectedService || loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
            }`}
            type="button"
            tabIndex={0}
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}
