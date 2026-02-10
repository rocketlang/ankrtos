import React from 'react';

export default function Team() {
  const teamMembers = [
    { id: 1, name: 'Priya Sharma', role: 'Senior Telecaller', calls: 127, conversions: 23, status: 'active', avatar: '👩‍💼' },
    { id: 2, name: 'Rahul Verma', role: 'Telecaller', calls: 98, conversions: 18, status: 'active', avatar: '👨‍💼' },
    { id: 3, name: 'Anjali Singh', role: 'Telecaller', calls: 112, conversions: 21, status: 'break', avatar: '👩‍💼' },
    { id: 4, name: 'Vikram Desai', role: 'Team Lead', calls: 156, conversions: 32, status: 'active', avatar: '👨‍💼' },
    { id: 5, name: 'Sneha Patel', role: 'Telecaller', calls: 89, conversions: 15, status: 'offline', avatar: '👩‍💼' },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#fff' }}>👥 Team</h1>
          <p style={{ color: '#888' }}>Manage your telecalling team</p>
        </div>
        <button style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: '#fff',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: 'pointer'
        }}>
          + Add Team Member
        </button>
      </div>

      {/* Team Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Members', value: '5', icon: '👥' },
          { label: 'Active Now', value: '3', icon: '🟢' },
          { label: 'On Break', value: '1', icon: '⏸️' },
          { label: 'Offline', value: '1', icon: '⚫' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ fontSize: '2rem' }}>{stat.icon}</div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#888' }}>{stat.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff' }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Team Members Table */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <th style={{ padding: '16px', textAlign: 'left', color: '#888', fontWeight: '600', fontSize: '0.85rem' }}>MEMBER</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#888', fontWeight: '600', fontSize: '0.85rem' }}>ROLE</th>
              <th style={{ padding: '16px', textAlign: 'center', color: '#888', fontWeight: '600', fontSize: '0.85rem' }}>CALLS TODAY</th>
              <th style={{ padding: '16px', textAlign: 'center', color: '#888', fontWeight: '600', fontSize: '0.85rem' }}>CONVERSIONS</th>
              <th style={{ padding: '16px', textAlign: 'center', color: '#888', fontWeight: '600', fontSize: '0.85rem' }}>STATUS</th>
              <th style={{ padding: '16px', textAlign: 'center', color: '#888', fontWeight: '600', fontSize: '0.85rem' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((member) => (
              <tr key={member.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '2rem' }}>{member.avatar}</div>
                    <span style={{ color: '#fff', fontWeight: '500' }}>{member.name}</span>
                  </div>
                </td>
                <td style={{ padding: '16px', color: '#aaa' }}>{member.role}</td>
                <td style={{ padding: '16px', textAlign: 'center', color: '#fff', fontWeight: '600' }}>{member.calls}</td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <span style={{
                    color: '#4ade80',
                    fontWeight: '600',
                    background: 'rgba(74, 222, 128, 0.1)',
                    padding: '4px 12px',
                    borderRadius: '12px'
                  }}>
                    {member.conversions}
                  </span>
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <span style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    background: member.status === 'active' ? 'rgba(74, 222, 128, 0.2)' :
                                member.status === 'break' ? 'rgba(251, 191, 36, 0.2)' :
                                'rgba(156, 163, 175, 0.2)',
                    color: member.status === 'active' ? '#4ade80' :
                           member.status === 'break' ? '#fbbf24' :
                           '#9ca3af'
                  }}>
                    {member.status}
                  </span>
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <button style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#aaa',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}>
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
