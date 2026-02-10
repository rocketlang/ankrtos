import React, { useState, useEffect } from 'react';
import AIAssistant from '../components/AIAssistant';

export default function TelecallerDashboard({ user, apiBase }) {
  const [leads, setLeads] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [user]);

  async function loadData() {
    try {
      // Load my leads
      const leadsRes = await fetch(`${apiBase}/api/leads?assigned_to=${user?.id}`);
      const leadsData = await leadsRes.json();
      setLeads(leadsData);

      // Load my performance
      const perfRes = await fetch(`${apiBase}/api/performance/${user?.id}?period=today`);
      const perfData = await perfRes.json();
      setPerformance(perfData);

      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setLoading(false);
    }
  }

  async function startCall(lead) {
    try {
      const res = await fetch(`${apiBase}/api/calls/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          telecaller_id: user.id,
          campaign_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
        })
      });

      const call = await res.json();

      // Simulate call progress
      setTimeout(async () => {
        await fetch(`${apiBase}/api/calls/${call.id}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in_progress' })
        });
        setActiveCall({ ...call, lead, status: 'in_progress' });
      }, 2000);

    } catch (err) {
      console.error('Error starting call:', err);
    }
  }

  async function endCall(outcome) {
    if (!activeCall) return;

    try {
      await fetch(`${apiBase}/api/calls/${activeCall.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          outcome,
          duration_seconds: 240
        })
      });

      setActiveCall(null);
      loadData();
    } catch (err) {
      console.error('Error ending call:', err);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <div className="loading" style={{ width: 40, height: 40 }}></div>
        <p style={{ marginTop: 20 }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">My Dashboard</h1>
        <p className="page-subtitle">
          Welcome back, {user?.name}! Let's make today count 🎯
        </p>
      </div>

      {/* Today's Performance */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Calls Today</div>
          <div className="stat-value">{performance?.total_calls || 0}</div>
          <div className="stat-trend positive">
            {performance?.completed_calls || 0} completed
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Conversions</div>
          <div className="stat-value">{performance?.conversions || 0}</div>
          <div className="stat-trend positive">
            {performance?.interested || 0} interested
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Avg Call Time</div>
          <div className="stat-value">
            {performance?.avg_duration ? Math.floor(performance.avg_duration / 60) : 0}m
          </div>
          <div className="stat-trend">
            {performance?.total_talk_time ? Math.floor(performance.total_talk_time / 60) : 0}m total
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Quality Score</div>
          <div className="stat-value">
            {performance?.avg_quality ? performance.avg_quality.toFixed(1) : 'N/A'}
          </div>
          <div className="stat-trend positive">
            Sentiment: {performance?.avg_sentiment ? (performance.avg_sentiment * 100).toFixed(0) : 'N/A'}%
          </div>
        </div>
      </div>

      {/* Active Call */}
      {activeCall && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: '1.5em', fontWeight: 700 }}>
                📞 Call in Progress
              </div>
              <div style={{ opacity: 0.9, marginTop: 8 }}>
                {activeCall.lead?.name} • {activeCall.lead?.company}
              </div>
            </div>
            <div className="pulse" style={{
              background: '#10b981',
              width: 60,
              height: 60,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5em'
            }}>
              📞
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className="btn btn-success"
              onClick={() => endCall('converted')}
            >
              ✅ Converted
            </button>
            <button
              className="btn"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
              onClick={() => endCall('interested')}
            >
              👍 Interested
            </button>
            <button
              className="btn"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
              onClick={() => endCall('callback')}
            >
              📅 Callback
            </button>
            <button
              className="btn"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
              onClick={() => endCall('not_interested')}
            >
              ❌ Not Interested
            </button>
          </div>
        </div>
      )}

      {/* My Leads */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">My Leads ({leads.length})</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <select style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'white',
              cursor: 'pointer'
            }}>
              <option>All Statuses</option>
              <option>New</option>
              <option>Contacted</option>
              <option>Interested</option>
            </select>

            <button className="btn btn-primary btn-sm">
              + Add Lead
            </button>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Score</th>
              <th>Last Call</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{lead.name}</div>
                  <div style={{ fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                    {lead.designation || 'N/A'}
                  </div>
                </td>
                <td>{lead.company}</td>
                <td>{lead.phone}</td>
                <td>
                  <span className={`badge ${
                    lead.status === 'converted' ? 'badge-success' :
                    lead.status === 'interested' ? 'badge-info' :
                    lead.status === 'contacted' ? 'badge-warning' :
                    'badge-neutral'
                  }`}>
                    {lead.status}
                  </span>
                </td>
                <td>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: lead.lead_score > 80 ? '#10b981' :
                                lead.lead_score > 60 ? '#f59e0b' : '#6b7280',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}>
                    {lead.lead_score}
                  </div>
                </td>
                <td>
                  {lead.last_call_at ?
                    new Date(lead.last_call_at).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) :
                    'Never'
                  }
                </td>
                <td>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => startCall(lead)}
                    disabled={!!activeCall}
                  >
                    {activeCall ? '⏸️' : '📞'} Call
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {leads.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3em', marginBottom: '16px' }}>📝</div>
            <div>No leads assigned yet</div>
            <div style={{ fontSize: '0.9em', marginTop: '8px' }}>
              Contact your manager to get assigned leads
            </div>
          </div>
        )}
      </div>

      {/* AI Assistant */}
      {activeCall && <AIAssistant call={activeCall} apiBase={apiBase} />}
    </>
  );
}
