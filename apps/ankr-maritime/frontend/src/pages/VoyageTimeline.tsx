import { useQuery, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { useParams } from 'react-router-dom';

const VOYAGE_TIMELINE = gql`
  query VoyageTimeline($id: String!) {
    voyage(id: $id) {
      id voyageNumber status
      loadPort { name }
      dischargePort { name }
      etd eta
      milestones { id type description achievedAt dueDate status notes }
      portCalls { id sequence portName purpose arrivalDate departureDate status }
      delayAlerts { id type severity description delayHours resolvedAt createdAt }
      noonReports { id reportDate latitude longitude speed course weather }
    }
  }
`;

interface Milestone {
  id: string;
  type: string;
  description: string;
  achievedAt: string | null;
  dueDate: string | null;
  status: string;
  notes: string | null;
}

interface PortCall {
  id: string;
  sequence: number;
  portName: string;
  purpose: string;
  arrivalDate: string | null;
  departureDate: string | null;
  status: string;
}

interface DelayAlert {
  id: string;
  type: string;
  severity: string;
  description: string;
  delayHours: number;
  resolvedAt: string | null;
  createdAt: string;
}

interface NoonReport {
  id: string;
  reportDate: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  weather: string;
}

type TimelineEvent = {
  date: string;
  sortDate: number;
  category: 'milestone' | 'portcall' | 'delay' | 'noon';
  title: string;
  description: string;
  details?: string;
  severity?: string;
  status?: string;
};

const categoryDot: Record<string, string> = {
  milestone: 'bg-blue-500',
  portcall: 'bg-green-500',
  delay: 'bg-red-500',
  noon: 'bg-maritime-500',
};

const categoryBadge: Record<string, string> = {
  milestone: 'bg-blue-500/20 text-blue-400',
  portcall: 'bg-green-500/20 text-green-400',
  delay: 'bg-red-500/20 text-red-400',
  noon: 'bg-maritime-700 text-maritime-300',
};

const categoryLabel: Record<string, string> = {
  milestone: 'Milestone',
  portcall: 'Port Call',
  delay: 'Delay Alert',
  noon: 'Noon Report',
};

const severityBadge: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400',
  warning: 'bg-amber-500/20 text-amber-400',
  info: 'bg-blue-500/20 text-blue-400',
};

const statusColors: Record<string, string> = {
  planned: 'bg-blue-900/50 text-blue-400',
  in_progress: 'bg-yellow-900/50 text-yellow-400',
  completed: 'bg-green-900/50 text-green-400',
  cancelled: 'bg-red-900/50 text-red-400',
  pending: 'bg-maritime-700 text-maritime-300',
  achieved: 'bg-green-900/50 text-green-400',
  overdue: 'bg-red-900/50 text-red-400',
};

const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString() : '-';
const fmtShort = (d: string | null) => d ? new Date(d).toLocaleDateString() : '-';

function buildTimeline(voyage: Record<string, unknown>): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  const milestones = (voyage.milestones ?? []) as Milestone[];
  for (const m of milestones) {
    const date = m.achievedAt ?? m.dueDate ?? '';
    events.push({
      date,
      sortDate: date ? new Date(date).getTime() : 0,
      category: 'milestone',
      title: m.type.replace(/_/g, ' '),
      description: m.description || m.type.replace(/_/g, ' '),
      details: m.notes ?? undefined,
      status: m.status,
    });
  }

  const portCalls = (voyage.portCalls ?? []) as PortCall[];
  for (const pc of portCalls) {
    const date = pc.arrivalDate ?? pc.departureDate ?? '';
    const depInfo = pc.departureDate ? ` | Departed: ${fmtDate(pc.departureDate)}` : '';
    events.push({
      date,
      sortDate: date ? new Date(date).getTime() : 0,
      category: 'portcall',
      title: `${pc.portName} - ${pc.purpose.replace(/_/g, ' ')}`,
      description: `Seq #${pc.sequence} | Arrival: ${fmtDate(pc.arrivalDate)}${depInfo}`,
      status: pc.status,
    });
  }

  const delays = (voyage.delayAlerts ?? []) as DelayAlert[];
  for (const d of delays) {
    events.push({
      date: d.createdAt,
      sortDate: d.createdAt ? new Date(d.createdAt).getTime() : 0,
      category: 'delay',
      title: `${d.type.replace(/_/g, ' ')} - ${d.delayHours}h delay`,
      description: d.description,
      severity: d.severity,
      details: d.resolvedAt ? `Resolved: ${fmtDate(d.resolvedAt)}` : 'Unresolved',
    });
  }

  const noons = (voyage.noonReports ?? []) as NoonReport[];
  for (const n of noons) {
    events.push({
      date: n.reportDate,
      sortDate: n.reportDate ? new Date(n.reportDate).getTime() : 0,
      category: 'noon',
      title: `Noon Report`,
      description: `Pos: ${n.latitude.toFixed(2)}, ${n.longitude.toFixed(2)} | Speed: ${n.speed} kn | Course: ${n.course}`,
      details: n.weather ? `Weather: ${n.weather}` : undefined,
    });
  }

  events.sort((a, b) => a.sortDate - b.sortDate);
  return events;
}

