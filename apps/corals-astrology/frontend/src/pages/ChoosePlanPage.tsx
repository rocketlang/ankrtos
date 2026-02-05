import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Plan {
  id: string;
  name: string;
  tagline: string;
  price: number;
  originalPrice?: number;
  billingCycle: 'free' | 'monthly' | 'yearly';
  yearlyPrice?: number;
  popular?: boolean;
  features: string[];
  limits: {
    birthCharts: string;
    reports: string;
    consultations: string;
    questionsToAcharya: string;
    gemstoneDiscounts: string;
    panditBookingDiscount: string;
    systemAccess: string;
  };
  color: string;
  icon: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'FREE',
    tagline: 'Start Your Spiritual Journey',
    price: 0,
    billingCycle: 'free',
    features: [
      'Basic birth chart analysis',
      'Daily horoscope',
      'Limited system access (3 readings/month)',
      'Community access',
      'Book pandits (no discount)',
      'Shop gemstones (no discount)',
    ],
    limits: {
      birthCharts: '1 chart',
      reports: '0',
      consultations: '0',
      questionsToAcharya: '0',
      gemstoneDiscounts: '0%',
      panditBookingDiscount: '0%',
      systemAccess: '3/month',
    },
    color: 'gray',
    icon: '🌱',
  },
  {
    id: 'freemium',
    name: 'FREEMIUM',
    tagline: 'Explore & Discover',
    price: 299,
    yearlyPrice: 2999,
    originalPrice: 499,
    billingCycle: 'monthly',
    features: [
      'Full birth chart analysis',
      'Daily + weekly horoscope',
      '10 system readings/month',
      'Basic remedies & recommendations',
      '1 question to Acharya/month',
      '5% off gemstones',
      '10% off pandit bookings',
      'Priority support',
    ],
    limits: {
      birthCharts: 'Unlimited',
      reports: '1 basic/month',
      consultations: '0',
      questionsToAcharya: '1/month',
      gemstoneDiscounts: '5%',
      panditBookingDiscount: '10%',
      systemAccess: '10/month',
    },
    color: 'blue',
    icon: '⭐',
  },
  {
    id: 'pro',
    name: 'PRO',
    tagline: 'Complete Spiritual Guidance',
    price: 999,
    yearlyPrice: 9999,
    originalPrice: 1499,
    billingCycle: 'monthly',
    popular: true,
    features: [
      '✨ EVERYTHING in Freemium, plus:',
      'Unlimited system readings',
      'Advanced remedies & upaya',
      'Monthly compatibility reports',
      '5 questions to Acharya/month',
      '1 video consultation (15 min)',
      'Personalized gemstone recommendations',
      '15% off all gemstones',
      '20% off pandit bookings',
      'PDF report downloads',
      'Priority Q&A responses',
    ],
    limits: {
      birthCharts: 'Unlimited',
      reports: '5 advanced/month',
      consultations: '1 video/month (15 min)',
      questionsToAcharya: '5/month',
      gemstoneDiscounts: '15%',
      panditBookingDiscount: '20%',
      systemAccess: 'Unlimited',
    },
    color: 'orange',
    icon: '🔥',
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    tagline: 'VIP Astrological Mastery',
    price: 4999,
    yearlyPrice: 49999,
    originalPrice: 7999,
    billingCycle: 'monthly',
    features: [
      '🌟 EVERYTHING in Pro, plus:',
      'Direct access to Acharya Rakesh Ji',
      'Unlimited questions to Acharya',
      'Weekly video consultations (30 min)',
      'Personalized remedy plans',
      'Family chart analysis (up to 5 members)',
      'Annual comprehensive report',
      'Exclusive gemstone collection access',
      '25% off all gemstones',
      '30% off pandit bookings',
      'White-glove concierge service',
      'Early access to new features',
    ],
    limits: {
      birthCharts: 'Unlimited + Family (5)',
      reports: 'Unlimited premium',
      consultations: 'Weekly video (30 min)',
      questionsToAcharya: 'Unlimited + Direct access',
      gemstoneDiscounts: '25%',
      panditBookingDiscount: '30%',
      systemAccess: 'Unlimited + Priority',
    },
    color: 'purple',
    icon: '👑',
  },
];

