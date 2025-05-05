import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

// Define a schema for user profiles if it doesn't exist already
let Profile: mongoose.Model<any>;

try {
  // Try to get the existing model
  Profile = mongoose.model('Profile');
} catch {
  // If it doesn't exist, create a new one
  const ProfileSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    type: { type: String, enum: ['client', 'service_provider'], required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  Profile = mongoose.model('Profile', ProfileSchema);
}

// GET handler for retrieving a user profile
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const email = req.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }
    
    const profile = await Profile.findOne({ email });
    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST handler for creating/updating a user profile
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const { email, type } = body;
    
    if (!email || !type) {
      return NextResponse.json({ success: false, error: 'Email and type are required' }, { status: 400 });
    }
    
    if (!['client', 'service_provider'].includes(type)) {
      return NextResponse.json({ success: false, error: 'Type must be either client or service_provider' }, { status: 400 });
    }
    
    // Find and update or create new profile
    const profile = await Profile.findOneAndUpdate(
      { email },
      { email, type, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error('Error creating/updating profile:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
