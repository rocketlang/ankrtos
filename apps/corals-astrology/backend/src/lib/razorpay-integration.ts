// =====================================================
// RAZORPAY PAYMENT INTEGRATION
// Complete Payment Gateway for Indian Market
// =====================================================

import Razorpay from 'razorpay';
import crypto from 'crypto';

// =====================================================
// RAZORPAY CONFIGURATION
// =====================================================

export const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

// =====================================================
// SUBSCRIPTION PLANS
// =====================================================

export const SUBSCRIPTION_PLANS = {
  FREEMIUM_MONTHLY: {
    id: 'freemium_monthly',
    name: 'Freemium Monthly',
    amount: 29900, // Amount in paise (₹299)
    currency: 'INR',
    period: 'monthly',
    interval: 1,
    description: '3 Numerology systems, 2 PDF reports, 1 Q&A per month'
  },

  FREEMIUM_YEARLY: {
    id: 'freemium_yearly',
    name: 'Freemium Yearly',
    amount: 299900, // ₹2,999 (17% discount)
    currency: 'INR',
    period: 'yearly',
    interval: 1,
    description: 'Save ₹589 with annual plan'
  },

  PRO_MONTHLY: {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    amount: 99900, // ₹999
    currency: 'INR',
    period: 'monthly',
    interval: 1,
    description: 'All 9 systems, unlimited PDFs, 5 Q&A per month'
  },

  PRO_YEARLY: {
    id: 'pro_yearly',
    name: 'Pro Yearly',
    amount: 999900, // ₹9,999 (17% discount)
    currency: 'INR',
    period: 'yearly',
    interval: 1,
    description: 'Save ₹1,989 with annual plan'
  },

  ENTERPRISE_MONTHLY: {
    id: 'enterprise_monthly',
    name: 'Enterprise Monthly',
    amount: 499900, // ₹4,999
    currency: 'INR',
    period: 'monthly',
    interval: 1,
    description: 'Unlimited Q&A, personal astrologer, family accounts'
  },

  ENTERPRISE_YEARLY: {
    id: 'enterprise_yearly',
    name: 'Enterprise Yearly',
    amount: 4999900, // ₹49,999 (17% discount)
    currency: 'INR',
    period: 'yearly',
    interval: 1,
    description: 'Save ₹9,989 with annual plan + lifetime benefits'
  }
};

// =====================================================
// ONE-TIME PRODUCTS
// =====================================================

export const ONE_TIME_PRODUCTS = {
  // PDF Reports
  VEDIC_REPORT: {
    id: 'vedic_report',
    name: 'Vedic Astrology Report',
    amount: 99900, // ₹999
    currency: 'INR',
    description: 'Complete Vedic astrology analysis with predictions'
  },

  NUMEROLOGY_REPORT: {
    id: 'numerology_report',
    name: 'Numerology Report',
    amount: 49900, // ₹499
    currency: 'INR',
    description: 'All 8 numerology systems analysis'
  },

  PALMISTRY_REPORT: {
    id: 'palmistry_report',
    name: 'Palmistry Report',
    amount: 79900, // ₹799
    currency: 'INR',
    description: 'Complete palm reading with remedies'
  },

  COMPATIBILITY_REPORT: {
    id: 'compatibility_report',
    name: 'Compatibility Report',
    amount: 149900, // ₹1,499
    currency: 'INR',
    description: 'Relationship compatibility across all systems'
  },

  COMPREHENSIVE_REPORT: {
    id: 'comprehensive_report',
    name: 'Comprehensive Report (All 9 Systems)',
    amount: 999900, // ₹9,999
    currency: 'INR',
    description: '50-100 pages complete life analysis'
  },

  // Q&A Questions
  SINGLE_QUESTION: {
    id: 'single_question',
    name: 'Ask The Acharya - Single Question',
    amount: 99900, // ₹999
    currency: 'INR',
    description: 'Get your question answered by Acharya Rakesh Ji'
  },

  PRIORITY_QUESTION: {
    id: 'priority_question',
    name: 'Priority Question (3-day response)',
    amount: 49900, // ₹499
    currency: 'INR',
    description: 'For existing subscribers - priority queue'
  },

  // Consultations
  CONSULTATION_30MIN: {
    id: 'consultation_30min',
    name: '30-Minute Video Consultation',
    amount: 299900, // ₹2,999
    currency: 'INR',
    description: 'Personal consultation with senior astrologer'
  },

  CONSULTATION_60MIN: {
    id: 'consultation_60min',
    name: '60-Minute Video Consultation',
    amount: 499900, // ₹4,999
    currency: 'INR',
    description: 'Extended consultation with detailed analysis'
  },

  ACHARYA_CONSULTATION: {
    id: 'acharya_consultation',
    name: 'Consultation with Acharya Rakesh Ji',
    amount: 999900, // ₹9,999
    currency: 'INR',
    description: 'Direct consultation with the founder'
  }
};

// =====================================================
// CREATE ORDER
// =====================================================

export interface CreateOrderParams {
  amount: number;
  currency: string;
  itemType: 'subscription' | 'report' | 'question' | 'consultation' | 'product';
  itemId: string;
  userId: string;
  userEmail: string;
  userPhone: string;
  userName: string;
}

export async function createRazorpayOrder(params: CreateOrderParams) {
  const {
    amount,
    currency,
    itemType,
    itemId,
    userId,
    userEmail,
    userPhone,
    userName
  } = params;

  try {
    const order = await razorpayInstance.orders.create({
      amount, // Amount in paise
      currency,
      receipt: `${itemType}_${userId}_${Date.now()}`,
      notes: {
        item_type: itemType,
        item_id: itemId,
        user_id: userId,
        user_email: userEmail,
        user_phone: userPhone,
        user_name: userName
      }
    });

    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    };
  } catch (error: any) {
    console.error('Razorpay order creation failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to create order'
    };
  }
}

