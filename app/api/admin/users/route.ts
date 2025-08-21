import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

// GET: list users (admin-only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 });
    const isAdmin = session.user.email === 'yashp.d39@gmail.com';
    if (!isAdmin) return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });

    await dbConnect();
    const users = await User.find({}, { email: 1, name: 1, role: 1, type: 1, referralCode: 1, referralEligible: 1, referralCredits: 1, hasBookedBefore: 1, createdAt: 1 }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: users });
  } catch (e) {
    console.error('Admin users GET error', e);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

// PUT: update user referral eligibility (admin-only)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 });
    const isAdmin = session.user.email === 'yashp.d39@gmail.com';
    if (!isAdmin) return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });

    await dbConnect();
    const body = await req.json();
    const { email, referralEligible } = body || {};
    if (!email || typeof referralEligible !== 'boolean') return NextResponse.json({ success: false, error: 'email and referralEligible required' }, { status: 400 });

    const doc = await User.findOneAndUpdate(
      { email },
      { referralEligible, updatedAt: new Date() },
      { new: true }
    );
    if (!doc) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: { email: doc.email, referralEligible: doc.referralEligible } });
  } catch (e) {
    console.error('Admin users PUT error', e);
    return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 });
  }
}
