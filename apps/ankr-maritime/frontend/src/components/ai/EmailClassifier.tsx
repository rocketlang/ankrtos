import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';

const CLASSIFY_EMAIL = gql`
  mutation ClassifyEmail($subject: String!, $body: String!, $sender: String) {
    classifyEmail(subject: $subject, body: $body, sender: $sender)
  }
`;

const CLASSIFY_BATCH = gql`
  mutation ClassifyEmailBatch($emailIds: [String!]!) {
    classifyEmailBatch(emailIds: $emailIds)
  }
`;

interface ClassificationResult {
  category: string;
  urgency: string;
  actionable: string;
  confidence: number;
  dealTerms?: any;
  entities?: any;
}

export const EmailClassifier: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sender, setSender] = useState('');
  const [result, setResult] = useState<ClassificationResult | null>(null);

  const [classifyEmail, { loading }] = useMutation(CLASSIFY_EMAIL, {
    onCompleted: (data) => {
      setResult(data.classifyEmail);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    classifyEmail({ variables: { subject, body, sender } });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      FIXTURE: 'bg-blue-100 text-blue-800',
      OPERATIONS: 'bg-green-100 text-green-800',
      CLAIMS: 'bg-red-100 text-red-800',
      PAYMENT: 'bg-yellow-100 text-yellow-800',
      TECHNICAL: 'bg-purple-100 text-purple-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      CRITICAL: 'bg-red-600 text-white',
      HIGH: 'bg-orange-500 text-white',
      MEDIUM: 'bg-yellow-500 text-white',
      LOW: 'bg-green-500 text-white',
    };
    return colors[urgency] || 'bg-gray-500 text-white';
  };

  const loadSample = () => {
    setSubject('RE: MV OCEAN STAR - Fixture Offer');
    setBody('Dear Sir,\n\nWe are pleased to offer MV OCEAN STAR for your coal cargo ex Richards Bay to Mumbai.\n\nVessel particulars:\n- DWT: 82,000 MT\n- Built: 2015\n- Flag: Panama\n\nFreight: USD 18.50 PMT\nLaycan: 15-20 December 2026\nLoad rate: 12,000 MT PWWD SHEX\nDischarge rate: 10,000 MT PWWD SHEX\n\nCommissions: 1.25% address + 1.25% brokerage\n\nKindly revert soonest.\n\nBest regards');
    setSender('broker@example.com');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Email Classification</h3>
          <button
            onClick={loadSample}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Load Sample
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email subject..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From (Optional)
            </label>
            <input
              type="email"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="sender@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email content..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Classifying...' : 'Classify Email'}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Classification Result</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Category
              </label>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(result.category)}`}>
                {result.category}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Urgency
              </label>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(result.urgency)}`}>
                {result.urgency}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Actionable
              </label>
              <span className="text-gray-900">{result.actionable}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Confidence
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${result.confidence * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>

          {result.dealTerms && Object.keys(result.dealTerms).length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h4 className="text-sm font-semibold mb-2">Extracted Deal Terms</h4>
              <pre className="text-xs text-gray-700 overflow-x-auto">
                {JSON.stringify(result.dealTerms, null, 2)}
              </pre>
            </div>
          )}

          {result.entities && Object.keys(result.entities).length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h4 className="text-sm font-semibold mb-2">Extracted Entities</h4>
              <pre className="text-xs text-gray-700 overflow-x-auto">
                {JSON.stringify(result.entities, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
