// models/Booking.ts
import mongoose, { Schema, model, models } from "mongoose";

const BookingSchema = new Schema({
  // Let MongoDB handle the _id with its default ObjectId
  userId: { type: String, required: true },
  serviceId: { type: String, required: true },
  serviceName: { type: String, required: true },
  serviceType: { type: String },
  providerName: { type: String },
  amount: { type: Number, required: true },
  originalAmount: { type: Number },
  finalAmount: { type: Number },
  discountPercentApplied: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  price: { type: Number },
  estimatedTime: { type: String },
  serviceDuration: { type: Number, default: 1 },
  userEmail: { type: String, required: true },
  customerEmail: { type: String, required: true },
  description: { type: String },
  referralCodeUsed: { type: String },
  referrerEmail: { type: String },
  materialName: { type: String },
  materialPrice: { type: Number },
  specialInstructions: { type: String },
  // Client information
  clientName: { type: String },
  clientPhone: { type: String },
  clientEmail: { type: String },
  // Address information
  address: {
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    serviceNotes: { type: String }
  },
  // Booking timing
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'confirmed'
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentIntentId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default models.Booking || model("Booking", BookingSchema);
