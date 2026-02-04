/**
 * Subscription Management Dashboard
 * View and manage subscription, billing history, payment methods
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gql, useQuery, useMutation } from '@apollo/client';

const GET_SUBSCRIPTION_DATA = gql`
  query GetSubscriptionData {
    mySubscription {
      id
      tier
      status
      billingCycle
      amount
      currency
      startDate
      endDate
      trialEndsAt
      cancelledAt
      isTrialing
      isActive
      apiQuota
      apiUsed
      apiRemaining
      features
    }
    subscriptionPlans {
      id
      tier
      name
      priceMonthly
      priceAnnual
      currency
      features
      apiQuotaMonthly
    }
  }
`;

const CANCEL_SUBSCRIPTION = gql`
  mutation CancelSubscription {
    cancelSubscription
  }
`;

const REACTIVATE_SUBSCRIPTION = gql`
  mutation ReactivateSubscription {
    reactivateSubscription {
      id
      status
    }
  }
`;

interface Subscription {
  id: string;
  tier: string;
  status: string;
  billingCycle: string;
  amount: number;
  currency: string;
  startDate: string;
  endDate: string | null;
  trialEndsAt: string | null;
  cancelledAt: string | null;
  isTrialing: boolean;
  isActive: boolean;
  apiQuota: number;
  apiUsed: number;
  apiRemaining: number;
  features: any;
}

interface SubscriptionPlan {
  id: string;
  tier: string;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  features: any;
  apiQuotaMonthly: number;
}

export default function SubscriptionManagement() {
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { data, loading, refetch } = useQuery(GET_SUBSCRIPTION_DATA);
  const [cancelSubscription] = useMutation(CANCEL_SUBSCRIPTION);
  const [reactivateSubscription] = useMutation(REACTIVATE_SUBSCRIPTION);

  const subscription: Subscription | null = data?.mySubscription;
  const plans: SubscriptionPlan[] = data?.subscriptionPlans || [];

  const currentPlan = plans.find(p => p.tier.toUpperCase() === subscription?.tier?.toUpperCase());

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const handleCancelSubscription = async () => {
    try {
      setCancelling(true);
      await cancelSubscription();
      await refetch();
      setShowCancelModal(false);
      setCancelling(false);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      setCancelling(false);
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivateSubscription();
      await refetch();
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading subscription data...</div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Active Subscription</h2>
          <p className="text-gray-600 mb-6">
            You don't have an active subscription. Choose a plan to get started.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors"
          >
            View Pricing Plans
          </button>
        </div>
      </div>
    );
  }

  const pdaQuota = subscription.features?.pda_quota_monthly || 0;
  const pdaUsed = subscription.features?.pda_used || 0;
  const pdaRemaining = pdaQuota === -1 ? 'Unlimited' : pdaQuota - pdaUsed;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Management</h1>
          <p className="text-gray-600">Manage your Mari8X subscription and billing</p>
        </div>

        {/* Status Alert */}
        {subscription.isTrialing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold text-blue-900">Free Trial Active</h4>
                <p className="text-sm text-blue-800 mt-1">
                  Your 14-day free trial ends on{' '}
                  {new Date(subscription.trialEndsAt!).toLocaleDateString()}. You won't be charged
                  until the trial ends.
                </p>
              </div>
            </div>
          </div>
        )}

        {subscription.status === 'cancelled' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-yellow-900">Subscription Cancelled</h4>
                  <p className="text-sm text-yellow-800 mt-1">
                    Your subscription will end on{' '}
                    {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}.
                    You'll continue to have access until then.
                  </p>
                </div>
              </div>
              <button
                onClick={handleReactivate}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
              >
                Reactivate
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Plan */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Plan</h2>

              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-sky-600 mb-1">{currentPlan?.name}</h3>
                  <p className="text-gray-600">
                    {subscription.currency} {subscription.amount.toLocaleString()}
                    <span className="text-sm">
                      /{subscription.billingCycle === 'annual' ? 'year' : 'month'}
                    </span>
                  </p>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        subscription.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                          subscription.isActive ? 'bg-green-600' : 'bg-gray-600'
                        }`}
                      ></span>
                      {subscription.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <button
                    onClick={handleUpgrade}
                    className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium"
                  >
                    Upgrade Plan
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-semibold text-gray-900 mb-3">Included Features:</h4>
                {currentPlan?.features &&
                  Object.entries(currentPlan.features)
                    .filter(([key, value]) => value === true && !key.includes('quota'))
                    .map(([key]) => (
                      <div key={key} className="flex items-center text-sm text-gray-600">
                        <svg
                          className="w-4 h-4 text-green-600 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    ))}
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage This Month</h2>

              {/* API Usage */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">API Calls</span>
                  <span className="text-sm text-gray-600">
                    {subscription.apiUsed.toLocaleString()} /{' '}
                    {subscription.apiQuota === -1
                      ? 'Unlimited'
                      : subscription.apiQuota.toLocaleString()}
                  </span>
                </div>
                {subscription.apiQuota !== -1 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-sky-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min((subscription.apiUsed / subscription.apiQuota) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                )}
              </div>

              {/* PDA Generation */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">PDA Generation</span>
                  <span className="text-sm text-gray-600">
                    {pdaUsed.toLocaleString()} / {pdaQuota === -1 ? 'Unlimited' : pdaQuota.toLocaleString()}
                  </span>
                </div>
                {pdaQuota !== -1 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min((pdaUsed / pdaQuota) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                )}
              </div>
            </div>

            {/* Cancel Subscription */}
            {subscription.status !== 'cancelled' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Cancel Subscription</h2>
                <p className="text-gray-600 mb-4">
                  You can cancel your subscription at any time. You'll continue to have access until the
                  end of your billing period.
                </p>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-red-600 hover:text-red-700 font-medium text-sm"
                >
                  Cancel Subscription
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Billing Details */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Billing Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Start Date</span>
                  <p className="font-medium text-gray-900">
                    {new Date(subscription.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Next Billing Date</span>
                  <p className="font-medium text-gray-900">
                    {subscription.endDate
                      ? new Date(subscription.endDate).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Billing Cycle</span>
                  <p className="font-medium text-gray-900 capitalize">
                    {subscription.billingCycle}
                  </p>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-6">
              <h3 className="font-semibold text-sky-900 mb-2">Need Help?</h3>
              <p className="text-sm text-sky-800 mb-4">
                Our support team is here to help you get the most out of your subscription.
              </p>
              <a
                href="/support"
                className="inline-block text-sky-600 hover:text-sky-700 font-medium text-sm"
              >
                Contact Support →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Subscription?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your subscription? You'll continue to have access until{' '}
              {subscription.endDate
                ? new Date(subscription.endDate).toLocaleDateString()
                : 'the end of your billing period'}
              .
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