const ChoosePlanPage: React.FC = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);

    if (planId === 'free') {
      // Navigate directly to dashboard for free plan
      navigate('/dashboard');
    } else {
      // Navigate to payment page for paid plans
      navigate(`/payment?plan=${planId}&billing=${billingCycle}`);
    }
  };

  const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border' | 'hover') => {
    const colors: { [key: string]: { [key: string]: string } } = {
      gray: {
        bg: 'bg-gray-600',
        text: 'text-gray-600',
        border: 'border-gray-600',
        hover: 'hover:bg-gray-700',
      },
      blue: {
        bg: 'bg-blue-600',
        text: 'text-blue-600',
        border: 'border-blue-600',
        hover: 'hover:bg-blue-700',
      },
      orange: {
        bg: 'bg-orange-600',
        text: 'text-orange-600',
        border: 'border-orange-600',
        hover: 'hover:bg-orange-700',
      },
      purple: {
        bg: 'bg-purple-600',
        text: 'text-purple-600',
        border: 'border-purple-600',
        hover: 'hover:bg-purple-700',
      },
    };
    return colors[color]?.[variant] || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-50 py-12 px-4">
      {/* Header */}
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Link to="/" className="inline-block mb-6">
            <div className="text-5xl">🕉️</div>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Spiritual Path</h1>
          <p className="text-xl text-gray-600 mb-8">
            Select the plan that aligns with your spiritual journey
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-3 rounded-full font-semibold transition-all relative ${
                billingCycle === 'yearly'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map(plan => {
            const displayPrice = billingCycle === 'yearly' && plan.yearlyPrice
              ? plan.yearlyPrice
              : plan.price;
            const monthlyEquivalent = billingCycle === 'yearly' && plan.yearlyPrice
              ? Math.round(plan.yearlyPrice / 12)
              : null;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all relative ${
                  plan.popular ? 'ring-4 ring-orange-500 scale-105' : ''
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-orange-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      🔥 MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Plan Icon */}
                  <div className="text-5xl mb-3 text-center">{plan.icon}</div>

                  {/* Plan Name */}
                  <h3 className={`text-2xl font-bold text-center mb-2 ${getColorClasses(plan.color, 'text')}`}>
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-600 text-center mb-4">{plan.tagline}</p>

                  {/* Price */}
                  <div className="text-center mb-6">
                    {plan.price === 0 ? (
                      <div>
                        <span className="text-4xl font-bold">FREE</span>
                        <p className="text-sm text-gray-500">Forever</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-4xl font-bold">₹{displayPrice}</span>
                          {plan.originalPrice && (
                            <span className="text-lg text-gray-400 line-through">
                              ₹{billingCycle === 'yearly' ? plan.originalPrice * 10 : plan.originalPrice}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {billingCycle === 'yearly' ? (
                            <span>₹{monthlyEquivalent}/month (billed yearly)</span>
                          ) : (
                            <span>/month</span>
                          )}
                        </p>
                        {plan.originalPrice && (
                          <p className="text-xs text-green-600 font-semibold mt-1">
                            Save ₹{billingCycle === 'yearly'
                              ? (plan.originalPrice * 10 - displayPrice)
                              : (plan.originalPrice - plan.price)
                            }
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="mb-6 space-y-2">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span className={feature.startsWith('✨') || feature.startsWith('🌟') ? 'font-semibold' : ''}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full ${getColorClasses(plan.color, 'bg')} text-white py-3 rounded-lg font-semibold ${getColorClasses(plan.color, 'hover')} transition-colors shadow-lg`}
                  >
                    {plan.price === 0 ? 'Start Free' : 'Select Plan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-12">
          <div className="p-6 bg-gradient-to-r from-orange-500 to-purple-600">
            <h2 className="text-2xl font-bold text-white text-center">Detailed Feature Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Feature</th>
                  {plans.map(plan => (
                    <th key={plan.id} className="px-6 py-4 text-center font-semibold">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-6 py-4 font-medium">Birth Charts</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="px-6 py-4 text-center">{plan.limits.birthCharts}</td>
                  ))}
                </tr>
                <tr className="border-t bg-gray-50">
                  <td className="px-6 py-4 font-medium">Reports</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="px-6 py-4 text-center">{plan.limits.reports}</td>
                  ))}
                </tr>
                <tr className="border-t">
                  <td className="px-6 py-4 font-medium">Video Consultations</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="px-6 py-4 text-center">{plan.limits.consultations}</td>
                  ))}
                </tr>
                <tr className="border-t bg-gray-50">
                  <td className="px-6 py-4 font-medium">Questions to Acharya</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="px-6 py-4 text-center">{plan.limits.questionsToAcharya}</td>
                  ))}
                </tr>
                <tr className="border-t">
                  <td className="px-6 py-4 font-medium">Gemstone Discount</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="px-6 py-4 text-center font-semibold text-green-600">
                      {plan.limits.gemstoneDiscounts}
                    </td>
                  ))}
                </tr>
                <tr className="border-t bg-gray-50">
                  <td className="px-6 py-4 font-medium">Pandit Booking Discount</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="px-6 py-4 text-center font-semibold text-green-600">
                      {plan.limits.panditBookingDiscount}
                    </td>
                  ))}
                </tr>
                <tr className="border-t">
                  <td className="px-6 py-4 font-medium">System Access</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="px-6 py-4 text-center">{plan.limits.systemAccess}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Can I upgrade later?</h3>
              <p className="text-gray-600">Yes! You can upgrade or downgrade anytime. Unused credits are prorated.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Is there a refund policy?</h3>
              <p className="text-gray-600">We offer a 7-day money-back guarantee if you're not satisfied.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Are gemstones extra?</h3>
              <p className="text-gray-600">Yes, gemstones are sold separately but you get discounts based on your plan.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">How do I contact Acharya Ji?</h3>
              <p className="text-gray-600">Pro users can ask questions via Q&A. Enterprise users get direct access.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600">
          <p className="mb-2">Need help choosing? <Link to="/contact" className="text-orange-600 hover:underline">Contact us</Link></p>
          <p className="text-sm">
            <Link to="/" className="hover:text-orange-600">← Back to Home</Link>
            {' • '}
            <Link to="/login" className="hover:text-orange-600">Already have an account?</Link>
          </p>
          <div className="mt-6 text-sm">
            <p>⚡ Platform Powered by <span className="font-semibold">ANKR.IN</span></p>
            <p>💼 Managed by <span className="font-semibold">PowerBox IT Solutions Pvt Ltd</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChoosePlanPage;
