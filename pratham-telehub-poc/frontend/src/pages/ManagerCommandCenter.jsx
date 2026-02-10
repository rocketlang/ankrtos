import React, { useState, useEffect } from 'react';

export default function ManagerCommandCenter({ apiBase }) {
  const [teamStatus, setTeamStatus] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [teamRes, analyticsRes] = await Promise.all([
        fetch(`${apiBase}/api/team/status`),
        fetch(`${apiBase}/api/analytics/realtime`)
      ]);

      const teamData = await teamRes.json();
      const analyticsData = await analyticsRes.json();

      setTeamStatus(teamData);
      setAnalytics(analyticsData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <div className="loading" style={{ width: 40, height: 40 }}></div>
        <p style={{ marginTop: 20 }}>Loading command center...</p>
      </div>
    );
  }

  const stats = teamStatus?.stats || {};
  const team = teamStatus?.team || [];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Command Center</h1>
        <p className="page-subtitle">
          Real-time team performance monitoring • Live updates every 5 seconds
        </p>
      </div>

      {/* Real-time Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Calls Today</div>
          <div className="stat-value">{analytics?.calls_today || 0}</div>
          <div className="stat-trend positive">
            {analytics?.active_calls || 0} active now
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Conversions</div>
          <div className="stat-value">{analytics?.conversions_today || 0}</div>
          <div className="stat-trend positive">
            {analytics?.interested_today || 0} interested
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Team Status</div>
          <div className="stat-value">
            {team.filter(t => t.status === 'on_call').length}/{team.length}
          </div>
          <div className="stat-trend">
            on calls
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Avg Call Time</div>
          <div className="stat-value">
            {analytics?.avg_duration ? Math.floor(analytics.avg_duration / 60) : 0}m
          </div>
          <div className="stat-trend positive">
            {analytics?.completed_today || 0} completed
          </div>
        </div>
      </div>

      {/* Sentiment Analysis */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Customer Sentiment Today</h2>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: '#10b981' }}>
                  😊 Positive
                </span>
                <span style={{ fontWeight: 600 }}>
                  {analytics?.sentiment?.positive_calls || 0}
                </span>
              </div>
              <div style={{
                height: 8,
                background: '#e5e7eb',
                borderRadius: 4,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${((analytics?.sentiment?.positive_calls || 0) / Math.max(analytics?.calls_today || 1, 1)) * 100}%`,
                  height: '100%',
                  background: '#10b981',
                  transition: 'width 0.5s'
                }}></div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: '#6b7280' }}>
                  😐 Neutral
                </span>
                <span style={{ fontWeight: 600 }}>
                  {analytics?.sentiment?.neutral_calls || 0}
                </span>
              </div>
              <div style={{
                height: 8,
                background: '#e5e7eb',
                borderRadius: 4,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${((analytics?.sentiment?.neutral_calls || 0) / Math.max(analytics?.calls_today || 1, 1)) * 100}%`,
                  height: '100%',
                  background: '#6b7280',
                  transition: 'width 0.5s'
                }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: '#ef4444' }}>
                  😞 Negative
                </span>
                <span style={{ fontWeight: 600 }}>
                  {analytics?.sentiment?.negative_calls || 0}
                </span>
              </div>
              <div style={{
                height: 8,
                background: '#e5e7eb',
                borderRadius: 4,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${((analytics?.sentiment?.negative_calls || 0) / Math.max(analytics?.calls_today || 1, 1)) * 100}%`,
                  height: '100%',
                  background: '#ef4444',
                  transition: 'width 0.5s'
                }}></div>
              </div>
            </div>
          </div>

          <div style={{
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `conic-gradient(
              #10b981 0deg ${((analytics?.sentiment?.positive_calls || 0) / Math.max(analytics?.calls_today || 1, 1)) * 360}deg,
              #6b7280 ${((analytics?.sentiment?.positive_calls || 0) / Math.max(analytics?.calls_today || 1, 1)) * 360}deg ${(((analytics?.sentiment?.positive_calls || 0) + (analytics?.sentiment?.neutral_calls || 0)) / Math.max(analytics?.calls_today || 1, 1)) * 360}deg,
              #ef4444 ${(((analytics?.sentiment?.positive_calls || 0) + (analytics?.sentiment?.neutral_calls || 0)) / Math.max(analytics?.calls_today || 1, 1)) * 360}deg
            )`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3em'
          }}>
            <div style={{
              width: 140,
              height: 140,
              background: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <div style={{ fontSize: '0.4em', fontWeight: 700 }}>
                {analytics?.sentiment?.avg_sentiment ?
                  (analytics.sentiment.avg_sentiment * 100).toFixed(0) :
                  'N/A'
                }%
              </div>
              <div style={{ fontSize: '0.2em', color: 'var(--text-secondary)' }}>
                Avg Score
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Team Performance ({team.length} Telecallers)</h2>
          <button className="btn btn-primary btn-sm">
            Export Report
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Telecaller</th>
              <th>Status</th>
              <th>Calls Today</th>
              <th>Active Call</th>
              <th>Conversions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {team.map(member => (
              <tr key={member.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                      src={member.avatar_url}
                      alt={member.name}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>{member.name}</div>
                      <div style={{ fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                        {member.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${
                    member.status === 'on_call' ? 'badge-success' :
                    member.status === 'available' ? 'badge-info' :
                    member.status === 'break' ? 'badge-warning' :
                    'badge-neutral'
                  }`}>
                    {member.status === 'on_call' && '📞 '}
                    {member.status === 'available' && '✅ '}
                    {member.status === 'break' && '☕ '}
                    {member.status === 'offline' && '🔴 '}
                    {member.status}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: '1.2em' }}>
                    {member.calls_today || 0}
                  </div>
                </td>
                <td>
                  {member.active_calls > 0 ? (
                    <div className="pulse" style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700
                    }}>
                      ●
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>—</span>
                  )}
                </td>
                <td>
                  <div style={{
                    background: member.conversions_today > 0 ? '#d1fae5' : '#f3f4f6',
                    color: member.conversions_today > 0 ? '#065f46' : '#6b7280',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    display: 'inline-block',
                    fontWeight: 600
                  }}>
                    {member.conversions_today || 0}
                  </div>
                </td>
                <td>
                  <button className="btn btn-sm" style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)'
                  }}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
