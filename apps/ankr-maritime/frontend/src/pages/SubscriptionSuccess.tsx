/**
 * Subscription Success Page
 * Shown after successful payment completion
 */

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tier, billingCycle, subscriptionId } = location.state || {};

  useEffect(() => {
    // Confetti animation (optional)
    // You can integrate a confetti library here if desired
  }, []);

  const handleContinue = () => {
    navigate('/dashboard');
  };

  const handleManageSubscription = () => {
    navigate('/subscription-management');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-green-600"
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
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Your subscription has been activated. Welcome to Mari8X!
          </p>

          {/* Subscription Details */}
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-6 mb-8">
            <h2 className="text-sm font-semibold text-sky-900 mb-4 uppercase tracking-wide">
              Subscription Details
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Plan</span>
                <span className="font-semibold text-gray-900">
                  {tier?.replace('_', ' ').toUpperCase() || 'Enterprise'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Billing Cycle</span>
                <span className="font-semibold text-gray-900">
                  {billingCycle === 'annual' ? 'Annual' : 'Monthly'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                  Active
                </span>
              </div>
              {subscriptionId && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Subscription ID</span>
                  <span className="text-gray-600 font-mono">{subscriptionId.slice(0, 12)}...</span>
                </div>
              )}
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              What's Next?
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Access port tariff intelligence for 800+ ports worldwide</span>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Generate Port Disbursement Accounts (PDA) in 75ms</span>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Use AIS routing engine for real-time vessel optimization</span>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Access market intelligence and freight rate analytics</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleContinue}
              className="w-full bg-sky-600 text-white py-4 rounded-lg font-semibold hover:bg-sky-700 transition-colors flex items-center justify-center"
            >
              Continue to Dashboard
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

            <button
              onClick={handleManageSubscription}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Manage Subscription
            </button>
          </div>

          {/* Support */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Need help getting started?{' '}
              <a href="/support" className="text-sky-600 hover:text-sky-700 font-medium">
                Contact our support team
              </a>
            </p>
          </div>
        </div>

        {/* Email Confirmation Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            📧 A confirmation email has been sent to your registered email address
          </p>
        </div>
      </div>
    </div>
  );
}
