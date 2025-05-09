import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ success: false, error: 'User email not found' }, { status: 400 });
    }

    // Connect to the database
    await dbConnect();
    
    // Import Mongoose models
    const { default: Booking } = await import('@/models/Booking');
    const { default: Service } = await import('@/models/Service');

    // Query bookings where the user is the customer
    const clientBookings = await Booking.find({ 
      customerEmail: userEmail 
    }).sort({ createdAt: -1 });

    // Query services owned by this user (to get list of services offered by provider)
    const userServices = await Service.find({ 
      $or: [{ userEmail: userEmail }, { email: userEmail }]
    });

    // Get service IDs offered by this provider
    const serviceIds = userServices.map(service => service._id.toString());
    
    // Query bookings where the user is the service provider
    const providerBookings = await Booking.find({
      serviceId: { $in: serviceIds }
    }).sort({ createdAt: -1 });

    return NextResponse.json({ 
      success: true, 
      clientBookings,
      providerBookings,
      isProvider: serviceIds.length > 0
    });
  } catch (error: any) {
    console.error('Error fetching user bookings:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch bookings' 
    }, { status: 500 });
  }
}
