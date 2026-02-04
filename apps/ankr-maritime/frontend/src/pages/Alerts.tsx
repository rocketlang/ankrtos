import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;

const ALERTS_QUERY = gql`
  query Alerts {
    alertPreferences { id eventType emailEnabled whatsappEnabled pushEnabled phone }
    alertLogs(limit: 30) { id eventType channel recipient subject message status createdAt }
    alertStats { totalSent emailSent whatsappSent pushSent failedCount }
  }
`;

const UPSERT_PREF = gql`
  mutation UpsertPref($eventType: String!, $emailEnabled: Boolean!, $whatsappEnabled: Boolean!, $pushEnabled: Boolean!, $phone: String) {
    upsertAlertPreference(eventType: $eventType, emailEnabled: $emailEnabled, whatsappEnabled: $whatsappEnabled, pushEnabled: $pushEnabled, phone: $phone) { id }
  }
`;

const SEND_TEST = gql`
  mutation SendTest($channel: String!, $message: String!) {
    sendTestAlert(channel: $channel, message: $message) { id }
  }
`;

const eventTypes = [
  { key: 'charter_status', label: 'Charter Status Change' },
  { key: 'voyage_departure', label: 'Voyage Departure' },
  { key: 'voyage_arrival', label: 'Voyage Arrival' },
  { key: 'da_submitted', label: 'DA Submitted' },
  { key: 'laytime_alert', label: 'Laytime Alert' },
  { key: 'claim_update', label: 'Claim Update' },
  { key: 'cert_expiry', label: 'Certificate Expiry' },
  { key: 'bunker_delivery', label: 'Bunker Delivery' },
];

const channelColors: Record<string, string> = {
  email: 'bg-blue-900/50 text-blue-400',
  whatsapp: 'bg-green-900/50 text-green-400',
  push: 'bg-purple-900/50 text-purple-400',
  in_app: 'bg-maritime-700 text-maritime-300',
};

export function Alerts() {
  const { data, loading, refetch } = useQuery(ALERTS_QUERY);
  const [upsertPref] = useMutation(UPSERT_PREF);
  const [sendTest] = useMutation(SEND_TEST);
  const [testMsg, setTestMsg] = useState('');

  const prefs = data?.alertPreferences ?? [];
  const logs = data?.alertLogs ?? [];
  const stats = data?.alertStats;

  const getPref = (eventType: string) => prefs.find((p: Record<string, unknown>) => p.eventType === eventType);

  const togglePref = async (eventType: string, channel: 'emailEnabled' | 'whatsappEnabled' | 'pushEnabled') => {
    const existing = getPref(eventType);
    const vars = {
      eventType,
      emailEnabled: existing?.emailEnabled ?? true,
      whatsappEnabled: existing?.whatsappEnabled ?? false,
      pushEnabled: existing?.pushEnabled ?? true,
    };
    vars[channel] = !vars[channel];
    await upsertPref({ variables: vars });
    refetch();
  };

  const handleTestAlert = async (channel: string) => {
    const msg = testMsg || `Test ${channel} alert from Mari8x Maritime Platform`;
    await sendTest({ variables: { channel, message: msg } });
    setTestMsg('');
    refetch();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Alert Notifications</h1>
        <p className="text-maritime-400 text-sm mt-1">Email, WhatsApp, and push notification preferences</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Sent', value: stats.totalSent, color: 'text-white', border: 'border-maritime-500' },
            { label: 'Email', value: stats.emailSent, color: 'text-blue-400', border: 'border-blue-500' },
            { label: 'WhatsApp', value: stats.whatsappSent, color: 'text-green-400', border: 'border-green-500' },
            { label: 'Push', value: stats.pushSent, color: 'text-purple-400', border: 'border-purple-500' },
            { label: 'Failed', value: stats.failedCount, color: stats.failedCount > 0 ? 'text-red-400' : 'text-maritime-400', border: stats.failedCount > 0 ? 'border-red-500' : 'border-maritime-500' },
          ].map((s) => (
            <div key={s.label} className={`bg-maritime-800 border-l-4 ${s.border} rounded-lg p-4`}>
              <p className="text-maritime-500 text-xs">{s.label}</p>
              <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Preferences Grid */}
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
        <h2 className="text-white text-sm font-medium mb-3">Notification Preferences</h2>
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2 text-maritime-500 text-xs pb-2 border-b border-maritime-700">
            <span>Event</span><span className="text-center">Email</span><span className="text-center">WhatsApp</span><span className="text-center">Push</span>
          </div>
          {eventTypes.map((evt) => {
            const p = getPref(evt.key);
            return (
              <div key={evt.key} className="grid grid-cols-4 gap-2 items-center py-1.5">
                <span className="text-maritime-300 text-xs">{evt.label}</span>
                {(['emailEnabled', 'whatsappEnabled', 'pushEnabled'] as const).map((ch) => (
                  <div key={ch} className="flex justify-center">
                    <button onClick={() => togglePref(evt.key, ch)}
                      className={`w-8 h-4 rounded-full transition-colors ${p?.[ch] ? 'bg-blue-600' : 'bg-maritime-700'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform mx-0.5 ${p?.[ch] ? 'translate-x-4' : ''}`} />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Test Alert */}
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
        <h2 className="text-white text-sm font-medium mb-3">Send Test Alert</h2>
        <div className="flex gap-3">
          <input value={testMsg} onChange={(e) => setTestMsg(e.target.value)} placeholder="Custom message (optional)"
            className="flex-1 bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5" />
          <button onClick={() => handleTestAlert('email')} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded">Email</button>
          <button onClick={() => handleTestAlert('whatsapp')} className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded">WhatsApp</button>
          <button onClick={() => handleTestAlert('push')} className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 py-1.5 rounded">Push</button>
        </div>
      </div>

      {/* Alert Log */}
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-maritime-700">
          <h2 className="text-white text-sm font-medium">Recent Alerts</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-maritime-400 text-xs border-b border-maritime-700">
              <th className="text-left px-4 py-2">Event</th>
              <th className="text-left px-4 py-2">Channel</th>
              <th className="text-left px-4 py-2">Recipient</th>
              <th className="text-left px-4 py-2">Message</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-8 text-maritime-500">Loading...</td></tr>}
            {!loading && logs.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-maritime-500">No alerts sent yet</td></tr>}
            {logs.map((l: Record<string, unknown>) => (
              <tr key={l.id as string} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                <td className="px-4 py-2 text-maritime-300 text-xs capitalize">{(l.eventType as string).replace(/_/g, ' ')}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${channelColors[l.channel as string] ?? ''}`}>
                    {l.channel as string}
                  </span>
                </td>
                <td className="px-4 py-2 text-maritime-400 text-xs font-mono">{l.recipient as string}</td>
                <td className="px-4 py-2 text-maritime-300 text-xs truncate max-w-60">{l.message as string}</td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] ${l.status === 'sent' ? 'text-green-400' : 'text-red-400'}`}>{l.status as string}</span>
                </td>
                <td className="px-4 py-2 text-maritime-500 text-[10px]">{new Date(l.createdAt as string).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
