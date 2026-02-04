// SwayamBot.tsx — Multilingual AI Assistant for Mari8X with RAG

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useLazyQuery, gql } from '@apollo/client';
import { SourceCitation } from './rag/SourceCitation';
import { DocumentPreviewModal } from './rag/DocumentPreviewModal';

const ASK_MARI8X_RAG = gql`
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
      timestamp
      followUpSuggestions
    }
  }
`;

interface SourceDocument {
  documentId: string;
  title: string;
  excerpt: string;
  page?: number;
  relevanceScore: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: SourceDocument[];
  confidence?: number;
  followUpSuggestions?: string[];
}

interface PageContext {
  page: string;
  specialization: string;
  keywords: string[];
}

export function SwayamBot() {
  const { t, i18n } = useTranslation(['common', 'maritime']);
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pageContext, setPageContext] = useState<PageContext | null>(null);
  const [previewDocument, setPreviewDocument] = useState<{ id: string; title: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [askRAG] = useLazyQuery(ASK_MARI8X_RAG);

  // Detect page context
  useEffect(() => {
    const context = detectPageContext(location.pathname);
    setPageContext(context);

    // Welcome message based on page
    if (messages.length === 0 && isOpen) {
      addWelcomeMessage(context);
    }
  }, [location.pathname, isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function detectPageContext(pathname: string): PageContext {
    const pageMap: Record<string, { specialization: string; keywords: string[] }> = {
      '/chartering': {
        specialization: 'Fixture negotiation, C/P clauses, freight rates',
        keywords: ['fixture', 'charter party', 'freight', 'demurrage', 'laytime'],
      },
      '/voyages': {
        specialization: 'Voyage tracking, ETA calculations, port operations',
        keywords: ['voyage', 'eta', 'nor', 'sof', 'port call'],
      },
      '/da-desk': {
        specialization: 'Port costs, DA calculations, vendor management',
        keywords: ['pda', 'fda', 'port costs', 'disbursement', 'agent'],
      },
      '/laytime': {
        specialization: 'Laytime calculations, demurrage/despatch',
        keywords: ['laytime', 'demurrage', 'despatch', 'wwdshex', 'shinc'],
      },
      '/claims': {
        specialization: 'Claims procedures, time bars, evidence collection',
        keywords: ['claim', 'time bar', 'evidence', 'dispute', 'settlement'],
      },
      '/compliance': {
        specialization: 'Sanctions screening, KYC, regulatory compliance',
        keywords: ['sanctions', 'kyc', 'aml', 'ofac', 'compliance'],
      },
      '/analytics': {
        specialization: 'Data interpretation, KPI analysis, reporting',
        keywords: ['analytics', 'kpi', 'tce', 'utilization', 'report'],
      },
      '/ffa': {
        specialization: 'FFA positions, derivatives, risk management',
        keywords: ['ffa', 'derivatives', 'var', 'hedge', 'position'],
      },
    };

    for (const [path, config] of Object.entries(pageMap)) {
      if (pathname.includes(path)) {
        return { page: path, ...config };
      }
    }

    return {
      page: 'dashboard',
      specialization: 'General maritime operations assistance',
      keywords: ['help', 'navigation', 'features'],
    };
  }

  function addWelcomeMessage(context: PageContext) {
    const welcomeMessages: Record<string, string> = {
      '/chartering': t('swayam.welcome.chartering', 'Hello! I can help you with fixture negotiations, charter party clauses, and freight rates. What would you like to know?'),
      '/voyages': t('swayam.welcome.voyage', 'Hi! Ask me about voyage tracking, ETA calculations, or port operations.'),
      '/da-desk': t('swayam.welcome.da', 'Welcome! I can assist with port costs, DA calculations, and vendor management.'),
      '/laytime': t('swayam.welcome.laytime', 'Hello! I specialize in laytime calculations, demurrage, and despatch. How can I help?'),
      '/claims': t('swayam.welcome.claims', 'Hi! I can help with claims procedures, time bar deadlines, and evidence requirements.'),
      '/compliance': t('swayam.welcome.compliance', 'Welcome! Ask me about sanctions screening, KYC requirements, or regulatory compliance.'),
      '/analytics': t('swayam.welcome.analytics', 'Hello! I can help interpret your data, explain KPIs, and generate reports.'),
      '/ffa': t('swayam.welcome.ffa', 'Hi! I specialize in FFA positions, derivatives trading, and risk management.'),
    };

    const welcomeText = welcomeMessages[context.page] || t('swayam.welcome.default', 'Hello! I\'m Swayam, your maritime AI assistant powered by RAG. I can search through your documents to give you accurate answers. How can I help you today?');

    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: welcomeText,
      timestamp: new Date(),
    }]);
  }

  async function handleSend() {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call RAG query
      const { data } = await askRAG({
        variables: {
          question: input,
          limit: 5,
        },
      });

      if (data?.askMari8xRAG) {
        const result = data.askMari8xRAG;

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.answer,
          timestamp: new Date(result.timestamp),
          sources: result.sources || [],
          confidence: result.confidence,
          followUpSuggestions: result.followUpSuggestions || [],
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Swayam RAG error:', error);

      // Fallback response
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('swayam.error', 'Sorry, I\'m having trouble connecting to the knowledge base. Please try again in a moment.'),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleFollowUpClick(suggestion: string) {
    setInput(suggestion);
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-maritime-500 hover:bg-maritime-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50"
          aria-label={t('swayam.open', 'Open Swayam Assistant')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[480px] h-[700px] bg-maritime-900 border border-maritime-700 rounded-lg shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="bg-maritime-800 px-4 py-3 rounded-t-lg flex items-center justify-between border-b border-maritime-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <div className="font-semibold text-maritime-50 flex items-center gap-2">
                  Swayam
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">RAG</span>
                </div>
                <div className="text-xs text-maritime-400">
                  {pageContext?.specialization.split(',')[0] || 'Maritime Assistant'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-maritime-400 hover:text-maritime-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <div
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-maritime-500 text-white'
                        : 'bg-maritime-800 text-maritime-100 border border-maritime-700'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-maritime-200' : 'text-maritime-500'}`}>
                      {message.timestamp.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Sources & Confidence for assistant messages */}
                {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                  <div className="mt-2 ml-2 space-y-2">
                    {/* Confidence Score */}
                    {message.confidence !== undefined && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-maritime-400">Confidence:</span>
                        <div className="flex-1 bg-maritime-800 rounded-full h-2 max-w-[120px]">
                          <div
                            className={`h-2 rounded-full ${
                              message.confidence >= 80
                                ? 'bg-green-500'
                                : message.confidence >= 60
                                ? 'bg-blue-500'
                                : message.confidence >= 40
                                ? 'bg-yellow-500'
                                : 'bg-gray-500'
                            }`}
                            style={{ width: `${message.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-maritime-300">
                          {Math.round(message.confidence)}%
                        </span>
                      </div>
                    )}

                    {/* Sources Header */}
                    <div className="text-xs font-medium text-maritime-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                      </svg>
                      Sources ({message.sources.length}):
                    </div>

                    {/* Source Citations */}
                    <div className="space-y-1">
                      {message.sources.slice(0, 3).map((source, idx) => (
                        <SourceCitation
                          key={idx}
                          source={source}
                          index={idx}
                          onClick={() =>
                            setPreviewDocument({
                              id: source.documentId,
                              title: source.title,
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up Suggestions */}
                {message.role === 'assistant' && message.followUpSuggestions && message.followUpSuggestions.length > 0 && (
                  <div className="mt-2 ml-2">
                    <div className="text-xs font-medium text-maritime-400 mb-1">
                      Suggested follow-ups:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {message.followUpSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleFollowUpClick(suggestion)}
                          className="text-xs px-2 py-1 bg-maritime-800 hover:bg-maritime-700 text-maritime-300 rounded border border-maritime-600 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-maritime-800 px-4 py-2 rounded-lg border border-maritime-700">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-maritime-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-maritime-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-maritime-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-maritime-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('swayam.placeholder', 'Ask me anything...')}
                className="flex-1 bg-maritime-800 border border-maritime-700 rounded-lg px-4 py-2 text-maritime-100 placeholder-maritime-500 focus:outline-none focus:border-maritime-500"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-maritime-500 hover:bg-maritime-600 disabled:bg-maritime-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDocument && (
        <DocumentPreviewModal
          documentId={previewDocument.id}
          title={previewDocument.title}
          isOpen={true}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </>
  );
}
