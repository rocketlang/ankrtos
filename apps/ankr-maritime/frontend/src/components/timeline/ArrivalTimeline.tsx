/**
 * Arrival Timeline Component
 *
 * Comprehensive timeline visualization for vessel arrivals with:
 * - Vertical timeline with event markers
 * - Color-coded by impact (CRITICAL=red, IMPORTANT=orange, INFO=blue)
 * - Icon per event type
 * - Expandable event details
 * - Related event highlighting
 * - Actor badges
 * - Real-time updates
 */

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  Ship, Anchor, Clock, FileText, AlertCircle, CheckCircle,
  TrendingUp, MapPin, Bell, Upload, Send, MessageCircle,
  DollarSign, Settings, Flag, XCircle, Info
} from 'lucide-react';

const ARRIVAL_TIMELINE_QUERY = gql`
  query ArrivalTimeline($arrivalId: String!, $filters: TimelineFiltersInput) {
    arrivalTimeline(arrivalId: $arrivalId, filters: $filters) {
      id
      timestamp
      eventType
      actor
      action
      impact
      metadata
      relatedEvents
      attachments
      hasAttachments
      relatedEventCount
      timeAgo
      createdAt
    }
    arrivalTimelineStats(arrivalId: $arrivalId) {
      totalEvents
      criticalCount
      importantCount
      infoCount
      byEventType
      byActor
    }
  }
`;

interface ArrivalTimelineProps {
  arrivalId: string;
}

export function ArrivalTimeline({ arrivalId }: ArrivalTimelineProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filters, setFilters] = useState({});

  const { data, loading, error } = useQuery(ARRIVAL_TIMELINE_QUERY, {
    variables: { arrivalId, filters },
    pollInterval: 30000 // Poll every 30 seconds for updates
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 p-4 border border-red-200 rounded bg-red-50">
        <AlertCircle className="h-5 w-5" />
        <span>Failed to load timeline: {error.message}</span>
      </div>
    );
  }

  const events = data?.arrivalTimeline || [];
  const stats = data?.arrivalTimelineStats;

  if (events.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No Timeline Events</h3>
        <p className="text-sm text-gray-500">
          Timeline events will appear here as the arrival progresses
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.totalEvents}</div>
            <div className="text-xs text-gray-500">Total Events</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{stats.criticalCount}</div>
            <div className="text-xs text-red-700">Critical</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.importantCount}</div>
            <div className="text-xs text-orange-700">Important</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.infoCount}</div>
            <div className="text-xs text-blue-700">Info</div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {/* Events */}
        <div className="space-y-4">
          {events.map((event: any, index: number) => (
            <EventCard
              key={event.id}
              event={event}
              isSelected={selectedEventId === event.id}
              onSelect={() => setSelectedEventId(event.id === selectedEventId ? null : event.id)}
              isLatest={index === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Event Card Component
interface EventCardProps {
  event: any;
  isSelected: boolean;
  onSelect: () => void;
  isLatest: boolean;
}

function EventCard({ event, isSelected, onSelect, isLatest }: EventCardProps) {
  const impactColors = {
    CRITICAL: 'bg-red-100 border-red-300 text-red-800',
    IMPORTANT: 'bg-orange-100 border-orange-300 text-orange-800',
    INFO: 'bg-blue-100 border-blue-300 text-blue-800'
  };

  const iconColor = {
    CRITICAL: 'text-red-600 bg-red-100',
    IMPORTANT: 'text-orange-600 bg-orange-100',
    INFO: 'text-blue-600 bg-blue-100'
  };

  const EventIcon = getEventIcon(event.eventType);

  return (
    <div className="relative pl-16">
      {/* Timeline marker */}
      <div className={`absolute left-6 w-5 h-5 rounded-full border-2 ${
        isLatest ? 'border-blue-600 bg-blue-600 animate-pulse' : 'border-gray-300 bg-white'
      }`}></div>

      {/* Event card */}
      <div
        onClick={onSelect}
        className={`border rounded-lg p-4 cursor-pointer transition-all ${
          isSelected ? 'border-blue-400 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${iconColor[event.impact as keyof typeof iconColor]}`}>
              <EventIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium text-gray-900">{event.action}</div>
              <div className="text-xs text-gray-500 mt-0.5">{event.timeAgo}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Impact badge */}
            <span className={`px-2 py-1 rounded text-xs font-medium border ${impactColors[event.impact as keyof typeof impactColors]}`}>
              {event.impact}
            </span>

            {/* Actor badge */}
            <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
              {event.actor}
            </span>
          </div>
        </div>

        {/* Expanded details */}
        {isSelected && (
          <div className="mt-4 pt-4 border-t space-y-3">
            {/* Metadata */}
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-700 mb-2">Details:</div>
                <div className="text-xs bg-gray-50 rounded p-3 space-y-1">
                  {Object.entries(event.metadata).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600">{formatKey(key)}:</span>
                      <span className="text-gray-900 font-medium">{formatValue(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related events */}
            {event.relatedEventCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Info className="h-3.5 w-3.5" />
                <span>{event.relatedEventCount} related event{event.relatedEventCount !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Attachments */}
            {event.hasAttachments && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <FileText className="h-3.5 w-3.5" />
                <span>Has attachments</span>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-gray-500">
              {new Date(event.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getEventIcon(eventType: string) {
  const iconMap: Record<string, any> = {
    ARRIVAL_DETECTED: Ship,
    ETA_CALCULATED: Clock,
    ETA_UPDATED: Clock,
    INTELLIGENCE_GENERATED: TrendingUp,
    CONGESTION_DETECTED: AlertCircle,
    ALERT_TRIGGERED: Bell,
    DOCUMENT_REQUIRED: FileText,
    DOCUMENT_SUBMITTED: Upload,
    DOCUMENT_APPROVED: CheckCircle,
    DOCUMENT_REJECTED: XCircle,
    DOCUMENT_OVERDUE: AlertCircle,
    DOCUMENT_UPLOADED: Upload,
    PDA_GENERATED: DollarSign,
    MASTER_ALERTED: Send,
    SERVICE_BOOKED: Settings,
    FDA_SUBMITTED: DollarSign,
    ALERT_ACKNOWLEDGED: MessageCircle,
    STATUS_UPDATED: Info,
    DELAY_REPORTED: AlertCircle,
    DISTANCE_UPDATED: MapPin,
    ANCHORAGE_REACHED: Anchor,
    BERTH_ASSIGNED: Anchor,
    BERTHING_COMPLETE: CheckCircle,
    DEPARTURE: Flag
  };

  return iconMap[eventType] || Info;
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
}
