// app/api/stripe/account-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import dbConnect from "../../../../lib/dbConnect";
import stripe from "../../../../lib/stripe";
import User from "@/models/User";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user?.stripeAccountId) {
      return NextResponse.json({
        success: true,
        isConnected: false
      });
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    
    return NextResponse.json({
      success: true,
      isConnected: true,
      account
    });
  } catch (error: any) {
    console.error('Error checking Stripe account status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check account status' },
      { status: 500 }
    );
  }
}
