import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function toTitleCase(s: string) {
  return s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase());
}

function normalizeDate(input: string | null): string | null {
  if (!input) return null;
  // Accept YYYY-MM-DD or mm/dd/yyyy
  const isoMatch = input.match(/^\d{4}-\d{2}-\d{2}$/);
  if (isoMatch) return input;
  const usMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [_, m, d, y] = usMatch;
    const mm = m.padStart(2, '0');
    const dd = d.padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }
  // Fallback: Date.parse
  const dt = new Date(input);
  if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
  return null;
}

function normalizeTime(input: string | null): string {
  if (!input) return '10:00 AM';
  // Accept HH:MM AM/PM or 24h HH:MM
  const ampm = input.trim().toUpperCase();
  if (/^\d{1,2}:\d{2}\s?(AM|PM)$/.test(ampm)) {
    // Ensure space before AM/PM
    return ampm.replace(/\s?(AM|PM)$/,(m)=>` ${m.trim()}`);
  }
  // 24h -> 12h
  const m = input.match(/^(\d{1,2}):(\d{2})$/);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = m[2];
    const period = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12; else if (h > 12) h -= 12;
    return `${h}:${min} ${period}`;
  }
  return '10:00 AM';
}

async function sendEmail(to: string, subject: string, htmlContent: string) {
  // Delegate to the central email route which you confirmed works
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

// GET /api/bookings/dev-create?to=...&date=YYYY-MM-DD or mm/dd/yyyy&time=10:20 PM&serviceName=...&providerName=...&amount=200
export async function GET(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: 'Disabled in production' }, { status: 403 });
    }

    await dbConnect();

    const url = new URL(req.url);
    const to = url.searchParams.get('to');
    const rawDate = url.searchParams.get('date');
    const rawTime = url.searchParams.get('time');
    const serviceName = url.searchParams.get('serviceName') || 'Handyman - Dev Test Job';
    const providerName = url.searchParams.get('providerName') || 'TradesMonk Provider';
    const providerEmailFromQuery = url.searchParams.get('providerEmail');
    const amountParam = url.searchParams.get('amount');
    const amount = amountParam ? Number(amountParam) : 150;

    if (!to) return NextResponse.json({ success: false, error: 'Missing to=email@example.com' }, { status: 400 });

    const date = normalizeDate(rawDate) || new Date().toISOString().split('T')[0];
    const time = normalizeTime(rawTime);

    const booking = new Booking({
      userId: 'dev-user',
      serviceId: 'dev-service-id',
      serviceName,
      serviceType: 'dev-test',
      providerName,
      amount,
      price: amount,
      estimatedTime: '2 hours',
      serviceDuration: 2,
      userEmail: process.env.EMAIL_USER || 'noreply@tradesmonk.com',
      customerEmail: to,
      description: 'Dev-created dummy booking for email/review testing',
      specialInstructions: 'Dev-only',
      clientName: 'Dev Tester',
      clientPhone: '(555) 555-5555',
      clientEmail: to,
      address: {
        addressLine1: '123 Test St',
        city: 'San Diego',
        state: 'CA',
        zipCode: '92101',
        serviceNotes: 'Dev address',
      },
      date,
      time,
      status: 'confirmed',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await booking.save();

    const bookingDateHuman = new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Direct review link
    const reviewParams = new URLSearchParams({
      bookingId: String(booking._id),
      customerName: 'Dev Tester',
      serviceName,
      providerName,
    });
    const origin = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const reviewUrl = `${origin}/reviews/submit?${reviewParams.toString()}`;

    const customerEmailSubject = `TradesMonk Booking Confirmation - ${toTitleCase(serviceName)} (DEV)`;
    const customerEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #000;">
        <h2 style="color: #000; border-bottom: 2px solid #007bff; padding-bottom: 10px;">[DEV] Booking Created</h2>
        <p style="color: #000;">Hi Dev Tester,</p>
        <p style="color: #000;">Your DEV dummy booking has been created to test emails and reviews:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #000; margin: 8px 0;"><strong>Service:</strong> ${toTitleCase(serviceName)}</p>
          <p style="color: #000; margin: 8px 0;"><strong>Provider:</strong> ${toTitleCase(providerName)}</p>
          <p style="color: #000; margin: 8px 0;"><strong>Date:</strong> ${bookingDateHuman}</p>
          <p style="color: #000; margin: 8px 0;"><strong>Time:</strong> ${time}</p>
          <p style="color: #000; margin: 8px 0;"><strong>Price:</strong> $${amount}</p>
          <p style="color: #000; margin: 8px 0;"><strong>Address:</strong> 123 Test St, San Diego, CA 92101</p>
        </div>
        <p style="color: #000;">Leave a review now (DEV): <a href="${reviewUrl}">${reviewUrl}</a></p>
      </div>
    `;

    const providerEmail = providerEmailFromQuery || process.env.EMAIL_USER;
    const providerEmailSubject = `New TradesMonk Booking - ${toTitleCase(serviceName)} (DEV)`;
    const providerEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #000;">
        <h2 style="color: #000; border-bottom: 2px solid #007bff; padding-bottom: 10px;">[DEV] New Booking</h2>
        <p style="color: #000;">Hello ${toTitleCase(providerName)},</p>
        <p style="color: #000;">A DEV dummy booking was created to test notifications:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #000; margin: 8px 0;"><strong>Service:</strong> ${toTitleCase(serviceName)}</p>
          <p style="color: #000; margin: 8px 0;"><strong>Customer:</strong> Dev Tester</p>
          <p style="color: #000; margin: 8px 0;"><strong>Email:</strong> ${to}</p>
          <p style="color: #000; margin: 8px 0;"><strong>Date:</strong> ${bookingDateHuman}</p>
          <p style="color: #000; margin: 8px 0;"><strong>Time:</strong> ${time}</p>
          <p style="color: #000; margin: 8px 0;"><strong>Price:</strong> $${amount}</p>
          <p style="color: #000; margin: 8px 0;"><strong>Address:</strong> 123 Test St, San Diego, CA 92101</p>
        </div>
      </div>
    `;

    const emailResults: any = {};
    try { emailResults.customerMessageId = await sendEmail(to, customerEmailSubject, customerEmailContent); }
    catch (e: any) { emailResults.customerError = e?.message || 'Failed to send customer email'; }

    try { if (providerEmail) emailResults.providerMessageId = await sendEmail(providerEmail, providerEmailSubject, providerEmailContent); }
    catch (e: any) { emailResults.providerError = e?.message || 'Failed to send provider email'; }

    return NextResponse.json({
      success: true,
      note: 'DEV dummy booking created and emails attempted',
      booking: {
        id: booking._id,
        serviceName,
        providerName,
        providerEmail,
        date,
        time,
        amount,
        reviewUrl,
      },
      emailResults,
    });
  } catch (error: any) {
    console.error('Dev-create booking error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create dev dummy booking' }, { status: 500 });
  }
}
