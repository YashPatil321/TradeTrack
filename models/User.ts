import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'provider', 'admin'],
    default: 'user',
  },
  type: {
    type: String,
    enum: ['client', 'provider', 'both'],
    default: 'client',
  },
  // Referral program fields
  referralEligible: {
    type: Boolean,
    default: false,
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  referredBy: {
    type: String, // store referrer's email or code
  },
  referralCredits: {
    type: Number,
    default: 0, // could represent currency-based credit if needed
  },
  nextDiscountPercent: {
    type: Number,
    default: 0, // set to 10 when someone uses their code successfully
  },
  hasBookedBefore: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;