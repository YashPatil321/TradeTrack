import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  // Customer information
  customerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Booking reference
  bookingId: {
    type: String,
    required: true
  },
  
  // Service and provider details
  serviceName: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  providerName: {
    type: String,
    required: true
  },
  providerEmail: {
    type: String,
    required: false
  },
  
  // Review content
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  reviewText: {
    type: String,
    required: false,
    maxlength: 1000
  },
  
  // Review metadata
  reviewDate: {
    type: Date,
    default: Date.now
  },
  isVerified: {
    type: Boolean,
    default: true // Since it's linked to a booking
  },
  
  // Optional fields for future features
  wouldRecommend: {
    type: Boolean,
    required: false
  },
  serviceQuality: {
    type: Number,
    min: 1,
    max: 5,
    required: false
  },
  timeliness: {
    type: Number,
    min: 1,
    max: 5,
    required: false
  },
  communication: {
    type: Number,
    min: 1,
    max: 5,
    required: false
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
ReviewSchema.index({ customerEmail: 1 });
ReviewSchema.index({ providerName: 1 });
ReviewSchema.index({ serviceName: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ reviewDate: -1 });

const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

export default Review;
