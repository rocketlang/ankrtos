/**
 * Razorpay Integration - Indian Payment Gateway
 * Supports UPI, Cards, Net Banking, Wallets
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from './prisma.js';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export interface CreateOrderInput {
  userId: string;
  organizationId: string;
  tier: string;
  billingCycle: 'monthly' | 'annual';
  amountCents: number;
  currency: string;
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

export interface PaymentVerificationInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Create Razorpay order for subscription payment
 */
export async function createSubscriptionOrder(input: CreateOrderInput): Promise<RazorpayOrder> {
  const { userId, organizationId, tier, billingCycle, amountCents, currency } = input;

  // Generate unique receipt
  const receipt = `sub_${tier}_${billingCycle}_${Date.now()}`;

  try {
    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountCents, // Amount in paise (for INR) or smallest currency unit
      currency: currency || 'INR',
      receipt,
      notes: {
        userId,
        organizationId,
        tier,
        billingCycle,
        type: 'subscription',
      },
    });

    console.log(`✅ Razorpay order created: ${order.id} for ${amountCents / 100} ${currency}`);

    // Store order in database (pending)
    await prisma.subscriptionInvoice.create({
      data: {
        subscriptionId: userId, // Will be updated after payment
        organizationId,
        invoiceNumber: order.id,
        amountCents,
        currency,
        status: 'draft',
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
      },
    });

    return order;
  } catch (error: any) {
    console.error('❌ Razorpay order creation failed:', error.message);
    throw new Error(`Failed to create payment order: ${error.message}`);
  }
}

/**
 * Verify Razorpay payment signature
 */
export function verifyPaymentSignature(input: PaymentVerificationInput): boolean {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = input;

  try {
    // Generate signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Compare signatures
    const isValid = generatedSignature === razorpay_signature;

    if (isValid) {
      console.log(`✅ Payment verified: ${razorpay_payment_id}`);
    } else {
      console.error(`❌ Payment verification failed: ${razorpay_payment_id}`);
    }

    return isValid;
  } catch (error: any) {
    console.error('❌ Signature verification error:', error.message);
    return false;
  }
}

/**
 * Handle successful payment (activate subscription)
 */
export async function handleSuccessfulPayment(
  orderId: string,
  paymentId: string,
  userId: string
): Promise<void> {
  try {
    // Get order details
    const order = await razorpay.orders.fetch(orderId);
    const payment = await razorpay.payments.fetch(paymentId);

    if (payment.status !== 'captured') {
      throw new Error('Payment not captured');
    }

    const { tier, billingCycle, organizationId } = order.notes as any;

    // Get or create subscription
    let subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (subscription) {
      // Update existing subscription
      subscription = await prisma.subscription.update({
        where: { userId },
        data: {
          tier,
          billingCycle,
          status: 'active',
          amountCents: order.amount,
          currency: order.currency,
          startDate: new Date(),
          endDate: new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
          trialEndsAt: null, // End trial
        },
      });
    } else {
      // Create new subscription
      subscription = await prisma.subscription.create({
        data: {
          userId,
          organizationId,
          tier,
          billingCycle,
          status: 'active',
          amountCents: order.amount,
          currency: order.currency,
          startDate: new Date(),
          endDate: new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Update invoice
    await prisma.subscriptionInvoice.update({
      where: { invoiceNumber: orderId },
      data: {
        subscriptionId: subscription.id,
        status: 'paid',
        paidAt: new Date(),
      },
    });

    // Log event
    await prisma.subscriptionEvent.create({
      data: {
        subscriptionId: subscription.id,
        eventType: 'payment_successful',
        eventData: {
          orderId,
          paymentId,
          amount: order.amount,
          currency: order.currency,
          method: payment.method,
        },
        createdBy: userId,
      },
    });

    console.log(`✅ Subscription activated: ${subscription.id} (${tier} - ${billingCycle})`);
  } catch (error: any) {
    console.error('❌ Failed to handle successful payment:', error.message);
    throw error;
  }
}

/**
 * Handle failed payment
 */
export async function handleFailedPayment(orderId: string, reason: string): Promise<void> {
  try {
    await prisma.subscriptionInvoice.update({
      where: { invoiceNumber: orderId },
      data: {
        status: 'void',
      },
    });

    console.log(`❌ Payment failed for order ${orderId}: ${reason}`);
  } catch (error: any) {
    console.error('❌ Failed to handle failed payment:', error.message);
  }
}

/**
 * Create subscription for recurring payments
 * Note: Razorpay subscriptions require separate setup
 */
export async function createRazorpaySubscription(input: {
  planId: string;
  customerId: string;
  quantity: number;
  notify: boolean;
}): Promise<any> {
  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: input.planId,
      customer_id: input.customerId,
      quantity: input.quantity,
      total_count: 12, // 12 months
      notify_info: {
        notify_email: true,
        notify_phone: true,
      },
    });

    console.log(`✅ Razorpay subscription created: ${subscription.id}`);
    return subscription;
  } catch (error: any) {
    console.error('❌ Failed to create Razorpay subscription:', error.message);
    throw error;
  }
}

/**
 * Cancel Razorpay subscription
 */
export async function cancelRazorpaySubscription(subscriptionId: string): Promise<void> {
  try {
    await razorpay.subscriptions.cancel(subscriptionId);
    console.log(`✅ Razorpay subscription cancelled: ${subscriptionId}`);
  } catch (error: any) {
    console.error('❌ Failed to cancel Razorpay subscription:', error.message);
    throw error;
  }
}

/**
 * Fetch payment details
 */
export async function fetchPaymentDetails(paymentId: string): Promise<any> {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error: any) {
    console.error('❌ Failed to fetch payment details:', error.message);
    throw error;
  }
}

/**
 * Create refund
 */
export async function createRefund(paymentId: string, amountCents?: number): Promise<any> {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amountCents, // Optional: full refund if not specified
      notes: {
        reason: 'Subscription cancellation',
      },
    });

    console.log(`✅ Refund created: ${refund.id} for payment ${paymentId}`);
    return refund;
  } catch (error: any) {
    console.error('❌ Failed to create refund:', error.message);
    throw error;
  }
}
