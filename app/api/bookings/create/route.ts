import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import { google } from 'googleapis';

/**
 * Send an email using the Gmail API
 * This is the exact same implementation used in the email test page
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
      'From: "TradeTrack" <' + process.env.EMAIL_USER + '>',
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
    console.log('Finding service with ID:', serviceId);
    const service = await Service.findById(serviceId);
    console.log('Service found:', service ? 'Yes' : 'No');
    
    // Extract email from service or use userEmail field
    const providerEmail = service?.email || service?.userEmail;
    console.log('Provider email found:', providerEmail);

    // Format common booking details for emails
    const formattedAddress = `${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}, ${address.city}, ${address.state} ${address.zipCode}`;
    const formattedDate = address.date ? new Date(address.date).toLocaleDateString() : 'Not specified';
    const formattedTime = address.time || 'Not specified';
    const additionalNotes = address.serviceNotes || 'None provided';
    
    // 1. Send email notification to the SERVICE PROVIDER if we have their email
    if (providerEmail) {
      console.log('Sending booking notification email to service provider:', providerEmail);
      
      try {
        // Create service provider email content with black text per user preference
        const providerEmailSubject = `New Booking: ${serviceName}`;
        const providerEmailContent = `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h1 style="color: #333;">New Service Booking</h1>
            <p style="color: #333;">You have a new booking for ${serviceName}!</p>
            <h2 style="color: #333;">Booking Details:</h2>
            <ul style="color: #333;">
              <li><strong>Service:</strong> ${serviceName}</li>
              <li><strong>Date:</strong> ${formattedDate}</li>
              <li><strong>Time:</strong> ${formattedTime}</li>
              <li><strong>Amount:</strong> $${amount.toFixed(2)}</li>
              <li><strong>Customer Email:</strong> ${email}</li>
              <li><strong>Service Address:</strong> ${formattedAddress}</li>
              <li><strong>Additional Instructions:</strong> ${additionalNotes}</li>
            </ul>
            <p style="color: #333;">Please contact the customer directly if you need any clarification or have questions about this booking.</p>
            <p style="color: #333;">You can view all your bookings in your <a href="${process.env.NEXTAUTH_URL}/provider-dashboard" style="color: #0066cc;">Provider Dashboard</a>.</p>
            <p style="color: #333;">Thank you for using TradeTrack!</p>
          </div>
        `;
        
        // Send provider email using Gmail API
        const providerMessageId = await sendEmail(providerEmail, providerEmailSubject, providerEmailContent);
        console.log('Provider notification email sent successfully, ID:', providerMessageId);
      } catch (providerEmailError: any) {
        console.error('======== PROVIDER EMAIL ERROR ========');
        console.error('Error sending provider email:', providerEmailError.message);
        if (providerEmailError.response) {
          console.error('API response error:', {
            status: providerEmailError.response.status,
            data: providerEmailError.response.data
          });
        }
        console.error('=========================================');
        // Continue execution even if provider email fails
      }
    }
    
    // 2. Send confirmation email to the CUSTOMER
    try {
      console.log('Sending booking confirmation email to customer:', email);
      
      const customerEmailSubject = `Your Booking Confirmation: ${serviceName}`;
      const customerEmailContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h1 style="color: #333;">Booking Confirmation</h1>
          <p style="color: #333;">Thank you for booking ${serviceName} through TradeTrack!</p>
          <h2 style="color: #333;">Your Booking Details:</h2>
          <ul style="color: #333;">
            <li><strong>Service:</strong> ${serviceName}</li>
            <li><strong>Date:</strong> ${formattedDate}</li>
            <li><strong>Time:</strong> ${formattedTime}</li>
            <li><strong>Amount Paid:</strong> $${amount.toFixed(2)}</li>
            <li><strong>Service Address:</strong> ${formattedAddress}</li>
            <li><strong>Your Additional Instructions:</strong> ${additionalNotes}</li>
          </ul>
          <p style="color: #333;">The service provider has been notified and will contact you if they have any questions.</p>
          <p style="color: #333;">You can view all your bookings in your <a href="${process.env.NEXTAUTH_URL}/profile" style="color: #0066cc;">Profile Dashboard</a>.</p>
          <p style="color: #333;">Thank you for using TradeTrack!</p>
        </div>
      `;
      
      // Send customer email using Gmail API
      const customerMessageId = await sendEmail(email, customerEmailSubject, customerEmailContent);
      console.log('Customer confirmation email sent successfully, ID:', customerMessageId);
    } catch (customerEmailError: any) {
      console.error('======== CUSTOMER EMAIL ERROR ========');
      console.error('Error sending customer email:', customerEmailError.message);
      if (customerEmailError.response) {
        console.error('API response error:', {
          status: customerEmailError.response.status,
          data: customerEmailError.response.data
        });
      }
      console.error('=========================================');
      // Continue execution even if customer email fails
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
