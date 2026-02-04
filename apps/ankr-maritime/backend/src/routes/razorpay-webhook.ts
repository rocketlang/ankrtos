/**
 * Razorpay Webhook Handler
 * Handles payment events from Razorpay (payment.captured, payment.failed, etc.)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import {
  verifyPaymentSignature,
  handleSuccessfulPayment,
  handleFailedPayment,
} from '../lib/razorpay.js';

interface WebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        invoice_id: string | null;
        international: boolean;
        method: string;
        amount_refunded: number;
        refund_status: string | null;
        captured: boolean;
        description: string;
        card_id: string | null;
        bank: string | null;
        wallet: string | null;
        vpa: string | null;
        email: string;
        contact: string;
        notes: {
          userId?: string;
          organizationId?: string;
          tier?: string;
          billingCycle?: string;
          type?: string;
        };
        fee: number;
        tax: number;
        error_code: string | null;
        error_description: string | null;
        error_source: string | null;
        error_step: string | null;
        error_reason: string | null;
        created_at: number;
      };
    };
  };
  created_at: number;
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Handle payment.captured event
 */
async function handlePaymentCaptured(payment: any): Promise<void> {
  const { id: paymentId, order_id: orderId, notes } = payment;
  const userId = notes?.userId;

  if (!userId) {
    console.error('No userId in payment notes:', paymentId);
    return;
  }

  try {
    await handleSuccessfulPayment(orderId, paymentId, userId);
    console.log(`✅ Payment captured webhook processed: ${paymentId}`);
  } catch (error: any) {
    console.error('Failed to handle payment.captured:', error.message);
    throw error;
  }
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(payment: any): Promise<void> {
  const { order_id: orderId, error_description } = payment;

  try {
    await handleFailedPayment(orderId, error_description || 'Payment failed');
    console.log(`❌ Payment failed webhook processed: ${orderId}`);
  } catch (error: any) {
    console.error('Failed to handle payment.failed:', error.message);
  }
}

/**
 * Handle subscription.cancelled event
 */
async function handleSubscriptionCancelled(subscription: any): Promise<void> {
  const { id: razorpaySubscriptionId, notes } = subscription;
  const userId = notes?.userId;

  if (!userId) {
    console.error('No userId in subscription notes:', razorpaySubscriptionId);
    return;
  }

  try {
    const userSubscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (userSubscription) {
      await prisma.subscription.update({
        where: { id: userSubscription.id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days grace
        },
      });

      await prisma.subscriptionEvent.create({
        data: {
          subscriptionId: userSubscription.id,
          eventType: 'subscription_cancelled_by_webhook',
          eventData: { razorpaySubscriptionId },
          createdBy: userId,
        },
      });

      console.log(`✅ Subscription cancelled webhook processed: ${userId}`);
    }
  } catch (error: any) {
    console.error('Failed to handle subscription.cancelled:', error.message);
  }
}

/**
 * Handle subscription.charged event
 */
async function handleSubscriptionCharged(payment: any): Promise<void> {
  const { id: paymentId, order_id: orderId, notes } = payment;
  const userId = notes?.userId;

  if (!userId) {
    console.error('No userId in payment notes:', paymentId);
    return;
  }

  try {
    // Log the recurring payment
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (subscription) {
      await prisma.subscriptionInvoice.create({
        data: {
          subscriptionId: subscription.id,
          organizationId: subscription.organizationId,
          invoiceNumber: paymentId,
          amountCents: payment.amount,
          currency: payment.currency,
          status: 'paid',
          paidAt: new Date(),
          billingPeriodStart: new Date(),
          billingPeriodEnd: new Date(
            Date.now() +
              (subscription.billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000
          ),
        },
      });

      await prisma.subscriptionEvent.create({
        data: {
          subscriptionId: subscription.id,
          eventType: 'recurring_payment_successful',
          eventData: { paymentId, orderId, amount: payment.amount },
          createdBy: userId,
        },
      });

      console.log(`✅ Subscription charged webhook processed: ${paymentId}`);
    }
  } catch (error: any) {
    console.error('Failed to handle subscription.charged:', error.message);
  }
}

/**
 * Register webhook routes
 */
export async function registerRazorpayWebhook(app: FastifyInstance) {
  app.post('/api/webhooks/razorpay', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

      if (!signature) {
        reply.code(400).send({ error: 'Missing signature' });
        return;
      }

      // Get raw body
      const payload = JSON.stringify(req.body);

      // Verify signature
      const isValid = verifyWebhookSignature(payload, signature, webhookSecret);

      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        reply.code(401).send({ error: 'Invalid signature' });
        return;
      }

      const data = req.body as WebhookPayload;
      const event = data.event;

      console.log(`📥 Razorpay webhook received: ${event}`);

      // Handle different event types
      switch (event) {
        case 'payment.captured':
          await handlePaymentCaptured(data.payload.payment.entity);
          break;

        case 'payment.failed':
          await handlePaymentFailed(data.payload.payment.entity);
          break;

        case 'subscription.cancelled':
          await handleSubscriptionCancelled((data.payload as any).subscription.entity);
          break;

        case 'subscription.charged':
          await handleSubscriptionCharged(data.payload.payment.entity);
          break;

        case 'subscription.completed':
          console.log('ℹ️ Subscription completed (no action needed)');
          break;

        case 'subscription.paused':
          console.log('ℹ️ Subscription paused (no action needed)');
          break;

        case 'subscription.resumed':
          console.log('ℹ️ Subscription resumed (no action needed)');
          break;

        default:
          console.log(`ℹ️ Unhandled webhook event: ${event}`);
      }

      reply.code(200).send({ status: 'ok' });
    } catch (error: any) {
      console.error('❌ Webhook processing error:', error.message);
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  console.log('✅ Razorpay webhook endpoint registered at /api/webhooks/razorpay');
}
