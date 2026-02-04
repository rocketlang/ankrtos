import React, { useState } from 'react';
import { EmailClassifier } from '../components/ai/EmailClassifier';
import { FixtureMatcher } from '../components/ai/FixtureMatcher';
import { NLQueryBox } from '../components/ai/NLQueryBox';
import { PricePrediction } from '../components/ai/PricePrediction';
import { DocumentParser } from '../components/ai/DocumentParser';
import { MarketSentiment } from '../components/ai/MarketSentiment';

type Tab = 'nlquery' | 'email' | 'fixture' | 'price' | 'sentiment' | 'document';

const tabs: Array<{ id: Tab; name: string; icon: string; description: string }> = [
  {
    id: 'nlquery',
    name: 'Natural Language',
    icon: '🗣️',
    description: 'Query database in plain English',
  },
  {
    id: 'email',
    name: 'Email Classifier',
    icon: '📧',
    description: 'Auto-classify maritime emails',
  },
  {
    id: 'fixture',
    name: 'Fixture Matcher',
    icon: '🚢',
    description: 'AI-powered vessel matching',
  },
  {
    id: 'price',
    name: 'Price Prediction',
    icon: '💰',
    description: 'Predict freight & bunker prices',
  },
  {
    id: 'sentiment',
    name: 'Market Sentiment',
    icon: '📊',
    description: 'Real-time market analysis',
  },
  {
    id: 'document',
    name: 'Document Parser',
    icon: '📄',
    description: 'Extract data from documents',
  },
];

export default function AIDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('nlquery');

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2">🤖 AI Engine</h1>
          <p className="text-blue-100">
            Intelligent automation powered by machine learning
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-4 text-center transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <div className="text-3xl mb-1">{tab.icon}</div>
                <div
                  className={`text-sm font-medium ${
                    activeTab === tab.id ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {tab.name}
                </div>
                <div className="text-xs text-gray-500 mt-1 hidden lg:block">
                  {tab.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-opacity duration-300">
          {activeTab === 'nlquery' && <NLQueryBox />}
          {activeTab === 'email' && <EmailClassifier />}
          {activeTab === 'fixture' && <FixtureMatcher />}
          {activeTab === 'price' && <PricePrediction />}
          {activeTab === 'sentiment' && <MarketSentiment />}
          {activeTab === 'document' && <DocumentParser />}
        </div>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-3">
              <div className="text-3xl mr-3">⚡</div>
              <h3 className="text-lg font-semibold">Real-time AI</h3>
            </div>
            <p className="text-sm text-gray-600">
              All AI models run in real-time with sub-second response times for instant insights.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-3">
              <div className="text-3xl mr-3">🎯</div>
              <h3 className="text-lg font-semibold">High Accuracy</h3>
            </div>
            <p className="text-sm text-gray-600">
              ML models trained on maritime data with 90%+ accuracy for reliable decision support.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-3">
              <div className="text-3xl mr-3">🔒</div>
              <h3 className="text-lg font-semibold">Secure & Private</h3>
            </div>
            <p className="text-sm text-gray-600">
              Your data never leaves your infrastructure. All AI processing happens locally.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
          <h3 className="text-lg font-semibold mb-4">🌟 AI Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <div>
                <div className="font-medium text-gray-900">Email Auto-Classification</div>
                <div className="text-sm text-gray-600">
                  10+ categories, urgency detection, deal term extraction
                </div>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <div>
                <div className="font-medium text-gray-900">Intelligent Matching</div>
                <div className="text-sm text-gray-600">
                  AI-powered vessel-cargo matching with suitability scoring
                </div>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <div>
                <div className="font-medium text-gray-900">Predictive Analytics</div>
                <div className="text-sm text-gray-600">
                  Freight rates, bunker prices, vessel values with confidence intervals
                </div>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <div>
                <div className="font-medium text-gray-900">Natural Language Queries</div>
                <div className="text-sm text-gray-600">
                  Query database in plain English, auto-generate SQL
                </div>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <div>
                <div className="font-medium text-gray-900">Document Intelligence</div>
                <div className="text-sm text-gray-600">
                  Auto-parse charter parties, BOLs, invoices with entity extraction
                </div>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <div>
                <div className="font-medium text-gray-900">Market Sentiment</div>
                <div className="text-sm text-gray-600">
                  Real-time analysis with Baltic Index correlation
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
