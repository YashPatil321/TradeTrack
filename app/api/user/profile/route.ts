import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

// POST handler for updating user profile
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }
    
    // Update the user document
    const user = await User.findOneAndUpdate(
      { email },
      { 
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET handler for retrieving user profile
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const email = req.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }
    
    const user = await User.findOne({ email });
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
