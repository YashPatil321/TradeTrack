import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import { google } from 'googleapis';

/**
 * Send an email using the Gmail API
 */
async function sendEmail(to: string, subject: string, htmlContent: string) {
  try {
    console.log(`Sending email to ${to} with subject "${subject}"`);
    
    // Configure Gmail API client for each email send to ensure fresh credentials
    const oauth2Client = new google.auth.OAuth2(
      process.env.EMAIL_CLIENT_ID,
      process.env.EMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );
    
    // Set credentials with refresh token
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
    
    // Create Gmail API instance
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Create the email with proper headers and black text styling
    const emailContent = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${to}`,
      'From: "TradesTap" <' + process.env.EMAIL_USER + '>',
      `Subject: ${subject}`,
      '',
      htmlContent
    ].join('\n');

    // Encode the email for the Gmail API
    const encodedMessage = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    console.log('Sending email with Gmail API...');
    // Send the email
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    console.log('Email sent successfully, message ID:', result.data.id);
    return result.data.id;
  } catch (error: any) {
    console.error('Error sending email:', error);
    
    // More detailed error logging for debugging
    if (error.response) {
      console.error('API response error:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    throw error;
  }
}

// GET /api/bookings - Get bookings
// If serviceId and date are provided, returns available times for that service/date
// If no parameters, returns all bookings (admin only)
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get('serviceId');
    const date = searchParams.get('date');
    
    // If serviceId and date are provided, return available times for that service/date
    if (serviceId && date) {
      // Get existing bookings for this service and date
      const existingBookings = await Booking.find({
        serviceId,
        date,
        status: { $ne: 'cancelled' }
      }).select('time');
      
      const bookedTimes = existingBookings.map(booking => booking.time);
      
      return NextResponse.json({
        success: true,
        bookedTimes
      });
    }
    
    // If no parameters, check if user is admin and return all bookings
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const isAdmin = session.user.email === 'yashp.d39@gmail.com';
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Get all bookings, sorted by date (newest first)
    const allBookings = await Booking.find({})
      .sort({ date: -1, time: -1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      data: allBookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create a new booking
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const body = await req.json();
    console.log('=== API BOOKING DEBUG ===');
    console.log('Received booking data:', body);
    console.log('Session user:', session.user);
    console.log('========================');
    
    // Extract all required fields from the body
    const {
      userId, serviceId, serviceName, amount, price, userEmail, customerEmail,
      date, time, serviceType, providerName, estimatedTime, serviceDuration,
      description, clientName, clientPhone, clientEmail, specialInstructions,
      address, status, paymentStatus
    } = body;
    
    // Validate required fields
    if (!userId || !serviceId || !serviceName || !amount || !userEmail || !customerEmail || 
        !date || !time || !address?.addressLine1 || !address?.city || !address?.state || !address?.zipCode) {
      console.log('Missing required fields:');
      console.log('- userId:', userId);
      console.log('- serviceId:', serviceId);
      console.log('- serviceName:', serviceName);
      console.log('- amount:', amount);
      console.log('- userEmail:', userEmail);
      console.log('- customerEmail:', customerEmail);
      console.log('- address:', address);
      return NextResponse.json(
        { success: false, error: 'Missing required booking information' },
        { status: 400 }
      );
    }
    
    // Check if time slot is already booked
    const existingBooking = await Booking.findOne({
      serviceId,
      date,
      time,
      status: { $ne: 'cancelled' }
    });
    
    if (existingBooking) {
      return NextResponse.json(
        { success: false, error: 'This time slot is already booked' },
        { status: 409 }
      );
    }
    
    // Create new booking with all required fields
    const booking = new Booking({
      userId,
      serviceId,
      serviceName,
      serviceType,
      providerName,
      amount,
      price,
      estimatedTime,
      serviceDuration,
      userEmail,
      customerEmail,
      description,
      specialInstructions,
      clientName,
      clientPhone,
      clientEmail,
      address,
      date,
      time,
      status: status || 'confirmed',
      paymentStatus: paymentStatus || 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await booking.save();
    console.log('Booking saved successfully:', booking._id);
    
    // Validate email format before sending
    const isValidEmail = (email: string) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Send confirmation emails
    try {
      // Format date and time for emails
      const bookingDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Customer confirmation email
      const customerEmailSubject = `TradesTap Booking Confirmation - ${serviceName}`;
      
      // Validate customer email before sending
      if (!isValidEmail(customerEmail)) {
        console.error('Invalid customer email format:', customerEmail);
        throw new Error('Invalid customer email format');
      }
      const customerEmailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #000;">
          <h2 style="color: #000; border-bottom: 2px solid #007bff; padding-bottom: 10px;">Booking Confirmed!</h2>
          
          <p style="color: #000;">Hi ${clientName},</p>
          
          <p style="color: #000;">Your service booking has been confirmed. Here are the details:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #000; margin-top: 0;">Booking Details</h3>
            <p style="color: #000; margin: 8px 0;"><strong>Service:</strong> ${serviceName}</p>
            <p style="color: #000; margin: 8px 0;"><strong>Provider:</strong> ${providerName}</p>
            <p style="color: #000; margin: 8px 0;"><strong>Date:</strong> ${bookingDate}</p>
            <p style="color: #000; margin: 8px 0;"><strong>Time:</strong> ${time}</p>
            <p style="color: #000; margin: 8px 0;"><strong>Price:</strong> $${amount}</p>
            <p style="color: #000; margin: 8px 0;"><strong>Address:</strong> ${address.addressLine1}, ${address.city}, ${address.state} ${address.zipCode}</p>
            ${specialInstructions ? `<p style="color: #000; margin: 8px 0;"><strong>Special Instructions:</strong> ${specialInstructions}</p>` : ''}
          </div>
          
          <p style="color: #000;"><strong>Payment:</strong> Payment will be collected in person after service completion.</p>
          
          <p style="color: #000;">The service provider will contact you before the appointment to confirm details.</p>
          
          <p style="color: #000;">Thank you for choosing TradesTap!</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message from TradesTap. Please do not reply to this email.</p>
        </div>
      `;
      
      // Send customer email
      console.log('Sending customer confirmation email to:', customerEmail);
      await sendEmail(customerEmail, customerEmailSubject, customerEmailContent);
      
      // Provider notification email (if provider has email)
      if (providerName && providerName !== 'Unknown Provider') {
        const providerEmailSubject = `New TradesTap Booking - ${serviceName}`;
        const providerEmailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #000;">
            <h2 style="color: #000; border-bottom: 2px solid #007bff; padding-bottom: 10px;">New Booking Received!</h2>
            
            <p style="color: #000;">Hello ${providerName},</p>
            
            <p style="color: #000;">You have received a new service booking through TradesTap:</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #000; margin-top: 0;">Booking Details</h3>
              <p style="color: #000; margin: 8px 0;"><strong>Service:</strong> ${serviceName}</p>
              <p style="color: #000; margin: 8px 0;"><strong>Customer:</strong> ${clientName}</p>
              <p style="color: #000; margin: 8px 0;"><strong>Phone:</strong> ${clientPhone || 'Not provided'}</p>
              <p style="color: #000; margin: 8px 0;"><strong>Email:</strong> ${customerEmail}</p>
              <p style="color: #000; margin: 8px 0;"><strong>Date:</strong> ${bookingDate}</p>
              <p style="color: #000; margin: 8px 0;"><strong>Time:</strong> ${time}</p>
              <p style="color: #000; margin: 8px 0;"><strong>Price:</strong> $${amount}</p>
              <p style="color: #000; margin: 8px 0;"><strong>Address:</strong> ${address.addressLine1}, ${address.city}, ${address.state} ${address.zipCode}</p>
              ${specialInstructions ? `<p style="color: #000; margin: 8px 0;"><strong>Special Instructions:</strong> ${specialInstructions}</p>` : ''}
            </div>
            
            <p style="color: #000;"><strong>Next Steps:</strong></p>
            <ul style="color: #000;">
              <li>Contact the customer to confirm the appointment details</li>
              <li>Arrive on time at the specified address</li>
              <li>Complete the service as requested</li>
              <li>Collect payment in person after completion</li>
            </ul>
            
            <p style="color: #000;">Thank you for being part of the TradesTap network!</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated message from TradesTap. Please do not reply to this email.</p>
          </div>
        `;
        
        // Send provider notification
        const providerEmail = process.env.EMAIL_USER;
        if (providerEmail && isValidEmail(providerEmail)) {
          console.log('Sending provider notification email to:', providerEmail);
          await sendEmail(providerEmail, providerEmailSubject, providerEmailContent);
        } else {
          console.warn('No valid provider email configured, skipping provider notification');
        }
      }
      
      console.log('All confirmation emails sent successfully');
      
    } catch (emailError) {
      console.error('Error sending confirmation emails:', emailError);
      // Don't fail the booking if email sending fails
    }
    
    return NextResponse.json({
      success: true,
      booking: {
        id: booking._id,
        serviceId: booking.serviceId,
        serviceName: booking.serviceName,
        date: booking.date,
        time: booking.time,
        price: booking.price,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
