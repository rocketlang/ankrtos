import React, { useState } from 'react';

export default function Settings() {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    callReminders: true,
    dailyReports: true
  });

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#fff' }}>⚙️ Settings</h1>
      <p style={{ color: '#888', marginBottom: '32px' }}>Manage your account and preferences</p>

      {/* Profile Settings */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h2 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>👤</span> Profile Information
        </h2>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.9rem', marginBottom: '8px' }}>Full Name</label>
            <input
              type="text"
              defaultValue="Priya Sharma"
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#aaa', fontSize: '0.9rem', marginBottom: '8px' }}>Email</label>
              <input
                type="email"
                defaultValue="priya.sharma@pratham.org"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#aaa', fontSize: '0.9rem', marginBottom: '8px' }}>Phone</label>
              <input
                type="tel"
                defaultValue="+91 98765 43210"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          <button style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '8px',
            width: 'fit-content'
          }}>
            Save Changes
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h2 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔔</span> Notifications
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive notifications via email' },
            { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Get text message notifications' },
            { key: 'callReminders', label: 'Call Reminders', desc: 'Reminders for scheduled calls' },
            { key: 'dailyReports', label: 'Daily Reports', desc: 'Daily performance summary emails' }
          ].map((setting) => (
            <div key={setting.key} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px'
            }}>
              <div>
                <div style={{ color: '#fff', fontWeight: '500', marginBottom: '4px' }}>{setting.label}</div>
                <div style={{ color: '#888', fontSize: '0.85rem' }}>{setting.desc}</div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                <input
                  type="checkbox"
                  checked={notifications[setting.key]}
                  onChange={(e) => setNotifications({ ...notifications, [setting.key]: e.target.checked })}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: notifications[setting.key] ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255, 255, 255, 0.2)',
                  transition: '0.3s',
                  borderRadius: '28px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '20px',
                    width: '20px',
                    left: notifications[setting.key] ? '26px' : '4px',
                    bottom: '4px',
                    background: 'white',
                    transition: '0.3s',
                    borderRadius: '50%'
                  }} />
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* System Settings */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '24px'
      }}>
        <h2 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔧</span> System
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px'
          }}>
            <div>
              <div style={{ color: '#fff', fontWeight: '500' }}>Language</div>
              <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '2px' }}>English</div>
            </div>
            <button style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#aaa',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}>
              Change
            </button>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px'
          }}>
            <div>
              <div style={{ color: '#fff', fontWeight: '500' }}>Time Zone</div>
              <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '2px' }}>Asia/Kolkata (IST)</div>
            </div>
            <button style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#aaa',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}>
              Change
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
