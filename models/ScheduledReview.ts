import mongoose from 'mongoose';

const ScheduledReviewSchema = new mongoose.Schema({
  // Booking information
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Customer details
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
  
  // Service details
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
  
  // Scheduling information
  jobCompletedDate: {
    type: Date,
    required: true
  },
  scheduledSendDate: {
    type: Date,
    required: true
  },
  
  // Status tracking
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentDate: {
    type: Date,
    required: false
  },
  
  // Retry logic
  attemptCount: {
    type: Number,
    default: 0
  },
  lastAttemptDate: {
    type: Date,
    required: false
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
ScheduledReviewSchema.index({ scheduledSendDate: 1, emailSent: 1 });
ScheduledReviewSchema.index({ bookingId: 1 });
ScheduledReviewSchema.index({ customerEmail: 1 });

const ScheduledReview = mongoose.models.ScheduledReview || mongoose.model('ScheduledReview', ScheduledReviewSchema);

export default ScheduledReview;
