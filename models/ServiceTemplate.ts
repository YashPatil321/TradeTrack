// models/ServiceTemplate.ts
import mongoose, { Schema, model, models } from 'mongoose';

const ServiceTemplateSchema = new Schema(
  {
    trade: {
      type: String,
      enum: ['handyman', 'plumbing', 'electrician', 'painting'],
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true }, // keep as human-readable string like "$500"
    timeEstimate: { type: String, required: true },
    // optional: who created
    createdBy: { type: String },
  },
  { timestamps: true }
);

export default models.ServiceTemplate || model('ServiceTemplate', ServiceTemplateSchema);
