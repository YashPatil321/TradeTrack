import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';

// Get all bookings for a specific service on a given date
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serviceId = params.id;
    
    // Get the date from the query parameters
    const url = new URL(req.url);
    const date = url.searchParams.get('date');

    if (!serviceId || !date) {
      return NextResponse.json({ 
        success: false, 
        error: 'Service ID and date are required' 
      }, { status: 400 });
    }

    // Connect to the database
    await dbConnect();
    
    // Import Mongoose models
    const { default: Booking } = await import('@/models/Booking');

    // Find all bookings for this service on the specified date
    const bookings = await Booking.find({
      serviceId,
      $or: [
        // Check in address.date field
        { "address.date": date },
        // Also check in date field
        { date }
      ]
    }).select('time address.time');
    
    // Normalize the time data format
    const normalizedBookings = bookings.map(booking => {
      return {
        _id: booking._id,
        time: booking.time || (booking.address && booking.address.time)
      };
    });

    return NextResponse.json({ 
      success: true, 
      bookings: normalizedBookings
    });
  } catch (error: any) {
    console.error('Error fetching service bookings:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch bookings' 
    }, { status: 500 });
  }
}
