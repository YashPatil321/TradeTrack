// models/Service.ts
import mongoose, { Schema, model, models } from "mongoose";

const ServiceSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  hours: { type: String, required: true },
  cuisine: { type: String },
  restrictions: [String],
  mealTimes: [String],
  // Additional fields for specific trades
  certifications: { type: String }, // plumber
  license: { type: String }, // electrician
  skillsAndServices: { type: String }, // handyman
  specialties: { type: String }, // painter
  mainLocation: { type: String, required: true },
  // GeoJSON location for static services like handyman (used by map)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },
  // Schedule for mobile services like food trucks
  schedule: [
    {
      day: { type: String, required: true },
      time: { type: String, required: true },
      address: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  ],
  trade: {
    type: String,
    enum: ["food_truck", "plumber", "electrician", "handyman", "painter"],
    required: true,
  },
  // Price information for handyman services
  price: { type: Number },
  priceType: { type: String }, // hourly, fixed, etc.
  // Associate the service with the user (e.g., by storing their email)
  userEmail: { type: String, required: true },
  // Stripe Connect account ID for receiving payments (for handyman services)
  stripeAccountId: { type: String },
});

export default models.Service || model("Service", ServiceSchema);