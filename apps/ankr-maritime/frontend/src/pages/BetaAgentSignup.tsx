/**
 * Beta Agent Signup Page
 *
 * Public signup form for port agents joining the beta program.
 * Creates organization, user, and beta agent profile.
 */

import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
  Ship, Mail, Lock, User, MapPin, Briefcase, Globe,
  CheckCircle, AlertCircle, Eye, EyeOff
} from 'lucide-react';

const BETA_AGENT_SIGNUP = gql`
  mutation BetaAgentSignup($input: BetaAgentSignupInput!) {
    betaAgentSignup(input: $input) {
      organizationId
      userId
      betaProfileId
      nextStep
    }
  }
`;

const SERVICE_TYPES = [
  { value: 'port_agent', label: 'Port Agent', description: 'Vessel arrival/departure coordination' },
  { value: 'surveyor', label: 'Surveyor', description: 'Cargo and vessel inspections' },
  { value: 'bunker_supplier', label: 'Bunker Supplier', description: 'Marine fuel supply' },
  { value: 'ship_chandler', label: 'Ship Chandler', description: 'Vessel provisions and supplies' },
];

const SAMPLE_PORTS = [
  { id: 'INMUN1', name: 'Mumbai (Nhava Sheva), India' },
  { id: 'INCCU1', name: 'Kolkata, India' },
  { id: 'INCHE6', name: 'Chennai, India' },
  { id: 'SGSIN1', name: 'Singapore' },
  { id: 'AEJEA1', name: 'Jebel Ali, UAE' },
  { id: 'USLAX1', name: 'Los Angeles, USA' },
  { id: 'USNYC1', name: 'New York, USA' },
  { id: 'GBLON1', name: 'London, UK' },
  { id: 'NLRTM1', name: 'Rotterdam, Netherlands' },
  { id: 'CNSHA1', name: 'Shanghai, China' },
];

export default function BetaAgentSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=Basic Info, 2=Services & Ports, 3=Account, 4=Success

  // Form state
  const [formData, setFormData] = useState({
    agentName: '',
    email: '',
    contactName: '',
    country: '',
    serviceTypes: [] as string[],
    portsServed: [] as string[],
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [betaSignup, { loading, error: mutationError }] = useMutation(BETA_AGENT_SIGNUP);

  // Validation
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.agentName.trim()) newErrors.agentName = 'Agent/Company name is required';
    if (!formData.contactName.trim()) newErrors.contactName = 'Contact name is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (formData.serviceTypes.length === 0) newErrors.serviceTypes = 'Select at least one service type';
    if (formData.portsServed.length === 0) newErrors.portsServed = 'Select at least one port';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, and number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = 'You must agree to the terms and SLA';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) handleSubmit();
  };

  const handleBack = () => {
    setStep(step - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    try {
      const { data } = await betaSignup({
        variables: {
          input: {
            email: formData.email,
            agentName: formData.agentName,
            portsServed: formData.portsServed,
            serviceTypes: formData.serviceTypes,
            password: formData.password,
            contactName: formData.contactName,
            country: formData.country,
          },
        },
      });

      if (data?.betaAgentSignup) {
        setStep(4); // Success step
      }
    } catch (err) {
      console.error('Signup error:', err);
      setErrors({ submit: 'Signup failed. Please try again.' });
    }
  };

  const toggleServiceType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(type)
        ? prev.serviceTypes.filter(t => t !== type)
        : [...prev.serviceTypes, type],
    }));
  };

  const togglePort = (portId: string) => {
    setFormData(prev => ({
      ...prev,
      portsServed: prev.portsServed.includes(portId)
        ? prev.portsServed.filter(p => p !== portId)
        : [...prev.portsServed, portId],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Ship className="h-10 w-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Mari8X Beta</h1>
          </div>
          <p className="text-gray-600">Join our beta program for port agents</p>
        </div>

        {/* Progress Bar */}
        {step < 4 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {['Basic Info', 'Services', 'Account'].map((label, idx) => (
                <div key={label} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step > idx + 1
                        ? 'bg-green-500 text-white'
                        : step === idx + 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step > idx + 1 ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                  </div>
                  {idx < 2 && (
                    <div
                      className={`w-24 h-1 mx-2 ${
                        step > idx + 1 ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>Basic Info</span>
              <span>Services</span>
              <span>Account</span>
            </div>
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="inline h-4 w-4 mr-1" />
                Agent/Company Name *
              </label>
              <input
                type="text"
                value={formData.agentName}
                onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.agentName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Mumbai Port Agents Pvt Ltd"
              />
              {errors.agentName && (
                <p className="text-red-500 text-sm mt-1">{errors.agentName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Contact Person Name *
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.contactName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="John Doe"
              />
              {errors.contactName && (
                <p className="text-red-500 text-sm mt-1">{errors.contactName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="inline h-4 w-4 mr-1" />
                Country *
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.country ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="India"
              />
              {errors.country && (
                <p className="text-red-500 text-sm mt-1">{errors.country}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Services & Ports */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Service Types * (Select all that apply)
              </label>
              <div className="space-y-2">
                {SERVICE_TYPES.map((service) => (
                  <label
                    key={service.value}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.serviceTypes.includes(service.value)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.serviceTypes.includes(service.value)}
                      onChange={() => toggleServiceType(service.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{service.label}</div>
                      <div className="text-sm text-gray-500">{service.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.serviceTypes && (
                <p className="text-red-500 text-sm mt-1">{errors.serviceTypes}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <MapPin className="inline h-4 w-4 mr-1" />
                Ports Served * (Select all that apply)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {SAMPLE_PORTS.map((port) => (
                  <label
                    key={port.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                      formData.portsServed.includes(port.id)
                        ? 'bg-blue-50 text-blue-900'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.portsServed.includes(port.id)}
                      onChange={() => togglePort(port.id)}
                    />
                    <span className="text-sm">{port.name}</span>
                  </label>
                ))}
              </div>
              {errors.portsServed && (
                <p className="text-red-500 text-sm mt-1">{errors.portsServed}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Account */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="agent@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="inline h-4 w-4 mr-1" />
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Min 8 chars, uppercase, lowercase, number"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="inline h-4 w-4 mr-1" />
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <div className={`border rounded-lg p-4 ${errors.agreedToTerms ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreedToTerms}
                  onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                  className="mt-1"
                />
                <div className="text-sm text-gray-700">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-blue-600 hover:underline">
                    Beta Program SLA
                  </a>
                  . I understand this is a beta version and may have limited features.
                </div>
              </label>
              {errors.agreedToTerms && (
                <p className="text-red-500 text-sm mt-2">{errors.agreedToTerms}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="text-center py-8">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Mari8X Beta!</h2>
            <p className="text-gray-600 mb-6">
              Your account has been created successfully.
              <br />
              Please complete the onboarding steps to start using the platform.
            </p>
            <button
              onClick={() => navigate('/beta/onboarding')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue to Onboarding
            </button>
          </div>
        )}

        {/* Error Display */}
        {(mutationError || errors.submit) && step < 4 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">
              {mutationError?.message || errors.submit}
            </span>
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 4 && (
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                step === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : step === 3 ? 'Create Account' : 'Next'}
            </button>
          </div>
        )}

        {/* Login Link */}
        {step < 4 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
