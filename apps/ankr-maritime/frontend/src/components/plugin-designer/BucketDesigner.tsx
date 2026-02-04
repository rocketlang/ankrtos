/**
 * Bucket Designer Component
 * Visual interface for designing email routing buckets
 */

import React, { useState } from 'react';
import { PlusCircle, Trash2, Inbox, AlertCircle } from 'lucide-react';

interface BucketCondition {
  field: string;
  operator: string;
  value: string;
}

interface BucketConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  conditions: BucketCondition[];
  assignTo: string;
  notificationChannels: string[];
}

interface BucketDesignerProps {
  buckets: BucketConfig[];
  onChange: (buckets: BucketConfig[]) => void;
}

const OPERATORS = [
  { value: 'equals', label: 'equals' },
  { value: 'contains', label: 'contains' },
  { value: 'matches', label: 'matches (regex)' },
  { value: 'gt', label: 'greater than' },
  { value: 'lt', label: 'less than' },
  { value: 'in', label: 'in list' },
  { value: 'not_in', label: 'not in list' },
];

const COMMON_FIELDS = [
  'category',
  'urgency',
  'actionable',
  'entities.vessel',
  'entities.port',
  'entities.cargo',
  'entities.imo',
  'urgencyScore',
  'confidence',
];

const NOTIFICATION_CHANNELS = ['email', 'sms', 'slack', 'teams', 'push'];

export const BucketDesigner: React.FC<BucketDesignerProps> = ({ buckets, onChange }) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const addBucket = () => {
    onChange([
      ...buckets,
      {
        id: '',
        name: '',
        displayName: '',
        description: '',
        conditions: [],
        assignTo: '',
        notificationChannels: ['email'],
      },
    ]);
    setExpandedId(buckets.length);
  };

  const updateBucket = (index: number, updates: Partial<BucketConfig>) => {
    const updated = [...buckets];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const deleteBucket = (index: number) => {
    onChange(buckets.filter((_, i) => i !== index));
  };

  const addCondition = (index: number) => {
    const updated = [...buckets];
    updated[index].conditions = [
      ...updated[index].conditions,
      { field: 'category', operator: 'equals', value: '' },
    ];
    onChange(updated);
  };

  const updateCondition = (
    bucketIndex: number,
    conditionIndex: number,
    updates: Partial<BucketCondition>
  ) => {
    const updated = [...buckets];
    updated[bucketIndex].conditions[conditionIndex] = {
      ...updated[bucketIndex].conditions[conditionIndex],
      ...updates,
    };
    onChange(updated);
  };

  const deleteCondition = (bucketIndex: number, conditionIndex: number) => {
    const updated = [...buckets];
    updated[bucketIndex].conditions = updated[bucketIndex].conditions.filter(
      (_, i) => i !== conditionIndex
    );
    onChange(updated);
  };

  const toggleNotificationChannel = (bucketIndex: number, channel: string) => {
    const updated = [...buckets];
    const channels = updated[bucketIndex].notificationChannels;
    if (channels.includes(channel)) {
      updated[bucketIndex].notificationChannels = channels.filter((c) => c !== channel);
    } else {
      updated[bucketIndex].notificationChannels = [...channels, channel];
    }
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Email Buckets</h3>
          <p className="text-sm text-gray-600 mt-1">
            Define routing rules to automatically organize emails into buckets
          </p>
        </div>
        <button
          onClick={addBucket}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Add Bucket
        </button>
      </div>

      {/* Buckets List */}
      {buckets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No buckets yet. Add one to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {buckets.map((bucket, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
            >
              {/* Bucket Header */}
              <div
                onClick={() => setExpandedId(expandedId === index ? null : index)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Inbox className="w-4 h-4 text-gray-400" />
                    <div className="text-sm font-medium text-gray-900">
                      {bucket.displayName || <span className="text-gray-400 italic">Unnamed bucket</span>}
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {bucket.conditions.length} conditions
                    </div>
                    {bucket.assignTo && (
                      <div className="text-xs text-gray-500 bg-green-100 text-green-700 px-2 py-1 rounded">
                        → {bucket.assignTo}
                      </div>
                    )}
                  </div>
                  {bucket.description && (
                    <p className="text-sm text-gray-600 mt-1">{bucket.description}</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBucket(index);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Bucket Details (Expanded) */}
              {expandedId === index && (
                <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bucket ID *
                      </label>
                      <input
                        type="text"
                        value={bucket.id}
                        onChange={(e) => updateBucket(index, { id: e.target.value })}
                        placeholder="e.g., urgent_fixtures"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Lowercase, underscores allowed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Name *
                      </label>
                      <input
                        type="text"
                        value={bucket.displayName}
                        onChange={(e) => updateBucket(index, { displayName: e.target.value })}
                        placeholder="e.g., Urgent Fixtures"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={bucket.description}
                      onChange={(e) => updateBucket(index, { description: e.target.value })}
                      placeholder="What emails go into this bucket?"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign To (Role)
                    </label>
                    <input
                      type="text"
                      value={bucket.assignTo}
                      onChange={(e) => updateBucket(index, { assignTo: e.target.value })}
                      placeholder="e.g., commercial_manager, ops_team"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Conditions */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Routing Conditions (AND logic)
                      </label>
                      <button
                        onClick={() => addCondition(index)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        + Add Condition
                      </button>
                    </div>

                    {bucket.conditions.length === 0 ? (
                      <div className="text-sm text-gray-400 italic py-2">
                        No conditions. This bucket will never match.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {bucket.conditions.map((condition, conditionIndex) => (
                          <div key={conditionIndex} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200">
                            {/* Field */}
                            <div className="flex-1">
                              <input
                                type="text"
                                list={`fields-${index}-${conditionIndex}`}
                                value={condition.field}
                                onChange={(e) =>
                                  updateCondition(index, conditionIndex, { field: e.target.value })
                                }
                                placeholder="Field"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <datalist id={`fields-${index}-${conditionIndex}`}>
                                {COMMON_FIELDS.map((field) => (
                                  <option key={field} value={field} />
                                ))}
                              </datalist>
                            </div>

                            {/* Operator */}
                            <select
                              value={condition.operator}
                              onChange={(e) =>
                                updateCondition(index, conditionIndex, { operator: e.target.value })
                              }
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {OPERATORS.map((op) => (
                                <option key={op.value} value={op.value}>
                                  {op.label}
                                </option>
                              ))}
                            </select>

                            {/* Value */}
                            <div className="flex-1">
                              <input
                                type="text"
                                value={condition.value}
                                onChange={(e) =>
                                  updateCondition(index, conditionIndex, { value: e.target.value })
                                }
                                placeholder="Value"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            {/* Delete */}
                            <button
                              onClick={() => deleteCondition(index, conditionIndex)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notification Channels */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification Channels
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {NOTIFICATION_CHANNELS.map((channel) => (
                        <label
                          key={channel}
                          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={bucket.notificationChannels.includes(channel)}
                            onChange={() => toggleNotificationChannel(index, channel)}
                            className="rounded"
                          />
                          <span className="text-sm capitalize">{channel}</span>
                        </label>
                      ))}
                    </div>
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
