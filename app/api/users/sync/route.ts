import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

// POST /api/users/sync - Save/update user in MongoDB when they log in
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    await dbConnect();

    const { email, name } = session.user;
    
    // Generate a unique referral code if user doesn't have one
    const generateReferralCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = 'TM-';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Create new user with referral code
      let referralCode = generateReferralCode();
      
      // Ensure referral code is unique
      while (await User.findOne({ referralCode })) {
        referralCode = generateReferralCode();
      }
      
      user = new User({
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        referralCode,
        role: 'user',
        type: 'client'
      });
      
      await user.save();
      console.log('Created new user:', email);
    } else {
      // Update existing user's name if changed and ensure they have a referral code
      let needsUpdate = false;
      
      if (user.name !== name && name) {
        user.name = name;
        needsUpdate = true;
      }
      
      if (!user.referralCode) {
        let referralCode = generateReferralCode();
        while (await User.findOne({ referralCode })) {
          referralCode = generateReferralCode();
        }
        user.referralCode = referralCode;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await user.save();
        console.log('Updated existing user:', email);
      }
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        email: user.email,
        name: user.name,
        referralCode: user.referralCode,
        role: user.role,
        type: user.type
      }
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json({ success: false, error: 'Failed to sync user' }, { status: 500 });
  }
}
