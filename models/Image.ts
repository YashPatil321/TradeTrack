import mongoose, { Schema, model, models } from "mongoose";

const ImageSchema = new Schema({
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  data: { type: Buffer, required: true },
  size: { type: Number, required: true },
  uploadedBy: { type: String, required: true }, // user's email
  createdAt: { type: Date, default: Date.now },
  serviceId: { type: Schema.Types.ObjectId, ref: 'Service' }
});

export default models.Image || model("Image", ImageSchema); 