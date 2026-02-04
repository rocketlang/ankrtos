import React, { useState } from 'react';
import { useLazyQuery, gql } from '@apollo/client';

const ASK_COMPLIANCE = gql`
  query AskMari8xRAG($question: String!, $limit: Int, $docTypes: [String!]) {
    askMari8xRAG(question: $question, limit: $limit, docTypes: $docTypes) {
      answer
      sources {
        documentId
        title
        excerpt
        page
        relevanceScore
      }
      confidence
      followUpSuggestions
    }
  }
`;

interface ComplianceAnswer {
  question: string;
  answer: string;
  confidence: number;
  sources: Array<{
    documentId: string;
    title: string;
    excerpt: string;
    relevanceScore: number;
  }>;
}

export function ComplianceQAPanel() {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<ComplianceAnswer[]>([]);
  const [askCompliance, { loading }] = useLazyQuery(ASK_COMPLIANCE);

  const commonQuestions = [
    'What are OFAC sanctions requirements?',
    'KYC requirements for new charterers?',
    'How to screen vessels for sanctions?',
    'AML compliance checklist',
    'What is ITAR compliance?',
    'Export control regulations',
  ];

  const handleAsk = async () => {
    if (!question.trim()) return;

    try {
      const { data } = await askCompliance({
        variables: {
          question,
          limit: 5,
          docTypes: ['compliance', 'sop'],
        },
      });

      if (data?.askMari8xRAG) {
        const result = data.askMari8xRAG;
        const answer: ComplianceAnswer = {
          question,
          answer: result.answer,
          confidence: result.confidence,
          sources: result.sources || [],
        };

        setHistory((prev) => [answer, ...prev].slice(0, 10)); // Keep last 10
        setQuestion('');
      }
    } catch (error) {
      console.error('Compliance Q&A error:', error);
    }
  };

  const handleQuickQuestion = (q: string) => {
    setQuestion(q);
    askCompliance({
      variables: {
        question: q,
        limit: 5,
        docTypes: ['compliance', 'sop'],
      },
    }).then(({ data }) => {
      if (data?.askMari8xRAG) {
        const result = data.askMari8xRAG;
        setHistory((prev) => [
          {
            question: q,
            answer: result.answer,
            confidence: result.confidence,
            sources: result.sources || [],
          },
          ...prev,
        ].slice(0, 10));
        setQuestion('');
      }
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Compliance Assistant
            </h3>
          </div>
          <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
            RAG Powered
          </span>
        </div>
      </div>

      {/* Question Input */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Ask a compliance question
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="e.g., What are OFAC sanctions requirements?"
            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleAsk}
            disabled={loading || !question.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Ask'}
          </button>
        </div>
      </div>

      {/* Common Questions */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Common Questions
        </label>
        <div className="grid grid-cols-2 gap-2">
          {commonQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickQuestion(q)}
              disabled={loading}
              className="px-3 py-2 text-xs text-left text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Q&A History */}
      <div className="p-4">
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm">Ask a compliance question to get started</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {history.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
              >
                {/* Question */}
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg flex-shrink-0">❓</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.question}
                    </p>
                  </div>
                </div>

                {/* Answer */}
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg flex-shrink-0">💡</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {item.answer}
                    </p>
                  </div>
                </div>

                {/* Confidence & Sources */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Confidence:</span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 w-20">
                      <div
                        className={`h-2 rounded-full ${
                          item.confidence >= 80
                            ? 'bg-green-500'
                            : item.confidence >= 60
                            ? 'bg-blue-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{ width: `${item.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {Math.round(item.confidence)}%
                    </span>
                  </div>

                  {item.sources.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                      </svg>
                      {item.sources.length} source{item.sources.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
