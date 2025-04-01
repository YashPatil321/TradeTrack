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
  certifications: { type: String },
  cleaningType: { type: String },
  license: { type: String },
  mainLocation: { type: String, required: true },
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
    enum: ["food_truck", "plumber", "electrician", "cleaner"],
    required: true,
  },
  // Associate the service with the user (e.g., by storing their email)
  userEmail: { type: String, required: true },
});

export default models.Service || model("Service", ServiceSchema);
