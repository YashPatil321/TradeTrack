// models/Transaction.ts
import mongoose, { Schema, model, models } from "mongoose";

const TransactionSchema = new Schema({
  amount: { 
    type: Number, 
    required: true 
  },
  currency: { 
    type: String, 
    required: true,
    default: 'usd'
  },
  status: { 
    type: String, 
    required: true,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentIntentId: { 
    type: String, 
    required: true 
  },
  serviceId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Service',
    required: true 
  },
  customerEmail: { 
    type: String, 
    required: true 
  },
  handymanEmail: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String
  },
  metadata: {
    type: Object
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default models.Transaction || model("Transaction", TransactionSchema);
