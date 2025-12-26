// Utility functions for the automated review system

interface BookingData {
  customerEmail: string;
  customerName: string;
  bookingId: string;
  serviceName: string;
  serviceType: string;
  providerName: string;
  providerEmail?: string;
  bookingDate: string;
}

/**
 * Triggers a review email to be sent to the customer
 * This should be called after a booking is completed/confirmed
 */
export async function sendReviewEmail(bookingData: BookingData): Promise<boolean> {
  try {
    const response = await fetch('/api/reviews/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('Review email sent successfully:', result.message);
      return true;
    } else {
      console.error('Failed to send review email:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Error sending review email:', error);
    return false;
  }
}

/**
 * Schedules a review email to be sent after a delay (e.g., 24 hours after service completion)
 * This is useful for sending review requests after the service is actually completed
 */
export function scheduleReviewEmail(bookingData: BookingData, delayHours: number = 24): void {
  const delayMs = delayHours * 60 * 60 * 1000; // Convert hours to milliseconds
  
  setTimeout(async () => {
    await sendReviewEmail(bookingData);
  }, delayMs);
  
  console.log(`Review email scheduled for ${bookingData.customerEmail} in ${delayHours} hours`);
}

/**
 * Validates review data before submission
 */
export function validateReviewData(reviewData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!reviewData.customerEmail || !isValidEmail(reviewData.customerEmail)) {
    errors.push('Valid customer email is required');
  }
  
  if (!reviewData.customerName || reviewData.customerName.trim().length < 2) {
    errors.push('Customer name is required');
  }
  
  if (!reviewData.bookingId || reviewData.bookingId.trim().length < 1) {
    errors.push('Booking ID is required');
  }
  
  if (!reviewData.serviceName || reviewData.serviceName.trim().length < 1) {
    errors.push('Service name is required');
  }
  
  if (!reviewData.providerName || reviewData.providerName.trim().length < 1) {
    errors.push('Provider name is required');
  }
  
  if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
    errors.push('Rating must be between 1 and 5 stars');
  }
  
  if (reviewData.reviewText && reviewData.reviewText.length > 1000) {
    errors.push('Review text cannot exceed 1000 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Helper function to validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Formats review data for display
 */
export function formatReviewForDisplay(review: any) {
  return {
    ...review,
    reviewDate: new Date(review.reviewDate).toLocaleDateString(),
    rating: Math.round(review.rating),
    reviewText: review.reviewText || 'No written review provided',
    customerName: review.customerName || 'Anonymous'
  };
}

/**
 * Calculates average rating from an array of reviews
 */
export function calculateAverageRating(reviews: any[]): number {
  if (reviews.length === 0) return 0;
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal place
}

/**
 * Groups reviews by rating for statistics
 */
export function getReviewStatistics(reviews: any[]) {
  const stats = {
    total: reviews.length,
    average: calculateAverageRating(reviews),
    distribution: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    }
  };
  
  reviews.forEach(review => {
    const rating = Math.round(review.rating);
    if (rating >= 1 && rating <= 5) {
      stats.distribution[rating as keyof typeof stats.distribution]++;
    }
  });
  
  return stats;
}
