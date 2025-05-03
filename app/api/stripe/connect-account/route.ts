// app/api/stripe/connect-account/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import dbConnect from "../../../../lib/dbConnect";
import stripe from "../../../../lib/stripe";
import Service from "../../../../models/Service";

export async function POST(req: NextRequest) {
  await dbConnect();

  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    
    // Create a Stripe account link for onboarding
    const account = await stripe.accounts.create({
      type: 'express',
      email: session.user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        userEmail: session.user.email
      }
    });

    // Create the account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${body.baseUrl}/profile?refresh=true`,
      return_url: `${body.baseUrl}/profile?success=true`,
      type: 'account_onboarding',
    });

    // Store the Stripe account ID in the user's services
    await Service.updateMany(
      { userEmail: session.user.email, trade: "handyman" }, 
      { $set: { stripeAccountId: account.id }}
    );

    return NextResponse.json(
      { 
        success: true, 
        url: accountLink.url,
        accountId: account.id
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error creating Stripe Connect account:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
