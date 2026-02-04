/**
 * Category Designer Component
 * Visual interface for designing email categories
 */

import React, { useState } from 'react';
import { PlusCircle, Trash2, Tag, AlertCircle } from 'lucide-react';

interface CategoryConfig {
  name: string;
  displayName: string;
  keywords: string[];
  weight: number;
  description: string;
}

interface CategoryDesignerProps {
  categories: CategoryConfig[];
  onChange: (categories: CategoryConfig[]) => void;
}

export const CategoryDesigner: React.FC<CategoryDesignerProps> = ({ categories, onChange }) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [keywordInput, setKeywordInput] = useState<Record<number, string>>({});

  const addCategory = () => {
    onChange([
      ...categories,
      {
        name: '',
        displayName: '',
        keywords: [],
        weight: 1.0,
        description: '',
      },
    ]);
    setExpandedId(categories.length);
  };

  const updateCategory = (index: number, updates: Partial<CategoryConfig>) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const deleteCategory = (index: number) => {
    onChange(categories.filter((_, i) => i !== index));
  };

  const addKeyword = (index: number) => {
    const keyword = keywordInput[index]?.trim();
    if (!keyword) return;

    const updated = [...categories];
    updated[index].keywords = [...updated[index].keywords, keyword];
    onChange(updated);

    setKeywordInput({ ...keywordInput, [index]: '' });
  };

  const removeKeyword = (categoryIndex: number, keywordIndex: number) => {
    const updated = [...categories];
    updated[categoryIndex].keywords = updated[categoryIndex].keywords.filter(
      (_, i) => i !== keywordIndex
    );
    onChange(updated);
  };

  const bulkAddKeywords = (index: number, text: string) => {
    // Split by comma, newline, or semicolon
    const keywords = text
      .split(/[,;\n]/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (keywords.length === 0) return;

    const updated = [...categories];
    updated[index].keywords = [...new Set([...updated[index].keywords, ...keywords])];
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Email Categories</h3>
          <p className="text-sm text-gray-600 mt-1">
            Define categories to classify emails (e.g., fixture offers, operations, claims)
          </p>
        </div>
        <button
          onClick={addCategory}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No categories yet. Add one to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((category, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
            >
              {/* Category Header */}
              <div
                onClick={() => setExpandedId(expandedId === index ? null : index)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <div className="text-sm font-medium text-gray-900">
                      {category.displayName || <span className="text-gray-400 italic">Unnamed category</span>}
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Weight: {category.weight.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {category.keywords.length} keywords
                    </div>
                  </div>
                  {category.description && (
                    <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCategory(index);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Category Details (Expanded) */}
              {expandedId === index && (
                <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category Name (ID) *
                      </label>
                      <input
                        type="text"
                        value={category.name}
                        onChange={(e) => updateCategory(index, { name: e.target.value })}
                        placeholder="e.g., fixture, operations, claims"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Lowercase, no spaces (used in code)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Name *
                      </label>
                      <input
                        type="text"
                        value={category.displayName}
                        onChange={(e) => updateCategory(index, { displayName: e.target.value })}
                        placeholder="e.g., Fixture Offers"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={category.description}
                      onChange={(e) => updateCategory(index, { description: e.target.value })}
                      placeholder="What emails belong to this category?"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scoring Weight
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={category.weight}
                      onChange={(e) =>
                        updateCategory(index, { weight: parseFloat(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Higher weight = more likely to match. Normal: 1.0, Important: 1.2-1.5
                    </p>
                  </div>

                  {/* Keywords Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Keywords (case-insensitive)
                    </label>

                    {/* Keyword Pills */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {category.keywords.map((keyword, keywordIndex) => (
                        <div
                          key={keywordIndex}
                          className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                        >
                          <span>{keyword}</span>
                          <button
                            onClick={() => removeKeyword(index, keywordIndex)}
                            className="hover:text-blue-900"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {category.keywords.length === 0 && (
                        <span className="text-sm text-gray-400 italic">No keywords yet</span>
                      )}
                    </div>

                    {/* Add Single Keyword */}
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={keywordInput[index] || ''}
                        onChange={(e) =>
                          setKeywordInput({ ...keywordInput, [index]: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addKeyword(index);
                          }
                        }}
                        placeholder="Add keyword (e.g., fixture, offer, stem)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <button
                        onClick={() => addKeyword(index)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Add
                      </button>
                    </div>

                    {/* Bulk Add Keywords */}
                    <details className="mt-3">
                      <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                        Bulk add keywords (comma or newline separated)
                      </summary>
                      <div className="mt-2">
                        <textarea
                          placeholder="fixture, offer, stem, position list&#10;tonnage, subjects, recap"
                          rows={4}
                          onBlur={(e) => {
                            if (e.target.value.trim()) {
                              bulkAddKeywords(index, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </details>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
