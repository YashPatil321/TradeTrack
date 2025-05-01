// app/api/payments/create-intent/route.ts
import { NextRequest, NextResponse } from "next/server";
import stripe from "../../../../lib/stripe";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import dbConnect from "../../../../lib/dbConnect";
import Service from "../../../../models/Service";

export async function POST(req: NextRequest) {
  await dbConnect();
  
  // Get the user session to verify authentication
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.email) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Parse request body
    const body = await req.json();
    
    if (!body.serviceId || !body.amount) {
      return NextResponse.json(
        { success: false, error: "Service ID and amount are required" },
        { status: 400 }
      );
    }

    // Validate that the service exists
    const service = await Service.findById(body.serviceId);
    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(body.amount * 100), // Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        serviceId: body.serviceId,
        serviceName: service.name,
        customerEmail: session.user.email,
        handymanEmail: service.userEmail,
      },
      // Optional fields
      description: `Payment for ${service.name} handyman service`,
    });

    return NextResponse.json(
      {
        success: true,
        clientSecret: paymentIntent.client_secret
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
