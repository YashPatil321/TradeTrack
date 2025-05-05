// models/Booking.ts
import mongoose, { Schema, model, models } from "mongoose";

const BookingSchema = new Schema({
  // Let MongoDB handle the _id with its default ObjectId
  userId: { type: String, required: true },
  serviceId: { type: String, required: true },
  serviceName: { type: String, required: true },
  amount: { type: Number, required: true },
  customerEmail: { type: String, required: true },
  description: { type: String },
  address: {
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    serviceNotes: { type: String },
    // Add date and time here to store them from query parameters if available
    date: { type: String },
    time: { type: String }
  },
  // Make these optional since they might come from address object
  date: { type: String },
  time: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
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
