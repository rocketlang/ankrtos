import React, { useState, useEffect } from 'react';

export default function AIAssistant({ call, apiBase }) {
  const [suggestions, setSuggestions] = useState([]);
  const [objections, setObjections] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulate getting AI suggestions
    loadSuggestions();
    const interval = setInterval(loadSuggestions, 8000); // Update every 8s
    return () => clearInterval(interval);
  }, [call]);

  async function loadSuggestions() {
    if (!call) return;

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/ai/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_id: call.id,
          transcript_snippet: getRandomTranscript(),
          lead_context: call.lead
        })
      });

      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setObjections(data.objections || []);
      setSentiment(data.sentiment);
      setLoading(false);
    } catch (err) {
      console.error('Error loading AI suggestions:', err);
      setLoading(false);
    }
  }

  function getRandomTranscript() {
    const snippets = [
      "I understand your concern about the cost...",
      "We're quite busy at the moment...",
      "That sounds interesting, tell me more...",
      "I'm not sure if this is right for us...",
      "How much does this program cost?"
    ];
    return snippets[Math.floor(Math.random() * snippets.length)];
  }

  return (
    <div className="ai-assistant">
      <div className="ai-assistant-header">
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1em' }}>🤖 AI Assistant</div>
          <div style={{ fontSize: '0.85em', opacity: 0.9 }}>
            Real-time guidance
          </div>
        </div>
        {loading && <div className="loading"></div>}
      </div>

      <div className="ai-assistant-body">
        {/* Sentiment */}
        {sentiment && (
          <div className="ai-suggestion" style={{
            borderLeftColor: sentiment.label === 'positive' ? '#10b981' :
                            sentiment.label === 'negative' ? '#ef4444' : '#6b7280'
          }}>
            <div className="ai-suggestion-title">
              {sentiment.label === 'positive' && '😊'}
              {sentiment.label === 'neutral' && '😐'}
              {sentiment.label === 'negative' && '😞'}
              <span> Customer Sentiment</span>
            </div>
            <div style={{ marginTop: 8, fontSize: '1.5em', fontWeight: 700 }}>
              {sentiment.label.charAt(0).toUpperCase() + sentiment.label.slice(1)}
            </div>
            <div style={{ fontSize: '0.9em', color: 'var(--text-secondary)', marginTop: 4 }}>
              Confidence: {(sentiment.confidence * 100).toFixed(0)}%
            </div>
          </div>
        )}

        {/* Objections Detected */}
        {objections.length > 0 && (
          <div className="ai-suggestion" style={{ borderLeftColor: '#f59e0b' }}>
            <div className="ai-suggestion-title">
              ⚠️ Objection Detected
            </div>
            {objections.map((obj, i) => (
              <div key={i} style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95em' }}>
                  {obj.detected}
                </div>
                <div style={{
                  marginTop: 8,
                  padding: 12,
                  background: 'white',
                  borderRadius: 6,
                  fontSize: '0.9em',
                  lineHeight: 1.6
                }}>
                  💡 Suggested Response:<br/>
                  "{obj.response}"
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Suggestions */}
        {suggestions.map((suggestion, i) => (
          <div key={i} className="ai-suggestion" style={{
            borderLeftColor: suggestion.priority === 'high' ? '#ef4444' : '#667eea'
          }}>
            <div className="ai-suggestion-title">
              {suggestion.type === 'action' && '🎯'}
              {suggestion.type === 'question' && '❓'}
              {suggestion.type === 'info' && 'ℹ️'}
              {suggestion.type === 'response' && '💬'}
              <span> {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}</span>
              {suggestion.priority === 'high' && (
                <span style={{
                  background: '#ef4444',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: '0.75em',
                  marginLeft: 8
                }}>
                  HIGH
                </span>
              )}
            </div>
            <div style={{ marginTop: 8, lineHeight: 1.6 }}>
              {suggestion.text}
            </div>
          </div>
        ))}

        {/* Lead Info */}
        <div className="ai-suggestion" style={{ borderLeftColor: '#3b82f6' }}>
          <div className="ai-suggestion-title">
            📋 Lead Info
          </div>
          <div style={{ marginTop: 12, fontSize: '0.9em', lineHeight: 1.8 }}>
            <div><strong>Company:</strong> {call.lead?.company}</div>
            <div><strong>Designation:</strong> {call.lead?.designation || 'N/A'}</div>
            <div><strong>Location:</strong> {call.lead?.location || 'N/A'}</div>
            <div><strong>Lead Score:</strong> <span style={{
              background: call.lead?.lead_score > 80 ? '#10b981' :
                         call.lead?.lead_score > 60 ? '#f59e0b' : '#6b7280',
              color: 'white',
              padding: '2px 8px',
              borderRadius: 4,
              fontWeight: 700
            }}>{call.lead?.lead_score}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
