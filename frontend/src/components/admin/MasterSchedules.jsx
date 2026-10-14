import React from 'react';

export default function MasterSchedules({ appointments, onJoinMeeting }) {
  const activeSlots = appointments.filter((a) => a.status !== 'Resolved');

  return (
    <div>
      <div className="section-flex" style={{ marginBottom: '18px' }}>
        <div>
          <h2 style={{ fontSize: '20px' }}>Master Consultation Schedules &amp; CSR Allocations</h2>
          <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
            City-wide appointment slots with live 4-hour mode lock validation
          </div>
        </div>
        <span className="pill pill-info">{activeSlots.length} Active Slots</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Scheduled Time</th>
              <th>Token</th>
              <th>Citizen</th>
              <th>Sector</th>
              <th>Consultation Mode</th>
              <th>4h Lock Status</th>
              <th>Assigned Officer</th>
              <th>CSR Action</th>
            </tr>
          </thead>
          <tbody>
            {activeSlots.map((a) => (
              <tr key={a.token}>
                <td>
                  <strong>
                    {new Date(a.appointment_at).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </strong>
                </td>
                <td><span className="token-tag">{a.token}</span></td>
                <td>{a.user_name}</td>
                <td>{a.locality}</td>
                <td>{a.mode === 'online' ? '🌐 Online Video' : '🏢 Office Visit'}</td>
                <td>
                  {a.is_locked ? (
                    <span className="pill pill-warn">🔒 Locked (&lt; 4h)</span>
                  ) : (
                    <span className="pill pill-good">🔓 Unlocked</span>
                  )}
                </td>
                <td><strong>{a.assigned_staff || 'Unassigned'}</strong></td>
                <td>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                    onClick={() => onJoinMeeting && onJoinMeeting(a.token)}
                  >
                    🎥 Enter Room
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
