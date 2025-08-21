import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPromotion extends Document {
  code: string; // case-insensitive unique code
  description?: string;
  type: 'percent' | 'fixed';
  value: number; // percent (0-100) or fixed amount in USD
  maxDiscount?: number; // optional cap for percent promos
  active: boolean;
  startsAt?: Date;
  endsAt?: Date;
  usageLimit?: number; // optional total usage cap
  usageCount: number; // increment on each successful application
  createdAt: Date;
  updatedAt: Date;
}

const PromotionSchema = new Schema<IPromotion>({
  code: { type: String, required: true, unique: true, index: true },
  description: { type: String },
  type: { type: String, enum: ['percent', 'fixed'], required: true },
  value: { type: Number, required: true },
  maxDiscount: { type: Number },
  active: { type: Boolean, default: true },
  startsAt: { type: Date },
  endsAt: { type: Date },
  usageLimit: { type: Number },
  usageCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

PromotionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Promotion: Model<IPromotion> = mongoose.models.Promotion || mongoose.model<IPromotion>('Promotion', PromotionSchema);
export default Promotion;
