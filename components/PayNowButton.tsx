"use client";

import { useRouter } from 'next/navigation';

interface PayNowButtonProps {
  serviceId: string;
  className?: string;
}

export default function PayNowButton({ serviceId, className = '' }: PayNowButtonProps) {
  const router = useRouter();

  const handlePayNow = () => {
    router.push(`/payment?service_id=${serviceId}`);
  };

  return (
    <button
      onClick={handlePayNow}
      className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors ${className}`}
    >
      Pay Now
    </button>
  );
}
