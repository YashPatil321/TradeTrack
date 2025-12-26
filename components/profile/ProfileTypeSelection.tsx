"use client";

import { useState } from 'react';

interface ProfileTypeSelectionProps {
  onTypeSelectedAction: (type: string) => void;
}

export default function ProfileTypeSelection({ onTypeSelectedAction }: ProfileTypeSelectionProps) {
  const [selectedType, setSelectedType] = useState('');

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    onTypeSelectedAction(type);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Select Your Profile Type</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => handleTypeSelect('service_provider')}
          className={`p-4 rounded-lg border ${
            selectedType === 'service_provider'
              ? 'bg-blue-500 text-white border-blue-500'
              : 'border-gray-300'
          }`}
        >
          <h3 className="text-lg font-semibold">Service Provider</h3>
          <p className="text-gray-600">Offer services to customers</p>
        </button>
        <button
          onClick={() => handleTypeSelect('customer')}
          className={`p-4 rounded-lg border ${
            selectedType === 'customer'
              ? 'bg-blue-500 text-white border-blue-500'
              : 'border-gray-300'
          }`}
        >
          <h3 className="text-lg font-semibold">Customer</h3>
          <p className="text-gray-600">Book services from providers</p>
        </button>
      </div>
    </div>
  );
}
