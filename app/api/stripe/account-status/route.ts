// app/api/stripe/account-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import dbConnect from "../../../../lib/dbConnect";
import stripe from "../../../../lib/stripe";
import Service from "../../../../models/Service";

export async function GET(req: NextRequest) {
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
    // Find all services for this user where they are a handyman
    const services = await Service.find({ 
      userEmail: session.user.email,
      trade: "handyman" 
    });

    // If no services found
    if (!services || services.length === 0) {
      return NextResponse.json(
        { success: false, error: "No handyman services found for this account" },
        { status: 404 }
      );
    }

    // Get the first service with a Stripe account ID (they should all have the same one)
    const serviceWithStripeAccount = services.find(service => service.stripeAccountId);
    
    if (!serviceWithStripeAccount?.stripeAccountId) {
      return NextResponse.json(
        { success: false, error: "No Stripe account connected", hasAccount: false },
        { status: 200 }
      );
    }

    // Get the account details from Stripe
    const account = await stripe.accounts.retrieve(
      serviceWithStripeAccount.stripeAccountId
    );

    return NextResponse.json(
      { 
        success: true,
        hasAccount: true,
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error retrieving Stripe Connect account:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
