/**
 * Pricing Page - Razorpay Integration with Static Data
 * Updated: February 4, 2026
 * Tiers: FREE, PRO, AGENCY, ENTERPRISE
 * Pricing: INR (₹7,999, ₹39,999, ₹1,59,999)
 * Early Adopter: 50% off with code MARI8X50
 */

import React, { useState } from 'react';
import { Check, X, Zap, Shield, TrendingUp, Building2, Sparkles, Calculator, TrendingDown } from 'lucide-react';

interface PricingTier {
  id: string;
  tier: 'FREE' | 'PRO' | 'AGENCY' | 'ENTERPRISE';
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  features: {
    vessels: number | string;
    users: number | string;
    pdaGeneration: boolean;
    pdaQuota: number | string;
    aisTracking: boolean;
    portIntelligence: boolean;
    marketIntelligence: string;
    apiAccess: number | string;
    whiteLabel: boolean;
    dedicatedSupport: boolean;
    customIntegrations: boolean;
    advancedAnalytics: boolean;
    documentOCR: boolean;
    ragKnowledgeBase: boolean;
    multiTenant: boolean;
    sla: string;
  };
  roi: {
    timeSavings: string;
    costSavings: string;
    paybackPeriod: string;
  };
  popular?: boolean;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    tier: 'FREE',
    name: 'Free',
    description: 'For individual agents exploring Mari8X',
    priceMonthly: 0,
    priceAnnual: 0,
    features: {
      vessels: 5,
      users: 1,
      pdaGeneration: false,
      pdaQuota: 0,
      aisTracking: true,
      portIntelligence: true,
      marketIntelligence: 'Basic',
      apiAccess: 0,
      whiteLabel: false,
      dedicatedSupport: false,
      customIntegrations: false,
      advancedAnalytics: false,
      documentOCR: false,
      ragKnowledgeBase: true,
      multiTenant: false,
      sla: 'Community',
    },
    roi: {
      timeSavings: '5 hours/month',
      costSavings: '₹0',
      paybackPeriod: 'N/A',
    },
  },
  {
    id: 'pro',
    tier: 'PRO',
    name: 'Pro',
    description: 'For small agencies (1-3 agents)',
    priceMonthly: 7999,
    priceAnnual: 79990, // ~17% discount
    features: {
      vessels: 25,
      users: 3,
      pdaGeneration: true,
      pdaQuota: 50,
      aisTracking: true,
      portIntelligence: true,
      marketIntelligence: 'Advanced',
      apiAccess: 1000,
      whiteLabel: false,
      dedicatedSupport: false,
      customIntegrations: false,
      advancedAnalytics: true,
      documentOCR: true,
      ragKnowledgeBase: true,
      multiTenant: false,
      sla: 'Email (24h)',
    },
    roi: {
      timeSavings: '120 hours/month',
      costSavings: '₹1,80,000/month',
      paybackPeriod: '< 2 days',
    },
    popular: true,
  },
  {
    id: 'agency',
    tier: 'AGENCY',
    name: 'Agency',
    description: 'For medium agencies (4-10 agents)',
    priceMonthly: 39999,
    priceAnnual: 399990,
    features: {
      vessels: 100,
      users: 10,
      pdaGeneration: true,
      pdaQuota: 200,
      aisTracking: true,
      portIntelligence: true,
      marketIntelligence: 'Advanced',
      apiAccess: 5000,
      whiteLabel: true,
      dedicatedSupport: true,
      customIntegrations: true,
      advancedAnalytics: true,
      documentOCR: true,
      ragKnowledgeBase: true,
      multiTenant: true,
      sla: 'Priority (4h)',
    },
    roi: {
      timeSavings: '480 hours/month',
      costSavings: '₹7,20,000/month',
      paybackPeriod: '< 1 day',
    },
  },
  {
    id: 'enterprise',
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'For large agencies & ship owners',
    priceMonthly: 159999,
    priceAnnual: 1599990,
    features: {
      vessels: 'Unlimited',
      users: 'Unlimited',
      pdaGeneration: true,
      pdaQuota: 'Unlimited',
      aisTracking: true,
      portIntelligence: true,
      marketIntelligence: 'Premium',
      apiAccess: 'Unlimited',
      whiteLabel: true,
      dedicatedSupport: true,
      customIntegrations: true,
      advancedAnalytics: true,
      documentOCR: true,
      ragKnowledgeBase: true,
      multiTenant: true,
      sla: 'Dedicated (1h)',
    },
    roi: {
      timeSavings: '2,000+ hours/month',
      costSavings: '₹30,00,000/month',
      paybackPeriod: '< 12 hours',
    },
  },
];

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [showROI, setShowROI] = useState(false);

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const calculateDiscountedPrice = (price: number) => {
    return Math.floor(price * 0.5); // 50% off
  };

  const handleSelectPlan = (tier: string, price: number) => {
    if (tier === 'FREE') {
      window.location.href = '/signup';
    } else {
      // Redirect to Razorpay payment page
      window.location.href = `/payment?tier=${tier}&cycle=${billingCycle}&amount=${price}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Early Adopter Banner */}
        <div className="mb-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Sparkles className="h-12 w-12 text-yellow-300 animate-pulse" />
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  🎉 Early Adopter Special: 50% OFF!
                </h3>
                <p className="text-green-100">
                  Use code <span className="font-mono font-bold bg-white text-green-600 px-3 py-1 rounded">MARI8X50</span> at checkout
                </p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur px-6 py-3 rounded-lg">
              <p className="text-white font-bold text-lg">Limited Time: First 100 Customers</p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Enterprise-grade maritime intelligence. Cancel anytime, no contracts.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-lg ${billingCycle === 'monthly' ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="relative inline-flex h-8 w-16 items-center rounded-full bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Toggle billing cycle"
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-lg ${billingCycle === 'annual' ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
              Annual
              <span className="ml-2 text-sm text-green-600 font-medium">Save 17%</span>
            </span>
          </div>

          {/* ROI Toggle */}
          <div className="mt-6">
            <button
              onClick={() => setShowROI(!showROI)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Calculator className="h-5 w-5" />
              {showROI ? 'Hide' : 'Show'} ROI Calculator
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {PRICING_TIERS.map((plan) => {
            const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual;
            const discountedPrice = calculateDiscountedPrice(price);
            const isPremium = plan.tier === 'PRO';
            const isEnterprise = plan.tier === 'ENTERPRISE';

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 transition-transform hover:scale-105 ${
                  isPremium
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-2xl scale-105 ring-4 ring-blue-300'
                    : isEnterprise
                    ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-2xl'
                    : 'bg-white text-gray-900 shadow-lg'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    ⭐ MOST POPULAR
                  </div>
                )}

                {/* Icon */}
                <div className={`mb-4 ${isPremium || isEnterprise ? 'text-yellow-300' : 'text-blue-600'}`}>
                  {plan.tier === 'FREE' && <Shield className="h-12 w-12" />}
                  {plan.tier === 'PRO' && <TrendingUp className="h-12 w-12" />}
                  {plan.tier === 'AGENCY' && <Building2 className="h-12 w-12" />}
                  {plan.tier === 'ENTERPRISE' && <Zap className="h-12 w-12" />}
                </div>

                {/* Tier Name */}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className={`text-sm mb-6 ${isPremium || isEnterprise ? 'text-blue-100' : 'text-gray-600'}`}>
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  {price === 0 ? (
                    <div>
                      <span className="text-4xl font-bold">Free</span>
                    </div>
                  ) : (
                    <div>
                      {/* Early Adopter Pricing */}
                      <div className="mb-2">
                        <span className={`text-2xl font-bold line-through ${isPremium || isEnterprise ? 'text-blue-200' : 'text-gray-400'}`}>
                          {formatPrice(price)}
                        </span>
                      </div>
                      <div>
                        <span className="text-4xl font-bold">{formatPrice(discountedPrice)}</span>
                        <span className={`text-sm ml-2 ${isPremium || isEnterprise ? 'text-blue-100' : 'text-gray-600'}`}>
                          / {billingCycle === 'monthly' ? 'month' : 'year'}
                        </span>
                      </div>
                      <p className={`text-xs mt-2 ${isPremium || isEnterprise ? 'text-green-200' : 'text-green-600'} font-semibold`}>
                        💰 Save ₹{(price - discountedPrice).toLocaleString('en-IN')}/mo
                      </p>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan.tier, discountedPrice)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all mb-6 ${
                    isPremium || isEnterprise
                      ? 'bg-white text-blue-700 hover:bg-gray-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.tier === 'FREE' ? 'Get Started Free' : 'Start Free Trial'}
                </button>

                {/* ROI Section */}
                {showROI && price > 0 && (
                  <div className={`mb-6 p-4 rounded-lg ${isPremium || isEnterprise ? 'bg-white/10' : 'bg-blue-50'}`}>
                    <h4 className={`font-semibold text-sm mb-3 flex items-center gap-2 ${isPremium || isEnterprise ? 'text-white' : 'text-gray-900'}`}>
                      <TrendingDown className="h-4 w-4" />
                      ROI Calculator
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className={isPremium || isEnterprise ? 'text-blue-100' : 'text-gray-600'}>Time Saved:</span>
                        <span className="font-semibold">{plan.roi.timeSavings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isPremium || isEnterprise ? 'text-blue-100' : 'text-gray-600'}>Cost Savings:</span>
                        <span className="font-semibold">{plan.roi.costSavings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isPremium || isEnterprise ? 'text-blue-100' : 'text-gray-600'}>Payback:</span>
                        <span className="font-semibold text-green-400">{plan.roi.paybackPeriod}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Features */}
                <div className="space-y-3">
                  <h4 className={`font-semibold text-sm uppercase ${isPremium || isEnterprise ? 'text-blue-100' : 'text-gray-500'}`}>
                    What's Included
                  </h4>

                  <FeatureItem
                    enabled={true}
                    text={`${plan.features.vessels} vessels`}
                    isPremium={isPremium || isEnterprise}
                  />

                  <FeatureItem
                    enabled={true}
                    text={`${plan.features.users} users`}
                    isPremium={isPremium || isEnterprise}
                  />

                  {plan.features.pdaGeneration && (
                    <FeatureItem
                      enabled={true}
                      text={`${plan.features.pdaQuota} PDA/month`}
                      isPremium={isPremium || isEnterprise}
                    />
                  )}

                  <FeatureItem
                    enabled={plan.features.aisTracking}
                    text="AIS Tracking"
                    isPremium={isPremium || isEnterprise}
                  />

                  <FeatureItem
                    enabled={plan.features.portIntelligence}
                    text="Port Intelligence"
                    isPremium={isPremium || isEnterprise}
                  />

                  <FeatureItem
                    enabled={true}
                    text={`${plan.features.marketIntelligence} Market Intel`}
                    isPremium={isPremium || isEnterprise}
                  />

                  {plan.features.apiAccess !== 0 && (
                    <FeatureItem
                      enabled={true}
                      text={`${plan.features.apiAccess} API calls/mo`}
                      isPremium={isPremium || isEnterprise}
                    />
                  )}

                  <FeatureItem
                    enabled={plan.features.documentOCR}
                    text="Document OCR"
                    isPremium={isPremium || isEnterprise}
                  />

                  <FeatureItem
                    enabled={plan.features.ragKnowledgeBase}
                    text="RAG Knowledge Base"
                    isPremium={isPremium || isEnterprise}
                  />

                  <FeatureItem
                    enabled={plan.features.advancedAnalytics}
                    text="Advanced Analytics"
                    isPremium={isPremium || isEnterprise}
                  />

                  <FeatureItem
                    enabled={plan.features.whiteLabel}
                    text="White Label"
                    isPremium={isPremium || isEnterprise}
                  />

                  <FeatureItem
                    enabled={plan.features.multiTenant}
                    text="Multi-Tenant"
                    isPremium={isPremium || isEnterprise}
                  />

                  <FeatureItem
                    enabled={true}
                    text={`${plan.features.sla} SLA`}
                    isPremium={isPremium || isEnterprise}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Indicators */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-gray-600">Ports Covered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">16.9M+</div>
              <div className="text-gray-600">AIS Positions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">95%</div>
              <div className="text-gray-600">PDA Accuracy</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">2 hrs → 5 min</div>
              <div className="text-gray-600">Time Savings</div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <FAQItem
              question="How do I get the 50% early adopter discount?"
              answer="Use code MARI8X50 at checkout. This offer is valid for the first 100 customers only. Your discount applies for the lifetime of your subscription!"
            />
            <FAQItem
              question="Do you offer a free trial?"
              answer="Yes! All paid plans come with a 14-day free trial. No credit card required to start. You can test all features before committing."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept all major payment methods via Razorpay: UPI, credit/debit cards, net banking, Paytm, PhonePe, Google Pay, and all digital wallets."
            />
            <FAQItem
              question="Can I change plans later?"
              answer="Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated."
            />
            <FAQItem
              question="What happens when I hit my quota?"
              answer="You'll receive notifications at 80% and 100% usage. You can upgrade your plan anytime to increase your quota, or wait for the next billing cycle."
            />
            <FAQItem
              question="Is my data secure?"
              answer="Yes. We use bank-grade AES-256 encryption, comply with SOC 2 standards, and implement role-based access control (RBAC). Your data is hosted in secure Indian data centers."
            />
            <FAQItem
              question="Do you offer custom enterprise plans?"
              answer="Yes! For large organizations with specific requirements, contact us at enterprise@mari8x.com for custom pricing and features."
            />
          </div>
        </div>

        {/* CTA Footer */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Maritime Operations?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join 100+ port agencies already saving time and money with Mari8X
          </p>
          <button
            onClick={() => window.location.href = '/signup'}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
          >
            Start Your Free Trial Today →
          </button>
          <p className="mt-4 text-sm text-blue-100">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper Components
interface FeatureItemProps {
  enabled: boolean;
  text: string;
  isPremium: boolean;
}

function FeatureItem({ enabled, text, isPremium }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-2">
      {enabled ? (
        <Check className={`h-5 w-5 flex-shrink-0 ${isPremium ? 'text-green-300' : 'text-green-600'}`} />
      ) : (
        <X className={`h-5 w-5 flex-shrink-0 ${isPremium ? 'text-blue-300' : 'text-gray-400'}`} />
      )}
      <span className={`text-sm ${isPremium ? 'text-white' : enabled ? 'text-gray-900' : 'text-gray-500'}`}>
        {text}
      </span>
    </div>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
        aria-expanded={isOpen}
      >
        <span className="text-lg font-semibold text-gray-900">{question}</span>
        <span className="text-2xl text-gray-500">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && <p className="mt-4 text-gray-600">{answer}</p>}
    </div>
  );
}
