/**
 * Plugin Preview Component
 * JSON preview and export functionality
 */

import React, { useState } from 'react';
import { Download, Share2, Save, CheckCircle, Copy } from 'lucide-react';

interface PluginPreviewProps {
  plugin: any;
  onSave?: () => void;
  saving?: boolean;
}

export const PluginPreview: React.FC<PluginPreviewProps> = ({ plugin, onSave, saving }) => {
  const [copied, setCopied] = useState(false);

  const pluginJSON = JSON.stringify(plugin, null, 2);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pluginJSON);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJSON = () => {
    const blob = new Blob([pluginJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plugin.industry || 'plugin'}-email-parser.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sharePlugin = () => {
    // TODO: Implement sharing to marketplace
    alert('Marketplace sharing coming soon!');
  };

  const getStats = () => {
    const extractorsCount = plugin.entityExtractors?.length || 0;
    const categoriesCount = plugin.categories?.length || 0;
    const bucketsCount = plugin.buckets?.length || 0;
    const keywordsCount = plugin.categories?.reduce(
      (sum: number, cat: any) => sum + (cat.keywords?.length || 0),
      0
    ) || 0;

    return { extractorsCount, categoriesCount, bucketsCount, keywordsCount };
  };

  const stats = getStats();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Plugin Preview</h3>
        <p className="text-sm text-gray-600 mt-1">
          Review your plugin configuration and export or save
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-700">{stats.extractorsCount}</div>
          <div className="text-xs text-blue-600 mt-1">Entity Extractors</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="text-2xl font-bold text-purple-700">{stats.categoriesCount}</div>
          <div className="text-xs text-purple-600 mt-1">Categories</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-700">{stats.bucketsCount}</div>
          <div className="text-xs text-green-600 mt-1">Buckets</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="text-2xl font-bold text-orange-700">{stats.keywordsCount}</div>
          <div className="text-xs text-orange-600 mt-1">Keywords</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          {copied ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy JSON
            </>
          )}
        </button>

        <button
          onClick={downloadJSON}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download JSON
        </button>

        {onSave && (
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Plugin'}
          </button>
        )}

        <button
          onClick={sharePlugin}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Share to Marketplace
        </button>
      </div>

      {/* JSON Preview */}
      <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[600px]">
        <pre className="text-sm text-green-400 font-mono leading-relaxed">
          {pluginJSON}
        </pre>
      </div>

      {/* Validation Messages */}
      {!plugin.industry && (
        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg">
          <span className="text-sm">⚠️ Industry identifier is required</span>
        </div>
      )}
      {!plugin.displayName && (
        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg">
          <span className="text-sm">⚠️ Display name is required</span>
        </div>
      )}
      {stats.extractorsCount === 0 && (
        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg">
          <span className="text-sm">⚠️ At least one entity extractor is recommended</span>
        </div>
      )}
      {stats.categoriesCount === 0 && (
        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg">
          <span className="text-sm">⚠️ At least one category is recommended</span>
        </div>
      )}

      {/* Success Message */}
      {plugin.industry &&
        plugin.displayName &&
        stats.extractorsCount > 0 &&
        stats.categoriesCount > 0 && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Plugin is valid and ready to use!</span>
          </div>
        )}
    </div>
  );
};
