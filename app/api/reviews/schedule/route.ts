import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ScheduledReview from '@/models/ScheduledReview';

interface ScheduleReviewRequest {
  customerEmail: string;
  customerName: string;
  bookingId: string;
  serviceName: string;
  serviceType: string;
  providerName: string;
  providerEmail?: string;
  jobCompletedDate: string; // ISO date string when job was completed
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const {
      customerEmail,
      customerName,
      bookingId,
      serviceName,
      serviceType,
      providerName,
      providerEmail,
      jobCompletedDate
    }: ScheduleReviewRequest = await request.json();

    // Validate required fields
    if (!customerEmail || !customerName || !bookingId || !serviceName || !providerName || !jobCompletedDate) {
      return NextResponse.json(
        { error: 'Missing required fields for scheduling review email' },
        { status: 400 }
      );
    }

    // Check if review email is already scheduled for this booking
    const existingSchedule = await ScheduledReview.findOne({ bookingId });
    if (existingSchedule) {
      return NextResponse.json(
        { error: 'Review email already scheduled for this booking' },
        { status: 409 }
      );
    }

    // Calculate scheduled send date (24 hours after job completion)
    const completedDate = new Date(jobCompletedDate);
    const scheduledSendDate = new Date(completedDate.getTime() + (24 * 60 * 60 * 1000)); // Add 24 hours

    // Create scheduled review entry
    const scheduledReview = new ScheduledReview({
      bookingId,
      customerEmail: customerEmail.toLowerCase(),
      customerName,
      serviceName,
      serviceType,
      providerName,
      providerEmail,
      jobCompletedDate: completedDate,
      scheduledSendDate,
      emailSent: false,
      attemptCount: 0
    });

    await scheduledReview.save();

    return NextResponse.json({
      success: true,
      message: 'Review email scheduled successfully',
      scheduledSendDate: scheduledSendDate.toISOString(),
      bookingId
    }, { status: 201 });

  } catch (error) {
    console.error('Error scheduling review email:', error);
    return NextResponse.json(
      { error: 'Failed to schedule review email' },
      { status: 500 }
    );
  }
}

// GET route to check scheduled reviews (for debugging/admin purposes)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const pending = searchParams.get('pending') === 'true';

    let query: any = {};
    
    if (bookingId) {
      query.bookingId = bookingId;
    }
    
    if (pending) {
      query.emailSent = false;
      query.scheduledSendDate = { $lte: new Date() };
    }

    const scheduledReviews = await ScheduledReview.find(query)
      .sort({ scheduledSendDate: 1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      scheduledReviews,
      count: scheduledReviews.length
    });

  } catch (error) {
    console.error('Error fetching scheduled reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled reviews' },
      { status: 500 }
    );
  }
}
