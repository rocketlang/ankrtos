/**
 * Payment Page - Razorpay Integration
 * Handles subscription payment flow with Razorpay Checkout
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { gql, useMutation, useQuery } from '@apollo/client';

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

const GET_SUBSCRIPTION_PLANS = gql`
  query GetSubscriptionPlans {
    subscriptionPlans {
      id
      tier
      name
      priceMonthly
      priceAnnual
      currency
      features
    }
  }
`;

const CREATE_RAZORPAY_ORDER = gql`
  mutation CreateRazorpayOrder($input: CreateRazorpayOrderInput!) {
    createRazorpayOrder(input: $input) {
      orderId
      amount
      currency
      receipt
    }
  }
`;

const VERIFY_PAYMENT = gql`
  mutation VerifyRazorpayPayment($input: VerifyRazorpayPaymentInput!) {
    verifyRazorpayPayment(input: $input) {
      success
      subscriptionId
      message
    }
  }
`;

interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
}

interface SubscriptionPlan {
  id: string;
  tier: string;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  features: any;
}

export default function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tier = searchParams.get('tier') || 'AGENT';
  const billingCycle = searchParams.get('cycle') || 'monthly';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: plansData } = useQuery(GET_SUBSCRIPTION_PLANS);
  const [createOrder] = useMutation(CREATE_RAZORPAY_ORDER);
  const [verifyPayment] = useMutation(VERIFY_PAYMENT);

  const selectedPlan = plansData?.subscriptionPlans?.find(
    (plan: SubscriptionPlan) => plan.tier.toUpperCase() === tier.toUpperCase()
  );

  const amount = billingCycle === 'annual'
    ? selectedPlan?.priceAnnual
    : selectedPlan?.priceMonthly;

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create Razorpay order
      const { data } = await createOrder({
        variables: {
          input: {
            tier,
            billingCycle,
            amountCents: Math.round((amount || 0) * 100),
            currency: selectedPlan?.currency || 'INR',
          },
        },
      });

      const order: RazorpayOrder = data.createRazorpayOrder;

      // Initialize Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Mari8X',
        description: `${selectedPlan?.name} - ${billingCycle === 'annual' ? 'Annual' : 'Monthly'} Subscription`,
        order_id: order.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            const { data: verifyData } = await verifyPayment({
              variables: {
                input: {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                },
              },
            });

            if (verifyData.verifyRazorpayPayment.success) {
              // Payment successful
              navigate('/subscription-success', {
                state: {
                  subscriptionId: verifyData.verifyRazorpayPayment.subscriptionId,
                  tier,
                  billingCycle,
                },
              });
            } else {
              setError('Payment verification failed. Please contact support.');
            }
          } catch (err: any) {
            console.error('Payment verification error:', err);
            setError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        notes: {
          tier,
          billingCycle,
        },
        theme: {
          color: '#0284c7',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setError('Payment cancelled. You can try again.');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setLoading(false);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Plan</h2>
          <p className="text-gray-600 mb-6">
            The selected subscription plan could not be found.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors"
          >
            View Pricing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Subscription</h1>
          <p className="text-gray-600">
            You're one step away from unlocking enterprise-grade maritime intelligence
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Plan</span>
              <span className="font-semibold text-gray-900">{selectedPlan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Billing Cycle</span>
              <span className="font-semibold text-gray-900">
                {billingCycle === 'annual' ? 'Annual' : 'Monthly'}
              </span>
            </div>
            {billingCycle === 'annual' && (
              <div className="flex justify-between text-green-600">
                <span>Annual Discount</span>
                <span className="font-semibold">17% OFF</span>
              </div>
            )}
            <div className="border-t pt-3 mt-3 flex justify-between text-lg">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-sky-600">
                {selectedPlan.currency} {amount?.toLocaleString()}
                <span className="text-sm text-gray-600">
                  /{billingCycle === 'annual' ? 'year' : 'month'}
                </span>
              </span>
            </div>
          </div>

          {/* Features Included */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">What's Included:</h3>
            <div className="space-y-2">
              {selectedPlan.features && Object.entries(selectedPlan.features)
                .filter(([key, value]) => value === true && !key.includes('quota'))
                .map(([key]) => (
                  <div key={key} className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Information</h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex">
              <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Secure Payment via Razorpay</h4>
                <p className="text-sm text-blue-800">
                  Your payment is processed securely through Razorpay. We support UPI, cards, net banking, and wallets.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-600 mb-6">
            <div className="flex items-start">
              <svg className="w-4 h-4 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>14-day free trial - Cancel anytime before trial ends</span>
            </div>
            <div className="flex items-start">
              <svg className="w-4 h-4 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>No hidden fees - Cancel anytime</span>
            </div>
            <div className="flex items-start">
              <svg className="w-4 h-4 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Instant activation - Start using immediately</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-sky-600 text-white py-4 rounded-lg font-semibold hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                Proceed to Payment
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>

          <button
            onClick={() => navigate('/pricing')}
            className="w-full mt-3 text-gray-600 py-2 hover:text-gray-900 transition-colors"
          >
            Back to Pricing
          </button>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 text-center">
            Accepted Payment Methods
          </h3>
          <div className="flex items-center justify-center space-x-6 text-gray-400">
            <div className="text-center">
              <div className="font-semibold text-lg">UPI</div>
              <div className="text-xs">Google Pay, PhonePe</div>
            </div>
            <div className="text-gray-300">|</div>
            <div className="text-center">
              <div className="font-semibold text-lg">Cards</div>
              <div className="text-xs">Credit/Debit</div>
            </div>
            <div className="text-gray-300">|</div>
            <div className="text-center">
              <div className="font-semibold text-lg">Net Banking</div>
              <div className="text-xs">All Banks</div>
            </div>
            <div className="text-gray-300">|</div>
            <div className="text-center">
              <div className="font-semibold text-lg">Wallets</div>
              <div className="text-xs">Paytm, etc</div>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            🔒 Secured by Razorpay • PCI DSS Compliant • 256-bit SSL Encryption
          </p>
        </div>
      </div>
    </div>
  );
}
