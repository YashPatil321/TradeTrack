"use client";

import { useState, useEffect, useCallback } from 'react';
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

interface ServiceOption {
  id: string;
  name: string;
  rate: number;
  timeLimit: string;
  description: string;
  materials?: Array<{
    name: string;
    price: number;
  }>;
  category: string;
}

export default function PayNowButton({ serviceId, className = '' }: PayNowButtonProps): JSX.Element {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [materialOptions, setMaterialOptions] = useState<Array<{ name: string; price: number }>>([]);
  const [serviceRate, setServiceRate] = useState<number>(0);
  const [materialPrice, setMaterialPrice] = useState<number>(0);
  const [materialName, setMaterialName] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');

  // Fetch service details from API
  const fetchServiceDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/services/${serviceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch service details');
      }
      const data = await response.json();
      setServiceDetails(data);
      
      if (data.services && data.services.length > 0) {
        const firstService = data.services[0];
        setServiceOptions(data.services.map((s: any) => ({ 
          id: s.service, 
          name: s.service,
          rate: s.rate,
          timeLimit: s.timeLimit,
          description: s.description,
          materials: s.materials
        })));
        setSelectedService(firstService.service);
        setServiceRate(firstService.rate);
        
        if (firstService.materials) {
          setMaterialOptions(firstService.materials);
          setSelectedMaterial(firstService.materials[0].name);
          setMaterialPrice(firstService.materials[0].price);
          setMaterialName(firstService.materials[0].name);
        }
      }
    } catch (error) {
      console.error('Error fetching service details:', error);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  // Fetch booked time slots for a specific date
  const fetchBookedTimeSlots = useCallback(async (date: string) => {
    try {
      const response = await fetch(`/api/bookings/booked-time-slots?date=${date}&serviceId=${serviceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch booked time slots');
      }
      const data = await response.json();
      setAvailableTimeSlots(data.availableTimeSlots);
    } catch (error) {
      console.error('Error fetching booked time slots:', error);
    }
  }, [serviceId]);

  // Fetch booked time slots when a date is selected
  useEffect(() => {
    if (selectedDate && serviceId) {
      fetchBookedTimeSlots(selectedDate);
    }
  }, [selectedDate, serviceId, fetchBookedTimeSlots]);

  // Calculate total amount when service or material changes
  useEffect(() => {
    setTotalAmount(serviceRate + materialPrice);
  }, [serviceRate, materialPrice]);

  // If the currently selected time is now booked, reset it
  useEffect(() => {
    if (bookedTimeSlots.includes(selectedTime)) {
      setSelectedTime('');
    }
  }, [bookedTimeSlots, selectedTime]);

  // Fetch service details when component mounts
  useEffect(() => {
    fetchServiceDetails();
  }, [fetchServiceDetails]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const modal = document.getElementById('booking-modal');
      if (modal && !modal.contains(event.target as Node)) {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModal]);

  // Handle service selection change
  const handleServiceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    const service = serviceOptions.find(s => s.id === selected);
    if (service) {
      setSelectedService(selected);
      setServiceRate(service.rate);
      
      if (service.materials) {
        setMaterialOptions(service.materials);
        setSelectedMaterial(service.materials[0].name);
        setMaterialPrice(service.materials[0].price);
        setMaterialName(service.materials[0].name);
      }
    }
  }, [serviceOptions]);

  // Handle material selection change
  const handleMaterialChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const material = materialOptions.find(m => m.name === e.target.value);
    if (material) {
      setSelectedMaterial(e.target.value);
      setMaterialPrice(material.price);
      setMaterialName(material.name);
    }
  }, [materialOptions]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId,
          selectedService,
          selectedMaterial,
          selectedDate,
          selectedTime,
          notes,
          totalAmount: serviceRate + materialPrice
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        router.push(`/payment-confirmation?bookingId=${data.bookingId}`);
      } else {
        alert(data.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    }
  }, [serviceId, selectedService, selectedMaterial, selectedDate, selectedTime, notes, serviceRate, materialPrice, router]);

  // Get tomorrow's date as the default minimum date for booking
  const getTomorrowDate = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setShowModal(true)}
        className={`px-6 py-3 rounded-md font-medium transition-colors ${className}`}
      >
        {loading ? 'Loading...' : 'Book Now'}
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          id="booking-modal"
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Book Service</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Service</label>
                  <select
                    value={selectedService}
                    onChange={handleServiceChange}
                    required
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select a service</option>
                    {serviceOptions.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                {materialOptions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Material</label>
                    <select
                      value={selectedMaterial}
                      onChange={handleMaterialChange}
                      required
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select a material</option>
                      {materialOptions.map((material) => (
                        <option key={material.name} value={material.name}>
                          {material.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getTomorrowDate()}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select a time</option>
                    {availableTimeSlots.map((time: string) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Confirm Booking
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
