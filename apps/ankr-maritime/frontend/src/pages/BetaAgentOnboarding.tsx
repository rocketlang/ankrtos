/**
 * Beta Agent Onboarding Wizard
 *
 * 6-step onboarding flow for beta agents:
 * 1. Welcome & Overview
 * 2. Submit Credentials (KYC)
 * 3. Select Port Coverage
 * 4. Accept Beta SLA
 * 5. Generate API Key
 * 6. Training & Resources
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
  Ship, FileText, MapPin, Shield, Key, GraduationCap,
  CheckCircle, AlertCircle, Copy, Check, ExternalLink,
  Loader, ChevronRight, Award
} from 'lucide-react';

const BETA_ONBOARDING_STATE = gql`
  query BetaOnboardingState {
    betaAgentOnboarding {
      organizationId
      agentName
      betaStatus
      enrolledAt
      completedAt
      progress
      steps
      nextStep
      apiKey
      serviceTypes
      portsCoverage
    }
  }
`;

const SUBMIT_CREDENTIALS = gql`
  mutation SubmitCredentials($credentials: AgentCredentialsInput!) {
    submitAgentCredentials(credentials: $credentials) {
      success
      nextStep
    }
  }
`;

const SELECT_PORT_COVERAGE = gql`
  mutation SelectPorts($coverage: PortCoverageInput!) {
    selectPortCoverage(coverage: $coverage) {
      success
      nextStep
    }
  }
`;

const ACCEPT_BETA_SLA = gql`
  mutation AcceptSLA($slaVersion: String!) {
    acceptBetaSLA(slaVersion: $slaVersion) {
      success
      nextStep
    }
  }
`;

const GENERATE_API_KEY = gql`
  mutation GenerateAPIKey {
    generateBetaAPIKey {
      success
      apiKey
      generatedAt
      onboardingComplete
    }
  }
`;

const SAMPLE_PORTS = [
  { id: 'INMUN1', name: 'Mumbai (Nhava Sheva)', country: 'India' },
  { id: 'INCCU1', name: 'Kolkata', country: 'India' },
  { id: 'INCHE6', name: 'Chennai', country: 'India' },
  { id: 'SGSIN1', name: 'Singapore', country: 'Singapore' },
  { id: 'AEJEA1', name: 'Jebel Ali', country: 'UAE' },
  { id: 'USLAX1', name: 'Los Angeles', country: 'USA' },
  { id: 'USNYC1', name: 'New York', country: 'USA' },
  { id: 'GBLON1', name: 'London', country: 'UK' },
  { id: 'NLRTM1', name: 'Rotterdam', country: 'Netherlands' },
  { id: 'CNSHA1', name: 'Shanghai', country: 'China' },
];

const SLA_TEXT = `
# Mari8X Beta Program Service Level Agreement (SLA)

**Version:** 1.0
**Effective Date:** February 4, 2026

## 1. Program Overview
This Beta Program SLA governs your participation in the Mari8X beta testing program.

## 2. Beta Period
- Duration: 90 days from enrollment
- May be extended at Mari8X's discretion

## 3. Service Availability
- Target uptime: 95% (best effort)
- Maintenance windows: Wednesdays 02:00-04:00 UTC
- No SLA credits or guarantees during beta

## 4. Support
- Email support: beta@mari8x.com
- Response time: 24-48 hours (business days)
- Community Slack channel access

## 5. Data & Privacy
- Your data will be stored securely
- We may use anonymized data for product improvement
- Data will be migrated when you graduate to paid tier

## 6. Feedback & Participation
- Expected: Weekly usage and monthly feedback
- Bug reports appreciated via in-app tool
- Feature requests welcome

## 7. Limitations
- Beta features may change or be removed
- API rate limits: 1,000 requests/day
- Storage limits: 10 GB
- No commercial SLA guarantees

## 8. Graduation to Paid Tier
- You may graduate to a paid tier at any time
- Beta data will be preserved
- Preferential pricing available for beta participants

## 9. Termination
- Either party may terminate with 7 days notice
- Mari8X may remove inactive accounts after 30 days

## 10. Disclaimer
THE BETA SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND.

By accepting this SLA, you acknowledge that you understand and agree to these terms.
`;

export default function BetaAgentOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [copiedAPIKey, setCopiedAPIKey] = useState(false);

  // Form state
  const [credentials, setCredentials] = useState({
    imoMemberNumber: '',
    portAuthorityLicense: '',
    surveyorCertification: '',
    businessRegistrationNumber: '',
  });

  const [portCoverage, setPortCoverage] = useState({
    portIds: [] as string[],
    primaryPort: '',
    secondaryPorts: [] as string[],
  });

  const [slaAccepted, setSlaAccepted] = useState(false);
  const [generatedAPIKey, setGeneratedAPIKey] = useState('');

  // Queries and mutations
  const { data, loading, refetch } = useQuery(BETA_ONBOARDING_STATE);
  const [submitCredentials, { loading: submittingCredentials }] = useMutation(SUBMIT_CREDENTIALS);
  const [selectPorts, { loading: selectingPorts }] = useMutation(SELECT_PORT_COVERAGE);
  const [acceptSLA, { loading: acceptingSLA }] = useMutation(ACCEPT_BETA_SLA);
  const [generateKey, { loading: generatingKey }] = useMutation(GENERATE_API_KEY);

  const onboardingState = data?.betaAgentOnboarding;

  // Auto-advance to correct step based on backend state
  useEffect(() => {
    if (onboardingState) {
      const { steps, nextStep } = onboardingState;

      if (nextStep === 'submit_credentials' && !steps.credentials_submitted) {
        setCurrentStep(2);
      } else if (nextStep === 'select_port_coverage' && steps.credentials_submitted) {
        setCurrentStep(3);
      } else if (nextStep === 'accept_sla' && steps.port_coverage_selected) {
        setCurrentStep(4);
      } else if (nextStep === 'generate_api_key' && steps.sla_accepted) {
        setCurrentStep(5);
      } else if (nextStep === 'training' && steps.api_key_generated) {
        setCurrentStep(6);
      }

      // Pre-fill port coverage if already selected
      if (onboardingState.portsCoverage && onboardingState.portsCoverage.length > 0) {
        setPortCoverage(prev => ({
          ...prev,
          portIds: onboardingState.portsCoverage,
        }));
      }

      // Pre-fill API key if already generated
      if (onboardingState.apiKey) {
        setGeneratedAPIKey(onboardingState.apiKey);
      }
    }
  }, [onboardingState]);

  const handleSubmitCredentials = async () => {
    try {
      await submitCredentials({ variables: { credentials } });
      await refetch();
      setCurrentStep(3);
    } catch (err) {
      console.error('Failed to submit credentials:', err);
    }
  };

  const handleSelectPorts = async () => {
    try {
      await selectPorts({ variables: { coverage: portCoverage } });
      await refetch();
      setCurrentStep(4);
    } catch (err) {
      console.error('Failed to select ports:', err);
    }
  };

  const handleAcceptSLA = async () => {
    if (!slaAccepted) {
      alert('Please read and accept the SLA to continue');
      return;
    }

    try {
      await acceptSLA({ variables: { slaVersion: '1.0' } });
      await refetch();
      setCurrentStep(5);
    } catch (err) {
      console.error('Failed to accept SLA:', err);
    }
  };

  const handleGenerateAPIKey = async () => {
    try {
      const { data } = await generateKey();
      if (data?.generateBetaAPIKey?.apiKey) {
        setGeneratedAPIKey(data.generateBetaAPIKey.apiKey);
        await refetch();
        setCurrentStep(6);
      }
    } catch (err) {
      console.error('Failed to generate API key:', err);
    }
  };

  const copyAPIKey = () => {
    navigator.clipboard.writeText(generatedAPIKey);
    setCopiedAPIKey(true);
    setTimeout(() => setCopiedAPIKey(false), 2000);
  };

  const togglePort = (portId: string) => {
    setPortCoverage(prev => ({
      ...prev,
      portIds: prev.portIds.includes(portId)
        ? prev.portIds.filter(p => p !== portId)
        : [...prev.portIds, portId],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const progress = onboardingState?.progress || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Ship className="h-10 w-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Beta Agent Onboarding</h1>
          </div>
          <p className="text-gray-600">Welcome, {onboardingState?.agentName || 'Agent'}!</p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-bold text-blue-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Step Indicators */}
          <div className="grid grid-cols-6 gap-2 mt-6">
            {[
              { icon: Award, label: 'Welcome' },
              { icon: FileText, label: 'Credentials' },
              { icon: MapPin, label: 'Ports' },
              { icon: Shield, label: 'SLA' },
              { icon: Key, label: 'API Key' },
              { icon: GraduationCap, label: 'Training' },
            ].map((step, idx) => {
              const stepNum = idx + 1;
              const isCompleted = currentStep > stepNum;
              const isCurrent = currentStep === stepNum;
              const Icon = step.icon;

              return (
                <div key={stepNum} className="text-center">
                  <div
                    className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <div className={`text-xs font-medium ${isCurrent ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="text-center">
              <Award className="h-20 w-20 text-blue-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to the Mari8X Beta Program!
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Thank you for joining our beta program. In the next few steps, you'll complete your
                agent profile, select your port coverage, accept our SLA, and receive your API
                credentials.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
                <div className="bg-blue-50 rounded-lg p-4">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900 mb-1">Submit Credentials</h3>
                  <p className="text-sm text-gray-600">Provide your agent licenses and certifications</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900 mb-1">Select Ports</h3>
                  <p className="text-sm text-gray-600">Choose the ports you serve</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <Key className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900 mb-1">Get API Access</h3>
                  <p className="text-sm text-gray-600">Receive your unique API key</p>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                Get Started
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Step 2: Credentials */}
          {currentStep === 2 && (
            <div>
              <FileText className="h-12 w-12 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Submit Your Credentials</h2>
              <p className="text-gray-600 mb-6">
                Provide your professional credentials and licenses. This helps us verify your agent
                status.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IMO Member Number (if applicable)
                  </label>
                  <input
                    type="text"
                    value={credentials.imoMemberNumber}
                    onChange={(e) =>
                      setCredentials({ ...credentials, imoMemberNumber: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="IMO12345"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Port Authority License Number
                  </label>
                  <input
                    type="text"
                    value={credentials.portAuthorityLicense}
                    onChange={(e) =>
                      setCredentials({ ...credentials, portAuthorityLicense: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="PA-2024-12345"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Surveyor Certification (if applicable)
                  </label>
                  <input
                    type="text"
                    value={credentials.surveyorCertification}
                    onChange={(e) =>
                      setCredentials({ ...credentials, surveyorCertification: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="IACS-CERT-2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Registration Number
                  </label>
                  <input
                    type="text"
                    value={credentials.businessRegistrationNumber}
                    onChange={(e) =>
                      setCredentials({ ...credentials, businessRegistrationNumber: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="BRN-2024-XXXXX"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitCredentials}
                  disabled={submittingCredentials}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submittingCredentials ? 'Submitting...' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Port Coverage */}
          {currentStep === 3 && (
            <div>
              <MapPin className="h-12 w-12 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Port Coverage</h2>
              <p className="text-gray-600 mb-6">
                Choose the ports where you provide services. You can update this later.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Port (Optional)
                </label>
                <select
                  value={portCoverage.primaryPort}
                  onChange={(e) =>
                    setPortCoverage({ ...portCoverage, primaryPort: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select primary port</option>
                  {SAMPLE_PORTS.map((port) => (
                    <option key={port.id} value={port.id}>
                      {port.name}, {port.country}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  All Ports Served (Select all that apply)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {SAMPLE_PORTS.map((port) => (
                    <label
                      key={port.id}
                      className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors ${
                        portCoverage.portIds.includes(port.id)
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-white border border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={portCoverage.portIds.includes(port.id)}
                        onChange={() => togglePort(port.id)}
                      />
                      <div>
                        <div className="font-medium text-gray-900">{port.name}</div>
                        <div className="text-sm text-gray-500">{port.country}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Selected: {portCoverage.portIds.length} port{portCoverage.portIds.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleSelectPorts}
                  disabled={selectingPorts || portCoverage.portIds.length === 0}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {selectingPorts ? 'Saving...' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: SLA Acceptance */}
          {currentStep === 4 && (
            <div>
              <Shield className="h-12 w-12 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Beta Program SLA</h2>
              <p className="text-gray-600 mb-6">
                Please read and accept our Beta Program Service Level Agreement.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto mb-6">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {SLA_TEXT}
                </pre>
              </div>

              <label className="flex items-start gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 mb-6">
                <input
                  type="checkbox"
                  checked={slaAccepted}
                  onChange={(e) => setSlaAccepted(e.target.checked)}
                  className="mt-1"
                />
                <div className="text-sm text-gray-700">
                  <strong className="text-gray-900">I have read and accept the Beta Program SLA (Version 1.0)</strong>
                  <p className="mt-1 text-gray-600">
                    By checking this box, I agree to participate in the beta program under the terms
                    outlined above.
                  </p>
                </div>
              </label>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleAcceptSLA}
                  disabled={acceptingSLA || !slaAccepted}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {acceptingSLA ? 'Accepting...' : 'Accept & Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: API Key Generation */}
          {currentStep === 5 && (
            <div>
              <Key className="h-12 w-12 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate Your API Key</h2>
              <p className="text-gray-600 mb-6">
                Your API key will allow you to integrate with Mari8X programmatically.
              </p>

              {!generatedAPIKey ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Ready to generate your API key?</h3>
                  <ul className="text-sm text-gray-700 space-y-2 mb-4">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Your API key is unique and should be kept secret</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Rate limit: 1,000 requests per day during beta</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>You can reset your key anytime from your profile settings</span>
                    </li>
                  </ul>

                  <button
                    onClick={handleGenerateAPIKey}
                    disabled={generatingKey}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 w-full"
                  >
                    {generatingKey ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader className="h-5 w-5 animate-spin" />
                        Generating...
                      </span>
                    ) : (
                      'Generate API Key'
                    )}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-2 text-green-700 mb-4">
                      <CheckCircle className="h-6 w-6" />
                      <h3 className="font-medium text-lg">API Key Generated Successfully!</h3>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between gap-4">
                        <code className="text-sm font-mono text-gray-900 break-all flex-1">
                          {generatedAPIKey}
                        </code>
                        <button
                          onClick={copyAPIKey}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
                        >
                          {copiedAPIKey ? (
                            <>
                              <Check className="h-4 w-4 text-green-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <strong>Important:</strong> Store this key securely. You won't be able to
                          see it again. If you lose it, you'll need to generate a new one.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => setCurrentStep(6)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Continue to Training
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 6: Training & Completion */}
          {currentStep === 6 && (
            <div className="text-center">
              <GraduationCap className="h-20 w-20 text-blue-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🎉 Onboarding Complete!
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                You're all set! Explore our training resources to get the most out of Mari8X.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-8">
                <a
                  href="/docs/getting-started"
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors text-left group"
                >
                  <FileText className="h-8 w-8 text-blue-600 mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center justify-between">
                    Getting Started Guide
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                  </h3>
                  <p className="text-sm text-gray-600">
                    Learn the basics of Mari8X in 10 minutes
                  </p>
                </a>

                <a
                  href="/docs/api-reference"
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors text-left group"
                >
                  <Key className="h-8 w-8 text-blue-600 mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center justify-between">
                    API Documentation
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                  </h3>
                  <p className="text-sm text-gray-600">
                    Complete API reference and examples
                  </p>
                </a>

                <a
                  href="/docs/video-tutorials"
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors text-left group"
                >
                  <GraduationCap className="h-8 w-8 text-blue-600 mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center justify-between">
                    Video Tutorials
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                  </h3>
                  <p className="text-sm text-gray-600">
                    Step-by-step video walkthroughs
                  </p>
                </a>

                <a
                  href="mailto:beta@mari8x.com"
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors text-left group"
                >
                  <Ship className="h-8 w-8 text-blue-600 mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center justify-between">
                    Contact Support
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                  </h3>
                  <p className="text-sm text-gray-600">
                    Get help from our beta support team
                  </p>
                </a>
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors inline-flex items-center gap-2"
              >
                Go to Dashboard
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
