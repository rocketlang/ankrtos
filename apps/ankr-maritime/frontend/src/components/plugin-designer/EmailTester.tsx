/**
 * Email Tester Component
 * Live testing of email parsing with visual results
 */

import React, { useState } from 'react';
import { Play, AlertCircle, CheckCircle, Tag, Inbox, Zap, FileText } from 'lucide-react';
import { gql, useMutation } from '@apollo/client';

const TEST_EMAIL = gql`
  mutation TestEmail($industry: String!, $subject: String!, $body: String!) {
    testEmail(industry: $industry, subject: $subject, body: $body) {
      entities
      category
      categoryConfidence
      urgency
      urgencyScore
      actionable
      bucket
      confidence
      processingTime
    }
  }
`;

interface EmailTesterProps {
  industry: string;
}

export const EmailTester: React.FC<EmailTesterProps> = ({ industry }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [result, setResult] = useState<any>(null);

  const [testEmail, { loading, error }] = useMutation(TEST_EMAIL);

  const handleTest = async () => {
    if (!subject.trim() && !body.trim()) {
      alert('Please enter an email subject and body');
      return;
    }

    try {
      const { data } = await testEmail({
        variables: {
          industry,
          subject,
          body,
        },
      });

      if (data?.testEmail) {
        setResult({
          ...data.testEmail,
          entities: data.testEmail.entities.map((e: string) => JSON.parse(e)),
        });
      }
    } catch (err) {
      console.error('Test failed:', err);
    }
  };

  const loadSampleEmail = () => {
    setSubject('M/V ATLANTIC STAR - Fixture Offer - Singapore to Rotterdam');
    setBody(`Dear Charterer,

We are pleased to offer M/V ATLANTIC STAR for your consideration.

Vessel Details:
- IMO: 9876543
- DWT: 75,000 MT
- Built: 2015
- Flag: Panama

Voyage Details:
- Load Port: Singapore
- Discharge Port: Rotterdam
- Cargo: Iron Ore (65,000 MT)
- Laycan: 15-20 March 2026
- Freight Rate: USD 18.50/mt

This is a firm offer valid until 18:00 GMT today. Please confirm urgently.

Best regards,
Commercial Team`);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getActionableColor = (actionable: string) => {
    switch (actionable) {
      case 'requires_approval':
        return 'bg-purple-100 text-purple-700';
      case 'requires_response':
        return 'bg-blue-100 text-blue-700';
      case 'requires_action':
        return 'bg-indigo-100 text-indigo-700';
      case 'informational':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Email Tester</h3>
          <p className="text-sm text-gray-600 mt-1">
            Test your plugin with sample emails to see how they're parsed
          </p>
        </div>
        <button
          onClick={loadSampleEmail}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Load Sample Email
        </button>
      </div>

      {/* Input Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Email body..."
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
        </div>

        <button
          onClick={handleTest}
          disabled={loading || !industry}
          className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4" />
          {loading ? 'Testing...' : 'Test Email'}
        </button>

        {error && (
          <div className="flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Test failed: {error.message}</span>
          </div>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h4 className="text-md font-semibold text-gray-900">Test Results</h4>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Zap className="w-4 h-4" />
              <span>{result.processingTime}ms</span>
              <span className="text-gray-400">•</span>
              <span>Confidence: {(result.confidence * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            {/* Category */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <Tag className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Category</span>
              </div>
              <div className="text-lg font-semibold text-blue-900">
                {result.category || 'None'}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {(result.categoryConfidence * 100).toFixed(1)}% confidence
              </div>
            </div>

            {/* Urgency */}
            <div className={`border rounded-lg p-3 ${getUrgencyColor(result.urgency)}`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Urgency</span>
              </div>
              <div className="text-lg font-semibold capitalize">
                {result.urgency}
              </div>
              <div className="text-xs mt-1">
                Score: {result.urgencyScore}/100
              </div>
            </div>

            {/* Bucket */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <Inbox className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Bucket</span>
              </div>
              <div className="text-lg font-semibold text-green-900">
                {result.bucket || 'None'}
              </div>
              <div className={`text-xs mt-1 px-2 py-0.5 rounded inline-block ${getActionableColor(result.actionable)}`}>
                {result.actionable?.replace(/_/g, ' ')}
              </div>
            </div>
          </div>

          {/* Extracted Entities */}
          <div>
            <div className="flex items-center gap-2 text-gray-700 mb-3">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Extracted Entities ({result.entities.length})</span>
            </div>

            {result.entities.length === 0 ? (
              <div className="text-sm text-gray-400 italic py-2">No entities extracted</div>
            ) : (
              <div className="space-y-2">
                {result.entities.map((entity: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex-shrink-0">
                      <div className="text-xs font-medium text-gray-700 bg-gray-200 px-2 py-1 rounded">
                        {entity.type}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {typeof entity.value === 'object'
                          ? JSON.stringify(entity.value)
                          : entity.value}
                      </div>
                      {entity.context && (
                        <div className="text-xs text-gray-600 mt-1">
                          Context: "...{entity.context}..."
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <div className="text-xs text-gray-500">
                        {(entity.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Success Indicator */}
          <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Email successfully parsed and classified</span>
          </div>
        </div>
      )}
    </div>
  );
};
