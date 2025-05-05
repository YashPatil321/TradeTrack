// app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import stripe from "../../../../lib/stripe";
import dbConnect from "../../../../lib/dbConnect";
import Transaction from "../../../../models/Transaction";

// Disable Next.js body parsing since we need the raw body for Stripe signature verification
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const bodyParser = false;

// Helper function to create a buffer from the request stream
async function buffer(req: NextRequest) {
  const chunks: Uint8Array[] = [];
  const reader = req.body?.getReader();
  if (!reader) return new Uint8Array();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(new Uint8Array(value));
    }
    return new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
      .set(chunks.reduce((acc, chunk, index, array) => {
        acc.set(chunk, index === 0 ? 0 : array[index - 1].length);
        return acc;
      }, new Uint8Array()));
  } catch (error) {
    console.error("Error reading request body:", error);
    return new Uint8Array();
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

  const sig = headers().get('stripe-signature');
  if (!sig) {
    return NextResponse.json(
      { error: 'Missing Stripe signature' },
      { status: 400 }
    );
  }

  try {
    const body = await buffer(req);
    if (!body) {
      return NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(
      new TextDecoder().decode(body),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handlePaymentSuccess(paymentIntent);
        break;
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object;
        await handlePaymentFailure(failedPaymentIntent);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook Error:', err);
    return NextResponse.json(
      { error: 'Webhook Error' },
      { status: 400 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: any) {
  try {
    const transaction = await Transaction.findOne({
      paymentIntentId: paymentIntent.id
    });

    if (!transaction) {
      console.error('Transaction not found for payment intent:', paymentIntent.id);
      return;
    }

    transaction.status = 'completed';
    transaction.paymentId = paymentIntent.id;
    transaction.paymentStatus = paymentIntent.status;
    await transaction.save();

    console.log('Payment succeeded:', paymentIntent.id);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(paymentIntent: any) {
  try {
    const transaction = await Transaction.findOne({
      paymentIntentId: paymentIntent.id
    });

    if (!transaction) {
      console.error('Transaction not found for payment intent:', paymentIntent.id);
      return;
    }

    transaction.status = 'failed';
    transaction.paymentId = paymentIntent.id;
    transaction.paymentStatus = paymentIntent.status;
    await transaction.save();

    console.log('Payment failed:', paymentIntent.id);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}
