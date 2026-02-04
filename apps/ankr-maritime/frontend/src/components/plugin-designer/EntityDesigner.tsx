/**
 * Entity Designer Component
 * Visual interface for designing entity extractors
 */

import React, { useState } from 'react';
import { PlusCircle, Trash2, Sparkles, AlertCircle } from 'lucide-react';

interface EntityExtractor {
  name: string;
  description: string;
  pattern?: string;
  patterns?: string[];
  ragQuery?: string;
  weight: number;
  examples: string[];
  extractionMode: 'regex' | 'multi-pattern' | 'rag';
}

interface EntityDesignerProps {
  extractors: EntityExtractor[];
  onChange: (extractors: EntityExtractor[]) => void;
}

export const EntityDesigner: React.FC<EntityDesignerProps> = ({ extractors, onChange }) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [learningPattern, setLearningPattern] = useState<number | null>(null);

  const addExtractor = () => {
    onChange([
      ...extractors,
      {
        name: '',
        description: '',
        weight: 0.9,
        examples: [],
        extractionMode: 'regex',
      },
    ]);
    setExpandedId(extractors.length);
  };

  const updateExtractor = (index: number, updates: Partial<EntityExtractor>) => {
    const updated = [...extractors];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const deleteExtractor = (index: number) => {
    onChange(extractors.filter((_, i) => i !== index));
  };

  const addExample = (index: number, example: string) => {
    if (!example.trim()) return;
    const updated = [...extractors];
    updated[index].examples = [...updated[index].examples, example];
    onChange(updated);
  };

  const removeExample = (extractorIndex: number, exampleIndex: number) => {
    const updated = [...extractors];
    updated[extractorIndex].examples = updated[extractorIndex].examples.filter((_, i) => i !== exampleIndex);
    onChange(updated);
  };

  const learnPattern = async (index: number) => {
    const extractor = extractors[index];
    if (extractor.examples.length === 0) {
      alert('Add at least one example first');
      return;
    }

    setLearningPattern(index);

    try {
      // TODO: Call GraphQL mutation to learn pattern
      // For now, create a simple OR pattern
      const escaped = extractor.examples.map((ex) => ex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const pattern = `\\b(${escaped.join('|')})\\b`;

      updateExtractor(index, { pattern });
    } catch (error) {
      console.error('Failed to learn pattern:', error);
      alert('Failed to learn pattern. Try manually entering a regex.');
    } finally {
      setLearningPattern(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Entity Extractors</h3>
          <p className="text-sm text-gray-600 mt-1">
            Define what entities to extract from emails (e.g., vessel names, ports, dates)
          </p>
        </div>
        <button
          onClick={addExtractor}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Add Extractor
        </button>
      </div>

      {/* Extractors List */}
      {extractors.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No entity extractors yet. Add one to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {extractors.map((extractor, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
            >
              {/* Extractor Header */}
              <div
                onClick={() => setExpandedId(expandedId === index ? null : index)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-gray-900">
                      {extractor.name || <span className="text-gray-400 italic">Unnamed extractor</span>}
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {extractor.extractionMode}
                    </div>
                    <div className="text-xs text-gray-500 bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {extractor.examples.length} examples
                    </div>
                  </div>
                  {extractor.description && (
                    <p className="text-sm text-gray-600 mt-1">{extractor.description}</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteExtractor(index);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Extractor Details (Expanded) */}
              {expandedId === index && (
                <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Entity Name *
                      </label>
                      <input
                        type="text"
                        value={extractor.name}
                        onChange={(e) => updateExtractor(index, { name: e.target.value })}
                        placeholder="e.g., Vessel, Port, Date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Extraction Mode
                      </label>
                      <select
                        value={extractor.extractionMode}
                        onChange={(e) =>
                          updateExtractor(index, { extractionMode: e.target.value as any })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="regex">Regex Pattern</option>
                        <option value="multi-pattern">Multiple Patterns</option>
                        <option value="rag">AI-Powered (RAG)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={extractor.description}
                      onChange={(e) => updateExtractor(index, { description: e.target.value })}
                      placeholder="What does this extractor find?"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confidence Weight (0-1)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={extractor.weight}
                      onChange={(e) =>
                        updateExtractor(index, { weight: parseFloat(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Examples Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Training Examples
                    </label>
                    <div className="space-y-2">
                      {extractor.examples.map((example, exampleIndex) => (
                        <div key={exampleIndex} className="flex items-center gap-2">
                          <div className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-sm">
                            {example}
                          </div>
                          <button
                            onClick={() => removeExample(index, exampleIndex)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add example value (e.g., M/V ATLANTIC STAR)"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addExample(index, e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <button
                          onClick={() => learnPattern(index)}
                          disabled={learningPattern === index}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Sparkles className="w-4 h-4" />
                          {learningPattern === index ? 'Learning...' : 'Learn Pattern'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pattern Section */}
                  {extractor.extractionMode === 'regex' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Regex Pattern
                      </label>
                      <input
                        type="text"
                        value={extractor.pattern || ''}
                        onChange={(e) => updateExtractor(index, { pattern: e.target.value })}
                        placeholder="e.g., \\b(M/V|MT)\\s+[A-Z][A-Za-z0-9\\s-]{2,40}\\b"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use standard JavaScript regex syntax. Pattern will be used with 'gi' flags.
                      </p>
                    </div>
                  )}

                  {extractor.extractionMode === 'rag' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RAG Query
                      </label>
                      <textarea
                        value={extractor.ragQuery || ''}
                        onChange={(e) => updateExtractor(index, { ragQuery: e.target.value })}
                        placeholder="Describe what to extract in natural language..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
