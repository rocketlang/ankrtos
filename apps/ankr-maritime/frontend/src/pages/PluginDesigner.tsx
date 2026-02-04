/**
 * Plugin Designer Page
 * Visual no-code interface for creating email intelligence plugins
 */

import React, { useState } from 'react';
import { Wand2, FileCode, TestTube, Eye, Layers, Tag, Inbox } from 'lucide-react';
import { gql, useMutation } from '@apollo/client';
import { EntityDesigner } from '../components/plugin-designer/EntityDesigner';
import { CategoryDesigner } from '../components/plugin-designer/CategoryDesigner';
import { BucketDesigner } from '../components/plugin-designer/BucketDesigner';
import { EmailTester } from '../components/plugin-designer/EmailTester';
import { PluginPreview } from '../components/plugin-designer/PluginPreview';

const SAVE_PLUGIN = gql`
  mutation SavePlugin(
    $industry: String!
    $displayName: String!
    $version: String!
    $description: String
    $author: String
    $entityExtractors: [EntityExtractorInput!]
    $categories: [CategoryConfigInput!]
    $buckets: [BucketConfigInput!]
  ) {
    savePlugin(
      industry: $industry
      displayName: $displayName
      version: $version
      description: $description
      author: $author
      entityExtractors: $entityExtractors
      categories: $categories
      buckets: $buckets
    ) {
      industry
      displayName
      version
    }
  }
`;

type Tab = 'info' | 'entities' | 'categories' | 'buckets' | 'test' | 'preview';

interface PluginData {
  industry: string;
  displayName: string;
  version: string;
  description: string;
  author: string;
  entityExtractors: any[];
  categories: any[];
  buckets: any[];
}

export default function PluginDesigner() {
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [pluginData, setPluginData] = useState<PluginData>({
    industry: '',
    displayName: '',
    version: '1.0.0',
    description: '',
    author: '',
    entityExtractors: [],
    categories: [],
    buckets: [],
  });

  const [savePlugin, { loading: saving, error: saveError }] = useMutation(SAVE_PLUGIN);

  const tabs = [
    { id: 'info' as Tab, label: 'Basic Info', icon: FileCode },
    { id: 'entities' as Tab, label: 'Entities', icon: Layers, count: pluginData.entityExtractors.length },
    { id: 'categories' as Tab, label: 'Categories', icon: Tag, count: pluginData.categories.length },
    { id: 'buckets' as Tab, label: 'Buckets', icon: Inbox, count: pluginData.buckets.length },
    { id: 'test' as Tab, label: 'Test', icon: TestTube },
    { id: 'preview' as Tab, label: 'Preview & Export', icon: Eye },
  ];

  const handleSave = async () => {
    if (!pluginData.industry || !pluginData.displayName) {
      alert('Please fill in industry identifier and display name');
      return;
    }

    try {
      await savePlugin({
        variables: {
          ...pluginData,
        },
      });
      alert('Plugin saved successfully!');
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save plugin. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Email Intelligence Plugin Designer</h1>
                <p className="text-sm text-gray-600">Create custom email parsers without code</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pluginData.industry && (
                <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
                  {pluginData.industry}
                </div>
              )}
              {pluginData.version && (
                <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
                  v{pluginData.version}
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap
                    ${
                      isActive
                        ? 'border-blue-600 text-blue-600 font-medium'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Basic Info Tab */}
        {activeTab === 'info' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Plugin Information</h2>
              <p className="text-sm text-gray-600">
                Basic details about your email intelligence plugin
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry Identifier *
                </label>
                <input
                  type="text"
                  value={pluginData.industry}
                  onChange={(e) =>
                    setPluginData({ ...pluginData, industry: e.target.value.toLowerCase().replace(/\s+/g, '_') })
                  }
                  placeholder="e.g., maritime, logistics, real_estate"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Lowercase, underscores allowed (used in code)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={pluginData.displayName}
                  onChange={(e) => setPluginData({ ...pluginData, displayName: e.target.value })}
                  placeholder="e.g., Maritime & Shipping"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Human-readable name shown to users</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Version
                </label>
                <input
                  type="text"
                  value={pluginData.version}
                  onChange={(e) => setPluginData({ ...pluginData, version: e.target.value })}
                  placeholder="1.0.0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Semantic versioning (e.g., 1.0.0)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author
                </label>
                <input
                  type="text"
                  value={pluginData.author}
                  onChange={(e) => setPluginData({ ...pluginData, author: e.target.value })}
                  placeholder="Your name or company"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={pluginData.description}
                onChange={(e) => setPluginData({ ...pluginData, description: e.target.value })}
                placeholder="Describe what this plugin does and what industry it's for..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setActiveTab('entities')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next: Add Entity Extractors →
              </button>
            </div>
          </div>
        )}

        {/* Entities Tab */}
        {activeTab === 'entities' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <EntityDesigner
              extractors={pluginData.entityExtractors}
              onChange={(extractors) =>
                setPluginData({ ...pluginData, entityExtractors: extractors })
              }
            />
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setActiveTab('categories')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next: Add Categories →
              </button>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <CategoryDesigner
              categories={pluginData.categories}
              onChange={(categories) => setPluginData({ ...pluginData, categories })}
            />
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setActiveTab('buckets')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next: Add Buckets →
              </button>
            </div>
          </div>
        )}

        {/* Buckets Tab */}
        {activeTab === 'buckets' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <BucketDesigner
              buckets={pluginData.buckets}
              onChange={(buckets) => setPluginData({ ...pluginData, buckets })}
            />
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setActiveTab('test')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next: Test Plugin →
              </button>
            </div>
          </div>
        )}

        {/* Test Tab */}
        {activeTab === 'test' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <EmailTester industry={pluginData.industry} />
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setActiveTab('preview')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next: Preview & Export →
              </button>
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <PluginPreview
              plugin={pluginData}
              onSave={handleSave}
              saving={saving}
            />
            {saveError && (
              <div className="mt-4 text-red-700 bg-red-50 p-3 rounded-lg text-sm">
                Save failed: {saveError.message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
