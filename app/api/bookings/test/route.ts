import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Use the central email API that already works in your app
async function sendEmail(to: string, subject: string, htmlContent: string) {
  const origin = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const res = await fetch(`${origin}/api/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, message: htmlContent }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.details || data?.error || 'Email API failed');
  }
  return data.messageId || 'email-api-message-id';
}

// GET /api/bookings/test?to=email@example.com&serviceName=Handyman&providerName=Tony
export async function GET(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: 'Disabled in production' }, { status: 403 });
    }

    await dbConnect();

    const url = new URL(req.url);
    const to = url.searchParams.get('to');
    const serviceName = url.searchParams.get('serviceName') || 'Handyman - Test Job';
    const providerName = url.searchParams.get('providerName') || 'TradesMonk Provider';
    const providerEmailFromQuery = url.searchParams.get('providerEmail');
    const amountParam = url.searchParams.get('amount');
    const amount = amountParam ? Number(amountParam) : 150;

    if (!to) {
      return NextResponse.json({ success: false, error: 'Missing to=email@example.com' }, { status: 400 });
    }

    // Tomorrow's date (YYYY-MM-DD)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const date = tomorrow.toISOString().split('T')[0];
    const time = '10:00 AM';

    // Minimal required fields for Booking model/API validation
    const booking = new Booking({
      userId: 'test-user',
      serviceId: 'test-service-id',
      serviceName,
      serviceType: 'test',
      providerName,
      amount,
      price: amount,
      estimatedTime: '2 hours',
      serviceDuration: 2,
      userEmail: process.env.EMAIL_USER || 'noreply@tradesmonk.com',
      customerEmail: to,
      description: 'Automated test booking created from /api/bookings/test',
      specialInstructions: 'Test run',
      clientName: 'Test Customer',
      clientPhone: '(555) 555-5555',
      clientEmail: to,
      address: {
        addressLine1: '123 Test St',
        city: 'San Diego',
        state: 'CA',
        zipCode: '92101',
        serviceNotes: 'Test location',
      },
      date,
      time,
      status: 'confirmed',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await booking.save();

    // Prepare and send emails (same style as real route)
    const bookingDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const customerEmailSubject = `TradesMonk Booking Confirmation - ${serviceName} (TEST)`;
    const customerEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #000;">
        <h2 style="color: #000; border-bottom: 2px solid #007bff; padding-bottom: 10px;">[TEST] Booking Confirmed!</h2>
        <p style="color: #000;">Hi ${'Test Customer'},</p>
        <p style="color: #000;">Your TEST service booking has been created:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #000; margin-top: 0;">Booking Details</h3>
          <p style="color: #000; margin: 8px 0;"><strong>Service:</strong> ${serviceName}</p>
          <p style="color: #000; margin: 8px 0;"><strong>Provider:</strong> ${providerName}</p>
          <p style="color: #000; margin: 8px 0;"><strong>Date:</strong> ${bookingDate}</p>
          <p style="color: #000; margin: 8px 0;"><strong>Time:</strong> ${time}</p>
          <p style="color: #000; margin: 8px 0;"><strong>Price:</strong> $${amount}</p>
          <p style="color: #000; margin: 8px 0;"><strong>Address:</strong> 123 Test St, San Diego, CA 92101</p>
        </div>
        <p style="color: #000;">This is a TEST email triggered by /api/bookings/test.</p>
      </div>
    `;

    const providerEmail = providerEmailFromQuery || process.env.EMAIL_USER;
    const providerEmailSubject = `New TradesMonk Booking - ${serviceName} (TEST)`;
    const providerEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #000;">
        <h2 style="color: #000; border-bottom: 2px solid #007bff; padding-bottom: 10px;">[TEST] New Booking Received!</h2>
        <p style="color: #000;">Hello ${providerName},</p>
        <p style="color: #000;">A TEST booking was created:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #000; margin-top: 0;">Booking Details</h3>
          <p style="color: #000; margin: 8px 0;"><strong>Service:</strong> ${serviceName}</p>
          <p style="color: #000; margin: 8px 0;"><strong>Customer:</strong> Test Customer</p>
          <p style="color: #000; margin: 8px 0;"><strong>Email:</strong> ${to}</p>
          <p style="color: #000; margin: 8px 0;"><strong>Date:</strong> ${bookingDate}</p>
          <p style="color: #000; margin: 8px 0;"><strong>Time:</strong> ${time}</p>
          <p style="color: #000; margin: 8px 0;"><strong>Price:</strong> $${amount}</p>
          <p style="color: #000; margin: 8px 0;"><strong>Address:</strong> 123 Test St, San Diego, CA 92101</p>
        </div>
        <p style="color: #000;">This is a TEST email triggered by /api/bookings/test.</p>
      </div>
    `;

    const emailResults: any = {};
    try {
      emailResults.customerMessageId = await sendEmail(to, customerEmailSubject, customerEmailContent);
    } catch (e: any) {
      emailResults.customerError = e?.message || 'Failed to send customer email';
    }
    try {
      if (providerEmail) {
        emailResults.providerMessageId = await sendEmail(providerEmail, providerEmailSubject, providerEmailContent);
      }
    } catch (e: any) {
      emailResults.providerError = e?.message || 'Failed to send provider email';
    }

    return NextResponse.json({
      success: true,
      note: 'TEST booking created for tomorrow and emails attempted',
      booking: {
        id: booking._id,
        serviceName,
        date,
        time,
        amount,
        providerEmail,
      },
      emailResults,
    });
  } catch (error: any) {
    console.error('Test booking error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create test booking' }, { status: 500 });
  }
}
