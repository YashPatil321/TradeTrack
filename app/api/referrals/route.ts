import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User, { IUser } from '@/models/User';

// GET /api/referrals?validate=TM-XXXXXX&customerEmail=foo@bar
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const code = (searchParams.get('validate') || '').trim().toUpperCase();
    const customerEmail = (searchParams.get('customerEmail') || '').trim().toLowerCase();
    if (!code) return NextResponse.json({ success: false, error: 'Code required' }, { status: 400 });

    const referrer = await User.findOne({ referralCode: code }).lean() as IUser | null;
    if (!referrer) return NextResponse.json({ success: false, error: 'Invalid referral code' }, { status: 404 });
    if (!referrer.referralEligible) {
      return NextResponse.json({ success: false, error: 'Referral program not enabled for this user' }, { status: 400 });
    }

    if (customerEmail && referrer.email && referrer.email.toLowerCase() === customerEmail) {
      return NextResponse.json({ success: false, error: 'Cannot use your own referral code' }, { status: 400 });
    }

    // Basic policy: new customer gets 10% off first booking; referrer gets +1 credit
    return NextResponse.json({ success: true, data: { code, referrerEmail: referrer.email, discountPercent: 10 } });
  } catch (e) {
    console.error('Referral validate error', e);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