export function VoyageTimeline() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery(VOYAGE_TIMELINE, {
    variables: { id: id ?? '' },
    skip: !id,
  });

  const [filter, setFilter] = useState<string>('all');

  const voyage = data?.voyage;
  const events = voyage ? buildTimeline(voyage) : [];
  const filtered = filter === 'all' ? events : events.filter((e) => e.category === filter);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Voyage Timeline</h1>
          <p className="text-maritime-400 text-sm mt-1">
            Chronological view of all voyage events
          </p>
        </div>
        <a
          href="/voyages"
          className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 text-sm px-3 py-2 rounded-md"
        >
          Back to Voyages
        </a>
      </div>

      {loading && <p className="text-maritime-400">Loading timeline...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {!loading && !voyage && !error && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
          <h3 className="text-white font-medium mt-4">Voyage Not Found</h3>
          <p className="text-maritime-400 text-sm mt-2">
            No voyage found with ID: {id}
          </p>
        </div>
      )}

      {voyage && (
        <>
          {/* Voyage Info Header */}
          <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-maritime-400 text-xs">Voyage</p>
                  <p className="text-white font-bold text-lg font-mono">
                    {voyage.voyageNumber}
                  </p>
                </div>
                <div>
                  <p className="text-maritime-400 text-xs">Route</p>
                  <p className="text-white text-sm">
                    {voyage.loadPort?.name ?? 'TBD'} → {voyage.dischargePort?.name ?? 'TBD'}
                  </p>
                </div>
                <div>
                  <p className="text-maritime-400 text-xs">ETD</p>
                  <p className="text-white text-sm font-mono">{fmtShort(voyage.etd)}</p>
                </div>
                <div>
                  <p className="text-maritime-400 text-xs">ETA</p>
                  <p className="text-white text-sm font-mono">{fmtShort(voyage.eta)}</p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[voyage.status] ?? 'bg-maritime-700 text-maritime-300'}`}
              >
                {(voyage.status as string).replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-maritime-400 text-xs mr-2">Filter:</span>
            {['all', 'milestone', 'portcall', 'delay', 'noon'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-maritime-800 text-maritime-400 hover:bg-maritime-700'
                }`}
              >
                {f === 'all' ? 'All Events' : categoryLabel[f] ?? f}
              </button>
            ))}
            <span className="text-maritime-500 text-xs ml-4">
              {filtered.length} event{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Timeline */}
          {filtered.length === 0 && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
              <h3 className="text-white font-medium">No Events</h3>
              <p className="text-maritime-400 text-sm mt-2">
                No timeline events found for this voyage.
              </p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-maritime-700" />

              <div className="space-y-4">
                {filtered.map((event, idx) => (
                  <div key={idx} className="relative pl-12">
                    {/* Dot */}
                    <div
                      className={`absolute left-2.5 top-4 w-3 h-3 rounded-full border-2 border-maritime-900 ${
                        event.category === 'delay'
                          ? event.severity === 'critical'
                            ? 'bg-red-500'
                            : event.severity === 'warning'
                              ? 'bg-amber-500'
                              : categoryDot[event.category]
                          : categoryDot[event.category]
                      }`}
                    />

                    {/* Event Card */}
                    <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${categoryBadge[event.category]}`}
                            >
                              {categoryLabel[event.category]}
                            </span>
                            {event.severity && (
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${severityBadge[event.severity] ?? 'bg-maritime-700 text-maritime-300'}`}
                              >
                                {event.severity}
                              </span>
                            )}
                            {event.status && (
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${statusColors[event.status] ?? 'bg-maritime-700 text-maritime-300'}`}
                              >
                                {event.status.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                          <h4 className="text-white text-sm font-medium capitalize">
                            {event.title}
                          </h4>
                          <p className="text-maritime-400 text-xs mt-1">
                            {event.description}
                          </p>
                          {event.details && (
                            <p className="text-maritime-500 text-xs mt-1 italic">
                              {event.details}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          <p className="text-maritime-400 text-xs font-mono">
                            {fmtDate(event.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