// =====================================================
// VERIFY PAYMENT SIGNATURE
// =====================================================

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

// =====================================================
// PROCESS PAYMENT
// =====================================================

export interface ProcessPaymentParams {
  orderId: string;
  paymentId: string;
  signature: string;
  userId: string;
  itemType: string;
  itemId: string;
}

export async function processPayment(params: ProcessPaymentParams) {
  const { orderId, paymentId, signature, userId, itemType, itemId } = params;

  // Verify signature
  const isValid = verifyRazorpaySignature(orderId, paymentId, signature);

  if (!isValid) {
    return {
      success: false,
      error: 'Invalid payment signature'
    };
  }

  try {
    // Fetch payment details from Razorpay
    const payment = await razorpayInstance.payments.fetch(paymentId);

    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return {
        success: false,
        error: 'Payment not successful'
      };
    }

    return {
      success: true,
      payment: {
        id: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        phone: payment.contact,
        createdAt: new Date(payment.created_at * 1000)
      }
    };
  } catch (error: any) {
    console.error('Payment processing failed:', error);
    return {
      success: false,
      error: error.message || 'Payment processing failed'
    };
  }
}

// =====================================================
// CREATE SUBSCRIPTION
// =====================================================

export async function createRazorpaySubscription(
  planId: string,
  userId: string,
  userEmail: string,
  userPhone: string,
  totalCount?: number
) {
  try {
    const subscription = await razorpayInstance.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: totalCount || 12, // Default 12 months
      quantity: 1,
      notes: {
        user_id: userId,
        user_email: userEmail,
        user_phone: userPhone
      }
    });

    return {
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      planId: subscription.plan_id
    };
  } catch (error: any) {
    console.error('Subscription creation failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to create subscription'
    };
  }
}

// =====================================================
// CANCEL SUBSCRIPTION
// =====================================================

export async function cancelRazorpaySubscription(subscriptionId: string) {
  try {
    const subscription = await razorpayInstance.subscriptions.cancel(subscriptionId);

    return {
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      cancelledAt: new Date()
    };
  } catch (error: any) {
    console.error('Subscription cancellation failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to cancel subscription'
    };
  }
}

// =====================================================
// REFUND PAYMENT
// =====================================================

export async function refundPayment(paymentId: string, amount?: number) {
  try {
    const refund = await razorpayInstance.payments.refund(paymentId, {
      amount: amount, // If undefined, full refund
      speed: 'normal',
      notes: {
        reason: 'User requested refund'
      }
    });

    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status
    };
  } catch (error: any) {
    console.error('Refund failed:', error);
    return {
      success: false,
      error: error.message || 'Refund failed'
    };
  }
}

// =====================================================
// WEBHOOK HANDLING
// =====================================================

export interface WebhookEvent {
  event: string;
  payload: any;
}

export function handleWebhook(body: any, signature: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
      .update(JSON.stringify(body))
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return false;
  }
}

export async function processWebhookEvent(event: WebhookEvent) {
  const { event: eventType, payload } = event;

  switch (eventType) {
    case 'payment.captured':
      // Payment successful
      console.log('Payment captured:', payload.payment.entity.id);
      // Update database, activate subscription/service
      break;

    case 'payment.failed':
      // Payment failed
      console.log('Payment failed:', payload.payment.entity.id);
      // Notify user, update status
      break;

    case 'subscription.activated':
      // Subscription activated
      console.log('Subscription activated:', payload.subscription.entity.id);
      // Grant access to features
      break;

    case 'subscription.charged':
      // Subscription renewed
      console.log('Subscription charged:', payload.subscription.entity.id);
      // Extend subscription period
      break;

    case 'subscription.cancelled':
      // Subscription cancelled
      console.log('Subscription cancelled:', payload.subscription.entity.id);
      // Revoke access at end of period
      break;

    case 'subscription.completed':
      // Subscription term completed
      console.log('Subscription completed:', payload.subscription.entity.id);
      // Send renewal reminder
      break;

    case 'refund.created':
      // Refund processed
      console.log('Refund created:', payload.refund.entity.id);
      // Update order status
      break;

    default:
      console.log('Unhandled webhook event:', eventType);
  }

  return { success: true };
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function formatAmount(amountInPaise: number): string {
  return `₹${(amountInPaise / 100).toFixed(2)}`;
}

export function getSubscriptionPrice(tier: string, period: 'monthly' | 'yearly'): number {
  const key = `${tier.toUpperCase()}_${period.toUpperCase()}`;
  const plan = SUBSCRIPTION_PLANS[key as keyof typeof SUBSCRIPTION_PLANS];
  return plan ? plan.amount : 0;
}

export function getProductPrice(productId: string): number {
  const product = ONE_TIME_PRODUCTS[productId as keyof typeof ONE_TIME_PRODUCTS];
  return product ? product.amount : 0;
}

// =====================================================
// EXPORT ALL
// =====================================================

export default {
  razorpayInstance,
  SUBSCRIPTION_PLANS,
  ONE_TIME_PRODUCTS,
  createRazorpayOrder,
  verifyRazorpaySignature,
  processPayment,
  createRazorpaySubscription,
  cancelRazorpaySubscription,
  refundPayment,
  handleWebhook,
  processWebhookEvent,
  formatAmount,
  getSubscriptionPrice,
  getProductPrice
};
