// app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import stripe from "../../../../lib/stripe";
import dbConnect from "../../../../lib/dbConnect";
import Transaction from "../../../../models/Transaction";

// Disable Next.js body parsing since we need the raw body for Stripe signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to create a buffer from the request stream
async function buffer(req: NextRequest) {
  const chunks: Buffer[] = [];
  const reader = req.body?.getReader();
  if (!reader) return Buffer.from([]);
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks);
  } catch (error) {
    console.error("Error reading request body:", error);
    return Buffer.from([]);
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Missing STRIPE_WEBHOOK_SECRET environment variable");
    return NextResponse.json(
      { error: "Webhook secret is not set" },
      { status: 500 }
    );
  }

  try {
    // Get the signature from headers
    const headersList = headers();
    const signature = headersList.get("stripe-signature");
    
    if (!signature) {
      return NextResponse.json(
        { error: "No signature found" },
        { status: 400 }
      );
    }

    // Get the raw body
    const rawBody = await buffer(req);
    
    // Verify and construct the event
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handleSuccessfulPayment(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await handleFailedPayment(event.data.object);
        break;
      // Add other event types as needed
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return NextResponse.json(
      { error: `Webhook error: ${error.message}` },
      { status: 400 }
    );
  }
}

// Handler for successful payments
async function handleSuccessfulPayment(paymentIntent: any) {
  // Extract metadata
  const { serviceId, customerEmail, handymanEmail } = paymentIntent.metadata;
  
  try {
    // Record the transaction in the database
    await Transaction.create({
      amount: paymentIntent.amount / 100, // Convert back from cents
      currency: paymentIntent.currency,
      status: 'completed',
      paymentIntentId: paymentIntent.id,
      serviceId,
      customerEmail,
      handymanEmail,
      description: paymentIntent.description,
      metadata: {
        paymentMethod: paymentIntent.payment_method_types[0],
        receiptUrl: paymentIntent.charges?.data[0]?.receipt_url
      }
    });
    
    // Here you could also:
    // 1. Send confirmation emails to both customer and handyman
    // 2. Update any booking or appointment status
    
    console.log(`Payment for service ${serviceId} successful:`, {
      amount: paymentIntent.amount / 100,
      customerEmail,
      handymanEmail,
      paymentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error recording successful payment:', error);
  }
}

// Handler for failed payments
async function handleFailedPayment(paymentIntent: any) {
  // Extract metadata
  const { serviceId, customerEmail, handymanEmail } = paymentIntent.metadata;
  
  try {
    // Record the failed transaction
    await Transaction.create({
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: 'failed',
      paymentIntentId: paymentIntent.id,
      serviceId,
      customerEmail,
      handymanEmail,
      description: paymentIntent.description,
      metadata: {
        errorMessage: paymentIntent.last_payment_error?.message || "Unknown error"
      }
    });
    
    console.log(`Payment for service ${serviceId} failed:`, {
      customerEmail,
      paymentId: paymentIntent.id,
      errorMessage: paymentIntent.last_payment_error?.message || "Unknown error",
    });
    
    // Here you could notify the customer about the failed payment
  } catch (error) {
    console.error('Error recording failed payment:', error);
  }
}
