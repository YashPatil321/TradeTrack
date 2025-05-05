// app/api/payments/webhook/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import dbConnect from "../../../../lib/dbConnect";
import Transaction from "../../../../models/Transaction";

// Configure runtime for edge compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    // Connect to database first
    await dbConnect();

    const body = await req.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature found in request' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent was successful:', paymentIntent.id);
        await handlePaymentSuccess(paymentIntent);
        break;
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', failedPayment.id);
        await handlePaymentFailure(failedPayment);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
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
    throw error; // Re-throw to be caught by the main try-catch
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
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
    throw error; // Re-throw to be caught by the main try-catch
  }
}
