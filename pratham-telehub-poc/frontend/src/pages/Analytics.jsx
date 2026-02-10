import React from 'react';

export default function Analytics() {
  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#fff' }}>📈 Analytics</h1>
      <p style={{ color: '#888', marginBottom: '32px' }}>Performance insights and trends</p>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {[
          { label: 'Total Calls', value: '2,847', change: '+12%', trend: 'up' },
          { label: 'Conversion Rate', value: '18.3%', change: '+3.2%', trend: 'up' },
          { label: 'Avg Call Duration', value: '8m 42s', change: '-1m', trend: 'down' },
          { label: 'Customer Satisfaction', value: '4.6/5', change: '+0.3', trend: 'up' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '8px' }}>{stat.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: '0.85rem',
              color: stat.trend === 'up' ? '#4ade80' : '#f87171',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>{stat.trend === 'up' ? '↗' : '↘'}</span>
              <span>{stat.change} vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '24px',
          minHeight: '300px'
        }}>
          <h3 style={{ color: '#fff', marginBottom: '16px' }}>📊 Calls by Hour</h3>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '8px',
            height: '200px',
            padding: '20px 0'
          }}>
            {[30, 45, 60, 80, 95, 85, 70, 60, 50, 40, 30, 25].map((height, i) => (
              <div key={i} style={{
                flex: 1,
                background: 'linear-gradient(to top, #667eea, #764ba2)',
                height: `${height}%`,
                borderRadius: '4px 4px 0 0',
                opacity: 0.8
              }} />
            ))}
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: '#666',
            fontSize: '0.75rem',
            marginTop: '8px'
          }}>
            <span>9 AM</span>
            <span>12 PM</span>
            <span>3 PM</span>
            <span>6 PM</span>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{ color: '#fff', marginBottom: '16px' }}>🎯 Conversion Funnel</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
            {[
              { stage: 'Total Calls', value: 2847, percent: 100 },
              { stage: 'Qualified Leads', value: 1423, percent: 50 },
              { stage: 'Interested', value: 854, percent: 30 },
              { stage: 'Converted', value: 521, percent: 18 }
            ].map((item, i) => (
              <div key={i}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  fontSize: '0.9rem'
                }}>
                  <span style={{ color: '#aaa' }}>{item.stage}</span>
                  <span style={{ color: '#fff', fontWeight: '600' }}>{item.value} ({item.percent}%)</span>
                </div>
                <div style={{
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${item.percent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
