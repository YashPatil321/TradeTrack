import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import { google } from 'googleapis';
import { createTransport } from 'nodemailer';

// Configure Google OAuth for email sending
async function getGoogleOAuthAccessToken() {
  const OAuth2 = google.auth.OAuth2;
  const oauth2Client = new OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground' // Redirect URL
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        reject('Failed to create access token: ' + err.message);
      }
      resolve(token);
    });
  });

  return accessToken;
}

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
    await dbConnect();
    
    // Import Mongoose models
    const { default: Booking } = await import('@/models/Booking');
    const { default: Service } = await import('@/models/Service');

    // Extract date and time from the address object if available
    const bookingDate = address?.date || null;
    const bookingTime = address?.time || null;
    
    console.log('Creating booking with date:', bookingDate, 'and time:', bookingTime);
    
    // Create the booking record without specifying _id (let MongoDB create the ObjectId)
    const booking = {
      userId: session.user.email || session.user.name,
      serviceId,
      serviceName,
      amount,
      customerEmail: email,
      description,
      // Include date and time in the address object if available
      address: {
        ...address,
        date: bookingDate,
        time: bookingTime
      },
      // Also include date and time at the top level
      date: bookingDate,
      time: bookingTime,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date(),
    };
    
    console.log('Saving booking:', JSON.stringify(booking, null, 2));

    // Save the booking using Mongoose model
    const savedBooking = await new Booking(booking).save();

    // Fetch the service provider's email
    const service = await Service.findById(serviceId);
    const providerEmail = service?.email || service?.userId;

    // Send email notification to the service provider if we have their email
    if (providerEmail) {
      // Format the address for the email
      const formattedAddress = `${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}, ${address.city}, ${address.state} ${address.zipCode}`;
      
        // Format date and time if available (using different variable names to avoid redeclaration)
      const formattedDate = address.date ? new Date(address.date).toLocaleDateString() : 'Not specified';
      const formattedTime = address.time || 'Not specified';
      
      console.log('Email sending to:', providerEmail);

      try {
        console.log('Starting email sending process with Google OAuth...');
        console.log('Provider email:', providerEmail);
        
        // Get Google OAuth access token
        console.log('Getting OAuth access token...');
        const accessToken = await getGoogleOAuthAccessToken();
        
        // Create transporter with OAuth
        const transporter = createTransport({
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: process.env.EMAIL_USER,
            clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
            refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
            accessToken: accessToken as string,
          },
        });
        
        console.log('Created OAuth transporter successfully');

        console.log('Created transporter, attempting to send email...');
        // Send email
        const info = await transporter.sendMail({
          from: process.env.EMAIL_USER || 'notifications@tradetrack.com',
          to: providerEmail,
          subject: `New Booking: ${serviceName}`,
          html: `
            <h1>New Service Booking</h1>
            <p>You have a new booking for ${serviceName}!</p>
            <h2>Booking Details:</h2>
            <ul>
              <li><strong>Service:</strong> ${serviceName}</li>
              <li><strong>Date:</strong> ${formattedDate}</li>
              <li><strong>Time:</strong> ${formattedTime}</li>
              <li><strong>Amount:</strong> $${amount.toFixed(2)}</li>
              <li><strong>Customer Email:</strong> ${email}</li>
              <li><strong>Service Address:</strong> ${formattedAddress}</li>
              ${address.serviceNotes ? `<li><strong>Additional Notes:</strong> ${address.serviceNotes}</li>` : ''}
            </ul>
            <p>Please contact the customer directly if you need any clarification or have questions about this booking.</p>
            <p>Thank you for using TradeTrack!</p>
          `,
        });
        
        console.log('Email sent successfully:', info.messageId);
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Continue execution even if email fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      bookingId: savedBooking._id.toString(),
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
