"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Booking {
  _id: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  selectedDate: string;
  selectedTime: string;
  duration: number;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  };
  providerName: string;
  providerEmail: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    todayBookings: 0,
    thisWeekBookings: 0
  });

  // Admin authentication
  const isAdmin = session?.user?.email === 'yashp.d39@gmail.com';

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/');
      return;
    }

    if (!isAdmin) {
      alert('Access denied. Admin access only.');
      router.push('/');
      return;
    }

    fetchAllBookings();
  }, [session, status, router, isAdmin]);

  const fetchAllBookings = async () => {
    try {
      const response = await fetch('/api/bookings');
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error fetching bookings:', data.error || 'Unknown error');
        alert(`Error fetching bookings: ${data.error || 'Please try again'}`);
        return;
      }
      
      if (data.success) {
        // The API now returns data in data.data for the admin view
        const bookingsData = data.data || [];
        console.log('Fetched bookings:', bookingsData);
        setBookings(bookingsData);
        
        // Calculate stats
        const today = new Date().toDateString();
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        const todayCount = bookingsData.filter((b: Booking) => 
          b.createdAt && new Date(b.createdAt).toDateString() === today
        ).length;
        
        const weekCount = bookingsData.filter((b: Booking) => 
          b.createdAt && new Date(b.createdAt) >= oneWeekAgo
        ).length;
        
        const totalRevenue = bookingsData.reduce((sum: number, b: Booking) => {
          return sum + (b.amount || 0);
        }, 0);
        
        setStats({
          totalBookings: bookingsData.length,
          totalRevenue,
          todayBookings: todayCount,
          thisWeekBookings: weekCount
        });
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading CEO Dashboard...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-black text-white shadow-md">
        <div className="container mx-auto flex justify-between items-center p-4">
          <Link href="/" className="text-xl font-bold hover:text-gray-300">
            TradesTap Admin Dashboard
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Welcome, Admin</span>
            <Link href="/" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm">
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Bookings</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalBookings}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Revenue</h3>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Today's Bookings</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.todayBookings}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">This Week</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.thisWeekBookings}</p>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">All Bookings</h2>
          </div>
          
          {bookings.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No bookings found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booked On
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{booking.customerName}</div>
                          <div className="text-sm text-gray-500">{booking.customerEmail}</div>
                          <div className="text-sm text-gray-500">{booking.customerPhone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.serviceName}</div>
                        <div className="text-sm text-gray-500">{booking.duration}h duration</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.providerName}</div>
                        <div className="text-sm text-gray-500">{booking.providerEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(booking.selectedDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">{booking.selectedTime}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(booking.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {booking.status || 'Confirmed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(booking.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
