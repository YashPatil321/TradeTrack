"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface BookingModalProps {
  service: any;
  selectedServiceType?: string;
  isOpen: boolean;
  onCloseAction: () => void;
}

interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  specialInstructions: string;
}

// Dynamic services loaded from DB based on trade (handyman/plumbing/electrician/painting)
type TemplateService = {
  id: string;
  name: string;
  price: number;
  duration: string;
  durationHours: number;
  description: string;
};

export default function NewBookingModal({ service, selectedServiceType, isOpen, onCloseAction }: BookingModalProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Templates fetched from DB and transformed for booking UI
  const [templateServices, setTemplateServices] = useState<TemplateService[]>([]);
  
  // Check authentication when modal opens - improved logic to prevent infinite loops
  useEffect(() => {
    // Only redirect if we're definitely unauthenticated (not loading)
    if (isOpen && status === 'unauthenticated') {
      console.log('User not authenticated, redirecting to login...');
      
      // Store the current booking intent in sessionStorage for redirect back
      sessionStorage.setItem('pendingBooking', JSON.stringify({
        serviceId: service?._id,
        serviceName: service?.name,
        selectedServiceType: selectedServiceType
      }));
      
      // Close modal and redirect directly to Google OAuth
      onCloseAction();
      window.location.href = '/api/auth/signin/google?callbackUrl=' + encodeURIComponent(window.location.origin);
      return;
    }
    
    // Debug logging to help identify session issues
    if (isOpen) {
      console.log('Booking modal opened - Session status:', status);
      console.log('Session data:', session);
    }
  }, [isOpen, status, service, selectedServiceType, onCloseAction, router]);
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  // Form state - Pre-select service based on what was clicked in popup
  const [selectedService, setSelectedService] = useState<string>(() => {
    // Check sessionStorage for selected service first
    const storedService = typeof window !== 'undefined' ? sessionStorage.getItem('selectedServiceForBooking') : null;
    console.log('Stored service from sessionStorage:', storedService); // Debug log
    if (storedService && storedService !== 'general') {
      console.log('Pre-selecting service:', storedService); // Debug log
      return storedService;
    }
    
    // Fallback to prop-based mapping
    if (selectedServiceType) {
      const serviceMap: { [key: string]: string } = {
        // Plumbing services
        'faucet': 'faucet-repair',
        'faucet repair': 'faucet-repair',
        'faucet replacement': 'faucet-repair',
        'faucet installation': 'faucet-repair',
        'toilet repair': 'toilet-repair',
        'toilet installation': 'toilet-repair',
        'toilet replacement': 'toilet-repair',
        'drain cleaning': 'drain-cleaning',
        'drain unclogging': 'drain-cleaning',
        'pipe repair': 'pipe-repair',
        'pipe replacement': 'pipe-repair',
        'pipe installation': 'pipe-repair',
        // Electrical services
        'light': 'light-fixture',
        'light fixture': 'light-fixture',
        'lighting': 'light-fixture',
        'light installation': 'light-fixture',
        'outlet repair': 'outlet-repair',
        'outlet installation': 'outlet-repair',
        'outlet replacement': 'outlet-repair',
        'switch repair': 'switch-repair',
        'switch installation': 'switch-repair',
        'switch replacement': 'switch-repair',
        'ceiling fan installation': 'ceiling-fan',
        'ceiling fan repair': 'ceiling-fan',
        'ceiling fan': 'ceiling-fan',
        // Handyman services
        'door': 'door-window-repair',
        'door repair': 'door-window-repair',
        'door adjustment': 'door-window-repair',
        'door installation': 'door-window-repair',
        'window repair': 'door-window-repair',
        'window installation': 'door-window-repair',
        'drywall': 'drywall-repair',
        'drywall patch': 'drywall-repair',
        'drywall patching': 'drywall-repair',
        'drywall repair': 'drywall-repair',
        'shelf': 'tv-shelf-mounting',
        'shelf mounting': 'tv-shelf-mounting',
        'tv mounting': 'tv-shelf-mounting',
        'mounting': 'tv-shelf-mounting',
        'furniture': 'furniture-assembly',
        'furniture assembly': 'furniture-assembly',
        'assembly': 'furniture-assembly',
        'general handyman': 'general-handyman',
        'general': 'general-handyman',
        'handyman': 'general-handyman',
        // Painting services
        'interior painting': 'interior-painting',
        'exterior painting': 'exterior-painting',
        'touch-up painting': 'touch-up-painting',
        'cabinet painting': 'cabinet-painting',
        'painting': 'interior-painting'
      };
      
      const lowerServiceType = selectedServiceType.toLowerCase();
      const matchedService = serviceMap[lowerServiceType] || 
        Object.keys(serviceMap).find(key => lowerServiceType.includes(key));
      
      return serviceMap[matchedService || ''] || 'general-handyman';
    }
    return '';
  });
  
  // Clear sessionStorage after service is pre-selected
  useEffect(() => {
    if (isOpen && selectedService && selectedService !== '') {
      // Clear the stored service after it's been used for pre-selection
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('selectedServiceForBooking');
        }
      }, 1000); // Small delay to ensure pre-selection works
    }
  }, [isOpen, selectedService]);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    specialInstructions: ''
  });
  const [loading, setLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [scheduleError, setScheduleError] = useState<string>('');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean>(false);

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedDate('');
    setSelectedTime('');
    setDisclaimerAccepted(false);
    setClientInfo({
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      phone: '',
      address: '',
      city: '',
      zipCode: '',
      specialInstructions: ''
    });
    setLoading(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Fetch templates and build local service list
  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        const res = await fetch('/api/service-templates');
        const json = await res.json();
        if (!json?.success || !Array.isArray(json.data)) return;
        const trade = (service?.trade || 'handyman').toLowerCase();
        const items = (json.data as any[])
          .filter(t => (t?.trade || '').toLowerCase() === trade)
          .map((t) => {
            const name: string = t.name || '';
            const slug = name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '');
            // Parse price to number
            const priceStr: string = typeof t.price === 'number' ? String(t.price) : (t.price || '0');
            const priceNum = parseFloat(String(priceStr).replace(/[^0-9.]/g, '')) || 0;
            // Parse time estimate e.g. "4 hours" -> 4
            const timeEstimate: string = t.timeEstimate || '1 hour';
            const match = String(timeEstimate).match(/(\d+(?:\.\d+)?)/);
            const durationHours = match ? Math.ceil(parseFloat(match[1])) : 1;
            return {
              id: slug || name || Math.random().toString(36).slice(2),
              name,
              price: priceNum,
              duration: timeEstimate,
              durationHours,
              description: t.description || ''
            } as TemplateService;
          });
        setTemplateServices(items);

        // Ensure a valid selection
        const has = (id: string) => !!items.find((it) => it.id === id);
        if (items.length) {
          if (selectedService && has(selectedService)) return;
          // Try match by selectedServiceType
          if (selectedServiceType) {
            const wanted = selectedServiceType.toLowerCase();
            const byId = items.find(it => it.id === wanted);
            if (byId) { setSelectedService(byId.id); return; }
            const byName = items.find(it => it.name.toLowerCase().includes(wanted));
            if (byName) { setSelectedService(byName.id); return; }
          }
          // Fallback to first
          setSelectedService(items[0].id);
        }
      } catch (e) {
        console.error('Failed to load service templates for booking modal', e);
      }
    };
    load();
  }, [isOpen, service?.trade, selectedServiceType]);

  // Get selected service details
  const getSelectedServiceDetails = (): TemplateService => {
    const found = templateServices.find((s: TemplateService) => s.id === selectedService);
    if (found) return found;
    if (templateServices.length) return templateServices[0];
    // Safe default to prevent undefined access
    return {
      id: 'default',
      name: 'Selected Service',
      price: 0,
      duration: '1 hour',
      durationHours: 1,
      description: ''
    };
  };

  // Initialize dates and times (enforce Thu/Fri from 2025-08-21)
  useEffect(() => {
    if (!isOpen) return;
    
    // Earliest start date is Thu, Aug 28, 2025; only allow Thursdays(4) and Fridays(5)
    // Use local time to avoid timezone shifts
    const constraintStart = new Date(2025, 7, 28, 0, 0, 0, 0); // month is 0-indexed
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const start = new Date(Math.max(constraintStart.getTime(), tomorrow.getTime()));
    const days: string[] = [];
    // Generate up to next 60 days of eligible dates
    for (let i = 0; i < 60; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dow = d.getDay(); // 0=Sun ... 4=Thu 5=Fri
      if (dow === 4 || dow === 5) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        days.push(`${y}-${m}-${day}`); // local YYYY-MM-DD
      }
    }
    setAvailableDates(days);
    
    // Generate 9-5 time slots
    const times = [
      '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
      '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
    ];
    setAvailableTimes(times);
    
    // Pre-populate client info from session
    if (session?.user) {
      setClientInfo(prev => ({
        ...prev,
        name: session.user?.name || '',
        email: session.user?.email || ''
      }));
    }
  }, [isOpen, session]);

  // Fetch booked slots when date changes and calculate blocked slots with 1-hour buffer
  useEffect(() => {
    if (!selectedDate || !service?._id) return;
    
    const fetchBookedSlots = async () => {
      try {
        const response = await fetch(`/api/bookings?serviceId=${service._id}&date=${selectedDate}`);
        if (response.ok) {
          const data = await response.json();
          const bookedTimes = data.bookedTimes || [];
          
          // Calculate blocked slots including service duration + 1-hour buffer
          const blockedSlots = new Set<string>();
          
          for (const booking of (data.bookings || [])) {
            const bookingTime = booking.time;
            const serviceDuration = booking.serviceDuration || 1; // Default to 1 hour if not specified
            
            console.log('Processing booking:', {
              time: bookingTime,
              serviceDuration: serviceDuration,
              rawServiceDuration: booking.serviceDuration
            });
            
            // Convert time to 24-hour format for calculation
            const timeIn24 = convertTo24Hour(bookingTime);
            const [hours, minutes] = timeIn24.split(':').map(Number);
            const startMinutes = hours * 60 + minutes;
            
            // Block slots for service duration + 1 hour buffer
            const totalBlockTime = (serviceDuration + 1) * 60; // Convert to minutes
            
            console.log('Buffer calculation:', {
              startTime: bookingTime,
              startMinutes: startMinutes,
              serviceDurationHours: serviceDuration,
              bufferHours: 1,
              totalBlockTimeMinutes: totalBlockTime,
              endTime: `${Math.floor((startMinutes + totalBlockTime) / 60)}:${String((startMinutes + totalBlockTime) % 60).padStart(2, '0')}`
            });
            
            // Block all 30-minute slots that overlap with the booking + buffer
            const blockedTimesList = [];
            for (let i = 0; i < totalBlockTime; i += 30) { // 30-minute intervals
              const blockedMinutes = startMinutes + i;
              const blockedHours = Math.floor(blockedMinutes / 60);
              const remainingMinutes = blockedMinutes % 60;
              
              // Only block times within business hours (9 AM - 5 PM)
              if (blockedHours >= 9 && blockedHours <= 17) {
                const blockedTime = convertTo12Hour(`${blockedHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`);
                blockedSlots.add(blockedTime);
                blockedTimesList.push(blockedTime);
              }
            }
            
            console.log('Blocked time slots for this booking:', blockedTimesList);
          }
          
          // Also block any time slots that would make the booking extend past 6 PM
          const allTimeSlots = [
            '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
            '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
            '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
          ];
          
          allTimeSlots.forEach(time => {
            const time24 = convertTo24Hour(time);
            const [hours, minutes] = time24.split(':').map(Number);
            const serviceHours = getSelectedServiceDetails().durationHours || 1;
            const startTotalMinutes = hours * 60 + minutes;
            // Block if service would end after 6:00 PM (1080 minutes)
            if (startTotalMinutes + serviceHours * 60 > 18 * 60) {
              blockedSlots.add(time);
            }
          });
          
          // Ensure explicitly booked start times are blocked as well
          for (const t of bookedTimes) {
            blockedSlots.add(t);
          }

          setBookedSlots(Array.from(blockedSlots));
        }
      } catch (error) {
        console.error('Error fetching booked slots:', error);
        setBookedSlots([]);
      }
    };
    
    fetchBookedSlots();
  }, [selectedDate, service?._id, selectedService]); // Add selectedService to dependencies to recalculate when service changes

  // Auto-refresh booked slots while on the Schedule step so taken times disappear
  useEffect(() => {
    if (!isOpen || currentStep !== 2 || !selectedDate || !service?._id) return;
    let cancelled = false;

    const refresh = async () => {
      try {
        const response = await fetch(`/api/bookings?serviceId=${service._id}&date=${selectedDate}`);
        if (!response.ok) return;
        const data = await response.json();
        const bookedTimes = data.bookedTimes || [];

        // Recompute blocked slots (service duration + 1h buffer, and end-by-6PM rule)
        const blockedSlotsSet = new Set<string>();

        for (const booking of (data.bookings || [])) {
          const bookingTime = booking.time;
          const serviceDuration = booking.serviceDuration || 1;
          const timeIn24 = convertTo24Hour(bookingTime);
          const [hours, minutes] = timeIn24.split(':').map(Number);
          const startMinutes = hours * 60 + minutes;
          const totalBlockTime = (serviceDuration + 1) * 60; // minutes
          for (let i = 0; i < totalBlockTime; i += 30) {
            const blockedMinutes = startMinutes + i;
            const blockedHours = Math.floor(blockedMinutes / 60);
            const remainingMinutes = blockedMinutes % 60;
            if (blockedHours >= 9 && blockedHours <= 17) {
              const blockedTime = convertTo12Hour(`${blockedHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`);
              blockedSlotsSet.add(blockedTime);
            }
          }
        }

        const allTimeSlots = [
          '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
          '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
          '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
        ];
        allTimeSlots.forEach(time => {
          const time24 = convertTo24Hour(time);
          const [h, m] = time24.split(':').map(Number);
          const serviceHours = getSelectedServiceDetails().durationHours || 1;
          const startTotalMinutes = h * 60 + m;
          if (startTotalMinutes + serviceHours * 60 > 18 * 60) {
            blockedSlotsSet.add(time);
          }
        });

        for (const t of bookedTimes) blockedSlotsSet.add(t);
        if (!cancelled) setBookedSlots(Array.from(blockedSlotsSet));
      } catch (e) {
        // silent
      }
    };

    // Initial and periodic refresh every 10 seconds
    refresh();
    const id = setInterval(refresh, 10000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isOpen, currentStep, selectedDate, service?._id, selectedService]);
  
  // Helper function to convert 12-hour to 24-hour format
  const convertTo24Hour = (time12h: string): string => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  // Helper function to convert 24-hour to 12-hour format
  const convertTo12Hour = (time24h: string): string => {
    const [hours, minutes] = time24h.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Step navigation
  const nextStep = () => {
    // Inline validation when leaving Schedule (step 2)
    if (currentStep === 2) {
      if (!selectedDate) {
        setScheduleError('Please select a date.');
        return;
      }
      if (!selectedTime) {
        setScheduleError('Please select a time.');
        return;
      }
      // Ensure selected time is still available (race-condition safe)
      const isBlocked = bookedSlots.includes(selectedTime);
      if (isBlocked) {
        setScheduleError('That time just became unavailable. Please choose another.');
        return;
      }
      // Ensure the booking won’t pass 6 PM
      const svc = getSelectedServiceDetails();
      const time24 = convertTo24Hour(selectedTime);
      const [hStr, mStr] = time24.split(':');
      const endHour = parseInt(hStr) + (svc.durationHours || 1);
      if (endHour > 18) {
        setScheduleError('This selection would extend past 6 PM. Please choose an earlier time.');
        return;
      }
      setScheduleError('');
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle client info changes
  const handleClientInfoChange = (field: keyof ClientInfo, value: string) => {
    setClientInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle booking submission
  const handleBookingSubmit = async () => {
    // Enhanced validation for all required fields
    if (!selectedService || !selectedDate || !selectedTime || !clientInfo.name || !clientInfo.address || !clientInfo.email || !clientInfo.city || !clientInfo.zipCode) {
      alert('Please fill in all required fields including email, city, and zip code.');
      return;
    }
    
    // Validate booking time - ensure job completes by 6 PM
    const serviceDetails = getSelectedServiceDetails();
    const [hours, minutes] = selectedTime.split(':');
    let hour = parseInt(hours);
    const period = selectedTime.includes('PM') && hour < 12 ? 'PM' : 'AM';
    
    // Convert to 24-hour format for easier comparison
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    
    const endHour = hour + (serviceDetails.durationHours || 1);
    
    // Check if booking would extend past 6 PM
    if (endHour > 18) { // 6 PM in 24-hour format
      alert(`This ${serviceDetails.duration} service cannot be booked for ${selectedTime} as it would extend past 6 PM. Please choose an earlier time.`);
      return;
    }

    // Validate session
    if (!session?.user?.email) {
      alert('Please log in to complete your booking.');
      return;
    }

    setLoading(true);
    
    try {
      const serviceDetails = getSelectedServiceDetails();
      const priceValue = typeof serviceDetails.price === 'string' 
        ? parseFloat((serviceDetails.price as string).replace('$', '')) || 0
        : (serviceDetails.price as number) || 0;
        
      // Validate price
      if (!priceValue || priceValue <= 0) {
        alert('Invalid service price. Please try again.');
        setLoading(false);
        return;
      }
        
      // Ensure all required fields have values
      const userEmail = session?.user?.email || clientInfo.email;
      const customerEmail = clientInfo.email;
      
      const bookingData = {
        // Required fields from schema
        userId: userEmail,
        serviceId: service._id,
        serviceName: serviceDetails.name,
        amount: priceValue,
        price: priceValue,
        userEmail: userEmail,
        customerEmail: customerEmail,
        date: selectedDate,
        time: selectedTime,
        
        // Service details
        serviceType: service.trade || 'handyman',
        providerName: service.name,
        estimatedTime: serviceDetails.duration,
        serviceDuration: serviceDetails.durationHours || 1,
        description: `${serviceDetails.name} - ${serviceDetails.description}`,
        
        // Client information
        clientName: clientInfo.name,
        clientPhone: clientInfo.phone || '',
        clientEmail: customerEmail,
        specialInstructions: clientInfo.specialInstructions || '',
        
        // Address information (required nested object)
        address: {
          addressLine1: clientInfo.address,
          addressLine2: '',
          city: clientInfo.city,
          state: 'CA',
          zipCode: clientInfo.zipCode,
          serviceNotes: clientInfo.specialInstructions || ''
        },
        
        // Status fields
        status: 'confirmed',
        paymentStatus: 'pending'
      };
      
      // Debug logging
      console.log('=== BOOKING DEBUG ===');
      console.log('Session user email:', session?.user?.email);
      console.log('Client info:', clientInfo);
      console.log('Service details:', serviceDetails);
      console.log('Price value:', priceValue);
      console.log('Final booking data:', bookingData);
      console.log('Required field check:');
      console.log('- userId:', bookingData.userId);
      console.log('- userEmail:', bookingData.userEmail);
      console.log('- customerEmail:', bookingData.customerEmail);
      console.log('- amount:', bookingData.amount);
      console.log('- address.addressLine1:', bookingData.address.addressLine1);
      console.log('- address.city:', bookingData.address.city);
      console.log('- address.state:', bookingData.address.state);
      console.log('- address.zipCode:', bookingData.address.zipCode);
      console.log('===================');
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      
      if (response.ok) {
        alert(`Booking confirmed!\n\nService: ${serviceDetails.name}\nDate: ${selectedDate}\nTime: ${selectedTime}\nTotal: $${serviceDetails.price}\n\n✅ IMPORTANT: Please pay ${service.name} in person when they arrive.\n\nYou will receive a confirmation email shortly.`);
        onCloseAction();
      } else {
        const errorData = await response.json();
        console.error('Booking API error:', errorData);
        throw new Error(errorData.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Sorry, there was an error creating your booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Don't render modal if session is still loading to prevent authentication issues
  if (status === 'loading') {
    return null;
  }

  const serviceDetails = getSelectedServiceDetails();
  const availableSlots = availableTimes.filter(time => !bookedSlots.includes(time));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm bg-black bg-opacity-75">
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto max-h-[95vh] overflow-hidden transform transition-all flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Book Service</h2>
              <button
                onClick={onCloseAction}
                className="bg-white/20 text-white p-2 rounded-full hover:bg-white/30 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Step Indicator */}
            <div className="flex justify-between items-center mt-4 px-10 relative">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-col items-center z-10">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                    currentStep === step ? 'bg-white text-blue-600' : 
                    currentStep > step ? 'bg-blue-500 text-white' : 'bg-white/30 text-white'
                  }`}>
                    {currentStep > step ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span>{step}</span>
                    )}
                  </div>
                  <span className={`text-xs mt-1 ${
                    currentStep >= step ? 'text-white' : 'text-white/70'
                  }`}>
                    {step === 1 ? 'Service' : step === 2 ? 'Schedule' : 'Review'}
                  </span>
                </div>
              ))}
              
              {/* Progress line */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/30 z-0" style={{width: '80%', margin: '0 auto'}}></div>
              <div className="absolute top-4 left-0 h-0.5 bg-white z-0" style={{
                width: `${(Math.max(1, currentStep - 1) / (totalSteps - 1)) * 80}%`, 
                margin: '0 auto', 
                marginLeft: '10%'
              }}></div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* Step 1: Service Selection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Your Service</h3>
                  <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
                    {templateServices.map((svc: TemplateService) => (
                      <div
                        key={svc.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedService === svc.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedService(svc.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h4 className="font-medium text-gray-900">{svc.name}</h4>
                              {selectedService === svc.id && (
                                <div className="ml-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{svc.description}</p>
                            <p className="text-xs text-gray-500 mt-2">Duration: {svc.duration}</p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-bold text-lg text-gray-900">${svc.price}</p>
                            <p className="text-xs text-gray-500">flat rate</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Schedule */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Date & Time</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                      <select
                        value={selectedDate}
                        onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); setScheduleError(''); }}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        required
                      >
                        <option value="">Choose a date...</option>
                        {availableDates.map((date) => {
                          // Parse as local date to avoid timezone shifting labels
                          const [yy, mm, dd] = date.split('-').map(Number);
                          const dateObj = new Date(yy, (mm || 1) - 1, dd || 1);
                          const formattedDate = dateObj.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });
                          return (
                            <option key={date} value={date}>{formattedDate}</option>
                          );
                        })}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Time</label>
                      <select
                        value={selectedTime}
                        onChange={(e) => { setSelectedTime(e.target.value); setScheduleError(''); }}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        required
                        disabled={!selectedDate}
                      >
                        <option value="">Choose a time...</option>
                        {availableSlots.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      {selectedDate && availableSlots.length === 0 && (
                        <p className="text-sm text-red-600 mt-1">No available slots for this date</p>
                      )}
                      {scheduleError && (
                        <p className="text-sm text-red-600 mt-1">{scheduleError}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review & Client Info */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={clientInfo.name}
                        onChange={(e) => handleClientInfoChange('name', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        value={clientInfo.email}
                        onChange={(e) => handleClientInfoChange('email', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        value={clientInfo.phone}
                        onChange={(e) => handleClientInfoChange('phone', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        value={clientInfo.city}
                        onChange={(e) => handleClientInfoChange('city', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Address *</label>
                      <input
                        type="text"
                        value={clientInfo.address}
                        onChange={(e) => handleClientInfoChange('address', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="Street address where service will be performed"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                      <input
                        type="text"
                        value={clientInfo.zipCode}
                        onChange={(e) => handleClientInfoChange('zipCode', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                      <textarea
                        value={clientInfo.specialInstructions}
                        onChange={(e) => handleClientInfoChange('specialInstructions', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white selection:bg-blue-200 selection:text-gray-900"
                        rows={3}
                        placeholder="Any special instructions or details about the service..."
                        style={{
                          color: '#111827',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Booking Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Booking Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-800 font-medium">Service:</span>
                      <span className="font-semibold text-gray-900">{serviceDetails.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-800 font-medium">Provider:</span>
                      <span className="font-semibold text-gray-900">{service.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-800 font-medium">Date:</span>
                      <span className="font-semibold text-gray-900">{selectedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-800 font-medium">Time:</span>
                      <span className="font-semibold text-gray-900">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-800 font-medium">Duration:</span>
                      <span className="font-semibold text-gray-900">{serviceDetails.duration}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">${serviceDetails.price}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>Payment:</strong> Please pay the provider in person when they arrive for your service.
                    </p>
                  </div>
                  
                  {/* Terms and Disclaimer */}
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                    <h5 className="text-sm font-semibold text-blue-900 mb-2">Terms & Conditions</h5>
                    <p className="text-xs text-blue-800 mb-3 leading-relaxed">
                      By booking this service, you acknowledge that: (1) All bookings are subject to service provider availability and confirmation; (2) You agree to pay the service provider directly upon completion of work; (3) TradesMonk acts as a platform connecting clients with independent service providers; (4) Service quality, pricing, and completion are the responsibility of the individual service provider; (5) You may be contacted by the provider to confirm appointment details.
                    </p>
                    
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={disclaimerAccepted}
                        onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        required
                      />
                      <span className="text-xs text-blue-900 font-medium">
                        I acknowledge and agree to the terms above, including payment responsibility and service provider independence.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
              <button
                onClick={currentStep === 1 ? onCloseAction : prevStep}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors font-medium"
              >
                {currentStep === 1 ? 'Cancel' : 'Back'}
              </button>
              
              {currentStep < totalSteps ? (
                <button
                  onClick={nextStep}
                  disabled={(
                    (currentStep === 1 && !selectedService) ||
                    (currentStep === 2 && (!selectedDate || !selectedTime))
                  )}
                  className={`w-full sm:w-auto px-6 py-3 sm:py-2 rounded transition-colors font-medium ${
                    (currentStep === 1 && !selectedService) ||
                    (currentStep === 2 && (!selectedDate || !selectedTime))
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleBookingSubmit}
                  disabled={loading || !clientInfo.name || !clientInfo.email || !clientInfo.phone || !clientInfo.address || !clientInfo.city || !clientInfo.zipCode || !disclaimerAccepted}
                  className={`w-full sm:w-auto px-6 py-3 sm:py-2 rounded transition-colors font-medium ${
                    loading || !clientInfo.name || !clientInfo.email || !clientInfo.phone || !clientInfo.address || !clientInfo.city || !clientInfo.zipCode || !disclaimerAccepted
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Confirming...' : 'Confirm Booking'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
