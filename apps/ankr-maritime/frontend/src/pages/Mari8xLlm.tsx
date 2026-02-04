import { useLazyQuery, useQuery, gql } from '@apollo/client';
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next';;

const ASK_QUERY = gql`
  query AskMari8x($question: String!) {
    askMari8x(question: $question) {
      role content timestamp
      sources { type id label }
    }
  }
`;

const PRESETS_QUERY = gql`
  query Presets { llmPresetQueries }
`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: { type: string; id: string; label: string }[];
}

export function Mari8xLlm() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: presetsData } = useQuery(PRESETS_QUERY);
  const [askMari8x, { loading }] = useLazyQuery(ASK_QUERY, {
    fetchPolicy: 'no-cache',
    onCompleted: (data) => {
      if (data?.askMari8x) {
        setMessages((prev) => [...prev, data.askMari8x]);
      }
    },
  });

  const presets: string[] = presetsData?.llmPresetQueries ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = (q?: string) => {
    const question = q ?? input.trim();
    if (!question) return;
    setMessages((prev) => [...prev, { role: 'user', content: question, timestamp: new Date().toISOString() }]);
    setInput('');
    askMari8x({ variables: { question } });
  };

  const renderMarkdown = (text: string) => {
    // Simple markdown rendering for tables and bold
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];

    const flushTable = () => {
      if (tableRows.length === 0) return;
      elements.push(
        <div key={`t-${elements.length}`} className="overflow-x-auto my-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-maritime-700">
                {tableRows[0].map((h, i) => (
                  <th key={i} className="text-left px-2 py-1 text-maritime-400 font-medium">{h.trim()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(2).map((row, ri) => (
                <tr key={ri} className="border-b border-maritime-700/30">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-2 py-1 text-maritime-300">{cell.trim()}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
    };

    for (const line of lines) {
      if (line.startsWith('|')) {
        inTable = true;
        tableRows.push(line.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1));
      } else {
        if (inTable) { flushTable(); inTable = false; }
        if (line.trim()) {
          const formatted = line
            .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
            .replace(/\*(.+?)\*/g, '<em class="text-maritime-300">$1</em>');
          elements.push(
            <p key={`p-${elements.length}`} className="text-maritime-200 text-sm my-1" dangerouslySetInnerHTML={{ __html: formatted }} />
          );
        }
      }
    }
    if (inTable) flushTable();
    return <>{elements}</>;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-maritime-700 bg-maritime-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <div>
            <h1 className="text-white font-bold">Mari8xLLM</h1>
            <p className="text-maritime-400 text-xs">Maritime Operations AI Assistant</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">AI</span>
            </div>
            <h2 className="text-white font-bold text-lg">Welcome to Mari8xLLM</h2>
            <p className="text-maritime-400 text-sm mt-2 max-w-md mx-auto">
              Ask me about your fleet, voyages, claims, costs, or any maritime operations data.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2 max-w-lg mx-auto">
              {presets.slice(0, 8).map((p) => (
                <button key={p} onClick={() => handleSend(p)}
                  className="text-left bg-maritime-800 border border-maritime-700 rounded-lg px-3 py-2 text-xs text-maritime-300 hover:bg-maritime-700/50 hover:text-white transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-maritime-800 border border-maritime-700'
            }`}>
              {msg.role === 'user' ? (
                <p className="text-sm">{msg.content}</p>
              ) : (
                <>
                  {renderMarkdown(msg.content)}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-maritime-700">
                      <p className="text-maritime-500 text-[10px] mb-1">Sources:</p>
                      <div className="flex flex-wrap gap-1">
                        {msg.sources.map((s, si) => (
                          <span key={si} className="bg-maritime-700/50 text-maritime-300 text-[10px] px-1.5 py-0.5 rounded">
                            {s.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              <p className="text-[10px] mt-1 opacity-50">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-maritime-400 text-xs">Querying maritime data...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-maritime-700 bg-maritime-800">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask about fleet, voyages, claims, costs..."
            className="flex-1 bg-maritime-900 border border-maritime-700 text-white text-sm rounded-lg px-4 py-2.5 placeholder-maritime-500 focus:border-blue-500 focus:outline-none"
            disabled={loading}
          />
          <button onClick={() => handleSend()} disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-maritime-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
