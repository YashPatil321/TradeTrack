import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import nodemailer from 'nodemailer';

// Configure Nodemailer for Google Mail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
  },
});

export async function POST(req: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const bookingData = await req.json();
    const { serviceId, serviceName, amount, email, description, address } = bookingData;

    if (!serviceId || !serviceName || !amount || !email || !address) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Connect to the database
    const { db } = await connectToDatabase();

    // Create a unique booking ID
    const bookingId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Create the booking record
    const booking = {
      _id: bookingId,
      userId: session.user.email || session.user.name,
      serviceId,
      serviceName,
      amount,
      customerEmail: email,
      description,
      address,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date(),
    };

    await db.collection('bookings').insertOne(booking);

    // Fetch the service provider's email
    const service = await db.collection('services').findOne({ _id: serviceId });
    const providerEmail = service?.email || service?.userId;

    // Send email notification to the service provider if we have their email
    if (providerEmail) {
      // Format the address for the email
      const formattedAddress = `${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}, ${address.city}, ${address.state} ${address.zipCode}`;
      
      // Format date and time if available
      const bookingDate = address.date ? new Date(address.date).toLocaleDateString() : 'Not specified';
      const bookingTime = address.time || 'Not specified';

      // Send email
      await transporter.sendMail({
        from: process.env.EMAIL_USER || 'notifications@tradetrack.com',
        to: providerEmail,
        subject: `New Booking: ${serviceName}`,
        html: `
          <h1>New Service Booking</h1>
          <p>You have a new booking for ${serviceName}!</p>
          <h2>Booking Details:</h2>
          <ul>
            <li><strong>Service:</strong> ${serviceName}</li>
            <li><strong>Date:</strong> ${bookingDate}</li>
            <li><strong>Time:</strong> ${bookingTime}</li>
            <li><strong>Amount:</strong> $${amount.toFixed(2)}</li>
            <li><strong>Customer Email:</strong> ${email}</li>
            <li><strong>Service Address:</strong> ${formattedAddress}</li>
            ${address.serviceNotes ? `<li><strong>Additional Notes:</strong> ${address.serviceNotes}</li>` : ''}
          </ul>
          <p>Please contact the customer directly if you need any clarification or have questions about this booking.</p>
          <p>Thank you for using TradeTrack!</p>
        `,
      });
    }

    return NextResponse.json({ 
      success: true, 
      bookingId,
      message: 'Booking created successfully and service provider notified' 
    });
  } catch (error: any) {
    console.error('Booking creation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to create booking' 
    }, { status: 500 });
  }
}
