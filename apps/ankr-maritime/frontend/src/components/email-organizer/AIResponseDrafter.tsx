/**
 * AI Response Drafter Component
 * Generate AI-powered email responses with multiple styles
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Save,
  RefreshCw,
  Copy,
  Edit,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { gql, useMutation } from '@apollo/client';

const GENERATE_RESPONSE = gql`
  mutation GenerateEmailResponse($context: ResponseContextInput!, $style: ResponseStyle!) {
    generateEmailResponse(context: $context, style: $style) {
      id
      subject
      body
      style
      confidence
      contextUsed
      suggestedEdits
      generatedAt
    }
  }
`;

const UPDATE_DRAFT = gql`
  mutation UpdateResponseDraft($draftId: String!, $updates: UpdateDraftInput!) {
    updateResponseDraft(draftId: $draftId, updates: $updates)
  }
`;

interface EmailMessage {
  subject: string;
  body: string;
  from: string;
  to: string[];
  category?: string;
  urgency?: string;
  entities?: Record<string, any[]>;
}

interface AIResponseDrafterProps {
  originalEmail: EmailMessage;
  onSend?: (draft: { subject: string; body: string }) => void;
  onSave?: (draft: { subject: string; body: string }) => void;
  onCancel?: () => void;
}

type ResponseStyle =
  | 'acknowledge'
  | 'query_reply'
  | 'formal'
  | 'concise'
  | 'friendly'
  | 'follow_up'
  | 'rejection_polite'
  | 'acceptance'
  | 'auto_reply';

const RESPONSE_STYLES: Array<{ value: ResponseStyle; label: string; description: string; icon: string }> = [
  { value: 'acknowledge', label: 'Acknowledge', description: 'Brief confirmation of receipt', icon: '✓' },
  { value: 'query_reply', label: 'Answer Query', description: 'Detailed response with information', icon: '?' },
  { value: 'formal', label: 'Formal', description: 'Professional business correspondence', icon: '📋' },
  { value: 'concise', label: 'Concise', description: 'Short and to the point', icon: '⚡' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and conversational', icon: '😊' },
  { value: 'follow_up', label: 'Follow Up', description: 'Gentle reminder', icon: '🔔' },
  { value: 'rejection_polite', label: 'Polite Decline', description: 'Graceful rejection', icon: '🙏' },
  { value: 'acceptance', label: 'Accept', description: 'Enthusiastic confirmation', icon: '🎉' },
  { value: 'auto_reply', label: 'Auto Reply', description: 'Out of office message', icon: '⏰' },
];

export const AIResponseDrafter: React.FC<AIResponseDrafterProps> = ({
  originalEmail,
  onSend,
  onSave,
  onCancel,
}) => {
  const [selectedStyle, setSelectedStyle] = useState<ResponseStyle>('query_reply');
  const [draft, setDraft] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [showStyleMenu, setShowStyleMenu] = useState(true);
  const [showContext, setShowContext] = useState(false);

  const [generateResponse, { loading: generating }] = useMutation(GENERATE_RESPONSE);
  const [updateDraft] = useMutation(UPDATE_DRAFT);

  const handleGenerate = async () => {
    try {
      const { data } = await generateResponse({
        variables: {
          context: {
            originalEmail: {
              subject: originalEmail.subject,
              body: originalEmail.body,
              from: originalEmail.from,
              to: originalEmail.to,
              category: originalEmail.category,
              urgency: originalEmail.urgency,
              entities: originalEmail.entities || {},
            },
          },
          style: selectedStyle,
        },
      });

      if (data?.generateEmailResponse) {
        setDraft(data.generateEmailResponse);
        setEditedSubject(data.generateEmailResponse.subject);
        setEditedBody(data.generateEmailResponse.body);
        setIsEditing(false);
        setShowStyleMenu(false);
      }
    } catch (error) {
      console.error('Failed to generate response:', error);
      alert('Failed to generate response. Please try again.');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (draft?.id) {
      await updateDraft({
        variables: {
          draftId: draft.id,
          updates: {
            subject: editedSubject,
            body: editedBody,
          },
        },
      });
    }
    setDraft({ ...draft, subject: editedSubject, body: editedBody });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedSubject(draft.subject);
    setEditedBody(draft.body);
    setIsEditing(false);
  };

  const handleCopy = () => {
    const text = `Subject: ${editedSubject}\n\n${editedBody}`;
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleSend = () => {
    if (onSend) {
      onSend({ subject: editedSubject, body: editedBody });
    }
  };

  const handleSaveDraft = () => {
    if (onSave) {
      onSave({ subject: editedSubject, body: editedBody });
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-900">AI Response Drafter</h3>
          </div>
          {draft && (
            <div className={`text-sm font-medium ${getConfidenceColor(draft.confidence)}`}>
              {(draft.confidence * 100).toFixed(0)}% confidence
            </div>
          )}
        </div>
      </div>

      {/* Style Selection */}
      {showStyleMenu && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Select Response Style</label>
            {draft && (
              <button
                onClick={() => setShowStyleMenu(false)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Hide Styles
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {RESPONSE_STYLES.map((style) => (
              <button
                key={style.value}
                onClick={() => setSelectedStyle(style.value)}
                className={`
                  p-3 border-2 rounded-lg text-left transition-all hover:scale-105
                  ${
                    selectedStyle === style.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{style.icon}</span>
                  <span className="text-sm font-medium text-gray-900">{style.label}</span>
                </div>
                <p className="text-xs text-gray-600">{style.description}</p>
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Response
              </>
            )}
          </button>
        </div>
      )}

      {/* Generated Response */}
      {draft && (
        <div className="p-4 space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            {isEditing ? (
              <input
                type="text"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                {editedSubject}
              </div>
            )}
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            {isEditing ? (
              <textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg whitespace-pre-wrap text-gray-900 max-h-96 overflow-y-auto">
                {editedBody}
              </div>
            )}
          </div>

          {/* Context Used */}
          {draft.contextUsed && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <button
                onClick={() => setShowContext(!showContext)}
                className="flex items-center justify-between w-full text-sm font-medium text-blue-900"
              >
                <span>Context Used in Generation</span>
                {showContext ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {showContext && (
                <div className="mt-2 space-y-1 text-sm text-blue-700">
                  <div>• Documents: {draft.contextUsed.documentsCount}</div>
                  <div>• Knowledge Base: {draft.contextUsed.knowledgeCount}</div>
                  <div>• Thread Messages: {draft.contextUsed.threadMessagesCount}</div>
                </div>
              )}
            </div>
          )}

          {/* Suggested Edits */}
          {draft.suggestedEdits && draft.suggestedEdits.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-yellow-900 mb-1">Suggestions</div>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {draft.suggestedEdits.map((edit: string, index: number) => (
                      <li key={index}>• {edit}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                  <button
                    onClick={() => setShowStyleMenu(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveDraft}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </button>
              <button
                onClick={handleSend}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Draft Yet */}
      {!draft && !showStyleMenu && (
        <div className="p-8 text-center">
          <button
            onClick={() => setShowStyleMenu(true)}
            className="flex items-center gap-2 mx-auto px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            Generate Response
          </button>
        </div>
      )}
    </div>
  );
};
