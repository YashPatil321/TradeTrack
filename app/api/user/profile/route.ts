import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

// POST handler for updating user profile
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const { email, profileType } = body;
    
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }
    
    // Update the user document with profile type
    const updateData: any = { updatedAt: new Date() };
    
    // Only add profileType if it's provided
    if (profileType) {
      updateData.profileType = profileType;
    }
    
    // Update the user document
    const user = await User.findOneAndUpdate(
      { email },
      updateData,
      { new: true, upsert: true } // Create if doesn't exist
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
    
    // Return profile information in a more structured way
    return NextResponse.json({ 
      success: true, 
      profile: user ? {
        type: user.profileType || null,
        email: user.email,
        name: user.name,
        id: user._id
      } : null 
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
