import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Review from '@/models/Review';

interface ReviewSubmission {
  customerEmail: string;
  customerName: string;
  bookingId: string;
  serviceName: string;
  serviceType: string;
  providerName: string;
  providerEmail?: string;
  rating: number;
  reviewText?: string;
  wouldRecommend?: boolean;
  serviceQuality?: number;
  timeliness?: number;
  communication?: number;
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const reviewData: ReviewSubmission = await request.json();

    // Validate required fields (include serviceType which the model requires)
    if (!reviewData.customerEmail || !reviewData.customerName || !reviewData.bookingId || 
        !reviewData.serviceName || !reviewData.serviceType || !reviewData.providerName || !reviewData.rating) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields for review submission' },
        { status: 400 }
      );
    }

    // Validate rating is between 1-5
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5 stars' },
        { status: 400 }
      );
    }

    // Check if review already exists for this booking
    const existingReview = await Review.findOne({
      bookingId: reviewData.bookingId,
      customerEmail: reviewData.customerEmail
    });

    if (existingReview) {
      return NextResponse.json({
        success: false,
        error: 'A review has already been submitted for this booking'
      }, { status: 409 });
    }

    // Create new review
    const newReview = new Review({
      customerEmail: reviewData.customerEmail.toLowerCase(),
      customerName: reviewData.customerName,
      bookingId: reviewData.bookingId,
      serviceName: reviewData.serviceName,
      serviceType: reviewData.serviceType,
      providerName: reviewData.providerName,
      providerEmail: reviewData.providerEmail,
      rating: reviewData.rating,
      reviewText: reviewData.reviewText || '',
      wouldRecommend: reviewData.wouldRecommend,
      serviceQuality: reviewData.serviceQuality,
      timeliness: reviewData.timeliness,
      communication: reviewData.communication,
      reviewDate: new Date(),
      isVerified: true
    });

    const savedReview = await newReview.save();

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      reviewId: savedReview._id
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to submit review' },
      { status: 500 }
    );
  }
}

// GET route to fetch reviews (for display purposes)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const providerName = searchParams.get('provider');
    const serviceName = searchParams.get('service');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    let query: any = {};
    
    if (providerName) {
      query.providerName = { $regex: providerName, $options: 'i' };
    }
    
    if (serviceName) {
      query.serviceName = { $regex: serviceName, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const reviews = await Review.find(query)
      .sort({ reviewDate: -1 })
      .skip(skip)
      .limit(limit)
      .select('-customerEmail') // Don't expose customer emails publicly
      .lean();

    const totalReviews = await Review.countDocuments(query);
    const totalPages = Math.ceil(totalReviews / limit);

    // Calculate average rating
    const avgRatingResult = await Review.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const averageRating = avgRatingResult.length > 0 ? 
      Math.round(avgRatingResult[0].averageRating * 10) / 10 : 0;

    return NextResponse.json({
      success: true,
      reviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      statistics: {
        averageRating,
        totalReviews
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
